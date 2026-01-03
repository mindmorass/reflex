---
name: incident-response
description: Incident response patterns and runbooks. Use when handling production incidents, creating runbooks, performing root cause analysis, writing postmortems, or designing on-call procedures.
---

# Incident Response Patterns

Best practices for handling production incidents and creating operational runbooks.

## Incident Severity Levels

| Level | Name | Description | Response Time | Examples |
|-------|------|-------------|---------------|----------|
| SEV1 | Critical | Complete outage, data loss risk | 15 min | Database down, security breach |
| SEV2 | Major | Significant degradation | 30 min | API errors >10%, payment failures |
| SEV3 | Minor | Limited impact | 2 hours | Single service degraded |
| SEV4 | Low | Minimal impact | 24 hours | UI bugs, non-critical alerts |

## Incident Response Process

```
1. DETECT     → Alert triggered or user report
2. TRIAGE     → Assess severity and impact
3. RESPOND    → Assemble team, start communication
4. MITIGATE   → Stop the bleeding
5. RESOLVE    → Fix the root cause
6. RECOVER    → Verify systems healthy
7. REVIEW     → Postmortem and action items
```

## Communication Templates

### Initial Incident Notification

```markdown
## 🔴 INCIDENT: [Brief Description]

**Severity:** SEV[1-4]
**Status:** Investigating / Identified / Monitoring / Resolved
**Started:** YYYY-MM-DD HH:MM UTC
**Duration:** Ongoing / X minutes

### Impact
- [Who/what is affected]
- [Business impact]

### Current Status
- [What we know]
- [What we're doing]

### Next Update
- Expected in [X] minutes

**Incident Commander:** @name
**Communication Lead:** @name
```

### Status Update Template

```markdown
## 🟡 UPDATE: [Incident Title]

**Time:** HH:MM UTC
**Status:** [Identified/Mitigating/Monitoring]

### Progress
- [Actions taken since last update]
- [Current findings]

### Next Steps
- [Planned actions]

### Metrics
- Error rate: X% → Y%
- Latency: Xms → Yms
- Affected users: ~N

**Next update in [X] minutes**
```

## Runbook Template

```markdown
# Runbook: [Service/Issue Name]

## Overview
Brief description of when to use this runbook.

## Prerequisites
- Access to [systems]
- Permissions: [required roles]
- Tools: kubectl, aws-cli, etc.

## Symptoms
- [ ] Alert: `AlertName` firing
- [ ] Error logs showing `pattern`
- [ ] Metric X above threshold

## Quick Diagnosis

### Step 1: Check Service Health
```bash
kubectl get pods -n production -l app=myservice
kubectl logs -n production -l app=myservice --tail=100
```

### Step 2: Check Dependencies
```bash
# Database connectivity
kubectl exec -it pod-name -- pg_isready -h db-host

# External API health
curl -s https://api.dependency.com/health | jq .status
```

### Step 3: Check Recent Changes
```bash
# Recent deployments
kubectl rollout history deployment/myservice -n production

# Recent config changes
git log --oneline -10 -- config/
```

## Mitigation Steps

### Option A: Restart Service
```bash
kubectl rollout restart deployment/myservice -n production
kubectl rollout status deployment/myservice -n production
```

### Option B: Rollback Deployment
```bash
kubectl rollout undo deployment/myservice -n production
kubectl rollout status deployment/myservice -n production
```

### Option C: Scale Up
```bash
kubectl scale deployment/myservice --replicas=10 -n production
```

### Option D: Enable Circuit Breaker
```bash
# Update config to enable fallback mode
kubectl set env deployment/myservice FEATURE_FALLBACK_MODE=true -n production
```

## Verification
- [ ] Error rate below threshold
- [ ] Latency within SLO
- [ ] No new alerts
- [ ] Synthetic checks passing

## Escalation
If not resolved within 30 minutes:
1. Page on-call SRE: @sre-oncall
2. Notify engineering lead: @eng-lead
3. Consider SEV1 escalation

## Related Resources
- Dashboard: [link]
- Logs: [link]
- Metrics: [link]
- Architecture doc: [link]
```

## Root Cause Analysis (RCA)

### 5 Whys Technique

```markdown
## Problem: Production database went down

**Why #1:** The database server ran out of disk space.
**Why #2:** Log files grew unexpectedly large.
**Why #3:** A new feature logged every request payload.
**Why #4:** The code review didn't catch excessive logging.
**Why #5:** We lack automated checks for log volume in CI/CD.

**Root Cause:** Missing automated safeguards for logging volume.

**Actions:**
1. Add log rotation with size limits
2. Create CI check for logging statements
3. Add disk space alerting at 70%
```

### Fishbone Diagram Categories

```
                    People          Process
                        \            /
                         \          /
                          \        /
                           ========> Problem
                          /        \
                         /          \
                        /            \
                 Technology        Environment
```

## Postmortem Template

```markdown
# Postmortem: [Incident Title]

**Date:** YYYY-MM-DD
**Authors:** [Names]
**Status:** Draft / Final
**Severity:** SEV[X]

## Summary
One paragraph summary of what happened.

## Impact
- **Duration:** X hours Y minutes
- **Users affected:** ~N
- **Revenue impact:** $X (if applicable)
- **SLA impact:** X% availability for the period

## Timeline (UTC)

| Time | Event |
|------|-------|
| 14:00 | Deployment of version X.Y.Z |
| 14:15 | First alert: High error rate |
| 14:18 | On-call paged |
| 14:25 | Incident declared, SEV2 |
| 14:30 | Root cause identified |
| 14:35 | Rollback initiated |
| 14:40 | Services recovering |
| 14:50 | Incident resolved |

## Root Cause
Detailed explanation of what caused the incident.

## Contributing Factors
- Factor 1: [Description]
- Factor 2: [Description]

## What Went Well
- Quick detection (15 min)
- Effective communication
- Runbook was accurate

## What Went Poorly
- Rollback took too long
- Missing monitoring for X
- Unclear ownership

## Action Items

| Priority | Action | Owner | Due Date | Status |
|----------|--------|-------|----------|--------|
| P0 | Add monitoring for X | @name | YYYY-MM-DD | ⏳ |
| P1 | Update runbook | @name | YYYY-MM-DD | ✅ |
| P2 | Improve CI checks | @name | YYYY-MM-DD | ⏳ |

## Lessons Learned
- Key insight 1
- Key insight 2

## Supporting Information
- [Link to incident channel]
- [Link to metrics dashboard]
- [Link to relevant PRs]
```

## On-Call Procedures

### Handoff Checklist

```markdown
## On-Call Handoff

**Outgoing:** @name
**Incoming:** @name
**Date:** YYYY-MM-DD

### Active Issues
- [ ] Issue 1: [Status and context]
- [ ] Issue 2: [Status and context]

### Scheduled Maintenance
- [Date/time]: [Description]

### Recent Changes
- [Deployment/change]: [Impact to watch for]

### Known Issues
- [Issue]: [Workaround]

### Escalation Contacts
- Primary: @name (phone)
- Secondary: @name (phone)
- Manager: @name (phone)
```

### Alert Response Flowchart

```
┌─────────────────┐
│  Alert Fires    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Is it actionable?│
└────────┬────────┘
    Yes  │  No
    ┌────┴────┐
    │         │
    ▼         ▼
┌───────┐  ┌──────────┐
│Respond│  │Snooze/   │
│       │  │Tune alert│
└───┬───┘  └──────────┘
    │
    ▼
┌─────────────────┐
│ Can fix in <15m?│
└────────┬────────┘
    Yes  │  No
    ┌────┴────┐
    │         │
    ▼         ▼
┌───────┐  ┌──────────┐
│ Fix   │  │ Declare  │
│       │  │ Incident │
└───────┘  └──────────┘
```

## Useful Commands

```bash
# Quick service health check
kubectl get pods -n production | grep -v Running

# Recent events
kubectl get events -n production --sort-by='.lastTimestamp' | tail -20

# Resource usage
kubectl top pods -n production --sort-by=memory

# Logs with errors
kubectl logs -n production -l app=myservice --since=10m | grep -i error

# Database connections
psql -c "SELECT count(*) FROM pg_stat_activity WHERE state = 'active';"

# Check external dependencies
for host in api1.com api2.com; do
  echo -n "$host: "
  curl -s -o /dev/null -w "%{http_code}" "https://$host/health"
  echo
done
```

## References

- [Google SRE Book - Incident Management](https://sre.google/sre-book/managing-incidents/)
- [PagerDuty Incident Response](https://response.pagerduty.com/)
- [Atlassian Incident Management](https://www.atlassian.com/incident-management)
