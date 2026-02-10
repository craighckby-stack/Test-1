/**
 * @file AxiomStageConstants.ts
 * @description Provides strictly typed and frozen canonical stage identifiers
 *              for the Sovereign AGI Governance Pipeline (CRoT).
 * Derived from config/schemas/AxiomStageIDs.schema.json (V94.1).
 */

export type StageID =
  | 'S0'
  | 'S1'
  | 'S2'
  | 'S3'
  | 'S4'
  | 'S4_5'
  | 'S6_5'
  | 'S8'
  | 'S9'
  | 'S10'
  | 'S11';

export interface StageDefinition {
  name: string;
  description: string;
}

/**
 * Utility function derived from the RecursiveConstantFreezer tool logic
 * to ensure deep immutability of constant definitions.
 */
const deepFreeze = <T>(obj: T): Readonly<T> => {
    if (obj && typeof obj === 'object' && obj !== null && !Object.isFrozen(obj)) {
        Object.getOwnPropertyNames(obj).forEach(prop => {
            const val = (obj as any)[prop];
            if (typeof val === 'object' && val !== null && !Object.isFrozen(val)) {
                deepFreeze(val);
            }
        });
        return Object.freeze(obj) as Readonly<T>;
    }
    return obj as Readonly<T>;
};

export const AXIOM_STAGES: Readonly<Record<StageID, Readonly<StageDefinition>>> = deepFreeze({
  S0: {
    name: "Initialization",
    description: "Transition commencement and ID generation."
  },
  S1: {
    name: "State Certification",
    description: "Certified input state artifact (Psi_N) hashing and commitment."
  },
  S2: {
    name: "Cost Modeling",
    description: "Execution of S02 Cost/Failure Profile Assessment."
  },
  S3: {
    name: "Policy Veto Gate",
    description: "Policy Compliance Verification."
  },
  S4: {
    name: "Stability Veto Gate",
    description: "Stability Analysis and Dynamic Range Check."
  },
  S4_5: {
    name: "Context Attestation",
    description: "Validation of external and environmental context parameters."
  },
  S6_5: {
    name: "Behavioral Divergence Veto",
    description: "Check against known divergence signatures and anomalous behavior."
  },
  S8: {
    name: "Axiom Execution (P-01)",
    description: "GAX computes P-01 decision (Utility > Cost + Epsilon)."
  },
  S9: {
    name: "NRALS Logging",
    description: "SGS records the transition outcome in the Non-Repudiable Audit Log System (NRALS)."
  },
  S10: {
    name: "GICM Finalization",
    description: "CRoT signs the Governance Inter-Agent Commitment Manifest (GICM)."
  },
  S11: {
    name: "State Commit",
    description: "Commitment of the next state artifact (Psi_N+1) prior to execution."
  }
});

/**
 * A strictly ordered array of all canonical Stage IDs.
 */
export const AXIOM_STAGE_IDS: ReadonlyArray<StageID> = deepFreeze(
    Object.keys(AXIOM_STAGES) as StageID[]
);
