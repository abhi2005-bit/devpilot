import re

file_path = r'C:\Projects\Devpilot\devpilot\frontend\src\pages\project\issues\Issues.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the last `</div>` before `  );`
modal_jsx = """      <SprintManagerModal
        projectId={projectId || ""}
        isOpen={isSprintModalOpen}
        onClose={() => setIsSprintModalOpen(false)}
      />
    </div>"""

# Replace `    </div>\n  );\n}\n\nexport default Issues;`
content = content.replace(
    '    </div>\n  );\n}\n\nexport default Issues;',
    modal_jsx + '\n  );\n}\n\nexport default Issues;'
)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
