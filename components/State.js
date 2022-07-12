const React = require("react")
const { useState, useEffect } = require("react")
const { Text } = require("ink")

const State = ({state}) => {
  const [color, setColor] = useState('white')

  useEffect(() => {
    if(state === "监控") {
      setColor('#4e9a06')
    }else if(state === "停止监控") {
      setColor('#cc0000')
    }else {
      setColor('white')
    } 
  }, [state])

  return (
    
    // <Text color={color}>
    //   {`>${state}`}
    // </Text>
    <Text color={color}>{`(${state})`}</Text>
  )
}

module.exports = State