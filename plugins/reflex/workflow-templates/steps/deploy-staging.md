---
name: deploy-staging
description: Deploy changes to a staging environment
requires-tools: []
variables:
  - name: deploy_command
    description: Command to deploy to staging
    default: ""
  - name: staging_url
    description: URL of the staging environment
    default: ""
---
### {{step_number}}. Deploy to Staging

{{#deploy_command}}- Run {{deploy_command}} to deploy changes to the staging environment{{/deploy_command}}
{{#staging_url}}- Verify the deployment at {{staging_url}}{{/staging_url}}
- Smoke test the deployed changes to ensure they work as expected
- If deployment fails, investigate and fix before proceeding
