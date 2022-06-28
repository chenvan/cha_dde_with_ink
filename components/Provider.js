const serverNameConfig = require("../config/ServerName.json")

const React = require("react")
const { useState, useEffect } = require("react")
const { Box, Text } = require('ink')
const { testServerConnect, disconnectServer } = require("../util/fetchDDE")
const { useInterval } = require("../util/customHook.js")
const Context = require('./Context')
const { logger } = require("../util/logger")
const { speakTwice } = require("../util/speak")

const Provider = ({line, children}) => {
  const [isErr, setIsErr] = useState(false)

  useInterval(async () => {
    try {
      if(isErr) {
        await testServerConnect(serverNameConfig[line])
        setIsErr(false)
      } 
    } catch(err) { 
      logger.error(`${line} 尝试重连 ${serverNameConfig[line]} 失败`, err)
      await disconnectServer(serverNameConfig[line])
    }
  }, isErr ? 1000 * 60 : null)

  useEffect(() => {
    (async () => {
      if(isErr) {
        await disconnectServer(serverNameConfig[line])
        speakTwice(`${line} 监控 出现错误`)
        logger.warn(`${line} 监控 出现错误`)
      }
    })()
  }, [isErr])
  
  return (
    <Context.Provider value={{setIsErr: setIsErr, line: line, serverName: serverNameConfig[line]}}>
      <Box key={line} flexDirection="column" margin={1} padding={1} borderStyle="single" width="50%">
        {isErr && <Text>{`${line} 发生错误, 无法获取数据`}</Text> }
        {!isErr && children}
      </Box>
    </Context.Provider>
  )
}

module.exports = {
  Provider
}