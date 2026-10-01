import time
import json
from playwright.sync_api import sync_playwright

results = {}

def run_qa():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()
        
        try:
            # ================= AREA 1: AUTHENTICATION =================
            print("--- AREA 1: AUTHENTICATION ---")
            page.goto("http://localhost:5173/login")
            page.wait_for_load_state("networkidle")
            
            # Check password mask
            pwd = page.locator("input[type='password']")
            results["auth_pwd_masked"] = pwd.is_visible()
            
            # Invalid login
            page.locator("input[type='email']").fill("fake@example.com")
            pwd.fill("wrong")
            page.locator("button[type='submit']").click()
            time.sleep(2)
            results["auth_invalid_handled"] = "Invalid" in page.inner_text("body") or "incorrect" in page.inner_text("body").lower()
            
            # Registration
            page.locator("text=Request Access").click()
            time.sleep(1)
            results["auth_registration_reachable"] = "/register" in page.url
            
            # Register user
            page.locator("input[name='email']").fill("qatest@example.com")
            page.locator("input[name='name']").fill("QA Tester")
            page.locator("input[name='password']").fill("TestPass123!")
            page.locator("input[name='confirm-password']").fill("TestPass123!")
            
            page.locator("button[type='submit']").click()
            time.sleep(2)
            
            # Login with new user
            page.goto("http://localhost:5173/login")
            page.locator("input[type='email']").fill("qatest@example.com")
            page.locator("input[type='password']").fill("TestPass123!")
            page.locator("button[type='submit']").click()
            time.sleep(3)
            
            is_dashboard = "/dashboard" in page.url
            results["auth_valid_login_succeeds"] = is_dashboard
            
            # Logout
            try:
                # Find profile menu (often a button with user initials or name)
                page.locator("button.rounded-full").first.click()
                time.sleep(0.5)
                page.locator("text=Log out").or_(page.locator("text=Logout")).click()
                time.sleep(2)
                results["auth_logout_works"] = "/login" in page.url
            except Exception as e:
                print(f"Logout failed: {e}")
                results["auth_logout_works"] = False
            
            # Re-login for remaining tests
            page.goto("http://localhost:5173/login")
            page.locator("input[type='email']").fill("qatest@example.com")
            page.locator("input[type='password']").fill("TestPass123!")
            page.locator("button[type='submit']").click()
            time.sleep(3)
            
            # ================= AREA 2: DASHBOARD =================
            print("--- AREA 2: DASHBOARD ---")
            page.goto("http://localhost:5173/dashboard")
            time.sleep(2)
            
            body_text = page.inner_text("body")
            results["dashboard_loads"] = "Active Projects" in body_text or "Projects" in body_text
            
            # ================= AREA 3: PROJECT CREATION =================
            print("--- AREA 3: PROJECT CREATION ---")
            page.goto("http://localhost:5173/projects")
            time.sleep(2)
            
            try:
                page.locator("text=New Project").click()
                time.sleep(1)
                page.locator("input[name='name']").fill("QA Project 1")
                page.locator("textarea[name='description']").fill("QA Description")
                page.locator("button[type='submit']").click()
                time.sleep(2)
                results["project_creation_success"] = "QA Project 1" in page.inner_text("body")
            except Exception as e:
                print(f"Project creation failed: {e}")
                results["project_creation_success"] = False

            # ================= AREA 5: PROJECT EDITING & GITHUB =================
            print("--- AREA 5: PROJECT EDITING ---")
            # Assuming project card is clickable
            try:
                # Let's just find the first project link
                page.locator("a[href^='/projects/']").first.click()
                time.sleep(2)
                results["project_overview_loads"] = True
                
                # Check tabs
                tabs = page.inner_text("body")
                results["project_tabs_exist"] = "Issues" in tabs and "Settings" in tabs
                
                # Test Settings (Area 17)
                page.locator("a", has_text="Settings").first.click()
                time.sleep(2)
                
                # Setup GitHub
                page.locator("input[name='githubOwner']").fill("abhi2005-bit")
                page.locator("input[name='githubRepo']").fill("devpilot")
                page.locator("button", has_text="Save").first.click()
                time.sleep(2)
                results["github_config_save"] = True
                
            except Exception as e:
                print(f"Project edit failed: {e}")
            
            # ================= AREA 7: ISSUES =================
            print("--- AREA 7: ISSUES ---")
            try:
                page.locator("a", has_text="Issues").first.click()
                time.sleep(2)
                page.locator("button", has_text="New Issue").or_(page.locator("button", has_text="Create Issue")).first.click()
                time.sleep(1)
                
                page.locator("input[name='title']").fill("QA Issue 1")
                page.locator("button[type='submit']").click()
                time.sleep(2)
                
                results["issue_creation_success"] = "QA Issue 1" in page.inner_text("body")
            except Exception as e:
                print(f"Issue creation failed: {e}")
                
            # ================= GITHUB DATA (AREA 11 & 12) =================
            print("--- AREA 11 & 12: GITHUB & CI/CD ---")
            try:
                page.locator("a", has_text="CI/CD").or_(page.locator("a", has_text="GitHub")).first.click()
                time.sleep(3)
                
                # Test the sync bug
                sync_btn = page.locator("button", has_text="Sync").or_(page.locator("button[aria-label='Sync']"))
                if sync_btn.is_visible():
                    sync_btn.click()
                    time.sleep(5)
                    body_text = page.inner_text("body")
                    results["github_sync_error"] = "integer out of range" in body_text or "Failed to fetch" in body_text
                
                # Also check Analytics for "GitHub data unavailable" bug
                page.locator("a", has_text="Analytics").first.click()
                time.sleep(3)
                results["analytics_github_error"] = "GitHub data unavailable" in page.inner_text("body")
            except Exception as e:
                print(f"GitHub/CI/CD check failed: {e}")

            # ================= AREA 13: AI ANALYSIS =================
            print("--- AREA 13: AI ANALYSIS ---")
            try:
                page.locator("a", has_text="AI Assistant").or_(page.locator("a", has_text="AI Analysis")).first.click()
                time.sleep(2)
                
                btn = page.locator("button", has_text="Analyze Project").or_(page.locator("button", has_text="Analyze"))
                if btn.is_visible():
                    btn.click()
                    time.sleep(5)
                    results["ai_analysis_auth_error"] = "Invalid or expired authentication token" in page.inner_text("body")
            except Exception as e:
                print(f"AI check failed: {e}")

        finally:
            with open("qa_results.json", "w") as f:
                json.dump(results, f, indent=2)
            browser.close()

if __name__ == '__main__':
    run_qa()
