'use strict'

const VoiceTips = require("../config/VoiceTips.json")
const Tail = require("../config/WeightBellTail.json")

const React = require("react")
const { useState, useEffect, useContext } = require("react")
const importJsx = require('import-jsx')
const { Text } = require("ink")

const { setAdvise } = require("../util/fetchDDE")
const { logger } = require("../util/logger")
const { useInterval } = require("../util/customHook.js")
const { speakTwice } = require("../util/speak")
const Context = require('./Context')
const { setReadyVoiceTips, setRunningVoiceTips, clearVoiceTips} = require("../util/voiceTipsUtil")

const { Device, StateCtrlByWbAccuSkin, Margin } = require("./Device")
const { CabinetOut } = importJsx('./Cabinet.js')
const State = importJsx('./State.js')

const WeightBell = ({name, config, parentState, brandName, setParentState, isCabMon}) => {
  
  const [state, setState] = useState("停止")
  const [setting, setSetting] = useState(0)
  const [real, setReal] = useState(0)
  const [accu, setAccu] = useState(0)
  const [cutoff, setCutoff] = useState()
  const {setIsErr, serverName, line} = useContext(Context)

  const [isWarning, setIsWarning] = useState(false)

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
        logger.error(`${line} ${name} 建立监听出错`, err)
      }
    }

    init()
  }, [])

  useInterval(async () => {
    // 秤累积量大于截止数
    if(cutoff !== undefined && accu >= cutoff) setState("停止监控")
    // 断流 -> 停止监控
    if(real === 0 ) setState("停止监控")

    // 检查流量波动
    // 没有 cutoff 的话, 最后尾料时肯定会报流量波动
    if(cutoff) { 
      if(Math.abs(setting - real) < 0.1 * setting && isWarning ) {
        setIsWarning(false)
      } else if (Math.abs(setting - real) >= 0.1 * setting && !isWarning ) {
        setIsWarning(true)
        speakTwice(`${line} ${name} 流量波动`)
        logger.warn(`${line} ${name} 流量波动`)
      }
    }

  }, state === "监控" ? 5 * 1000 : null)

  useInterval(async () => {
    if(cutoff !== undefined) {
      if(accu < cutoff && real > 100) setState("监控")
    } else {
      if(real > 100) setState("监控")
    }
  }, state === "停止监控" ? 5 * 1000 : null)

  useInterval(async () => {

    if(real > 100) {
      setState("监控")
    }
  }, state === "待机" ? 5 * 1000 : null)

  useEffect(() => {
    let timeId

    if(parentState === "待机" ) {
      setState("待机")
    }else if(parentState === "停止") {
      setState("停止")
    }else if(parentState === "监控" && name.includes("薄片") && setting > 0) { // 检查薄片秤是否启动
      timeId = setTimeout(() => {
        if(real === 0) {
          speakTwice(`${line} ${name} 没有启动`)
          logger.warn(`${line} ${name} 没有启动`)
        } 
      }, 1000 * 90)
    }

    return () => {
      if(timeId) clearTimeout(timeId)
    }
  }, [parentState])


  useEffect(() => {
    let timeIdList
    try {
      if (state === "待机") {
        // 秤的截止点  
        if(Tail[line][name]["cutoff"].hasOwnProperty(brandName)) {
          setCutoff(Tail[line][name]["cutoff"][brandName] * 0.98)
        } else {
          setCutoff(undefined)
        }
        
        if (setting !==0 && accu === 0 && setParentState !== undefined) {
          // 主秤, 且累计量等于0, 加载准备语音 (这里暗含设定量不为0的先决条件)
          if(VoiceTips.hasOwnProperty(line)) timeIdList = setReadyVoiceTips(VoiceTips[line].ready, brandName)
        } else if(setting === 0 || (setting !== 0 && real === 0 && accu > 0)) {
          // 秤的设定量为0时, 表示秤不需要监控
          // 秤有累积量, 设定量不为0, 但实际流量为0时, 表示断流
          setState("停止监控")
        } else if(setting !== 0 && real !== 0) {
          setState("监控")
        }

      } else if(state === "停止监控") {
        if(setParentState !== undefined) {
          // runningTimeIdList.current = clearVoiceTips(runningTimeIdList.current)
          setParentState(state)
        }
      } else if(state === "监控") {
        // 进入监控先把 warning 设为 true 先, 防止秤开始时就报流量波动
        setIsWarning(true)

        // 主秤
        if(setParentState !== undefined) {
          if(VoiceTips.hasOwnProperty(line)) timeIdList = setRunningVoiceTips(VoiceTips[line].running, brandName, setting, accu)
          setParentState(state)
        }
      }
    } catch (err) {
      logger.error(`${line} ${name} 状态转换出现错误`, err)
    }

    return () => {
      if(timeIdList !== undefined) { 
        clearVoiceTips(timeIdList)
      }
    }
  }, [state])

  return (
    <>
      <Text>
        <Text>{`${name}`}</Text>
        <State state={state} />
        <Text color="#c4a000">{` ${cutoff !== undefined ? "[" + cutoff + "]" : ""}`}</Text>
        <Text>{`: 设定 / 实际 / 累计: ${setting} / ${real} / ${accu}`}</Text>
      </Text>
      {
        config.hasOwnProperty("cabinetOut") && (
          <CabinetOut 
            config={config.cabinetOut}
            wbAccu={accu}
            isCabMon={isCabMon}
          /> 
        )
      }
      {
        config.hasOwnProperty("margin") && (
          <StateCtrlByWbAccuSkin
            brandName={brandName}
            parentState={state}
            wbAccu={accu}
            offsetConfig={Tail[line][name]["offset"]["margin"]}
            cutoff={cutoff}
            key={"margin"}
          >
            <Margin 
              config={config.margin}
            />
          </StateCtrlByWbAccuSkin>
        )
      }      
      {
        Object.entries(config.device).map(
          ([deviceName, deviceConfig]) => {
            let data = {
              ...deviceConfig,
              "deviceName": deviceName,
              "wbSetting": setting
            }

            return (
              <StateCtrlByWbAccuSkin
                brandName={brandName}
                parentState={state}
                wbAccu={accu}
                offsetConfig={Tail[line][name]["offset"][deviceName]}
                cutoff={cutoff}
                key={deviceName}
              >
                <Device 
                  {...data}
                />
              </StateCtrlByWbAccuSkin>
            )
          }
        )
      }
    </>
  )
}

module.exports = WeightBell
