'use strict'

const config = require("../config/AddWater.json")

const React= require("react")
const { useState, useEffect, useRef, useContext } = require("react")
const importJsx = require('import-jsx')
const { connectServer, setAdvise, fetchBrandName } = require("../util/fetchDDE")
const { Text } = require('ink')
const { logger } = require("../util/logger")
const Context = require('./Context')
const { useInterval } = require("../util/customHook")

const { Device } = importJsx('./Device.js')
const WeightBell = importJsx('./WeightBell.js')
const State = importJsx('./State.js')

const AddWater = () => {
  const [state, setState] = useState("停止")
  const [idList, setIdList] = useState(["", ""])
  const [isLoading, setIsLoading] = useState(true)
  const [brandName, setBrandName] = useState("")
  const {setIsErr, serverName, line} = useContext(Context)
  
  const minute = useRef({
    now: 0,
    last: undefined
  })

  useEffect(() => {
    const init = async () => {
      try {
        await connectServer(serverName)
        setIsLoading(false)
        await Promise.all([
          setAdvise(serverName, config[line].id["回潮"].itemName, result => {
            setIdList(prevIdList => [result.data.slice(0, -3), prevIdList[1]])
          }),
          setAdvise(serverName, config[line].id["除杂"].itemName, result => {
            setIdList(prevIdList => [prevIdList[0], result.data.slice(0, -3)])
          }),
          setAdvise(serverName, "$Minute", result => {
            minute.current.now = parseInt(result.data, 10)
          })
        ])
      } catch (err) {
        setIsErr(true)
        logger.error(`${line} 建立监听出错`, err)
        setIsLoading(true)
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
      // 九六回潮换批时候, 主秤获取 设定流量, 累积量 会失败, 导致 DDE Server 出现问题
      // 延迟进入 待机 状态
      setState("待机") 
    } catch (err) {
      logger.error(`${line} 获取参数出错`, err)
    }
  }, state === "获取参数" ? 1000 * 10 : null)

  useInterval(() => {
    if(minute.current.now === minute.current.last) {
      setIsErr(true)
      logger.error(`${line} 连接中断`)
    }
    minute.current.last = minute.current.now
  }, 1000 * 60 * 2)

  useEffect(() => {
    if(state === "待机") {
      // 检查各种参数
    } 
  }, [state])

  return (
    <>
      <Text>
        <Text>{`${line}`}</Text>
        <State state={state} />
      </Text>
      {
        isLoading ? <Text>Loading...</Text> : (
          <>
            <Text>{`${brandName}.`}</Text>
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
              brandName={brandName}
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
      
    </>
  )
}

module.exports = AddWater