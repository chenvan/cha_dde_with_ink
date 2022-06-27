require('winax')
const { logger } = require('./logger')

let Hongyu = new ActiveXObject("Sapi.SpVoice")
let Kangkang = new ActiveXObject("Sapi.SpVoice")

if (Hongyu.getVoices("name=Microsoft Hongyu Mobile").Count == 1) {
  Hongyu.Voice = Hongyu.getVoices("name=Microsoft Hongyu Mobile").Item(0)
} else {
  logger.warn("Cannot find Hongyu voice")
}

if(Kangkang.getVoices("name=Microsoft Kangkang Mobile").Count == 1) {
  Kangkang.Voice = Kangkang.getVoices("name=Microsoft Kangkang Mobile").Item(0)
} else {
  logger.warn("Cannot find kangkang voice")
}

function speakTest () {
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

module.exports = {
  speakTwice,
  speakTest
}