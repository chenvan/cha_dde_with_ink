'use strict'

const config = require("../config/AddFlavour.json")

const React= require("react")
const importJsx = require('import-jsx')
const { useState, useEffect, useContext } = require("react")
const { setAdvise } = require("../util/fetchDDE")
const { fetchBrandName } = require("../util/fetchUtil")
const { checkPara } = require("../util/checkParaUtil")
const Context = require('./Context')
const { Box, Text, useStdout } = require('ink')
const { useInterval } = require("../util/customHook")

const Device = importJsx('./Device.js')
const WeightBell = importJsx('./WeightBell.js')

const AddFlavour = () => {

  const [state, setState] = useState("停止")
  const [id, setId] = useState("")
  const [brandName, setBrandName] = useState("")
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
        logger.error(`${line} ${err}`)
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
  }, state === "获取参数" ? 10 * 1000 : null, true)

  useEffect(() => {
    if(state === "待机") { 
      setTimeout(() => checkPara(line, serverName, config[line].para), 2000)
    }
  }, [state])

  return (
    <>
      <Text>{`${line}(${state})`}</Text>
      <Text>{brandName}</Text>
        <WeightBell 
          name={"主秤"}
          config={config[line].mainWeightBell}
          parentState={state}
          brandName={brandName}
          setParentState={setState}
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

module.exports = AddFlavour
