let myId;
fetch('/users/api/myId', { method: 'GET', credentials: 'include' })
  .then((res) => res.json())
  .then((id) => {
    myId = +id;

    dmSocket.emit('joinRoom', `${myId}_list`);
  });

const dmSocket = io('/dm');

document.querySelectorAll('.room').forEach((room) => {
  room.addEventListener('click', async () => {
    const roomName = room.getAttribute('id');
    window.location.href += roomName;
  });
});

dmSocket.on('listEvent', (msg) => {
  const targetDiv = document.getElementById(msg.room_name);
  if (targetDiv) {
    const messageElem = targetDiv.querySelector('.message');
    const sentAtElem = targetDiv.querySelector('.sentAt');

    if (msg.message.length > 25) {
      msg.message = msg.message.slice(0, 22) + '...';
    }
    messageElem.textContent = msg.message;
    sentAtElem.textContent = '0분 전';
  } else {
    window.location.href = '/dm';
  }
});
