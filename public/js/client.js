document.addEventListener('DOMContentLoaded', function () {
  // FCM 연동을 위한 서비스 계정 정보
  const firebaseConfig = {
    apiKey: 'AIzaSyBWKGEzLjBA-e4PKfp5F9-SyTGgJ1-rGBw',
    authDomain: 'codered-9bb03.firebaseapp.com',
    projectId: 'codered-9bb03',
    storageBucket: 'codered-9bb03.appspot.com',
    messagingSenderId: '377609042128',
    appId: '1:377609042128:web:985550c7edd8ee16c686d5',
    measurementId: 'G-RS03446VPC',
  };

  // Firebase 초기화
  firebase.initializeApp(firebaseConfig);

  const messaging = firebase.messaging();

  // 푸시 알림 토큰 발행
  function requestPermission() {
    Notification.requestPermission().then((permission) => {
      if (permission === 'granted') {
        messaging
          .getToken({
            vapidKey:
              'BPYh1J2rMBGtHK6vXHrmh8xxmt56noVci18l3NTzyTzFggYfmGXvFV9jEM6SUdnpPuRl1e9NAPRs6ahMMMRYG6A',
          })
          .then((currentToken) => {
            if (currentToken) {
              sendTokenToServer(currentToken);
            }
          })
          .catch((error) => {
            console.error('토큰받아오기 에러:', error);
          });
      }
    });
  }

  // clientId & pushToken 서버 전송
  async function sendTokenToServer(token) {
    const clientId = localStorage.getItem('clientId') || null;
    try {
      const response = await fetch('/users/register-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ push_token: token, client_id: clientId }),
      });

      if (response.ok) {
        const responseData = await response.json();
        if (
          responseData.clientsInfo.client_id ||
          !localStorage.getItem('clientId')
        ) {
          localStorage.setItem('clientId', responseData.clientsInfo.client_id);
        }
      }
    } catch (error) {
      console.log('Error sending token to server:', error);
    }
  }

  // 위치 정보 허용 (실시간)
  async function getLocationPermission() {
    const options = {
      enableHighAccuracy: true,
      timeout: 27000,
      maximumAge: 5000,
    };
    if (navigator.geolocation) {
      navigator.geolocation.watchPosition(saveUserLocation, showError, options);
    } else {
      console.error('Geolocation is not supported by this browser.');
    }
  }

  // 위치 정보 저장
  async function saveUserLocation(position) {
    let latitude = position.coords.latitude;
    let longitude = position.coords.longitude;

    console.log(latitude, '||', longitude);
    const clientId = localStorage.getItem('clientId') || null;

    try {
      const response = await fetch('/users/register-location', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          latitude: latitude,
          longitude: longitude,
          client_id: clientId,
        }),
      });

      if (response.ok) {
        const data = await response.json();

        if (data.clientsInfo.client_id || !localStorage.getItem('clientId')) {
          localStorage.setItem('clientId', data.clientsInfo.client_id);
        }
      } else {
        throw new Error('Network response was not ok.');
      }
    } catch (error) {
      console.log('Error sending token to server:', error);
    }
  }

  // 위치 정보 에러 처리
  function showError(error) {
    switch (error.code) {
      case error.PERMISSION_DENIED:
        console.error('사용자가 위치 정보 요청을 거부했습니다.');
        break;
      case error.POSITION_UNAVAILABLE:
        console.error('위치 정보를 사용할 수 없습니다.');
        break;
      case error.TIMEOUT:
        console.error('사용자 위치를 가져오는 요청이 시간 초과되었습니다.');
        break;
      case error.UNKNOWN_ERROR:
        console.error('알 수 없는 오류가 발생했습니다.');
        break;
    }
  }

  requestPermission();
  getLocationPermission();

  // 서비스 워커등록
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker
      .register('js/firebase-messaging-sw.js')
      .then(function (registration) {
        messaging.useServiceWorker(registration);
      })
      .catch(function (err) {
        console.log('Service worker registration failed:', err);
      });
  }
});
