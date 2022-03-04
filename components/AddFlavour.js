'use strict'

const config = require("../config/AddFlavour.json")

const React= require("react")
const importJsx = require('import-jsx')
const { useState, useEffect, useContext } = require("react")
const { setAdvise, cancelAdvise } = require("../util/fetchDDE")
const { fetchBrandName } = require("../util/fetchUtil")
const { checkPara } = require("../util/checkParaUtil")
const Context = require('./Context')
const { Box, Text, useStdout } = require('ink')

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

    return async () => await cancelAdvise(serverName, config[line].id.itemName)
  }, [])

  useEffect(() => {
    // 确保 brandName 在 转待机前先获取, 这样主秤转待机时确保已经有牌号
    const idChange = async () => {
      try {
        if(id !== "") {
          let brandName = await fetchBrandName(serverName, config[line].brandName.itemName, config[line].brandName.valueType)
          setBrandName(brandName)
          setState("待机")
        } else {
          setState("停止")
        }
      } catch(err) {
        setIsErr(true)
        speakErr(`${line} 获取牌号时出现问题`, write)
        logger.error(`${line} ${err}`)
      }
    }
    
    idChange()
  }, [id])

  useEffect(() => {
    const stateChangeEffect = async () => {
      try {
        if(state === "待机") { 
          setTimeout(async () => await checkPara(line, serverName, config[line].para), 2000)
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
