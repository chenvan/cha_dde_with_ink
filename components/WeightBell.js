'use strict'

const VoiceTips = require("../config/VoiceTips.json")

const React = require("react")
const { useState, useEffect, useContext, useRef } = require("react")
const importJsx = require('import-jsx')
const { Text, useStdout } = require("ink")

const { fetchDDE } = require("../util/fetchDDE")
const { logger } = require("../util/loggerHelper")
const { useInterval } = require("../util/customHook.js")
const { speakErr } = require("../util/speak")
const Context = require('./Context')
const { setReadyVoiceTips, setRunningVoiceTips, clearVoiceTips} = require("../util/voiceTipsUtil")

const Device = importJsx('./Device.js')
const Cabinet = importJsx('./Cabinet.js')

const WeightBell = ({name, config, parentState, brandName, setParentState}) => {
  
  const [state, setState] = useState("停止")
  const [setting, setSetting] = useState(0)
  const [real, setReal] = useState(0)
  const [accu, setAccu] = useState(0)
  const {setIsErr, serverName, line} = useContext(Context)
  const { write } = useStdout()

  const [isWarning, setIsWarning] = useState(false)
  
  const readyTimeIdList = useRef([])
  const runningTimeIdList = useRef([])
  const warningCount = useRef(0)

  useInterval(async () => {
    try {
      // 需要第一时间更新累计值，否则会导致语音出问题
      const [setting, real, accu] =  await Promise.all([
        fetchDDE(serverName, config.setting.itemName, config.setting.valueType),
        fetchDDE(serverName, config.real.itemName, config.real.valueType),
        fetchDDE(serverName, config.accu.itemName, config.accu.valueType)
      ])
      
      setSetting(setting)
      setReal(real)
      setAccu(accu)
      setState("待机")

      //if(warningCount.current !== 0) warningCount.current = 0
    } catch (err) {
      // if(!isWarning) setIsWarning(true) 
     
      // if(warningCount.current++ > 3) {
      //   setIsErr(true)
      //   speakErr(`${line} ${name} 尝试3次获取设定流量与累积量均出错`, write)
      //   logger.error(`${line} ${name}`, err)
      //   warningCount.current = 0
      // } else {
      //   logger.info(`${line} ${name} 获取设定流量与累积量时出错`, err)
      // }
    }
  }, state === "获取参数" ? 10 * 1000 : null) 

  useInterval(async () => {
    try {
      const [real, accu] = await Promise.all([
        fetchDDE(serverName, config.real.itemName, config.real.valueType),
        fetchDDE(serverName, config.accu.itemName, config.accu.valueType)
      ])

      if(real > 100) {
        if(state === "待机" || state === "停止监控") setState("监控")
      } else if(real === 0 ) {
        if(state === "监控") setState("停止监控")
      } 

      setReal(real)
      setAccu(accu)

      if(warningCount.current !== 0) warningCount.current = 0

    } catch(err) {
      if(!isWarning) setIsWarning(true) 
     
      if(warningCount.current++ > 3) {
        setIsErr(true)
        speakErr(`${line} ${name} 尝试3次获取实际流量与累积量均出错`, write)
        logger.error(`${line} ${name}`, err)
        warningCount.current = 0
      } else {
        logger.info(`${line} ${name} 获取实际流量与累积量时出错`, err)
      }  
    }
  }, setting > 0 ? 30 * 1000 : null)


  useEffect(() => {
    if(parentState === "待机" ) {
      setState("获取参数")
    }else if(parentState === "停止") {
      setState("停止")
    }
  }, [parentState])


  useEffect(() => {
    try {
      // write(`${line}, ${name}, ${state}, ${setting}, ${real}, ${accu}\n`)

      if (state === "待机") {  
        if (setting !==0 && accu === 0 && setParentState !== undefined) {
          // 是主秤, 且累计量等于0, 加载准备语音 (这里暗含设定量不为0的先决条件)
          if(VoiceTips.hasOwnProperty(line)) {
            readyTimeIdList.current = setReadyVoiceTips(VoiceTips[line].ready, brandName, write)
          }
        } else if(setting === 0 || (setting !== 0 && real === 0 && accu > 0)) {
          // 秤的设定量为0时, 表示秤不需要监控
          // 秤有累积量, 设定量不为0, 但实际流量为0时, 表示断流
          setState("停止监控")
        } else if(setting !== 0 && real !== 0) {
          setState("监控")
        }
      } else if(state === "停止监控") {
        if(setParentState !== undefined) {
          runningTimeIdList.current = clearVoiceTips(runningTimeIdList.current)
          setParentState(state)
        }
      } else if(state === "监控") {
        if(setParentState !== undefined && VoiceTips.hasOwnProperty(line)) {
          runningTimeIdList.current = setRunningVoiceTips(VoiceTips[line].running, brandName, setting, accu, write)
          setParentState(state)
        }
      } else if(state === "停止") {
        setSetting(0)
      }
    } catch (err) {
      logger.error(`${line} ${name}`, err)
    }
  }, [state])

  return (
    <>
      <Text backgroundColor={isWarning ? "red" : "black"}>{`${name}(${state}): 设定流量 / 实际流量 / 累计量: ${setting} / ${real} / ${accu}`}</Text>
      {
        config.hasOwnProperty("cabinet") && (
          <Cabinet 
            config={config.cabinet}
            wbAccu={accu}
          /> 
        )
      }      
      {
        Object.entries(config.device).map(
          ([deviceName, deviceConfig]) => {
            let data = {
              ...deviceConfig,
              "deviceName": deviceName,
              "parentState": state
            }

            return <Device key={deviceName} {...data} />
          }
        )
      }
    </>
  )
}

module.exports = WeightBell
