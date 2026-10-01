import re

file_path = r'C:\Projects\Devpilot\devpilot\frontend\src\pages\project\issues\IssueDetail.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    '| "labels"',
    '| "labels"\n        | "sprintId"'
)

# And wait! The imports for Sprint failed because I placed them at the top, but they were not read?
# Ah, I replaced the issueData fetch but the `projectId` was undefined maybe?
# Let's check where I injected the sprints state.
# "const [sprints, setSprints] = useState<Sprint[]>([]);"
# Maybe it was injected in the wrong place? 
# "sprintService.getSprints(projectId).then(setSprints).catch(console.error);"

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
