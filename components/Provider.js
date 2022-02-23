const React = require("react")
const { useState } = require("react")
const { Text } = require('ink')
const { useInterval } = require("../util/customHook.js")
const Context = require('./Context')

const Provider = ({serverName, line, children}) => {
  const [isErr, setIsErr] = useState(false)

  useInterval(async () => {
    try {
      if(isErr) {

      } 
    } catch(err) {

    }
  }, isErr ? 1000 * 10 : null)
  
  return (
    <Context.Provider value={{setIsErr, line, serverName}}>
      {isErr && <Text>{"发生错误, 无法获取数据"}</Text> }
      {!isErr && children}
    </Context.Provider>
  )
}

module.exports = Provider