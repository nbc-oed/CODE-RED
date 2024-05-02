document.addEventListener('DOMContentLoaded', () => {
  const postBtn = document.querySelector('.nav-post-btn');
  postBtn.addEventListener('click', () => {
    if (!isLogin) {
      alert('로그인이 필요한 기능입니다.');
      window.location.href = '/auth/sign-in';
    } else {
      window.location.href = '/posts';
    }
  });
});

// TODO user myinfo (remove redirection in server)
// TODO unauthorized cookie
