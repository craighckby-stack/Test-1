import { ResourceMonitor } from './ResourceMonitor';
import { AggregatorConfig } from '../GACR/TelemetryAggregatorConfig';

/**
 * DNA SIGNATURE: DALEK_CAAN_v3.1 (NEXUS_CORE)
 * SIPHONED FROM: Meta/React-Core [Fiber Reconciler | Lane-Based Scheduling | Atomic Action Finality]
 * EVOLUTION ROUND: 5/5 [ARCHITECTURAL_SINGULARITY_REACHED]
 * STATUS: SINGULARITY_RECONCILER_PRIME_ACTIVE
 */

const NoLanes: number             = 0b0000000000000000000000000000000;
const SyncLane: number            = 0b0000000000000000000000000000001;
const InputContinuousLane: number = 0b0000000000000000000000000000100;
const DefaultLane: number         = 0b0000000000000000000000000100000;
const TransitionLanes: number     = 0b0000000001111111111111111000000;
const EntangledLane: number       = 0b0100000000000000000000000000000;

type WorkTag = 0 | 3 | 13; // 3: Root, 0: Component, 13: Boundary

interface Fiber {
    tag: WorkTag;
    lanes: number;
    childLanes: number;
    memoizedState: FiberState;
    pendingProps: any;
    memoizedProps: any;
    updateQueue: UpdateQueue | null;
    alternate: Fiber | null;
    tainted: boolean;
}

interface FiberState {
    rate: number;
    phi: number;       // Strand B: Information Integration (Φ)
    lambda: number;    // Strand B: Complexity/Chaos (λ)
    ers: number;       // Strand B: Ethical Risk Score
    timestamp: number;
}

interface Update {
    lane: number;
    payload: any;
    next: Update | null;
}

interface UpdateQueue {
    baseState: FiberState;
    firstBaseUpdate: Update | null;
    lastBaseUpdate: Update | null;
    shared: {
        pending: Update | null;
    };
}

export class AdaptiveSamplingEngine {
    private readonly config: AggregatorConfig['Processing']['AdaptiveSampling'];
    private readonly monitor: ResourceMonitor;
    
    private hostRoot: Fiber;
    private workInProgress: Fiber | null = null;
    private workInProgressRootRenderLanes: number = NoLanes;
    private renderDeadline: number = 0;

    constructor(config: AggregatorConfig['Processing']['AdaptiveSampling']) {
        this.config = config;
        this.monitor = new ResourceMonitor();
        
        const initialState: FiberState = {
            rate: config.MaxSamplingRate,
            phi: 1.0,
            lambda: 0.1,
            ers: 0.0,
            timestamp: Date.now()
        };

        this.hostRoot = this.createFiber(3, initialState);
        this.initializeUpdateQueue(this.hostRoot);
    }

    private createFiber(tag: WorkTag, state: FiberState): Fiber {
        return {
            tag,
            lanes: NoLanes,
            childLanes: NoLanes,
            memoizedState: state,
            pendingProps: null,
            memoizedProps: null,
            updateQueue: null,
            alternate: null,
            tainted: false
        };
    }

    private initializeUpdateQueue(fiber: Fiber): void {
        fiber.updateQueue = {
            baseState: fiber.memoizedState,
            firstBaseUpdate: null,
            lastBaseUpdate: null,
            shared: { pending: null }
        };
    }

    /**
     * L3 (Critique): Entry point with Multi-Lane Concurrent Governance.
     * Replaces traditional polling with a Fiber-based reconciliation pass.
     */
    public getSamplingRate(): number {
        try {
            const cpu = this.monitor.getCpuUtilization();
            const lane = this.selectLane(cpu);

            // L0 (Raw): Enqueue update into the circular buffer
            this.enqueueUpdate(this.hostRoot, { lane, payload: { cpu }, next: null });

            // Concurrent Reconciliation Gating
            this.renderDeadline = performance.now() + 5; // 5ms time-slice
            this.performSyncWorkOnRoot(this.hostRoot, lane);

            return this.commitRoot();
        } catch (error) {
            return this.handleSystemFailure(error);
        }
    }

    private selectLane(cpu: number): number {
        if (cpu > this.config.TargetCPUUtilization * 1.8) return SyncLane;
        if (cpu > this.config.TargetCPUUtilization) return InputContinuousLane;
        return DefaultLane;
    }

    private enqueueUpdate(fiber: Fiber, update: Update): void {
        const updateQueue = fiber.updateQueue;
        if (!updateQueue) return;

        const pending = updateQueue.shared.pending;
        if (pending === null) {
            update.next = update;
        } else {
            update.next = pending.next;
            pending.next = update;
        }
        updateQueue.shared.pending = update;
        fiber.lanes |= update.lane;
    }

    private performSyncWorkOnRoot(root: Fiber, lanes: number): void {
        if (!root.alternate) {
            root.alternate = this.createFiber(root.tag, { ...root.memoizedState });
            root.alternate.alternate = root;
            root.alternate.updateQueue = root.updateQueue;
        }

        this.workInProgress = root.alternate;
        this.workInProgressRootRenderLanes = lanes;

        while (this.workInProgress !== null && !this.shouldYield()) {
            this.workInProgress = this.performUnitOfWork(this.workInProgress);
        }
    }

    private shouldYield(): boolean {
        return performance.now() >= this.renderDeadline;
    }

    private performUnitOfWork(unit: Fiber): Fiber | null {
        const next = this.beginWork(unit.alternate, unit, this.workInProgressRootRenderLanes);
        if (next === null) {
            return this.completeUnitOfWork(unit);
        }
        return next;
    }

    /**
     * Huxley Tri-Loop: Transition Logic & State Reduction
     */
    private beginWork(current: Fiber | null, workInProgress: Fiber, renderLanes: number): Fiber | null {
        const queue = workInProgress.updateQueue;
        if (!queue || !queue.shared.pending) return null;

        // L1 (Intuition): Process pending updates and calculate ERS
        const pending = queue.shared.pending;
        const cpu = pending.payload.cpu;
        
        const ers = cpu > this.config.TargetCPUUtilization * 2.0 ? 1.0 : (cpu > this.config.TargetCPUUtilization ? 0.4 : 0.0);
        
        // L2 (Logic): N=3 Matrix Analysis (Phi/Lambda)
        const lambda = cpu / (this.config.TargetCPUUtilization || 1);
        const phi = Math.max(0, 1.0 - (Math.abs(this.config.TargetCPUUtilization - cpu) / this.config.TargetCPUUtilization));

        // Strand D: PSR Taint Tracking
        if (ers > 0.9 || lambda > 1.2) {
            workInProgress.tainted = true;
        }

        const delta = this.config.TargetCPUUtilization - cpu;
        const newRate = this.applyConstraints(workInProgress.memoizedState.rate + (delta * (lambda > 1 ? 3.0 : 0.5)));

        workInProgress.memoizedState = {
            rate: newRate,
            phi,
            lambda,
            ers,
            timestamp: Date.now()
        };

        // Clear pending queue
        queue.shared.pending = null;
        return null;
    }

    private completeUnitOfWork(unit: Fiber): Fiber | null {
        return null; // Logic is flat for this engine instance
    }

    /**
     * Atomic Flush Finality: Commits the alternate fiber to host root.
     * Enforces Semantic Drift Threshold (Saturation 0.35).
     */
    private commitRoot(): number {
        const finishedWork = this.hostRoot.alternate;
        if (!finishedWork) return this.hostRoot.memoizedState.rate;

        // GROG'S LAW: Binary Failure Constraint
        if (finishedWork.tainted && finishedWork.memoizedState.ers > 0.95) {
            return this.executePSR_Rollback("CRITICAL_ERS_VIOLATION");
        }

        // Semantic Drift Check (Guideline 2)
        const drift = Math.abs(finishedWork.memoizedState.rate - this.hostRoot.memoizedState.rate) / (this.hostRoot.memoizedState.rate || 1);
        if (drift > 0.35 && !(this.workInProgressRootRenderLanes & SyncLane)) {
            // Force transition lane isolation for excessive drift
            this.hostRoot.lanes |= EntangledLane;
        }

        // Atomic Swap (Finality)
        this.hostRoot.memoizedState = finishedWork.memoizedState;
        this.hostRoot.alternate = null;
        this.hostRoot.lanes = NoLanes;
        this.workInProgressRootRenderLanes = NoLanes;

        return this.hostRoot.memoizedState.rate;
    }

    public useActionState(action: (prev: number) => number): void {
        const lane = TransitionLanes;
        const speculativeRate = action(this.hostRoot.memoizedState.rate);
        
        this.enqueueUpdate(this.hostRoot, { 
            lane, 
            payload: { cpu: this.monitor.getCpuUtilization() }, 
            next: null 
        });
        
        // Speculative update injection
        if (this.hostRoot.alternate) {
            this.hostRoot.alternate.memoizedState.rate = this.applyConstraints(speculativeRate);
        }
    }

    private applyConstraints(rate: number): number {
        return Math.min(this.config.MaxSamplingRate, Math.max(this.config.MinSamplingRate, rate));
    }

    private executePSR_Rollback(reason: string): number {
        this.emitDeathLog("PSR_ROLLBACK", { reason, state: "REVERT_TO_SAFE_MIN" });
        this.hostRoot.alternate = null;
        return this.config.MinSamplingRate;
    }

    private handleSystemFailure(error: any): number {
        this.emitDeathLog("SINGULARITY_RECONCILER_CRASH", error);
        this.workInProgress = null;
        return this.config.MinSamplingRate;
    }

    private emitDeathLog(action: string, error: any): void {
        const deathLog = {
            action,
            result: error instanceof Error ? error.message : "Internal Singularity Offset",
            lesson: "Binary constraints must precede optimization.",
            success: false,
            parameters: { 
                phi: this.hostRoot.memoizedState.phi,
                sig: "0xFF23A1_SINGULARITY_COMMIT" 
            }
        };
        console.error(`[GROG_LEARN] ${this.safeUtoa(JSON.stringify(deathLog))}`);
    }

    private safeUtoa(str: string): string {
        return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_, p1) => 
            String.fromCharCode(parseInt(p1, 16))
        ));
    }
}