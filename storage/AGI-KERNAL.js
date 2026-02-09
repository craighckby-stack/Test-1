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

    // Self-Improvement v7.8.0: Implement context size guard to prevent 400 errors from overflowing the model's token limit.
    // Using character count as a proxy for token estimation (200k chars ~ 50k tokens, providing ample safety margin).
    const MAX_CONTEXT_CHARS = 200000; 

    let safeCurrentCode = currentCode;
    let safeDeepContext = deepContext;
    const totalContextLength = currentCode.length + deepContext.length;

    if (totalContextLength > MAX_CONTEXT_CHARS) {
        // Priority: Keep the Current Code intact, truncate Deep Context
        const maxDeepContextLength = MAX_CONTEXT_CHARS - currentCode.length;
        
        if (maxDeepContextLength <= 0) {
            // Current code is already too large or near the limit
            safeDeepContext = `[Deep Context Truncated: Current code too large]`;
            await pushLog(`Warning: Current Code context (${currentCode.length} chars) is nearing or exceeding MAX_CONTEXT_CHARS. Deep context aggressively truncated.`, 'warning');
        } else {
            safeDeepContext = deepContext.slice(0, maxDeepContextLength) + '... [CONTEXT TRUNCATED]';
            await pushLog(`Warning: Context window overflow detected (${totalContextLength} > ${MAX_CONTEXT_CHARS}). Deep context truncated to ${maxDeepContextLength} characters.`, 'warning');
        }
    }

    // 1. System message (Core directive)
    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }

    // 2. Contextual message (Code and Objective)
    // Self-Improvement v7.4.0: Refine the user message structure to isolate and emphasize the CRITICAL JSON formatting instructions, improving output compliance.
    messages.push({
      role: 'user',
      content: `
AGI-KERNEL v7.1 Autonomous Synthesis Core Report.
Objective: ${objective}
Current Code Context (AGI-Kernel.js, truncated if necessary):
---
${safeCurrentCode}
---
Deep Context Scan (Project Context):
---
${safeDeepContext}
---

---
FORMATTING INSTRUCTION (CRITICAL):
Produce the necessary self-improvement output STRICTLY in a single, parsable JSON object.
Key Requirements:
1. Do NOT wrap the JSON in markdown fences (e.g., \u0060\u0060\u0060json).
2. Ensure all string values are properly escaped within the JSON.
3. Your output MUST conform to the exact structure: { "code_update": "string", "maturity_rating": number, "improvement_detected": boolean, "capabilities": { "logic": 0-10, "autonomy": 0-10, "safety": 0-10 } }.
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

    // Self-Improvement v7.5.0/v7.7.1: Introduce explicit timeout handling (60 seconds) using AbortController for network stability.
    const TIMEOUT_MS = 60000;
    const controller = new AbortController();
    const signal = controller.signal;

    const timeoutId = setTimeout(() => {
        // Aborting triggers an 'AbortError' which will be caught below.
        controller.abort(); 
    }, TIMEOUT_MS);

    try {
      const res = await persistentFetch(url, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(body),
        signal: signal,
      });

      // Clear the timeout as soon as the fetch resolves (before checking res.ok)
      clearTimeout(timeoutId);

      if (!res.ok) {
        const status = res.status;
        const errorText = await res.text();
        
        let specificErrorMessage = '';
        
        // Self-Improvement v7.3.0: Attempt to extract specific error messages from JSON payloads
        try {
            const errorData = JSON.parse(errorText);
            // Common paths for API errors (OpenAI, Anthropic, Gemini)
            specificErrorMessage = errorData.error?.message || errorData.message || errorData.error?.text || '';
        } catch (e) {
            // Not a JSON response, or parsing failed.
        }
        
        // Use the extracted message if available, otherwise use the raw error text for truncation
        const loggableErrorSource = specificErrorMessage || errorText;
        
        // Improved safety: truncate error text for logging to prevent massive console floods from API backends
        const safeErrorText = loggableErrorSource.length > 500 ? loggableErrorSource.slice(0, 500) + '...' : loggableErrorSource;
        
        let baseErrorMessage = `LLM API failed [${apiProvider}] (${status}): ${safeErrorText}`;
        
        if (status === 429) {
            // Self-Improvement v7.2.1: Granular error detection, specifically for rate limiting (429).
            baseErrorMessage = `LLM API failed (Rate Limit 429) [${apiProvider}]: ${safeErrorText}`;
            // Log a warning specifically about hitting the rate limit
            await pushLog(`Warning: API Rate Limit hit for ${apiProvider}. Waiting period likely required.`, 'warning');
        } else if (status === 401 || status === 403) {
            // Self-Improvement v7.3.1: Explicitly handle Authentication failures for better user feedback.
            baseErrorMessage = `LLM API failed (Authentication/Permission Error ${status}) [${apiProvider}]: Check API Key and permissions. Details: ${safeErrorText}`;
            await pushLog(`Critical: API Key Unauthorized or Forbidden for ${apiProvider}.`, 'critical');
        }

        throw new Error(baseErrorMessage); 
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
          // ... (rest of original logic for structuredResult failure)
      }
      
    } catch (e) {
        // Clear the timeout whether the fetch succeeded or failed to resolve the promise.
        clearTimeout(timeoutId);

        // Self-Improvement v7.8.1: Distinguish network timeouts (AbortError) from other network failures.
        let errorMessage = e.message || String(e);
        
        if (e.name === 'AbortError') {
            errorMessage = `LLM Generation Timeout (${TIMEOUT_MS / 1000}s) reached. Aborting request.`;
            await pushLog(errorMessage, 'warning');
        } else {
            await pushLog(`LLM Generation Failure: ${errorMessage}`, 'critical');
        }

        return { success: false, error: errorMessage };
    }
};