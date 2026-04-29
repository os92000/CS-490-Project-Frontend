from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import time


def acceptClient():
    options = Options()
    driver = webdriver.Chrome(options=options)
    wait = WebDriverWait(driver, 10)

    try:
        driver.get("http://localhost:3000")
        time.sleep(2)
        login_button = wait.until(EC.element_to_be_clickable((By.XPATH, "//a[normalize-space()='Log in']")))
        login_button.click()
        time.sleep(2)

        wait.until(EC.visibility_of_element_located((By.ID, "email"))).send_keys("ricardobrown@gmail.com")
        driver.find_element(By.ID, "password").send_keys("Password123")
        driver.find_element(By.XPATH, "//button[@type='submit']").click()
        wait.until(lambda d: "/dashboard" in d.current_url)

        wait.until(EC.element_to_be_clickable((By.LINK_TEXT, "Clients"))).click()
        wait.until(EC.url_contains("/my-clients"))

        requests = wait.until(
            EC.element_to_be_clickable((By.XPATH, "//button[contains(., 'Requests')]"))
        )
        requests.click()

        time.sleep(3)
        accept = wait.until(EC.element_to_be_clickable((By.XPATH, "//button[normalize-space()='Accept']")))
        accept.click()

        success = wait.until(EC.visibility_of_element_located((By.CLASS_NAME, "success-message")))
        assert success.is_displayed()
        print("Successfully accepted client request")

    finally:
        driver.quit()


acceptClient()
