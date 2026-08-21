import type { Issue } from "../types/issue";

export const issues: Issue[] = [
  {
    id: "issue-001",
    projectId: "ecommerce-platform-v2",
    title: "Checkout payment fails for some cards",
    description:
      "Some customers are experiencing payment failures during checkout.",
    status: "IN_PROGRESS",
    priority: "CRITICAL",
    assignee: {
      id: "1",
      name: "Alex",
    },
    labels: ["checkout", "payments", "bug"],
    createdAt: "2026-08-15",
    updatedAt: "2026-08-20",
  },
  {
    id: "issue-002",
    projectId: "ecommerce-platform-v2",
    title: "Inventory count is not synchronized",
    description:
      "Inventory values are occasionally inconsistent between services.",
    status: "TODO",
    priority: "HIGH",
    assignee: {
      id: "2",
      name: "Sarah",
    },
    labels: ["inventory", "backend"],
    createdAt: "2026-08-14",
    updatedAt: "2026-08-19",
  },
  {
    id: "issue-003",
    projectId: "ecommerce-platform-v2",
    title: "Improve product search performance",
    description:
      "Product search becomes slow when the catalog contains a large number of products.",
    status: "IN_REVIEW",
    priority: "MEDIUM",
    assignee: {
      id: "3",
      name: "Mike",
    },
    labels: ["performance", "search"],
    createdAt: "2026-08-12",
    updatedAt: "2026-08-18",
  },
  {
    id: "issue-004",
    projectId: "ecommerce-platform-v2",
    title: "Update checkout confirmation UI",
    description:
      "Update the confirmation screen to match the latest design.",
    status: "DONE",
    priority: "LOW",
    assignee: {
      id: "4",
      name: "John",
    },
    labels: ["frontend", "ui"],
    createdAt: "2026-08-10",
    updatedAt: "2026-08-16",
  },
  {
    id: "issue-005",
    projectId: "ecommerce-platform-v2",
    title: "Add retry handling for failed payments",
    description:
      "Allow customers to retry a failed payment without restarting checkout.",
    status: "TODO",
    priority: "HIGH",
    assignee: {
      id: "1",
      name: "Alex",
    },
    labels: ["payments", "checkout"],
    createdAt: "2026-08-11",
    updatedAt: "2026-08-17",
  },
  {
    id: "issue-006",
    projectId: "mobile-banking-app",
    title: "Fix transaction history pagination",
    description:
      "Transaction history does not load the next page correctly.",
    status: "IN_PROGRESS",
    priority: "HIGH",
    assignee: {
      id: "5",
      name: "Emma",
    },
    labels: ["transactions", "mobile"],
    createdAt: "2026-08-13",
    updatedAt: "2026-08-19",
  },
  {
    id: "issue-007",
    projectId: "mobile-banking-app",
    title: "Improve biometric login feedback",
    description:
      "Provide clearer feedback when biometric authentication fails.",
    status: "TODO",
    priority: "MEDIUM",
    assignee: {
      id: "6",
      name: "David",
    },
    labels: ["authentication", "ux"],
    createdAt: "2026-08-09",
    updatedAt: "2026-08-15",
  },
  {
    id: "issue-008",
    projectId: "internal-dev-tools",
    title: "Add repository activity metrics",
    description:
      "Track repository activity to improve engineering analytics.",
    status: "DONE",
    priority: "LOW",
    assignee: {
      id: "8",
      name: "Daniel",
    },
    labels: ["analytics", "repository"],
    createdAt: "2026-08-07",
    updatedAt: "2026-08-14",
  },
];