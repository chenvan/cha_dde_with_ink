'use strict'

const config = require("../config/AddFlavour.json")

const React= require("react")
const importJsx = require('import-jsx')
const { useState, useEffect } = require("react")
const { setAdvise, cancelAdvise } = require("../util/fetchDDE")
const { fetchBrandName } = require("../util/fetchUtil")
const { checkPara } = require("../util/checkParaUtil")
const { Box, Text, useStdout } = require('ink')

const Device = importJsx('./Device.js')
const WeightBell = importJsx('./WeightBell.js')
const Provider = importJsx('./Provider.js')

/*
  状态: 停止 > (获得Id) > 待机 > (主秤实际流量大于0) > 监控 > (主秤流量等于0) > 停止监控 > (主秤实际流量大于0) > 监控
                              > (主秤累计流量大于0) > 停止监控                                                       > (获得空Id) > 停止
*/

const AddFlavour = ({line}) => {

  const [state, setState] = useState("停止")
  const [isErr, setIsErr] = useState(false)
  const [id, setId] = useState("")
  const [brandName, setBrandName] = useState("")
  const { write } = useStdout()

  useEffect(() => {
    const init = async () => {
      await setAdvise(config[line].serverName, config[line].id.itemName, result => {
        setId(result.data.slice(0, -3))
      })
    }

    init()

    return () => cancelAdvise(config[line].serverName, config[line].id.itemName)
  }, [])

  useEffect(() => {
    // 确保 brandName 在 转待机前先获取, 这样主秤转待机时确保已经有牌号
    const idChange = async () => {
      try {
        if(id !== "") {
          let brandName = await fetchBrandName(config[line].serverName, config[line].brandName.itemName, config[line].brandName.valueType)
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
          await checkPara(line, config[line].serverName, config[line].para)
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
    <Box key={line} flexDirection="column" margin={1} padding={1} borderStyle="single" width="50%">
      <Text>{`${line}(${state})`}</Text>
      <Text>{brandName}</Text>
      <Provider serverName={config[line].serverName} line={line} isErr={isErr} setIsErr={setIsErr}>
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
      </Provider>
    </Box>
  )
}

module.exports = AddFlavour
