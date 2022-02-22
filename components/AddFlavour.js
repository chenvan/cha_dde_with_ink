'use strict'

const config = require("../config/AddFlavour.json")

const React= require("react")
const { useState, useEffect } = require("react")
const importJsx = require('import-jsx')
const { setAdvise, fetchDDE } = require("../util/fetchDDE")
const { Box, Text } = require('ink')

const Device = importJsx('./Device.js')
const Cabinet = importJsx('./Cabinet.js')
const WeightBell = importJsx('./WeightBell.js')
const ErrProvider = importJsx('./ErrorProvider.js')

/*
  状态: 停止 > (获得Id) > 待机 > (主秤实际流量大于0) > 监控 > (主秤流量等于0) > 停止监控 > (主秤实际流量大于0) > 监控
                                                                                    > (获得空Id) > 停止
*/

const AddFlavour = ({line}) => {

  const [state, setState] = useState("停止")
  const [id, setId] = useState("")
  const [brandName, setBrandName] = useState("")
  const [weightBellAccu, setWeightBellAccu] = useState(0)
  
  // const voiceTimeIdList = useRef([])

  useEffect(() => {
    const init = async () => {
      await setAdvise(config[line].serverName, config[line].id.itemName, result => {
        setId(result.data.slice(0, -3))
      })
    }

    init()
  }, [])

  useEffect(() => {
    let state = id ? "待机" : "停止" 
    setState(state)
  }, [id])

  useEffect(() => {
    const stateChangeEffect = async () => {
      if(state === "待机") {
        // 加载准备语音
  
        // 获取烟牌名字
        let brandName = await fetchDDE(config[line].serverName, config[line].brandName.itemName, config[line].brandName.valueType)
        setBrandName(brandName)
        
        // 检查各种参数
  
      } else if(state === "监控") {
        // 加载监控语音
      } else if(state === "停止监控") {
        // 清除监控语音
      } else if(state === "停止") {
        // 清除监控语音
      }
    }

    stateChangeEffect()

  }, [state])

  return (
    <Box key={line} flexDirection="column">
      <Text>{`${line}(${state})`}</Text>
      <ErrProvider serverName={config[line].serverName} >
        <WeightBell 
          line={line}
          serverName={config[line].serverName}
          name={"主秤"}
          config={config[line].mainWeightBell}
          parentState={state}
          setParentState={setState}
          setAccuFromParent={setWeightBellAccu}
        />
        <Cabinet 
          line={line}
          serverName={config[line].serverName}
          config={config[line].cabinet}
          weightBellAccu={weightBellAccu}
        />
        {
          Object.entries(config[line].device).map(
            ([deviceName, deviceConfig]) => {
              let data = {
                ...deviceConfig,
                "line": line,
                "serverName": config[line].serverName,
                "deviceName": deviceName,
                "parentState": state
              }

              return <Device {...data} />
            }
          )
        }
      </ErrProvider>
    </Box>
  )
}

module.exports = AddFlavour
