const generate = useCallback(async (objective, currentCode, deepContext, systemPrompt = "", temperature = 0.7, maxTokens = 4096) => {
    const { apiProvider, apiKey, model } = state.config;
    
    // Self-Improvement v7.1.1: Centralize API key validation. Since all current supported providers
    // require an API key, we fail fast here, cleaning up the provider-specific logic blocks.
    if (!apiKey) {
        await pushLog(`Configuration Error: API key missing for ${apiProvider}.`, 'critical');
        return { success: false, error: `API key missing for ${apiProvider}` };
    }

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
INSTRUCTION: Based on the Objective, analyze the Current Code and Deep Context. Produce the necessary self-improvement output STRICTLY in the requested JSON format. Ensure all string values are properly escaped within the JSON. Do intentionally not include markdown formatting (like JSON) around the final output.
      `
    });

    // --- Provider Specific Configuration (Using switch for cleaner structure) ---
    switch (apiProvider) {
      case 'cerebras':
      case 'openai': {
        // Standard OpenAI / Azure format, widely compatible
        url = apiProvider === 'cerebras' ? CONFIG.CEREBRAS_API : (CONFIG.OPENAI_API || 'https://api.openai.com/v1/chat/completions');
        
        // Authentication: API key is guaranteed to exist
        headers['Authorization'] = `Bearer ${apiKey}`;

        body = {
          model: model,
          messages: messages,
          temperature: temperature,
          max_tokens: maxTokens,
          stream: false
        };
        parseResponse = (data) => data.choices?.[0]?.message?.content || null;
        break;
      }

      case 'anthropic': {
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
          max_tokens: maxTokens,
          temperature: temperature,
        };
        
        if (systemMessage) {
            body.system = systemMessage;
        }

        parseResponse = (data) => data.content?.[0]?.text || null;
        break;
      }

      case 'gemini': {
        
        // IMPROVEMENT: Ensure robust URL construction, as Gemini requires the model in the path.
        const geminiBaseTemplate = CONFIG.GEMINI_API || 'https://generativelanguage.googleapis.com/v1/models/MODEL_NAME:generateContent';
        const finalGeminiUrl = geminiBaseTemplate.replace('MODEL_NAME', model);
        
        // NOTE: Gemini API key is passed via query param for v1 compatibility.
        url = `${finalGeminiUrl}?key=${apiKey}`;
        
        const systemMessage = messages.find(msg => msg.role === 'system')?.content || "";

        // FIX (v7.1.2): Gemini requires strict 'user'/'model' alternation in contents. 
        // System instructions must be explicitly added to the config block.
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
        
        const config = {
            temperature: temperature,
            maxOutputTokens: maxTokens,
        };

        // Inject the system instruction if present (crucial for prompt fidelity)
        if (systemMessage) {
            config.systemInstruction = systemMessage;
        }

        body = {
          contents: geminiMessages,
          config: config
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

    // Improvement: Add debug logging showing the constructed request before sending
    try {
        const bodySize = JSON.stringify(body).length;
        // Sanitize API key from the URL for security logging if present (e.g., Gemini)
        const sanitizedUrl = url.includes('key=') ? url.replace(/key=([^&]*)/, 'key=***') : url;
        await pushLog(`[API Request Debug] Sending request to ${apiProvider}. URL: ${sanitizedUrl}. Body size: ${bodySize} bytes.`, 'debug');
    } catch (e) {
        // Fail silently if debug logging breaks
    }

    try {
      const res = await persistentFetch(url, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errorText = await res.text();
        // Improved safety: truncate error text for logging to prevent massive console floods from API backends
        const safeErrorText = errorText.length > 500 ? errorText.slice(0, 500) + '...' : errorText;
        throw new Error(`LLM API failed [${apiProvider}] (${res.status}): ${safeErrorText}`); 
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
  }, [state.config, pushLog, persistentFetch])