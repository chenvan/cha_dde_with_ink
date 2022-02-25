require('winax')
const { logger } = require('./loggerHelper')
const voiceObj = new ActiveXObject("Sapi.SpVoice")

function speakTwice(msg) {
  // 1 is async
  voiceObj.speak(msg, 1)
  voiceObj.speak(msg, 1)
}

function now() {
  let today = new Date()
  return `${today.getHours()}:${today.getMinutes()}`
}

function speakErr(msg, writeToStdout) {
  speakTwice(msg)
  logger.error(msg)
  if(writeToStdout !== undefined) writeToStdout(`${now()} ${msg}\n`)
}

function speakWarning(msg, writeToStdout) {
  speakTwice(msg)
  logger.info(msg)
  if(writeToStdout !== undefined) writeToStdout(`${now()} ${msg}\n`)
}

function speakVoiceTip(tip, writeToStdout) {
  speakTwice(tip)
  if(writeToStdout !== undefined) writeToStdout(`${now()} ${tip}\n`)
}

module.exports = {
  speakWarning,
  speakErr,
  speakVoiceTip
}