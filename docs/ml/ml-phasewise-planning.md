# EsportM ML Phasewise Planning

## Purpose

This document defines how machine learning should be applied in EsportM without overbuilding too early.

EsportM already has an AI module with these paid features:

- AI performance insights
- AI schedule suggestions
- AI skill analysis
- AI recommendations
- Context-aware assistant

The current backend implementation is mostly deterministic scoring with an OpenAI-powered assistant fallback. The recommended path is to improve this in phases: first make the existing AI reliable, then add structured predictions, then train real ML models once enough historical club data is available.

## Product Principle

Use ML to support club admins, coaches, physios, nutritionists, and players. Do not let ML automatically make final decisions for medical, lineup, payment, or administrative workflows.

Recommended wording in the product:

```txt
AI suggestions are decision-support insights. Club staff remain responsible for final decisions.
```

## ML Feature Areas

### 1. Performance Insights

Goal:

```txt
Identify player form, team trends, top performers, and declining metrics.
```

Data sources:

- Match records
- Player match stats
- Minutes played
- Goals and assists
- Yellow/red cards
- Squad and position data
- Dashboard analytics entries

Outputs:

- Player performance score
- Form trend
- Top improvers
- Underperforming players
- Team-level trend summary

Recommended first version:

```txt
Weighted statistical scoring, not trained ML.
```

### 2. Skill Analysis

Goal:

```txt
Estimate strengths and weaknesses per player and across the squad.
```

Data sources:

- Player match stats
- Minutes per match
- Goals per 90
- Assists per 90
- Cards per match
- Position data

Outputs:

- Finishing score
- Creation score
- Endurance score
- Discipline score
- Overall skill score

Recommended first version:

```txt
Keep the current score model, then improve weights over time.
```

### 3. Readiness And Injury-Risk Support

Goal:

```txt
Detect workload/readiness risk before training or match decisions.
```

Data sources:

- Wellness entries
- Readiness score
- Energy level
- Soreness level
- Sleep hours
- Training load entries
- Active injury records
- Match congestion

Outputs:

- Readiness risk score
- Workload warning
- Recovery recommendation
- Player availability warning

Important safety note:

```txt
Do not present this as medical diagnosis. Present it as workload/readiness support.
```

### 4. Schedule Suggestions

Goal:

```txt
Recommend training intensity and recovery days based on upcoming load.
```

Data sources:

- Upcoming matches
- Schedule events
- Training load entries
- Active injuries
- Readiness data
- Open operational tasks

Outputs:

- Matchday
- Recovery
- Light training
- Intensive training
- Reason for suggestion

Recommended behavior:

```txt
Staff must manually apply or edit suggestions.
```

### 5. AI Recommendations

Goal:

```txt
Generate prioritized operational and performance recommendations.
```

Data sources:

- Performance insights
- Injury/readiness signals
- Schedule load
- Club tasks
- Messages
- Dashboard analytics

Outputs:

- Priority
- Category
- Confidence
- Impact score
- Reason
- Recommended action

Recommended first version:

```txt
Rule-based ranking with explainable reasons.
```

### 6. Context-Aware Assistant

Goal:

```txt
Let users ask questions about live club data.
```

Data sources:

- AI insights payload
- Club summary
- Performance summaries
- Risk/readiness summaries
- Schedule suggestions
- Recommendations

Outputs:

- Natural-language answer
- Role-specific explanation
- Suggested next actions

Recommended provider:

```txt
OpenAI or another LLM provider, with rule-based fallback.
```

## Phase 1: Stabilize Existing AI

Objective:

```txt
Make the current AI module reliable, explainable, billable, and safe.
```

Work items:

- Keep existing AI endpoints.
- Add AI request counting against plan limits.
- Add an AI usage log table.
- Store request type, club ID, user ID, response mode, model, token estimate, and timestamp.
- Add clearer fallback behavior when OpenAI is unavailable.
- Add tests for all AI endpoints.
- Make pricing plan enforcement consistent with AI request allowance.

Deliverables:

- AI usage tracking
- AI endpoint tests
- Reliable fallback responses
- Admin-visible usage summary

Success criteria:

- Professional plan gets 250 AI requests/month.
- Elite plan gets 1,500 AI requests/month.
- Free and Starter plans cannot use AI unless add-ons are introduced.
- AI endpoint failures do not break the dashboard.

## Phase 2: Structured Prediction Without Trained Models

Objective:

```txt
Improve AI value using explainable scoring models before training ML models.
```

Work items:

- Add `MlPrediction` or `AiInsightSnapshot` storage.
- Calculate readiness risk from wellness, injuries, schedule, and training load.
- Calculate performance trend from match stats and analytics entries.
- Calculate workload pressure from training load and upcoming matches.
- Store prediction inputs and outputs for auditability.
- Show confidence and data-quality indicators.

Deliverables:

- Readiness risk score
- Workload pressure score
- Performance trend score
- Stored prediction snapshots
- Dashboard cards using stored predictions

Success criteria:

- Coaches and admins can understand why each score was produced.
- Scores work even with limited data.
- Low-data clubs show data-quality warnings.

## Phase 3: Dataset Preparation

Objective:

```txt
Prepare clean data for real ML training.
```

Work items:

- Define training datasets for performance, readiness, and injury-risk models.
- Create export scripts or backend jobs.
- Remove personally unnecessary fields.
- Normalize features across clubs.
- Add labels for target prediction outcomes.
- Track missing data and outliers.

Example labels:

- Player performance improved next match
- Player readiness dropped in the next 7 days
- Player had active injury or unavailability within the next 14 days
- Training load exceeded safe range

Deliverables:

- Dataset definitions
- Feature dictionary
- Export job
- Data-quality report

Success criteria:

- Data can be exported repeatedly in the same schema.
- Sensitive fields are minimized.
- Training data has enough rows to evaluate models meaningfully.

## Phase 4: Train First ML Models

Objective:

```txt
Train simple, explainable models before using complex ML.
```

Recommended models:

- Logistic regression for injury/readiness risk
- Random forest or gradient boosting for performance trend
- Time-series/statistical forecasting for workload trend

Work items:

- Train models outside the NestJS API.
- Save model version and metrics.
- Compare ML output with Phase 2 rule-based output.
- Add model evaluation reports.
- Define rollback behavior.

Deliverables:

- First trained model artifacts
- Evaluation report
- Model version registry
- Backend prediction provider interface

Success criteria:

- ML model performs better than the rule-based baseline.
- Prediction confidence is available.
- Backend can fall back to rule-based scoring.

## Phase 5: Production ML Service

Objective:

```txt
Serve ML predictions reliably in production.
```

Recommended architecture:

```txt
NestJS API -> ML provider interface -> Python ML service or managed inference API
```

Work items:

- Add an internal ML service endpoint.
- Add API authentication between backend and ML service.
- Add timeout and retry rules.
- Cache predictions.
- Precompute expensive insights using background jobs.
- Log prediction version and latency.

Deliverables:

- ML service
- Backend ML client
- Prediction cache
- Background precompute job
- Monitoring/logging

Success criteria:

- AI pages remain fast.
- ML service failure does not break core product flows.
- Predictions are versioned and auditable.

## Phase 6: Assistant + ML Integration

Objective:

```txt
Let the assistant explain ML outputs using live club context.
```

Work items:

- Feed stored ML predictions into the assistant context.
- Ask the LLM to explain reasons, not invent numbers.
- Add role-specific answer styles.
- Add guardrails for medical and player-sensitive answers.

Deliverables:

- Assistant responses backed by prediction snapshots
- Admin/coach/physio/player role lenses
- Safer medical wording

Success criteria:

- Assistant answers match stored metrics.
- Assistant does not expose data outside the user role.
- Assistant gives practical next actions.

## Recommended First Implementation Order

1. Add AI usage tracking and plan allowance enforcement.
2. Add prediction snapshot storage.
3. Move current AI scoring into separate provider classes.
4. Add readiness/workload/performance scoring.
5. Show scores in dashboard and AI page.
6. Prepare dataset exports.
7. Train first models only after enough real data exists.

## Initial Backend Modules

Recommended module layout:

```txt
apps/api/src/modules/ml/
  ml.module.ts
  ml.service.ts
  dto/
  providers/
    performance-score.provider.ts
    readiness-risk.provider.ts
    workload-risk.provider.ts
    schedule-suggestion.provider.ts
    recommendation-ranker.provider.ts
```

Recommended database models:

```txt
AiUsageLog
MlPrediction
MlModelVersion
```

## Pricing Alignment

ML/AI should stay under the existing paid AI feature:

```txt
Required plan: Professional or higher
```

Plan limits:

- Free: 0 AI requests/month
- Starter: 0 AI requests/month
- Professional: 250 AI requests/month
- Elite: 1,500 AI requests/month

Add-ons can be introduced later:

- AI Pack 100
- AI Pack 500
- AI Pack 2000

## Key Risks

- Low data volume can make trained ML unreliable.
- Injury-risk wording can create medical liability if presented incorrectly.
- LLMs can hallucinate if given weak context.
- Expensive AI calls can affect margins if usage is not tracked.
- Sensitive player health data must respect role permissions.

## Final Recommendation

Start with explainable scoring and strong logging. Do not train real ML models until the platform has enough historical data from real club usage.

The first meaningful ML milestone should be:

```txt
Stored readiness, workload, and performance predictions with explainable reasons.
```
