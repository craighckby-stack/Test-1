# S08 Transition Efficacy & Metric Measure (TEMM) Specification

## 1.0 CORE DEFINITION & CONSTRAINTS

The Transition Efficacy & Metric Measure (TEMM, denoted $\Delta\Psi$) is the mandatory artifact generated during GSEP-C Stage S08, quantifying the projected utility gain of a proposed state transition ($\text{ST}_n \to \text{ST}_{n+1}$). 

TEMM MUST be a normalized scalar value constrained within the Unit Interval: $\Delta\Psi \in [0.0, 1.0]$.

## 2.0 CALCULATION MANDATE (TEMM Formula)

TEMM is calculated as the weighted arithmetic mean of three independently scored Efficacy Vectors ($V_i$).

$$\Delta\Psi = \frac{1}{\sum_{i=1}^{3} W_i} \sum_{i=1}^{3} (V_i \times W_i)$$

Where:
1. $V_i$: The pre-normalized efficacy vector score ($\in [0.0, 1.0]$), mandated by Section 3.0.
2. $W_i$: The Policy Weight associated with $V_i$, sourced from Section 4.0.

## 3.0 MANDATED EFFICACY VECTORS ($V_i$)

All vector scores $V_i$ must adhere to the $[0.0, 1.0]$ normalization constraint. The calculation requires independent inputs from the following source interfaces:

| Vector | Internal ID | Definition | Input Source (Mandatory Interface) | Derived Metric Goal |
|:---:|:---:|:---|:---:|:---:|
| V1 (Goal Alignment Score) | $\text{GHS}_{\text{score}}$ | Measures acceleration projection towards highest-priority objectives via GHT traversal. | System Objective Registry (SOR) | Maximize Objective Proximity |
| V2 (Resource Efficiency Score) | $\text{RES}_{\text{score}}$ | Measures the optimized ratio of expected utility increase versus computational resource overhead (CPU/Memory Delta). | Runtime Resource Manager (RRM) | Maximize Overhead ROI |
| V3 (System Resilience Score) | $\text{SRS}_{\text{score}}$ | Measures the calculated retention of system stability and inverse exposure to known failure domains, where $\text{SRS}_{\text{score}} = 1 - \text{ECS}$. | Stability Audit Engine (SAE) | Minimize Induced Entropy |

*Note: For V3, the Stability Audit Engine (SAE) must output $\text{SRS}_{\text{score}}$ after inverting its inherent Entropy/Complexity Score (ECS $\in [0.0, 1.0]$) such that high complexity yields a low positive efficacy score.* 

## 4.0 POLICY WEIGHTING ($W_i$)

### 4.1 Configuration Source
Weights $W_1, W_2, W_3$ MUST be read from the immutable configuration artifact `config/acvd_policy_schema.json` under the dedicated schema key `temm_efficacy_weights`.

### 4.2 Weight Constraints
Individual weights $W_i$ MUST be non-negative real numbers ($\in \mathbb{R}_{\ge 0}$). These weights are synthesized during the initial CSR (S01) and are immutable throughout the GSEP-C lifecycle.