import { useState, useEffect } from 'react';

const useTimer = (initialTime, currentTurn, isPlayerTurn, banPhase) => {
  const [timer, setTimer] = useState(initialTime);

  useEffect(() => {
    let timerInterval;
    if (timer > 0 && isPlayerTurn) {
      timerInterval = setInterval(() => {
        setTimer((prevTimer) => prevTimer - 1);
      }, 1000);
    } else if (timer === 0) {
      // Handle timer expiration logic here if needed
      clearInterval(timerInterval);
    }

    return () => clearInterval(timerInterval); // Cleanup
  }, [timer, isPlayerTurn]);

  const resetTimer = (newTime) => {
    setTimer(newTime || initialTime);
  };

  return {
    timer,
    setTimer,   // Ensure that this is returned
    resetTimer, // Function to reset the timer
  };
};

export default useTimer;
