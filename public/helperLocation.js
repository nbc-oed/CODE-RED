document.querySelector('.btn').addEventListener('click', () => {
  function saveLocation(latitude, longitude, timestamp) {
    fetch('/mayday/accept-rescue', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        latitude,
        longitude,
      }),
    }).then(() => {
      console.log('최단거리 출력성공');
    });
  }

  navigator.geolocation.getCurrentPosition(function (pos) {
    const latitude = pos.coords.latitude;
    const longitude = pos.coords.longitude;

    saveLocation(latitude, longitude);
  });
});
/* getCurrentPosition
    - 현재 위치정보를 단 한번만 요청하고 가져옴.
    - 앱이 시작될 때 사용자의 현재 위치를 가져와 초기화하거나, 사용자가 특정 기능을 실행할 때 위치 정보를 요구하는 경우 등에 사용
*/
