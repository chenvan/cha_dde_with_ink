'use strict'

const config = require("../config/Dryer.json")

const React= require("react")
const importJsx = require('import-jsx')
const { useState, useEffect, useContext, useRef } = require("react")
const { setAdvise } = require("../util/fetchDDE")
const { checkPara, MoistureMeter } = require("../util/checkParaUtil")
const { fetchBrandName } = require("../util/fetchUtil")
const { speakErr } = require("../util/speak")
const { logger } = require("../util/loggerHelper")
const Context = require('./Context')
const { Box, Text } = require('ink')
const { useInterval } = require("../util/customHook")

const { Device } = importJsx('./Device.js')
const WeightBell = importJsx('./WeightBell.js')

const Dryer = () => {

  const [state, setState] = useState("停止")
  const [idList, setIdList] = useState(["", ""])
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
        // 可能一个 id 就可以了
        await Promise.all([
          setAdvise(serverName, config[line].id["出柜"].itemName, result => {
            setIdList(prevIdList => [result.data.slice(0, -3), prevIdList[1]])
          }),
          setAdvise(serverName, config[line].id["烘丝"].itemName, result => {
            setIdList(prevIdList => [prevIdList[0], result.data.slice(0, -3)])
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
    if(idList[0] === idList[1] && idList[1] !== "") {
      setState("获取参数")
    } else if(idList[1] === "") {
      setState("停止")
    }
  }, [idList])

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
      // setTimeout(() => checkPara(line, serverName, config[line].para, brandName), 20 * 1000)
      console.log(moistureMeter.current[0])
      console.log(moistureMeter.current[1])
      setTimeout(() => {
        moistureMeter.current[0].check(brandName),
        moistureMeter.current[1].check(brandName)
      }, 10 * 1000)
    }
  }, [state, brandName])

  return (
    <>
      <Text>{`${line}(${state})`}</Text>
      <Text>{`${brandName}.`}</Text>
        <WeightBell 
          name={"主秤"}
          config={config[line].mainWeightBell}
          parentState={state}
          brandName={brandName}
          setParentState={setState}
          isCabMon={idList[1] !== "" && idList[0] === idList[1]}
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

module.exports = Dryer