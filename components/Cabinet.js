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

/*
  两个出柜号
*/
const CabinetOut= ({config, wbAccu, isCabMon}) => {

  const [currCabNr, setCurrCabNr] = useState(0)
  // const [currCabNrAlt, setCurrCabNrAlt] = useState(0)
  // const [nextCabNr, setNextCabNr] = useState(0)
  // const [nextCabNrAlt, setNextCabNrAlt] = useState(0)
  const {setIsErr, serverName, line} = useContext(Context)
  const [isHalfEyeMon, setIsHalfEyeMon] = useState(false)

  useEffect(() => {
    // 需要延时，否则烘丝转批是会报出柜没转高速
    // 加料段, isCabMon 是 undefined
    let timeId = setTimeout(() => {
      setIsHalfEyeMon(isCabMon)
    }, 1000 * 5)

    return () => clearTimeout(timeId)
  }, [isCabMon])

  useEffect(() => {
    const init = async () => {
      try {
        await Promise.all([
          setAdvise(serverName, config["outputNr"].curr, result => {
            setCurrCabNr(parseInt(result.data, 10))
          }),
          // setAdvise(serverName, config["outputNr"].currAlt, result => {
          //   setCurrCabNrAlt(parseInt(result.data, 10))
          // }),
          // setAdvise(serverName, config["outputNr"].next, result => {
          //   setNextCabNr(parseInt(result.data, 10))
          // }),
          // setAdvise(serverName, config["outputNr"].nextAlt, result => {
          //   setNextCabNrAlt(parseInt(result.data, 10))
          // })
        ])
      } catch (err) {
        setIsErr(true)
        logger.error(`${line} 建立出柜监听出错`, err)
      }
    }

    init()
  }, [])


  // 半柜电眼的监控
  return (
    <>
      <Text>{`出柜: ${currCabNr % 10}`}</Text>
      { 
        config.hasOwnProperty(currCabNr) && isHalfEyeMon !== false && (
          <HalfEyeMon 
            key={currCabNr}
            config={config[currCabNr].halfEyeMon}
            wbAccu={wbAccu}
          />
        )
      }
      {/* {
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
      } */}
    </>
  )
}

const DeadLineMon = ({config}) => {

}


const OutputFreq = ({config}) => {

}

const HalfEyeMon = ({config, wbAccu}) => {
  
  const [halfEye, setHalfEye] = useState()
  const [total, setTotal] = useState()
  const [isChecking, setIsChecking] = useState(true)
  const {setIsErr, serverName, line} = useContext(Context)

  useEffect(() => {
    let init = async () => {
      try {
        await Promise.all([
          setAdvise(serverName, config.halfEye, ({data}) => setHalfEye(parseInt(data, 10))),
          setAdvise(serverName, config.total, ({data}) => setTotal(parseInt(data, 10)))
        ])
      } catch (err) {
        setIsErr(true)
        logger.error(`${line} 建立出柜监听出错`, err)
      }
    }
  
    init()

    return () => {
      Promise.all([
        cancelAdvise(serverName, config.halfEye),
        cancelAdvise(serverName, confg.total)
      ]).catch(err => {
        logger.error(err)
      })
    }
  }, [])

  useInterval(() => {
    if(total - wbAccu < config.diff) {
      setIsChecking(false)
      if(halfEye === 1) {
        speakTwice(`${line} 出柜未转高速`)
        logger.warn(`${line} 出柜未转高速`)
      }
    }
  }, isChecking && wbAccu > 10 ? 30 * 1000 : null)


  return (
    <Text>{`${total} ${halfEye}`}</Text>
  )
}


const CabinetIn = ({config}) => {

  const [cabNr, setCabNr] = useState(0)
  const [cabMode, setCabMode] = useState(0)
  const [initFindSQTimeFac, setInitFindSQTimeFac] = useState(10)

  const {setIsErr, serverName, line} = useContext(Context)
  const prevCabNr = usePrevious(cabNr, value => config.hasOwnProperty(value))

  useEffect(() => {
    const init = async () => {
      try {
        await Promise.all([
          setAdvise(serverName, config["info"].Nr, ({data}) => setCabNr(parseInt(data, 10))),
          setAdvise(serverName, config["info"].mode, ({data}) => setCabMode(parseInt(data, 10)))
        ])
      } catch (err) {
        setIsErr(true)
        logger.error(`${line} 建立进柜监听出错`, err)
      }
    }

    init()
  }, [])

  useEffect(() => {
    if(config.hasOwnProperty(cabNr)) {
      if(prevCabNr !== undefined) {
        setInitFindSQTimeFac(Math.abs(Math.ceil(cabNr / 2) - Math.ceil(prevCabNr / 2)) + 1)
      } else {
        setInitFindSQTimeFac(10)
      }
    }
  }, [cabNr])

  return (
    <>
      <Text>
        <Text>{`入柜: ${cabNr % 10} ${cabMode}`}</Text>
      </Text>
      {
        config.hasOwnProperty(cabNr) && (
          <SupplyCar 
            key={cabNr}
            itemNames={config[cabNr]} 
            delay={config.delay} 
            direction={config.direction} 
            initFindSQTimeFac={initFindSQTimeFac}
            inMode={cabMode / 100 }
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
const SupplyCar = ({itemNames, delay, direction, initFindSQTimeFac, inMode}) => {
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
      }).finally(() => {
        logger.info("supplyCar unmounted")
      })
    }
  }, [])

  // 对分配车的监控
  useEffect(() => {
    let timeId
    
    // logger.info(`${line} 车 ${state} ${currentDIRN}`)

    if(state === "停止" && (currentDIRN === direction.right || currentDIRN === direction.left)) {
      setState("寻柜")
    } else if(state === "监控") {
      if(currentDIRN === direction.stay) {
        // 用 stay 的上升沿触发 setTimeout
        timeId = setTimeout(() => {
          speakTwice(`${line} 分配车长时间停留`)
          logger.warn(`${line} 分配车长时间停留，未按规定${shouldDIRN === 1 ? "左" : "右"}行`)
        }, inMode * delay.carMove * 1000)

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
    
    // logger.info(`${line} 限位 ${state} ${rSQ}(右) ${lSQ}(左)`)

    if(state === "寻柜" && (rSQ === 1 || lSQ === 1)) {
      setState("监控")
    } else if(state === "监控" && (rSQ === 0 && lSQ === 0)) {
      // 防止限位开关损坏使分配跑车无法感应到
      // 用 rSQ, lSQ 的下降沿触发 setTimeout
      timeId = setTimeout(() => {
        speakTwice(`${line} 分配车没有在规定时间找到限位`)
        logger.warn(`${line} 分配车没有在规定时间找到${shouldDIRN === direction.left ? "左" : "右"}限位`)
      }, inMode * delay.findSQ * 1000)

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
