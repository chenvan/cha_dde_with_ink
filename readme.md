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

## 电子秤与电眼的关系
