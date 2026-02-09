use crate::core::security::CRoT; 
use std::time::{Instant, SystemTime, UNIX_EPOCH, Duration};

// --- Configuration Constants & Types ---
pub const INTEGRITY_HASH_SIZE: usize = 64; // Standard size for high-assurance (e.g., SHA-512)
pub type IntegrityHash = [u8; INTEGRITY_HASH_SIZE];

// Target maximum execution time for atomicity (5ms)
const MAX_SNAPSHOT_DURATION: Duration = Duration::from_micros(5000);
const RSCM_PACKAGE_VERSION: u16 = 1; // Initial version for tracking structural evolution

// --- Trait Definitions for Dependency Injection ---

/// Abstract API for system-level data capture. Enforces temporal requirements.
pub trait SystemCaptureAPI: Send + Sync + 'static {
    /// Checks for necessary execution privileges (e.g., kernel mode, specific capabilities).
    fn check_privilege() -> bool;
    
    /// Retrieves a high-resolution system timestamp (Epoch nanoseconds). 
    /// Implementations should prioritize monotonic and high-speed clock reading.
    fn get_current_epoch_ns() -> u64 {
        // Default uses std::time, custom implementations should use raw registers.
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
#[derive(Debug, Clone, Default)] // Added Clone and Default for infrastructural flexibility
pub struct RscmPackage {
    pub capture_version: u16, // New field to track package structural version
    pub absolute_capture_ts_epoch_ns: u64,
    pub capture_latency_ns: u64,
    pub integrity_hash: IntegrityHash, // Changed from String to fixed-size array
    pub volatile_memory_dump: Vec<u8>,
    pub stack_trace: String,
    pub context_flags: u32,
}

#[derive(Debug)]
pub enum SnapshotError {
    PrivilegeRequired,
    MemoryCaptureFailed,
    Timeout { actual_duration_ns: u64 }, // Enhanced error to include performance data
    IntegrityHashingFailed,
    HashingOutputMismatch { expected: usize, actual: usize }, // Enhanced error for verification
}

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
    // 0x42: GSEP-C flag | High bits could be used for minor configuration versions later.
    let context_flags: u32 = 0x42; 

    // Use CRoT implementation tailored for fixed-output integrity
    let mut hasher = CRoT::new_hasher_fixed_output(INTEGRITY_HASH_SIZE)
        .map_err(|_| SnapshotError::IntegrityHashingFailed)?;

    // Hash sequence: Data, Trace, Context, Version
    hasher.update(&vm_dump);
    hasher.update(trace.as_bytes());
hasher.update(&context_flags.to_le_bytes()); 
hasher.update(&RSCM_PACKAGE_VERSION.to_le_bytes()); // Ensure version is included in the hash computation
    
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

    // 4. Final RSCM object creation
    Ok(RscmPackage {
        capture_version: RSCM_PACKAGE_VERSION,
        absolute_capture_ts_epoch_ns: absolute_ts,
        capture_latency_ns: latency_ns as u64,
        integrity_hash,
        volatile_memory_dump: vm_dump,
        stack_trace: trace,
        context_flags,
    })
}