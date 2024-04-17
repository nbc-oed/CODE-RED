import itertools
from flask import Flask
from selenium import webdriver
from bs4 import BeautifulSoup
from selenium.webdriver.chrome.service import Service as ChromeService
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.common.by import By
import time
import jellyfish
import os
import psycopg2
from flask_apscheduler import APScheduler

from dotenv import load_dotenv
load_dotenv()

app = Flask(__name__)

scheduler = APScheduler()
scheduler.init_app(app)

# PostgreSQL 데이터베이스 연결 및 환경변수 설정.
def create_connection():
    conn = psycopg2.connect(
        host=os.getenv('DB_HOST'),
        dbname=os.getenv('DB_NAME'),
        user=os.getenv('DB_USERNAME'),
        password=os.getenv('DB_PASSWORD'),
        port=os.getenv('DB_PORT')
    )
    return conn
conn = create_connection()


def crawling():
    options = webdriver.ChromeOptions()
    options.add_argument('--headless')  # headless 모드 활성화
    service = ChromeService(ChromeDriverManager().install())
    driver = webdriver.Chrome(service=service, options=options)
    
    try:
        driver.get("https://news.naver.com/breakingnews/section/102/249")

        calendar_xpath ='//*[@id="newsct"]/div[1]/div[1]/div/button[2]'
        calendar_element = driver.find_element(By.XPATH, calendar_xpath)
        calendar_element.click()
        time.sleep(1)

        date_selector = ".calendar-day-2024-04-04"
        # date_selector = ".is_today"
        date_element = driver.find_element(By.CSS_SELECTOR, date_selector)
        date_element.click()
        time.sleep(1)

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

        page_source = driver.page_source

        soup = BeautifulSoup(page_source, 'html.parser')

        title_elements = soup.find_all(class_='sa_text_strong')
        mini_context_elements = soup.find_all(class_='sa_text_lede')
        media_elements = soup.find_all(class_='sa_text_press')
        url_elements = soup.find_all('a',class_='sa_text_title')

        seoul_articles = []
        key_word=['사고','폭행','화재','낙뢰','지진','재난','홍수','폭발','둔기','살인','절도','충돌','칼부림','묻지마','긴급체포','부상','사망','산불',]

        for i in range(len(title_elements)):
            title = title_elements[i].text
            mini_context = mini_context_elements[i].text
            media = media_elements[i].text
            url = url_elements[i]['href']
            
            if "서울" in title or "서울" in mini_context:
                for keyword in key_word:
                    if keyword in title or keyword in mini_context:
                        seoul_articles.append({"title": title, "mini_context": mini_context,"media":media, "url":url})
                        break
        
        copy_seoul_articles = seoul_articles[0:]
        i = 0
        while i < len(copy_seoul_articles):
            j = i + 1
            while j < len(copy_seoul_articles):
                title1 = copy_seoul_articles[i]["title"]
                title2 = copy_seoul_articles[j]["title"]
                
                # Jaro-Winkler 유사도 계산
                similarity = jellyfish.jaro_winkler_similarity(title1, title2)
                if similarity > 0.53 :
                    del copy_seoul_articles[j]
                else:
                    j += 1
            i += 1
        return copy_seoul_articles
        
    except Exception as e:
        error_message = f"데이터베이스 작업 중 오류 발생: {type(e).__name__} - {e}"
        print(error_message)
        return error_message
    finally:
        driver.close()

@scheduler.task('interval', id='do_save_news_5minutes', minutes=2)
def saveNews():
    result = crawling()
    
    cursor = conn.cursor()
    cursor.execute('select title from news')
    newsTitle = cursor.fetchall()
    
    flat_newsTitle = list(itertools.chain(*newsTitle))
    
    addNews_article=[]
    
    for news in result:
        if news['title'] not in flat_newsTitle:
            addNews_article.append(news)

    values = [(article['title'], article['mini_context'], article['media'], article['url']) for article in addNews_article]

    cursor.executemany("INSERT INTO news (title , text, media, url) VALUES (%s, %s,%s, %s)", values)
    conn.commit()
    cursor.close()
    


@app.route('/news',methods=['GET'])
def getNews():
    cursor = conn.cursor()
    cursor.execute('select title, url, media, created_at from news order by created_at desc')
    news = cursor.fetchall()
    return news









    
if __name__ == '__main__':
    scheduler.start()
    app.run()

