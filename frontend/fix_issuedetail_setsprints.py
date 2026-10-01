import re

file_path = r'C:\Projects\Devpilot\devpilot\frontend\src\pages\project\issues\IssueDetail.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    '        setIssue(loadedIssue);\n        setMembers(loadedMembers);\n        setComments(loadedComments);',
    '        setIssue(loadedIssue);\n        setMembers(loadedMembers);\n        setComments(loadedComments);\n        setSprints(loadedSprints as any);'
)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
