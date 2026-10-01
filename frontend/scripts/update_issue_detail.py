import re

file_path = r'C:\Projects\Devpilot\devpilot\frontend\src\pages\project\issues\IssueDetail.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add import
import_stmt = 'import IssueEngineeringContext from "../../../components/issues/IssueEngineeringContext";\n'
content = content.replace('import EditIssueForm from "../../../components/issues/EditIssueForm";', 
                          import_stmt + 'import EditIssueForm from "../../../components/issues/EditIssueForm";')

# 2. Inject IssueEngineeringContext before "Activity / Comments"
context_jsx = """
          {/* Engineering Context */}
          <IssueEngineeringContext issue={issue} onUpdateStatus={(status) => handleUpdate({ status })} />
"""

content = content.replace('{/* Activity / Comments */}', context_jsx + '\n          {/* Activity / Comments */}')

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
