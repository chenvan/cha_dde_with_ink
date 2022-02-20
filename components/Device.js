'use strict'

const { setAdvise } = require("../util/fetchDDE")
const { logger } = require("../util/loggerHelper")
const { speakTwice } = require("../util/speak")
const React = require("react")
const { useState, useEffect, useRef } = require("react")
const { Box, Text } = require("ink")
const { useInterval } = require("../util/customHook.js")

const Device = ({line, serverName, deviceName, maxDuration, itemName, parentState, detectState}) => {

  const isDetect = useRef(detectState !== undefined)

  const [state, setState] = useState(null)
  const [lastUpdateMoment, setLastUpdateMoment] = useState(Date.now())
  const [duration, setDuration] = useState(0)
  const [isWarning, setIsWarning] = useState(false)
  
  // init state listen
  useEffect(() => {
    const init = async () => {
      await setAdvise(serverName, itemName, result => {
        setState(parseInt(result.data, 10))
        setLastUpdateMoment(Date.now())
      })
    }

    init()
  }, [])

  // set interval to update duration
  useInterval(() => {
    setDuration((Date.now() - lastUpdateMoment) / 1000)
  }, parentState === "监控" ? 1000 : null)

  useEffect(() => {
    if((isDetect.current && detectState === state) || !isDetect.current) {
      if(duration > maxDuration && !isWarning && parentState === "监控") {
        logger.error(`${line} ${deviceName} 状态长时间不变.`)
        speakTwice(`${line} ${deviceName} 状态长时间不变.`)
        setIsWarning(true)
      } else if(duration <= maxDuration /*|| parentState !== "监控"*/) {
        // 在测试的时候可能逻辑不对, 但正常运行的时候应该没有问题
        setIsWarning(false)
      }
    }
  }, [duration, parentState])

  return (
    <Text color={isWarning? "red" : "black"}>
      <Text>{`${deviceName}(${state}${isDetect.current ? " " + detectState : ""}) `}</Text>
      {
        !(isDetect.current && detectState !== state) && parentState === "监控" && 
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