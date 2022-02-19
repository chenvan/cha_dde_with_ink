'use strict'

const config = require("../config/AddFlavour.json")

const React= require('react')
const importJsx = require('import-jsx');
const { observer } = require('mobx-react')
const { makeObservable, observable, action  } = require('mobx')
const { Box, Text, Newline } = require('ink')

const Device = importJsx('./Device.js')

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
      this.serverName = config[this.props.line]["serverName"]
    }

    render () {
      return (
        <Box key={this.props.line} flexDirection="column">
          <Text>{`${this.props.line}(${this.status})`}</Text>
          {
            Object.entries(config[this.props.line].device).map(
              ([deviceName, config]) => {
                let data = {
                  ...config,
                  "line": this.props.line,
                  "serverName": this.serverName,
                  "deviceName": deviceName,
                  "parentState": this.status
                }

                return <Device {...data} />
              }
            )
          }
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
      this.timeId = setInterval(() => this.updateStatus(), 1000 * 5)
    }

    componentWillUnmount() {
      clearInterval(this.timeId)
    }
  }
)

module.exports = AddFlavour