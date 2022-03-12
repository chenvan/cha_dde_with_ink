'use strict'

const config = require("../config/AddEssence.json")

const React= require("react")
const importJsx = require('import-jsx')
const { useState, useEffect, useContext } = require("react")
const { setAdvise } = require("../util/fetchDDE")
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
  }, state === "待机" ? 10 * 1000 : null)



  return (
    <>
      <Text>{`${line}(${state})`}</Text>
      <Text>{brandName}</Text>
      <Text>{`暂存柜存量: ${margin}`}</Text>
    </>
  )
}

module.exports = AddEssence