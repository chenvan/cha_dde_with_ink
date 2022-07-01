const React = require("react")
const { useEffect, useRef } = require("react")
const { setAdvise } = require("./fetchDDE")
const { logger } = require("./logger")

function useInterval(callback, delay, isRunRightNow = false) {
  const savedCallback = useRef();

  // 保存新回调
  useEffect(() => {
    savedCallback.current = callback;
  });

  // 建立 interval
  useEffect(() => {
    function tick() {
      savedCallback.current();
    }
    
    if (delay !== null) {
      if(isRunRightNow) tick()
      let id = setInterval(tick, delay);
      return () => clearInterval(id);
    }
  }, [delay]);
}

function useCheckServerConnect(line, serverName, setIsErr, delay) {

  const minute = useRef({
    now: 0,
    last: undefined
  })

  useEffect(() => {
    const init = async () => {
      try {
        await setAdvise(serverName, "$Minute", result => {
          minute.current.now = parseInt(result.data, 10)
        })
      } catch (err) {
        setIsErr(true)
        logger.error(`${serverName} 建立服务连接监控出错`, err)
      }
    }
  
    init()
  }, [])

  useInterval(() => {
    if(minute.current.now === minute.current.last) {
      setIsErr(true)
      logger.error(`${line} 连接中断`)
    }
    minute.current.last = minute.current.now
  }, delay)
}

module.exports = {
  useInterval,
  useCheckServerConnect
}