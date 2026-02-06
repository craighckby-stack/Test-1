import json
from jsonschema import validate, ValidationError

INTENT_SCHEMA_PATH = 'governance/M-01_Intent_Schema.json'

class IntentValidator:
    def __init__(self):
        with open(INTENT_SCHEMA_PATH, 'r') as f:
            self.schema = json.load(f)

    def validate_intent(self, intent_data: dict) -> bool:
        try:
            validate(instance=intent_data, schema=self.schema)
            return True
        except ValidationError as e:
            print(f"[IntentValidationError] Invalid Intent Structure: {e.message}")
            return False

    def normalize_intent(self, intent_data: dict) -> dict:
        # Placeholder for future transformation logic (e.g., setting defaults, coercing types)
        return intent_data
