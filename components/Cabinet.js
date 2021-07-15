'use strict'

const React = require("react")
const { useState, useEffect, useContext, useRef } = require("react")
const { Text } = require("ink")
const { setAdvise, fetchDDE, cancelAdvise } = require("../util/fetchDDE")
const { speakTwice } = require("../util/speak")
const Context = require('./Context')
const { logger } = require("../util/logger")
const { useInterval, usePrevious } = require("../util/customHook")
const importJsx = require("import-jsx")

const State = importJsx('./State.js')

const CabinetOut = ({config, wbAccu, isCabMon}) => {
  const cabinetTotal = useRef(0)

  const [cabinetNr, setCabinetNr] = useState("")
  const [state, setState] = useState("停止")
  const {setIsErr, serverName, line} = useContext(Context)
  const [isMon, setIsMon] = useState(false)

  useEffect(() => {
    const init = async () => {
      try {
        await setAdvise(serverName, config["outputNr"].itemName, result => {
          setCabinetNr(parseInt(result.data, 10))
        })
      } catch (err) {
        setIsErr(true)
        logger.error(`${line} 建立出柜监听出错`, err)
      }
    }

    init()
  }, [])

  useEffect(() => {
    // 需要延时，否则烘丝转批是会报出柜没转高速
    let timeId = setTimeout(() => {
      setIsMon(isCabMon)
    }, 1000 * 5)

    return () => clearTimeout(timeId)
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
  两个出柜号
*/
const CabinetOut_ = ({config, wbAccu, isCabMon}) => {

  const [currCabNr, setCurrCabNr] = useState(0)
  const [currCabNrAlt, setCurrCabNrAlt] = useState(0)
  const [nextCabNr, setNextCabNr] = useState(0)
  const [nextCabNrAlt, setNextCabNrAlt] = useState(0)
  const {setIsErr, serverName, line} = useContext(Context)
  const mountedRef = useRef(false)

  useEffect(() => {
    const init = async () => {
      try {
        // mountedRef.current = true 
        await Promise.all([
          setAdvise(serverName, config["outputNr_"].curr, result => {
            setCurrCabNr(parseInt(result.data, 10))
          }),
          setAdvise(serverName, config["outputNr_"].currAlt, result => {
            setCurrCabNrAlt(parseInt(result.data, 10))
          }),
          setAdvise(serverName, config["outputNr_"].next, result => {
            setNextCabNr(parseInt(result.data, 10))
          }),
          setAdvise(serverName, config["outputNr_"].nextAlt, result => {
            setNextCabNrAlt(parseInt(result.data, 10))
          })
        ])
      } catch (err) {
        setIsErr(true)
        logger.error(`${line} 建立出柜监听出错`, err)
      }
    }

    init()
    // return () => mountedRef.current = false
  }, [])


  // // 引起报错
  // useEffect(() => {
  //   // 需要延时，否则烘丝转批是会报出柜没转高速
  //   setTimeout(() => {
  //     if(mountedRef.current) {
  //       setIsMon(isCabMon)
  //     }
  //   }, 1000 * 5)
  // }, [isCabMon])

  // 半柜电眼的监控
  return (
    <>
      { 
        config.func.isHalfEyeMon && config.hasOwnProperty(currCabNr) && (
          <HalfEyeMon 
            key={currCabNr}
            config={config[currCabNr]}
            wbAccu={wbAccu}
          />
        )
      }
      {
        config.func.isFreqMon && (
          <>
            { 
              config.hasOwnProperty(currCabNr) && (
                <OutputFreq 
                  key={currCabNr}
                  config={config[currCabNr]}
                />
              )
            }
            {
              config.hasOwnProperty(currCabNrAlt) && (
                <OutputFreq 
                  key={currCabNrAlt}
                  config={config[currCabNrAlt]}
                />
              )
            }
          </>
        )
      }
      {
        config.func.isDeadLineMon && (
          <>
            {
              config.hasOwnProperty(nextCabNr) && (
                <DeadLineMon 
                  key={nextCabNr}
                  config={config[nextCabNr]}
                />
              )
            }
            {
              config.hasOwnProperty(nextCabNrAlt) && (
                <DeadLineMon 
                  key={nextCabNrAlt}
                  config={config[nextCabNrAlt]}
                />
              )
            }
          </>
        )
      }
    </>
  )
}

const DeadLineMon = ({config}) => {

}


const OutputFreq = ({config}) => {

}

const HalfEyeMon = ({config, wbAccu}) => {
  
  return (
    <>
      <Text></Text>
    </>
  )
}


const CabinetIn = ({config}) => {

  const [cabinetNr, setCabinetNr] = useState(0)
  const [cabInMode, setCabInMode] = useState(0)
  const [initFindSQTimeFac, setInitFindSQTimeFac] = useState(10)

  const {setIsErr, serverName, line} = useContext(Context)
  const prevCabNr = usePrevious(cabinetNr, value => config.hasOwnProperty(value))

  useEffect(() => {
    const init = async () => {
      try {
        
        await Promise.all([
          setAdvise(serverName, config["inputNr"].itemName, ({data}) => setCabinetNr(parseInt(data, 10))),
        
        ])
      } catch (err) {
        setIsErr(true)
        logger.error(`${line} 建立进柜监听出错`, err)
      }
    }

    init()
  }, [])

  useEffect(() => {
    if(config.hasOwnProperty(cabinetNr)) {
      if(prevCabNr !== undefined) {
        setInitFindSQTimeFac(Math.abs(Math.ceil(cabinetNr / 2) - Math.ceil(prevCabNr / 2)) + 1)
      } else {
        setInitFindSQTimeFac(10)
      }
    }
  }, [cabinetNr])

  return (
    <>
      <Text>
        <Text>{'入柜'}</Text>
        <Text>{`: ${cabinetNr % 10}`}</Text>
      </Text>
      {
        config.hasOwnProperty(cabinetNr) && (
          <SupplyCar 
            key={cabinetNr}
            itemNames={config[cabinetNr]} 
            delay={config.delay} 
            direction={config.direction} 
            initFindSQTimeFac={initFindSQTimeFac}
          />
        )
      }
    </>
  )
}

/*
  state:
  停止 -> 寻柜 -> 监控
*/
const SupplyCar = ({itemNames, delay, direction, initFindSQTimeFac}) => {
  const [state, setState] = useState("停止")
  const [rSQ, setRSQ] = useState(0)
  const [lSQ, setLSQ] = useState(0)
  const [currentDIRN, setCurrentDIRN] = useState(0)
  const [shouldDIRN, setShouldDIRN] = useState()
  const {setIsErr, serverName, line} = useContext(Context)
  const [findSQTime, setFindSQTime] = useState(0)
  const [carMoveTime, setCarMoveTime] = useState(0)
  const [findSQMaxTime, setFindSQMaxTime] = useState(0)
  const [carMoveMaxTime, setCarMoveMaxTime] = useState(0)
  const [isWarned, setIsWarned] = useState(false)

  const invDIRNRef = useRef({
    [direction.right]: direction.left,
    [direction.left]: direction.right
  })

  useEffect(() => {
    const init = async () => {
      try {
        await Promise.all([
          setAdvise(serverName, itemNames.right, ({data}) => setRSQ(parseInt(data, 10))),
          setAdvise(serverName, itemNames.left, ({data}) => setLSQ(parseInt(data, 10))),
          setAdvise(serverName, itemNames.car, ({data}) => setCurrentDIRN(parseInt(data, 10)))
        ])
        
      } catch (err) {
        setIsErr(true)
        logger.error(`${line} 建立布料车监听出错`, err)
      }
    }

    init()

    return () => {
      Promise.all([
        cancelAdvise(serverName, itemNames.left),
        cancelAdvise(serverName, itemNames.right),
        cancelAdvise(serverName, itemNames.car)
      ]).catch(err => {
        logger.error(err)
      })

      logger.info("supplyCar unmounted")
    }
  }, [])

  // 对分配车的监控
  useEffect(() => {
    let timeId
    
    logger.info(`${line} 车 ${state} ${currentDIRN}`)

    if(state === "停止" && (currentDIRN === direction.right || currentDIRN === direction.left)) {
      setState("寻柜")
    } else if(state === "监控") {
      if(currentDIRN === direction.stay) {
        // 用 stay 的上升沿触发 setTimeout
        timeId = setTimeout(() => {
          speakTwice(`${line} 分配车长时间停留`)
          logger.warn(`${line} 分配车长时间停留，未按规定${shouldDIRN === 1 ? "左" : "右"}行`)
        }, delay.carMove * 1000)

        setCarMoveTime(0) // 重置 carMove 计时
      } else if(!isWarned && currentDIRN === invDIRNRef.current[shouldDIRN]) { 
        // shouldDIRN 会先改变而 currDIRN 还没变， 所以会触发一次错误
        // 错误方向行走
        setIsWarned(true)
        speakTwice(`${line} 分配车反向行驶`)
        logger.warn(`${line} 分配车反向行驶, 应向${shouldDIRN}, 实际${currentDIRN}`)
      } else if(currentDIRN === shouldDIRN) {
        if(isWarned) { setIsWarned(false) }
        // 记录 carMove 最大时间
        if(carMoveTime > carMoveMaxTime) {
          setCarMoveMaxTime(carMoveTime)
        }
      }
    }
    
    return () => {
      if(timeId) clearTimeout(timeId)
    }
  }, [state, currentDIRN])

  // 对限位的监控
  useEffect(() => {
    let timeId
    
    logger.info(`${line} 限位 ${state} ${rSQ}(右) ${lSQ}(左)`)

    if(state === "寻柜" && (rSQ === 1 || lSQ === 1)) {
      setState("监控")
    } else if(state === "监控" && (rSQ === 0 && lSQ === 0)) {
      // 防止限位开关损坏使分配跑车无法感应到
      // 用 rSQ, lSQ 的下降沿触发 setTimeout
      timeId = setTimeout(() => {
        speakTwice(`${line} 分配车没有在规定时间找到限位`)
        logger.warn(`${line} 分配车没有在规定时间找到${shouldDIRN === direction.left ? "左" : "右"}限位`)
      }, delay.findSQ * 1000)

      setFindSQTime(0) // 重置 FindSQ 计时
    } else if(state === "监控" && (rSQ === 1 || lSQ === 1)) {
      setShouldDIRN(rSQ ? direction.left : direction.right)
      // 记录 findSQ 最大时间
      if(findSQTime > findSQMaxTime) {
        setFindSQMaxTime(findSQTime)
      }
    }
    
    return () => {
      // 用 rSQ, lSQ 的上升沿清掉 setTimeout
      if(timeId) clearTimeout(timeId)
    }
  }, [state, rSQ, lSQ]) // 不加 state 的话, 第一次碰到 SQ 只会把状态变成 监控，

  useEffect(() => {
    let timeId
    if(state === "寻柜") {
      logger.info(`init time factor: ${initFindSQTimeFac}`)
      timeId = setTimeout(() => {
        speakTwice(`${line} 规定时间未完成寻柜`)
        logger.warn(`${line} 规定时间未完成寻柜`)
      }, initFindSQTimeFac * delay.findSQ * 1000 / 8)
    }

    return () => {
      if(timeId) clearTimeout(timeId)
    }
  }, [state])

  // 计算时间
  useInterval(() => {
    setFindSQTime(prevConter => prevConter + 1)
    setCarMoveTime(prevConter => prevConter + 1)
  }, state === "监控" ? 1000 : null)


  return (
    <>
      <Text>
        <Text>{`布料车`}</Text>
        <State state={state} />
        <Text color={'#3465a4'}>{` ${findSQTime}(${findSQMaxTime})`}</Text>
        <Text color={'#3465a4'}>{` ${carMoveTime}(${carMoveMaxTime})`}</Text>
      </Text>
      <SupplyCarUI 
        config={direction}
        shouldDIRN={shouldDIRN}
        currDIRN={currentDIRN}
        rSQ={rSQ}
        lSQ={lSQ}
      />
    </>
  )
}

const SupplyCarUI = ({config, shouldDIRN, currDIRN, rSQ, lSQ}) => {
  const [shoudDirnUI, setShoudDirnUI] = useState("   ")
  const [currDirnUI, setCurrDirnUI] = useState("   ")

  useEffect(() => {
    if(shouldDIRN === config.left) {
      setShoudDirnUI("<--")
    } else if(shouldDIRN === config.right) {
      setShoudDirnUI("-->")
    } else {
      setShoudDirnUI("   ")
    }
  }, [shouldDIRN])

  useEffect(() => {
    if(currDIRN === config.left) {
      setCurrDirnUI("<--")
    } else if(currDIRN === config.right) {
      setCurrDirnUI("-->")
    } else {
      setCurrDirnUI("   ")
    }
  }, [currDIRN])

  return (
    <>
      <Text>{`L ${shoudDirnUI} R`}</Text>
      <Text>{`${lSQ} ${currDirnUI} ${rSQ}`}</Text>
    </>
  )
}

module.exports = {
  CabinetOut,
  CabinetIn
}
