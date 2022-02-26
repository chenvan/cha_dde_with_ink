const React = require("react")
const { useState, useContext } = require("react")
const { Text } = require('ink')
const { testServerConnect } = require("../util/fetchUtil")
const { useInterval } = require("../util/customHook.js")
const Context = require('./Context')
const { logger } = require("../util/loggerHelper")

const Provider = ({serverName, line, isErr, setIsErr, children}) => {
  // const [isErr, setIsErr] = useState(false)

  useInterval(async () => {
    try {
      if(isErr) {
        await testServerConnect(serverName)
        setIsErr(false)
      } 
    } catch(err) { 
      logger.error(`${line} ${err}`)
    }
  }, isErr ? 1000 * 30 : null)
  
  return (
    <Context.Provider value={{setIsErr, line, serverName}}>
      {isErr && <Text>{"发生错误, 无法获取数据"}</Text> }
      {!isErr && children}
    </Context.Provider>
  )
}

module.exports = Provider