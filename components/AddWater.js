'use strict'

const config = require("../config/AddWater.json")
const VoiceTips = require("../config/VoiceTips/回潮.json")

const React= require("react")
const { useState, useEffect, useRef } = require("react")
const importJsx = require('import-jsx')
const { setAdvise } = require("../util/fetchDDE")
const { fetchBrandName } = require("../util/fetchUtil")
const { Box, Text } = require('ink')
const { setReadyVoiceTips, setRunningVoiceTips, clearVoiceTips} = require("../util/voiceTipsUtil")

const Device = importJsx('./Device.js')
const WeightBell = importJsx('./WeightBell.js')
const Provider = importJsx('./Provider.js')

/*
  状态: 停止 > (两Id一致且不为空) > 待机 > (主秤实际流量大于0) > 监控 > (主秤流量等于0) > 停止监控 > (主秤实际流量大于0) > 监控
                                                                                             > (两Id为空Id) > 停止
*/

const AddWater = ({line}) => {
  const [state, setState] = useState("停止")
  const [idList, setIdList] = useState(["", ""])
  const [brandName, setBrandName] = useState("")
  const [wbAccu, setWbAccu] = useState(0)
  const [wbSetting, setWbSetting] = useState(0)
  const readyTimeIdList = useRef([])
  const runningTimeIdList = useRef([])

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
    if(idList[0] === idList[1] && idList[1] !== "") {
      setState("待机")
    } else if(idList[1] === "") {
      // 这个逻辑可能不对
      if(state !== "停止") setState("停止")
    }
  }, [idList])

  useEffect(() => {
    const stateChangeEffect = async () => {
      if(state === "待机") {
        // 获取烟牌名字
        let brandName = await fetchBrandName(config[line].serverName, config[line].brandName.itemName, config[line].brandName.valueType)
        setBrandName(brandName)

        // 加载准备语音
        readyTimeIdList.current = setReadyVoiceTips(VoiceTips[line].ready, brandName)
        
        // 检查各种参数
  
      } else if(state === "监控") {
        // 清除准备语音
        clearVoiceTips(readyTimeIdList.current)
        
        // 加载监控语音
        runningTimeIdList.current = setRunningVoiceTips(VoiceTips[line].running, brandName, wbSetting, wbAccu)
      } else if(state === "停止监控") {
        // 清除监控语音
        clearVoiceTips(runningTimeIdList.current)
      } else if(state === "停止") {
        // 清除监控语音
        clearVoiceTips(runningTimeIdList.current)
      }
    }

    stateChangeEffect()

  }, [state])

  return (
    <Box key={line} flexDirection="column" margin={1} padding={1} borderStyle="single" width="50%">
      <Text>{`${line}(${state})`}</Text>
      <Text>{brandName}</Text>
      <Provider serverName={config[line].serverName} line={line}>
        <WeightBell 
          name={"主秤"}
          config={config[line].weightBell["主秤"]}
          parentState={state}
          setParentState={setState}
          setAccuFromParent={setWbAccu}
          setSettingFromParent={setWbSetting}
        />
        <WeightBell 
          name={"薄片秤"}
          config={config[line].weightBell["薄片秤"]}
          parentState={state}
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

module.exports = AddWater