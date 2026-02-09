        if (status === 429) {
            // Self-Improvement v7.2.1: Granular error detection, specifically for rate limiting (429).
            baseErrorMessage = `LLM API failed (Rate Limit 429) [${apiProvider}]: ${safeErrorText}`;
            await pushLog(baseErrorMessage, 'warning'); 
        } else {
            // General failure (500, etc.)
            await pushLog(baseErrorMessage, 'critical');
        }

        return { success: false, error: baseErrorMessage };
      }

      // --- Success Path ---
      let apiData;
      try {
          // Attempt to parse the API response JSON object first
          // parseResponse functions expect the full API JSON object (data) to extract the content string.
          apiData = await res.json();
      } catch (e) {
          await pushLog('LLM Generation Error: Failed to parse API response body as JSON.', 'error');
          return { success: false, error: 'Failed to parse API response body.' };
      }
      
      let rawContent = parseResponse(apiData);

      if (rawContent) {
        // Self-Improvement v7.9.0: Robust JSON Sanitization. 
        // Despite critical instructions, LLMs sometimes wrap the JSON in markdown fences (, ).
        // Clean the output to ensure the downstream parser receives a pure JSON string, greatly enhancing reliability.
        const sanitizeResponse = (text) => {
          text = text.trim();
          // Use a non-greedy regex match to find and strip surrounding fences (, , etc.)
          // Captures content (group 2) between triple backticks, allowing for optional language tag (group 1).
          const match = text.match(/^\s*`{3}(\w*\s*)?([\s\S]*?)`{3}\s*$/);
          if (match) {
             return match[2].trim(); 
          }
          return text;
        };
        
        rawContent = sanitizeResponse(rawContent);
        
        await pushLog(`Successfully received content (Sanitized: ${rawContent.length} chars).`, 'debug');
        return { success: true, content: rawContent };
      }

      // Handle successful API call but empty/unparsable content
      await pushLog('LLM Generation Error: API returned success but content was empty or unparsable via provider logic.', 'error');
      return { success: false, error: 'Empty content response from LLM.' };

    } catch (error) {
        clearTimeout(timeoutId); // Ensure timeout is cleared even on fetch rejection

        if (error.name === 'AbortError') {
            await pushLog(`LLM Generation Error: Request timed out after ${TIMEOUT_MS / 1000} seconds.`, 'critical');
            return { success: false, error: 'Request Timeout.' };
        }
        
        // Handle general network errors, DNS failures, connection resets, etc.
        await pushLog(`LLM Generation Error: Network or request failure: ${error.message}`, 'critical');
        return { success: false, error: `Network/Request failure: ${error.message}` };
    }