# 1.0 CONFIGURATION GENERATION AND DEPLOYMENT UTILITY (CGDU) SPECIFICATION (v98.1)

## 1.1 Mandate & Role
CGDU's primary function is to provide deterministic, cryptographic aggregation and bundling of Immutable Configuration Artifacts (ICAs) to generate the verifiable Config State Root (CSR) hash. This ensures integrity across the deployment lifecycle.

## 1.2 Governing Agents & Integration
*   **Governing Agent(s):** CRoT (Signing Authority), GAX (Input Provisioning Layer).
*   **Integration Point:** Must execute atomically and conclude immediately prior to the commencement of the GSEP-C Stage S00 (Trust Anchoring Phase).

## 2.0 INPUT ARTIFACTS (ICAs)
CGDU requires strictly read-only access to the final, integrity-checked versions of the following three artifacts. Input ordering is fixed for deterministic CSR generation:

| Order | Alias | Description | Required Format |
|-------|-------|-------------|-----------------|
| 1     | `ACVD` | Axiomatic Constraint Vector Definition | JSON/YAML (Source) |
| 2     | `FASV` | Final Axiomatic State Validation Schema | JSON/YAML (Source) |
| 3     | `EPB`  | Execution Parameter Blueprint | JSON/YAML (Source) |

## 3.0 EXECUTION & CSR GENERATION PROCESS

The CGDU pipeline adheres to the following sequence (T+0 required execution time):

### 3.1 Standardization (Canonical Serialization)
Each input artifact (ACVD, FASV, EPB) must be converted into a canonical byte stream using the mandated Canonical Configuration Definition Enforcement Utility (CCDEU). This enforces:
*   Standard UTF-8 encoding.
*   Lexicographical sorting of all keys within objects.
*   Zero indentation and omission of trailing whitespace.
*   Specific Type Coercion (e.g., integer normalization).

### 3.2 Aggregation & Concatenation
The three canonical byte streams are aggregated and concatenated linearly in the specified fixed order: `Stream(1) + Stream(2) + Stream(3)`.

### 3.3 Hashing (CSR Generation)
The resulting total concatenated byte stream is fed into the mandated cryptographic primitive: SHA3-512. The output is the single, immutable `CSR` hash.

## 4.0 OUTPUT AND POST-EXECUTION

### 4.1 Output Artifact
*   **Name:** `CSR (Config State Root)`
*   **Format:** 128-character Hexadecimal string.
*   **Destination:** Delivered directly to CRoT for official cryptographic signing and Trust Anchoring during GSEP-C Stage S00.

### 4.2 Security & Purge Mandate
1.  **Verification Log:** A single, non-mutable audit log entry detailing input path hashes and the final CSR is recorded to the TCB (Trusted Compute Base).
2.  **Purge:** The active CGDU execution container and all associated temporary memory buffers are immediately purged from the environment following successful delivery of the CSR and verification log completion.