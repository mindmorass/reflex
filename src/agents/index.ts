export { BaseAgent } from './base-agent.js';
export { AnalystAgent } from './analyst.js';
export { CoderAgent } from './coder.js';
export { DevOpsAgent } from './devops.js';
export { HarvesterAgent } from './harvester.js';
export { PlannerAgent } from './planner.js';
export { ResearcherAgent } from './researcher.js';
export { ReviewerAgent } from './reviewer.js';
export { TesterAgent } from './tester.js';
export { WriterAgent } from './writer.js';

import { BaseAgent } from './base-agent.js';
import { AnalystAgent } from './analyst.js';
import { CoderAgent } from './coder.js';
import { DevOpsAgent } from './devops.js';
import { HarvesterAgent } from './harvester.js';
import { PlannerAgent } from './planner.js';
import { ResearcherAgent } from './researcher.js';
import { ReviewerAgent } from './reviewer.js';
import { TesterAgent } from './tester.js';
import { WriterAgent } from './writer.js';

// Factory to create all agents
export function createAllAgents(): Map<string, BaseAgent> {
  const agents = new Map<string, BaseAgent>();

  const agentInstances = [
    new AnalystAgent(),
    new CoderAgent(),
    new DevOpsAgent(),
    new HarvesterAgent(),
    new PlannerAgent(),
    new ResearcherAgent(),
    new ReviewerAgent(),
    new TesterAgent(),
    new WriterAgent(),
  ];

  for (const agent of agentInstances) {
    agents.set(agent.name, agent);
  }

  return agents;
}

// Get agent by name
export function getAgentByName(name: string, agents?: Map<string, BaseAgent>): BaseAgent | undefined {
  if (agents) {
    return agents.get(name);
  }

  // Create single instance
  switch (name) {
    case 'analyst':
      return new AnalystAgent();
    case 'coder':
      return new CoderAgent();
    case 'devops':
      return new DevOpsAgent();
    case 'harvester':
      return new HarvesterAgent();
    case 'planner':
      return new PlannerAgent();
    case 'researcher':
      return new ResearcherAgent();
    case 'reviewer':
      return new ReviewerAgent();
    case 'tester':
      return new TesterAgent();
    case 'writer':
      return new WriterAgent();
    default:
      return undefined;
  }
}
