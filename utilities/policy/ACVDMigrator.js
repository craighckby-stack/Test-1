/**
 * ACVDMigrator
 * Responsible for handling version normalization and migration of Axiomatic Constraint 
 * Vector Definitions (ACVDs) to ensure backward compatibility and alignment 
 * with the current operational schema version.
 */
class ACVDMigrator {

    // Define migration steps indexed by the target version
    static #MIGRATION_STEPS = {
        // Example Migration Path: from version 0.9 to 1.0
        1.0: (oldACVD) => {
            // Perform necessary transformations (e.g., renaming fields, setting new defaults)
            if (!oldACVD.parameters.CFTM) {
                oldACVD.parameters.CFTM = 0.5; // Set default for newly required field
            }
            oldACVD.metadata.version = 1.0; // Update version number
            return oldACVD;
        }
        // Add more versions as schema evolves...
    };

    /**
     * Migrates an ACVD object to the latest supported version.
     * This ensures policy continuity across system upgrades.
     * @param {Object} acvd - The potentially outdated ACVD object.
     * @param {number} targetVersion - The schema version to migrate towards (usually the system's current version).
     * @returns {Object} The migrated ACVD object.
     * @throws {Error} if migration path is invalid or version is unsupported.
     */
    static migrate(acvd, targetVersion) {
        let currentVersion = acvd.metadata?.version || 0.0;
        let currentPolicy = { ...acvd };

        if (currentVersion >= targetVersion) {
            // Already at or above the target version (rare but possible during hotfixes)
            return currentPolicy;
        }

        const supportedVersions = Object.keys(ACVDMigrator.#MIGRATION_STEPS).map(parseFloat).sort((a, b) => a - b);
        
        for (const version of supportedVersions) {
            if (version > currentVersion && version <= targetVersion) {
                const migrator = ACVDMigrator.#MIGRATION_STEPS[version];
                if (typeof migrator === 'function') {
                    console.log(`ACVD Migration: Applying changes for version ${version}...`);
                    currentPolicy = migrator(currentPolicy);
                } else {
                    throw new Error(`ACVD Migration Error: Missing migration function for version ${version}.`);
                }
            }
        }

        if (currentPolicy.metadata.version !== targetVersion) {
             throw new Error(`ACVD Migration Failed: Could not reach target version ${targetVersion} starting from ${acvd.metadata?.version}.`);
        }

        return currentPolicy;
    }
}

module.exports = ACVDMigrator;
