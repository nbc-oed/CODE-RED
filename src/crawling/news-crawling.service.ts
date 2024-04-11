import puppeteer from 'puppeteer';
import * as natural from 'natural';
export class Crawling {
  async crawling() {
    let browser = await puppeteer.launch({
      headless: false,
    });
    try {
      const page = await browser.newPage();
      page.setDefaultNavigationTimeout(2 * 60 * 1000);
      await Promise.all([
        await page.goto('https://news.naver.com/breakingnews/section/102/249'),
        await page.click('._CALENDAR_LAYER_TOGGLE'),
        // await page.click(`.calendar .calendar-day-2024-04-01`),
        await page.click(`.calendar .calendar-day-${today()}`),
      ]);
      await clickMorePageEnd(page);
      const result = await page.$$eval(
        '.section_article .sa_item',
        (resultItems) => {
          return resultItems
            .map((resultItem) => {
              const titleElement = resultItem
                .querySelector('.sa_text')
                .querySelector('a');
              const textElement = resultItem.querySelector('.sa_text_lede');
              const newsCompanyElement =
                resultItem.querySelector('.sa_text_press');

              const title = titleElement ? titleElement.innerText.trim() : '';
              const url = titleElement ? titleElement.href : '';
              const text = textElement ? textElement.textContent.trim() : '';
              const newsCompany = newsCompanyElement
                ? newsCompanyElement.textContent.trim()
                : '';

              const keywords = [
                '사고',
                '폭행',
                '화재',
                '낙뢰',
                '지진',
                '재난',
                '홍수',
                '폭발',
                '둔기',
                '살인',
                '절도',
                '충돌',
                '칼부림',
                '묻지마',
              ];

              if (!(title.includes('서울') || text.includes('서울'))) {
                return null;
              }

              if (!keywords.some((keyword) => title.includes(keyword))) {
                return null;
              }

              return { url, title, newsCompany };
            })
            .filter((item) => item !== null);
        },
      );

      for (let i = 0; i < result.length; i++) {
        for (let j = i + 1; j < result.length; j++) {
          let score = natural.JaroWinklerDistance(
            result[i].title,
            result[j].title,
            undefined,
          );
          if (score > 0.5) {
            result.splice(j, 1);
            j--;
          }
        }
      }

      return result;
    } finally {
      await browser.close();
    }
  }
}

const today = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth() + 1;
  const strMonth = month < 10 ? '0' + month : month;
  const day = today.getDate();
  const strDay = day < 10 ? '0' + day : day;
  const formattedDate = `${year}-${strMonth}-${strDay}`;
  return formattedDate;
};

async function clickMorePageEnd(page) {
  while (true) {
    await page.waitForSelector(
      '.section_latest .section_more .section_more_inner',
    );
    const moreButton = await page.$(
      '.section_latest .section_more .section_more_inner',
    );
    const endpoint = await page.$(
      '.section_latest .section_more a[style="display: none;"]',
    );
    if (endpoint) break;

    if (endpoint) break;
    await moreButton.evaluate((b) => b.click());
  }
}
