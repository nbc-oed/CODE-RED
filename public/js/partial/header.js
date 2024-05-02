const rawCookies = document.cookie.split('; ');
const cookies = {};
rawCookies.forEach((cookie) => {
  const [key, value] = cookie.split('=');
  cookies[key] = value;
});

const isLogin = cookies.Authentication;

document.addEventListener('DOMContentLoaded', () => {
  const sosBtn = document.getElementById('sos');
  sosBtn.addEventListener('click', () => {
    if (!isLogin) {
      alert('로그인이 필요한 기능입니다.');
      window.location.href = '/auth/sign-in';
    } else {
      window.location.href = '/mayday/findHelper';
    }
  });
});
