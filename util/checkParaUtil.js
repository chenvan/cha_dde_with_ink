const { setAdvise } = require('./fetchDDE')
const { speakErr } = require('./speak')
const { logger } = require('./loggerHelper')

// 全角符号转半角符号
function toHalfwidth(str) {
  let temp = ""

  for(let i = 0; i < str.length; i++) {
    if(str.charCodeAt(i) > 65280 && str.charCodeAt(i) < 65375) {
      temp += String.fromCharCode(str.charCodeAt(i) - 65248)
    }else if(str.charCodeAt(i) === 12288) {
      temp += String.fromCharCode(str.charCodeAt(i) - 12256)
    }else {
      temp += String.fromCharCode(str.charCodeAt(i))
    }
  }

  return temp
}

class MoistureMeter {
  constructor(line, name) {
    this.name = name
    this.line = line
  }

  async initM(serverName, itemNameList) {

    return Promise.all([
      setAdvise(serverName, itemNameList[0], result => {
        let temp = result.data.slice(0, -3)
        // console.log(`${temp}. ${toHalfwidth(temp)}.`)
        this.brandName = toHalfwidth(temp)
      }),
      setAdvise(serverName, itemNameList[1], result => {
        this.setP = result.data.slice(0, -3)
      }),
      setAdvise(serverName, itemNameList[2], result => {
        this.realP = result.data.slice(0, -3)
      })
    ])
  }

  check(brandName) {
    // console.log(this.brandName, brandName)
    if(this.brandName !== brandName) speakErr(`${this.line}, ${this.name} 牌号不一致`)
    if(this.setP !== this.realP) speakErr(`${this.line}, ${this.name} 零点不一致`)
  }
}


module.exports = {
  MoistureMeter
}