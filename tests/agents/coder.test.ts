import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { AgentContext } from "../../src/types/agents.js";

// Use vi.hoisted to ensure mocks are available before vi.mock is executed
const { mockInvokeSkill, mockHasSkill, mockGetSkillRegistry } = vi.hoisted(
  () => {
    const mockInvokeSkill = vi.fn();
    const mockHasSkill = vi.fn(() => true);
    const mockGetSkillRegistry = vi.fn(() => ({
      hasSkill: mockHasSkill,
      invokeSkill: mockInvokeSkill,
    }));
    return { mockInvokeSkill, mockHasSkill, mockGetSkillRegistry };
  },
);

// Mock the skill registry
vi.mock("../../src/skills/registry.js", () => ({
  getSkillRegistry: mockGetSkillRegistry,
}));

import { CoderAgent } from "../../src/agents/coder.js";

describe("CoderAgent", () => {
  let agent: CoderAgent;
  let mockContext: AgentContext;

  beforeEach(() => {
    vi.clearAllMocks();
    // Re-apply default mock implementations after clearing
    mockHasSkill.mockReturnValue(true);
    mockInvokeSkill.mockResolvedValue({});
    mockGetSkillRegistry.mockReturnValue({
      hasSkill: mockHasSkill,
      invokeSkill: mockInvokeSkill,
    });
    agent = new CoderAgent();
    mockContext = {
      task: "Implement user authentication",
      sessionId: "test-session",
      projectContext: {
        projectId: "test-project",
        rootPath: "/test/path",
        languages: ["typescript"],
        frameworks: ["express"],
      },
    };
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("agent properties", () => {
    it("should have correct name", () => {
      expect(agent.name).toBe("coder");
    });

    it("should have correct description", () => {
      expect(agent.description).toContain("code");
    });

    it("should have required skills", () => {
      expect(agent.skills).toContain("microsoft-code-reference");
      expect(agent.skills).toContain("test-patterns");
      expect(agent.skills).toContain("docker-patterns");
      expect(agent.skills).toContain("ci-cd-patterns");
    });

    it("should require github and git MCP servers", () => {
      expect(agent.mcpServers).toContain("github");
      expect(agent.mcpServers).toContain("git");
    });
  });

  describe("execute()", () => {
    describe("docker tasks", () => {
      it("should handle docker task", async () => {
        mockContext.task = "Create a Docker container for the app";
        mockInvokeSkill.mockResolvedValue({ dockerfile: "FROM node:18" });

        const result = await agent.execute(mockContext);

        expect(result.success).toBe(true);
        expect(mockInvokeSkill).toHaveBeenCalledWith(
          "docker-patterns",
          expect.objectContaining({ task: mockContext.task }),
          expect.any(Object),
        );
      });

      it("should handle container task", async () => {
        mockContext.task = "Containerize the application";
        mockInvokeSkill.mockResolvedValue({ dockerfile: "FROM node:18" });

        const result = await agent.execute(mockContext);

        expect(result.success).toBe(true);
        expect(mockInvokeSkill).toHaveBeenCalledWith(
          "docker-patterns",
          expect.any(Object),
          expect.any(Object),
        );
      });

      it("should return Dockerfile artifact", async () => {
        mockContext.task = "Create Docker setup";
        mockInvokeSkill.mockResolvedValue({
          dockerfile: "FROM node:18\nWORKDIR /app",
        });

        const result = await agent.execute(mockContext);

        expect(result.artifacts).toBeDefined();
        expect(result.artifacts?.[0].name).toBe("Dockerfile");
        expect(result.artifacts?.[0].content).toContain("FROM node:18");
      });
    });

    describe("test tasks", () => {
      it("should handle test task", async () => {
        mockContext.task = "Write unit tests for the auth module";
        mockInvokeSkill.mockResolvedValue({ tests: "test code" });

        const result = await agent.execute(mockContext);

        expect(result.success).toBe(true);
        expect(mockInvokeSkill).toHaveBeenCalledWith(
          "test-patterns",
          expect.objectContaining({ task: mockContext.task }),
          expect.any(Object),
        );
      });

      it("should handle spec task", async () => {
        mockContext.task = "Create spec for user service";
        mockInvokeSkill.mockResolvedValue({ tests: "spec code" });

        const result = await agent.execute(mockContext);

        expect(result.success).toBe(true);
        expect(mockInvokeSkill).toHaveBeenCalledWith(
          "test-patterns",
          expect.any(Object),
          expect.any(Object),
        );
      });

      it("should suggest tester agent for test tasks", async () => {
        mockContext.task = "Write tests for API endpoints";
        mockInvokeSkill.mockResolvedValue({ tests: "test code" });

        const result = await agent.execute(mockContext);

        expect(result.suggestedNextAgent).toBe("tester");
      });
    });

    describe("CI/CD tasks", () => {
      it("should handle CI task", async () => {
        mockContext.task = "Set up CI for the project";
        mockInvokeSkill.mockResolvedValue({ pipeline: "ci config" });

        const result = await agent.execute(mockContext);

        expect(result.success).toBe(true);
        expect(mockInvokeSkill).toHaveBeenCalledWith(
          "ci-cd-patterns",
          expect.any(Object),
          expect.any(Object),
        );
      });

      it("should handle CD task", async () => {
        mockContext.task = "Configure CD pipeline";
        mockInvokeSkill.mockResolvedValue({ pipeline: "cd config" });

        const result = await agent.execute(mockContext);

        expect(result.success).toBe(true);
        expect(mockInvokeSkill).toHaveBeenCalledWith(
          "ci-cd-patterns",
          expect.any(Object),
          expect.any(Object),
        );
      });

      it("should handle pipeline task", async () => {
        mockContext.task = "Create deployment pipeline";
        mockInvokeSkill.mockResolvedValue({ pipeline: "pipeline config" });

        const result = await agent.execute(mockContext);

        expect(result.success).toBe(true);
        expect(mockInvokeSkill).toHaveBeenCalledWith(
          "ci-cd-patterns",
          expect.any(Object),
          expect.any(Object),
        );
      });

      it("should suggest devops agent for CI/CD tasks", async () => {
        mockContext.task = "Set up CI pipeline";
        mockInvokeSkill.mockResolvedValue({ pipeline: "config" });

        const result = await agent.execute(mockContext);

        expect(result.suggestedNextAgent).toBe("devops");
      });
    });

    describe("default code implementation", () => {
      it("should use microsoft-code-reference for general code tasks", async () => {
        mockContext.task = "Implement user authentication";
        mockInvokeSkill.mockResolvedValue({ code: "implementation" });

        const result = await agent.execute(mockContext);

        expect(result.success).toBe(true);
        expect(mockInvokeSkill).toHaveBeenCalledWith(
          "microsoft-code-reference",
          expect.objectContaining({ query: mockContext.task }),
          expect.any(Object),
        );
      });

      it("should suggest reviewer for code implementation", async () => {
        mockContext.task = "Add payment processing";
        mockInvokeSkill.mockResolvedValue({ code: "implementation" });

        const result = await agent.execute(mockContext);

        expect(result.suggestedNextAgent).toBe("reviewer");
      });
    });

    describe("error handling", () => {
      it("should return failure on skill error", async () => {
        mockContext.task = "Implement feature";
        mockInvokeSkill.mockRejectedValue(new Error("Skill execution failed"));

        const result = await agent.execute(mockContext);

        expect(result.success).toBe(false);
        expect(result.output).toEqual({ error: "Skill execution failed" });
      });

      it("should handle non-Error throws", async () => {
        mockContext.task = "Implement feature";
        mockInvokeSkill.mockRejectedValue("Unknown error");

        const result = await agent.execute(mockContext);

        expect(result.success).toBe(false);
        expect(result.output).toEqual({ error: "Code implementation failed" });
      });
    });
  });
});
