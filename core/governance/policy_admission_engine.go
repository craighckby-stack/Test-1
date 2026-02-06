package governance

import (
	"encoding/json"
	"fmt"
	"os"
)

// PolicyAdmissionEngine is responsible for ingesting isolation manifests and evaluating workload requests against defined policies.
// Refinement: Policies are stored as a map for O(1) lookup.
type PolicyAdmissionEngine struct {
	ManifestPath string
	Policies     map[string]IsolationPolicy
}

// manifestWrapper assists in decoding the expected V2.0-POLI-STRUCT schema.
type manifestWrapper struct {
	SchemaVersion string            `json:"schema_version"`
	Policies      []IsolationPolicy `json:"policies"`
}

// NewPolicyAdmissionEngine loads the manifest and initializes the engine.
func NewPolicyAdmissionEngine(path string) (*PolicyAdmissionEngine, error) {
	data, err := os.ReadFile(path) // Replaced deprecated ioutil.ReadFile
	if err != nil {
		return nil, fmt.Errorf("failed to read isolation manifest at %s: %w", path, err)
	}

	var wrapper manifestWrapper
	if err := json.Unmarshal(data, &wrapper); err != nil {
		return nil, fmt.Errorf("failed to parse policy manifest JSON: %w", err)
	}

	if wrapper.SchemaVersion != "V2.0-POLI-STRUCT" {
		return nil, fmt.tErrorf("unsupported policy manifest schema version: %s", wrapper.SchemaVersion)
	}

	policyMap := make(map[string]IsolationPolicy)
	for _, policy := range wrapper.Policies {
		policyMap[policy.ID] = policy
	}

	// Policies are now concretely loaded, mapped for efficiency.
	return &PolicyAdmissionEngine{
		ManifestPath: path,
		Policies:     policyMap,
	}, nil
}

// EvaluateRequest checks if the requested policy_id (e.g., L5_Hardware_Enclave) can be supported on the target hardware context.
// Policy types (IsolationPolicy, SystemContext) must be defined in policy_types.go.
func (pae *PolicyAdmissionEngine) EvaluateRequest(policyID string, context SystemContext) (bool, error) {
	policy, ok := pae.Policies[policyID]
	if !ok {
		return false, fmt.Errorf("requested policy ID '%s' not found in manifest", policyID)
	}

	// Evaluate constraints against the SystemContext
	for _, constraint := range policy.Constraints {
		satisfied := false

		switch constraint.Key {
		case "Hardware.TEE_Support":
			if context.Hardware.TEE_Support == constraint.Required {
				satisfied = true
			}
		case "Hardware.SR_IOV_Enabled":
			if context.Hardware.SR_IOV_Enabled == constraint.Required {
				satisfied = true
			}
		// Future case: Logic for version checks and CPES configuration parsing would expand here.
		default:
			// If a mandatory constraint key is unrecognized, admission must fail to ensure integrity.
			return false, fmt.Errorf("unhandled or unsupported constraint key '%s' required by policy %s", constraint.Key, policyID)
		}

		if !satisfied {
			return false, fmt.Errorf("policy '%s' admission failed: constraint '%s' (Required: %t) not met by system context", policyID, constraint.Key, constraint.Required)
		}
	}

	return true, nil
}