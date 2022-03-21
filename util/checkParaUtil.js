const { fetchDDE } = require('./fetchDDE')
const { speakErr } = require('./speak')
const { logger } = require('./loggerHelper')

async function checkMoistureMeter(line, serverName, config) {
  for (const [name, itemNameList] of Object.entries(config)) {
    let [zeroPoint1, zeroPoint2] = await Promise.all([
      fetchDDE(serverName, itemNameList[0], 'string'),
      fetchDDE(serverName, itemNameList[1], 'string'),
    ])

    if(zeroPoint1 !== zeroPoint2) speakErr(`${line}, ${name} 零点不一致`)
  }
}

async function checkPara(line, serverName, paraConfig) {
    try {
      if(paraConfig.hasOwnProperty("MoistureMeter")) {
        await checkMoistureMeter(line, serverName, paraConfig['MoistureMeter'])
      }
    } catch (err) {
      speakErr(`${line} 获取水分仪零点失败`)
      logger.error(`${line} 检查水分仪零点出错`, err)
    }
    
}


module.exports = {
  checkPara
}