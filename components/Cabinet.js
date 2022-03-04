'use strict'

const React = require("react")
const { useState, useEffect, useContext, useRef } = require("react")
const { Text, useStdout } = require("ink")
const { setAdvise, fetchDDE, cancelAdvise } = require("../util/fetchDDE")
const { speakErr } = require("../util/speak")
const Context = require('./Context')
const { useInterval } = require("../util/customHook.js")
const { logger } = require("../util/loggerHelper")

/*
出柜状态: 停止 > (出柜号) > 监控 > (检查半柜电眼为空) > 完成 > (出柜号为空) > 停止
                               > (检查半柜电眼为亮) > 未转高速                            
                               > (出柜号为空) > 停止
*/

const Cabinet = ({config, wbAccu}) => {
  const cabinetTotal = useRef(0)

  const [cabinetNr, setCabinetNr] = useState("")
  const [state, setState] = useState("停止")
  const {setIsErr, serverName, line} = useContext(Context)
  const { write } = useStdout()

  useEffect(() => {
    const init = async () => {
      try {
        await setAdvise(serverName, config["outputNr"].itemName, result => {
          setCabinetNr(parseInt(result.data, 10))
        })
      } catch (err) {
        setIsErr(true)
        speakErr(`${line} 建立出柜号监听的时候出现错误`, write)
        logger.error(`${line} ${err}`)
      }
    }

    init()

    return () => cancelAdvise(serverName, config["outputNr"].itemName)
  }, [])

  useEffect(() => {
    if(cabinetNr === "") {
      if (state === "监控") {
        speakErr(`${line} 监控状态下, 出柜号发生更换`, write)
      }
      setState("停止")
    } else {
      if(config.hasOwnProperty(cabinetNr)) {
        setState("待机") 
      }
    }
  }, [cabinetNr])

  useEffect(() => {
    const stateChangeEffect = async () => {
      try {
        if(state === "待机") {
          cabinetTotal.current = await fetchDDE(
            serverName,
            config[cabinetNr]["total"].itemName,
            config[cabinetNr]["total"].valueType
          )

          setState("监控")

          // 检查出柜频率
        }
        
      } catch(err) {
        setIsErr(true)
        speakErr(`${line} 出柜 状态转换出现问题`, write)
        logger.error(`${line} ${err}`)
      }
    }

    stateChangeEffect()
  }, [state])

  useInterval(async () => {
    if(cabinetTotal.current - wbAccu < config[cabinetNr].reference.diff) {
      try{
        let halfEyeState = await fetchDDE(
          serverName, 
          config[cabinetNr]["halfEye"].itemName,
          config[cabinetNr]["halfEye"].valueType,
        )
        
        logger.info(`${line} 半柜电眼状态: ${halfEyeState}`)
  
        if(halfEyeState === 1) {
          speakErr(`${line} 加料出柜未转高速`, write)
          setState("未转高速")
        } else {
          setState("完成")
        }
      } catch(err) {
        setIsErr(true)
        speakErr(`${line} 检查半柜电眼状态是出错`, write)
        logger.error(`${line} ${err}`)
      }
    }
  }, state === "监控" ? 1000 : null)


  return (
    <>
      <Text>{`出柜(${state}): ${cabinetNr % 10}`}</Text>
      <Text>{`${cabinetTotal.current} - ${wbAccu} = ${cabinetTotal.current - wbAccu}`}</Text>
    </>
  )
}

module.exports = Cabinet
