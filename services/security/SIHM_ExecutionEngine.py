import typing
from typing import Dict, Any, List, TYPE_CHECKING

# Forward declarations for external components (ensures clean imports)
if TYPE_CHECKING:
    # Assuming these types exist in related services
    from .SIHM_CommandResult import SIHM_CommandResult

    class Context:
        def check_status(self, required_status: str) -> bool: ...
        def log_action(self, sequence_id: str, result: typing.Union[str, 'SIHM_CommandResult']) -> None: ...
        def log_error(self, message: str) -> None: ...
        def log_skip(self, message: str) -> None: ...
        def log_critical(self, message: str) -> None: ...

    class CommandRegistry:
        def get_isolated_commands(self) -> Dict[str, Any]: ...


class SIHM_ExecutionEngine:
    """
    Isolated runtime engine for executing System Integrity Halt Manifest directives.
    Employs robust priority queuing, state checks, failure propagation, and exception handling.
    """

    def __init__(self, isolation_context: 'Context', command_registry: 'CommandRegistry'):
        # Context and Command Registry are injected dependencies for testability and lifecycle management.
        self.context = isolation_context
        self.commands: Dict[str, Any] = command_registry.get_isolated_commands()
        self.registry = command_registry

    def execute_manifest(self, manifest_data: Dict[str, Any]) -> bool:
        """
        Executes the provided SIHM manifest response plan in strict priority order.
        Returns True if execution completed successfully without mandatory halting.
        """
        response_plan: List[Dict[str, Any]] = manifest_data.get('response_plan', [])

        if not response_plan:
            self.context.log_action("N/A", "Manifest provided no response plan. Exiting early.")
            return True
            
        # 1. Structural Sort: Ensures strict adherence to critical priority levels.
        try:
            # Use .get with a default priority (0) for robustness against poorly formed manifests
            response_plan.sort(key=lambda x: x.get('priority_level', 0), reverse=True)
        except TypeError:
            self.context.log_critical("Manifest plan contains invalid priority_level types. Halting initialization.")
            return False

        manifest_execution_success = True
        
        for directive in response_plan:
            cmd_str = directive.get('command')
            sequence_id = directive.get('sequence_id', 'SEQ_UNKNOWN')
            required_status = directive.get('required_status')
            params = directive.get('parameters', {})
            # Critical Safety Feature: Determines if command failure necessitates immediate sequence halt
            halt_on_failure = directive.get('halt_on_failure', False) 

            if not cmd_str:
                self.context.log_error(f"Directive ID {sequence_id} is missing a 'command' identifier. Skipping.")
                continue

            # 2. Context Status Check
            if required_status and not self.context.check_status(required_status):
                self.context.log_skip(f"Status requirement failure ({required_status}) for '{cmd_str}' ({sequence_id}).")
                continue

            # 3. Execution
            if cmd_str not in self.commands:
                self.context.log_error(f"Unknown SIHM command: '{cmd_str}' ({sequence_id}). Skipping execution.")
                continue

            try:
                command_handler = self.commands[cmd_str]
                # Expects a structured result (SIHM_CommandResult) defined in scaffolding
                result = command_handler.execute(**params)
                
                self.context.log_action(sequence_id, result)

                # 4. Failure Propagation (Requires structured result object)
                if hasattr(result, 'success') and result.success is False:
                    self.context.log_error(f"Command failure: '{cmd_str}' ({sequence_id}). Message: {getattr(result, 'message', 'No details')}")
                    
                    if halt_on_failure:
                        self.context.log_critical(f"CRITICAL HALT: Sequence terminated due to mandatory halt on failure for '{cmd_str}'.")
                        manifest_execution_success = False
                        break 
                
            except Exception as e:
                # Catch runtime/system exceptions during command invocation
                self.context.log_critical(f"FATAL EXCEPTION during '{cmd_str}' ({sequence_id}): {type(e).__name__}: {str(e)}")
                manifest_execution_success = False
                if halt_on_failure:
                    break 
                    
        return manifest_execution_success