import type {
  Project,
  ProjectMemberRole,
} from "../types/project";

const member = (
  id: string,
  name: string,
  role: ProjectMemberRole,
) => ({
  id,
  name,
  role,
});

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
      member("1", "Alex", "OWNER"),
      member("2", "Sarah", "ENGINEER"),
      member("3", "Mike", "ENGINEER"),
      member("4", "John", "QA"),
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
      member("5", "Emma", "OWNER"),
      member("6", "David", "ENGINEER"),
      member("7", "Ryan", "QA"),
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
      member("8", "Daniel", "OWNER"),
      member("9", "Lisa", "ENGINEER"),
    ],
    aiInsight:
      "Project is on track and approaching completion.",
  },
];