import re

file_path = r'C:\Projects\Devpilot\devpilot\backend\tests\test_sprints_api.py'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    'res = client.post(f"/api/v1/projects/{project_id}/issues", headers=headers, json={"title": "Issue 1"})',
    'res = client.post("/api/v1/issues", headers=headers, json={"title": "Issue 1", "project_id": project_id})'
)

content = content.replace(
    'assert res.status_code in [200, 201]',
    'assert res.status_code in [200, 201], f"Status code: {res.status_code}, msg: {res.text}"'
)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
