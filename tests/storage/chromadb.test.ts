import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Use vi.hoisted to ensure mocks are available before vi.mock is executed
const { mockCollection, mockChromaClient } = vi.hoisted(() => {
  const mockCollection = {
    add: vi.fn(),
    get: vi.fn(),
    query: vi.fn(),
    delete: vi.fn(),
  };

  const mockChromaClient = {
    listCollections: vi.fn(),
    getOrCreateCollection: vi.fn(),
    deleteCollection: vi.fn(),
  };

  return { mockCollection, mockChromaClient };
});

// Mock ChromaDB
vi.mock("chromadb", () => ({
  ChromaClient: vi.fn(() => mockChromaClient),
}));

// Mock embeddings
vi.mock("../../src/storage/embeddings.js", () => ({
  generateEmbedding: vi.fn(async (text: string) => {
    return new Array(384).fill(0).map((_, i) => Math.sin(i + text.length));
  }),
}));

// Mock env
vi.mock("../../src/utils/env.js", () => ({
  env: {
    chromaDbPath: "http://localhost:8000",
    projectId: "test-project",
  },
}));

import { ChromaDBClient, getChromaClient } from "../../src/storage/client.js";

describe("ChromaDBClient", () => {
  let client: ChromaDBClient;

  beforeEach(() => {
    vi.clearAllMocks();
    // Re-apply default mock implementations after clearing
    mockChromaClient.listCollections.mockResolvedValue(["reflex_test-project"]);
    mockChromaClient.getOrCreateCollection.mockResolvedValue(mockCollection);
    mockChromaClient.deleteCollection.mockResolvedValue(undefined);
    mockCollection.add.mockResolvedValue(undefined);
    mockCollection.get.mockResolvedValue({
      ids: [],
      documents: [],
      metadatas: [],
    });
    mockCollection.query.mockResolvedValue({
      ids: [[]],
      documents: [[]],
      metadatas: [[]],
      distances: [[]],
    });
    mockCollection.delete.mockResolvedValue(undefined);
    client = new ChromaDBClient({ path: "http://localhost:8000" });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("initialize()", () => {
    it("should initialize successfully", async () => {
      mockChromaClient.listCollections.mockResolvedValue([]);

      await client.initialize();

      expect(mockChromaClient.listCollections).toHaveBeenCalled();
    });

    it("should only initialize once", async () => {
      mockChromaClient.listCollections.mockResolvedValue([]);

      await client.initialize();
      await client.initialize();

      expect(mockChromaClient.listCollections).toHaveBeenCalledTimes(1);
    });

    it("should throw on connection error", async () => {
      mockChromaClient.listCollections.mockRejectedValue(
        new Error("Connection refused"),
      );

      await expect(client.initialize()).rejects.toThrow("Connection refused");
    });
  });

  describe("getCollection()", () => {
    it("should create or get collection with correct name", async () => {
      await client.getCollection("my-project");

      expect(mockChromaClient.getOrCreateCollection).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "reflex_my-project",
        }),
      );
    });

    it("should include metadata in collection creation", async () => {
      await client.getCollection("my-project");

      expect(mockChromaClient.getOrCreateCollection).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({
            projectId: "my-project",
            embeddingModel: "all-MiniLM-L6-v2",
          }),
        }),
      );
    });

    it("should cache collections", async () => {
      await client.getCollection("my-project");
      await client.getCollection("my-project");

      expect(mockChromaClient.getOrCreateCollection).toHaveBeenCalledTimes(1);
    });

    it("should create separate collections for different projects", async () => {
      await client.getCollection("project-a");
      await client.getCollection("project-b");

      expect(mockChromaClient.getOrCreateCollection).toHaveBeenCalledTimes(2);
    });
  });

  describe("store()", () => {
    it("should store content with embedding", async () => {
      const content = {
        text: "Test content",
        type: "documentation",
        source: "test.md",
      };

      await client.store("test-project", content);

      expect(mockCollection.add).toHaveBeenCalledWith(
        expect.objectContaining({
          documents: ["Test content"],
          embeddings: expect.any(Array),
        }),
      );
    });

    it("should generate unique ID based on content", async () => {
      const content = {
        text: "Test content",
        type: "documentation",
        source: "test.md",
      };

      const id = await client.store("test-project", content);

      expect(id).toHaveLength(32);
      expect(mockCollection.add).toHaveBeenCalledWith(
        expect.objectContaining({
          ids: [id],
        }),
      );
    });

    it("should include metadata", async () => {
      const content = {
        text: "Test content",
        type: "code",
        source: "app.ts",
        metadata: {
          language: "typescript",
          lines: 100,
        },
      };

      await client.store("test-project", content);

      expect(mockCollection.add).toHaveBeenCalledWith(
        expect.objectContaining({
          metadatas: [
            expect.objectContaining({
              type: "code",
              source: "app.ts",
              language: "typescript",
              lines: 100,
            }),
          ],
        }),
      );
    });

    it("should include TTL when provided", async () => {
      const content = {
        text: "Test content",
        type: "cache",
        source: "api",
        ttl: 3600,
      };

      await client.store("test-project", content);

      expect(mockCollection.add).toHaveBeenCalledWith(
        expect.objectContaining({
          metadatas: [
            expect.objectContaining({
              ttl: 3600,
            }),
          ],
        }),
      );
    });
  });

  describe("query()", () => {
    it("should query with embedding and return results", async () => {
      mockCollection.query.mockResolvedValue({
        ids: [["id1", "id2"]],
        documents: [["doc1", "doc2"]],
        metadatas: [[{ type: "code" }, { type: "doc" }]],
        distances: [[0.1, 0.2]],
      });

      const results = await client.query("test-project", "search query");

      expect(results).toHaveLength(2);
      expect(results[0].id).toBe("id1");
      expect(results[0].content).toBe("doc1");
      expect(results[0].similarity).toBeCloseTo(0.9);
    });

    it("should respect limit option", async () => {
      mockCollection.query.mockResolvedValue({
        ids: [["id1"]],
        documents: [["doc1"]],
        metadatas: [[{}]],
        distances: [[0.1]],
      });

      await client.query("test-project", "search", { limit: 3 });

      expect(mockCollection.query).toHaveBeenCalledWith(
        expect.objectContaining({
          nResults: 3,
        }),
      );
    });

    it("should filter by minimum similarity", async () => {
      mockCollection.query.mockResolvedValue({
        ids: [["id1", "id2", "id3"]],
        documents: [["doc1", "doc2", "doc3"]],
        metadatas: [[{}, {}, {}]],
        distances: [[0.05, 0.3, 0.8]], // similarities: 0.95, 0.7, 0.2
      });

      const results = await client.query("test-project", "search", {
        minSimilarity: 0.5,
      });

      expect(results).toHaveLength(2);
      expect(results.every((r) => r.similarity >= 0.5)).toBe(true);
    });

    it("should apply filter options", async () => {
      mockCollection.query.mockResolvedValue({
        ids: [[]],
        documents: [[]],
        metadatas: [[]],
        distances: [[]],
      });

      await client.query("test-project", "search", {
        filter: { type: "code" },
      });

      expect(mockCollection.query).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { type: "code" },
        }),
      );
    });
  });

  describe("checkCache()", () => {
    it("should return cached result on hit", async () => {
      const cachedResult = { data: "cached" };
      mockCollection.get.mockResolvedValue({
        ids: ["cache-id"],
        documents: [JSON.stringify(cachedResult)],
        metadatas: [
          {
            timestamp: new Date().toISOString(),
            ttl: 3600,
          },
        ],
      });

      const result = await client.checkCache(
        "test-project",
        "test-tool",
        "input-hash",
      );

      expect(result).not.toBeNull();
      expect(result?.hit).toBe(true);
      expect(result?.result).toEqual(cachedResult);
    });

    it("should return null on cache miss", async () => {
      mockCollection.get.mockResolvedValue({
        ids: [],
        documents: [],
        metadatas: [],
      });

      const result = await client.checkCache(
        "test-project",
        "test-tool",
        "input-hash",
      );

      expect(result).toBeNull();
    });

    it("should delete and return null for expired cache", async () => {
      const oldTimestamp = new Date(Date.now() - 7200000).toISOString(); // 2 hours ago
      mockCollection.get.mockResolvedValue({
        ids: ["cache-id"],
        documents: [JSON.stringify({ data: "old" })],
        metadatas: [
          {
            timestamp: oldTimestamp,
            ttl: 3600, // 1 hour TTL
          },
        ],
      });

      const result = await client.checkCache(
        "test-project",
        "test-tool",
        "input-hash",
      );

      expect(result).toBeNull();
      expect(mockCollection.delete).toHaveBeenCalledWith({ ids: ["cache-id"] });
    });

    it("should not expire cache without TTL", async () => {
      const oldTimestamp = new Date(Date.now() - 7200000).toISOString();
      const cachedResult = { data: "persistent" };
      mockCollection.get.mockResolvedValue({
        ids: ["cache-id"],
        documents: [JSON.stringify(cachedResult)],
        metadatas: [
          {
            timestamp: oldTimestamp,
            // No TTL
          },
        ],
      });

      const result = await client.checkCache(
        "test-project",
        "test-tool",
        "input-hash",
      );

      expect(result).not.toBeNull();
      expect(result?.result).toEqual(cachedResult);
    });
  });

  describe("cacheToolResult()", () => {
    it("should cache tool result with input hash", async () => {
      const result = { output: "result" };

      await client.cacheToolResult(
        "test-project",
        "my-tool",
        { param: 1 },
        result,
        3600,
      );

      expect(mockCollection.add).toHaveBeenCalledWith(
        expect.objectContaining({
          documents: [JSON.stringify(result)],
          metadatas: [
            expect.objectContaining({
              type: "tool_cache",
              toolName: "my-tool",
              inputHash: expect.any(String),
              ttl: 3600,
            }),
          ],
        }),
      );
    });

    it("should generate consistent hash for same input", async () => {
      mockCollection.add.mockClear();

      await client.cacheToolResult("test-project", "tool", { a: 1, b: 2 }, {});
      const firstCall = mockCollection.add.mock.calls[0][0];

      mockCollection.add.mockClear();

      await client.cacheToolResult("test-project", "tool", { a: 1, b: 2 }, {});
      const secondCall = mockCollection.add.mock.calls[0][0];

      expect(firstCall.metadatas[0].inputHash).toBe(
        secondCall.metadatas[0].inputHash,
      );
    });
  });

  describe("listProjects()", () => {
    it("should list projects from collections", async () => {
      mockChromaClient.listCollections.mockResolvedValue([
        "reflex_project-a",
        "reflex_project-b",
        "other_collection",
      ]);

      const projects = await client.listProjects();

      expect(projects).toHaveLength(2);
      expect(projects[0].projectId).toBe("project-a");
      expect(projects[1].projectId).toBe("project-b");
    });

    it("should return empty array when no reflex collections", async () => {
      mockChromaClient.listCollections.mockResolvedValue(["other_collection"]);

      const projects = await client.listProjects();

      expect(projects).toEqual([]);
    });
  });

  describe("deleteProject()", () => {
    it("should delete project collection", async () => {
      await client.deleteProject("my-project");

      expect(mockChromaClient.deleteCollection).toHaveBeenCalledWith({
        name: "reflex_my-project",
      });
    });
  });

  describe("deleteExpired()", () => {
    it("should delete expired entries", async () => {
      const oldTimestamp = new Date(Date.now() - 7200000).toISOString(); // 2 hours ago
      const newTimestamp = new Date().toISOString();

      mockCollection.get.mockResolvedValue({
        ids: ["expired-1", "expired-2", "valid"],
        documents: ["", "", ""],
        metadatas: [
          { timestamp: oldTimestamp, ttl: 3600 },
          { timestamp: oldTimestamp, ttl: 1800 },
          { timestamp: newTimestamp, ttl: 3600 },
        ],
      });

      const deleted = await client.deleteExpired("test-project");

      expect(deleted).toBe(2);
      expect(mockCollection.delete).toHaveBeenCalledWith({
        ids: ["expired-1", "expired-2"],
      });
    });

    it("should return 0 when no expired entries", async () => {
      mockCollection.get.mockResolvedValue({
        ids: ["valid"],
        documents: [""],
        metadatas: [{ timestamp: new Date().toISOString(), ttl: 3600 }],
      });
      mockCollection.delete.mockClear();

      const deleted = await client.deleteExpired("test-project");

      expect(deleted).toBe(0);
      expect(mockCollection.delete).not.toHaveBeenCalled();
    });
  });
});

describe("getChromaClient()", () => {
  it("should return singleton instance", () => {
    const client1 = getChromaClient();
    const client2 = getChromaClient();

    expect(client1).toBe(client2);
  });
});
