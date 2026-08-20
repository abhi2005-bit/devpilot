import type { Project } from "../types/project";

export const projects: Project[] = [
  {
    id: "ecommerce-platform-v2",
    name: "E-Commerce Platform V2",
    description:
      "Next-generation commerce platform with improved checkout and inventory management.",
    risk: "HIGH",
    progress: 68,
    openIssues: 12,
    prsPending: 4,
    members: [
      { id: "1", name: "Alex" },
      { id: "2", name: "Sarah" },
      { id: "3", name: "Mike" },
      { id: "4", name: "John" },
    ],
    aiInsight:
      "Deployment risk increased due to unresolved checkout issues.",
  },
  {
    id: "mobile-banking-app",
    name: "Mobile Banking App",
    description:
      "Secure mobile banking experience with payments, transfers, and account management.",
    risk: "MEDIUM",
    progress: 82,
    openIssues: 5,
    prsPending: 2,
    members: [
      { id: "5", name: "Emma" },
      { id: "6", name: "David" },
      { id: "7", name: "Ryan" },
    ],
    aiInsight:
      "Project is progressing well with a small number of remaining issues.",
  },
  {
    id: "internal-dev-tools",
    name: "Internal Dev Tools",
    description:
      "Internal engineering tools for improving developer productivity and workflow automation.",
    risk: "LOW",
    progress: 94,
    openIssues: 2,
    prsPending: 1,
    members: [
      { id: "8", name: "Daniel" },
      { id: "9", name: "Lisa" },
    ],
    aiInsight:
      "Project is on track and approaching completion.",
  },
];
