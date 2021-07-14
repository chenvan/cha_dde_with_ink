const { createLogger, format, transports } = require("winston")
const { MESSAGE } = require('triple-beam');
const path = require('path')

/*
    不同的运行环境，logger不一样
    test: 测试
    prod: 生产
*/

let root = path.dirname(__dirname)

let infix = process.env.NODE_ENV === "test" ? ".test." : ".prod."

let errFileName = ''.concat('error', infix, 'log')
let warnFileName = ''.concat('warn', infix, 'log')

class CustomConsole extends transports.Console {
    constructor(options = {}) {
        super(options)
    }

    log(info, cb) {
        setImmediate(() => this.emit('logged', info))

        console.log(info[MESSAGE])

        if (cb) {
            cb()
        }
    }
}

/*
    logger的层次
    消息: info
    警告: warn
    错误: error
*/

const logger = createLogger({
    level: 'info',
    format: format.combine(
        format.errors({stack: true}),
        format.timestamp({
            format: 'YYYY-MM-DD HH:mm:ss'
        }),
        format.simple()
    ),
    transports: [
        new CustomConsole({
            level: 'info',
            format: format.combine(
                format.timestamp({
                    format: 'HH:mm:ss'
                }),
                format.colorize(),
                format.printf(info => `${info.timestamp} ${info.level}: ${info.message}`)
            )
        }),
        new transports.File({
            filename: path.join(root, "logs", warnFileName), 
            level: 'warn', 
            maxsize: 10000000,
        }),
        new transports.File({
            filename: path.join(root, "logs", errFileName), 
            level: 'error', 
            maxsize: 10000000,
        })
    ],
})

module.exports = {
    logger
}