import re

file_path = r'C:\Projects\Devpilot\devpilot\frontend\src\pages\project\issues\IssueDetail.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    'const [issue, setIssue] = useState<Issue | undefined>();',
    'const [issue, setIssue] = useState<Issue | undefined>();\n  const [sprints, setSprints] = useState<Sprint[]>([]);'
)

content = content.replace(
    'const issueData = await issueService.getIssue(issueId);',
    'const issueData = await issueService.getIssue(issueId);\n      if (projectId) {\n        sprintService.getSprints(projectId).then(setSprints).catch(console.error);\n      }'
)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
