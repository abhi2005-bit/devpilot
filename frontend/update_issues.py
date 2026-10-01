import re

file_path = r'C:\Projects\Devpilot\devpilot\frontend\src\pages\project\issues\Issues.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Add imports
content = content.replace(
    'import CreateIssueForm from "../../../components/issues/CreateIssueForm";',
    'import CreateIssueForm from "../../../components/issues/CreateIssueForm";\nimport SprintSelector from "./SprintSelector";\nimport SprintManagerModal from "./SprintManagerModal";'
)

# Add state variables
state_vars = """
  const [selectedSprintId, setSelectedSprintId] = useState<string | null>(null);
  const [isSprintModalOpen, setIsSprintModalOpen] = useState(false);
"""
content = content.replace(
    'const [search, setSearch] =\n    useState("");',
    'const [search, setSearch] =\n    useState("");\n' + state_vars
)

# Filter projectIssues based on selectedSprintId
filtered_issues_logic = """  const filteredIssues = useMemo(() => {
    return projectIssues.filter((issue) => {
      // Status filter
      if (
        statusFilter !== "ALL" &&
        issue.status !== statusFilter
      ) {
        return false;
      }

      // Priority filter
      if (
        priorityFilter !== "ALL" &&
        issue.priority !== priorityFilter
      ) {
        return false;
      }

      // Search filter
      if (search) {
        const searchLower = search.toLowerCase();
        const matchesTitle = issue.title
          .toLowerCase()
          .includes(searchLower);
        const matchesAssignee =
          issue.assignee?.name
            .toLowerCase()
            .includes(searchLower);

        if (!matchesTitle && !matchesAssignee) {
          return false;
        }
      }

      // Sprint filter
      if (selectedSprintId) {
        if (selectedSprintId === "BACKLOG") {
          if (issue.sprintId) return false;
        } else {
          if (issue.sprintId !== selectedSprintId) return false;
        }
      }

      return true;
    });
  }, [
    projectIssues,
    statusFilter,
    priorityFilter,
    search,
    selectedSprintId,
  ]);"""

# Replace filteredIssues using string replace since the formatting might be tricky for regex
# Let's use regex but very carefully
content = re.sub(
    r'const filteredIssues = useMemo\(\(\) => \{.*?\},\s*\[[^\]]*\]\);',
    filtered_issues_logic,
    content,
    flags=re.DOTALL
)

# Inject SprintSelector before the filters
selector_jsx = """          {/* Sprint Selector */}
          <div className="mb-md">
            <SprintSelector
              projectId={projectId || ""}
              selectedSprintId={selectedSprintId}
              onSprintSelect={setSelectedSprintId}
              onSprintAction={() => setIsSprintModalOpen(true)}
            />
          </div>

          <div className="flex flex-col gap-md sm:flex-row sm:items-center sm:justify-between">"""

content = content.replace(
    '<div className="flex flex-col gap-md sm:flex-row sm:items-center sm:justify-between">',
    selector_jsx,
    1
)

# Inject SprintManagerModal at the bottom
modal_jsx = """      <SprintManagerModal
        projectId={projectId || ""}
        isOpen={isSprintModalOpen}
        onClose={() => setIsSprintModalOpen(false)}
      />
    </main>"""

content = content.replace(
    '</main>',
    modal_jsx,
    1
)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
