import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { HookManager } from "../../src/hooks/index.js";
import type {
  HookEvent,
  HookContext,
  HookHandler,
} from "../../src/types/hooks.js";

// Mock environment
vi.mock("../../src/utils/env.js", () => ({
  env: {
    projectId: "default-project",
  },
}));

describe("HookManager", () => {
  let manager: HookManager;

  beforeEach(() => {
    vi.clearAllMocks();
    manager = new HookManager("test-session", "test-project");
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("constructor", () => {
    it("should initialize with session and project IDs", () => {
      const m = new HookManager("session-123", "project-456");
      expect(m.getHandlerCount("session_start")).toBe(0);
    });

    it("should use default project ID when not provided", () => {
      const m = new HookManager("session-123");
      // Manager should still be created
      expect(m.getHandlerCount("error")).toBe(0);
    });

    it("should initialize all event types with empty handlers", () => {
      const events: HookEvent[] = [
        "session_start",
        "session_end",
        "pre_agent_handoff",
        "post_tool_call",
        "error",
        "file_upload",
      ];

      for (const event of events) {
        expect(manager.getHandlerCount(event)).toBe(0);
      }
    });
  });

  describe("register()", () => {
    it("should register handler for event", () => {
      const handler: HookHandler = vi.fn();

      manager.register("session_start", handler);

      expect(manager.getHandlerCount("session_start")).toBe(1);
    });

    it("should allow multiple handlers for same event", () => {
      const handler1: HookHandler = vi.fn();
      const handler2: HookHandler = vi.fn();
      const handler3: HookHandler = vi.fn();

      manager.register("session_start", handler1);
      manager.register("session_start", handler2);
      manager.register("session_start", handler3);

      expect(manager.getHandlerCount("session_start")).toBe(3);
    });

    it("should allow same handler for different events", () => {
      const handler: HookHandler = vi.fn();

      manager.register("session_start", handler);
      manager.register("session_end", handler);

      expect(manager.getHandlerCount("session_start")).toBe(1);
      expect(manager.getHandlerCount("session_end")).toBe(1);
    });
  });

  describe("unregister()", () => {
    it("should remove registered handler", () => {
      const handler: HookHandler = vi.fn();

      manager.register("session_start", handler);
      expect(manager.getHandlerCount("session_start")).toBe(1);

      manager.unregister("session_start", handler);
      expect(manager.getHandlerCount("session_start")).toBe(0);
    });

    it("should only remove specified handler", () => {
      const handler1: HookHandler = vi.fn();
      const handler2: HookHandler = vi.fn();

      manager.register("session_start", handler1);
      manager.register("session_start", handler2);

      manager.unregister("session_start", handler1);

      expect(manager.getHandlerCount("session_start")).toBe(1);
    });

    it("should do nothing when handler not found", () => {
      const handler1: HookHandler = vi.fn();
      const handler2: HookHandler = vi.fn();

      manager.register("session_start", handler1);
      manager.unregister("session_start", handler2); // Different handler

      expect(manager.getHandlerCount("session_start")).toBe(1);
    });
  });

  describe("emit()", () => {
    it("should call all registered handlers", async () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      manager.register("session_start", handler1);
      manager.register("session_start", handler2);

      await manager.emit("session_start", { user: "test" });

      expect(handler1).toHaveBeenCalledTimes(1);
      expect(handler2).toHaveBeenCalledTimes(1);
    });

    it("should pass correct context to handlers", async () => {
      const handler = vi.fn();
      manager.register("pre_agent_handoff", handler);

      await manager.emit("pre_agent_handoff", { targetAgent: "coder" });

      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          sessionId: "test-session",
          projectId: "test-project",
          event: "pre_agent_handoff",
          data: { targetAgent: "coder" },
        }),
      );
    });

    it("should include timestamp in context", async () => {
      const handler = vi.fn();
      manager.register("session_start", handler);

      const before = new Date();
      await manager.emit("session_start", {});
      const after = new Date();

      const context: HookContext = handler.mock.calls[0][0];
      expect(context.timestamp.getTime()).toBeGreaterThanOrEqual(
        before.getTime(),
      );
      expect(context.timestamp.getTime()).toBeLessThanOrEqual(after.getTime());
    });

    it("should call handlers in registration order", async () => {
      const callOrder: number[] = [];

      const handler1 = vi.fn(() => callOrder.push(1));
      const handler2 = vi.fn(() => callOrder.push(2));
      const handler3 = vi.fn(() => callOrder.push(3));

      manager.register("session_start", handler1);
      manager.register("session_start", handler2);
      manager.register("session_start", handler3);

      await manager.emit("session_start", {});

      expect(callOrder).toEqual([1, 2, 3]);
    });

    it("should handle async handlers", async () => {
      const asyncHandler = vi.fn(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        return "done";
      });

      manager.register("post_tool_call", asyncHandler);
      await manager.emit("post_tool_call", { toolName: "test" });

      expect(asyncHandler).toHaveBeenCalled();
    });

    it("should continue executing handlers when one throws", async () => {
      const errorHandler = vi.fn(() => {
        throw new Error("Handler error");
      });
      const successHandler = vi.fn();

      manager.register("session_start", errorHandler);
      manager.register("session_start", successHandler);

      await manager.emit("session_start", {});

      expect(errorHandler).toHaveBeenCalled();
      expect(successHandler).toHaveBeenCalled();
    });

    it("should emit error event when handler throws", async () => {
      const errorHandler = vi.fn(() => {
        throw new Error("Test error");
      });
      const errorEventHandler = vi.fn();

      manager.register("session_start", errorHandler);
      manager.register("error", errorEventHandler);

      await manager.emit("session_start", {});

      expect(errorEventHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          event: "error",
          data: expect.objectContaining({
            originalEvent: "session_start",
            error: expect.any(Error),
          }),
        }),
      );
    });

    it("should not recurse when error handler throws", async () => {
      const errorHandler = vi.fn(() => {
        throw new Error("Error in error handler");
      });

      manager.register("error", errorHandler);

      // Should not throw or infinite loop
      await manager.emit("error", { message: "original error" });

      expect(errorHandler).toHaveBeenCalledTimes(1);
    });

    it("should handle no handlers gracefully", async () => {
      // Should not throw
      await expect(
        manager.emit("file_upload", { filename: "test.txt" }),
      ).resolves.toBeUndefined();
    });
  });

  describe("getHandlerCount()", () => {
    it("should return 0 for events with no handlers", () => {
      expect(manager.getHandlerCount("session_end")).toBe(0);
    });

    it("should return correct count after registration", () => {
      manager.register("error", vi.fn());
      manager.register("error", vi.fn());

      expect(manager.getHandlerCount("error")).toBe(2);
    });

    it("should return correct count after unregistration", () => {
      const handler = vi.fn();
      manager.register("error", handler);
      manager.register("error", vi.fn());
      manager.unregister("error", handler);

      expect(manager.getHandlerCount("error")).toBe(1);
    });
  });

  describe("setProjectId()", () => {
    it("should update project ID for subsequent emits", async () => {
      const handler = vi.fn();
      manager.register("session_start", handler);

      manager.setProjectId("new-project");
      await manager.emit("session_start", {});

      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          projectId: "new-project",
        }),
      );
    });
  });

  describe("setSessionId()", () => {
    it("should update session ID for subsequent emits", async () => {
      const handler = vi.fn();
      manager.register("session_start", handler);

      manager.setSessionId("new-session");
      await manager.emit("session_start", {});

      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          sessionId: "new-session",
        }),
      );
    });
  });
});
