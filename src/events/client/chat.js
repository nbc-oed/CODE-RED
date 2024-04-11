const connectOptions = {
  auth: { jwt: 'tempJWT' },
};

const chatSocket = io('/chat', connectOptions);

// room
document.querySelectorAll('.user').forEach((elem) => {
  elem.addEventListener('click', async () => {
    document.querySelector('#messages').innerHTML = '';

    const userId = elem.getAttribute('userId');
    const userName = elem.textContent;
    document.querySelector('.curr-room-text').textContent = userName;
    chatSocket.emit('joinRoom', {
      userId,
      userName,
    });
  });
});

// message
document.querySelector('#message-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const newMessage = document.querySelector('#user-message').value;

  chatSocket.emit('message', {
    newMessage,
    date: Date.now(),
  });
  document.querySelector('#user-message').value = '';
});

chatSocket.on('message', (data) => {
  document.querySelector('#messages').innerHTML += buildMessageHtml(data);
});
