package config

import (
	"time"
)

// TelemetryConfig defines the generalized configuration necessary for STS operation.
// These values drive the Generalized Anomaly Threshold Model (GATM).
type TelemetryConfig struct {
	Enabled          bool          `json:"enabled" yaml:"enabled"`
	MonitorInterval  time.Duration `json:"monitor_interval" yaml:"monitor_interval"`

	// GATM Thresholds
	S9LatencyThreshold  float64 `json:"s9_latency_threshold" yaml:"s9_latency_threshold"`   // Max S9 Commit latency (seconds)
	ResourceLoadThreshold float64 `json:"resource_load_threshold" yaml:"resource_load_threshold"` // Max allowed Resource Load (0.0 to 1.0)
	GATMMaxBreaches     int     `json:"gatm_max_breaches" yaml:"gatm_max_breaches"`         // Threshold for persistent breaches before RRP/SIH escalation

	// Endpoint Configurations (Placeholder)
	MetricsEndpoint string `json:"metrics_endpoint" yaml:"metrics_endpoint"` // Source for raw metrics collection
}

// LoadTelemetryConfig loads the configuration for the STS. 
// This function would typically handle reading settings from environment variables, files, or a Consul/Vault registry.
func LoadTelemetryConfig() (*TelemetryConfig, error) {
	// Placeholder: Implement configuration loading utility (e.g., using Viper, or custom YAML unmarshaling)
	return &TelemetryConfig{
		Enabled: true,
		MonitorInterval:  5 * time.Second,
		S9LatencyThreshold:  0.8, 
		ResourceLoadThreshold: 0.95,
		GATMMaxBreaches:     5,
		MetricsEndpoint: "http://system.monitord:9090/metrics",
	}, nil
}