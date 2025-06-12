const form = document.getElementById('bookForm');
const titleInput = document.getElementById('title');
const authorInput = document.getElementById('author');
const bookList = document.getElementById('bookList');

let books = JSON.parse(localStorage.getItem('books2025')) || [];

async function searchBookISBN(title, author) {
  try {
    const query = `${title} ${author}`.replace(/\s+/g, '+');
    const response = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${query}&maxResults=1`);
    const data = await response.json();
    
    if (data.items && data.items[0]) {
      const book = data.items[0].volumeInfo;
      // Try to get ISBN-13 first, fall back to ISBN-10 if not available
      const isbn = book.industryIdentifiers?.find(id => id.type === 'ISBN_13')?.identifier ||
                  book.industryIdentifiers?.find(id => id.type === 'ISBN_10')?.identifier;
      return isbn || null;
    }
    return null;
  } catch (error) {
    console.error('Error fetching ISBN:', error);
    return null;
  }
}

function saveBooks() {
  localStorage.setItem('books2025', JSON.stringify(books));
}

function renderBooks() {
  bookList.innerHTML = '';
  
  // Create header row
  const header = document.createElement('li');
  header.className = 'list-group-item bg-secondary text-light';
  header.innerHTML = `
    <div class="row">
      <div class="col-5"><strong>Title</strong></div>
      <div class="col-3"><strong>Author</strong></div>
      <div class="col-3"><strong>ISBN</strong></div>
      <div class="col-1"></div>
    </div>
  `;
  bookList.appendChild(header);

  // Create book rows
  books.forEach((book, index) => {
    const li = document.createElement('li');
    li.className = 'list-group-item d-flex align-items-center';
    li.innerHTML = `
      <div class="row w-100">
        <div class="col-5">${book.title}</div>
        <div class="col-3">${book.author}</div>
        <div class="col-3">${book.isbn || '-'}</div>
        <div class="col-1">
          <button class="btn btn-danger btn-sm" onclick="deleteBook(${index})">Delete</button>
        </div>
      </div>
    `;
    bookList.appendChild(li);
  });
}

function deleteBook(index) {
  books.splice(index, 1);
  saveBooks();
  renderBooks();
}

function exportBooks() {
  const dataStr = JSON.stringify(books, null, 2);
  const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
  
  const exportFileDefaultName = 'books2025.json';
  
  const linkElement = document.createElement('a');
  linkElement.setAttribute('href', dataUri);
  linkElement.setAttribute('download', exportFileDefaultName);
  linkElement.click();
}

function importBooks(event) {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function(e) {
      try {
        const importedBooks = JSON.parse(e.target.result);
        if (Array.isArray(importedBooks)) {
          books = importedBooks;
          saveBooks();
          renderBooks();
          alert('Books imported successfully!');
        } else {
          alert('Invalid file format. Please import a valid JSON file.');
        }
      } catch (error) {
        alert('Error reading file. Please make sure it\'s a valid JSON file.');
      }
    };
    reader.readAsText(file);
  }
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const title = titleInput.value.trim();
  const author = authorInput.value.trim();
  
  if (title && author) {
    // Show loading state
    const submitButton = form.querySelector('button[type="submit"]');
    const originalButtonText = submitButton.innerHTML;
    submitButton.innerHTML = 'Searching...';
    submitButton.disabled = true;
    
    try {
      const isbn = await searchBookISBN(title, author);
      books.push({ title, author, isbn });
      saveBooks();
      renderBooks();
      form.reset();
    } catch (error) {
      console.error('Error adding book:', error);
      alert('Error adding book. Please try again.');
    } finally {
      // Reset button state
      submitButton.innerHTML = originalButtonText;
      submitButton.disabled = false;
    }
  }
});

renderBooks();