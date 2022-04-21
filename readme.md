# 获取数据
使用 [NetDDE Server](https://github.com/chrisoldwood/NetDDE) 与 [NetDDE Clinet JS Version](https://github.com/st-one-io/netdde) 从 Intouch View 中获取数据

DDE 获取数据的方式是 fetch 和 advice, 为了方便开发需要在 test 环境下返回假数据

用 DDE 获取数据并不稳定(特别是对96线使用fetch), 经常无法找到 item 

## 升级

待中控升级后, 看是否能够改用支持UA架构的Lib, 更改获取数据的方法

# 监视逻辑


## 遇到错误后的重新连接

由于 DDE 先天不足, 可能会出现无法连接的情况, 因此需要健壮的重连逻辑

### 连接分类

1. 在监控程序启动时, view 或者 NetDDE Server 没有启动

2. 在监控程序正常运行时, view 或者 NetDDE Server 重启 或者 关闭了 

### 重连逻辑

先查出 NetDDEServer 没启动的报错, 以及 Intouch View 没启动的报错 

# UI显示

使用 [ink](https://github.com/vadimdemedes/ink) 来展示UI

# 探讨

## 设备组件(device)

每个设备的开始条件可能是一致的, 就是父单元进入监控状态时, 自己也需要进入监控状态

但是每个设备的结束条件不一致, 需要为每一种结束条件编写一个新的设备

### 默认设备

使用父状态为监控和停止监控的条件

### 使用电子秤累计量结束的设备

1. 需要有每一种牌号的截止总量

2. 需要偏移量(无论哪一种牌号, 我们默认偏移量是一样的), 当累计量 > 截止总量 - 偏移量 时, 设备进入停止监控状态

## 电子秤组件

### 电子秤组件的监控点

1. 来料

2. 虚走

3. 流量波动


### 如何界定秤的监控时间段

开始: 主秤的实际流量大于0时

结束: 累计量大于某个数值时(如果有这个设定)

### 辅助秤的问题

梗丝秤与膨丝秤本身程序中有监控精度的脚步

但是回潮前的薄片秤没有, 因此有可能出现薄片秤没有掺配的情况, 应该敦促工程师加上


### 电子秤组件管理出柜组件

出柜组件需要累计量, 放入电子秤组件可以不用将累计量变量提升到主组件上, 简化设计

### 电子秤组件管理电眼

电子秤处于监控状态时, 电眼也需要处于监控状态, 逻辑通顺, 因此应该将暂存柜入柜电眼, 提升带电眼放入电子秤组件中


## 九六回潮转批时, 主秤获取 设定流量, 累计量 会出现问题

使用 advice 方式获取


## 把监控的敏感程度减低

过多的误报只会减低监控警示的有效性，因此宁愿牺牲及时性，也要提高准确性

每一个监控点的功能应该尽量单一

## 进柜如何才是结束和开始


## 烘丝段出柜监控由于转批时间不一致, 出柜转批时会出报错

