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
      const isbn = book.industryIdentifiers?.find(id => id.type === 'ISBN_13')?.identifier ||
                  book.industryIdentifiers?.find(id => id.type === 'ISBN_10')?.identifier;
      return {
        isbn: isbn || null,
        googleBooksId: data.items[0].id
      };
    }
    return { isbn: null, googleBooksId: null };
  } catch (error) {
    console.error('Error fetching ISBN:', error);
    return { isbn: null, googleBooksId: null };
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
      <div class="row w-100 align-items-center">
        <div class="col-5">${book.title}</div>
        <div class="col-3">${book.author}</div>
        <div class="col-3">
          ${book.isbn 
            ? `<a href="https://books.google.com/books?id=${book.googleBooksId}" target="_blank" class="text-info">${book.isbn}</a>` 
            : '-'}
        </div>
        <div class="col-1 text-end">
          <div class="dropdown d-inline-block">
            <button class="btn btn-link btn-sm text-light p-0" type="button" data-bs-toggle="dropdown" aria-expanded="false">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-three-dots" viewBox="0 0 16 16">
                <path d="M3 9.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z"/>
              </svg>
            </button>
            <ul class="dropdown-menu dropdown-menu-end">
              <li><button class="dropdown-item text-danger" onclick="if(confirm('Are you sure you want to delete this book?')) deleteBook(${index})">Delete</button></li>
            </ul>
          </div>
        </div>
      </div>
    `;
    bookList.appendChild(li);
  });
}

function deleteBook(index) {
  if (confirm('Are you sure you want to delete this book?')) {
    books.splice(index, 1);
    saveBooks();
    renderBooks();
  }
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

async function updateAllBooks() {
  const updateButton = document.querySelector('button[onclick="updateAllBooks()"]');
  const originalButtonText = updateButton.innerHTML;
  updateButton.innerHTML = 'Updating...';
  updateButton.disabled = true;

  try {
    const updatedBooks = [];
    for (const book of books) {
      try {
        const { isbn, googleBooksId } = await searchBookISBN(book.title, book.author);
        updatedBooks.push({
          ...book,
          isbn: isbn || book.isbn,
          googleBooksId: googleBooksId || book.googleBooksId
        });
      } catch (error) {
        console.error(`Error updating book: ${book.title}`, error);
        updatedBooks.push(book); // Keep the original book if update fails
      }
    }

    books = updatedBooks;
    saveBooks();
    renderBooks();
    alert('Books updated successfully!');
  } catch (error) {
    console.error('Error updating books:', error);
    alert('Error updating books. Please try again.');
  } finally {
    updateButton.innerHTML = originalButtonText;
    updateButton.disabled = false;
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
      const { isbn, googleBooksId } = await searchBookISBN(title, author);
      books.push({ title, author, isbn, googleBooksId });
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