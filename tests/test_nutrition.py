from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import Select
import time


def nutrition():
    options = Options()
    driver = webdriver.Chrome(options=options)
    wait = WebDriverWait(driver, 10)

    try:
        driver.get("http://localhost:3000/login")

        wait.until(EC.visibility_of_element_located((By.ID, "email"))).send_keys("test@gmail.com")
        driver.find_element(By.ID, "password").send_keys("Password123")
        driver.find_element(By.XPATH, "//button[@type='submit']").click()

        wait.until(lambda d: "/dashboard" in d.current_url)

        wait.until(EC.element_to_be_clickable((By.LINK_TEXT, "Nutrition"))).click()
        wait.until(EC.url_contains("/nutrition"))
        
        #Log meal
        meals_tab = wait.until(
            EC.element_to_be_clickable((By.XPATH, "//button[normalize-space()='Meals']"))
        )
        meals_tab.click()

        meal_dropdown = wait.until(EC.presence_of_element_located((By.TAG_NAME, "select")))
        Select(meal_dropdown).select_by_value("lunch")

        food_input = driver.find_element(By.CSS_SELECTOR, 'textarea[placeholder="e.g. 2 eggs, toast, orange juice…"]')
        food_input.send_keys("Chicken, rice, broccoli")
        
        number_inputs = driver.find_elements(By.CSS_SELECTOR, 'input[type="number"]')
        
        number_inputs[0].send_keys("500")
        number_inputs[1].send_keys("40")
        number_inputs[2].send_keys("50")
        number_inputs[3].send_keys("10")
        
        save_button = wait.until(EC.element_to_be_clickable((By.XPATH, "//button[normalize-space()='Save meal']")))
        driver.execute_script("arguments[0].click();", save_button)
        
        success = wait.until(EC.visibility_of_element_located((By.CLASS_NAME, "success-message")))

        assert success.is_displayed()
        print("Meal logged successfully")
        
        #Log daily metrics
        metrics_tab = wait.until(EC.element_to_be_clickable((By.XPATH, "//button[normalize-space()='Metrics']")))
        metrics_tab.click()
        
        steps_input = driver.find_element(By.CSS_SELECTOR, 'input[placeholder="e.g. 8000"]')
        steps_input.send_keys("1000")
        
        calories_input = driver.find_element(By.CSS_SELECTOR, 'input[placeholder="kcal"]')
        calories_input.send_keys("500")
        
        water_input =  driver.find_element(By.CSS_SELECTOR, 'input[placeholder="e.g. 2000"]')
        water_input.send_keys("1500")
        
        save_metrics = wait.until(EC.element_to_be_clickable((By.XPATH, "//button[normalize-space()='Save daily metrics']")))
        driver.execute_script("arguments[0].click();", save_metrics)
        
        success = wait.until(EC.visibility_of_element_located((By.CLASS_NAME, "success-message")))

        assert success.is_displayed()
        print("Daily metrics logged successfully")
        
        #Log body metrics
        weight_input = driver.find_element(By.CSS_SELECTOR, 'input[placeholder="e.g. 72.5"]')
        weight_input.send_keys("170")
        
        body_fat_input = driver.find_element(By.CSS_SELECTOR, 'input[placeholder="%"]')
        body_fat_input.send_keys("30")
        
        waist_input = driver.find_element(By.CSS_SELECTOR, 'input[placeholder="cm"]')
        waist_input.send_keys("60")
        
        save_body_metrics = wait.until(EC.element_to_be_clickable((By.XPATH, "//button[normalize-space()='Save body metrics']")))
        driver.execute_script("arguments[0].click();", save_body_metrics)
        
        success = wait.until(EC.visibility_of_element_located((By.CLASS_NAME, "success-message")))

        assert success.is_displayed()
        print("Body metrics logged successfully")
        
        #Log wellness check-in
        wellness_tab = wait.until(EC.element_to_be_clickable((By.XPATH, "//button[normalize-space()='Wellness']")))
        wellness_tab.click()
        
        mood_button = wait.until(EC.element_to_be_clickable((By.XPATH, "//button[normalize-space()='😊']")))
        mood_button.click()
        
        number_inputs = driver.find_elements(By.CSS_SELECTOR, 'input[type="number"]')
        
        number_inputs[0].clear()
        number_inputs[0].send_keys("8")
        number_inputs[1].clear()
        number_inputs[1].send_keys("5")
        number_inputs[2].send_keys("8")
        number_inputs[3].send_keys("1000")
        
        sleep_dropdown = wait.until(EC.presence_of_element_located((By.TAG_NAME, "select")))
        Select(sleep_dropdown).select_by_value("excellent")
        
        save_wellness = wait.until(EC.element_to_be_clickable((By.XPATH, "//button[normalize-space()='Save wellness']")))
        driver.execute_script("arguments[0].click();", save_wellness)
        
        success = wait.until(EC.visibility_of_element_located((By.CLASS_NAME, "success-message")))

        assert success.is_displayed()
        print("Wellness check-in logged successfully")
        
        #Log meal plan
        plan_tab = wait.until(EC.element_to_be_clickable((By.XPATH, "//button[normalize-space()='Meal Plans']")))
        plan_tab.click()
        
        title_input = driver.find_element(By.CSS_SELECTOR, 'input[placeholder="e.g. High Protein Week"]')
        title_input.send_keys("High Protein Meal Plan")
        
        notes_input = driver.find_element(By.CSS_SELECTOR, 'textarea[placeholder*="Describe the meal plan"]')
        notes_input.send_keys("100g chicken, 4 eggs, 50g tuna, 1 protein shake, 30g beef")
        
        plan_button = wait.until(EC.element_to_be_clickable((By.XPATH, "//button[normalize-space()='Save plan']")))
        driver.execute_script("arguments[0].click();", plan_button)
        
        success = wait.until(EC.visibility_of_element_located((By.CLASS_NAME, "success-message")))

        assert success.is_displayed()
        print("Meal Plan logged successfully")
        
    finally:
        driver.quit()

nutrition()
