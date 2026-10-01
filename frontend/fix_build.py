import re

# 1. Fix SprintSelector.tsx
file_path = r'C:\Projects\Devpilot\devpilot\frontend\src\pages\project\issues\SprintSelector.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()
content = content.replace('import { Sprint }', 'import type { Sprint }')
with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

# 2. Fix SprintManagerModal.tsx
file_path = r'C:\Projects\Devpilot\devpilot\frontend\src\pages\project\issues\SprintManagerModal.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()
content = content.replace('import { Sprint, SprintStatus }', 'import type { Sprint, SprintStatus }')
with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

# 3. Fix ProjectHome.tsx imports and `s` parameter
file_path = r'C:\Projects\Devpilot\devpilot\frontend\src\pages\project\ProjectHome.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()
if 'import type { Sprint }' not in content:
    content = content.replace(
        'import type { Issue } from "../../../types/issue";',
        'import type { Issue } from "../../../types/issue";\nimport type { Sprint } from "../../../types/sprint";\nimport { sprintService } from "../../../services/sprintService";'
    )
content = content.replace('s => s.status', '(s: Sprint) => s.status')
with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

# 4. Fix Issues.tsx JSX injection
file_path = r'C:\Projects\Devpilot\devpilot\frontend\src\pages\project\issues\Issues.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Check if JSX is already injected
if '<SprintSelector' not in content:
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

if '<SprintManagerModal' not in content:
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
