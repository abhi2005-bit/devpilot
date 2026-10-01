import re

file_path = r'C:\Projects\Devpilot\devpilot\frontend\src\pages\project\issues\IssueDetail.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the Promise.all
content = content.replace(
    '          issueService.getIssue(issueId),\n          memberService.getMembers(projectId),\n          commentService.getComments(issueId),\n        ]);',
    '          issueService.getIssue(issueId),\n          memberService.getMembers(projectId),\n          commentService.getComments(issueId),\n          sprintService.getSprints(projectId).catch(() => []),\n        ]);'
)

# And the destructuring
content = content.replace(
    '        const [\n          loadedIssue,\n          loadedMembers,\n          loadedComments,\n        ] = await Promise.all([',
    '        const [\n          loadedIssue,\n          loadedMembers,\n          loadedComments,\n          loadedSprints,\n        ] = await Promise.all(['
)

# And setting state
content = content.replace(
    '        setIssue(loadedIssue);\n        setProjectMembers(loadedMembers);\n        setComments(loadedComments);',
    '        setIssue(loadedIssue);\n        setProjectMembers(loadedMembers);\n        setComments(loadedComments);\n        setSprints(loadedSprints as any);'
)

# Strip the previous broken replacement
content = content.replace(
    'const issueData = await issueService.getIssue(issueId);\n      if (projectId) {\n        sprintService.getSprints(projectId).then(setSprints).catch(console.error);\n      }',
    'const issueData = await issueService.getIssue(issueId);'
)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
