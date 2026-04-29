from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import Select
import time


def createWorkoutPlan():
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

        open_button = wait.until(EC.element_to_be_clickable((By.XPATH, "//div[contains(@class,'feature-panel')][.//span[normalize-space()='Programming']]//button")))

        driver.execute_script("arguments[0].click();", open_button)

        wait.until(EC.url_contains("/my-workouts"))
        time.sleep(2)

        createPlan = wait.until(EC.element_to_be_clickable((By.XPATH, "//button[contains(., 'Create')]")))
        
        createPlan.click()

        client_dropdown = wait.until(EC.presence_of_element_located((By.TAG_NAME, "select")))
        Select(client_dropdown).select_by_index(1)

        plan_name = driver.find_element(By.CSS_SELECTOR, 'input[placeholder="e.g. 4-Week Strength Builder"]')
        plan_name.send_keys("5-week Strength Builder")

        description = driver.find_element(By.CSS_SELECTOR, 'textarea[placeholder="Describe the goals and approach…"]')
        description.send_keys("Build more strength over a period of 4 weeks")

        addDay = wait.until(EC.element_to_be_clickable((By.XPATH, "//button[normalize-space()='+ Add day']")))
        driver.execute_script("arguments[0].click();", addDay)

        notes = driver.find_element(By.CSS_SELECTOR, 'textarea[placeholder="Instructions for this day…"]')
        notes.send_keys("Focus on the exercises and perform them slowly")

        addExercise = wait.until(EC.element_to_be_clickable((By.XPATH, "//button[normalize-space()='+ Add exercise']")))
        driver.execute_script("arguments[0].click();", addExercise)

        create_button = wait.until(EC.element_to_be_clickable((By.XPATH, "//button[normalize-space()='Create workout plan']")))
        driver.execute_script("arguments[0].click();", create_button)

        time.sleep(3)
        assert "/my-workouts" in driver.current_url 
        
        print("Successfully created workout plan")

    finally:
        driver.quit()


createWorkoutPlan()
