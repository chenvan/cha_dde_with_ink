'use strict'

const config = require("../config/AddEssence.json")

const React= require("react")
const importJsx = require('import-jsx')
const { useState, useEffect, useContext } = require("react")
const { setAdvise, fetchDDE } = require("../util/fetchDDE")
const { fetchBrandName } = require("../util/fetchUtil")
const { speakErr } = require("../util/speak")
const { logger } = require("../util/loggerHelper")
const Context = require('./Context')
const { Box, Text, useStdout } = require('ink')
const { useInterval } = require("../util/customHook")

const WeightBell = importJsx('./WeightBell.js')

const AddEssence = () => {
  const [state, setState] = useState("停止")
  const [id, setId] = useState("")
  const [brandName, setBrandName] = useState("")
  const [margin, setMargin] = useState(0)
  const [isWarning, setIsWarning] = useState(false)
  const {setIsErr, serverName, line} = useContext(Context)
  const { write } = useStdout()

  useEffect(() => {
    const init = async () => {
      try {
        await Promise.all([
          setAdvise(serverName, config[line].id.itemName, result => {
            setId(result.data.slice(0, -3))
          }),
          setAdvise(serverName, config[line].margin.itemName, result => {
            setMargin(parseInt(result.data, 10))
          })
        ])
      } catch (err) {
        setIsErr(true)
        speakErr(`${line} 建立监听出错`, write)
        logger.error(`${line}`, err)
      }
    }

    init()
  }, [])

  useEffect(() => {
    if(id !== "") {
      setState("获取参数")
    } else {
      setState("停止")
    }
  }, [id])


  useInterval(async () => {
    try {
      let brandName = await fetchBrandName(serverName, config[line].brandName.itemName, config[line].brandName.valueType)
      setBrandName(brandName)
      setState("待机")
    } catch (err) {
      setState("待机")
      logger.error(`${line} ${state}`, err)
    }
  }, state === "获取参数" ? 10 * 1000 : null)

  useInterval(async () => {
    // 暂存柜存量
    try {
      // let currentMargin = await fetchDDE(serverName, config[line].margin.itemName, config[line].margin.valueType)
    
      if(currentMargin > 500 && !isWarning) {
        speakErr("叶丝暂存柜存料过多", write)
        setIsWarning(true)
      }else if(currentMargin < 450 && isWarning) {
        setIsWarning(false)
      }

      // setMargin(currentMargin)
    } catch (err) {
      logger.error(`${line} ${state}`, err)
    }
  }, state === "待机" || state === "停止监控" ? 10 * 1000 : null)

  useInterval(async () => {
    try {
      // let currentMargin = await fetchDDE(serverName, config[line].margin.itemName, config[line].margin.valueType)
    
      if(currentMargin > 600 && !isWarning) {
        speakErr("叶丝暂存柜存料过多", write)
        setIsWarning(true)
      }else if(currentMargin < 50 && !isWarning) {
        speakErr("叶丝暂存柜存料过少", write)
        setIsWarning(true)
      }else if(currentMargin < 550 && currentMargin > 100 && isWarning) {
        setIsWarning(false)
      }

      // setMargin(currentMargin)
    } catch (err) {
      logger.error(`${line} ${state}`, err)
    }
    
  }, state === "监控" ? 10 * 1000 : null)



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
      <Text>{`暂存柜料量: ${margin} kg`}</Text>
      <WeightBell 
        name={"梗丝秤"}
        config={config[line].weightBell["梗丝秤"]}
        parentState={state}
      />
      <WeightBell 
        name={"膨丝秤"}
        config={config[line].weightBell["膨丝秤"]}
        parentState={state}
      />
    </>
  )
}

module.exports = AddEssence