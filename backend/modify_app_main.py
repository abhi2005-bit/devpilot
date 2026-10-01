import re

file_path = r'C:\Projects\Devpilot\devpilot\backend\app\main.py'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('from app.api.routes import users', 'from app.api.routes import users\nfrom app.api.routes import sprints')

route_code = """
app.include_router(
    sprints.router,
    prefix="/api/v1",
    tags=["Sprints"],
)
"""
content += route_code

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
