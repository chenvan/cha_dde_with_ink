'use strict'
const React = require('react')
const { Box, Component } = require('ink')

class AddWater extends Component {
  render () {
    return (
      <Box>{this.props.line}</Box>
    )
  }
}

module.exports = AddWater