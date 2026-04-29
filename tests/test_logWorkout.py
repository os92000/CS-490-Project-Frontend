from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import time


def logWorkout():
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
        wait.until(EC.element_to_be_clickable((By.LINK_TEXT, "Workouts"))).click()
        wait.until(EC.url_contains("/my-workouts"))

        log_button = wait.until(
            EC.element_to_be_clickable((By.XPATH, "//button[contains(., 'Log workout')]"))
        )
        log_button.click()

        exercise_input = wait.until(
            EC.visibility_of_element_located(
                (By.CSS_SELECTOR, 'input[placeholder="Search or type exercise name"]')
            )
        )
        exercise_input.send_keys("Running")

        minutes_input = driver.find_element(
            By.CSS_SELECTOR, 'input[placeholder="Min"]'
        )
        minutes_input.send_keys("30")

        notes_input = driver.find_element(
            By.CSS_SELECTOR, 'textarea[placeholder="How did it go?"]'
        )
        notes_input.send_keys("it went well")
        
        time.sleep(3)
        log_session_button = wait.until(
            EC.element_to_be_clickable((By.XPATH, "//button[normalize-space()='Log session']"))
        )

        driver.execute_script("arguments[0].click();", log_session_button)

        success = wait.until(EC.visibility_of_element_located((By.CLASS_NAME, "success-message")))
        assert success.is_displayed()
        print("Successfully logged exercise")
        
    finally:
        driver.quit()

logWorkout()

