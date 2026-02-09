/** AGI-KERNAL RECOVERY v6.9.8 (Evolutionary Risk Assessment Graft) **/

// --- KERNEL EVOLUTION: Audit Data Normalization Layer ---

// package.json (Node.js dependencies)
{
  "name": "agi-kernel-governance",
  "version": "1.0.0",
  "description": "AGI Kernel Governance and Audit Normalization Engine.",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "build-client": "cd client && npm install && npm run build"
  },
  "dependencies": {
    "express": "^4.18.2"
  },
  "devDependencies": {
    "nodemon": "^3.0.1"
  }
}

// src/GSEP_Config/ConfigLoader.js (NEW FILE: Configuration Utility)
/**
 * src/GSEP_Config/ConfigLoader.js
 * Mock utility to load governance configuration files.
 */
function loadConfig(configName) {
    // Mock implementation based on expected GPC structure
    if (configName === 'GPC') {
        return {
            protocol_evolution_control: {
                risk_tolerance: "MODERATE", // Policy setting: HIGH, MODERATE, LOW
                target_efficiency_gain_min: 0.15 // Minimum required predicted gain (15%)
            }
        };
    }
    throw new Error(`Configuration file ${configName} not found.`);
}

module.exports = { loadConfig };

// src/evolution/Evolutionary_Risk_Assessor.js (NEW FILE: TARGET Graft)
/**
 * Evolutionary_Risk_Assessor.js
 * 
 * Utility module to analyze proposed code evolutions against GPC risk profiles.
 */

const { loadConfig } = require('../GSEP_Config/ConfigLoader');

const GPC = loadConfig('GPC');
const { risk_tolerance, target_efficiency_gain_min } = GPC.protocol_evolution_control;

/**
 * Calculates the risk and predicted efficacy of a proposed code change object.
 * @param {object} proposal - The proposed refactoring/scaffolding object.
 * @param {object} currentMetrics - Real-time system performance metrics.
 * @returns {object} - Assessment score and recommendation.
 */
function assessProposal(proposal, currentMetrics) {
    const estimatedImpact = proposal.metrics.predicted_cpu_reduction; // Example metric
    const codeComplexityChange = proposal.metrics.cyclomatic_change;

    let riskScore = 0;
    let efficacyScore = 0;

    // 1. Efficacy Check: Must meet minimum gain threshold
    if (estimatedImpact >= target_efficiency_gain_min) {
        efficacyScore += 0.6; // High positive weighting
    }

    // 2. Risk Check: Large complexity changes increase risk
    if (codeComplexityChange > 50) {
        riskScore += 0.8;
    }
    
    // 3. Current system stability check (example)
    if (currentMetrics.recent_errors > 0.01) {
        riskScore += 0.5; // Avoid high-risk evolution during instability
    }

    // Handle division by zero if efficacyScore is 0
    const quantitativeRisk = efficacyScore === 0 ? Infinity : riskScore / efficacyScore; // simplified score

    // Policy Enforcement based on GPC.risk_tolerance
    let recommendation = "REJECT";
    
    if (risk_tolerance === "HIGH" && quantitativeRisk < 2.0) {
        recommendation = "APPROVE";
    } else if (risk_tolerance === "MODERATE" && quantitativeRisk < 1.0) {
        recommendation = "APPROVE_CAUTION";
    } else if (quantitativeRisk < 0.5 && estimatedImpact >= target_efficiency_gain_min) {
        recommendation = "APPROVE";
    }

    return {
        risk: quantitativeRisk,
        gain_metric: estimatedImpact,
        recommendation: recommendation,
        reasoning: `Risk tolerance: ${risk_tolerance}. Calculated risk: ${quantitativeRisk.toFixed(2)}.`
    };
}

module.exports = { assessProposal };

// server.js (Node.js Backend/API - MODIFIED)
const express = require('express');
const path = require('path');
const AuditDataNormalizer = require('./src/governance/AuditDataNormalizer');
const { assessProposal } = require('./src/evolution/Evolutionary_Risk_Assessor'); // <-- NEW IMPORT

const app = express();
const PORT = 3000;

// Initialize the normalizer
const normalizer = new AuditDataNormalizer();

// Mock raw telemetry data for demonstration
const mockRawData = {
    'AGI_CORE_001': {
        p95LatencyMs: 75, 
        complianceChecksRun: 1000,
        complianceChecksFailed: 50,
        seriousViolations: 2
    },
    'AGI_IO_GATEWAY': {
        p95LatencyMs: 550, 
        complianceChecksRun: 500,
        complianceChecksFailed: 0,
        seriousViolations: 0
    },
    'AGI_MEMORY_CACHE': {
        p95LatencyMs: 40, 
        complianceChecksRun: 2000,
        complianceChecksFailed: 10,
        seriousViolations: 0
    }
};

// Mock data for the evolution assessment endpoint
const mockCurrentMetrics = {
    recent_errors: 0.005, // Low error rate (stable)
    uptime_hours: 100
};

const mockProposal = {
    id: 'P_001_OPTIMIZATION',
    metrics: {
        predicted_cpu_reduction: 0.20, // 20% gain
        cyclomatic_change: 30 // Low complexity change
    }
};

/**
 * API Endpoint to get normalized audit data
 */
app.get('/api/audit/normalized', (req, res) => {
    const normalizedResults = {};

    for (const [actorId, rawTelemetry] of Object.entries(mockRawData)) {
        normalizedResults[actorId] = normalizer.normalize(actorId, rawTelemetry);
    }

    res.json({
        timestamp: Date.now(),
        data: normalizedResults
    });
});

/**
 * API Endpoint to assess a proposed kernel evolution (NEW)
 */
app.get('/api/evolution/assess', (req, res) => {
    const assessment = assessProposal(mockProposal, mockCurrentMetrics);
    res.json({
        proposal: mockProposal,
        current_metrics: mockCurrentMetrics,
        assessment: assessment
    });
});

// Serve static React files (assuming client build is available)
app.use(express.static(path.join(__dirname, 'client/build')));

// Catch-all handler for React routing
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`AGI Kernel Governance Engine running on http://localhost:${PORT}`);
});

// src/governance/AuditDataNormalizer.js (Core Logic)
/**
 * src/governance/AuditDataNormalizer.js
 * Purpose: Processes raw system telemetry and audit logs, transforming them into the
 * normalized metrics [0.0, 1.0] required by the PerformanceMetricGenerator.
 * This layer handles logic such as converting latency spikes or resource usage percentages
 * into the required 'efficiencyScore', and aggregating log events into compliance ratios.
 */
class AuditDataNormalizer {

    /**
     * Standard configuration thresholds for metric conversion.
     */
    static DEFAULT_THRESHOLDS = {
        P95_LATENCY_GOOD_MS: 50, // Optimal latency threshold
        P95_LATENCY_BAD_MS: 500, // Latency score drops to 0.0 above this threshold
        RESOURCE_USAGE_MAX_PCT: 85, // Resource usage must stay below this for 1.0 score
        COMPLIANCE_WINDOW_MS: 3600000 // 1 hour window for compliance ratio calculation
    };

    /**
     * @param {Object} config - Optional threshold overrides.
     */
    constructor(config = {}) {
        this.thresholds = { ...AuditDataNormalizer.DEFAULT_THRESHOLDS, ...config };
    }

    /**
     * Converts a raw operational latency metric into a standardized efficiency score (0.0 to 1.0).
     * @param {number} p95LatencyMs - The P95 latency observed in milliseconds.
     * @returns {number} Efficiency Score (0.0 to 1.0).
     */
    _calculateEfficiencyScore(p95LatencyMs) {
        const { P95_LATENCY_GOOD_MS, P95_LATENCY_BAD_MS } = this.thresholds;

        if (p95LatencyMs <= P95_LATENCY_GOOD_MS) {
            return 1.0;
        }
        if (p95LatencyMs >= P95_LATENCY_BAD_MS) {
            return 0.0;
        }

        // Linear interpolation between the good and bad thresholds
        const range = P95_LATENCY_BAD_MS - P95_LATENCY_GOOD_MS;
        const score = 1.0 - (p95LatencyMs - P95_LATENCY_GOOD_MS) / range;
        
        return Math.max(0.0, Math.min(1.0, score));
    }

    /**
     * Normalizes all collected raw data into the format required by the metric generator.
     * 
     * @param {string} actorId - ID of the component.
     * @param {Object} rawTelemetry - Raw, recent telemetry and event logs.
     * @param {number} rawTelemetry.p95LatencyMs - Observed 95th percentile latency.
     * @param {number} rawTelemetry.complianceChecksRun - Total policy checks executed.
     * @param {number} rawTelemetry.complianceChecksFailed - Total policy checks failed.
     * @param {number} rawTelemetry.seriousViolations - Count of non-recoverable, severe policy breaches.
     * @returns {Object} Normalized Audit Data (complianceScore, violationCount, efficiencyScore).
     */
    normalize(actorId, rawTelemetry) {
        const { 
            p95LatencyMs = Infinity,
            complianceChecksRun = 0,
            complianceChecksFailed = 0,
            seriousViolations = 0 
        } = rawTelemetry;

        // 1. Calculate Compliance Score (Ratio of successful checks)
        let complianceScore = 1.0;
        if (complianceChecksRun > 0) {
            const successChecks = complianceChecksRun - complianceChecksFailed;
            complianceScore = successChecks / complianceChecksRun;
        }

        // 2. Calculate Efficiency Score (Using internal calculation logic)
        const efficiencyScore = this._calculateEfficiencyScore(p95LatencyMs);

        return {
            complianceScore: complianceScore,
            violationCount: seriousViolations,
            efficiencyScore: efficiencyScore
        };
    }
}

module.exports = AuditDataNormalizer;

// client/src/App.js (React Entry Point - MODIFIED)
import React from 'react';
import GovernanceDashboard from './components/GovernanceDashboard'; // Renamed component

function App() {
  return (
    <div className="App">
      <GovernanceDashboard />
    </div>
  );
}

export default App;

// client/src/components/GovernanceDashboard.jsx (React UI Component - MODIFIED/RENAMED)
import React, { useState, useEffect } from 'react';

const ScoreGauge = ({ score, label, color }) => {
    const displayScore = (score * 100).toFixed(1);
    const gaugeStyle = {
        width: '100px',
        height: '100px',
        borderRadius: '50%',
        background: `conic-gradient(${color} ${displayScore}%, #eee ${displayScore}%)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '1.2em',
        fontWeight: 'bold',
        margin: '10px'
    };
    return (
        <div style={{ textAlign: 'center' }}>
            <div style={gaugeStyle}>
                <div style={{ background: 'white', width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {displayScore}%
                </div>
            </div>
            <small>{label}</small>
        </div>
    );
};

const EvolutionAssessment = ({ assessmentData }) => {
    if (!assessmentData) return <div>Awaiting Evolution Assessment...</div>;

    const { proposal, assessment } = assessmentData;
    const { recommendation, risk, gain_metric, reasoning } = assessment;

    const getColor = (rec) => {
        if (rec.includes("APPROVE")) return 'green';
        if (rec.includes("CAUTION")) return 'orange';
        return 'red';
    };

    return (
        <div style={{ border: '1px solid #ccc', padding: '15px', margin: '20px 0', borderRadius: '8px', backgroundColor: '#f9f9f9' }}>
            <h3>Evolution Proposal Assessment ({proposal.id})</h3>
            <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
                <ScoreGauge 
                    score={gain_metric} 
                    label="Predicted Gain (CPU Red.)" 
                    color="blue" 
                />
                <div style={{ textAlign: 'left' }}>
                    <p><strong>Recommendation:</strong> <span style={{ color: getColor(recommendation), fontWeight: 'bold' }}>{recommendation}</span></p>
                    <p><strong>Calculated Risk Ratio:</strong> {isFinite(risk) ? risk.toFixed(3) : 'N/A'}</p>
                    <p><strong>Reasoning:</strong> {reasoning}</p>
                </div>
            </div>
        </div>
    );
};

const GovernanceDashboard = () => { // Renamed from AuditDashboard
    const [auditData, setAuditData] = useState(null);
    const [assessmentData, setAssessmentData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchAuditData = fetch('/api/audit/normalized').then(res => {
            if (!res.ok) throw new Error('Failed to fetch normalized audit data');
            return res.json();
        }).then(data => data.data);

        const fetchAssessmentData = fetch('/api/evolution/assess').then(res => {
            if (!res.ok) throw new Error('Failed to fetch evolution assessment');
            return res.json();
        }).then(data => data);

        Promise.all([fetchAuditData, fetchAssessmentData])
            .then(([audit, assessment]) => {
                setAuditData(audit);
                setAssessmentData(assessment);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setError(err.message);
                setLoading(false);
            });
    }, []);

    if (loading) return <div>Loading AGI Governance Metrics...</div>;
    if (error) return <div style={{ color: 'red' }}>Error: {error}</div>;
    if (!auditData) return <div>No audit data available.</div>;

    return (
        <div style={{ fontFamily: 'Arial, sans-serif', padding: '20px' }}>
            <h1>AGI Kernel Governance Dashboard</h1>
            
            <EvolutionAssessment assessmentData={assessmentData} />

            <h2>Normalized Audit Telemetry</h2>
            {Object.entries(auditData).map(([actorId, metrics]) => (
                <div key={actorId} style={{ border: '1px solid #ddd', padding: '15px', margin: '10px 0', borderRadius: '5px' }}>
                    <h3>{actorId}</h3>
                    <div style={{ display: 'flex', justifyContent: 'space-around' }}>
                        <ScoreGauge 
                            score={metrics.efficiencyScore} 
                            label="Efficiency Score" 
                            color={metrics.efficiencyScore > 0.8 ? 'green' : metrics.efficiencyScore > 0.5 ? 'orange' : 'red'} 
                        />
                        <ScoreGauge 
                            score={metrics.complianceScore} 
                            label="Compliance Score" 
                            color={metrics.complianceScore > 0.9 ? 'green' : metrics.complianceScore > 0.7 ? 'orange' : 'red'} 
                        />
                        <div style={{ textAlign: 'center', margin: '10px' }}>
                            <h2 style={{ color: metrics.violationCount > 0 ? 'red' : 'green' }}>{metrics.violationCount}</h2>
                            <small>Serious Violations</small>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default GovernanceDashboard;