from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import time

def sendMessage():
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

        wait.until(EC.visibility_of_element_located((By.ID, "email"))).send_keys("johndoe105@gmail.com")
        driver.find_element(By.ID, "password").send_keys("Password123")
        driver.find_element(By.XPATH, "//button[@type='submit']").click()

        wait.until(lambda d: "/dashboard" in d.current_url)

        wait.until(EC.element_to_be_clickable((By.LINK_TEXT, "Chat"))).click() 
        wait.until(EC.url_contains("/chat"))
        time.sleep(2)

        coach = driver.find_element(By.CLASS_NAME, "chat-item")
        coach.click()

        message = driver.find_element(By.CSS_SELECTOR, 'input[placeholder="Type a message…"]')
        message.send_keys("Hello how are you?")
        time.sleep(2)

        send_message = wait.until(EC.element_to_be_clickable((By.XPATH, "//button[normalize-space()='Send']")))
        driver.execute_script("arguments[0].click();", send_message)
        time.sleep(3)
        
        wait.until(EC.visibility_of_element_located((By.XPATH, "//*[contains(text(), 'Hello how are you?')]")))

        print("Successfully sent message")
        driver.get("http://localhost:3000/dashboard")
        time.sleep(2)
        
    finally:
        driver.quit()


sendMessage()

