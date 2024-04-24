const params = new URLSearchParams(window.location.search);
const type = params.get('type');
const postId = params.get('id');
const isCreate = type === 'create';
const typeStr = isCreate ? '작성' : '수정';

const form = document.getElementById('post-form');
const btn = document.querySelector('.writeBtn');
btn.textContent = `${typeStr} 완료`;

if (!isCreate) loadUpdateUi();

form.addEventListener('submit', async function (event) {
  event.preventDefault();

  const formData = new FormData(this);
  if (!isCreate) {
    const selectElem = document.querySelector('.selectElem');
    formData.append('status', selectElem.value);
  }

  const url = isCreate ? '/posts' : `/posts/${postId}`;
  try {
    const response = await fetch(url, {
      method: isCreate ? 'POST' : 'PATCH',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`게시글 ${typeStr}에 실패했습니다.`);
    }

    alert(`게시글이 성공적으로 ${typeStr}되었습니다.`);
    window.location.href = isCreate ? '/posts' : `/posts/${postId}`;
  } catch (error) {
    console.error('Error:', error);
    alert(`게시글 ${typeStr} 중 오류가 발생했습니다.`);
  }
});

async function loadUpdateUi() {
  const response = await fetch(`/posts/api/${postId}`);
  const data = await response.json();

  document.getElementById('title').value = data.title;
  document.getElementById('content').value = data.content;

  const form = document.getElementById('post-form');

  const selectElem = document.createElement('select');
  selectElem.setAttribute('class', 'selectElem');
  selectElem.innerHTML = `
  <option value='AVAILABLE'>AVAILABLE</option>
  <option value='RESERVED'>RESERVED</option>
  <option value='COMPLETED'>COMPLETED</option>
  `;

  const statusLabel = document.createElement('label');
  statusLabel.appendChild(selectElem);
  form.insertBefore(
    statusLabel,
    form.querySelector('.writeBtn').previousSibling,
  );
}
