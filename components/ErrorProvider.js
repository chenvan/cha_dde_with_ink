const React = require("react")
const { useState } = require("react")
const { Text } = require('ink')
const { useInterval } = require("../util/customHook.js")
const ErrContext = require('./ErrorContext')

const ErrProvider = (props) => {
  const [isErr, setIsErr] = useState(false)

  useInterval(async () => {
    try {
      if(isErr) {

      } 
    } catch(err) {

    }
  }, isErr ? 1000 * 10 : null)
  
  return (
    <ErrContext.Provider value={{setIsErr}}>
      {isErr && <Text>{"发生错误, 无法获取数据"}</Text> }
      {!isErr && props.children}
    </ErrContext.Provider>
  )
}

module.exports = ErrProvider