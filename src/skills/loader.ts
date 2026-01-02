import { existsSync } from 'fs';
import { readFile } from 'fs/promises';
import { resolve, join } from 'path';
import { parse as parseYaml } from 'yaml';
import { createLogger } from '../utils/logger.js';
import { expandEnvVars } from '../utils/env.js';
import { getSkillRegistry } from './registry.js';
import type { Skill, SkillsConfig, SkillConfig } from '../types/skills.js';

const logger = createLogger('skills:loader');

interface SkillManifest {
  name: string;
  description: string;
  version: string;
  inputSchema: Record<string, unknown>;
  outputSchema: Record<string, unknown>;
  cacheable: boolean;
  cacheTTL?: number;
  entryPoint: string;
}

export class SkillLoader {
  private basePath: string;
  private loaded: Set<string>;

  constructor(basePath: string) {
    this.basePath = expandEnvVars(basePath);
    this.loaded = new Set();
  }

  async loadSkills(skillsConfig: SkillsConfig): Promise<number> {
    const registry = getSkillRegistry();
    let loadedCount = 0;

    for (const skillConfig of skillsConfig.skills) {
      try {
        const skill = await this.loadSkill(skillConfig);
        if (skill) {
          registry.register(skill);
          this.loaded.add(skill.name);
          loadedCount++;
        }
      } catch (error) {
        logger.warn(`Failed to load skill: ${skillConfig.name}`, error);
      }
    }

    logger.info(`Loaded ${loadedCount} skills from ${this.basePath}`);
    return loadedCount;
  }

  private async loadSkill(config: SkillConfig): Promise<Skill | null> {
    const skillPath = resolve(this.basePath, config.path);

    if (!existsSync(skillPath)) {
      logger.debug(`Skill path does not exist: ${skillPath}`);
      return null;
    }

    // Look for MANIFEST.yaml in skill directory
    const manifestPath = join(skillPath, 'MANIFEST.yaml');

    if (!existsSync(manifestPath)) {
      logger.debug(`No MANIFEST.yaml found for skill: ${config.name}`);
      return this.createPlaceholderSkill(config);
    }

    try {
      const manifestContent = await readFile(manifestPath, 'utf-8');
      const manifest = parseYaml(manifestContent) as SkillManifest;

      // Load the skill module
      const entryPointPath = join(skillPath, manifest.entryPoint || 'index.js');

      if (!existsSync(entryPointPath)) {
        logger.debug(`Entry point not found: ${entryPointPath}`);
        return this.createPlaceholderSkill(config, manifest);
      }

      const skillModule = await import(entryPointPath);
      const execute = skillModule.default || skillModule.execute;

      if (typeof execute !== 'function') {
        logger.warn(`Skill ${config.name} has no execute function`);
        return this.createPlaceholderSkill(config, manifest);
      }

      return {
        name: manifest.name || config.name,
        description: manifest.description || `Skill: ${config.name}`,
        version: manifest.version || '0.0.0',
        inputSchema: manifest.inputSchema || {},
        outputSchema: manifest.outputSchema || {},
        cacheable: manifest.cacheable ?? false,
        cacheTTL: manifest.cacheTTL,
        execute,
      };
    } catch (error) {
      logger.warn(`Error loading skill ${config.name}`, error);
      return this.createPlaceholderSkill(config);
    }
  }

  private createPlaceholderSkill(config: SkillConfig, manifest?: Partial<SkillManifest>): Skill {
    // Create a placeholder skill that logs when invoked
    return {
      name: manifest?.name || config.name,
      description: manifest?.description || `Placeholder for ${config.name} skill`,
      version: manifest?.version || '0.0.0',
      inputSchema: manifest?.inputSchema || {},
      outputSchema: manifest?.outputSchema || {},
      cacheable: manifest?.cacheable ?? false,
      cacheTTL: manifest?.cacheTTL,
      execute: async (input, context) => {
        logger.warn(`Placeholder skill invoked: ${config.name}`, { input, context });
        return {
          success: false,
          message: `Skill ${config.name} is not fully implemented`,
          input,
        };
      },
    };
  }

  async reloadSkill(name: string, config: SkillConfig): Promise<boolean> {
    const registry = getSkillRegistry();

    // Unregister existing
    registry.unregister(name);
    this.loaded.delete(name);

    // Load fresh
    try {
      const skill = await this.loadSkill(config);
      if (skill) {
        registry.register(skill);
        this.loaded.add(skill.name);
        return true;
      }
    } catch (error) {
      logger.error(`Failed to reload skill: ${name}`, error);
    }

    return false;
  }

  getLoadedSkills(): string[] {
    return Array.from(this.loaded);
  }

  isLoaded(name: string): boolean {
    return this.loaded.has(name);
  }
}

// Factory function
export function createSkillLoader(basePath: string): SkillLoader {
  return new SkillLoader(basePath);
}
