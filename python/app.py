from flask import Flask
from selenium import webdriver
from bs4 import BeautifulSoup
from selenium.webdriver.chrome.service import Service as ChromeService
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.common.by import By
import time
import jellyfish
app = Flask(__name__)

@app.route('/')
def crawling():
    driver = webdriver.Chrome(service=ChromeService(ChromeDriverManager().install()))
    # 웹페이지로 이동
    driver.get("https://news.naver.com/breakingnews/section/102/249")

    # 캘린더 버튼 클릭
    calendar_xpath ='//*[@id="newsct"]/div[1]/div[1]/div/button[2]'
    calendar_element = driver.find_element(By.XPATH, calendar_xpath)
    calendar_element.click()
    time.sleep(1)  # 페이지가 로딩될 때까지 대기

    # 특정 날짜 선택
    date_selector = ".is_today"
    date_element = driver.find_element(By.CSS_SELECTOR, date_selector)
    date_element.click()
    time.sleep(1)  # 페이지가 로딩될 때까지 대기

    # 더보기 버튼 계속 클릭하여 모든 기사 로딩
    while True:
        try:
            show_more_button_selector = ".section_more_inner"
            button_element = driver.find_element(By.CSS_SELECTOR, show_more_button_selector)
            if button_element.is_displayed():
                button_element.click()
                time.sleep(1)
            else:
                break
        except:
            break

    # 페이지 소스 가져오기
    page_source = driver.page_source

    # BeautifulSoup을 사용하여 파싱
    soup = BeautifulSoup(page_source, 'html.parser')

    # 기사 제목, 요약, 언론사 가져오기
    title_elements = soup.find_all(class_='sa_text_strong')
    mini_context_elements = soup.find_all(class_='sa_text_lede')
    media_elements = soup.find_all(class_='sa_text_press')
    url_elements = soup.find_all('a',class_='sa_text_title')

    seoul_articles = []
    keyword_articles = []
    key_word=['사고','폭행','화재','낙뢰','지진','재난','홍수','폭발','둔기','살인','절도','충돌','칼부림','묻지마','긴급체포','부상','사망','산불',]
    # 텍스트 출력
    for i in range(len(title_elements)):
        title = title_elements[i].text
        mini_context = mini_context_elements[i].text
        media = media_elements[i].text
        url = url_elements[i]['href']
        if "서울" in title or "서울" in mini_context:
            
            seoul_articles.append({"title": title, "mini_context": mini_context})
            for keyword in key_word:
                if keyword in title or keyword in mini_context:
                    keyword_articles.append({"title": title, "mini_context": mini_context,"media":media, "url":url})
                    break
    
    copy_keyword_articles = keyword_articles[0:]
    i = 0
    while i < len(copy_keyword_articles):
        j = i + 1
        while j < len(copy_keyword_articles):
            title1 = copy_keyword_articles[i]["title"]
            title2 = copy_keyword_articles[j]["title"]
            
            # Jaro-Winkler 유사도 계산
            similarity = jellyfish.jaro_winkler_similarity(title1, title2)
            if similarity > 0.53 :
                del copy_keyword_articles[j]
            else:
                j += 1
        i += 1

  #copy_keyword_articles 이 배열 데이터베이스에 넣기

    filtered_articles = []
    keywords = ['무죄','선고','구속','검거','법원','항소','징역','구형','법원','수사','공판','판사','기소','송치','지난','전날','작년','체포','단속','법정','고속도로']

    for article in copy_keyword_articles:
        title = article["title"]
        mini_context = article["mini_context"]

        if not any(keyword in title for keyword in keywords) and not any(keyword in mini_context for keyword in keywords):
            filtered_articles.append(article)

    return filtered_articles