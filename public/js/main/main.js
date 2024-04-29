const clientId = localStorage.getItem('clientId');
const params = new URLSearchParams(window.location.search);
const clientIdParam = params.get('client_id');

if (!params.get('destination')) {
  if (clientId && (clientIdParam === 'none' || !clientIdParam)) {
    window.location.href = `/main?client_id=${clientId}`;
  } else if (!clientId && !clientIdParam) {
    window.location.href = '/main?client_id=none';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  document.querySelector('.searchForm').addEventListener('submit', (e) => {
    e.preventDefault();

    const destination = document.querySelector('.searchInput').value;
    window.location.href = `/search?destination=${destination}`;
  });

  if (clientIdParam === 'none') {
    const container = document.querySelector('.noti-container');
    const noneNoti = document.createElement('p');
    noneNoti.textContent =
      '위치 정보가 제공되지 않아 서울 시청의 정보를 제공하고 있습니다.';

    container.appendChild(noneNoti);
  }
});
