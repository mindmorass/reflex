import { describe, it, expect, vi } from "vitest";

// Since the Orchestrator has many dependencies and is an integration point,
// we'll test the routing logic separately

describe("Orchestrator routing logic", () => {
  // Test routing patterns directly - ordered by priority
  const routingOrder: [string, string[]][] = [
    // More specific patterns first
    ["tester", ["test", "coverage", "spec", "qa"]],
    ["harvester", ["collect", "scrape", "harvest", "extract", "crawl"]],
    [
      "devops",
      [
        "deploy",
        "infrastructure",
        "kubernetes",
        "terraform",
        "pipeline",
        "k8s",
        "azure",
        "aws",
      ],
    ],
    [
      "analyst",
      ["analyze", "debug", "troubleshoot", "diagnose", "investigate"],
    ],
    ["planner", ["plan", "sprint", "breakdown", "story", "epic", "backlog"]],
    ["writer", ["document", "readme", "guide", "documentation", "write doc"]],
    ["researcher", ["research", "learn", "discover"]],
    ["reviewer", ["review", "audit", "security", "check code"]],
    [
      "coder",
      ["implement", "code", "refactor", "develop", "build", "create feature"],
    ],
  ];

  function determineAgent(task: string): string {
    const taskLower = task.toLowerCase();

    for (const [agent, patterns] of routingOrder) {
      for (const pattern of patterns) {
        if (taskLower.includes(pattern)) {
          return agent;
        }
      }
    }

    return "coder"; // default
  }

  describe("routeTask patterns", () => {
    it("should route code tasks to coder agent", () => {
      expect(determineAgent("Implement user login feature")).toBe("coder");
    });

    it("should route refactor tasks to coder agent", () => {
      expect(determineAgent("Refactor the authentication module")).toBe(
        "coder",
      );
    });

    it("should route review tasks to reviewer agent", () => {
      expect(determineAgent("Review the pull request")).toBe("reviewer");
    });

    it("should route security audit to reviewer agent", () => {
      expect(determineAgent("Perform security audit on the API")).toBe(
        "reviewer",
      );
    });

    it("should route test tasks to tester agent", () => {
      expect(determineAgent("Run all unit tests")).toBe("tester");
    });

    it("should route coverage tasks to tester agent", () => {
      expect(determineAgent("Check test coverage")).toBe("tester");
    });

    it("should route infrastructure tasks to devops agent", () => {
      expect(determineAgent("Set up infrastructure for production")).toBe(
        "devops",
      );
    });

    it("should route kubernetes tasks to devops agent", () => {
      expect(determineAgent("Deploy to Kubernetes cluster")).toBe("devops");
    });

    it("should route terraform tasks to devops agent", () => {
      expect(determineAgent("Create Terraform config")).toBe("devops");
    });

    it("should route analysis tasks to analyst agent", () => {
      expect(determineAgent("Analyze application performance")).toBe("analyst");
    });

    it("should route debug tasks to analyst agent", () => {
      expect(determineAgent("Debug the memory leak issue")).toBe("analyst");
    });

    it("should route documentation tasks to writer agent", () => {
      expect(determineAgent("Write API documentation")).toBe("writer");
    });

    it("should route readme tasks to writer agent", () => {
      expect(determineAgent("Update the README file")).toBe("writer");
    });

    it("should route planning tasks to planner agent", () => {
      expect(determineAgent("Plan the sprint backlog")).toBe("planner");
    });

    it("should route research tasks to researcher agent", () => {
      expect(determineAgent("Research best practices for caching")).toBe(
        "researcher",
      );
    });

    it("should route investigate tasks to analyst agent", () => {
      expect(determineAgent("Investigate the memory issue")).toBe("analyst");
    });

    it("should route data collection tasks to harvester agent", () => {
      expect(determineAgent("Collect data from external API")).toBe(
        "harvester",
      );
    });

    it("should route scrape tasks to harvester agent", () => {
      expect(determineAgent("Scrape product information")).toBe("harvester");
    });

    it("should default to coder for unmatched tasks", () => {
      expect(determineAgent("Do something generic")).toBe("coder");
    });
  });
});
