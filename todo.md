# 2022/7/12
- [x] 1. SupplyCar 需要清晰的 ui 以方便调试

- [] 2. SupplyCar 也有 "Can't perform a React state update on an unmounted component" 的警告

# 2022/7/10
- [x] 1. 电眼能根据设定流量调整监控时间

- [] 2. 除杂后暂存柜存柜时间的监控(精选, 非精选如何处理)

- [] 3. CabinetOut 也采用 CabinetIn 的方式吗? 有柜号时, 才去加载组件

# 2022/7/7
- [] 1. HDT 提升带电眼监控

# 2022/7/2
- [x] 1. 重新设计界面, 更正颜色

- [] 2. 是否能使用 react error boundary

# 2022/6/28
- [x] 1.NetDDEServer 没打开, 监控软件报错, 监控软件重新连接失败后再打开NetDDEServer, 监控软件就无法进行重连, 如果在监控软件没进行重连尝试时就打开NetDDEServer, 监控软件是可以进行重连的. 出现这个问题的原因是监控软件重新连接失败后, 并没有将 cache client 删掉

- [] 2. 梳理各组件连接 NetDDEServer 的具体过程

# 2022/6/27
- [x] 1. 重新设置 logger

- [x] 2. 初始化错误后, cabinet 由于 setTimeout 几秒后要修改 isMon 的状态, 造成组件 warning

# 2022/6/25
- [x] 1. 运行连接中断, 重新连接后, 原来的 client 没有 disconnect

- [x] 2. 组件初始化(advise)时, server cache 没有起作用, 每一个 advice 都建立自己的 client, 因此只有最后的 client 会存到 cache 中, 这也是 cancelAdvise 出错的原因. 因此应该组件初始化时, 应该先进行 connectServer 后才 advise

- [x] 3. 回潮与加料用相同的serverName, 但是由于是不同的组件, 因此会是两个不同的 client. server cache 时只存最后的 client.  修正的方法是 cache 不存 client, 而是存 promise. 这样避免了 conectServer 内异步执行的语句, 使得回潮与加料是同一个 client 

# 2022/6/24
- [] 1. 检查96回潮切片的电眼是否抄错了

# 2022/6/22
- [x] 1. 使用Excel + netdde serve 做测试方案

# 2022/6/16
- [x] 1.修正建立监听失败后一连串的报警

# 2022/6/2
- [x] 1. 入柜跑车的限位监控

# 2022/4/19

- [x] 1. 水分仪的牌号转换为半角字符

# 2022/4/10

- [x] 1. 试用新的 NetDDE Server

- [x] 2. Cabinet组件需要修改, 防止批号不同是仍然进行报警

- [x] 3. 烘丝水分仪通道号的检测

# 2022/3/28

- [x] 1. 写 烘丝段 的监控逻辑

- [x] 2. 监控画面的排列应该重写, 再加上烘丝段的监控就太长了

- [] 3. 重新整理各组件的状态转换图

# 2022/3/27

- [x] 1. 修复加香暂存柜存数尾料警告

- [x] 2. 修复在 test 环境下, 用 $Minute 检测与服务连接时出现的错误

- [x] 3. 对 Device 实现 Skin 的概念

# 2022/3/24

- [x] 1. 建立只执行64线的监控的启动方式

- [x] 2. 建立方法检测 advice 是否更新 

# 2022/3/21

- [x] 1. 不同生产线的语音不一样

- [] 2. 记录异常情况时， 应该把处罚报警的参数也记录下来

- [x] 3. 薄片秤在单元进入监控后，应该要检查自己是否启动

- [x] 4. 当秤有 cutoff 时，需要流量波动的警告

- [x] 5. 水分仪无法获取数据需要报错提醒

- [x] 6. 把 Ink 的 write 函数去掉，只用 console.log 就行

# 2022/3/16

- [x] 1. 修改 device，让它在不同状态下的 maxDuration 不一样

- [x] 2. 添加 九六 AddEssence(加香) 的 采集点

# 2022/3/15

- [x] 1. 膨丝，梗丝暂存柜入柜电眼只监控0状态

- ~~[] 2. 膨丝，梗丝提升带电眼监控时间随流量改变~~

- [x] 3. 叶丝暂存柜报存料有问题

# 2022/3/12

- [x] 1. 尝试新的 NetDDE Server(新NetDDE Server出错，已报作者)

# 2022/3/11

- [x] 1. 解决启动程序时, NetDDE Server 没打开, 程序闪退的问题 

- [x] 2. 添加 六四 AddEssence(加香) 的 采集点

- [x] 3. 添加 console 程序的运行参数

- [x] 4. 修改 logger 的错误

# 2022/3/9

- [x] 1. 解决96回潮换批时,无法 fetch 秤 setting 和 accu 的问题（改成使用 advice 的方式）

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

- ~~[] 1. 完善 log 的信息~~

- ~~[] 2. 如何确认 ummount 的时候成功的 cancel advice~~ (取消, 见3月3号的待办)

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
