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

  const [cabinetNr, setCabinetNr] = useState("")
  const {setIsErr, serverName, line} = useContext(Context)

  useEffect(() => {
    const init = async () => {
      try {
        await setAdvise(serverName, config["inputNr"].itemName, ({data}) => setCabinetNr(parseInt(data, 10)))
      } catch (err) {
        setIsErr(true)
        logger.error(`${line} 建立进柜监听出错`, err)
      }
    }

    init()
  }, [])

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
const SupplyCar = ({itemNames, delay, direction}) => {
  const [state, setState] = useState("停止")
  const [rSQ, setRSQ] = useState(0)
  const [lSQ, setLSQ] = useState(0)
  const [currentDIRN, setCurrentDIRN] = useState()
  const [shouldDIRN, setShouldDIRN] = useState()
  const {setIsErr, serverName, line} = useContext(Context)
  
  const timeIdRef = useRef({
    findSQ: undefined,
    carMove: undefined
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
      clearTimeout(timeIdRef.current.findSQ)
      clearTimeout(timeIdRef.current.carMove)

      Promise.all([
        cancelAdvise(serverName, itemNames.left),
        cancelAdvise(serverName, itemNames.right),
        cancelAdvise(serverName, itemNames.car)
      ]).catch(err => {
        logger.error(err)
      })
    }
  }, [])


  useEffect(() => {
    
    if((state === "寻柜" || state === "监控") && (rSQ === 1 || lSQ === 1)) {
      if(state === "寻柜") setState("监控")
      
      // 有机会触发两次 car 的 settimeout
      if(timeIdRef.current.carMove == undefined) {
        // 防止分配跑车感应到限位开关后, 不停下或者停下来后, 一直不往回走
        timeIdRef.current.carMove = setTimeout(() => {
          speakTwice(`${line} 分配车未按规定${rSQ === 1 ? "左" : "右"}行`)
          logger.warn(`${line} 分配车未按规定${rSQ === 1 ? "左" : "右"}行`)
          timeIdRef.current.carMove = undefined
        }, delay.carMove * 1000)
      }
      
      setShouldDIRN(rSQ ? direction.left : direction.right)
      
      clearTimeout(timeIdRef.current.findSQ)

      // 防止限位开关损坏使分配跑车无法感应到
      timeIdRef.current.findSQ = setTimeout(() => {
        speakTwice(`${line} 分配跑车没有在规定时间找到${rSQ === 1 ? "左" : "右"}限位`)
        logger.warn(`${line} 分配跑车没有在规定时间找到${rSQ === 1 ? "左" : "右"}限位`)
      }, delay.findSQ * 1000)
    }
  }, [state, rSQ, lSQ])

  useEffect(() => {
    if(state === "停止" && (currentDIRN === direction.right || currentDIRN === direction.left)) {
      setState("寻柜")
    } else if(state === "监控") {
      if(timeIdRef.current.carMove && (currentDIRN === shouldDIRN)) {
        clearTimeout(timeIdRef.current.carMove)
        timeIdRef.current.carMove = undefined
      }
    }
  }, [state, currentDIRN, shouldDIRN])

  useEffect(() => {
    if(state === "寻柜") {
      timeIdRef.current.findSQ = setTimeout(() => {
        speakTwice(`${line} 规定时间未完成寻柜`)
        logger.warn(`${line} 规定时间未完成寻柜`)
      }, 2 * delay.findSQ * 1000)
    }
  }, [state])

  

  return (
    <>
      <Text>
        <Text>{`布料车`}</Text>
        <State state={state} />
      </Text>
      <Text>
        {`应行方向(左: ${direction.left}, 右: ${direction.right}): ${shouldDIRN}`}
      </Text>
      <Text>{`现行方向: ${currentDIRN}`}</Text>
    </>
  )
}

module.exports = {
  CabinetOut,
  CabinetIn
}
