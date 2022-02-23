'use strict'

const React = require("react")
const { useState, useEffect, useContext } = require("react")
const { Box, Text } = require("ink")
const { fetchDDE } = require("../util/fetchDDE")
const { logger } = require("../util/loggerHelper")
const { useInterval } = require("../util/customHook.js")
const importJsx = require('import-jsx')
const { speakTwice } = require("../util/speak")
const Context = require('./Context')

const Device = importJsx('./Device.js')

/*
  秤的状态: 停止 > (父状态为待机) > 待机 > (实际流量大于0) > 监控 > (实际流量等于0) > 停止监控 > (实际流量大于 0) > 监控 
                                                                                         > (父状态为停止) > 停止

  主秤与普通秤的区别
  主秤有 setParentState 和 setAccuFromParent

*/
const WeightBell = ({name, config, parentState, setParentState, setAccuFromParent, setSettingFromParent}) => {
  
  const [state, setState] = useState("停止")
  const [setting, setSetting] = useState(0)
  const [real, setReal] = useState(0)
  const [accu, setAccu] = useState(0)
  const {setIsErr, serverName, line} = useContext(Context)

  const [isWarning, setIsWarning] = useState(false)

  useInterval(async () => {
    const [real, accu] = await Promise.all([
      fetchDDE(serverName, config.real.itemName, config.real.valueType),
      fetchDDE(serverName, config.accu.itemName, config.accu.valueType)
    ])

    // if(state === "监控" && Math.abs(setting - real) > 100 && !isWarning) {
    //   logger.info(`${line} ${name} 流量不稳定`)
    //   speakTwice(`${line} ${name} 流量不稳定`)
    //   setIsWarning(true)
    // } else if(Math.abs(setting - real) < 100 && isWarning) {
    //   setIsWarning(false)
    // }
    
    if(real > 10) {
      if(state === "待机" || state === "停止监控") setState("监控")
    } else if(real === 0 ) {
      if(state === "监控") setState("停止监控")
    } 

    setReal(real)
    setAccu(accu)
    if(setAccuFromParent !== undefined) setAccuFromParent(accu)

  }, setting > 0 ? 1000 : null)


  useEffect(() => {
    if(parentState === "待机" || parentState === "停止") {
      setState(parentState)
    }

  }, [parentState])


  useEffect(() => {
    const stateChangeEffect = async() => {
      if (state === "待机") {
        const setting =  await fetchDDE(serverName, config.setting.itemName, config.setting.valueType)
        setSetting(setting)
        if(setSettingFromParent !== undefined) setSettingFromParent(setting)
      } else if(state === "停止") {
        setSetting(0)
        if(setSettingFromParent !== undefined) setSettingFromParent(0)
      } else if(state === "监控" || state === "停止监控") {
        if(setParentState !== undefined) setParentState(state)
      }
    }

    stateChangeEffect()
  }, [state])

  return (
    <>
      <Text>{`${name}(${state}): 设定流量 / 实际流量 / 累计量: ${setting} / ${real} / ${accu}`}</Text>
      <Device 
        {... config["electEye"]}
        parentState={state}
      />
    </>
  )
}

module.exports = WeightBell
