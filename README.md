# ServiceNow GRC Risk Scoring

> Portfolio project: original code with synthetic data. See [DISCLAIMER.md](DISCLAIMER.md).

Automated risk scoring for ServiceNow IRM/GRC: inherent and residual risk
with evidence-based control credit and risk appetite checks, plus vendor
risk tiering from an intake questionnaire.

## What's inside
| Path | ServiceNow artifact | What it does |
|---|---|---|
| `src/script_includes/RiskScoringEngine.js` | Script Include | Inherent/residual score, ratings, control credit with evidence age, appetite breach |
| `src/script_includes/VendorRiskTiering.js` | Script Include | Questionnaire score -> tier, assessment depth, reassessment cycle, forced Tier 1 rules |
| `src/business_rules/sn_risk_risk_calculate_scores.js` | Business Rule | Recalculates scores and raises an appetite-breach event |
| `src/scheduled_jobs/vendor_reassessment_due.js` | Scheduled Job | Flags vendors due for reassessment |
| `docs/design.md` | — | Scoring rules, tiers, custom fields |

## Example
```
RSK001 Unpatched internet-facing servers  L4 x I5 = 20 critical
  CTL010 effective (50%), CTL011 partially effective (25% of the rest) -> 63% reduction
  residual 8 medium, cyber appetite 8 -> within appetite

RSK002 Manual journal entries without review  L3 x I4 = 12 high
  CTL020 last tested 2024-11-30 -> evidence too old, not counted
  residual 12 high
```

## Run the tests
```
node --test
```

## Status
Logic is unit tested; platform scripts are being validated on a Personal
Developer Instance.
