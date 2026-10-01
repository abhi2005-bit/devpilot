import time
from playwright.sync_api import sync_playwright

def test_github_issues():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()

        print("Logging in...")
        page.goto("http://localhost:5173/login")
        page.locator("input[type='email']").fill("qatest@example.com")
        page.locator("input[type='password']").fill("TestPass123!")
        page.locator("button[type='submit']").click()
        page.wait_for_url("**/dashboard*")
        print("Logged in successfully.")

        print("Creating a project with GitHub connection...")
        page.goto("http://localhost:5173/projects")
        time.sleep(2)
        page.locator("text=New Project").first.click()
        time.sleep(1)
        page.locator("input[name='name']").fill("GitHub Test Project")
        page.locator("input[name='github_owner']").fill("abhi2005-bit")
        page.locator("input[name='github_repo']").fill("devpilot")
        page.locator("button[type='submit']").click()
        time.sleep(3)
        
        print(f"Current URL after project create: {page.url}")
        
        # Now go to CI/CD tab
        print("Checking CI/CD tab...")
        try:
            page.locator("a", has_text="CI/CD").first.click()
            time.sleep(2)
            
            # Click sync
            sync_btn = page.locator("button", has_text="Sync").or_(page.locator("button[aria-label='Sync']"))
            if sync_btn.is_visible():
                print("Clicking Sync button...")
                sync_btn.click()
                time.sleep(5)
                body = page.inner_text("body")
                print("Body after sync:")
                if "integer out of range" in body:
                    print("FOUND BUG: integer out of range in UI")
                elif "Failed to fetch" in body:
                    print("FOUND BUG: Failed to fetch in UI")
                else:
                    print("Sync didn't show explicit error in UI text. Maybe it worked?")
            else:
                print("Could not find Sync button on CI/CD page")
        except Exception as e:
            print(f"Error checking CI/CD: {e}")

        # Now go to Analytics for GitHub data unavailable bug
        print("Checking Analytics tab for GitHub Data bug...")
        try:
            page.locator("a", has_text="Analytics").first.click()
            time.sleep(3)
            body = page.inner_text("body")
            if "GitHub data unavailable" in body:
                print("FOUND BUG: GitHub data unavailable in Analytics")
            else:
                print("No 'GitHub data unavailable' message found in Analytics")
        except Exception as e:
            print(f"Error checking Analytics: {e}")

        # AI Analysis Bug
        print("Checking AI Assistant tab...")
        try:
            page.locator("a", has_text="AI Assistant").or_(page.locator("a", has_text="AI Analysis")).first.click()
            time.sleep(2)
            
            btn = page.locator("button", has_text="Analyze Project").or_(page.locator("button", has_text="Analyze"))
            if btn.is_visible():
                btn.click()
                time.sleep(5)
                body = page.inner_text("body")
                if "Invalid or expired authentication token" in body:
                    print("FOUND BUG: AI analysis failed — Invalid or expired authentication token.")
                elif "AI analysis failed" in body:
                    print("FOUND BUG: AI analysis failed (other reason).")
                else:
                    print("AI analysis seems to have started or succeeded.")
            else:
                print("Analyze button not found")
        except Exception as e:
            print(f"Error checking AI Assistant: {e}")

        browser.close()

if __name__ == '__main__':
    test_github_issues()
