# EsportM Upgrade-Required Features

Source documents:

- `docs/pricing-plan-summary-google-sheets.tsv`
- `docs/pricing-feature-matrix-google-sheets.tsv`
- `docs/pricing-commercial-rules-google-sheets.tsv`
- Pricing PDFs in `E:\s15\Projects\esportm\docs\pricing`

## Access Model

EsportM uses a free-account-first model.

- Account creation is free.
- Users can create or join a club before payment.
- The Free plan gives limited core club access.
- Paid services remain visible but locked.
- Club admins can upgrade the club plan.
- Non-admin users can see upgrade prompts, but they must ask a club admin to upgrade.

## Plans That Unlock Paid Services

The paid feature set below requires:

```txt
Professional or higher
```

Eligible plans:

- Professional
- Elite
- Enterprise

Starter can use core club operations, but these advanced services remain locked unless sold later as add-ons.

## Upgrade-Required Features

### AI Assistant

Required plan:

```txt
Professional
```

Includes:

- AI performance insights
- AI schedule suggestions
- AI skill analysis
- AI recommendations
- Context-aware assistant

Backend enforcement:

```txt
GET /clubs/:clubId/ai/insights
GET /clubs/:clubId/ai/schedule
GET /clubs/:clubId/ai/skills
GET /clubs/:clubId/ai/recommendations
POST /clubs/:clubId/ai/assistant
```

### Advanced Analytics

Required plan:

```txt
Professional
```

Includes:

- Dashboard analytics entries
- Analytics reporting workspace
- Create and view analytics records

Backend enforcement:

```txt
GET /dashboard/analytics
POST /dashboard/analytics
```

### Medical And Injury Management

Required plan:

```txt
Professional
```

Includes:

- Injury register
- Injury case management
- Create, update, list and remove injury records

Backend enforcement:

```txt
GET /clubs/:clubId/injuries
GET /clubs/:clubId/injuries/:injuryId
POST /clubs/:clubId/injuries
PATCH /clubs/:clubId/injuries/:injuryId
DELETE /clubs/:clubId/injuries/:injuryId
```

### Social Publishing

Required plan:

```txt
Professional
```

Includes:

- Create posts
- Upload image/video media
- Likes and comments
- Social publishing workflows

Backend enforcement:

```txt
POST /social/media/signature
POST /social/posts
POST /social/posts/:postId/reactions/like
POST /social/posts/:postId/comments
```

Free and Starter access:

```txt
Social feed browsing is read-only.
```

### Marketplace Recruiting

Required plan:

```txt
Professional
```

Includes:

- Create or update player listing
- Recruiter offer workflow
- View recruiter offers
- Send club offers

Backend enforcement:

```txt
POST /marketplace/me/listing
POST /marketplace/listings/:listingId/offers
GET /marketplace/recruiter/offers
```

Free and Starter access:

```txt
Marketplace listing browsing is read-only.
```

## Free Or Core Access

These should remain accessible without upgrading, subject to role permissions and plan limits:

- Account registration and login
- Personal profile
- One club membership/workspace
- Basic role dashboards
- Club creation for new founders
- Club membership and switching
- Basic member directory access
- Basic squad access
- Basic dashboard overview
- Basic match and stats access
- Marketplace browsing
- Social feed browsing

## Free Plan Limits

From the plan summary:

```txt
Members: 25
Squads: 1
Staff/admin users: 3
Storage: 1 GB
AI requests: 0
Trial: No expiry
Commercial note: Lead-generation plan; one club only
```

## Paid Plan Reference

```txt
Starter:
Monthly: INR 1,499
Annual: INR 14,990
Effective monthly annual: INR 1,249
Members: 75
Squads: 3
Staff/admin users: 10
Storage: 5 GB
AI requests: 0

Professional:
Monthly: INR 4,999
Annual: INR 49,990
Effective monthly annual: INR 4,166
Members: 250
Squads: 10
Staff/admin users: 35
Storage: 50 GB
AI requests: 250

Elite:
Monthly: INR 11,999
Annual: INR 119,990
Effective monthly annual: INR 9,999
Members: 750
Squads: 30
Staff/admin users: Unlimited
Storage: 250 GB
AI requests: 1,500
```

## Payment Rule

Current implementation:

```txt
Razorpay annual checkout
```

Annual billing rule:

```txt
10 months charged for 12 months of service
```

Only club admins can start checkout. A successful Razorpay signature verification upgrades the club plan.
