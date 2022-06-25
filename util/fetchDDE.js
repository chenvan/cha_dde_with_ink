const { NetDDEClient, Constants } = require('netdde')
const  itemNameMapForTest = require("../test/itemNameMap.json")
const { logger } = require("../util/loggerHelper")

const serverNameList = [
    "VMGZZSHMI1", "VMGZZSHMI2","VMGZZSHMI3", "VMGZZSHMI4", "VMGZZSHMI5",
    "VMGZZSHMI6", "VMGZZSHMI7","VMGZZSHMI8", "VMGZZSHMI9", "VMGZZSHMI10"
]

let connectedGroup = new Map()
let isTest = process.env.NODE_ENV === 'test' || process.env.NODE_ENV === "dev"
let topicName = isTest ? "[test.xlsm]Sheet1" : "tagname"
let transformItemName = isTest ? transformForTest : itemName => itemName
let transformMap = new Map(Object.entries(itemNameMapForTest))

function transformForTest(itemName) {
    // 具体的
    if(transformMap.has(itemName)) return transformMap.get(itemName)
    // 不具体的
    if(itemName.includes("Batch")) return "R6C2"
    if(itemName.includes("BrandName")) return "R5C2"
    if(itemName.includes("FluxSP")) return "R2C2"
    if(itemName.includes("Flux")) return "R3C2"
    if(itemName.includes("Total")) return "R4C2"
    if(itemName.includes("Switch")) return "R8C2"
    if(itemName.includes("Minute")) return "R7C2"
    if(itemName.includes("Second")) return "R9C2"
    if(itemName.includes("Read_Trim")) return "R10C2"
    if(itemName.includes("Write_Trim")) return "R11C2"
    if(itemName.includes("FT_DP5_B1")) return "R17C2"
    if(itemName.includes("InWeight")) return "R13C2"
    // default
    return "R1C2"
} 

async function fetchDDE (serverName, itemName, valueType) {
    let value = await request(serverName, itemName)
    
    if(valueType === 'int') {
        value = parseInt(value, 10)
        if (Number.isNaN(value)) throw Error(`${serverName}:${itemName} -> get ${value} is not a number`)
    }

    return value
}

async function request(serverName, itemName) {
    try {
        if (!connectedGroup.has(serverName)) {
            await connectServer(serverName)
        }

        let value
        let client = connectedGroup.get(serverName)

        for (let i = 0; i < 3; i++) {
            value = await client.request(topicName, transformItemName(itemName))
            if (value !== "") break
        }
        
        return value
    } catch(err) {
        if (err.message === "Not connected") {
            // 运行时, 出现以下两种情况需要重新连接
            // 1. NetDDEServer没打开 
            // 2. Intouch View 没打开
            connectedGroup.delete(serverName)
        }

        throw err
    }
}


async function setAdvise(serverName, itemName, cb){

    if(!connectedGroup.has(serverName)) {
        await connectServer(serverName)
    }

    let client = connectedGroup.get(serverName)
    itemName = transformItemName(itemName)

    // 程序本来只使用 "advise" 这个事件名去触发数据, 我们需要改成用 itemName 作为事件名去触发数据  
    client.on(itemName, cb)

    await client.advise(topicName, itemName, Constants.dataType.CF_TEXT)
}

async function cancelAdvise(serverName, itemName) {
    try{
        if(connectedGroup.has(serverName)) {
            let client = connectedGroup.get(serverName)
            await client.stopAdvise(topicName, transformItemName(itemName), Constants.dataType.CF_TEXT)
            logger.info(`${serverName} ${itemName} cancel advise success`)
        }
    } catch (err) {
        logger.error(err)
        throw err
    }
}

async function fetchBrandName(serverName, itemName, valueType) {
    let data =  await fetchDDE(serverName, itemName, valueType)
    return data.slice(0, -3)
}

async function testServerConnect(serverName) {
    // 通过获取分钟来测试 Server 是否通
    await fetchDDE(serverName, "$Minute", "int")
}

async function connectServer(serverName) {
    if (!serverNameList.includes(serverName)) {
        throw new Error(`server ${serverName} does not exist`)
    }
    
    if (connectedGroup.has(serverName)) return

    let [appName, hostName] = isTest ? ["Excel", "localhost"] : ["view", serverName]
    
    let client = new NetDDEClient(appName, {host: hostName, timeout: 60 * 1000})

    /*
        connectServer 出现 Error 的几种情况

        没有找到 host, 故障不会在下面的listener中出现

        找到host, 初始连接
        DDE Server 没有启动时, 故障不会在下面的listener中出现
        *** Intouch(Excel) 没有启动时, 故障在下面的listener中出现***

        已经在运行中的时候
        Intouch(Excel) 关闭, 故障不会在下面的listener中出现
        *** DDE Server 关闭, 故障在下面的listener中出现 ***

    */
            
    client.on("error", err => {
        // 现在不会播报 error
        // 如何播报 Error, 并且拒绝重复播报
        logger.error(`${serverName} err listener catch connect error`, err)
        if (connectedGroup.has(serverName)) connectedGroup.delete(serverName)
    })
    
    await client.connect()
    connectedGroup.set(serverName, client)
}

async function disconnectServer(serverName) {
    if (connectedGroup.has(serverName)) {
        let client = connectedGroup.get(serverName)
        await client.disconnect()
        connectedGroup.delete(serverName)
    }
}

// async function disconnectAllClients() {

//     for (let client of connectedGroup.values()) {
//         await client.disconnect()
//     }

//     // ?
//     connectedGroup = new Map()
// }


module.exports = {
    connectServer,
    fetchDDE,
    setAdvise,
    disconnectServer,
    cancelAdvise,
    fetchBrandName,
    testServerConnect
}

