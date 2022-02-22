'use strict'
const config = require("../config/AddWater.json")

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
  状态: 停止 > (两Id一致且不为空) > 待机 > (主秤实际流量大于0) > 监控 > (主秤流量等于0) > 停止监控 > (主秤实际流量大于0) > 监控
                                                                                             > (两Id为空Id) > 停止
*/

const AddWater = ({line}) => {
  const [state, setState] = useState("停止")
  const [idList, setIdList] = useState(["", ""])
  const [brandName, setBrandName] = useState("")
  const [weightBellAccu, setWeightBellAccu] = useState(0)

  useEffect(() => {
    const init = async () => {
      await Promise.all([
        setAdvise(config[line].serverName, config[line].id["回潮"].itemName, result => {
          setIdList(prevIdList => [result.data.slice(0, -3), prevIdList[1]])
        }),
        setAdvise(config[line].serverName, config[line].id["除杂"].itemName, result => {
          setIdList(prevIdList => [prevIdList[0], result.data.slice(0, -3)])
        })
      ])
    }

    init()
  }, [])

  useEffect(() => {
    if(idList[0] === idList[1] && idList[0] !== "") {
      setState("待机")
    } else if(idList[1] === "") {
      // 这个逻辑可能不对
      if(state !== "停止") setState("停止")
    }
  }, [idList])

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
      <ErrProvider serverName={config[line].serverName}>
        <WeightBell 
          line={line}
          serverName={config[line].serverName}
          name={"主秤"}
          config={config[line].weightBell["主秤"]}
          parentState={state}
          setParentState={setState}
          setAccuFromParent={setWeightBellAccu}
        />
        <WeightBell 
          line={line}
          serverName={config[line].serverName}
          name={"薄片秤"}
          config={config[line].weightBell["薄片秤"]}
          parentState={state}
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

module.exports = AddWater