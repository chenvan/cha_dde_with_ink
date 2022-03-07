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

module.exports = {
  useInterval
}