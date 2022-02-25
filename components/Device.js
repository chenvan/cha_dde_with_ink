'use strict'

const { setAdvise } = require("../util/fetchDDE")
const { logger } = require("../util/loggerHelper")
const { speakWarning } = require("../util/speak")
const React = require("react")
const { useState, useEffect, useContext } = require("react")
const { Box, Text, useStdout } = require("ink")
const { useInterval } = require("../util/customHook.js")
const Context = require('./Context')

/*
设备状态: 停止 > (父状态为监控) > 监控 > (父状态为其他) > 停止
*/

const Device = ({deviceName, maxDuration, itemName, parentState, detectState}) => {

  const [state, setState] = useState("停止")
  const [deviceState, setDeviceState] = useState(null)
  const [lastUpdateMoment, setLastUpdateMoment] = useState(Date.now())
  const [duration, setDuration] = useState(0)
  const [isWarning, setIsWarning] = useState(false)
  const { serverName, line } = useContext(Context)
  const { write } = useStdout()

  // init state listen
  useEffect(() => {
    const init = async () => {
      await setAdvise(serverName, itemName, result => {
        setDeviceState(parseInt(result.data, 10))
        setLastUpdateMoment(Date.now())
      })
    }

    init()
  }, [])

  useEffect(() => {
    if(parentState === "监控") {
      if(detectState !== undefined) {
        let state = detectState === deviceState ? "监控" : "停止"
        setState(state)
      } else if(detectState === undefined) {
        setState("监控")
      }
    } else {
      if(state !== "停止") setState("停止")
    }
  }, [parentState, deviceState])

  // set interval to update duration
  useInterval(() => {
    setDuration((Date.now() - lastUpdateMoment) / 1000)
  }, state === "监控" ? 1000 : null)

  useEffect(() => {
    if(duration > maxDuration && !isWarning && state === "监控") {
      speakWarning(`${line} ${deviceName} 异常.`, write)
      setIsWarning(true)
    } else if(duration <= maxDuration || state === "停止") {
      if(isWarning) setIsWarning(false)
    }
    
  }, [duration, state]) // 需要把 state 放在这里吗 

  return (
    <Text color={isWarning? "red" : "white"}>
      <Text>{`${deviceName}(${state}) [${detectState !== undefined ?  detectState + " " : ""}${deviceState}]: `}</Text>
      {
        state === "监控" && 
            <TimeComparator maxDuration={maxDuration} duration={duration} isWarning={isWarning} />
      }
    </Text>
  )
}

const TimeComparator = ({maxDuration, duration, isWarning}) => {
  return (
    <>
      <Text>{maxDuration}</Text>
      {isWarning ? <Text>{" < "}</Text> : <Text>{" >= "}</Text>}
      <Text>{duration}</Text>
    </>
  )
}


module.exports = Device
