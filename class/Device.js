'use strict'

// const { makeObservable, action, reaction, override, autorun, runInAction, observable } = require("mobx")
// const { observer } = require("mobx-react")
const { setAdvise } = require("../util/fetchDDE")
const { logger } = require("../util/loggerHelper")
const { speakTwice } = require("../util/speak")
const { useState, useEffect } = require("react")
const { Box, Text } = require("ink")



const Device = (line, serverName, deviceName, maxDuration, itemName) => {

  const [state, setState] = useState(null)
  const [lastUpdateMoment, setLastUpdateMoment] = useState(Date.now())
  const [isTrigger, setIsTrigger] = useState(false)
  const [duration, setDuration] = useState(0)
  
  useEffect(() => {
    const init = async () => {
      await setAdvise(serverName, itemName, result => {
        setState(parseInt(result.data, 10))
        setLastUpdateMoment(Date.now())
      })
    }

    init()
  }, [])

  useEffect(() => {
    setDuration( (Date.now() - lastUpdateMoment) / 1000)
     
    if(duration > maxDuration && !isTrigger) {
      logger.error(`${line} ${deviceName} 状态长时间不变.`)
      speakTwice(`${line} ${deviceName} 状态长时间不变.`)
      setIsTrigger(true)
    } else if(duration <= maxDuration) {
      setIsTrigger(false)
    }

  })

  return (
    <Box>
      <Text>{`${deviceName}(${state}) ${maxDuration} ${duration}`}</Text>
    </Box>
  )
}

// const Device = observer(
//   class Device extends React.Component {
    
//     deviceState
//     lastUpdateMoment
//     isTrigger

//     constructor(props) {
//       super(props)

//       makeObservable(this, {
//         isTrigger: false,
//         deviceState: observable,
//         lastUpdateMoment: false,
//         checkState:false,
//         init: false,
//         reConnect: false
//       })
      
//       this.isTrigger = false
//     }

//     render() {
//       return (
//         <Box><Text>{this.props.deviceName}</Text></Box>
//       )
//     }

//     async init(serverName) {
//       // logger.info(`${this.deviceName}初始化`)
//       await setAdvise(serverName, this.itemName, action(state => {
//         // logger.info(`${this.deviceName} state change to ${state.data}.`)
//         this.deviceState = parseInt(state.data, 10)
//         this.lastUpdateMoment = Date.now()
//       }))
//     }

//     async reConnect(serverName) {
//       logger.info(`${this.deviceName}重启`)
//       await this.init(serverName)
//     }

//     checkState(now) {
//       let duration = (now - this.lastUpdateMoment) / 1000
//       // logger.info(`${this.line} ${this.deviceName}. 状态${this.deviceState}. 持续时间${duration}`)
//       if(duration > this.maxDuration && !this.isTrigger) {
//         logger.error(`${this.line} ${this.deviceName} 状态长时间不变.`)
//         speakTwice(`${this.line} ${this.deviceName} 状态长时间不变.`)
//         this.isTrigger = true
//       } else if(duration <= this.maxDuration) {
//         this.isTrigger = false
//       }
//     }
//   }
// )

// class DeviceWithSpecifyState extends Device {
//   specifyState

//   constructor(line, deviceName, maxDuration, itemName, specifyState) {
//     super(line, deviceName, maxDuration, itemName)
    
//     makeObservable(this, {
//       specifyState: false,
//       checkState: false
//     })

//     this.specifyState = specifyState
//   }

//   checkState(now) {
//     if(this.specifyState === this.deviceState) {
//       super.checkState(now)
//     }
//   }
// }

module.exports = {
  Device,
  // DeviceWithSpecifyState
}