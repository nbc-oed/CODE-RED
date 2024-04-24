const dmSocket = io('/dm');
const currentRoom = window.location.pathname.split('/')[2];
dmSocket.emit('joinRoom', currentRoom);

const msgDiv = document.querySelector('.messages');
let curPage = 1;
let myId;
let nickname;

document.addEventListener('DOMContentLoaded', async () => {
  myId = await getMyId();

  if (!currentRoom.split('_').includes(`${myId}`)) {
    alert('잘못된 접근입니다.');
    window.location.href = '/dm';
  }

  dmSocket.on('message', (data) => {
    msgDiv.innerHTML += buildMsgHtml(data);
    scrollToBottom();
  });

  loadTargetInfo();
  addEvents();
  await loadHistory();
  nickname = document.querySelector('.nickname').innerText;

  if (msgDiv.scrollHeight === msgDiv.clientHeight) {
    await loadHistory(curPage);
    curPage++;
    scrollToBottom();
  }

  if (nickname === '탈퇴한 사용자') {
    document
      .getElementById('user-message')
      .setAttribute('placeholder', '메세지를 전송할 수 없습니다.');
    return;
  }
});

async function getMyId() {
  const response = await fetch('/users/api/myId', {
    method: 'GET',
    credentials: 'include',
  });
  const data = await response.json();
  return +data;
}

function loadTargetInfo() {
  fetch(`/dm/userinfo/${currentRoom}`, {
    method: 'GET',
    credentials: 'include',
  })
    .then((res) => res.json())
    .then((data) => {
      const infoDiv = document.querySelector('.targetInfo');
      infoDiv.innerHTML = `
            <img src="${data.profile_image}">
            <p class="nickname">${data.nickname}</p>
          `;
    });
}

function addEvents() {
  addMoreEvent();
  addMsgEvent();
}

function addMoreEvent() {
  msgDiv.addEventListener('scroll', async () => {
    if (msgDiv.scrollTop === 0) {
      const height = msgDiv.scrollHeight;
      await loadHistory(curPage);
      curPage++;
      msgDiv.scrollTop = msgDiv.scrollHeight - height;
    }
  });
}

function addMsgEvent() {
  document.querySelector('#message-form').addEventListener('submit', (e) => {
    e.preventDefault();
    if (nickname === '탈퇴한 사용자') {
      return;
    }

    const message = document.querySelector('#user-message').value;
    if (message === '') {
      return;
    }
    document.querySelector('#user-message').value = '';

    dmSocket.emit('message', {
      userId: myId,
      message,
      nickname,
      roomName: currentRoom,
      createdAt: new Date(),
    });
  });
}

/* helpers */
async function loadHistory(page) {
  const response = await fetch(`/dm/history/${currentRoom}?page=${page || 0}`, {
    method: 'GET',
    credentials: 'include',
  });
  const data = await response.json();

  const msgDiv = document.querySelector('.messages');
  data.forEach((msg) => {
    if (page) {
      const moreDiv = document.createElement('div');
      moreDiv.innerHTML = buildMsgHtml(msg);
      msgDiv.insertBefore(moreDiv, msgDiv.firstChild);
    } else {
      const msgHtml = buildMsgHtml(msg);
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = msgHtml;

      while (tempDiv.firstChild) {
        msgDiv.appendChild(tempDiv.firstChild);
      }
    }
  });

  if (!page) {
    scrollToBottom();
  }
}

function scrollToBottom() {
  const messagesDiv = document.querySelector('.messages');
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function buildMsgHtml(msg) {
  const date = getFormattedTime(new Date(msg.created_at));
  return `
    <div class="message-${msg.user_id !== myId ? 'left' : 'right'}" sendUser =${msg.user_id}>
      <p class="msg-body">${msg.message}</p>
      <p class="msg-date">${date}</p>
    </div>
    `;
}

function getFormattedTime(date) {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hours = date.getHours();
  const minutes = date.getMinutes();

  const formattedMonth = month < 10 ? `0${month}` : month;
  const formattedDay = day < 10 ? `0${day}` : day;
  const formattedHours = hours < 10 ? `0${hours}` : hours;
  const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;

  return `${formattedMonth}/${formattedDay} ${formattedHours}:${formattedMinutes}`;
}
