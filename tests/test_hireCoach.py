from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.keys import Keys
import time

def hireCoach():
    options = Options()
    driver = webdriver.Chrome(options=options)
    wait = WebDriverWait(driver, 10)

    try:
        driver.get("http://localhost:3000")
        time.sleep(2)
        login_button = wait.until(EC.element_to_be_clickable((By.XPATH, "//a[normalize-space()='Log in']")))
        login_button.click()
        time.sleep(2)

        wait.until(EC.visibility_of_element_located((By.ID, "email"))).send_keys("johndoe105@gmail.com")
        driver.find_element(By.ID, "password").send_keys("Password123")
        driver.find_element(By.XPATH, "//button[@type='submit']").click()

        wait.until(lambda d: "/dashboard" in d.current_url)
        wait.until(EC.element_to_be_clickable((By.LINK_TEXT, "Coaches"))).click()
        wait.until(EC.url_contains("/coaches"))

        
        coach_cards = wait.until(
        EC.presence_of_all_elements_located((By.CSS_SELECTOR, ".coach-card"))
        )

        view_profile_button = coach_cards[-1].find_element(By.TAG_NAME, "button")
        time.sleep(2)
        driver.execute_script("arguments[0].click();", view_profile_button)
       
        hire_button = wait.until(
            EC.element_to_be_clickable((By.XPATH, "//button[contains(., 'Hire this coach')]"))
        )
        hire_button.click()

        success_message = wait.until(
            EC.visibility_of_element_located((By.CLASS_NAME, "success-message"))
        )

        assert "Hire request sent!" in success_message.text
        print("Succesfully sent hire request to coach")
    finally:
        driver.quit()

hireCoach()

