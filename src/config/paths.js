declare const CanonicalPathConfigurationUtility: {
    getPaths: (args: { root?: string }) => {
        ARTIFACT_ROOT: string;
        STAGING_PATH: string;
        QUARANTINE_PATH: string;
    }
};

/**
 * Delegates path resolution to the core path configuration utility.
 * Paths are resolved relative to the current working directory.
 */
const paths = CanonicalPathConfigurationUtility.getPaths({
    root: process.cwd() 
});

module.exports = paths;