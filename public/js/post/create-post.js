const form = document.getElementById('post-form');
const type = window.location.href.split('?')[1].split('=')[1];
const typeStr = type === 'create' ? '작성' : '수정';

const btn = document.querySelector('.writeBtn');
btn.textContent = `${typeStr} 완료`;

form.addEventListener('submit', async function (event) {
  event.preventDefault();

  const formData = new FormData(this);
  try {
    const response = await fetch('/posts', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`게시글 ${typeStr}에 실패했습니다.`);
    }

    alert(`게시글이 성공적으로 ${typeStr}되었습니다.`);
    window.location.href = '/posts';
  } catch (error) {
    console.error('Error:', error);
    alert('게시글 생성 중 오류가 발생했습니다.');
  }
});
