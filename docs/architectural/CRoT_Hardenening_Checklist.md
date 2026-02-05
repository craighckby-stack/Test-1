# CRoT Hardware and Cryptographic Hardening Checklist V94.3

This checklist serves as the operational baseline for establishing the Root of Trust (CRoT) components, essential for enforcing Integrity Halts (IH) and successful execution of GSEP-C Stages S0 and S10. Failure to meet these criteria constitutes an IH state and prevents system initialization (S0).

## 1.0 Trust Anchoring and Key Management

- [ ] 1.1 **Physical Security Module (PSM) Setup:** Mandating use of certified Hardware Security Module (HSM) for all master signing keys.
- [ ] 1.2 **CRoT Master Key Generation:** Generation and secure storage of the asymmetric CRoT Signing Key (CSK) within the PSM, ensuring non-exportable status.
- [ ] 1.3 **Key Rotation Policy Enforcement:** Automated policy configuration for mandated CSK rotation intervals.
- [ ] 1.4 **Anti-Tamper Provisioning:** Configuration and testing of PSM self-destruct/reset triggers upon physical tamper detection (HETM compliance).

## 2.0 Integrity Monitoring and Attestation

- [ ] 2.1 **System Baseline Capture (S0):** Verification that the system image hash aligns with the last known good configuration (LGC) stored externally.
- [ ] 2.2 **Trusted Boot Chain:** Implementation and verification of hardware-level secure boot protocols, ensuring BIOS/UEFI integrity check on startup.
- [ ] 2.3 **State Commitment Integrity (S10):** Verification of sufficient PSM entropy resources for cryptographic commitment signing of the Certified State Transition Ledger (CSTL) and Governance State Manifest (GSM).

## 3.0 Operational Security

- [ ] 3.1 **Role Separation (CRoT Operator):** Strict network and logical segmentation of CRoT components from SGS and GAX processing environments.
- [ ] 3.2 **Audit Logging System (IH Log):** Secure, write-once, read-only external persistence mechanism established for IH log storage, segregated from standard RRP/STANDARD logs (TVCR).