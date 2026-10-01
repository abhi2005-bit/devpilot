import urllib.request
import json
import time

def pw(action, arg1=None, arg2=None, options=None):
    data = json.dumps({"action": action, "arg1": arg1, "arg2": arg2, "options": options or {}}).encode('utf-8')
    req = urllib.request.Request('http://localhost:9999', data=data, headers={'Content-Type': 'application/json'})
    try:
        with urllib.request.urlopen(req) as response:
            resp = json.loads(response.read().decode())
            if not resp.get('success'):
                print(f"[PW Error] {action}({arg1}, {arg2}): {resp.get('error')}")
                return None
            return resp.get('result')
    except Exception as e:
        print(f"[Req Error] {action}({arg1}, {arg2}): {e}")
        return None

def test_auth():
    print("=== AREA 1: AUTHENTICATION ===")
    pw('goto', 'http://localhost:5173/login')
    time.sleep(1)
    
    print("Checking page elements")
    print("Email visible:", pw('isVisible', 'input[type="email"]'))
    print("Password visible:", pw('isVisible', 'input[type="password"]'))
    
    pw('fill', 'input[type="email"]', 'invalid@example.com')
    pw('fill', 'input[type="password"]', 'wrongpassword')
    pw('click', 'button[type="submit"]', None, {"force": True})
    time.sleep(1)
    
    body = pw('eval', 'document.body.innerText') or ""
    if 'invalid' in body.lower() or 'incorrect' in body.lower():
        print("[PASS] Invalid login rejected")
    else:
        print("[FAIL] Invalid login not rejected")
        
    pw('goto', 'http://localhost:5173/register')
    time.sleep(1)
    email = f"qa_{int(time.time())}@test.com"
    pw('fill', 'input[name="name"]', 'QA User')
    pw('fill', 'input[name="email"]', email)
    pw('fill', 'input[name="password"]', 'Password123!')
    pw('fill', 'input[name="confirm-password"]', 'Password123!')
    pw('click', 'button[type="submit"]', None, {"force": True})
    time.sleep(2)
    
    if pw('url') == 'http://localhost:5173/login' or 'dashboard' in pw('url'):
        print("[PASS] Registration succeeded or redirected")
    else:
        print(f"[FAIL] Reg failed, url is {pw('url')}")
        
    pw('goto', 'http://localhost:5173/login')
    time.sleep(1)
    pw('fill', 'input[type="email"]', email)
    pw('fill', 'input[type="password"]', 'Password123!')
    pw('click', 'button[type="submit"]', None, {"force": True})
    time.sleep(2)
    
    current_url = pw('url')
    if current_url and 'dashboard' in current_url:
        print("[PASS] Valid login succeeded")
    else:
        print(f"[FAIL] Login failed, url is {current_url}")
        
    # Test logout
    pw('click', 'button.rounded-full') # avatar
    time.sleep(0.5)
    pw('click', 'button:has-text("Log out")', None, {"force": True})
    time.sleep(1)
    if 'login' in pw('url'):
        print("[PASS] Logout succeeded")
    else:
        print("[FAIL] Logout failed")

    return email

def test_dashboard(email):
    print("\n=== AREA 2: DASHBOARD ===")
    pw('goto', 'http://localhost:5173/login')
    time.sleep(1)
    pw('fill', 'input[type="email"]', email)
    pw('fill', 'input[type="password"]', 'Password123!')
    pw('click', 'button[type="submit"]', None, {"force": True})
    time.sleep(2)
    
    body = pw('eval', 'document.body.innerText') or ""
    if "Active Projects" in body:
        print("[PASS] Active Projects metric visible")
    else:
        print("[FAIL] Active Projects metric missing")
        
    if "Open Issues" in body:
        print("[PASS] Open Issues visible")
    else:
        print("[FAIL] Open Issues missing")

def test_project():
    print("\n=== AREA 3,4,5: PROJECTS ===")
    pw('goto', 'http://localhost:5173/projects/new')
    time.sleep(2)
    
    # Fill project form
    project_name = f"QA_Project_{int(time.time())}"
    pw('fill', 'input[name="name"]', project_name)
    pw('fill', 'textarea[name="description"]', 'QA Description')
    
    # Try no github first
    pw('click', 'button[type="submit"]', None, {"force": True})
    time.sleep(2)
    
    if project_name in (pw('eval', 'document.body.innerText') or ""):
        print("[PASS] Project creation succeeded")
    else:
        print("[FAIL] Project creation failed")
        
    # Edit project
    # We are presumably on the project page now
    url = pw('url')
    if 'projects' in url:
        pw('click', 'button:has-text("Edit")', None, {"force": True})
        time.sleep(1)
        pw('fill', 'textarea[name="description"]', 'Updated QA Description')
        pw('click', 'button[type="submit"]', None, {"force": True})
        time.sleep(1)
        body = pw('eval', 'document.body.innerText') or ""
        if 'Updated QA Description' in body:
            print("[PASS] Edit project succeeded")
        else:
            print("[FAIL] Edit project failed")
    else:
        print("[FAIL] Not on project page after creation")

email = test_auth()
if email:
    test_dashboard(email)
    test_project()
