import time
from playwright.sync_api import sync_playwright

def test_auth():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        print("Testing Authentication Area 1...")
        page.goto("http://localhost:5173")
        
        # Give it a moment to load
        page.wait_for_load_state("networkidle")
        
        # Check login page renders
        print(f"Initial URL: {page.url}")
        print(f"Title: {page.title()}")
        
        try:
            email_input = page.locator("input[type='email']")
            password_input = page.locator("input[type='password']")
            print(f"Email input visible: {email_input.is_visible()}")
            print(f"Password input visible: {password_input.is_visible()}")
        except Exception as e:
            print(f"Error finding inputs: {e}")

        # Show/hide password
        try:
            # Look for a button that might toggle password visibility
            toggle = page.locator("button", has_text="Show").or_(page.locator("button", has_text="Hide"))
            if toggle.is_visible():
                print("Show/hide password button found.")
                toggle.click()
                print(f"Password input type after toggle: {password_input.get_attribute('type')}")
            else:
                # Sometimes it's an eye icon
                print("No explicit Show/Hide text button found, might be an icon.")
        except Exception as e:
            pass

        # Try invalid login
        email_input.fill("invalid@example.com")
        password_input.fill("wrongpass")
        page.locator("button[type='submit']").click()
        
        time.sleep(2)
        print(f"URL after invalid login: {page.url}")
        # Look for error message
        print(f"Body text contains 'Invalid': {'Invalid' in page.inner_text('body')}")
        
        # Registration
        try:
            page.locator("text=Sign up").click()
            time.sleep(1)
            print(f"URL after clicking Sign up: {page.url}")
            
            # Register user
            page.locator("input[name='email'], input[type='email']").fill("qatest@example.com")
            page.locator("input[name='name'], input[placeholder*='Name']").fill("QA Tester")
            
            # Find all password inputs
            pass_inputs = page.locator("input[type='password']")
            print(f"Found {pass_inputs.count()} password inputs for registration")
            if pass_inputs.count() >= 2:
                pass_inputs.nth(0).fill("TestPass123!")
                pass_inputs.nth(1).fill("TestPass123!")
            else:
                pass_inputs.nth(0).fill("TestPass123!")
            
            page.locator("button[type='submit']").click()
            time.sleep(2)
            print(f"URL after registration submit: {page.url}")
            
            # Now login
            page.goto("http://localhost:5173/login")
            time.sleep(1)
            page.locator("input[type='email']").fill("qatest@example.com")
            page.locator("input[type='password']").fill("TestPass123!")
            page.locator("button[type='submit']").click()
            
            time.sleep(3)
            print(f"URL after valid login: {page.url}")
            
            # Check dashboard elements
            print(f"Dashboard URL contains '/dashboard': {'/dashboard' in page.url.lower()}")
            
            # Refresh
            page.reload()
            time.sleep(2)
            print(f"URL after refresh: {page.url}")
            
            # Logout
            try:
                # Try finding logout button or profile menu
                profile_menu = page.locator("button", has_text="QA Tester").or_(page.locator("button", has_text="Profile")).or_(page.locator("button.profile-menu"))
                if profile_menu.is_visible():
                    profile_menu.click()
                    time.sleep(0.5)
                
                logout_btn = page.locator("text=Logout").or_(page.locator("text=Log out"))
                if logout_btn.is_visible():
                    logout_btn.click()
                    time.sleep(2)
                    print(f"URL after logout: {page.url}")
                else:
                    print("Logout button not found.")
            except Exception as e:
                print(f"Error during logout: {e}")
                
        except Exception as e:
            print(f"Error during registration/login flow: {e}")

        browser.close()

if __name__ == '__main__':
    test_auth()
