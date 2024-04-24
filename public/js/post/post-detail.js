let myId;
fetch('/users/api/myId', { method: 'GET', credentials: 'include' })
  .then((res) => res.json())
  .then((id) => {
    myId = id;
    updateUI();
  });

const postId = window.location.href.slice(
  window.location.href.lastIndexOf('/') + 1,
);
const authorId = document.querySelector('.user').getAttribute('id');
const btnContainer = document.querySelector('.user');

function updateUI() {
  if (+authorId === +myId) {
    const updateBtn = document.createElement('button');
    updateBtn.textContent = '수정';
    updateBtn.classList.add('updateBtn');
    btnContainer.appendChild(updateBtn);

    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = '삭제';
    deleteBtn.classList.add('deleteBtn');
    btnContainer.appendChild(deleteBtn);

    addUpdateEvent(updateBtn);
    addDeleteEvent(deleteBtn);
  } else {
    const dmBtn = document.createElement('button');
    dmBtn.textContent = '교환 요청';
    dmBtn.classList.add('dmBtn');
    btnContainer.appendChild(dmBtn);
    addRequestDmEvent(dmBtn);
  }
}

function addUpdateEvent(updateBtn) {
  updateBtn.addEventListener('click', () => {
    window.location.href = `/posts/newpost?type=update&id=${postId}`;
  });
}

function addDeleteEvent(deleteBtn) {
  deleteBtn.addEventListener('click', () => {
    const isConfirm = confirm('정말 삭제하시겠습니까?');

    if (isConfirm) {
      fetch(`/posts/${postId}`, {
        method: 'DELETE',
        credentials: 'include',
      }).then((res) => {
        if (res.ok) {
          alert('삭제가 완료되었습니다.');
          window.location.href = '/posts';
        } else {
          alert('삭제하지 못했습니다.');
        }
      });
    } else {
      alert('삭제가 취소되었습니다.');
    }
  });
}

function addRequestDmEvent(dmBtn) {
  dmBtn.addEventListener('click', () => {
    const roomName =
      +myId > +authorId ? `${authorId}_${myId}` : `${myId}_${authorId}`;
    window.location.href = `/dm/${roomName}`;
  });
}
