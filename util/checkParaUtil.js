const { fetchDDE } = require('./fetchDDE')
const {speakErr } = require('./speak')

async function checkMoistureMeter(line, serverName, config) {
  for (const [name, itemNameList] of Object.entries(config)) {
    let [zeroPoint1, zeroPoint2] = await Promise.all([
      fetchDDE(serverName, itemNameList[0], 'string'),
      fetchDDE(serverName, itemNameList[1], 'string'),
    ])

    if(zeroPoint1 !== zeroPoint2) speakErr(`${line}, ${name} 状态异常`)
  }
}

async function checkPara(line, serverName, paraConfig) {
    if(paraConfig.hasOwnProperty("MoistureMeter")) {
        await checkMoistureMeter(line, serverName, paraConfig['MoistureMeter'])
    }
}


module.exports = {
  checkPara
}