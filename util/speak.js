require('winax')
const { logger } = require('./loggerHelper')

let Hongyu = new ActiveXObject("Sapi.SpVoice")
let Kangkang = new ActiveXObject("Sapi.SpVoice")

if (Hongyu.getVoices("name=Microsoft Hongyu Mobile").Count == 1) {
  Hongyu.Voice = Hongyu.getVoices("name=Microsoft Hongyu Mobile").Item(0)
} else {
  console.log("can not find Hongyu voice")
}

if(Kangkang.getVoices("name=Microsoft Kangkang Mobile").Count == 1) {
  Kangkang.Voice = Kangkang.getVoices("name=Microsoft Kangkang Mobile").Item(0)
} else {
  console.log("can not find kangkang voice")
}

function test () {
  let voiceObj = new ActiveXObject("Sapi.SpVoice")

  for (let i = 0 ; i < voiceObj.getVoices().Count; i++) {
    console.log(voiceObj.getVoices().Item(i).GetDescription())
  }

  Hongyu.speak("你好")
  Kangkang.speak("你好")
}

function speakTwice(msg) {
  
  let voiceObj = msg.includes("九六") ? Hongyu :Kangkang

  // 1 is async
  voiceObj.speak(msg, 1)
  voiceObj.speak(msg, 1)
}

function leadingZero (num) {
  return String(num).padStart(2, "0")
}

function now() {
  let today = new Date()
  return [today.getHours(), today.getMinutes()].map(leadingZero).join(":")
}

function speakErr(msg) {
  speakTwice(msg)
  logger.error(msg)
  console.log(`${now()} ${msg}`)
}

function speakWarning(msg) {
  speakTwice(msg)
  logger.info(msg)
  console.log(`${now()} ${msg}`)
}

function speakVoiceTip(tip) {
  speakTwice(tip)
  console.log(`${now()} ${tip}`)
}

module.exports = {
  speakWarning,
  speakErr,
  speakVoiceTip,
  test
}