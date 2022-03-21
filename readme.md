# 获取数据
使用 [NetDDE Server](https://github.com/chrisoldwood/NetDDE) 与 [NetDDE Clinet JS Version](https://github.com/st-one-io/netdde) 从 Intouch View 中获取数据

DDE 获取数据的方式是 fetch 和 set advice, 为了方便开发需要在 test 环境下返回假数据

用 DDE 获取数据并不稳定, View 二级界面的数据需要打开后才能被获取

## 升级

待中控升级后, 看是否能够改用支持UA架构的Lib, 更改获取数据的方法

# 监视逻辑


## 遇到错误后的重新连接

由于 DDE 先天不足, 可能会出现无法连接的情况, 因此需要健壮的重连逻辑

### 重连逻辑



# UI显示

使用 [ink](https://github.com/vadimdemedes/ink) 来展示UI

# 探讨

## 电子秤组件管理出柜组件

出柜组件需要累计量, 放入电子秤组件可以不用将累计量变量提升到主组件上, 简化设计

## 电子秤组件管理电眼

电子秤处于监控状态是, 电眼也需要处于监控状态, 逻辑通顺, 因此应该将暂存柜入柜电眼, 提升带电眼放入电子秤组件中

## 提升带电眼, 定量管高料位电眼, 进暂存柜电眼的关系

定量管高料位电眼主要是用来监控电子秤假运行的情况, 这方面提升带电眼也能做到. 至于高料位堵料的情况, 提升带电眼也能做到, 因此两个电眼应该是互补关系, 不需要一起用

不过这么说, 暂存柜进料电眼也和提升带电眼一样. 提升带电眼被遮住, 暂存柜底带不进, 那么进料电眼也会被料满遮住. 提升带电眼是空的, 那么进料电眼早已经是空的了

只想到一种情况, 就是进柜电眼已经空了, 但是提升带电眼被遮住了, 这样就只能通过提升带电眼去查看情况, 但这样说也能说通定量管高料位电眼与提升带电眼都需要


## 九六回潮转批时, 主秤获取 设定流量, 累计量 会出现问题(可能与上一个问题是同一个问题)

换批是, 主秤就出现无法 获取设定流量与累计量的问题. 

正常工作的时候也会出现无法获取实际流量与累计量的问题

那么先试试主秤 获取参数的 useInterval 不立即执行

但96加料似乎就没有问题


## 把监控的敏感程度减低

过多的误报只会减低监控警示的有效性，因此宁愿牺牲及时性，也要提高准确性

每一个监控点的功能应该尽量单一

## 思考如何避免尾料时的语音播报

## 进柜如何才是结束和开始

## 各监控点的功能

提升带电眼[1]：监控电子秤虚走

入暂存柜电眼[0]: 提早断料报警

电子秤波动：

