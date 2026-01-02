import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { EventEmitter } from "events";
import { BaseAgent } from "../../src/agents/base-agent.js";
import type { AgentContext, AgentResult } from "../../src/types/agents.js";

// Mock the skill registry
vi.mock("../../src/skills/registry.js", () => ({
  getSkillRegistry: vi.fn(() => ({
    hasSkill: vi.fn(
      (name: string) => name === "mock-skill" || name === "code-review",
    ),
    invokeSkill: vi.fn(async (name: string, input: unknown) => ({
      skill: name,
      input,
      output: "mocked result",
    })),
  })),
}));

// Concrete implementation for testing
class TestAgent extends BaseAgent {
  readonly name = "test-agent";
  readonly description = "A test agent";
  readonly skills = ["mock-skill", "code-review"];
  readonly mcpServers = ["github"];

  async execute(context: AgentContext): Promise<AgentResult> {
    return this.success({ message: "Test completed", task: context.task });
  }

  // Expose protected methods for testing
  public testInvokeSkill(
    skillName: string,
    input: unknown,
    context: AgentContext,
  ) {
    return this.invokeSkill(skillName, input, context);
  }

  public testRequestHandoff(request: {
    targetAgent: string;
    reason: string;
    context?: unknown;
  }) {
    return this.requestHandoff(request);
  }

  public testSuccess(output: unknown, options?: Record<string, unknown>) {
    return this.success(output, options);
  }

  public testFailure(message: string, output?: unknown) {
    return this.failure(message, output);
  }
}

describe("BaseAgent", () => {
  let agent: TestAgent;
  let mockContext: AgentContext;

  beforeEach(() => {
    agent = new TestAgent();
    mockContext = {
      task: "Test task",
      sessionId: "test-session-123",
      projectContext: {
        projectId: "test-project",
        rootPath: "/test/path",
        languages: ["typescript"],
        frameworks: [],
      },
    };
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("agent properties", () => {
    it("should have required abstract properties", () => {
      expect(agent.name).toBe("test-agent");
      expect(agent.description).toBe("A test agent");
      expect(agent.skills).toEqual(["mock-skill", "code-review"]);
    });

    it("should have optional mcpServers", () => {
      expect(agent.mcpServers).toEqual(["github"]);
    });

    it("should extend EventEmitter", () => {
      expect(agent).toBeInstanceOf(EventEmitter);
    });
  });

  describe("execute()", () => {
    it("should execute and return success result", async () => {
      const result = await agent.execute(mockContext);

      expect(result.success).toBe(true);
      expect(result.output).toEqual({
        message: "Test completed",
        task: "Test task",
      });
    });
  });

  describe("invokeSkill()", () => {
    it("should invoke authorized skill", async () => {
      const result = await agent.testInvokeSkill(
        "mock-skill",
        { data: "test" },
        mockContext,
      );

      expect(result).toEqual({
        skill: "mock-skill",
        input: { data: "test" },
        output: "mocked result",
      });
    });

    it("should throw error for unauthorized skill", async () => {
      await expect(
        agent.testInvokeSkill("unauthorized-skill", {}, mockContext),
      ).rejects.toThrow("not authorized to invoke skill unauthorized-skill");
    });

    it("should throw error for nonexistent skill", async () => {
      // Add skill to agent's list but not to registry
      const agentWithExtra = new TestAgent();
      (agentWithExtra as any).skills = ["mock-skill", "nonexistent-skill"];

      await expect(
        agentWithExtra.testInvokeSkill("nonexistent-skill", {}, mockContext),
      ).rejects.toThrow("Skill not found");
    });
  });

  describe("requestHandoff()", () => {
    it("should emit handoff event with request", () => {
      const handoffHandler = vi.fn();
      agent.on("handoff", handoffHandler);

      agent.testRequestHandoff({
        targetAgent: "reviewer",
        reason: "Code needs review",
        context: { code: "test code" },
      });

      expect(handoffHandler).toHaveBeenCalledWith({
        targetAgent: "reviewer",
        reason: "Code needs review",
        context: { code: "test code" },
      });
    });

    it("should emit handoff without optional context", () => {
      const handoffHandler = vi.fn();
      agent.on("handoff", handoffHandler);

      agent.testRequestHandoff({
        targetAgent: "tester",
        reason: "Run tests",
      });

      expect(handoffHandler).toHaveBeenCalledWith({
        targetAgent: "tester",
        reason: "Run tests",
      });
    });
  });

  describe("success()", () => {
    it("should create success result with output only", () => {
      const result = agent.testSuccess({ data: "result" });

      expect(result).toEqual({
        success: true,
        output: { data: "result" },
      });
    });

    it("should create success result with artifacts", () => {
      const result = agent.testSuccess(
        { data: "result" },
        {
          artifacts: [{ type: "file", name: "output.txt", content: "content" }],
        },
      );

      expect(result.success).toBe(true);
      expect(result.artifacts).toHaveLength(1);
      expect(result.artifacts?.[0].name).toBe("output.txt");
    });

    it("should create success result with suggested next agent", () => {
      const result = agent.testSuccess(
        { data: "result" },
        { suggestedNextAgent: "reviewer" },
      );

      expect(result.suggestedNextAgent).toBe("reviewer");
    });

    it("should create success result with handoff context", () => {
      const result = agent.testSuccess(
        { data: "result" },
        { handoffContext: { files: ["a.ts", "b.ts"] } },
      );

      expect(result.handoffContext).toEqual({ files: ["a.ts", "b.ts"] });
    });
  });

  describe("failure()", () => {
    it("should create failure result with message", () => {
      const result = agent.testFailure("Something went wrong");

      expect(result).toEqual({
        success: false,
        output: { error: "Something went wrong" },
      });
    });

    it("should create failure result with custom output", () => {
      const result = agent.testFailure("Failed", {
        errorCode: "E001",
        details: "Detailed error",
      });

      expect(result).toEqual({
        success: false,
        output: {
          errorCode: "E001",
          details: "Detailed error",
        },
      });
    });
  });

  describe("validateSkills()", () => {
    it("should return empty array when all skills exist", () => {
      const missing = agent.validateSkills();
      expect(missing).toEqual([]);
    });

    it("should return missing skills", () => {
      const agentWithMissing = new TestAgent();
      (agentWithMissing as any).skills = [
        "mock-skill",
        "nonexistent-1",
        "nonexistent-2",
      ];

      const missing = agentWithMissing.validateSkills();
      expect(missing).toContain("nonexistent-1");
      expect(missing).toContain("nonexistent-2");
    });
  });
});
