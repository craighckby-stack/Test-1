from typing import Protocol, List, Dict, Optional, Any, Union, runtime_checkable
from enum import IntEnum

# --- GACR/interfaces/S0_Platform_I.py (DALEK_CAAN v3.1 - Round 2/5) ---
# Siphoning Meta/React-Core Concurrent Fiber and ISO/IEC 29500 (OOXML) Indirection.

class Lane(IntEnum):
    """React-Siphon: Bitmask for scheduling priority (Fiber Lanes)."""
    SYNC = 0b00001
    INPUT_CONTINUOUS = 0b00010
    DEFAULT = 0b00100
    TRANSITION = 0b01000
    IDLE = 0b10000

RelationshipID = str # Indirection pointer (rId) to external parts or keys

@runtime_checkable
class FiberNode(Protocol):
    """
    React-Siphon: The atomic unit of work for concurrent platform reconciliation.
    Maintains the 'work-in-progress' tree vs 'current' tree (alternate).
    """
    tag: int
    lanes: Lane
    child_lanes: Lane
    alternate: Optional['FiberNode']
    memoized_state: Any
    update_queue: List[Any]

@runtime_checkable
class CascadingProperties(Protocol):
    """DNA Pattern: 3. Cascading Inheritance Style Logic (Styles.xml)."""
    def resolve(self, key: str, rId_style: Optional[RelationshipID] = None) -> Any:
        """Inheritance: docDefaults -> abstractStyle -> local_rPr (Run Properties)."""
        ...

class CRACryptoInterface(Protocol):
    """
    Siphons: React Concurrent priority + OOXML Relationship Mapping.
    """
    def dispatch_verify(
        self, 
        payload_rid: RelationshipID, 
        signature_rid: RelationshipID, 
        lane: Lane = Lane.DEFAULT
    ) -> FiberNode:
        """
        Non-blocking verification. Uses rId indirection to fetch artifacts 
        from the platform container manifest.
        """
        ...

    def get_public_key(self, rId: RelationshipID) -> bytes:
        """Trace rId to Relationship Layer to resolve cryptographic material."""
        ...

class HIPAHardwareInterface(Protocol):
    """
    Siphons: React Hydration/Suspense + OOXML Semantic Atomization.
    """
    def hydrate(self, dehydrated_part_rid: RelationshipID) -> bool:
        """Syncs hardware state with session; equivalent to React Fiber hydration."""
        ...

    def yield_if_congested(self, lane: Lane) -> bool:
        """Concurrent Logic: Yields execution if a higher-priority lane has pending work."""
        ...

    def get_atomized_telemetry(self) -> List[Dict[str, Any]]:
        """
        Semantic Atomization: Returns telemetry in 'Runs' (inline) 
        contained within 'Paragraphs' (block-level state).
        """
        ...

class NetSecInterface(Protocol):
    """
    Siphons: OOXML Container-Part Pattern (Modular URI Addressing).
    """
    def open_part_stream(self, part_uri: str, mce_ignorable: List[str]) -> Any:
        """
        Opens a connection to a platform part using Namespace-driven extensibility.
        Processes 'Ignorable' logic markers to maintain backwards compatibility.
        """
        ...

class S0PlatformPackage(Protocol):
    """
    Macro-Architecture: The 'Container-Part' Pattern (ISO/IEC 29500).
    Acts as the 'word/document.xml' root for Nexus Platform interactions.
    """
    crypto: CRACryptoInterface
    hardware: HIPAHardwareInterface
    network: NetSecInterface
    
    # Indirection Dependency Layer (_rels/.rels mapping)
    relationships: Dict[RelationshipID, Dict[str, str]]
    # Global Configuration Object (word/settings.xml)
    settings: Dict[str, Any]

    def resolve_rid(self, rid: RelationshipID) -> str:
        """DNA Pattern: 2. Trace Relationship ID to Target URI."""
        ...

    def request_reconciliation(self, root_fiber: FiberNode, lane: Lane) -> None:
        """
        React-Siphon: Triggers the Fiber scheduler to reconcile platform 
        state updates across the concurrent lane priority.
        """
        ...

    def get_doc_defaults(self) -> CascadingProperties:
        """Retrieves root enforcement defaults for the cascading property tree."""
        ...