import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { db } from "./firebase.js";

const $ = (selector, ctx = document) => ctx.querySelector(selector);
const $$ = (selector, ctx = document) => Array.from(ctx.querySelectorAll(selector));

let recipes = [];
let searchQuery = "";
let activeTypes = new Set();
let activeProteins = new Set();
let sortMode = "name-asc";

const recipesContainer = $("#recipes");
const searchInput = $("#recipe-search");
const filterToggle = $("#filter-toggle");
const filterPanel = $("#filter-panel");
const typeContainer = $("#type-filters");
const proteinContainer = $("#protein-filters");

const adminSelect = $("#admin-select");
const adminName = $("#admin-name");
const adminPhoto = $("#admin-photo");
const adminType = $("#admin-type");
const adminProtein = $("#admin-protein");
const adminPrep = $("#admin-prep");
const adminLink = $("#admin-link");
const adminNotes = $("#admin-notes");
const adminPrice = $("#admin-price");

function parseCsv(value) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function toPrepMinutes(prepTime) {
  const numeric = Number.parseInt(String(prepTime), 10);
  return Number.isFinite(numeric) ? numeric : Number.POSITIVE_INFINITY;
}

function sanitizeText(value) {
  return String(value ?? "").trim();
}

async function loadRecipes() {
  const loadedRecipes = [];
  const snapshot = await getDocs(collection(db, "recipeList"));

  snapshot.forEach((docSnap) => {
    const data = docSnap.data();
    loadedRecipes.push({
      id: docSnap.id,
      name: sanitizeText(data.name) || "Unnamed Recipe",
      type: Array.isArray(data.type) ? data.type : [],
      protein: Array.isArray(data.protein) ? data.protein : [],
      photo: sanitizeText(data.photo),
      prepTime: sanitizeText(data.prepTime),
      link: sanitizeText(data.link),
      notes: sanitizeText(data.notes),
      price: sanitizeText(data.price)
    });
  });

  recipes = loadedRecipes;

  buildFilters();
  renderRecipes();
  populateAdminSelect();
}

function filterRecipes(items) {
  return items.filter((item) => {
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

function sortRecipes(items) {
  return items.slice().sort((a, b) => {
    if (sortMode === "name-asc") return a.name.localeCompare(b.name, "fr", { sensitivity: "base" });
    if (sortMode === "name-desc") return b.name.localeCompare(a.name, "fr", { sensitivity: "base" });
    if (sortMode === "prep-asc") return toPrepMinutes(a.prepTime) - toPrepMinutes(b.prepTime);
    if (sortMode === "prep-desc") return toPrepMinutes(b.prepTime) - toPrepMinutes(a.prepTime);
    return 0;
  });
}

function renderRecipes() {
  if (!recipesContainer) return;
  recipesContainer.innerHTML = "";

  const filtered = filterRecipes(recipes);
  const sorted = sortRecipes(filtered);

  sorted.forEach((item) => {
    const wrapper = document.createElement("div");
    wrapper.className = "recipe-card";

    const header = document.createElement("div");
    header.className = "recipe-header";

    const img = document.createElement("img");
    img.src = item.photo || "";
    img.alt = item.name;
    img.className = "recipe-photo";
    img.loading = "lazy";

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
    const prep = document.createElement("div");
    prep.innerHTML = `<strong>Prep Time:</strong> ${item.prepTime || "-"}`;

    const price = document.createElement("div");
    price.innerHTML = `<strong>Price:</strong> ${item.price || "-"}`;

    const link = document.createElement("div");
    if (item.link) {
      const anchor = document.createElement("a");
      anchor.href = item.link;
      anchor.target = "_blank";
      anchor.rel = "noopener noreferrer";
      anchor.textContent = "View Recipe";
      link.innerHTML = "<strong>Link:</strong> ";
      link.appendChild(anchor);
    } else {
      link.innerHTML = "<strong>Link:</strong> -";
    }

    const notes = document.createElement("div");
    notes.innerHTML = `<strong>Notes:</strong> ${item.notes || "-"}`;

    details.append(prep, price, link, notes);
    wrapper.appendChild(details);

    header.addEventListener("click", () => wrapper.classList.toggle("open"));

    recipesContainer.appendChild(wrapper);
  });
}

if (searchInput) {
  searchInput.addEventListener("input", (event) => {
    searchQuery = event.target.value.trim();
    renderRecipes();
  });
}

function buildFilters() {
  if (typeContainer) typeContainer.innerHTML = "";
  if (proteinContainer) proteinContainer.innerHTML = "";
  activeTypes.clear();
  activeProteins.clear();

  const types = new Set();
  const proteins = new Set();

  recipes.forEach((recipe) => {
    recipe.type.forEach((type) => types.add(type));
    recipe.protein.forEach((protein) => proteins.add(protein));
  });

  types.forEach((type) => {
    const btn = document.createElement("button");
    btn.className = "tag-btn";
    btn.type = "button";
    btn.textContent = type;
    btn.addEventListener("click", () => {
      if (activeTypes.has(type)) {
        activeTypes.delete(type);
        btn.classList.remove("active");
      } else {
        activeTypes.add(type);
        btn.classList.add("active");
      }
      renderRecipes();
    });
    if (typeContainer) typeContainer.appendChild(btn);
  });

  proteins.forEach((protein) => {
    const btn = document.createElement("button");
    btn.className = "tag-btn";
    btn.type = "button";
    btn.textContent = protein;
    btn.addEventListener("click", () => {
      if (activeProteins.has(protein)) {
        activeProteins.delete(protein);
        btn.classList.remove("active");
      } else {
        activeProteins.add(protein);
        btn.classList.add("active");
      }
      renderRecipes();
    });
    if (proteinContainer) proteinContainer.appendChild(btn);
  });
}

if (filterToggle && filterPanel) {
  filterToggle.addEventListener("click", (event) => {
    event.stopPropagation();
    filterPanel.hidden = !filterPanel.hidden;
    filterToggle.setAttribute("aria-expanded", String(!filterPanel.hidden));
  });
  filterPanel.addEventListener("click", (event) => event.stopPropagation());
  document.addEventListener("click", () => {
    filterPanel.hidden = true;
    filterToggle.setAttribute("aria-expanded", "false");
  });
}

$$("[data-sort]").forEach((btn) => {
  btn.addEventListener("click", () => {
    sortMode = btn.dataset.sort;
    $$("[data-sort]").forEach((button) => button.classList.remove("active"));
    btn.classList.add("active");
    renderRecipes();
  });
});

function populateAdminSelect() {
  if (!adminSelect) return;

  adminSelect.innerHTML = `<option value="">-- Choix recette --</option>`;
  recipes.forEach((recipe) => {
    const option = document.createElement("option");
    option.value = recipe.id;
    option.textContent = recipe.name;
    adminSelect.appendChild(option);
  });
}

if (adminSelect) {
  adminSelect.addEventListener("change", () => {
    const selectedId = adminSelect.value;
    const recipe = recipes.find((entry) => entry.id === selectedId);
    if (!recipe) return;

    adminName.value = recipe.name;
    adminPhoto.value = recipe.photo || "";
    adminType.value = (recipe.type || []).join(",");
    adminProtein.value = (recipe.protein || []).join(",");
    adminPrep.value = recipe.prepTime || "";
    adminLink.value = recipe.link || "";
    adminNotes.value = recipe.notes || "";
    adminPrice.value = recipe.price || "";
  });
}

$("#admin-create")?.addEventListener("click", async () => {
  const newRecipe = {
    name: sanitizeText(adminName.value),
    type: parseCsv(adminType.value),
    protein: parseCsv(adminProtein.value),
    photo: sanitizeText(adminPhoto.value),
    prepTime: sanitizeText(adminPrep.value),
    link: sanitizeText(adminLink.value),
    notes: sanitizeText(adminNotes.value),
    price: sanitizeText(adminPrice.value)
  };

  if (!newRecipe.name || !newRecipe.type.length) {
    alert("Name and Type are required.");
    return;
  }

  await addDoc(collection(db, "recipeList"), newRecipe);
  await loadRecipes();
});

$("#admin-update")?.addEventListener("click", async () => {
  if (!adminSelect) return;
  const selectedId = adminSelect.value;
  if (!selectedId) return;

  await updateDoc(doc(db, "recipeList", selectedId), {
    name: sanitizeText(adminName.value),
    type: parseCsv(adminType.value),
    protein: parseCsv(adminProtein.value),
    photo: sanitizeText(adminPhoto.value),
    prepTime: sanitizeText(adminPrep.value),
    link: sanitizeText(adminLink.value),
    notes: sanitizeText(adminNotes.value),
    price: sanitizeText(adminPrice.value)
  });

  await loadRecipes();
});

$("#admin-delete")?.addEventListener("click", async () => {
  if (!adminSelect) return;
  const selectedId = adminSelect.value;
  if (!selectedId) return;
  await deleteDoc(doc(db, "recipeList", selectedId));
  await loadRecipes();
});

await loadRecipes();
