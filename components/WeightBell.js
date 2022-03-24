'use strict'

const VoiceTips = require("../config/VoiceTips.json")
const Tail = require("../config/WeightBellTail.json")

const React = require("react")
const { useState, useEffect, useContext, useRef } = require("react")
const importJsx = require('import-jsx')
const { Text } = require("ink")

const { fetchDDE, setAdvise } = require("../util/fetchDDE")
const { logger } = require("../util/loggerHelper")
const { useInterval } = require("../util/customHook.js")
const { speakErr } = require("../util/speak")
const Context = require('./Context')
const { setReadyVoiceTips, setRunningVoiceTips, clearVoiceTips} = require("../util/voiceTipsUtil")

const { DeviceCtrlByWBAccu } = importJsx('./Device.js')
const Cabinet = importJsx('./Cabinet.js')

const WeightBell = ({name, config, parentState, brandName, setParentState}) => {
  
  const [state, setState] = useState("停止")
  const [setting, setSetting] = useState(0)
  const [real, setReal] = useState(0)
  const [accu, setAccu] = useState(0)
  const [cutoff, setCutoff] = useState(undefined)
  const {setIsErr, serverName, line} = useContext(Context)

  const [isWarning, setIsWarning] = useState(false)
  
  const readyTimeIdList = useRef([])
  const runningTimeIdList = useRef([])

  useEffect(() => {
    const init = async () => {
      try {
        await Promise.all([
          setAdvise(serverName, config.setting.itemName, result => {
            setSetting(parseInt(result.data, 10))
          }),
          setAdvise(serverName, config.real.itemName, result => {
            setReal(parseInt(result.data, 10))
          }),
          setAdvise(serverName, config.accu.itemName, result => {
            setAccu(parseInt(result.data, 10))
          })
        ])
      } catch (err) {
        setIsErr(true)
        speakErr(`${line} ${name} 建立监听出错`)
        logger.error(`${line} ${name}`, err)
      }
    }

    init()
  }, [])

  useInterval(async () => {
    if(cutoff !== undefined && accu >= cutoff) setState("停止监控")
    if(real === 0 ) setState("停止监控")
  }, state === "监控" ? 5 * 1000 : null)
  // 加香段做完时，膨丝秤，梗丝秤的设定流量会变成0，导致无法从监控变成停止监控状态


  useInterval(async () => {
    if(cutoff !== undefined) {
      if(accu < cutoff && real > 100) setState("监控")
    } else {
      if(real > 100) setState("监控")
    }
  }, state === "停止监控" ? 5 * 1000 : null)
  // 加香段做完时，膨丝秤，梗丝秤的设定流量会变成0，导致无法从监控

  useInterval(async () => {

    if(real > 100) setState("监控")
  
  }, state === "待机" ? 5 * 1000 : null)

  useEffect(() => {
    if(parentState === "待机" ) {
      setState("待机")
    }else if(parentState === "停止") {
      setState("停止")
    }
  }, [parentState])


  useEffect(() => {
    try {
      if (state === "待机") {
        
        // 秤的截止点  
        if(Tail[line][name]["cutoff"].hasOwnProperty(brandName)) {
          setCutoff(Tail[line][name]["cutoff"][brandName] * 0.98)
        } else {
          setCutoff(undefined)
        }
        
        if (setting !==0 && accu === 0 && setParentState !== undefined) {
          // 是主秤, 且累计量等于0, 加载准备语音 (这里暗含设定量不为0的先决条件)
          if(VoiceTips.hasOwnProperty(line)) readyTimeIdList.current = setReadyVoiceTips(VoiceTips[line].ready, brandName)
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
        if(setParentState !== undefined) {
          if(VoiceTips.hasOwnProperty(line)) runningTimeIdList.current = setRunningVoiceTips(VoiceTips[line].running, brandName, setting, accu)
          setParentState(state)
        }

        if(name.includes("薄片")) {
          setTimeout(() => {
            if(setting > 0 && real === 0) speakErr(`${line} ${name} 没有启动`) 
          }, 1000 * 90);
        }

      } else if(state === "停止") {
        
      }
    } catch (err) {
      logger.error(`${line} ${name}`, err)
    }
  }, [state])

  return (
    <>
      <Text backgroundColor={isWarning ? "#ff4500" : "black"}>{`${name}(${state}): 设定流量 / 实际流量 / 累计量: ${setting} / ${real} / ${accu}`}</Text>
      <Text color="blue">{`秤截止数: ${cutoff}`}</Text>
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
              "parentState": state,
              "cutoff": cutoff,
              "brandName": brandName,
              "currentAccu": accu,
              "offsetConfig": Tail[line][name]["offset"][deviceName]
            }

            return <DeviceCtrlByWBAccu key={deviceName} {...data} />
          }
        )
      }
    </>
  )
}



module.exports = WeightBell
