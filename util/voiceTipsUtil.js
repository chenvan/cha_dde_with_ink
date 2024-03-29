const { speakTwice } = require('./speak.js')
const { logger } = require('./logger.js')

/* 
VoiceTips 包含 准备段 和 运行段
准备段是设备未开始工作时的提醒
运行段是设备开始工作后的提醒

VoiceTips的结构
{
    line: {
        "准备段": [
            {
                offset: time(seconds),
                content: string,
                filter(option): array
            }
        ],
        "运行段" [

        ]
    }
}
*/

function setRunningVoiceTips(runningVoiceTips, brandName, setting, accu) {
    let passSeconds = accu / setting * 3600
    
    return runningVoiceTips.filter(voiceTip => {
        if(voiceTip.offset >= passSeconds) {
            if(!voiceTip.hasOwnProperty("filter")) return true
            if(voiceTip.filter.includes(brandName)) return true
        }
        return false
    }).map(voiceTip => {
        return setTimeout(() => {
            speakTwice(voiceTip.content)
            logger.info(voiceTip.content)
        }, (voiceTip.offset - passSeconds) * 1000)
    })
}

function setReadyVoiceTips(readyVoiceTips, brandName) {
    return readyVoiceTips.filter(voiceTip => {
        if(!voiceTip.hasOwnProperty("filter")) return true
        if(voiceTip.filter.includes(brandName)) return true
        return false
    }).map(voiceTip => {
        return setTimeout(() => {
            speakTwice(voiceTip.content)
            logger.info(voiceTip.content)
        }, voiceTip.offset * 1000)
    })
}

function clearVoiceTips(timeIdList) {
    timeIdList.forEach(timeId => clearTimeout(timeId))
    return []
}

module.exports = {
    setRunningVoiceTips,
    setReadyVoiceTips,
    clearVoiceTips
}