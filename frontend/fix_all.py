import re

# 1. ProjectHome.tsx
file_path = r'C:\Projects\Devpilot\devpilot\frontend\src\pages\project\ProjectHome.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()
if "import { sprintService }" not in content:
    content = content.replace(
        'import type { Issue } from "../../types/issue";',
        'import type { Issue } from "../../types/issue";\nimport type { Sprint } from "../../types/sprint";\nimport { sprintService } from "../../services/sprintService";'
    )
with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

# 2. Issues.tsx
file_path = r'C:\Projects\Devpilot\devpilot\frontend\src\pages\project\issues\Issues.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Inject SprintSelector JSX before filters
if "<SprintSelector" not in content:
    content = content.replace(
        '<div className="flex flex-col gap-md xl:flex-row xl:items-center xl:justify-between">',
        '          {/* Sprint Selector */}\n          <div className="mb-md">\n            <SprintSelector\n              projectId={projectId || ""}\n              selectedSprintId={selectedSprintId}\n              onSprintSelect={setSelectedSprintId}\n              onSprintAction={() => setIsSprintModalOpen(true)}\n            />\n          </div>\n\n        <div className="flex flex-col gap-md xl:flex-row xl:items-center xl:justify-between">'
    )

# Inject SprintManagerModal at the bottom
if "<SprintManagerModal" not in content:
    content = content.replace(
        '</main>',
        '      <SprintManagerModal\n        projectId={projectId || ""}\n        isOpen={isSprintModalOpen}\n        onClose={() => setIsSprintModalOpen(false)}\n      />\n    </main>'
    )

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
