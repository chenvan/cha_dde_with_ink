'use strict'

const React = require("react")
const { useState, useEffect, useContext, useRef } = require("react")
const { Text } = require("ink")
const { setAdvise, fetchDDE, cancelAdvise } = require("../util/fetchDDE")
const { speakTwice } = require("../util/speak")
const Context = require('./Context')
const { logger } = require("../util/logger")
const { useInterval } = require("../util/customHook")
const importJsx = require("import-jsx")

const State = importJsx('./State.js')

const Cabinet = ({config, wbAccu, isCabMon}) => {
  const cabinetTotal = useRef(0)

  const [cabinetNr, setCabinetNr] = useState("")
  const [state, setState] = useState("停止")
  const {setIsErr, serverName, line} = useContext(Context)
  const [isMon, setIsMon] = useState(false)
  const mountedRef = useRef(false)

  // const [isWarning, setIsWarning] = useState(false)

  useEffect(() => {
    const init = async () => {
      try {
        mountedRef.current = true
        await setAdvise(serverName, config["outputNr"].itemName, result => {
          setCabinetNr(parseInt(result.data, 10))
        })
      } catch (err) {
        setIsErr(true)
        logger.error(`${line} 建立出柜监听出错`, err)
      }
    }

    init()
    return () => mountedRef.current = false
  }, [])

  // 引起报错
  useEffect(() => {
    // 需要延时，否则烘丝转批是会报出柜没转高速
    setTimeout(() => {
      if(mountedRef.current) {
        setIsMon(isCabMon)
      }
    }, 1000 * 5)
  }, [isCabMon])

  useEffect(() => {
    if(cabinetNr === "") {
      if (state === "监控") {
        speakTwice(`${line} 监控状态下, 出柜号发生更换`)
        logger.warn(`${line} 监控状态下, 出柜号发生更换`)
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

    } catch (err) {
      logger.error(`${line} 出柜获取总量出错`, err)
    }
  }, state === "待机" ? 10 * 1000 : null)


  useEffect(() => {
    const checkHalfEye = async () => {
      if(state === "监控" && isMon !== false && config.hasOwnProperty(cabinetNr) && cabinetTotal.current - wbAccu < config[cabinetNr].reference.diff) {
        // console.log(`${wbAccu}, 出柜号: ${cabinetNr}, 状态: ${state}, 监控: ${isMon}`)
        try{
          let halfEyeState = await fetchDDE(
            serverName, 
            config[cabinetNr]["halfEye"].itemName,
            config[cabinetNr]["halfEye"].valueType,
          )
          
          logger.info(`${line} 半柜电眼状态: ${halfEyeState}`)
    
          if(halfEyeState === 1) {
            speakTwice(`${line} 出柜未转高速`)
            logger.warn(`${line} 出柜未转高速`)
            setState("未转高速")
          } else {
            setState("完成")
          }
        } catch(err) {
          setState("检查失败")
          speakTwice(`${line} 检查半柜电眼状态时出错, 请人工检查`)
          logger.error(`${line} 检查半柜电眼状态时出错`, err)
        }
      }
    }

    checkHalfEye()

  }, [wbAccu, state, cabinetNr, isMon])


  return (
    <>
      <Text>
        <Text>{`出柜`}</Text>
        <State state={state} />
        <Text>{`: ${cabinetNr % 10}`}</Text>
      </Text>
      <Text>{`${cabinetTotal.current} - ${wbAccu} = ${cabinetTotal.current - wbAccu}`}</Text>
    </>
  )
}

module.exports = Cabinet
