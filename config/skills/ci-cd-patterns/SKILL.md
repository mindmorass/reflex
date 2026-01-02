# CI/CD Patterns Skill

## Purpose
Design and implement effective continuous integration and deployment pipelines.

## When to Use
- Setting up new project pipelines
- Improving existing CI/CD workflows
- Implementing automated testing and deployment
- Establishing deployment strategies

## GitHub Actions Patterns

### Basic CI Pipeline
```yaml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.12'

      - name: Run linting
        run: |
          pip install ruff
          ruff check .

  test:
    runs-on: ubuntu-latest
    needs: lint
    steps:
      - uses: actions/checkout@v4

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.12'
          cache: 'pip'

      - name: Install dependencies
        run: pip install -r requirements.txt -r requirements-dev.txt

      - name: Run tests
        run: pytest --cov=src --cov-report=xml

      - name: Upload coverage
        uses: codecov/codecov-action@v4
        with:
          files: ./coverage.xml
```

### Matrix Testing
Test across multiple versions/platforms:
```yaml
jobs:
  test:
    runs-on: ${{ matrix.os }}
    strategy:
      matrix:
        os: [ubuntu-latest, macos-latest, windows-latest]
        python-version: ['3.10', '3.11', '3.12']
        exclude:
          - os: windows-latest
            python-version: '3.10'

    steps:
      - uses: actions/checkout@v4

      - name: Set up Python ${{ matrix.python-version }}
        uses: actions/setup-python@v5
        with:
          python-version: ${{ matrix.python-version }}

      - name: Run tests
        run: pytest
```

### Build and Push Docker Image
```yaml
jobs:
  build:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write

    steps:
      - uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Login to GitHub Container Registry
        uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ghcr.io/${{ github.repository }}
          tags: |
            type=sha,prefix=
            type=ref,event=branch
            type=semver,pattern={{version}}

      - name: Build and push
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
```

### Deploy to Environment
```yaml
jobs:
  deploy-staging:
    runs-on: ubuntu-latest
    needs: build
    environment: staging
    if: github.ref == 'refs/heads/develop'

    steps:
      - name: Deploy to staging
        run: |
          # Deployment commands
          echo "Deploying to staging..."

  deploy-production:
    runs-on: ubuntu-latest
    needs: [build, deploy-staging]
    environment: production
    if: github.ref == 'refs/heads/main'

    steps:
      - name: Deploy to production
        run: |
          echo "Deploying to production..."
```

## Pipeline Structure

### Fail Fast Pattern
Order jobs to catch issues quickly:
```
lint → test → security-scan → build → deploy
```

```yaml
jobs:
  lint:
    runs-on: ubuntu-latest
    steps: [...]

  test:
    needs: lint
    runs-on: ubuntu-latest
    steps: [...]

  security:
    needs: lint
    runs-on: ubuntu-latest
    steps: [...]

  build:
    needs: [test, security]
    runs-on: ubuntu-latest
    steps: [...]

  deploy:
    needs: build
    runs-on: ubuntu-latest
    steps: [...]
```

### Parallel Jobs
Run independent jobs in parallel:
```yaml
jobs:
  unit-tests:
    runs-on: ubuntu-latest

  integration-tests:
    runs-on: ubuntu-latest

  e2e-tests:
    runs-on: ubuntu-latest

  all-tests:
    needs: [unit-tests, integration-tests, e2e-tests]
    runs-on: ubuntu-latest
    steps:
      - run: echo "All tests passed!"
```

## Caching Strategies

### Dependency Caching
```yaml
# Python with pip
- uses: actions/setup-python@v5
  with:
    python-version: '3.12'
    cache: 'pip'

# Node.js with npm
- uses: actions/setup-node@v4
  with:
    node-version: '20'
    cache: 'npm'

# Custom cache
- uses: actions/cache@v4
  with:
    path: |
      ~/.cache/pip
      ~/.npm
    key: ${{ runner.os }}-deps-${{ hashFiles('**/requirements.txt', '**/package-lock.json') }}
    restore-keys: |
      ${{ runner.os }}-deps-
```

### Docker Layer Caching
```yaml
- uses: docker/build-push-action@v5
  with:
    cache-from: type=gha
    cache-to: type=gha,mode=max
```

## Security Scanning

### Dependency Scanning
```yaml
jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      # Python
      - name: Run Bandit
        run: |
          pip install bandit
          bandit -r src/

      # Node.js
      - name: Run npm audit
        run: npm audit --audit-level=high

      # All languages
      - name: Run Snyk
        uses: snyk/actions/python@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
```

### SAST (Static Application Security Testing)
```yaml
- name: Run CodeQL
  uses: github/codeql-action/analyze@v3
  with:
    languages: python, javascript
```

## Deployment Strategies

### Blue-Green Deployment
```yaml
deploy:
  steps:
    - name: Deploy to green
      run: deploy.sh green

    - name: Run smoke tests
      run: smoke-test.sh green

    - name: Switch traffic
      run: switch-traffic.sh green

    - name: Keep blue as rollback
      run: echo "Blue available for rollback"
```

### Canary Deployment
```yaml
deploy:
  steps:
    - name: Deploy canary (10%)
      run: deploy.sh canary 10

    - name: Monitor metrics
      run: |
        sleep 300  # 5 minutes
        check-metrics.sh canary

    - name: Increase to 50%
      run: deploy.sh canary 50

    - name: Full rollout
      run: deploy.sh canary 100
```

### Rolling Update
```yaml
deploy:
  steps:
    - name: Rolling update
      run: |
        kubectl set image deployment/app \
          app=myimage:${{ github.sha }} \
          --record
        kubectl rollout status deployment/app
```

## Environment Management

### Environment Secrets
```yaml
jobs:
  deploy:
    environment: production
    steps:
      - name: Deploy
        env:
          API_KEY: ${{ secrets.PROD_API_KEY }}
          DATABASE_URL: ${{ secrets.PROD_DATABASE_URL }}
        run: deploy.sh
```

### Required Reviewers
Configure in repository settings:
```
Settings → Environments → production
- Required reviewers: @team-leads
- Wait timer: 10 minutes
- Deployment branches: main only
```

## Notifications

### Slack Notification
```yaml
- name: Notify Slack
  if: always()
  uses: 8398a7/action-slack@v3
  with:
    status: ${{ job.status }}
    fields: repo,message,commit,author,action,eventName,workflow
  env:
    SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK }}
```

### GitHub Status Checks
```yaml
- name: Update deployment status
  uses: actions/github-script@v7
  with:
    script: |
      github.rest.repos.createDeploymentStatus({
        owner: context.repo.owner,
        repo: context.repo.repo,
        deployment_id: ${{ steps.deploy.outputs.deployment_id }},
        state: 'success',
        environment_url: 'https://myapp.com'
      })
```

## Reusable Workflows

### Define Reusable Workflow
```yaml
# .github/workflows/reusable-test.yml
name: Reusable Test Workflow

on:
  workflow_call:
    inputs:
      python-version:
        required: true
        type: string

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: ${{ inputs.python-version }}
      - run: pytest
```

### Use Reusable Workflow
```yaml
jobs:
  test-3-11:
    uses: ./.github/workflows/reusable-test.yml
    with:
      python-version: '3.11'

  test-3-12:
    uses: ./.github/workflows/reusable-test.yml
    with:
      python-version: '3.12'
```

## Rollback Procedures

### Automated Rollback
```yaml
deploy:
  steps:
    - name: Deploy
      id: deploy
      run: deploy.sh

    - name: Health check
      id: health
      run: health-check.sh
      continue-on-error: true

    - name: Rollback on failure
      if: steps.health.outcome == 'failure'
      run: |
        echo "Deployment failed, rolling back..."
        rollback.sh ${{ steps.deploy.outputs.previous_version }}
```

### Manual Rollback Workflow
```yaml
name: Rollback

on:
  workflow_dispatch:
    inputs:
      version:
        description: 'Version to rollback to'
        required: true

jobs:
  rollback:
    runs-on: ubuntu-latest
    environment: production
    steps:
      - name: Rollback to version
        run: deploy.sh ${{ inputs.version }}
```

## Checklist

### Before Setting Up CI/CD:
- [ ] Define branching strategy (GitFlow, trunk-based, etc.)
- [ ] Identify required checks (lint, test, security)
- [ ] Plan deployment environments
- [ ] Set up secrets management
- [ ] Define rollback procedures

### Pipeline Quality:
- [ ] Fail fast (quick checks first)
- [ ] Parallel where possible
- [ ] Caching implemented
- [ ] Reproducible builds
- [ ] Clear failure messages
- [ ] Notifications configured

### Security:
- [ ] Secrets not hardcoded
- [ ] Minimum permissions used
- [ ] Dependencies scanned
- [ ] Code scanning enabled
- [ ] Environment protection rules set
