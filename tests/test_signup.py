from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC


def signup_test():
    options = Options()
    driver = webdriver.Chrome(options=options)
    wait = WebDriverWait(driver, 10)

    try:
        driver.get("http://localhost:3000/signup")

        wait.until(EC.visibility_of_element_located((By.NAME, "first_name"))).send_keys("John")
        driver.find_element(By.NAME, "last_name").send_keys("Doe")
        driver.find_element(By.NAME, "email").send_keys("johndoe2@gmail.com")
        driver.find_element(By.NAME, "password").send_keys("Password123")
        driver.find_element(By.NAME, "confirmPassword").send_keys("Password123")

        driver.find_element(By.XPATH, "//button[@type='submit']").click()

        wait.until(EC.url_contains("/role-selection"))

        current_url = driver.current_url
        assert "/role-selection" in current_url, f"Unexpected URL after signup: {current_url}"

        client_button = wait.until(
            EC.element_to_be_clickable((By.XPATH, "//button[.//strong[text()='Client']]"))
        )
        client_button.click()
        continue_button = wait.until(
            EC.element_to_be_clickable((By.XPATH, "//button[contains(., 'Continue')]"))
        )
        continue_button.click()

        wait.until(EC.url_contains("/fitness-survey"))
        assert "/fitness-survey" in driver.current_url, (
            f"Expected /fitness-survey after role selection, got {driver.current_url}"
        )

        number_inputs = wait.until(
            EC.presence_of_all_elements_located((By.XPATH, "//input[@type='number']"))
        )
        number_inputs[0].send_keys("20")   #Age
        number_inputs[1].send_keys("150")   #Weight

        intermediate_button = driver.find_element(
            By.XPATH, "//button[@type='button'][.//strong[text()='Intermediate']]"
        )
        intermediate_button.click()

        goals_textarea = driver.find_element(By.TAG_NAME, "textarea")
        goals_textarea.send_keys("Build muscle and improve endurance")

        start_button = driver.find_element(
            By.XPATH, "//button[@type='submit' and contains(., 'Start my journey')]"
        )
        start_button.click()

        wait.until(EC.url_contains("/dashboard"))
        assert "/dashboard" in driver.current_url, (
            f"Expected /dashboard at end of onboarding, got {driver.current_url}"
        )
        print("Successfully signed up and completed onboarding survey")

    finally:
        driver.quit()

signup_test()