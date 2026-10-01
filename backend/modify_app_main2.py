import re

file_path = r'C:\Projects\Devpilot\devpilot\backend\app\main.py'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Add import
content = content.replace(
    'from app.api.routes.auth import router as auth_router',
    'from app.api.routes.auth import router as auth_router\nfrom app.api.routes.sprints import router as sprints_router'
)

# Fix router inclusion
content = content.replace(
    'sprints.router,',
    'sprints_router,'
)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
