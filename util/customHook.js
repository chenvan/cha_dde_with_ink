const React = require("react")
const { useEffect, useRef } = require("react")

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

// 先要检查一下是否可行
function useTestServerConnect(serverName, setIsErr) {

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
      }
    }
  
    init()
  }, [])

  useInterval(() => {
    if(minute.current.now === minute.current.last) setIsErr(true)
    minute.current.last = minute.current.now
  }, 1000 * 60 * 2)
}

module.exports = {
  useInterval
}