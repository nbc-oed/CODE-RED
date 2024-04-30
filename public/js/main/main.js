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
  let errorInput = document.getElementById('errorvalue');
  let errorValue = errorInput.value;
  if (errorValue === 'true') {
    console.log('여기 들어옴');
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
  } else {
    alert('해당 목적지를 찾을 수 없습니다. 다시 입력해주세요.');
    window.location.href = '/main';
  }
});
