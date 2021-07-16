'use strict'
const { setAdvise } = require("../util/fetchDDE")
const { speakTwice} = require("../util/speak")
const React = require("react")
const { useState, useEffect, useContext } = require("react")
const { Text } = require("ink")
const { useInterval } = require("../util/customHook.js")
const Context = require('./Context')
const { logger } = require("../util/logger.js")
const importJsx = require("import-jsx")

const State = importJsx('./State.js')

const Device = ({deviceName, maxDurationConfig, itemName, parentState, detectState, CutoffComp, wbSetting}) => {

  const [state, setState] = useState("停止")
  const [deviceState, setDeviceState] = useState(null)
  const [lastUpdateMoment, setLastUpdateMoment] = useState(Date.now())
  const [duration, setDuration] = useState(0)
  const [maxDuration, setMaxDuration] = useState(60)
  const [isWarning, setIsWarning] = useState(false)
  const { serverName, line, setIsErr } = useContext(Context)

  // init state listen
  useEffect(() => {
    const init = async () => {
      try {
        await setAdvise(serverName, itemName, result => {
          setDeviceState(parseInt(result.data, 10))
        })
      } catch (err) {
        setIsErr(true)
        logger.error(`${line} ${deviceName} 建立监听出错`, err)
      }
    }

    init()
  }, [])

  // useEffect(() => {
  //   // 如果没有指定的状态, 那么设备的状态就只由 parentState 决定
  //   // detectState 在组件创建时就已经确定, 即使转牌号后也一样
  //   if(detectState === undefined) {
  //     if(parentState === "监控") {
  //       setState("监控")
  //       setLastUpdateMoment(Date.now()) // 更新最后更新时间
  //     } else {
  //       setState("停止")
  //     }
  //   }
  // }, [parentState])

  useEffect(() => {
    // detectState 在组件创建时就已经确定, 即使转牌号后也一样
    if(detectState === undefined) { // 如果没有指定的状态, 那么设备的状态就只由 parentState 决定
      if(parentState === "监控") {
        if(state !== "监控") { 
          setState("监控")
        }
        // 每次 deviceState 的变化都要重新更新时间
        setLastUpdateMoment(Date.now()) // 更新最后更新时间
      } else {
        setState("停止")
      }
    } else { // 如果有指定的监控状态, 那么设备的状态由 parentState 和 deviceState 决定
      if(parentState === "监控") {
          // 当设备处在非指定监控状态时, 为停止
          let temp = detectState === deviceState ? "监控" : "停止"
          if(temp === "监控") setLastUpdateMoment(Date.now())
          setState(temp)
      } else {
        setState("停止")
      }
    }
  }, [deviceState, parentState])

  useEffect(() => {

  }, [wbSetting])

  useEffect(() => {
    if(state === "监控") {
      if(maxDurationConfig.hasOwnProperty(deviceState)) {
        if(maxDurationConfig[deviceState].hasOwnProperty("refDuration")) {
          let {refDuration, refSetting, refFactor} = maxDurationConfig[deviceState]
          let adjustMaxDuration = refDuration + (refSetting - wbSetting) / refFactor
          setMaxDuration(adjustMaxDuration)
        } else {
          setMaxDuration(maxDurationConfig[deviceState])
        }
      }
    }
  }, [deviceState, state])

  // 每隔一秒, 计算一次持续时间
  useInterval(() => {
    let tempDuration = (Date.now() - lastUpdateMoment) / 1000
    setDuration(tempDuration)

    if(tempDuration > maxDuration && !isWarning && state === "监控") {
      speakTwice(`${line} ${deviceName} 异常.`)
      logger.warn(`${line} ${deviceName} 异常.`)
      setIsWarning(true)
    } else if(tempDuration <= maxDuration || state === "停止") {
      if(isWarning) setIsWarning(false)
    }
  }, state === "监控" ? 1000 : null, true)

  return (
    <Text>
      <Text>{`${deviceName}`}</Text>
      <State state={state} />
      <DeviceState detectState={detectState}  deviceState={deviceState}/>
      {CutoffComp}
      <Text>{": "}</Text>
      {
        state === "监控" && 
            <TimeComparator backgroundColor={isWarning? "#cc0000" : "black"} maxDuration={maxDuration} duration={duration} isWarning={isWarning} />
      }
    </Text>
  )
}

const DeviceState = ({detectState, deviceState}) => {

  const [ color, setColor] = useState("$cc0000")

  useEffect(() => {
    if(detectState !== undefined) {
      if(detectState === deviceState) {
        setColor("#cc0000")
      } else {
        setColor("#d3d7cf")
      }
    }
  }, [deviceState])

  return (
    <>
      <Text color={color}>{` '${deviceState}`}</Text>
    </>
  )
}

const TimeComparator = ({maxDuration, duration, isWarning, backgroundColor}) => {
  return (
    <Text backgroundColor={backgroundColor}>
      {`${maxDuration}${isWarning ? " < " : " >= "}${duration}`}
    </Text>
  )
}

const StateCtrlByWbAccuSkin = ({brandName, wbAccu, parentState, cutoff, offsetConfig, children}) => {
  
  const [offset, setOffset] = useState(0)
  const [state, setState] = useState("停止")

  useEffect(() => {
    if(parentState === "待机" ) {
      if(offsetConfig !== undefined) {
        if(offsetConfig.hasOwnProperty(brandName)) {
          setOffset(offsetConfig[brandName])
        } else {
          setOffset(offsetConfig["default"])
        }
      }
    }
    
    setState(parentState) // state 与 parent state 的值应该是一样的

  }, [parentState])

  useEffect(() => {
    if(state !== "监控" || cutoff === undefined) return

    if(cutoff - offset < wbAccu && state === "监控") setState("停止监控")

  }, [wbAccu, state])

  return (
    <>
      {
        React.cloneElement(
          children, 
          {
            parentState: state, 
            CutoffComp: <Text color="#c4a000">{`${cutoff !== undefined ? " [" + (cutoff - offset) + "]" : ""}`}</Text>
          }
        )
      }
    </>
  )
}

const Margin = ({config, parentState, CutoffComp}) => {
  const [margin, setMargin] = useState(0)
  const [isWarning, setIsWarning] = useState(false)
  const {setIsErr, serverName, line} = useContext(Context)

  useEffect(() => {
    const init = async () => {
      try {
        await setAdvise(serverName, config, result => {
          setMargin(parseInt(result.data, 10))
        })
      } catch (err) {
        setIsErr(true)
        logger.error(`${line} 暂存柜余量监听出错`, err)
      }
    }
    init()
  }, [])

  useInterval(async () => {
    // 暂存柜存量
    try {
      // 转批，在待机阶段暂存柜存量会有一个假数, 应该是上一批的累积量
      if(margin > 500 && margin < 2500 && !isWarning) {
        speakTwice(`${line} 叶丝暂存柜存料过多`)
        logger.warn(`${line} 叶丝暂存柜存料过多`)
        setIsWarning(true)
      }else if(margin < 450 && isWarning) {
        setIsWarning(false)
      }
    } catch (err) {
      logger.error(`${line} margin`, err)
    }
  }, parentState === "待机" || parentState === "停止监控" ? 10 * 1000 : null)

  useInterval(async () => {
    try {
     
      if(margin > 600 && !isWarning) {
        speakTwice(`${line} 叶丝暂存柜存料过多`)
        logger.warn(`${line} 叶丝暂存柜存料过多`)
        setIsWarning(true)
      }else if(margin < 50 && !isWarning) {
        speakTwice(`${line} 叶丝暂存柜存料过少`)
        logger.warn(`${line} 叶丝暂存柜存料过少`)
        setIsWarning(true)
      }else if(margin < 550 && margin > 100 && isWarning) {
        setIsWarning(false)
      }
    } catch (err) {
      logger.error(`${line} margin`, err)
    }
  }, parentState === "监控" ? 10 * 1000 : null)

  return (
    <Text>
      <Text>{`暂存柜料量`}</Text>
      {CutoffComp}
      <Text>{`: ${margin} kg`}</Text>
    </Text>
  )
}

module.exports = {
  Device,
  Margin,
  StateCtrlByWbAccuSkin
}
