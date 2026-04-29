from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import time

def analytics_test():
    options = Options()
    options.add_argument("--start-maximized")
    driver = webdriver.Chrome(options=options)
    wait = WebDriverWait(driver, 10)

    try:
        driver.get("http://localhost:3000")
        time.sleep(2)
        login_button = wait.until(EC.element_to_be_clickable((By.XPATH, "//a[normalize-space()='Log in']")))
        login_button.click()
        time.sleep(2)

        wait.until(EC.visibility_of_element_located((By.ID, "email"))).send_keys("test@gmail.com")
        driver.find_element(By.ID, "password").send_keys("Password123")
        driver.find_element(By.XPATH, "//button[@type='submit']").click()

        wait.until(lambda d: "/dashboard" in d.current_url)

        wait.until(EC.element_to_be_clickable((By.LINK_TEXT, "Analytics"))).click()
        wait.until(EC.url_contains("/analytics"))
        
        time.sleep(2)
        week_button = wait.until(EC.element_to_be_clickable((By.XPATH, "//button[normalize-space()='7d']")))
        week_button.click()
        
        time.sleep(2)
        ninety_button = wait.until(EC.element_to_be_clickable((By.XPATH, "//button[normalize-space()='90d']")))
        ninety_button.click()
        
        time.sleep(2)
        year_button = wait.until(EC.element_to_be_clickable((By.XPATH, "//button[normalize-space()='Year']")))
        year_button.click()
        time.sleep(2)
        
        print("Successfully viewed analytics")
        
    finally:
        driver.quit()


analytics_test()
