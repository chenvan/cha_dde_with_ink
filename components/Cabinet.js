'use strict'

const React = require("react")
const { useState, useEffect, useContext, useRef } = require("react")
const { Text, useStdout } = require("ink")
const { setAdvise, fetchDDE } = require("../util/fetchDDE")
const { speakErr } = require("../util/speak")
const Context = require('./Context')
const { logger } = require("../util/loggerHelper")
const { useInterval } = require("../util/customHook")

const Cabinet = ({config, wbAccu}) => {
  const cabinetTotal = useRef(0)

  const [cabinetNr, setCabinetNr] = useState("")
  const [state, setState] = useState("停止")
  const {setIsErr, serverName, line} = useContext(Context)
  const { write } = useStdout()
  const [isWarning, setIsWarning] = useState(false)
  const warningCount = useRef(0)

  useEffect(() => {
    const init = async () => {
      try {
        await setAdvise(serverName, config["outputNr"].itemName, result => {
          setCabinetNr(parseInt(result.data, 10))
        })
      } catch (err) {
        setIsErr(true)
        speakErr(`${line} 建立出柜号监听的时候出现错误`, write)
        logger.error(`${line}`, err)
      }
    }

    init()
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

  useInterval(async () => {
    try {
      cabinetTotal.current = await fetchDDE(
        serverName,
        config[cabinetNr]["total"].itemName,
        config[cabinetNr]["total"].valueType
      )

      setState("监控")
      
      // 检查出柜频率
      
      if(warningCount.current !== 0) warningCount.current = 0

    } catch (err) {
      if(!isWarning) setIsWarning(true) 

      if(warningCount.current++ > 3) {
        setIsErr(true)
        speakErr(`${line} 出柜尝试3次获取总量出错`, write)
        logger.error(`${line}`, err)
        warningCount.current = 0
      } else {
        logger.info(`${line} 出柜获取总量出错`, err)
      }
    }
  }, state === "待机" ? 10 * 1000 : null)


  useEffect(() => {
    const checkHalfEye = async () => {
      if(state === "监控" && config.hasOwnProperty(cabinetNr) && cabinetTotal.current - wbAccu < config[cabinetNr].reference.diff) {
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
          logger.error(`${line}`, err)
        }
      }
    }

    checkHalfEye()

  }, [wbAccu, state, cabinetNr])


  return (
    <>
      <Text>{`出柜(${state}): ${cabinetNr % 10}`}</Text>
      <Text>{`${cabinetTotal.current} - ${wbAccu} = ${cabinetTotal.current - wbAccu}`}</Text>
    </>
  )
}

module.exports = Cabinet
