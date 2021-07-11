const { NetDDEClient, Constants } = require('netdde')
const { cli } = require('winston/lib/winston/config')
const  itemNameMapForTest = require("../test/itemNameMap.json")
const { logger } = require("./logger")

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
    if(itemName.includes("DM_Right")) return "R18C2"
    if(itemName.includes("DM_Left")) return "R19C2" // 要比 switch 先
    if(itemName.includes("Batch")) return "R6C2"
    if(itemName.includes("BrandName")) return "R5C2"
    if(itemName.includes("FluxSP")) return "R2C2"
    if(itemName.includes("Flux")) return "R3C2"
    if(itemName.includes("Total")) return "R4C2"
    if(itemName.includes("Switch")) return "R8C2"
    if(itemName.includes("Minute")) return "R7C2"
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

    let value
    let client = await connectedGroup.get(serverName)

    for (let i = 0; i < 3; i++) {
        value = await client.request(topicName, transformItemName(itemName))
        if (value !== "") break
    }
    
    return value
}


async function setAdvise(serverName, itemName, cb){

    let client = await connectedGroup.get(serverName)
    itemName = transformItemName(itemName)

    // 程序本来只使用 "advise" 这个事件名去触发数据, 我们需要改成用 itemName 作为事件名去触发数据  
    client.on(itemName, cb)

    await client.advise(topicName, itemName, Constants.dataType.CF_TEXT)
}

async function cancelAdvise(serverName, itemName) {
    try{
        if(connectedGroup.has(serverName)) {
            let client = await connectedGroup.get(serverName)
            await client.stopAdvise(topicName, transformItemName(itemName), Constants.dataType.CF_TEXT)
        }
    } catch (err) {
        logger.error(`${serverName} ${itemName} cancel advise fail`, err)
        throw err
    }
}

async function fetchBrandName(serverName, itemName, valueType) {
    let data =  await fetchDDE(serverName, itemName, valueType)
    return data.slice(0, -3)
}

async function testServerConnect(serverName, setIsErr) {
    // 通过获取分钟来测试 Server 是否通
    cacheServer(serverName, setIsErr)
    await fetchDDE(serverName, "$Minute", "int")
}

/*
    client connect 分为两个阶段
    第一阶段是 socket connect
        connect 失败后, socket destroy, reject err, connectionState 转为 CONN_DISCONNECTED
        这种情况包含 NetDDEServer 程序没打开
    第二阶段是 endpoint connect
        connect 失败后, throw error, connectionState 应该没有转, 还是 CONN_CONNECTING 
        这种情况就是 NetDDEServer 对于 endpoint 发出 NETDDE_CLIENT_CONNECT 信号没有回复

    当 client 的 connectionState 是 CONN_DISCONNECTED 时, 
    执行 advice, request, stopAdvice 这些命令时都会 throw error 

*/
function cacheServer(serverName, setIsErr) {
    if (!serverNameList.includes(serverName)) {
        throw new Error(`server ${serverName} is not exist`)
    }
    
    if (connectedGroup.has(serverName)) return

    let [appName, hostName] = isTest ? ["Excel", "localhost"] : ["view", serverName]
    
    let client = new NetDDEClient(appName, {host: hostName, timeout: 60 * 1000})
    
    let errHandler = err => {
        logger.error(`${serverName} catch connect error`, err)
        if (connectedGroup.has(serverName)) connectedGroup.delete(serverName)
        client.removeListener('error', errHandler)
        setIsErr(true)
    }

    /*
        cacheServer 出现 Error 的几种情况

        没有找到 host, 故障不会在下面的listener中出现

        找到host, 初始连接
        DDE Server 没有启动时, 故障不会在下面的listener中出现
        *** Intouch(Excel) 没有启动时, 故障在下面的listener中出现***

        已经在运行中的时候
        Intouch(Excel) 关闭, 故障不会在下面的listener中出现
        *** DDE Server 关闭, 故障在下面的listener中出现 ***
    */
          
    // client 已经建立后, 这个 catch err 才会生效
    client.on("error", errHandler)

    connectedGroup.set(serverName, client.connect().then(() => client))
}


async function clearCache(serverName) {
    try {
        if (connectedGroup.has(serverName)) {
            // 初始化时, client 连接失败, 需要 disconnectServer 时
            // 下面的 await connectedGroup.get(serverName) 会报错
            let client = await connectedGroup.get(serverName) 
            await client.disconnect()
        }
    } catch (err) {
        logger.error(`${serverName} clearCache 出错`, err)
    } finally {
        connectedGroup.delete(serverName)
    }
}


module.exports = {
    cacheServer,
    fetchDDE,
    setAdvise,
    clearCache,
    cancelAdvise,
    fetchBrandName,
    testServerConnect
}

