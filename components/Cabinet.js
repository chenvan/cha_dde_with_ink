'use strict'

const React = require("react")
const { useState, useEffect, useContext, useRef } = require("react")
const { Box, Text } = require("ink")
const { setAdvise, fetchDDE } = require("../util/fetchDDE")
const { logger } = require("../util/loggerHelper")
const { speakTwice } = require("../util/speak")
const Context = require('./Context')

/*
出柜状态: 停止 > (出柜号) > 监控 > (检查半柜电眼为空) > 完成 > (出柜号为空) > 停止
                               > (检查半柜电眼为亮) > 未转高速                            
                               > (出柜号为空) > 停止
*/

const Cabinet = ({config, weightBellAccu}) => {
  const cabinetTotal = useRef(0)

  const [cabinetNr, setCabinetNr] = useState("")
  const [state, setState] = useState("停止")
  const {setIsErr, serverName, line} = useContext(Context)
  // const [isWarning, setIsWarning] = useState(false)

  useEffect(() => {
    const init = async () => {
      await setAdvise(serverName, config["outputNr"].itemName, result => {
        setCabinetNr(parseInt(result.data, 10))
      })
    }

    init()
  }, [])

  useEffect(() => {
    const updateCabinetInfo = async () => {

      if(cabinetNr === "") {
        if (state === "监控") {
          logger.error(`${line} 监控状态下, 出柜号发生更换`)
          speakTwice(`${line} 监控状态下, 出柜号发生更换`)
        }
        setState("停止")
      }

      if(config.hasOwnProperty(cabinetNr)) {
        cabinetTotal.current = await fetchDDE(
          serverName,
          config[cabinetNr]["total"].itemName,
          config[cabinetNr]["total"].valueType
        )
        
        setState("监控")
        // 检查出柜频率
      }
    }

    updateCabinetInfo()
    
  }, [cabinetNr])

  useEffect(() => {
    const checkHalfEyeState = async () => {
      if(state === "监控" && cabinetTotal.current - weightBellAccu < config[cabinetNr].reference.diff) {
      
        let halfEyeState = await fetchDDE(
          serverName, 
          config[cabinetNr]["halfEye"].itemName,
          config[cabinetNr]["halfEye"].valueType,
        )
        
        logger.info(`${line} halfEyeState: ${halfEyeState}`)
  
        if(halfEyeState === 1) {
          logger.error(`${line} 加料出柜未转高速`)
          speakTwice(`${line} 加料出柜未转高速`)
          setState("未转高速")
        } else {
          setState("完成")
        }
      }
    }
    
    checkHalfEyeState()
  }, [weightBellAccu])


  return (
    <>
      <Text>{`出柜(${state}): ${cabinetNr % 10}`}</Text>
      <Text>{`${cabinetTotal.current} - ${weightBellAccu} = ${cabinetTotal.current - weightBellAccu}`}</Text>
    </>
  )
}

module.exports = Cabinet
