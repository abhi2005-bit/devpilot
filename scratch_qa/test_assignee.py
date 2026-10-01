import time
from playwright.sync_api import sync_playwright

def test_assignee_issues():
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
        
        # Go to projects
        page.goto("http://localhost:5173/projects")
        time.sleep(2)
        
        # Click the first project
        page.locator("a[href^='/projects/']").first.click()
        time.sleep(2)
        
        # Go to Members to ensure there is at least one other member?
        # Let's skip and just create an issue and assign it to ourselves.
        
        page.locator("a", has_text="Issues").first.click()
        time.sleep(2)
        
        print("Creating an issue...")
        page.locator("button", has_text="New Issue").or_(page.locator("button", has_text="Create Issue")).first.click()
        time.sleep(1)
        
        page.locator("input[name='title']").fill("Assignee Test Issue")
        page.locator("button[type='submit']").click()
        time.sleep(2)
        
        print("Issue created. Checking UI for 'User X' text in issue cards...")
        body = page.inner_text("body")
        if "User 1" in body or "User 3" in body or "User " in body:
            # Let's be more specific
            pass
            
        print("Opening issue to edit assignee...")
        # Find the issue card and click it. Assuming title is in an H3 or span
        page.locator(f"text=Assignee Test Issue").first.click()
        time.sleep(2)
        
        # Change assignee
        print("Changing assignee to current user...")
        assignee_select = page.locator("select[name='assigneeId']").or_(page.locator("select[name='assignee']"))
        if assignee_select.is_visible():
            # Get options
            options = assignee_select.locator("option").all_inner_texts()
            print(f"Assignee options: {options}")
            
            # Select the first user that isn't unassigned
            for opt in options:
                if "Unassigned" not in opt and "Select" not in opt:
                    assignee_select.select_option(label=opt)
                    break
                    
            page.locator("button", has_text="Save").first.click()
            time.sleep(2)
            
            # Reopen issue
            page.locator(f"text=Assignee Test Issue").first.click()
            time.sleep(2)
            
            # Try to unassign
            print("Changing assignee to Unassigned...")
            assignee_select = page.locator("select[name='assigneeId']").or_(page.locator("select[name='assignee']"))
            assignee_select.select_option(label="Unassigned")
            page.locator("button", has_text="Save").first.click()
            time.sleep(2)
            
            # Reload page completely and see if it persists
            page.reload()
            time.sleep(2)
            page.locator(f"text=Assignee Test Issue").first.click()
            time.sleep(2)
            
            assignee_select = page.locator("select[name='assigneeId']").or_(page.locator("select[name='assignee']"))
            val = assignee_select.evaluate("el => el.options[el.selectedIndex].text")
            print(f"Assignee after refresh is: {val}")
            if "Unassigned" not in val:
                print("FOUND BUG: Changing issue to Unassigned did not persist.")
        else:
            print("Could not find assignee select")

        browser.close()

if __name__ == '__main__':
    test_assignee_issues()
