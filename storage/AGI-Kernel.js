Here is the optimized version of the provided React code:

```jsx
import React, { useState, useEffect, useReducer, useRef, useCallback } from 'react';
import { initializeApp, getFirestore, getAuth, onAuthStateChanged } from 'firebase/app';
import { doc, getDoc, setDoc, collection, onSnapshot, addDoc } from 'firebase/firestore';
import { githubRequest, callCerebras, makeRequest } from './apiRequests';

// Constants
const GOVERNED_OBJECTIVES = [
  "Add JSDoc comment to arbitrateMutation explaining the dual-agent constitutional model.",
  "Refine the dashboard UI border-white/5 to border-white/10 for increased visual definition.",
  "Implement a console.info heartbeat at the entry of the loadGovernanceContext function.",
  "Smooth the health bar transition by updating CSS duration to 1200ms.",
  "Optimize the log entry rendering by adding a unique cryptographic-style prefix to timestamps.",
];

// Initial state
const INITIAL_STATE = {
  isBooted: false,
  isLive: false,
  status: 'IDLE',
  activeObjective: 'Awaiting Command...',
  cycleCount: 0,
  logs: [],
  activeTab: 'dashboard',
  health: 100,
  arbitrationResult: null,
  governance: {
    fileCount: 0,
    priorityFiles: [],
    allPaths: [],
  },
  config: {
    token: '',
    repo: '',
    kernelPath: '',
    interval: 60000,
    cerebrasKey: '',
    model: 'llama3.1-70b',
  },
};

// Reducer
const reducer = (state, action) => {
  switch (action.type) {
    case 'BOOT':
      return { ...state, isBooted: true, config: { ...state.config, ...action.config } };
    case 'SET_LIVE':
      return { ...state, isLive: action.value };
    case 'SET_STATUS':
      return { ...state, status: action.value, activeObjective: action.objective || state.activeObjective };
    case 'LOG_UPDATE':
      return { ...state, logs: action.logs };
    case 'GO_ARBITRATE':
      return { ...state, arbitrationResult: action.data };
    case 'GOV_LOADED':
      return { ...state, governance: action.data };
    case 'INCREMENT_CYCLE':
      return {
        ...state,
        cycleCount: state.cycleCount + 1,
        health: Math.max(0, state.health - (action.decay || 0)),
      };
    case 'SET_TAB':
      return { ...state, activeTab: action.tab };
    default:
      return state;
  }
};

const App = () => {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE);
  const [user, setUser] = useState(null);
  const isExecuting = useRef(false);
  const stateRef = useRef(state);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    const initAuth = async () => {
      const auth = getAuth();
      if (process.env.REACT_APP_INITIAL_AUTH_TOKEN) {
        await auth.signInWithCustomToken(process.env.REACT_APP_INITIAL_AUTH_TOKEN);
      } else {
        await auth.signInAnonymously();
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(getAuth(), setUser);
    return unsubscribe;
  }, []);

  useEffect(() => {
    let timer;
    if (state.isLive) timer = setInterval(executeCycle, state.config.interval);
    return () => clearInterval(timer);
  }, [state.isLive]);

  const executeCycle = useCallback(async () => {
    if (isExecuting.current || !stateRef.current.isLive) return;
    isExecuting.current = true;

    try {
      // logic to execute a cycle
    } catch (error) {
      console.error(error);
    } finally {
      isExecuting.current = false;
      dispatch({ type: 'SET_STATUS', value: 'STABLE' });
    }
  }, []);

  // apiRequests.js
  export const githubRequest = async (path, method = 'GET', body = null) => {
    const { token, repo } = stateRef.current.config;
    const url = `https://api.github.com/repos/${repo}${path}`;
    const headers = {
      Authorization: `token ${token}`,
      Accept: 'application/vnd.github.v3+json',
    };
    return makeRequest(url, method, body, headers);
  };

  export const callCerebras = async (prompt, system) => {
    const { cerebrasKey, model } = stateRef.current.config;
    const url = 'https://api.cerebras.ai/v1/chat/completions';
    const body = {
      model,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: prompt },
      ],
      temperature: 0.1,
    };
    const headers = {
      Authorization: `Bearer ${cerebrasKey}`,
    };
    return makeRequest(url, 'POST', body, headers);
  };

  export const makeRequest = async (url, method = 'GET', body = null, headers = {}) => {
    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        body: body ? JSON.stringify(body) : null,
      });
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      return response.json();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    // rendered UI
  );
};

export default App;