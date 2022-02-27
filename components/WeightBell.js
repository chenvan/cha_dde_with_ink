'use strict'

const VoiceTips = require("../config/VoiceTips.json")

const React = require("react")
const { useState, useEffect, useContext, useRef } = require("react")
const importJsx = require('import-jsx')
const { Text, useStdout } = require("ink")

const { fetchDDE } = require("../util/fetchDDE")
const { logger } = require("../util/loggerHelper")
const { useInterval } = require("../util/customHook.js")
const { speakWarning, speakErr } = require("../util/speak")
const Context = require('./Context')
const { setReadyVoiceTips, setRunningVoiceTips, clearVoiceTips} = require("../util/voiceTipsUtil")

const Device = importJsx('./Device.js')
const Cabinet = importJsx('./Cabinet.js')

/*
  秤的状态: 停止 > (父状态为待机) > 待机 > (实际流量大于0) > 监控 > (实际流量等于0) > 停止监控 > (实际流量大于 0) > 监控 
                                                                                       
                                                                                           > (父状态为停止) > 停止

  主秤与普通秤的区别
  主秤有 brandName 和 setParentState 

*/
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

  useInterval(async () => {
    try {
      const [real, accu] = await Promise.all([
        fetchDDE(serverName, config.real.itemName, config.real.valueType),
        fetchDDE(serverName, config.accu.itemName, config.accu.valueType)
      ])

      let diff = Math.abs(setting - real)
      if(state === "监控" && diff >= 100 && !isWarning) {
        speakWarning(`${line} ${name} 流量不稳定`, write)
        setIsWarning(true)
      } else if(diff < 100 && isWarning) {
        setIsWarning(false)
      }
      
      if(real > 100) {
        if(state === "待机" || state === "停止监控") setState("监控")
      } else if(real === 0 ) {
        if(state === "监控") setState("停止监控")
      } 

      setReal(real)
      setAccu(accu)

    } catch(err) {
      setIsErr(true)
      speakErr(`${line} ${name} 获取流量与累积量时出错`, write)
      logger.error(`${line} ${name} ${err}`)
    }

  }, setting > 0 ? 1000 : null)


  useEffect(() => {
    if(parentState === "待机" || parentState === "停止") {
      setState(parentState)
    }

  }, [parentState])


  useEffect(() => {
    const stateChangeEffect = async() => {
      try {
        if (state === "待机") {
          // 需要第一时间更新累计值，否则会导致语音出问题
          const [setting, accu] =  await Promise.all([
            fetchDDE(serverName, config.setting.itemName, config.setting.valueType),
            fetchDDE(serverName, config.accu.itemName, config.accu.valueType)
          ])
          
          setSetting(setting)
          setAccu(accu)

          if (accu === 0 && setParentState !== undefined) {
            readyTimeIdList.current = setReadyVoiceTips(VoiceTips[line].ready, brandName, write)
          } else if(accu > 0) {
            setState("停止监控")
          }
        } else if(state === "停止监控") {
          if(setParentState !== undefined) {
            runningTimeIdList.current = clearVoiceTips(runningTimeIdList.current)
            setParentState(state)
          }
        } else if(state === "监控") {
          if(setParentState !== undefined) {
            runningTimeIdList.current = setRunningVoiceTips(VoiceTips[line].running, brandName, setting, accu, write)
            setParentState(state)
          }
        } else if(state === "停止") {
          setSetting(0)
        }
      } catch(err) {
          setIsErr(true)
          speakErr(`${line} ${name} 状态变换时出现错误`, write)
          logger.error(`${line} ${name} ${err}`)
      }
    }

    stateChangeEffect()
  }, [state])

  return (
    <>
      <Text>{`${name}(${state}): 设定流量 / 实际流量 / 累计量: ${setting} / ${real} / ${accu}`}</Text>
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
