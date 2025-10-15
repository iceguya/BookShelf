const STORAGE_KEY = "BOOKSHELF_APPS_books";
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const el = (tag, opts = {}) => {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(opts)) {
    if (k in node) node[k] = v;
  }
  return node;
};


let books = [];
let editingId = null;
let searchKeyword = "";


function loadBooks() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    books = Array.isArray(parsed) ? parsed : [];
  } catch {
    books = [];
  }
}

function saveBooks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(books));
}


function generateId() {
  return Date.now(); 
}

function sanitizeBookInput({ title, author, year, isComplete }) {
  const t = String(title ?? "").trim();
  const a = String(author ?? "").trim();
  const y = Number.parseInt(String(year ?? "").trim(), 10);
  const c = Boolean(isComplete);
  if (!t || !a || Number.isNaN(y)) {
    throw new Error("Input tidak valid");
  }
  return { title: t, author: a, year: y, isComplete: c };
}

function addBook(payload) {
  const clean = sanitizeBookInput(payload);
  const book = { id: generateId(), ...clean };
  books.push(book);
  saveBooks();
  render();
}

function updateBook(id, payload) {
  const idx = books.findIndex(b => b.id === id);
  if (idx === -1) return;
  const clean = sanitizeBookInput(payload);
  books[idx] = { ...books[idx], ...clean };
  saveBooks();
  render();
}

function toggleBookComplete(id) {
  const book = books.find(b => b.id === id);
  if (!book) return;
  book.isComplete = !book.isComplete;
  saveBooks();
  render();
}

function deleteBook(id) {
  books = books.filter(b => b.id !== id);
  saveBooks();
  render();
}

function render() {
  const incompleteWrap = $("#incompleteBookList");
  const completeWrap = $("#completeBookList");

  incompleteWrap.innerHTML = "";
  completeWrap.innerHTML = "";

  const list = searchKeyword
    ? books.filter(b => b.title.toLowerCase().includes(searchKeyword.toLowerCase()))
    : books;

  const incomplete = list.filter(b => !b.isComplete);
  const complete = list.filter(b => b.isComplete);

  incomplete.forEach(b => incompleteWrap.appendChild(createBookItem(b)));
  complete.forEach(b => completeWrap.appendChild(createBookItem(b)));
}

function createBookItem(book) {
  const item = el("div");
  item.setAttribute("data-testid", "bookItem");
  item.setAttribute("data-bookid", String(book.id)); 

  const title = el("h3", { textContent: book.title });
  title.setAttribute("data-testid", "bookItemTitle");

  const author = el("p", { textContent: `Penulis: ${book.author}` });
  author.setAttribute("data-testid", "bookItemAuthor");

  const year = el("p", { textContent: `Tahun: ${book.year}` });
  year.setAttribute("data-testid", "bookItemYear");

  const actions = el("div");

  const toggleBtn = el("button", {
    textContent: book.isComplete ? "Belum selesai dibaca" : "Selesai dibaca",
  });
  toggleBtn.setAttribute("data-testid", "bookItemIsCompleteButton");
  toggleBtn.addEventListener("click", () => toggleBookComplete(book.id));

  const delBtn = el("button", { textContent: "Hapus Buku" });
  delBtn.setAttribute("data-testid", "bookItemDeleteButton");
  delBtn.addEventListener("click", () => {
    const ok = confirm(`Hapus buku "${book.title}"?`);
    if (ok) deleteBook(book.id);
  });

  const editBtn = el("button", { textContent: "Edit Buku" });
  editBtn.setAttribute("data-testid", "bookItemEditButton");
  editBtn.addEventListener("click", () => startEdit(book));

  actions.append(toggleBtn, delBtn, editBtn);
  item.append(title, author, year, actions);
  return item;
}


function resetForm() {
  $("#bookForm").reset();
  editingId = null;
  const submitBtn = $("#bookFormSubmit");
  submitBtn.innerHTML = 'Masukkan Buku ke rak <span>Belum selesai dibaca</span>';
}

function startEdit(book) {
  editingId = book.id;
  $("#bookFormTitle").value = book.title;
  $("#bookFormAuthor").value = book.author;
  $("#bookFormYear").value = book.year;
  $("#bookFormIsComplete").checked = book.isComplete;
  $("#bookFormSubmit").textContent = "Simpan Perubahan";
}

function handleFormSubmit(evt) {
  evt.preventDefault();
  const payload = {
    title: $("#bookFormTitle").value,
    author: $("#bookFormAuthor").value,
    year: $("#bookFormYear").value,
    isComplete: $("#bookFormIsComplete").checked,
  };

  try {
    if (editingId) {
      updateBook(editingId, payload);
    } else {
      addBook(payload);
    }
    resetForm();
  } catch {
    alert("Mohon isi judul, penulis, dan tahun dengan benar.");
  }
}

function handleCompleteCheckboxLabel() {
  const isChecked = $("#bookFormIsComplete").checked;
  if (editingId) return; 
  $("#bookFormSubmit").innerHTML =
    `Masukkan Buku ke rak <span>${isChecked ? "Selesai dibaca" : "Belum selesai dibaca"}</span>`;
}


function handleSearchSubmit(evt) {
  evt.preventDefault();
  searchKeyword = ($("#searchBookTitle").value || "").trim();
  render();
}

function handleSearchInput() {
  const keyword = ($("#searchBookTitle").value || "").trim();
  if (keyword === "") {
    searchKeyword = "";
    render();
  }
}


document.addEventListener("DOMContentLoaded", () => {
  loadBooks();

  $("#bookForm").addEventListener("submit", handleFormSubmit);
  $("#bookFormIsComplete").addEventListener("change", handleCompleteCheckboxLabel);

  $("#searchBook").addEventListener("submit", handleSearchSubmit);
  $("#searchBookTitle").addEventListener("input", handleSearchInput);

  render();
});
