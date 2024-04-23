let myId;
fetch('/users/api/myId', { method: 'GET', credentials: 'include' })
  .then((res) => res.json())
  .then((id) => {
    myId = +id;
  });

const connectOptions = {
  auth: { userId: myId },
};
const dmSocket = io('/dm', connectOptions);
const currentRoom = window.location.pathname.split('/')[2];
dmSocket.emit('joinRoom', currentRoom);

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

loadHistory();

document.addEventListener('DOMContentLoaded', () => {
  let curPage = 1;
  document.querySelector('.moreBtn').addEventListener('click', () => {
    console.log('클릭했음');
    loadHistory(++curPage);
  });

  document.querySelector('#message-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const message = document.querySelector('#user-message').value;
    if (message === '') {
      return;
    }
    document.querySelector('#user-message').value = '';

    dmSocket.emit('message', {
      userId: myId,
      message,
      roomName: currentRoom,
      createdAt: new Date(),
    });
  });
});

dmSocket.on('message', (data) => {
  const msgDiv = document.querySelector('.messages');
  msgDiv.innerHTML += buildMsgHtml(data);
  scrollToBottom();
});

const buildMsgHtml = (msg) => {
  const date = getFormattedTime(new Date(msg.created_at));
  return `
    <div class="message-${msg.user_id !== myId ? 'left' : 'right'}" sendUser =${msg.user_id}>
      <p class="msg-body">${msg.message}</p>
      <p class="msg-date">${date}</p>
    </div>
    `;
};

function loadHistory(page) {
  fetch(`/dm/history/${currentRoom}?page=${page || 0}`, {
    method: 'GET',
    credentials: 'include',
  })
    .then((res) => res.json())
    .then((data) => {
      const msgDiv = document.querySelector('.messages');
      data.forEach((msg) => {
        if (page) {
          const moreDiv = document.createElement('div');
          moreDiv.innerHTML += buildMsgHtml(msg);
          msgDiv.insertBefore(moreDiv, msgDiv.firstChild);
        } else {
          msgDiv.innerHTML += buildMsgHtml(msg);
        }
      });
      scrollToBottom();
    });
}

function scrollToBottom() {
  const messagesDiv = document.querySelector('.messages');
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
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
