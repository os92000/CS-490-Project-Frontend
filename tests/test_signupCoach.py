from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import Select
import time


def signup_test():
    options = Options()
    prefs = {
    "credentials_enable_service": False,
    "profile.password_manager_enabled": False,
    "profile.password_manager_leak_detection": False,
    }

    options.add_experimental_option("prefs", prefs)
    options.add_argument("--disable-save-password-bubble")
    options.add_argument("--disable-features=PasswordLeakDetection")
    
    driver = webdriver.Chrome(options=options)
    wait = WebDriverWait(driver, 10)

    try:
        driver.get("http://localhost:3000")
        time.sleep(2)
        signup_button = wait.until(EC.element_to_be_clickable((By.XPATH, "//a[normalize-space()='Sign up']")))
        signup_button.click()
        time.sleep(2)

        wait.until(EC.visibility_of_element_located((By.NAME, "first_name"))).send_keys("Ricardo")
        driver.find_element(By.NAME, "last_name").send_keys("Brown")
        driver.find_element(By.NAME, "email").send_keys("ricardobrown@gmail.com")
        driver.find_element(By.NAME, "password").send_keys("Password123")
        driver.find_element(By.NAME, "confirmPassword").send_keys("Password123")

        driver.find_element(By.XPATH, "//button[@type='submit']").click()

        wait.until(EC.url_contains("/role-selection"))

        current_url = driver.current_url
        assert "/role-selection" in current_url, f"Unexpected URL after signup: {current_url}"

        coach_button = wait.until(
            EC.element_to_be_clickable((By.XPATH, "//button[.//strong[text()='Coach']]"))
        )
        coach_button.click()
        continue_button = wait.until(
            EC.element_to_be_clickable((By.XPATH, "//button[contains(., 'Continue')]"))
        )
        continue_button.click()

        wait.until(EC.url_contains("/coach-onboarding"))
        assert "/coach-onboarding" in driver.current_url, (
            f"Expected /coach-onboarding after role selection, got {driver.current_url}"
        )
        time.sleep(3)

        experience = driver.find_element(By.CSS_SELECTOR, 'input[placeholder="e.g. 5"]')
        experience.send_keys("5")

        bio = driver.find_element(By.CSS_SELECTOR, 'textarea[placeholder="Describe your coaching style and approach…"]')
        bio.send_keys("I focus on doing HIIT Training and offering comprehensive workout plans")

        certifications = driver.find_element(By.CSS_SELECTOR, 'textarea[placeholder="List your fitness certifications…"]')
        certifications.send_keys("CPR")

        specialization = driver.find_element(By.CSS_SELECTOR, 'textarea[placeholder="What kind of clients or goals do you specialize in?"]')
        specialization.send_keys("HIIT Training, Weight Loss")

        weight_loss = wait.until(EC.element_to_be_clickable((By.XPATH, "//button[normalize-space()='Weight Loss']")))
        weight_loss.click()

        HIIT = wait.until(EC.element_to_be_clickable((By.XPATH, "//button[normalize-space()='HIIT Training']")))
        HIIT.click()

        add_slot = wait.until(EC.element_to_be_clickable((By.XPATH, "//button[normalize-space()='+ Add slot']")))
        driver.execute_script("arguments[0].click();", add_slot)

        availability_dropdown = driver.find_elements(By.TAG_NAME, "select")
       
        Select(availability_dropdown[1]).select_by_value("1")

        session_type = driver.find_element(By.CSS_SELECTOR, 'input[placeholder="e.g. Monthly"]')
        session_type.send_keys("Monthly")

        price = driver.find_element(By.CSS_SELECTOR, 'input[placeholder="75"]')
        price.send_keys("100")

        time.sleep(2)

        submit_button = wait.until(EC.element_to_be_clickable((By.XPATH, "//button[normalize-space()='Submit coach application']")))
        driver.execute_script("arguments[0].click();", submit_button)
        
        time.sleep(2)
        assert "/dashboard" in driver.current_url 
        print("Successfully signed up coach")

    finally:
        driver.quit()

signup_test()