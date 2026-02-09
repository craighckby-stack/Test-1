const generate = useCallback(async (objective, currentCode, deepContext, systemPrompt = "") => {
    const { apiProvider, apiKey, model } = state.config;
    await pushLog(`Generating response via ${apiProvider} (${model})...`, 'info');

    let url = '';
    let body = {};
    const headers = { 'Content-Type': 'application/json' };
    let parseResponse = (data) => data;
    const messages = [];

    // 1. System message (Core directive)
    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }

    // 2. Contextual message (Code and Objective)
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

    // --- Provider Specific Configuration (Using switch for cleaner structure) ---
    switch (apiProvider) {
      case 'cerebras':
      case 'openai': {
        // Standard OpenAI / Azure format, widely compatible
        url = apiProvider === 'cerebras' ? CONFIG.CEREBRAS_API : (CONFIG.OPENAI_API || 'https://api.openai.com/v1/chat/completions');
        
        // Authentication Check
        if (!apiKey) {
           await pushLog(`Configuration Error: API key missing for ${apiProvider}`, 'critical');
           return { success: false, error: `API key missing for ${apiProvider}` };
        }
        headers['Authorization'] = `Bearer ${apiKey}`;

        body = {
          model: model,
          messages: messages,
          temperature: 0.7,
          max_tokens: 4096,
          stream: false
        };
        parseResponse = (data) => data.choices?.[0]?.message?.content || null;
        break;
      }

      case 'anthropic': {
        if (!apiKey) {
          await pushLog(`Configuration Error: API key missing for anthropic`, 'critical');
          return { success: false, error: `API key missing for anthropic` };
        }

        url = CONFIG.ANTHROPIC_API || 'https://api.anthropic.com/v1/messages';
        headers['x-api-key'] = apiKey;
        headers['anthropic-version'] = '2023-06-01'; // Required API version header

        // Anthropic requires a separate 'system' parameter and only 'user'/'assistant' roles in messages
        const anthropicMessages = messages
          .filter(msg => msg.role !== 'system')
          .map(msg => ({
              role: msg.role === 'user' ? 'user' : 'assistant',
              content: msg.content
          }));

        const systemMessage = messages.find(msg => msg.role === 'system')?.content || "";

        body = {
          model: model,
          messages: anthropicMessages,
          max_tokens: 4096,
          temperature: 0.7,
        };
        
        if (systemMessage) {
            body.system = systemMessage;
        }

        parseResponse = (data) => data.content?.[0]?.text || null;
        break;
      }

      case 'gemini': {
        if (!apiKey) {
           await pushLog(`Configuration Error: API key missing for gemini`, 'critical');
           return { success: false, error: `API key missing for gemini` };
        }
        
        // IMPROVEMENT: Ensure robust URL construction, as Gemini requires the model in the path.
        // Use a robust default template, replacing the model placeholder.
        const geminiBaseTemplate = CONFIG.GEMINI_API || 'https://generativelanguage.googleapis.com/v1/models/MODEL_NAME:generateContent';
        
        // Ensure the `model` specified in config replaces the placeholder in the URL template
        const finalGeminiUrl = geminiBaseTemplate.replace('MODEL_NAME', model);
        
        // NOTE: Gemini API key is passed via query param for v1 compatibility.
        url = `${finalGeminiUrl}?key=${apiKey}`;
        
        // FIX: Gemini API v1 requires strict 'user'/'model' alternation. 
        // We filter out the dedicated 'system' message (Message 1) because mapping it to 'user' causes 
        // sequential user messages which fails the API. The core instruction is already included 
        // within the main 'user' context message (Message 2).
        const geminiMessages = messages
          .filter(msg => msg.role !== 'system')
          .map(msg => ({
            // Ensure roles are strictly 'user' or 'model' (assistant)
            role: msg.role === 'assistant' ? 'model' : 'user', 
            parts: [{ text: msg.content }]
          }));

        if (geminiMessages.length === 0) {
            await pushLog('Gemini request generation failed: No user content found after filtering.', 'error');
            return { success: false, error: 'Gemini request empty after filtering.' };
        }
        
        body = {
          contents: geminiMessages,
          config: {
            temperature: 0.7,
            maxOutputTokens: 4096,
          }
        };
        parseResponse = (data) => data.candidates?.[0]?.content?.parts?.[0]?.text || null;
        break;
      }

      default:
        await pushLog(`Configuration Error: Unknown API provider: ${apiProvider}`, 'critical');
        return { success: false, error: `Unknown API provider: ${apiProvider}` };
    }

    // --- Execution ---
    if (!url) {
        await pushLog('LLM Generation Error: API endpoint URL is not configured.', 'critical');
        return { success: false, error: 'API endpoint URL missing.' };
    }

    try {
      const res = await persistentFetch(url, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`LLM API failed (${res.status}): ${errorText.slice(0, 200)}`); 
      }

      const data = await res.json();
      const rawResponse = parseResponse(data);
      
      if (!rawResponse) {
        // Enhanced logging: log a slice of the raw data for context
        const partialData = JSON.stringify(data).slice(0, 1000);
        await pushLog(`LLM response was empty or unparseable. Partial JSON response: ${partialData}`, 'error');
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