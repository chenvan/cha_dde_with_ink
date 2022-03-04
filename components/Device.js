'use strict'

const { setAdvise, cancelAdvise } = require("../util/fetchDDE")
const { speakWarning, speakErr } = require("../util/speak")
const React = require("react")
const { useState, useEffect, useContext } = require("react")
const { Text, useStdout } = require("ink")
const { useInterval } = require("../util/customHook.js")
const Context = require('./Context')
const { logger } = require("../util/loggerHelper.js")

/*
设备状态: 停止 > (父状态为监控) > 监控 > (父状态为其他) > 停止
*/

const Device = ({deviceName, maxDuration, itemName, parentState, detectState}) => {

  const [state, setState] = useState("停止")
  const [deviceState, setDeviceState] = useState(null)
  const [lastUpdateMoment, setLastUpdateMoment] = useState(Date.now())
  const [duration, setDuration] = useState(0)
  const [isWarning, setIsWarning] = useState(false)
  const { serverName, line, setIsErr } = useContext(Context)
  const { write } = useStdout()

  // init state listen
  useEffect(() => {
    const init = async () => {
      try {
        await setAdvise(serverName, itemName, result => {
          setDeviceState(parseInt(result.data, 10))
          setLastUpdateMoment(Date.now())
        })
      } catch (err) {
        setIsErr(true)
        speakErr(`${line} 建立 ${deviceName} 监听的时候出现错误`, write)
        logger.error(`${line} ${err}`)
      }
    }

    init()

    return async () => await cancelAdvise(serverName, itemName)
  }, [])

  useEffect(() => {
    if(parentState === "监控") {
      if(detectState !== undefined) {
        let temp = detectState === deviceState ? "监控" : "停止"
        if(state !== temp) setState(temp)
      } else if(detectState === undefined) {
        if(state !== "监控") setState("监控")
      }
    } else {
      if(state !== "停止") setState("停止")
    }
  }, [parentState, deviceState])

  // set interval to update duration
  useInterval(() => {
    // 之前 计算duration 与 发声警告 分两处. 出的问题是 state 转为监控的时候, 会立刻发出警报
    // 现在这样合并似乎与之前也一样? 如果还是不行, 就一直监控吧
    let tempDuration = (Date.now() - lastUpdateMoment) / 1000
    setDuration(tempDuration)

    if(tempDuration > maxDuration && !isWarning && state === "监控") {
      speakWarning(`${line} ${deviceName} 异常.`, write)
      setIsWarning(true)
    } else if(tempDuration <= maxDuration || state === "停止") {
      if(isWarning) setIsWarning(false)
    }
  }, state === "监控" ? 1000 : null)

  return (
    <Text>
      <Text>{`${deviceName}(${state}) [${detectState !== undefined ?  detectState + " " : ""}${deviceState}]: `}</Text>
      {
        state === "监控" && 
            <TimeComparator color={isWarning? "red" : "white"} maxDuration={maxDuration} duration={duration} isWarning={isWarning} />
      }
    </Text>
  )
}

const TimeComparator = ({maxDuration, duration, isWarning, color}) => {
  return (
    <>
      <Text color={color} >{maxDuration}</Text>
      <Text color={color}>{ isWarning ? " < " : " >= "}</Text>
      <Text color={color}>{duration}</Text>
    </>
  )
}


module.exports = Device
