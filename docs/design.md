# Design notes

## Scoring
| Step | Rule |
|---|---|
| Inherent | likelihood (1-5) x impact (1-5) |
| Control credit | effective 50%, partially effective 25%, ineffective / not tested 0% |
| Stale evidence | a control last tested over 365 days ago counts as not tested |
| Combining controls | each control reduces what is left: two effective controls = 75%, not 100% |
| Cap | total reduction capped at 80%; residual never below 1 |
| Ratings | 20+ critical, 12+ high, 6+ medium, else low |
| Appetite | residual above the category limit (system property JSON) raises an event |

Compounding and the cap stop a long list of controls from making a risk
look negligible, and the evidence-age rule ties the score to actual testing.

## Vendor tiering
| Tier | Score | Assessment | Reassess |
|---|---|---|---|
| 1 | 60+ or forced | Full security assessment + audit | 12 months |
| 2 | 30-59 | Standard questionnaire + evidence | 24 months |
| 3 | 0-29 | Lite questionnaire | 36 months |

Forced Tier 1: customer PII without a SOC 2 report; privileged access to a
business-critical system.

## Custom fields
`sn_risk_risk`: u_likelihood, u_impact, u_inherent_score, u_inherent_rating,
u_residual_score, u_residual_rating, u_appetite_breach.
Control: u_design_effectiveness, u_last_tested.
Vendor (`core_company`): u_risk_tier, u_next_assessment.
