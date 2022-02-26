'use strict'

const config = require("../config/AddFlavour.json")
const VoiceTips = require("../config/VoiceTips/加料.json")

const React= require("react")
const importJsx = require('import-jsx')
const { useState, useEffect, useRef } = require("react")
const { setAdvise, cancelAdvise } = require("../util/fetchDDE")
const { fetchBrandName } = require("../util/fetchUtil")
const { setReadyVoiceTips, setRunningVoiceTips, clearVoiceTips} = require("../util/voiceTipsUtil")
const { Box, Text, useStdout } = require('ink')

const Device = importJsx('./Device.js')
const Cabinet = importJsx('./Cabinet.js')
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
  const [wbAccu, setWbAccu] = useState(0)
  const [wbSetting, setWbSetting] = useState(0)
  const readyTimeIdList = useRef([])
  const runningTimeIdList = useRef([])
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
    let state = id ? "待机" : "停止" 
    setState(state)
  }, [id])

  useEffect(() => {
    const stateChangeEffect = async () => {
      try {
        if(state === "待机") {
          // 获取烟牌名字
          let brandName = await fetchBrandName(config[line].serverName, config[line].brandName.itemName, config[line].brandName.valueType)
          setBrandName(brandName)
          
          // 加载准备语音
          readyTimeIdList.current = setReadyVoiceTips(VoiceTips[line].ready, brandName, write)
          
          // 检查各种参数
    
        } else if(state === "监控") {
          // 清除准备语音
          readyTimeIdList.current = clearVoiceTips(readyTimeIdList.current)
          
          // 加载监控语音
          runningTimeIdList.current = setRunningVoiceTips(VoiceTips[line].running, brandName, wbSetting, wbAccu, write)
        
        } else if(state === "停止监控") {
          // 清除监控语音
          readyTimeIdList.current = clearVoiceTips(readyTimeIdList.current)
          runningTimeIdList.current = clearVoiceTips(runningTimeIdList.current)
        } else if(state === "停止") {
          // 清除监控语音
          runningTimeIdList.current = clearVoiceTips(runningTimeIdList.current)
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
          setParentState={setState}
          setAccuFromParent={setWbAccu}
          setSettingFromParent={setWbSetting}
        />
        <Cabinet 
          config={config[line].cabinet}
          wbAccu={wbAccu}
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
