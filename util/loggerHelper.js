const { createLogger, format, transports } = require("winston")
const path = require('path')

/*
    不同的运行环境，logger不一样
    dev: 开发
    test: 测试
    prod: 生产
*/

let root = path.dirname(__dirname)

let infix = process.env.NODE_ENV === "test" ? ".test." : ".prod."

let errFileName = ''.concat('error', infix, 'log')
let infoFileName = ''.concat('combined', infix, 'log')

const logger = createLogger({
    level: 'info',
    format: format.combine(
        format.timestamp({
            format: 'YYYY-MM-DD HH:mm:ss'
        }),
        format.errors({stack: true}),
        format.splat(),
        format.json(),
        format.simple()
    ),
    transports: [
        new transports.File({filename: path.join(root, "logs", errFileName), level: 'error', maxsize: 10000000}),
        new transports.File({filename: path.join(root, "logs", infoFileName), level: 'info', maxsize: 10000000}),
    ],
})

function leadingZero (num) {
    return String(num).padStart(2, "0")
}
  
function now() {
    let today = new Date()
    return [today.getHours(), today.getMinutes()].map(leadingZero).join(":")
}

function showMsg(msg) {
    console.log(`${now()} ${msg}`)
}
  

module.exports = {
    logger : {
        error: (msg, err) => {
            logger.error(msg, err)
            if (err && err.message) {
                console.log(`${now()} ${msg} ${err.message}`)
            } else {
                console.log(`${now()} ${msg}`)
            }
        },
        info: msg => {
            logger.info(msg)
            console.log(`${now()} ${msg}`)
        }
    },
    showMsg
}