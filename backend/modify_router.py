import re

file_path = r'C:\Projects\Devpilot\devpilot\backend\app\api\router.py'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('from app.api.endpoints import (', 'from app.api.endpoints import sprints\nfrom app.api.endpoints import (')
content += '\napi_router.include_router(sprints.router, tags=["sprints"])\n'

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
