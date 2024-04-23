// ! 시간 표시 문제

const params = new URLSearchParams(window.location.href);
let curPage = +params.get('page') || 1;
let curSearch = '';

const postsContainer = document.querySelector('.posts');

postsContainer.addEventListener('scroll', function () {
  if (
    postsContainer.clientHeight + postsContainer.scrollTop >=
    postsContainer.scrollHeight - 0.5
  ) {
    fetch(`/posts/api?page=${curPage + 1}&search=${curSearch}`, {
      credentials: 'include',
    })
      .then((res) => res.json())
      .then((posts) => {
        if (!posts[0]) return;
        addPost(posts);
        curPage++;
      })
      .catch((error) => {
        console.error('posts load error: ', error);
      });
  }
});

document.addEventListener('DOMContentLoaded', function () {
  const searchInput = document.querySelector('.search input');
  const searchButton = document.querySelector('.search button');

  searchButton.addEventListener('click', () => {
    searchEventHandler(searchInput);
  });

  searchInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
      searchEventHandler(searchInput);
    }
  });
});

document.querySelector('.writeBtn').addEventListener('click', () => {
  window.location.href = '/posts/newpost?type=create';
});

function searchEventHandler(inputDiv) {
  const searchTerm = inputDiv.value.trim();
  search(searchTerm);
  curSearch = searchTerm;
  curPage = 1;
  inputDiv.innerText = '';
}

async function search(searchTerm) {
  try {
    const response = await fetch(`/posts/api?search=${searchTerm}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const responseData = await response.json();
      postsContainer.innerHTML = '';
      addPost(responseData);
    }
  } catch (error) {
    console.error(error);
  }
}

function addPost(posts) {
  posts.forEach((post) => {
    const postElement = document.createElement('div');
    postElement.classList.add('post');
    postElement.id = post.id;

    postElement.innerHTML = `
        <img src='${post.post_image}' />
        <h3><a href='/posts/${post.id}'>${post.title}</a></h3>
        <p>${post.status}</p>
        <p>${post.updated_at}</p>
      `;

    postsContainer.appendChild(postElement);
  });
}
