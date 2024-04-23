let myId;
fetch('/users/api/myId', { method: 'GET', credentials: 'include' })
  .then((res) => res.json())
  .then((id) => {
    myId = id;
  });

document.querySelector('.dmBtn').addEventListener('click', () => {
  const targetId = document.querySelector('.user').getAttribute('id');
  const roomName =
    +myId > +targetId ? `${targetId}_${myId}` : `${myId}_${targetId}`;
  window.location.href = `/dm/${roomName}`;
});
