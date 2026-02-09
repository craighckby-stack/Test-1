  // --- NEXUS MEMORY OPERATIONS ---
  const loadNexusMemory = async (repo, token) => {
    if (!state.config.enableNexus) return null;
    
    try {
      const nexusData = await fetchFile(repo, 'nexus_memory.json', 'Nexus-Database', token);
      return nexusData ? JSON.parse(nexusData.content) : null;
    } catch (e) { 
      await pushLog(`Error loading Nexus Memory: ${e.message}`, 'error');
      return null;
    }
  };

  // --- LLM COMMUNICATION & ORCHESTRATION ---
  const generate = useCallback(async (objective, currentCode, deepContext, systemPrompt = "") => {
    const { apiProvider, apiKey, model } = state.config;
    await pushLog(`Generating response via ${apiProvider} (${model})...`, 'info');

    let url = '';
    let body = {};
    let parseResponse = (data) => data; // Function to extract the text response

    const messages = [];

    // 1. System message (Core directive)
    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }

    // 2. Contextual message (Code and Objective)
    // NOTE: This forms the core prompt injection for the AGI kernel's context window.
    messages.push({
      role: 'user',
      content: `
AGI-KERNEL v7.1 Autonomous Synthesis Core Report.
Objective: ${objective}
Current Code Context (AGI-Kernel.js, truncated if necessary):
---
${currentCode}
---
Deep Context Scan (Project Context):
---
${deepContext}
---
INSTRUCTION: Based on the Objective, analyze the Current Code and Deep Context. Produce the necessary self-improvement output STRICTLY in the requested JSON format. Ensure all string values are properly escaped within the JSON. Do not include markdown formatting (like JSON) around the final output.
      `
    });

    // --- Provider Specific Configuration ---
    if (apiProvider === 'cerebras') {
      url = CONFIG.CEREBRAS_API;
      body = {
        model: model,
        messages: messages,
        temperature: 0.7,
        max_tokens: 4096,
        stream: false
      };
      parseResponse = (data) => data.choices?.[0]?.message?.content || null;
      
    } else if (apiProvider === 'gemini') {
      url = `${CONFIG.GEMINI_API}?key=${apiKey}`;
      // Gemini API v1beta requires role transformation and 'parts' structure
      const geminiMessages = messages.map(msg => ({
        role: msg.role === 'system' ? 'user' : msg.role, // Hack: Use 'user' for system prompts in Gemini v1beta
        parts: [{ text: msg.content }]
      }));
      
      body = {
        contents: geminiMessages,
        config: {
          temperature: 0.7,
          maxOutputTokens: 4096,
        }
      };
      parseResponse = (data) => data.candidates?.[0]?.content?.parts?.[0]?.text || null;
      
    } else {
      await pushLog(`Configuration Error: Unknown API provider: ${apiProvider}`, 'critical');
      return { success: false, error: `Unknown API provider: ${apiProvider}` };
    }

    try {
      const headers = { 
        'Content-Type': 'application/json' 
      };
      if (apiProvider === 'cerebras') {
         headers['Authorization'] = `Bearer ${apiKey}`;
      }

      const res = await persistentFetch(url, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`LLM API failed (${res.status}): ${errorText.slice(0, 100)}`);
      }

      const data = await res.json();
      const rawResponse = parseResponse(data);
      
      if (!rawResponse) {
        throw new Error("LLM response was empty or unparseable by the internal wrapper.");
      }
      
      await pushLog('LLM generation complete. Parsing result...', 'success');
      
      // Use the JSON recovery mechanism to handle potential truncation
      const structuredResult = recoverJSON(rawResponse);

      if (!structuredResult) {
         await pushLog('Failed to recover structured JSON from LLM output. Returning raw text.', 'error');
         return { success: false, raw: rawResponse, error: "JSON recovery failed." };
      }
      
      return { success: true, result: structuredResult, raw: rawResponse };
      
    } catch (e) {
      await pushLog(`LLM Generation Fatal Error: ${e.message}`, 'critical');
      return { success: false, error: e.message };
    }
  }, [state.config, pushLog, persistentFetch]);

  // --- EXECUTION LOOP (V7.1 Core Initiation) ---
  // Placeholder for the next major implementation step.

  const renderStatusIcon = (status) => { /* ... implementation */ };
