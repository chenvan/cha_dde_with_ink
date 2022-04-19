const { fetchDDE, setAdvise } = require('./fetchDDE')
const { speakErr } = require('./speak')
const { logger } = require('./loggerHelper')
const { fetchBrandName } = require("../util/fetchUtil")

async function checkMoistureMeter(line, serverName, config, brandName) {
  for (const [name, itemNameList] of Object.entries(config)) {
    let [_brandName, zeroPoint1, zeroPoint2] = await Promise.all([
      fetchBrandName(serverName, itemNameList[0], 'string'),
      fetchDDE(serverName, itemNameList[1], 'string'),
      fetchDDE(serverName, itemNameList[2], 'string'),
    ])

    if(_brandName !== undefined) {
      _brandName = _brandName.replace("（", "(").replace("）", ")")
    } 
    console.log(`${_brandName}. ${brandName}. ${zeroPoint1}. ${zeroPoint2}.`)
    // logger.info(_brandName, brandName)
    if(_brandName !== brandName) speakErr(`${line}, ${name} 牌号不一致`)
    if(zeroPoint1 !== zeroPoint2) speakErr(`${line}, ${name} 零点不一致`)
  }
}

async function checkPara(line, serverName, paraConfig, brandName) {
    try {
      if(paraConfig.hasOwnProperty("MoistureMeter")) {
        await checkMoistureMeter(line, serverName, paraConfig['MoistureMeter'], brandName)
      }
    } catch (err) {
      speakErr(`${line} 获取水分仪零点失败`)
      logger.error(`${line} 检查水分仪零点出错`, err)
    }
    
}

// 全角符号转半角符号
function toCDB(str) {
  let temp = ""

  for(let i = 0; i < str.length; i++) {
    if(str.charCodeAt(i) > 65280 && str.charCodeAt(i) < 65375) {
      temp += String.fromCharCode(str.charCodeAt(i) - 65248)
    } else {
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
        console.log(`${temp}. ${toCDB(temp)}.`)

        this.brandName = result.data.slice(0, -3).replace("（", "(").replace("）", ")")
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
  checkPara,
  MoistureMeter
}