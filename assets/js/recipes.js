import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { db } from "./firebase.js";

/* ---------------- Helpers ---------------- */
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $all = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

/* ---------------- Elements ---------------- */
const recipesContainer = $("#recipes");
const searchInput = $("#recipe-search");
const filterToggle = $("#filter-toggle");
const filterPanel = $("#filter-panel");
const typeContainer = $("#type-filters");
const proteinContainer = $("#protein-filters");

/* ---------------- State ---------------- */
let recipes = [];
let searchQuery = "";
let activeTypes = new Set();
let activeProteins = new Set();
let sortMode = "default";

/* ---------------- Load data ---------------- */
async function loadRecipes() {
  recipes = [];
  const snapshot = await getDocs(collection(db, "recipeList"));
  snapshot.forEach(docSnap => {
    recipes.push({ id: docSnap.id, ...docSnap.data() });
  });

  buildFilters();
  renderRecipes();
  populateAdminSelect();
}

await loadRecipes();

/* ---------------- Filtering ---------------- */
function filterRecipes(items) {
  return items.filter(item => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      item.name.toLowerCase().includes(q) ||
      (item.notes || "").toLowerCase().includes(q);

    const matchesType =
      activeTypes.size === 0 || (item.type || []).some(t => activeTypes.has(t));

    const matchesProtein =
      activeProteins.size === 0 || (item.protein || []).some(p => activeProteins.has(p));

    return matchesSearch && matchesType && matchesProtein;
  });
}

/* ---------------- Sorting ---------------- */
function sortRecipes(items) {
  return items.slice().sort((a, b) => {
    if (sortMode === "name-asc") return a.name.localeCompare(b.name);
    if (sortMode === "name-desc") return b.name.localeCompare(a.name);
    if (sortMode === "prep-asc") return a.prepTime.localeCompare(b.prepTime);
    if (sortMode === "prep-desc") return b.prepTime.localeCompare(a.prepTime);
    return 0;
  });
}

/* ---------------- Render ---------------- */
function renderRecipes() {
  if (!recipesContainer) return;
  recipesContainer.innerHTML = "";

  const filtered = filterRecipes(recipes);
  const sorted = sortRecipes(filtered);

  sorted.forEach((item, index) => {
    const wrapper = document.createElement("div");
    wrapper.className = "recipe-card";

    // Optionally expand first card
    if (index === 0) wrapper.classList.add("open");

    // Top row: Name + Photo
    const header = document.createElement("div");
    header.className = "recipe-header";

    const img = document.createElement("img");
    img.src = item.photo || "";
    img.alt = item.name;
    img.className = "recipe-photo";

    const name = document.createElement("div");
    name.className = "recipe-name";
    name.textContent = item.name;

    const tags = document.createElement("div");
    tags.className = "recipe-tags";
    (item.type || []).forEach(t => {
      const span = document.createElement("span");
      span.className = "tag type-tag";
      span.textContent = t;
      tags.appendChild(span);
    });
    (item.protein || []).forEach(p => {
      const span = document.createElement("span");
      span.className = "tag protein-tag";
      span.textContent = p;
      tags.appendChild(span);
    });

    header.append(img, name, tags);
    wrapper.appendChild(header);

    // Hidden details
    const details = document.createElement("div");
    details.className = "recipe-details";
    details.innerHTML = `
      <div><strong>Prep Time:</strong> ${item.prepTime || "-"}</div>
      <div><strong>Price:</strong> ${item.price || "-"}</div>
      <div><strong>Link:</strong> ${
        item.link ? `<a href="${item.link}" target="_blank">View Recipe</a>` : "-"
      }</div>
      <div><strong>Notes:</strong> ${item.notes || "-"}</div>
    `;
    wrapper.appendChild(details);

    // Toggle details
    header.addEventListener("click", () => {
      wrapper.classList.toggle("open");
    });

    recipesContainer.appendChild(wrapper);
  });
}

/* ---------------- Search ---------------- */
if (searchInput) {
  searchInput.addEventListener("input", e => {
    searchQuery = e.target.value.trim();
    renderRecipes();
  });
}

/* ---------------- Filters ---------------- */
function buildFilters() {
  if (typeContainer) typeContainer.innerHTML = "";
  if (proteinContainer) proteinContainer.innerHTML = "";
  activeTypes.clear();
  activeProteins.clear();

  const types = new Set();
  const proteins = new Set();
  recipes.forEach(r => {
    (r.type || []).forEach(t => types.add(t));
    (r.protein || []).forEach(p => proteins.add(p));
  });

  types.forEach(t => {
    const btn = document.createElement("button");
    btn.className = "tag-btn";
    btn.textContent = t;
    btn.addEventListener("click", () => {
      if (activeTypes.has(t)) {
        activeTypes.delete(t);
        btn.classList.remove("active");
      } else {
        activeTypes.add(t);
        btn.classList.add("active");
      }
      renderRecipes();
    });
    typeContainer.appendChild(btn);
  });

  proteins.forEach(p => {
    const btn = document.createElement("button");
    btn.className = "tag-btn";
    btn.textContent = p;
    btn.addEventListener("click", () => {
      if (activeProteins.has(p)) {
        activeProteins.delete(p);
        btn.classList.remove("active");
      } else {
        activeProteins.add(p);
        btn.classList.add("active");
      }
      renderRecipes();
    });
    proteinContainer.appendChild(btn);
  });
}

/* ---------------- Sort Menu ---------------- */
if (filterToggle && filterPanel) {
  filterToggle.addEventListener("click", e => {
    e.stopPropagation();
    filterPanel.hidden = !filterPanel.hidden;
  });
  filterPanel.addEventListener("click", e => e.stopPropagation());
  document.addEventListener("click", () => (filterPanel.hidden = true));
}

$all("[data-sort]").forEach(btn => {
  btn.addEventListener("click", () => {
    sortMode = btn.dataset.sort;
    $all("[data-sort]").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    renderRecipes();
  });
});

/* ---------------- Admin Editor ---------------- */
function populateAdminSelect() {
  const select = $("#admin-select");
  if (!select) return;

  select.innerHTML = `<option value="">-- Select recipe --</option>`;
  recipes.forEach(r => {
    const option = document.createElement("option");
    option.value = r.id;
    option.textContent = r.name;
    select.appendChild(option);
  });
}

const adminSelect = $("#admin-select");
if (adminSelect) {
  adminSelect.addEventListener("change", () => {
    const selectedId = adminSelect.value;
    const recipe = recipes.find(r => r.id === selectedId);
    if (!recipe) return;

    $("#admin-name").value = recipe.name;
    $("#admin-photo").value = recipe.photo || "";
    $("#admin-type").value = (recipe.type || []).join(",");
    $("#admin-protein").value = (recipe.protein || []).join(",");
    $("#admin-prep").value = recipe.prepTime || "";
    $("#admin-link").value = recipe.link || "";
    $("#admin-notes").value = recipe.notes || "";
    $("#admin-price").value = recipe.price || "";
  });
}

/* ---------- Admin CRUD ---------- */
$("#admin-create")?.addEventListener("click", async () => {
  const newRecipe = {
    name: $("#admin-name").value,
    photo: $("#admin-photo").value,
    type: $("#admin-type").value.split(",").map(t => t.trim()),
    protein: $("#admin-protein").value.split(",").map(p => p.trim()),
    prepTime: $("#admin-prep").value,
    link: $("#admin-link").value,
    notes: $("#admin-notes").value,
    price: $("#admin-price").value
  };
  await addDoc(collection(db, "recipeList"), newRecipe);
  await loadRecipes();
});

$("#admin-update")?.addEventListener("click", async () => {
  const selectedId = adminSelect.value;
  if (!selectedId) return;
  const recipe = recipes.find(r => r.id === selectedId);
  if (!recipe) return;

  await updateDoc(doc(db, "recipeList", selectedId), {
    name: $("#admin-name").value,
    photo: $("#admin-photo").value,
    type: $("#admin-type").value.split(",").map(t => t.trim()),
    protein: $("#admin-protein").value.split(",").map(p => p.trim()),
    prepTime: $("#admin-prep").value,
    link: $("#admin-link").value,
    notes: $("#admin-notes").value,
    price: $("#admin-price").value
  });
  await loadRecipes();
});

$("#admin-delete")?.addEventListener("click", async () => {
  const selectedId = adminSelect.value;
  if (!selectedId) return;
  await deleteDoc(doc(db, "recipeList", selectedId));
  await loadRecipes();
});
