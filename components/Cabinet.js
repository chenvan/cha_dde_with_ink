'use strict'

const React = require("react")
const { useState, useEffect, useContext, useRef, useCallback } = require("react")
const { Text } = require("ink")
const { setAdvise, fetchDDE, cancelAdvise } = require("../util/fetchDDE")
const { speakTwice } = require("../util/speak")
const Context = require('./Context')
const { logger } = require("../util/logger")
const { useInterval,  usePrevious } = require("../util/customHook")
const importJsx = require("import-jsx")

const State = importJsx('./State.js')

const CabinetOut = ({config, wbAccu, isCabMon}) => {
  const cabinetTotal = useRef(0)

  const [cabinetNr, setCabinetNr] = useState("")
  const [state, setState] = useState("停止")
  const {setIsErr, serverName, line} = useContext(Context)
  const [isMon, setIsMon] = useState(false)
  const mountedRef = useRef(false)

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

/*
  state:
  停止 -> 转柜 -> 寻柜 -> 监控 -> 停止
*/

const dirnMap = {
  "right": "右",
  "left": "左"
}

const inverseDirnMap = {
  "right": "左",
  "left": "右"
}

const CabinetIn = ({config}) => {

  // 可以写这里吗
  const inverseDirection = {
    "right": config.direction.left,
    "left": config.direction.right
  }

  const [state, setState] = useState("停止")
  const [cabinetNr, setCabinetNr] = useState("")
  const [shouldDIRN, setShouldDIRN] = useState()
  const {setIsErr, serverName, line} = useContext(Context)
  
  const timeIdRef = useRef({
    findSQ: undefined,
    carMove: undefined
  })

  const prevCabinetNr = usePrevious(cabinetNr)
  
  const SQHandlerFactory = poistion => { 

    return ({data}) => {
      let sqState = parseInt(data, 10)

      if(sqState === 1) {

        setShouldDIRN(poistion === "right" ? config.direction.left : config.direction.right)

        if (state === "寻柜") {
          setState("监控")
        } 
        
        if (state === "监控") {

          timeIdRef.current.carMove = setTimeout(() => {
            speakTwice(`${line} 分配车冲出${dirnMap[poistion]}限位`)
            logger.warn(`${line} 分配车冲出${dirnMap[poistion]}限位`)
            timeIdRef.current.carMove = undefined
          }, config.delay.carMove * 1000)
        }

        if(state === "寻柜" || state === "监控") {
          clearTimeout(timeIdRef.current.findSQ)

          timeIdRef.current.findSQ = setTimeout(() => {
            speakTwice(`${line} 分配车没有在规定时间找到${inverseDirnMap[poistion]}限位`)
            logger.warn(`${line} 分配车没有在规定时间找到${inverseDirnMap[poistion]}限位`)
          }, config.delay.findSQ * 1000)
        }
      }
    }
  }

  const setSQMon = async () => {

    // console.log(`setMon ${cabinetNr}`)
    // console.log(`${config[cabinetNr].right}`)
    // console.log(`${config[cabinetNr].left}`)

    await Promise.all([
      setAdvise(serverName, config[cabinetNr].right, SQHandlerFactory("right")),
      setAdvise(serverName, config[cabinetNr].left, SQHandlerFactory("left"))
    ])
  }

  const setCarMon = async () => {
    await setAdvise(serverName, config[cabinetNr].car, ({data}) => {
      let currentDIRN = parseInt(data, 10)
      
      if(state === "转柜" && (currentDIRN === config.direction.right || currentDIRN === config.direction.left)) {
        setState("寻柜")
      } else if(state === "监控") {
        if(timeIdRef.current.carMove && currentDIRN === shouldDIRN) {
          clearTimeout(timeIdRef.current.carMove)
          timeIdRef.current.carMove = undefined
        // } else if (currentDIRN === inverseDirection(shouldDIRN)) {
        //   // 这个会一直叫
        //   speakTwice(`${line} 分配车冲出${poistion}限位`)
        //   logger.warn(`${line} 分配车冲出${poistion}限位`)
        //   timeIdRef.current.carMove = undefined
        }
      }
    })
  }

  const cancelAllMon = async () => {
    // console.log(`cancel ${config[prevCabinetNr].right} ${config[prevCabinetNr].left}`)

    if(timeIdRef.current.carMove) {
      clearTimeout(timeIdRef.current.carMove)
      timeIdRef.current.carMove = undefined
    }

    if(timeIdRef.current.findSQ) {
      clearTimeout(timeIdRef.current.findSQ)
      timeIdRef.current.findSQ = undefined
    }

    await Promise.all([
      cancelAdvise(serverName, config[prevCabinetNr].left),
      cancelAdvise(serverName, config[prevCabinetNr].right),
      cancelAdvise(serverName, config[prevCabinetNr].car)
    ])
  }

  useEffect(() => {
    const init = async () => {
      try {
        await setAdvise(serverName, config["inputNr"].itemName, result => {
          setCabinetNr(parseInt(result.data, 10))
        })

      } catch (err) {
        setIsErr(true)
        logger.error(`${line} 建立进柜监听出错`, err)
      }
    }

    init()
  }, [])

  useEffect(() => {
    if(config.hasOwnProperty(cabinetNr)) {
      setState("转柜")
    } else { // 空柜似乎是0
      setState("停止")
    }
  }, [cabinetNr])


  useEffect(() => {
    if(state === "转柜") {
      setCarMon()
    }else if(state === "寻柜") {
      timeIdRef.current.findSQ = setTimeout(() => {
        speakTwice(`${line} 规定时间未完成寻柜`)
        logger.warn(`${line} 规定时间未完成寻柜`)
      }, config.delay.findSQ * 1000)

      setSQMon()
    } else if (state === "停止" && config.hasOwnProperty(prevCabinetNr)) {
      cancelAllMon() 
    }
  }, [state])


  return (
    <>
      <Text>
        <Text>{'入柜'}</Text>
        <State state={state} />
        <Text>{`: ${cabinetNr % 10}`}</Text>
      </Text>
      <Text>
        {`左: ${config.direction.left}, 右: ${config.direction.right}`}
      </Text>
      <Text>
        {`现在: ${shouldDIRN}`}
      </Text>
    </>
  )
}

module.exports = {
  CabinetOut,
  CabinetIn
}
