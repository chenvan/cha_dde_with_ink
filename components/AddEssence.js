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
        await setAdvise(serverName, config[line].id.itemName, result => {
          setId(result.data.slice(0, -3))
        })
      } catch (err) {
        setIsErr(true)
        speakErr(`${line} 建立批号监听的时候出现错误`, write)
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
      
    }
  }, state === "获取参数" ? 10 * 1000 : null)

  useInterval(async () => {
    // 暂存柜存量
    let currentMargin = await fetchDDE(serverName, config[line].margin.itemName, config[line].margin.valueType)
    
    if(currentMargin > 500 && !isWarning) {
      speakErr("叶丝暂存柜存料过多", write)
      setIsWarning(true)
    }else if(currentMargin < 450 && isWarning) {
      setIsWarning(false)
    }

    setMargin(currentMargin)
  }, state === "待机" || state === "停止监控" ? 10 * 1000 : null)

  useInterval(async () => {
    let currentMargin = await fetchDDE(serverName, config[line].margin.itemName, config[line].margin.valueType)
    
    if(currentMargin > 600 && !isWarning) {
      speakErr("叶丝暂存柜存料过多", write)
      setIsWarning(true)
    }else if(currentMargin < 50 && !isWarning) {
      speakErr("叶丝暂存柜存料过少", write)
      setIsWarning(true)
    }else if(currentMargin < 550 && isWarning) {
      setIsWarning(false)
    }else if(currentMargin > 100 && isWarning) {
      setIsWarning(false)
    } 

    setMargin(currentMargin)
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