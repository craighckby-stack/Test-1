# S08 Transition Efficacy & Metric Measure (TEMM) Specification

## 1.0 PURPOSE
This specification defines the mandatory methodology and calculation parameters utilized by the State Governance Subsystem (SGS) to generate the TEMM ($\Delta\Psi$) artifact during GSEP-C Stage S08. TEMM quantifies the expected utility increase of the proposed state transition, crucial for Axiom I resolution.

## 2.0 CALCULATION MANDATE
TEMM must be a normalized scalar value $\in [0.0, 1.0]$. The calculation requires assessing three fundamental efficacy vectors (V1, V2, V3).

$$\text{TEMM} = \frac{1}{\sum W} \sum_{i=1}^{3} (V_i \times W_i)$$

Where $V_i$ is the Vector Score and $W_i$ is the Policy Weight.

### 2.1 Efficacy Vectors

| Vector | Definition | Calculation Scope | Mandatory Input Source |
|:---:|:---:|:---|:---:|
| V1 (Goal Alignment) | Measures proximity acceleration towards primary system objective state. | Goal Hierarchy Tree (GHT) Traversal | System Objective Registry (SOR) |
| V2 (Resource Delta) | Inverse measure of resource consumption overhead vs. transition magnitude. | Compute and Memory Delta | Runtime Resource Manager (RRM) |
| V3 (Stability Impact) | Measure of induced complexity or potential failure domain exposure. | Entropy/Complexity Score (ECS) | Stability Audit Engine (SAE) |

## 3.0 POLICY WEIGHTING (W)
The policy weights $W_1, W_2, W_3$ MUST be explicitly defined in the ACVD `config/acvd_policy_schema.json` under the key `temm_efficacy_weights`. These weights are locked into the CSR (S01) and cannot be modified during the GSEP-C lifecycle.