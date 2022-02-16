'use strict'

const config = require("../config/AddFlavour.json")

const React= require('react')
const importJsx = require('import-jsx');
const { observer } = require('mobx-react')
const { makeObservable, observable, action  } = require('mobx')
const { Box, Text } = require('ink')

const { Device } = importJsx('./Device.js')

const AddFlavour = observer(
  class AddFlavour extends React.Component {
    status
    
    constructor(props) {
      super(props)

      makeObservable(this, {
        status: observable,
        updateStatus: action
      })
      
      this.status = "停止"
    }

    render () {
      return (
        <Box key={this.props.line}>
          <Text>{`${this.props.line}(${this.status})`}</Text>
        
        </Box>
      )
    }

    updateStatus() {
      if(this.status === "停止") {
        this.status = "监控"
      }else if(this.status === "监控") {
        this.status = "停止"
      }
    }

    componentDidMount() {
      // this.init()
      this.timeId = setInterval(() => this.updateStatus(), 1000 * 2)
    }

    componentWillUnmount() {
      clearInterval(this.timeId)
    }
  }
)

module.exports = AddFlavour