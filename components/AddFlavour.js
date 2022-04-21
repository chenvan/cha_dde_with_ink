'use strict'

const config = require("../config/AddFlavour.json")

const React= require("react")
const importJsx = require('import-jsx')
const { useState, useEffect, useContext, useRef } = require("react")
const { setAdvise } = require("../util/fetchDDE")
const { fetchBrandName } = require("../util/fetchUtil")
const { MoistureMeter } = require("../util/checkParaUtil")
const { speakErr } = require("../util/speak")
const { logger } = require("../util/loggerHelper")
const Context = require('./Context')
const { Box, Text } = require('ink')
const { useInterval } = require("../util/customHook")

const { Device } = importJsx('./Device.js')
const WeightBell = importJsx('./WeightBell.js')
const State = importJsx('./State.js')

const AddFlavour = () => {

  const [state, setState] = useState("停止")
  const [id, setId] = useState("")
  const [brandName, setBrandName] = useState("")
  const {setIsErr, serverName, line} = useContext(Context)

  const moistureMeter = useRef([])
  const minute = useRef({
    now: 0,
    last: undefined
  })

  useEffect(() => {

    const init = async () => {

      moistureMeter.current = [new MoistureMeter(line, "入口水分仪"), new MoistureMeter(line, "出口水分仪")]

      try {
        await Promise.all([
          setAdvise(serverName, config[line].id.itemName, result => {
            setId(result.data.slice(0, -3))
          }),
          setAdvise(serverName, "$Minute", result => {
            minute.current.now = parseInt(result.data, 10)
          }),
          moistureMeter.current[0].initM(serverName, config[line]["moistureMeter"]["入口水分仪"]),
          moistureMeter.current[1].initM(serverName, config[line]["moistureMeter"]["出口水分仪"])
        ])
      } catch (err) {
        setIsErr(true)
        speakErr(`${line} 建立监听出错`)
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
      logger.error(`${line}`, err)
    }
  }, state === "获取参数" ? 10 * 1000 : null)

  useInterval(() => {
    if(minute.current.now === minute.current.last) setIsErr(true)
    minute.current.last = minute.current.now
  }, 1000 * 60 * 2)

  useEffect(() => {
    if(state === "待机") { 
      setTimeout(() => {
        moistureMeter.current[0].check(brandName),
        moistureMeter.current[1].check(brandName)
      }, 10 * 1000)
    }
  }, [state, brandName])

  return (
    <>
      <Text>
        <Text>{`${line}`}</Text>
        <State state={state} />
      </Text>
      <Text>{`${brandName}.`}</Text>
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
