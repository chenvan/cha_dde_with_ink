const React = require("react")
const { useState, useEffect } = require("react")
const { Text } = require("ink")

const State = ({state}) => {
  const [color, setColor] = useState('white')

  useEffect(() => {
    if(state === "监控") {
      setColor('green')
    }else if(state === "停止监控") {
      setColor('red')
    }else {
      setColor('white')
    } 
  }, [state])

  return (
    <Text color={color}>
      {`(${state})`}
    </Text>
  )
}

module.exports = State