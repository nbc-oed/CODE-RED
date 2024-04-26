const newsDiv = document.querySelector('.news');
let curPage = 2;

newsDiv.addEventListener('scroll', function () {
  if (newsDiv.clientHeight + newsDiv.scrollTop >= newsDiv.scrollHeight - 0.5) {
    fetch(`news/api?page=${curPage}`)
      .then((res) => res.json())
      .then((data) => {
        data.forEach((news) => {
          const trElem = document.createElement('tr');
          trElem.innerHTML = `
            <td><a href="${news.url}">${news.title}</a></td>
            <td>${news.created_at}</td>
          `;

          document.querySelector('.newsTable').appendChild(trElem);
        });
        curPage++;
      });
  }
});
