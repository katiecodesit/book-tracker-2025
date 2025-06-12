const form = document.getElementById('bookForm');
const titleInput = document.getElementById('title');
const authorInput = document.getElementById('author');
const bookList = document.getElementById('bookList');

let books = JSON.parse(localStorage.getItem('books2025')) || [];

async function searchBookISBN(title, author) {
  try {
    // First try searching by ISBN if it's provided
    if (title.match(/^\d{10,13}$/)) {
      const response = await fetch(`https://www.googleapis.com/books/v1/volumes?q=isbn:${title}&maxResults=1`);
      const data = await response.json();
      
      if (data.items && data.items[0]) {
        const book = data.items[0].volumeInfo;
        console.log('Book data found by ISBN:', book);
        return {
          isbn: title,
          googleBooksId: data.items[0].id,
          pages: book.pageCount || 0,
          thumbnail: book.imageLinks?.thumbnail || null,
          description: book.description || null,
          fullTitle: book.title || title,
          publisher: book.publisher || null,
          publishedDate: book.publishedDate || null,
          categories: book.categories || []
        };
      }
    }
    
    // If not found by ISBN or no ISBN provided, search by title and author
    const query = `${title} ${author}`.replace(/\s+/g, '+');
    const response = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${query}&maxResults=1`);
    const data = await response.json();
    
    if (data.items && data.items[0]) {
      const book = data.items[0].volumeInfo;
      console.log('Book data found by title/author:', book);
      const isbn = book.industryIdentifiers?.find(id => id.type === 'ISBN_13')?.identifier ||
                  book.industryIdentifiers?.find(id => id.type === 'ISBN_10')?.identifier;
      return {
        isbn: isbn || null,
        googleBooksId: data.items[0].id,
        pages: book.pageCount || 0,
        thumbnail: book.imageLinks?.thumbnail || null,
        description: book.description || null,
        fullTitle: book.title || title,
        publisher: book.publisher || null,
        publishedDate: book.publishedDate || null,
        categories: book.categories || []
      };
    }
    return { 
      isbn: null, 
      googleBooksId: null, 
      pages: 0,
      thumbnail: null,
      description: null,
      fullTitle: title,
      publisher: null,
      publishedDate: null,
      categories: []
    };
  } catch (error) {
    console.error('Error fetching ISBN:', error);
    return { 
      isbn: null, 
      googleBooksId: null, 
      pages: 0,
      thumbnail: null,
      description: null,
      fullTitle: title,
      publisher: null,
      publishedDate: null,
      categories: []
    };
  }
}

function saveBooks() {
  localStorage.setItem('books2025', JSON.stringify(books));
}

function updateTotals() {
  const totalBooks = books.length;
  const totalPages = books.reduce((sum, book) => sum + (book.pages || 0), 0);
  document.querySelector('h3:nth-of-type(1)').textContent = `Total books read: ${totalBooks}`;
  document.querySelector('h3:nth-of-type(2)').textContent = `Total pages read: ${totalPages}`;
}

function renderBooks() {
  bookList.innerHTML = '';
  
  // Create header row
  const header = document.createElement('li');
  header.className = 'list-group-item bg-secondary text-light';
  header.innerHTML = `
    <div class="row">
      <div class="col-1"></div>
      <div class="col-3"><strong class="fst-italic fw-lighter">TITLE</strong></div>
      <div class="col-3"><strong class="fst-italic fw-lighter">AUTHOR</strong></div>
      <div class="col-2"><strong class="fst-italic fw-lighter">ISBN</strong></div>
      <div class="col-2"><strong class="fst-italic fw-lighter">PAGES</strong></div>
      <div class="col-1"></div>
    </div>
  `;
  bookList.appendChild(header);

  // Create book rows
  books.forEach((book, index) => {
    const li = document.createElement('li');
    li.className = 'list-group-item';
    
    // Main row
    const mainRow = document.createElement('div');
    mainRow.className = 'row align-items-center';
    mainRow.innerHTML = `
      <div class="col-1">
        <button class="btn btn-link btn-sm text-light p-0 expand-btn" data-bs-toggle="collapse" data-bs-target="#book-${index}" aria-expanded="false">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-chevron-right" viewBox="0 0 16 16">
            <path fill-rule="evenodd" d="M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708z"/>
          </svg>
        </button>
      </div>
      <div class="col-3">${book.title}</div>
      <div class="col-3">${book.author}</div>
      <div class="col-2">
        ${book.isbn 
          ? `<a href="https://books.google.com/books?id=${book.googleBooksId}" target="_blank" class="text-info">${book.isbn}</a>` 
          : '-'}
      </div>
      <div class="col-2">${book.pages || '-'}</div>
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
    `;
    li.appendChild(mainRow);

    // Collapsible content
    const collapseDiv = document.createElement('div');
    collapseDiv.className = 'collapse';
    collapseDiv.id = `book-${index}`;
    collapseDiv.innerHTML = `
      <div class="row mt-3 p-4">
        <div class="col-md-3">
          ${book.thumbnail 
            ? `<img src="${book.thumbnail}" alt="${book.fullTitle}" class="img-fluid rounded">` 
            : '<div class="bg-secondary rounded" style="height: 200px; display: flex; align-items: center; justify-content: center;">No Image</div>'}
        </div>
        <div class="col-md-9 ps-4">
          <h5 class="mb-3">${book.fullTitle}</h5>
          ${book.publisher ? `<p class="mb-3"><strong>Publisher:</strong> ${book.publisher}</p>` : ''}
          ${book.publishedDate ? `<p class="mb-3"><strong>Published:</strong> ${book.publishedDate}</p>` : ''}
          ${book.categories?.length ? `<p class="mb-3"><strong>Categories:</strong> ${book.categories.join(', ')}</p>` : ''}
          ${book.description ? `<p class="mb-3"><strong>Description:</strong> ${book.description}</p>` : ''}
        </div>
      </div>
    `;
    li.appendChild(collapseDiv);

    // Add event listener for chevron rotation
    const expandBtn = li.querySelector('.expand-btn');
    
    collapseDiv.addEventListener('show.bs.collapse', function() {
      const chevron = expandBtn.querySelector('svg');
      chevron.style.transform = 'rotate(90deg)';
    });

    collapseDiv.addEventListener('hide.bs.collapse', function() {
      const chevron = expandBtn.querySelector('svg');
      chevron.style.transform = 'rotate(0deg)';
    });

    bookList.appendChild(li);
  });
  
  updateTotals();
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
        const { isbn, googleBooksId, pages, thumbnail, description, fullTitle, publisher, publishedDate, categories } = await searchBookISBN(book.title, book.author);
        updatedBooks.push({
          title: book.title,
          author: book.author,
          isbn: isbn || book.isbn,
          googleBooksId: googleBooksId || book.googleBooksId,
          pages: pages || book.pages || 0,
          thumbnail: thumbnail || book.thumbnail,
          description: description || book.description,
          fullTitle: fullTitle || book.fullTitle || book.title,
          publisher: publisher || book.publisher,
          publishedDate: publishedDate || book.publishedDate,
          categories: categories || book.categories || []
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
      const { isbn, googleBooksId, pages, thumbnail, description, fullTitle, publisher, publishedDate, categories } = await searchBookISBN(title, author);
      books.push({ 
        title, 
        author, 
        isbn, 
        googleBooksId, 
        pages,
        thumbnail,
        description,
        fullTitle,
        publisher,
        publishedDate,
        categories
      });
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

// Initialize the display
renderBooks();