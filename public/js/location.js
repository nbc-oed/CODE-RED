document.querySelector('#sos').addEventListener('click', () => {
  async function saveLocation(latitude, longitude) {
    await fetch('/mayday', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        latitude,
        longitude,
      }),
    })
      .then((res) => {
        return res.json();
      })
      .then((res) => {
        return res.json();
      })
      .then((data) => {
        if (data.message === '위치정보 저장 성공') {
          console.log(data.message);
        }
      });
  }

  let id;
  let options;

  options = {
    enableHighAccuracy: true,
    timeout: 27000,
    maximumAge: 180000,
  };

  async function success(pos) {
    const crd = pos.coords;

    let userLat = crd.latitude;
    let userLng = crd.longitude;
    console.log(`
    위도:${userLat}
    경도:${userLng}`); // 로그인 될때 까지 사용해야함.
    await saveLocation(userLat, userLng);
  }
  function error(err) {
    console.error(`ERROR(${err.code}): ${err.message}`);
  }

  navigator.geolocation.getCurrentPosition(success, error, options);
});
//  else {
//   async function getUserLocation() {
//     return new Promise((resolve) => {
//       if ('geolocation' in navigator) {
//         navigator.geolocation.getCurrentPosition(
//           (position) => {
//             const userLocation = {
//               latitude: position.coords.latitude,
//               longitude: position.coords.longitude,
//             };
//             const closestRegion = findClosestRegion(userLocation);
//             resolve(closestRegion ? closestRegion.roomId : null);
//           },
//           (error) => {
//             console.error('사용자 위치 가져오기 오류:', error);
//             resolve(null);
//           },
//         );
//       } else {
//         console.error('Geolocation이 지원되지 않습니다.');
//         resolve(null);
//       }
//     });
//   }
// }
