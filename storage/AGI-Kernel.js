import React, { useState } from 'react';

// Custom Hook to manage cycle status, logs, and execution
const useCycle = () => {
    const [cycleStatus, setCycleStatus] = useState('Idle');
    const [cycleLogs, setCycleLogs] = useState([]);
    const [isExecuting, setIsExecuting] = useState(false);

    // Function to execute the cycle asynchronously
    const executeCycle = async () => {
        // Check if cycle is already executing
        if (isExecuting) {
            console.log('Cycle is already executing');
            return;
        }

        // Set cycle status to executing
        setCycleStatus('Executing');
        setIsExecuting(true);

        try {
            // Simulate cycle execution with a 1-second delay
            await new Promise((resolve) => setTimeout(resolve, 1000));
            // Log successful execution
            setCycleLogs((prevLogs) => [...prevLogs, 'Cycle executed successfully']);
            // Set cycle status to idle
            setCycleStatus('Idle');
        } catch (error) {
            // Log error
            setCycleLogs((prevLogs) => [...prevLogs, 'Error during cycle execution: ' + error.message]);
            // Set cycle status to idle
            setCycleStatus('Idle');
        } finally {
            // Reset isExecuting flag
            setIsExecuting(false);
        }
    };

    return { cycleStatus, cycleLogs, isExecuting, executeCycle };
};

// Example usage
const App = () => {
    const { cycleStatus, cycleLogs, isExecuting, executeCycle } = useCycle();

    return (
        <div>
            <h1>Cycle Status: {cycleStatus}</h1>
            <button disabled={isExecuting} onClick={executeCycle}>
                {isExecuting ? 'Executing...' : 'Execute Cycle'}
            </button>
            <ul>
                {cycleLogs.map((log, index) => (
                    <li key={index}>{log}</li>
                ))}
            </ul>
        </div>
    );
};

export default App;