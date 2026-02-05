class SIHM_ExecutionEngine:
    """Isolated runtime engine for executing System Integrity Halt Manifest directives."""

    def __init__(self, isolation_context):
        self.context = isolation_context
        self.commands = CommandRegistry.get_isolated_commands()

    def execute_manifest(self, manifest_data):
        plan = manifest_data.get('response_plan', [])
        # Sorts commands to ensure strict priority sequence
        plan.sort(key=lambda x: x['priority_level'], reverse=True)

        for directive in plan:
            cmd_str = directive['command']
            params = directive.get('parameters', {})
            
            if self.context.check_status(directive.get('required_status')):
                if cmd_str in self.commands:
                    result = self.commands[cmd_str].execute(**params)
                    self.context.log_action(directive['sequence_id'], result)
                else:
                    self.context.log_error(f"Unknown command: {cmd_str}")
            else:
                self.context.log_skip(f"Status requirement failed for {cmd_str}")

# Note: CommandRegistry and isolation_context are external dependencies within the SIKM/SIM environment.