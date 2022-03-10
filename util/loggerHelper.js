const { createLogger, format, transports } = require("winston")
const path = require('path')

/*
    不同的运行环境，logger不一样
    dev: 开发
    test: 测试
    prod: 生产
*/

let infix = process.env.NODE_ENV === "dev" ? ".dev." : process.env.NODE_ENV === "test" ? ".test." : ".prod."

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
        new transports.File({filename: path.join(__dirname, "logs", errFileName), level: 'error', maxsize: 10000000}),
        new transports.File({filename: path.join(__dirname, "logs", infoFileName), level: 'info', maxsize: 10000000}),
    ],
})

if(process.env.NODE_ENV === "dev") {
    logger.add(
        new transports.Console({
            format: format.combine(
                format.colorize(),
            )
        })
    )
}

module.exports = {
    logger
}