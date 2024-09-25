import { useState, useEffect } from 'react';

const useTimer = (initialTime) => {
  const [timer, setTimer] = useState(initialTime);

  useEffect(() => {
    let intervalId = null;
    
    if (timer > 0) {
      intervalId = setInterval(() => {
        setTimer((prevTimer) => prevTimer - 1);
      }, 1000);
    } else {
      clearInterval(intervalId);
    }

    return () => clearInterval(intervalId);
  }, [timer]);

  const resetTimer = (newTime) => {
    setTimer(newTime || initialTime);
  };

  return {
    timer,
    setTimer,   // Ensure this is correctly returned
    resetTimer, // Function to reset the timer
  };
};

export default useTimer;
