document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.msg-container').forEach((msg) => {
    const msgStatus = msg.getAttribute('status');
    if (msgStatus === 'Read') {
      const readFlag = document.createElement('p');
      readFlag.setAttribute('class', 'readFlag');
      readFlag.textContent = '읽음';
      msg.appendChild(readFlag);
    }

    const msgId = msg.getAttribute('id');
    msg.addEventListener('click', () => {
      fetch(`/notifications/${msgId}`, { method: 'POST' }).then((res) => {
        if (!res.ok) console.log(res.statusText);
      });
    });
  });
});
