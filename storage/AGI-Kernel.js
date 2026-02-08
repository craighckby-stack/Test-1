import { useCallback, useState, useEffect } from 'react';

const useCycle = () => {
  const [cycleStatus, setCycleStatus] = useState('');
  const [cycleLogs, setCycleLogs] = useState([]);

  const updateCycleStatus = useCallback((status) => {
    setCycleStatus(status);
  }, [setCycleStatus]);

  const addCycleLog = useCallback((log) => {
    setCycleLogs((prevLogs) => [...prevLogs, log]);
  }, [setCycleLogs]);

  const getConfig = useCallback((config) => {
    if (!config || !config.token || !config.repo || !config.path || !config.model) {
      throw new Error('Invalid configuration');
    }
    return config;
  }, []);

  const executeCycle = useCallback(() => {
    try {
      updateCycleStatus('Executing cycle...');
      addCycleLog('Cycle started.');
      // Simulate a successful execution
      updateCycleStatus('Cycle completed.');
      addCycleLog('Cycle finished.');
    } catch (error) {
      console.error('Error executing cycle:', error);
      updateCycleStatus('Cycle failed.');
      addCycleLog(`Cycle error: ${error.message}`);
    }
  }, [updateCycleStatus, addCycleLog]);

  return { cycleStatus, cycleLogs, executeCycle };
};

const App = () => {
  const { cycleStatus, cycleLogs, executeCycle } = useCycle();

  useEffect(() => {
    executeCycle();
  }, [executeCycle]);

  const handleExecuteCycle = () => {
    executeCycle();
  };

  return (
    <div>
      <h1>Status: {cycleStatus}</h1>
      <ul>
        {cycleLogs.map((log, index) => (
          <li key={index}>{log}</li>
        ))}
      </ul>
      <button onClick={handleExecuteCycle}>Execute Cycle</button>
    </div>
  );
};

export default App;