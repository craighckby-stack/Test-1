import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// We declare the tool interface which encapsulates the environment loading logic.
// This tool is defined below in the 'plugin' section.
declare const EnvironmentConfigLoader: {
    execute: (args: { path: typeof path, fs: typeof fs, dotenv: typeof dotenv, env: NodeJS.ProcessEnv, cwd: string }) => { loaded: boolean, messages: string[] };
};

/**
 * loadEnvironment
 * Delegates environment loading to the dedicated EnvironmentConfigLoader tool.
 * This ensures standardized handling of .env file precedence (specific before general).
 */
export function loadEnvironment(): void {
    // Pass necessary Node APIs (path, fs, dotenv) to the vanilla JS plugin execution environment
    try {
        const result = EnvironmentConfigLoader.execute({
            path,
            fs,
            dotenv,
            env: process.env,
            cwd: process.cwd()
        });
    
        result.messages.forEach(msg => {
            // The plugin prefixes warnings with 'Warning: '
            if (msg.startsWith('Warning:')) {
                console.warn(`[Config Loader] ${msg.substring(9).trim()}`);
            } else {
                console.log(`[Config Loader] ${msg}`);
            }
        });

    } catch (e) {
        // Fallback or critical error handling if the plugin fails to execute
        console.error("[Config Loader] Critical error during environment loading using plugin:", e);
    }
}
