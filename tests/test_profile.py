from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import Select
from selenium.webdriver.common.keys import Keys
import time

def profile_test():
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

        wait.until(EC.element_to_be_clickable((By.LINK_TEXT, "Profile"))).click()
        wait.until(EC.url_contains("/profile"))
        
        
        input_fields = driver.find_elements(By.CSS_SELECTOR, "input:not([type='file'])")
        
        first_name = wait.until(EC.element_to_be_clickable((By.XPATH,"//div[contains(@class,'form-group')][.//label[normalize-space()='First name']]//input")))

        time.sleep(2)

        first_name.click()
        first_name.clear()
        first_name.send_keys("Ricardo")
        time.sleep(1)
    
        input_fields[1].clear()
        input_fields[1].send_keys("Brown")
        time.sleep(1)
        
        input_fields[2].clear()
        input_fields[2].send_keys("+1 (973) 417-9543")
        
        bio_input = driver.find_element(By.CSS_SELECTOR, 'textarea[placeholder="Tell us a bit about yourself…"]')
        bio_input.clear()
        bio_input.send_keys("Hi I'm Ricardo!")
        
        save_profile = wait.until(EC.element_to_be_clickable((By.XPATH, "//button[normalize-space()='Save profile']")))
        driver.execute_script("arguments[0].click();", save_profile)
        
        success = wait.until(EC.visibility_of_element_located((By.CLASS_NAME, "success-message")))

        assert success.is_displayed()
        print("Successfully updated profile")
        
        time.sleep(2)
        age = driver.find_element(By.CSS_SELECTOR, 'input[placeholder="25"]')
        age.clear()
        age.send_keys("21")
        
        weight = driver.find_element(By.CSS_SELECTOR, 'input[placeholder="70"]')
        weight.clear()
        weight.send_keys("150")
        
        fitness_dropdown = wait.until(EC.presence_of_element_located((By.TAG_NAME, "select")))
        Select(fitness_dropdown).select_by_value("beginner")
        
        goals_input = driver.find_element(By.CSS_SELECTOR, 'textarea[placeholder="e.g. Lose 8kg, build muscle, run a 5K…"]')
        goals_input.clear()
        goals_input.send_keys("Lose 10kg, improve endurance, build muscles ")
        
        save_goals = wait.until(EC.element_to_be_clickable((By.XPATH, "//button[normalize-space()='Save goals']")))
        driver.execute_script("arguments[0].click();", save_goals)
        
        success = wait.until(EC.visibility_of_element_located((By.CLASS_NAME, "success-message")))

        assert success.is_displayed()
        print("Successfully updated goals")
        
    finally:
        driver.quit()


profile_test()
