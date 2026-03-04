from typing import Protocol, List, Dict, Optional, Any, Union, runtime_checkable
from enum import IntEnum

# --- GACR/interfaces/S0_Platform_I.py (DALEK_CAAN v3.1 - Round 3/5) ---
# Siphoning Meta/React-Core Scheduler (Lanes/Entanglement) & ISO/IEC 29500 (OOXML) State Machine.

class Lane(IntEnum):
    """React-Siphon: Priority bitmask incorporating VSEC lane mapping."""
    SYNC = 0b00001
    INPUT_CONTINUOUS = 0b00010
    DEFAULT = 0b00100
    TRANSITION = 0b01000
    IDLE = 0b10000
    ENTANGLED = 0b11111 # Cross-lane dependency mask

RelationshipID = str # Indirection pointer (rId) mapping to URI or Component Part

@runtime_checkable
class FiberNode(Protocol):
    """
    React-Siphon: Atomic unit of platform work.
    Siphons Fiber v18/19 'Alternate' tree & 'Entanglement' logic.
    """
    tag: int
    lane_mask: Lane
    entangled_mask: Lane
    expiration_ms: int
    dehydrated: bool
    alternate: Optional['FiberNode']
    memoized_state: Any
    update_queue: List[Any]

@runtime_checkable
class CascadingProperties(Protocol):
    """DNA Pattern 3: Recursive Inheritance (Styles.xml Logic)."""
    def resolve_flattened(self, rid_chain: List[RelationshipID]) -> Dict[str, Any]:
        """Resolves docDefaults -> Abstract -> Instance -> Local Override (rPr/pPr)."""
        ...

@runtime_checkable
class NumberingState(Protocol):
    """DNA Pattern 5: Abstract vs. Instance State Machine (Numbering.xml)."""
    def get_instance_counter(self, abstract_num_id: str, num_id: str) -> int:
        """Manages sequential state across decoupled platform components."""
        ...

    def synchronize_state(self, sequence_rid: RelationshipID) -> None:
        """Synchronizes the 'num' instance with the 'abstractNum' definition."""
        ...

class CRACryptoInterface(Protocol):
    """Siphons: React Concurrent priority + OOXML RID Indirection."""
    def dispatch_verify(
        self, 
        payload_rid: RelationshipID, 
        signature_rid: RelationshipID, 
        lane: Lane = Lane.DEFAULT
    ) -> FiberNode:
        """Indirection-based verification; returns a work-in-progress Fiber."""
        ...

    def get_key_material(self, rId: RelationshipID) -> bytes:
        """Traces Relationship ID to internal/external security parts."""
        ...

class HIPAHardwareInterface(Protocol):
    """Siphons: React Suspense/Hydration + Semantic Atomization (Paragraph/Run)."""
    def hydrate_boundary(self, rId: RelationshipID, fallback_rId: RelationshipID) -> bool:
        """React-Siphon: Syncs hardware state; triggers 'Suspense' fallback on failure."""
        ...

    def yield_to_scheduler(self, lane: Lane) -> bool:
        """Concurrency: Checks if high-priority lanes (Sync/Input) require the core."""
        ...

    def telemetry_stream(self) -> List[Dict[str, Union[str, Dict[str, Any]]]]:
        """
        Semantic Atomization: Returns telemetry formatted as 'Paragraphs' (block)
        containing multiple 'Runs' (atomized inline telemetry points).
        """
        ...

class NetSecInterface(Protocol):
    """Siphons: OOXML MCE (Markup Compatibility) & URI Addressing."""
    def request_part(self, uri: str, namespaces: Dict[str, str]) -> Any:
        """URI-driven part acquisition with explicit XML Namespace alignment."""
        ...

    def process_mce_ignorable(self, payload: Any, ignorable_tags: List[str]) -> Any:
        """Filters logic based on version-compatibility 'Ignorable' markers."""
        ...

class S0PlatformPackage(Protocol):
    """
    Macro-Architecture: Container-Part Pattern (ISO/IEC 29500).
    Orchestrates the platform 'Package' (Archive) and 'Parts' (Modules).
    """
    crypto: CRACryptoInterface
    hardware: HIPAHardwareInterface
    network: NetSecInterface
    
    # Indirection Layer (_rels/.rels) and Global Settings (settings.xml)
    relationships: Dict[RelationshipID, Dict[str, str]]
    settings: Dict[str, Any]
    state_machine: NumberingState

    def resolve_indirection(self, rId: RelationshipID) -> str:
        """DNA Pattern 2: Trace rId to Target URI via relationship manifest."""
        ...

    def reconcile(self, work_fiber: FiberNode, lane: Lane) -> None:
        """React-Siphon: Fiber-loop reconciliation of platform state."""
        ...

    def get_cascading_defaults(self) -> CascadingProperties:
        """Retrieves 'docDefaults' for property inheritance resolution."""
        ...