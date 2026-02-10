use crate::core::security::CRoT; 
use std::time::{Instant, SystemTime, UNIX_EPOCH, Duration};
use std::fmt;

// --- Configuration Constants & Types ---
pub const INTEGRITY_HASH_SIZE: usize = 64; // Standard size for high-assurance (e.g., SHA-512)
pub type IntegrityHash = [u8; INTEGRITY_HASH_SIZE];

// Target maximum execution time for atomicity (5ms)
const MAX_SNAPSHOT_DURATION: Duration = Duration::from_micros(5000);
const RSCM_PACKAGE_VERSION: u16 = 1; // Initial version for tracking structural evolution
const CONTEXT_FLAG_GSEP_C: u32 = 0x42; // General System Execution Policy - Confidentiality Flag

// AGI Improvement: Added explicit identifier for the cryptographic hash protocol used.
// This aids external validation and architectural memory.
const HASHING_PROTOCOL_ID: u8 = 0x01; // 0x01 signifies fixed-output SHA-512 based hash implemented via CRoT

// --- Trait Definitions for Dependency Injection ---

/// Abstract API for system-level data capture. Enforces temporal requirements.
pub trait SystemCaptureAPI: Send + Sync + 'static {
    /// Checks for necessary execution privileges (e.g., kernel mode, specific capabilities).
    fn check_privilege() -> bool;
    
    /// Retrieves a high-resolution system timestamp (Epoch nanoseconds). 
    /// Implementations should prioritize monotonic and high-speed clock reading.
    /// NOTE: For kernel/secure environments, this default implementation using SystemTime 
    /// must be replaced with hardware-backed clock access for true temporal integrity.
    fn get_current_epoch_ns() -> u64 {
        SystemTime::now().duration_since(UNIX_EPOCH)
            .unwrap_or_default()
            .as_nanos() as u64
    }
    
    /// Performs low-level, atomic memory capture of predefined volatile regions.
    fn capture_volatile_memory() -> Result<Vec<u8>, ()>;
    
    /// Captures the execution stack trace quickly.
    fn capture_execution_stack() -> String;
}

// Defines the output structure for the immutable state capture
#[derive(Debug, Clone)] 
pub struct RscmPackage {
    capture_version: u16, 
    absolute_capture_ts_epoch_ns: u64,
    capture_latency_ns: u64,
    integrity_hash: IntegrityHash, 
    volatile_memory_dump: Vec<u8>,
    stack_trace: String,
    context_flags: u32,
    // AGI Improvement: Store the Hashing Protocol ID within the package itself 
    // for self-contained validation context.
    hashing_protocol_id: u8,
}

impl RscmPackage {
    // Constructor used exclusively by the generator function
    fn new(
        absolute_ts: u64,
        latency_ns: u64,
        hash: IntegrityHash,
        vm_dump: Vec<u8>,
        trace: String,
        context_flags: u32,
        hashing_protocol_id: u8, // Added new parameter
    ) -> Self {
        RscmPackage {
            capture_version: RSCM_PACKAGE_VERSION,
            absolute_capture_ts_epoch_ns: absolute_ts,
            capture_latency_ns: latency_ns,
            integrity_hash: hash,
            volatile_memory_dump: vm_dump,
            stack_trace: trace,
            context_flags,
            hashing_protocol_id, // Assigned
        }
    }

    // Public accessors for reading critical metadata
    pub fn capture_version(&self) -> u16 { self.capture_version }
    pub fn absolute_capture_ts_epoch_ns(&self) -> u64 { self.absolute_capture_ts_epoch_ns }
    pub fn capture_latency_ns(&self) -> u64 { self.capture_latency_ns }
    pub fn context_flags(&self) -> u32 { self.context_flags }
    pub fn hashing_protocol_id(&self) -> u8 { self.hashing_protocol_id } // New accessor
    
    // Controlled accessors for sensitive data
    pub fn integrity_hash(&self) -> &IntegrityHash { &self.integrity_hash }
    pub fn volatile_memory_dump(&self) -> &[u8] { self.volatile_memory_dump }
    pub fn stack_trace(&self) -> &str { self.stack_trace }
}


#[derive(Debug)]
pub enum SnapshotError {
    PrivilegeRequired,
    MemoryCaptureFailed,
    Timeout { actual_duration_ns: u64 }, // Enhanced error to include performance data
    IntegrityHashingFailed,
    HashingOutputMismatch { expected: usize, actual: usize }, // Enhanced error for verification
    // AGI Improvement: Added error variant for structural mismatch, critical for integrity
    MetadataEncodingFailed, 
}

// Implementation for standardized error handling (AGI Logic Improvement)
impl fmt::Display for SnapshotError {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        match self {
            SnapshotError::PrivilegeRequired => write!(f, "Privilege required to perform atomic snapshot."),
            SnapshotError::MemoryCaptureFailed => write!(f, "Low-level memory capture failed."),
            SnapshotError::Timeout { actual_duration_ns } => write!(f, "Snapshot exceeded temporal constraint (5ms). Actual latency: {} ns.", actual_duration_ns),
            SnapshotError::IntegrityHashingFailed => write!(f, "Cryptographic integrity hashing failed."),
            SnapshotError::HashingOutputMismatch { expected, actual } => write!(f, "Integrity hash size mismatch. Expected {} bytes, got {} bytes.", expected, actual),
            SnapshotError::MetadataEncodingFailed => write!(f, "Failed to encode critical metadata components for hashing."),
        }
    }
}

impl std::error::Error for SnapshotError {}

/// Generates an immutable, temporally constrained state snapshot (RSCM Package).
/// Requires a specific implementation of SystemCaptureAPI for its environment.
/// Note: Assumes CRoT implements AtomicHasherFactory for fixed-output hashing.
pub fn generate_rscm_snapshot<T: SystemCaptureAPI>() -> Result<RscmPackage, SnapshotError> {
    let start_time = Instant::now();

    // 1. Privilege and time check
    if !T::check_privilege() {
        return Err(SnapshotError::PrivilegeRequired);
    }

    let absolute_ts = T::get_current_epoch_ns();
    
    // 2. Perform atomic read of key memory regions
    let vm_dump = T::capture_volatile_memory().map_err(|_| SnapshotError::MemoryCaptureFailed)?;
    let trace = T::capture_execution_stack();

    // 3. Assemble and cryptographic hash generation
    let context_flags: u32 = CONTEXT_FLAG_GSEP_C; 

    // Use CRoT implementation tailored for fixed-output integrity
    let mut hasher = CRoT::new_hasher_fixed_output(INTEGRITY_HASH_SIZE)
        .map_err(|_| SnapshotError::IntegrityHashingFailed)?; 

    // --- Integrity Hashing Protocol (Enhanced & Formalized) ---
    // Note: The order of hashing inputs MUST remain fixed for integrity verification.
    // 1. Volatile Data (Largest and most critical)
    // 2. Stack Trace (Execution context)
    // 3. Absolute Capture Timestamp (Crucial temporal metadata)
    // 4. Context Flags (Security metadata)
    // 5. Package Version (Structural integrity)
    // 6. Hashing Protocol ID (Self-verification context)
    
    hasher.update(&vm_dump);
    hasher.update(trace.as_bytes());
    
    // Ensure metadata encoding doesn't panic if it somehow fails (though unlikely for primitives)
    let ts_bytes = absolute_ts.to_le_bytes();
    let context_bytes = context_flags.to_le_bytes();
    let version_bytes = RSCM_PACKAGE_VERSION.to_le_bytes();
    let protocol_bytes = HASHING_PROTOCOL_ID.to_le_bytes(); // u8 conversion

    // AGI Logic Improvement: Ensure byte counts match expectations for fixed-size primitives
    if ts_bytes.len() != 8 || context_bytes.len() != 4 || version_bytes.len() != 2 || protocol_bytes.len() != 1 {
        return Err(SnapshotError::MetadataEncodingFailed);
    }
    
    hasher.update(&ts_bytes);
    hasher.update(&context_bytes); 
    hasher.update(&version_bytes);
    
    // AGI Improvement: Include the HASHING_PROTOCOL_ID in the integrity calculation
    hasher.update(&protocol_bytes); 
    
    let raw_hash = hasher.finalize().map_err(|_| SnapshotError::IntegrityHashingFailed)?; 

    // 3.1. Validate hash integrity size
    if raw_hash.len() != INTEGRITY_HASH_SIZE {
        return Err(SnapshotError::HashingOutputMismatch { 
            expected: INTEGRITY_HASH_SIZE, 
            actual: raw_hash.len() 
        });
    }

    let mut integrity_hash: IntegrityHash = [0; INTEGRITY_HASH_SIZE];
    integrity_hash.copy_from_slice(&raw_hash);
    
    let duration = start_time.elapsed();
    let latency_ns = duration.as_nanos();

    if duration > MAX_SNAPSHOT_DURATION {
        // Failure to meet temporal constraint (5ms max)
        return Err(SnapshotError::Timeout { actual_duration_ns: latency_ns as u64 });
    }

    // 4. Final RSCM object creation using the controlled constructor
    Ok(RscmPackage::new(
        absolute_ts,
        latency_ns as u64,
        integrity_hash,
        vm_dump,
        trace,
        context_flags,
        HASHING_PROTOCOL_ID, // Passed the new required metadata field
    ))
}