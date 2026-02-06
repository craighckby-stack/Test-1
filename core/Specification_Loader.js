import fs from 'fs';
import path from 'path';

/**
 * Specification Loader Service: Manages the loading, parsing, and version control 
 * of XEL Specifications (including component schemas).
 * 
 * Decouples schema I/O and configuration management from the real-time validation logic.
 */
class SpecificationLoader {
    constructor(specPath = path.resolve(process.cwd(), 'config/XEL_Specification.json')) {
        this.specPath = specPath;
        this.specification = null;
        this.loadSpecification();
    }

    loadSpecification() {
        try {
            const data = fs.readFileSync(this.specPath, 'utf8');
            this.specification = JSON.parse(data);
            console.log("XEL Specification loaded successfully.");
        } catch (error) {
            console.error(`FATAL: Failed to load XEL Specification from ${this.specPath}. System may be unstable.`, error.message);
            // Provide a fallback empty structure to prevent immediate crash
            this.specification = { ComponentSchemas: {} }; 
        }
    }

    getComponentSchemas() {
        if (!this.specification || !this.specification.ComponentSchemas) {
            throw new Error("Specifications not initialized or ComponentSchemas missing.");
        }
        return this.specification.ComponentSchemas;
    }

    // FUTURE: Implement checkSpecificationVersion(v), hotReload(newPath), validateSelf()...
}

export default new SpecificationLoader();