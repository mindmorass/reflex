import { createHash } from 'crypto';
import { createLogger } from '../utils/logger.js';
import { getChromaClient } from '../storage/client.js';
import type { Skill, SkillContext, SkillInfo } from '../types/skills.js';

const logger = createLogger('skills:registry');

export class SkillRegistry {
  private skills: Map<string, Skill>;

  constructor() {
    this.skills = new Map();
  }

  register(skill: Skill): void {
    if (this.skills.has(skill.name)) {
      logger.warn(`Skill ${skill.name} already registered, overwriting`);
    }
    this.skills.set(skill.name, skill);
    logger.debug(`Registered skill: ${skill.name}`);
  }

  unregister(name: string): boolean {
    const deleted = this.skills.delete(name);
    if (deleted) {
      logger.debug(`Unregistered skill: ${name}`);
    }
    return deleted;
  }

  getSkill(name: string): Skill | undefined {
    return this.skills.get(name);
  }

  hasSkill(name: string): boolean {
    return this.skills.has(name);
  }

  listSkills(): SkillInfo[] {
    return Array.from(this.skills.values()).map((skill) => ({
      name: skill.name,
      description: skill.description,
      version: skill.version,
      cacheable: skill.cacheable,
    }));
  }

  async invokeSkill(
    name: string,
    input: unknown,
    context: SkillContext
  ): Promise<unknown> {
    const skill = this.skills.get(name);

    if (!skill) {
      throw new Error(`Skill not found: ${name}`);
    }

    const startTime = Date.now();

    // 1. Check ChromaDB cache for similar queries (if cacheable)
    if (skill.cacheable) {
      const inputHash = createHash('sha256')
        .update(JSON.stringify(input))
        .digest('hex')
        .substring(0, 32);

      const chromaClient = getChromaClient();
      const cacheHit = await chromaClient.checkCache(
        context.projectId,
        name,
        inputHash
      );

      if (cacheHit) {
        logger.debug(`Cache hit for skill ${name}`, {
          inputHash,
          cachedAt: cacheHit.timestamp,
        });
        return cacheHit.result;
      }
    }

    // 2. Execute skill
    logger.debug(`Executing skill: ${name}`, { input });

    try {
      const result = await skill.execute(input, context);
      const duration = Date.now() - startTime;

      logger.debug(`Skill ${name} completed`, { duration });

      // 3. Cache result to ChromaDB (if cacheable)
      if (skill.cacheable) {
        const chromaClient = getChromaClient();
        await chromaClient.cacheToolResult(
          context.projectId,
          name,
          input,
          result,
          skill.cacheTTL
        );
        logger.debug(`Cached result for skill ${name}`);
      }

      return result;
    } catch (error) {
      logger.error(`Skill ${name} failed`, error);
      throw error;
    }
  }

  getSkillCount(): number {
    return this.skills.size;
  }

  clear(): void {
    this.skills.clear();
    logger.debug('Cleared all skills from registry');
  }
}

// Singleton instance
let skillRegistry: SkillRegistry | null = null;

export function getSkillRegistry(): SkillRegistry {
  if (!skillRegistry) {
    skillRegistry = new SkillRegistry();
  }
  return skillRegistry;
}
