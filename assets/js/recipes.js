import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import { db } from "./firebase.js";

/* ---------------- State ---------------- */

let recipes = [];
let sortKey = "name";
let sortDir = "asc";
let selectedId = null;

/* ---------------- Elements ---------------- */

const tbody = document.getElementById("recipes-body");

const adminEditor = document.getElementById("admin-editor");
const selectEl = document.getElementById("admin-select");

const nameInput = document.getElementById("admin-name");
const photoInput = document.getElementById("admin-photo");
const typeInput = document.getElementById("admin-type");
const proteinInput = document.getElementById("admin-protein");
const prepTimeInput = document.getElementById("admin-preptime");
const linkInput = document.getElementById("admin-link");
const notesInput = document.getElementById("admin-notes");
const priceInput = document.getElementById("admin-price");

const createBtn = document.getElementById("admin-create");
const updateBtn = document.getElementById("admin-update");
const deleteBtn = document.getElementById("admin-delete");

/* ---------------- Load ---------------- */

async function loadRecipes() {
  recipes = [];

  const snap = await getDocs(collection(db, "recipeList"));
  snap.forEach(d => {
    recipes.push({ id: d.id, ...d.data() });
  });

  buildSelect();
  renderTable();
}

await loadRecipes();

/* ---------------- Render ---------------- */

function renderTable() {
  tbody.innerHTML = "";

  const sorted = sortRecipes(recipes);

  sorted.forEach(r => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${r.name}</td>
      <td>${r.photo ? `<img src="${r.photo}" class="recipe-img">` : ""}</td>
      <td>${r.type || ""}</td>
      <td>${r.protein || ""}</td>
      <td>${r.prepTime ? r.prepTime + " min" : ""}</td>
      <td>${r.link ? `<a href="${r.link}" target="_blank">Voir</a>` : ""}</td>
      <td>${r.notes || ""}</td>
      <td>${r.price != null ? r.price.toFixed(2) + " €" : ""}</td>
    `;

    tbody.appendChild(tr);
  });
}

/* ---------------- Sorting ---------------- */

function sortRecipes(list) {
  return list.slice().sort((a, b) => {
    const A = a[sortKey];
    const B = b[sortKey];

    if (A == null) return 1;
    if (B == null) return -1;

    if (typeof A === "number") {
      return sortDir === "asc" ? A - B : B - A;
    }

    return sortDir === "asc"
      ? String(A).localeCompare(String(B), "fr", { sensitivity: "base" })
      : String(B).localeCompare(String(A), "fr", { sensitivity: "base" });
  });
}

document.querySelectorAll("[data-sort]").forEach(btn => {
  btn.addEventListener("click", () => {
    sortKey = btn.dataset.sort;
    sortDir = btn.dataset.dir || "asc";
    renderTable();
  });
});

/* ---------------- Admin ---------------- */

function buildSelect() {
  selectEl.innerHTML = `<option value="">-- Select recipe --</option>`;

  recipes.forEach(r => {
    const opt = document.createElement("option");
    opt.value = r.id;
    opt.textContent = r.name;
    selectEl.appendChild(opt);
  });
}

selectEl.addEventListener("change", () => {
  selectedId = selectEl.value;
  const r = recipes.find(i => i.id === selectedId);
  if (!r) return;

  nameInput.value = r.name || "";
  photoInput.value = r.photo || "";
  typeInput.value = r.type || "";
  proteinInput.value = r.protein || "";
  prepTimeInput.value = r.prepTime || "";
  linkInput.value = r.link || "";
  notesInput.value = r.notes || "";
  priceInput.value = r.price || "";
});

/* ---------------- CRUD ---------------- */

createBtn.addEventListener("click", async () => {
  await addDoc(collection(db, "recipes"), {
    name: nameInput.value,
    photo: photoInput.value,
    type: typeInput.value,
    protein: proteinInput.value,
    prepTime: Number(prepTimeInput.value),
    link: linkInput.value,
    notes: notesInput.value,
    price: Number(priceInput.value)
  });

  await loadRecipes();
});

updateBtn.addEventListener("click", async () => {
  if (!selectedId) return;

  await updateDoc(doc(db, "recipes", selectedId), {
    name: nameInput.value,
    photo: photoInput.value,
    type: typeInput.value,
    protein: proteinInput.value,
    prepTime: Number(prepTimeInput.value),
    link: linkInput.value,
    notes: notesInput.value,
    price: Number(priceInput.value)
  });

  await loadRecipes();
});

deleteBtn.addEventListener("click", async () => {
  if (!selectedId) return;

  await deleteDoc(doc(db, "recipes", selectedId));
  selectedId = null;

  await loadRecipes();
});

/* ---------------- Admin visibility ---------------- */

if (!document.body.classList.contains("admin-mode")) {
  adminEditor.style.display = "none";
}
