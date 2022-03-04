'use strict'

const config = require("../config/AddWater.json")

const React= require("react")
const { useState, useEffect, useRef, useContext } = require("react")
const importJsx = require('import-jsx')
const { setAdvise, cancelAdvise } = require("../util/fetchDDE")
const { fetchBrandName } = require("../util/fetchUtil")
const { Box, Text, useStdout } = require('ink')
const { speakErr } = require("../util/speak")
const { logger } = require("../util/loggerHelper")
const Context = require('./Context')

const Device = importJsx('./Device.js')
const WeightBell = importJsx('./WeightBell.js')

const AddWater = () => {
  const [state, setState] = useState("停止")
  const [idList, setIdList] = useState(["", ""])
  const [brandName, setBrandName] = useState("")
  const {setIsErr, serverName, line} = useContext(Context)
  const { write } = useStdout()

  useEffect(() => {
    const init = async () => {
      try {
        await Promise.all([
          setAdvise(serverName, config[line].id["回潮"].itemName, result => {
            setIdList(prevIdList => [result.data.slice(0, -3), prevIdList[1]])
          }),
          setAdvise(serverName, config[line].id["除杂"].itemName, result => {
            setIdList(prevIdList => [prevIdList[0], result.data.slice(0, -3)])
          })
        ])
      } catch (err) {
        setIsErr(true)
        speakErr(`${line} 建立批号监听的时候出现错误`, write)
        logger.error(`${line} ${err}`)
      }
    }

    init()

    return async () => {
      await Promise.all([
        cancelAdvise(serverName, config[line].id["回潮"].itemName),
        cancelAdvise(serverName, config[line].id["除杂"].itemName)
      ])
    } 
  }, [])

  useEffect(() => {
    // 确保 brandName 在 转待机前先获取, 这样主秤转待机时确保已经有牌号
    const idChange = async () => {
      try {
        if(idList[0] === idList[1] && idList[1] !== "") {
          let brandName = await fetchBrandName(serverName, config[line].brandName.itemName, config[line].brandName.valueType)
          setBrandName(brandName)
          setState("待机")
        } else if(idList[1] === "") {
          setState("停止")
        }
      } catch(err) {
        setIsErr(true)
        speakErr(`${line} 获取牌号时出现问题`, write)
        logger.error(`${line} ${err}`)
      }
    }

    idChange()
  }, [idList])

  useEffect(() => {
    const stateChangeEffect = async () => {
      try {
        if(state === "待机") {
          // 检查各种参数
    
        } else if(state === "监控") {
          
        } else if(state === "停止监控") {
 
        } else if(state === "停止") {
          
        }
      } catch(err) {
        setIsErr(true)
        speakErr(`${line} 状态转换出现问题`, write)
        logger.error(`${line} ${err}`)
      }
    }

    stateChangeEffect()

  }, [state])

  return (
    <>
      <Text>{`${line}(${state})`}</Text>
      <Text>{brandName}</Text>
      <WeightBell 
        name={"主秤"}
        config={config[line].weightBell["主秤"]}
        parentState={state}
        brandName={brandName}
        setParentState={setState}
      />
      <WeightBell 
        name={"薄片秤"}
        config={config[line].weightBell["薄片秤"]}
        parentState={state}
      />
      {
        Object.entries(config[line].device).map(
          ([deviceName, deviceConfig]) => {
            let data = {
              ...deviceConfig,
              "deviceName": deviceName,
              "parentState": state
            }

            return <Device key={deviceName} {...data} />
          }
        )
      }
    </>
  )
}

module.exports = AddWater