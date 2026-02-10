import { DependencyLookupUtility } from '@core/DependencyLookupUtility';
import { PolicyExecutionEngine } from '@governance/PolicyExecutionEngine';
// Assume the extracted tool is available via the kernel's plugin system
import { StageSequenceExecutor } from '@plugins/StageSequenceExecutor';

// Constants defining lifecycle stages
const LIFECYCLE_STATES = {
    INIT: 'INIT',
    STARTING: 'STARTING',
    RUNNING: 'RUNNING',
    DEPRECATION_STAGING: 'DEPRECATION_STAGING',
    RETIREMENT_PREP: 'RETIREMENT_PREP',
    RETIRED: 'RETIRED',
    ERROR: 'ERROR'
};

/**
 * Manages the transition and execution flow for a component's lifecycle,
 * utilizing a dedicated dependency router and sequential stage execution.
 * Focuses on handling non-reversible system modifications through staged processes.
 */
class ComponentLifecycleActuator {
    private componentId: string;
    private currentState: string;
    private dependencyResolver: DependencyLookupUtility;
    private stageExecutor: StageSequenceExecutor;

    constructor(componentId: string) {
        this.componentId = componentId;
        this.currentState = LIFECYCLE_STATES.INIT;
        // Using existing plugin for dependency routing/lookup, adhering to SRP
        this.dependencyResolver = new DependencyLookupUtility(); 
        // Using the newly extracted tool for synchronous management of async stages
        this.stageExecutor = new StageSequenceExecutor(); 
    }

    /**
     * Attempts a state transition, managing asynchronous stages synchronously.
     * Handles non-reversible system modifications (Deprecation/Retirement).
     * @param targetState The state to transition to.
     */
    public async transitionTo(targetState: string): Promise<void> {
        console.log(`[${this.componentId}] Transitioning from ${this.currentState} to ${targetState}`);

        if (this.currentState === LIFECYCLE_STATES.RETIRED) {
            throw new Error(`Component ${this.componentId} is retired and cannot transition.`);
        }

        const previousState = this.currentState;
        
        try {
            switch (targetState) {
                case LIFECYCLE_STATES.STARTING:
                    await this._executeStartingStage();
                    this.currentState = LIFECYCLE_STATES.RUNNING;
                    break;

                case LIFECYCLE_STATES.DEPRECATION_STAGING:
                    // Step 1: Governance check for non-reversible action
                    await this._verifyDeprecationPolicy();
                    // Step 2: Execute stages
                    await this._executeDeprecationStage();
                    this.currentState = LIFECYCLE_STATES.DEPRECATION_STAGING;
                    break;

                case LIFECYCLE_STATES.RETIRED:
                    // Critical non-reversible action execution
                    await this._executeRetirementStage();
                    this.currentState = LIFECYCLE_STATES.RETIRED;
                    break;
                
                default:
                    throw new Error(`Unknown or invalid target state: ${targetState}`);
            }
            console.log(`[${this.componentId}] Transition complete. New state: ${this.currentState}`);

        } catch (e) {
            this.currentState = LIFECYCLE_STATES.ERROR;
            console.error(`Transition failed for ${this.componentId} (reverting from ${previousState}):`, e);
            throw e;
        }
    }

    private async _verifyDeprecationPolicy(): Promise<void> {
        // Uses policy engine dependency resolution (via DependencyLookupUtility)
        const policyEngine = this.dependencyResolver.getDependency<PolicyExecutionEngine>('PolicyExecutionEngine');
        
        const compliance = await policyEngine.checkPolicy(this.componentId, 'STAGED_DEPRECATION_MANDATE'); 
        
        if (!compliance) {
            throw new Error("Mandated policy violation detected for staged deprecation.");
        }
    }

    /**
     * Executes the sequence required to bring the component online.
     */
    private async _executeStartingStage(): Promise<void> {
        const initializer = this.dependencyResolver.getDependency('ComponentInitializer');

        await this.stageExecutor.execute(`Startup_${this.componentId}`, [
            { name: 'LoadConfiguration', task: async () => { /* load config logic */ } },
            { name: 'InitializeDependencies', task: async () => { /* init dependencies logic */ } },
            { name: 'RunSetupHooks', task: () => initializer.runSetup(this.componentId) }
        ]);
    }

    /**
     * Executes the sequence for staged deprecation (non-reversible soft stop).
     */
    private async _executeDeprecationStage(): Promise<void> {
        const retirementService = this.dependencyResolver.getDependency('RetirementService');

        await this.stageExecutor.execute(`Deprecation_${this.componentId}`, [
            { name: 'HaltIngress', task: async () => { /* stop new requests */ } },
            { name: 'DrainQueues', task: async () => { /* gracefully handle existing tasks */ } },
            { name: 'NotifyConsumers', task: () => retirementService.stageDeprecation(this.componentId) }
        ]);
    }

    /**
     * Executes the sequence for final retirement (non-reversible hard stop/cleanup).
     */
    private async _executeRetirementStage(): Promise<void> {
        const dbCleaner = this.dependencyResolver.getDependency('DatabaseCleaner');
        const assetManager = this.dependencyResolver.getDependency('AssetDecommissioner');

        await this.stageExecutor.execute(`Retirement_${this.componentId}`, [
            { name: 'ShutdownProcesses', task: async () => { /* force shutdown remaining instances */ } },
            { name: 'DecommissionAssets', task: () => assetManager.decommission(this.componentId) },
            { name: 'DatabaseCleanup', task: () => dbCleaner.removeRecords(this.componentId) }
        ]);
    }
}

export { ComponentLifecycleActuator, LIFECYCLE_STATES };