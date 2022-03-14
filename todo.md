# 2022/3/14

- [] 1. 把 电子秤 setting 改为 advice

- [] 2. 对 fetch 失败需要更分情况分析?

# 2022/3/12

- [x] 1. 尝试新的 NetDDEServer(会出错)

# 2022/3/11

- [x] 1. 解决启动程序时, NetDDE Server 没打开, 程序闪退的问题 

- [x] 2. 添加 六四 AddEssence(加香) 的 采集点

- [x] 3. 添加 console 程序的运行参数

- [x] 4. 修改 logger 的错误

# 2022/3/9

- [] 1. 解决96回潮换批时,无法 fetch 秤 setting 和 accu 的问题

# 2022/3/7

- [] 1. 建一个统一的对于 catch error 后的处理

# 2022/3/5

- [x] 1. 减低 useInterval 的频次

- [x] 2. 修改 useInterval, 可以让定时执行函数先执行一次

- [x] 3. 电眼转为监控时, 需要 reset 一次 lastUpdateMoment

# 2022/3/4

- [x] 1. 水分仪经常报故障, 使用 setTimeout 延迟检查的时间

# 2022/3/3

- [x] 1. 取消cancel Advice, 因为 cancel Advice 会引起 netdde Server 闪退 

# 2022/3/2

- [] 1. 完善 log 的信息

- [] 2. ~~如何确认 ummount 的时候成功的 cancel advice~~ (取消, 见3月3号的待办)

- [x] 3. Provider 应该提升到 AddXXX 组件上

# 2022/2/27

- [x] 1. 检查水分仪通道号

- [x] 2. 把出柜组件放到电子秤组件上

- [x] 3. 语音提示放在主秤单元

- [x] 4. 回潮单元的牌号应该采的是除杂的牌号, 因为一般回潮不会出现空白的牌号(直接转批)

# 2022/2/26

- [x] 1. 完善组件 state 的转换文档

- [x] 2. stdout 的小时数, 分钟数要两位

# 2022/2/25

- [] 1. 检查出柜频率

- [x] 2. 加96线回潮

- [x] 3. 加96线加料

- [x] 4. 完善组件的 try-catch

- [x] 5. 各组件 unmount 的时候, init 的监听需要 clean up

- [x] 6. 把 isErr, setIsErr 提升到 AddXXX 组件上

# 2022/2/23

- [x] 1. 出现Error后, 重新连接的逻辑

- [x] 2. 提示语音加载
