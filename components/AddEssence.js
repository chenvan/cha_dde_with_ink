'use strict'

const config = require("../config/AddEssence.json")

const React= require("react")
const importJsx = require('import-jsx')
const { useState, useEffect, useContext, useRef } = require("react")
const { setAdvise, fetchBrandName } = require("../util/fetchDDE")
const { speakErr } = require("../util/speak")
const { logger } = require("../util/loggerHelper")
const Context = require('./Context')
const { Text } = require('ink')
const { useInterval } = require("../util/customHook")

const WeightBell = importJsx('./WeightBell.js')
const State = importJsx('./State.js')

const AddEssence = () => {
  const [state, setState] = useState("停止")
  const [id, setId] = useState("")
  const [brandName, setBrandName] = useState("")
  const {setIsErr, serverName, line} = useContext(Context)

  const minute = useRef({
    now: 0,
    last: undefined
  })

  useEffect(() => {
    const init = async () => {
      try {
        await Promise.all([
          setAdvise(serverName, config[line].id.itemName, result => {
            setId(result.data.slice(0, -3))
          }),
          // setAdvise(serverName, config[line].margin.itemName, result => {
          //   setMargin(parseInt(result.data, 10))
          // }),
          setAdvise(serverName, "$Minute", result => {
            minute.current.now = parseInt(result.data, 10)
          })
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
      setState("待机")
      logger.error(`${line} ${state}`, err)
    }
  }, state === "获取参数" ? 10 * 1000 : null)

  useInterval(() => {
    if(minute.current.now === minute.current.last) setIsErr(true)
    minute.current.last = minute.current.now
  }, 1000 * 60 * 2)

  return (
    <>
      <Text>
        <Text>{`${line}`}</Text>
        <State state={state} />
      </Text>
      <Text>{`${brandName}.`}</Text>
      <WeightBell 
        name={"主秤"}
        config={config[line].weightBell["主秤"]}
        parentState={state}
        brandName={brandName}
        setParentState={setState}
      />
      <WeightBell 
        name={"梗丝秤"}
        config={config[line].weightBell["梗丝秤"]}
        parentState={state}
        brandName={brandName}
      />
      <WeightBell 
        name={"膨丝秤"}
        config={config[line].weightBell["膨丝秤"]}
        parentState={state}
        brandName={brandName}
      />
    </>
  )
}

module.exports = AddEssence