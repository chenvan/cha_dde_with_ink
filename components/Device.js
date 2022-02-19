'use strict'

const { setAdvise } = require("../util/fetchDDE")
const { logger } = require("../util/loggerHelper")
const { speakTwice } = require("../util/speak")
const React = require("react")
const { useState, useEffect } = require("react")
const { Box, Text, Newline } = require("ink")
const { useInterval } = require("../util/customHook.js")

const Device = ({line, serverName, deviceName, maxDuration, itemName, parentState, detectState}) => {

  const [state, setState] = useState(null)
  const [lastUpdateMoment, setLastUpdateMoment] = useState(Date.now())
  const [isTrigger, setIsTrigger] = useState(false)
  const [duration, setDuration] = useState(0)
  
  useEffect(() => {
    const init = async () => {
      await setAdvise(serverName, itemName, result => {
        setState(parseInt(result.data, 10))
        setLastUpdateMoment(Date.now())
      })
    }

    init()
  }, [])

  useInterval(() => {
    setDuration((Date.now() - lastUpdateMoment) / 1000)
  }, parentState === "监控" ? 1000 : null)

  useEffect(() => {
    if((detectState !== undefined && detectState === state) || detectState === undefined) {
      if(duration > maxDuration && !isTrigger && parentState === "监控") {
        // logger.error(`${line} ${deviceName} 状态长时间不变.`)
        speakTwice(`${line} ${deviceName} 状态长时间不变.`)
        setIsTrigger(true)
      } else if(duration <= maxDuration) {
        setIsTrigger(false)
      }
    }
  }, [duration, parentState])

  return (
    <Text>
      <Text>{`${deviceName}(${state}${detectState !== undefined ? " " + detectState : ""}) `}</Text>
      {
        detectState === undefined ? 
            parentState === "监控" && <TimeComparator maxDuration={maxDuration} duration={duration} /> : 
            detectState === state && parentState === "监控" && <TimeComparator maxDuration={maxDuration} duration={duration} />
      }
    </Text>
  )
}

const TimeComparator = ({maxDuration, duration}) => {
  const [isWarning, setIsWarning] = useState(false)
  
  useEffect(() => {
    if(maxDuration >= duration) {
      setIsWarning(false)
    } else {
      setIsWarning(true)
    }
  }, [duration])

  return (
    <Text color={isWarning? "red" : "black"}>
      <Text>{maxDuration}</Text>
      {isWarning ? <Text>{" < "}</Text> : <Text>{" >= "}</Text>}
      <Text>{duration}</Text>
    </Text>
  )
}


module.exports = Device