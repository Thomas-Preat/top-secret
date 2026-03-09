import {
  collection,
  getDocs,
  updateDoc,
  addDoc,
  deleteDoc,
  doc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import { db } from "./firebase.js";

const $ = (selector, ctx = document) => ctx.querySelector(selector);
const $$ = (selector, ctx = document) => Array.from(ctx.querySelectorAll(selector));

const IMAGE_MAP = {
  default: { src: "../../assets/images/default.jpg", position: "50% 50%" },
  bed: { src: "../../assets/images/bed.jpg", position: "50% 50%" },
  relax: { src: "../../assets/images/relax.jpg", position: "80% 55%" },
  trobbio: { src: "../../assets/images/trobbio.jpg", position: "50% 50%" },
  outside: { src: "../../assets/images/outside.jpg", position: "50% 30%" },
  cooking: { src: "../../assets/images/cooking.jpg", position: "50% 70%" }
};

let checklistItems = [];
let searchQuery = "";
let activeTags = new Set();
let sortMode = "default";

const checklistContainer = $("#checklist");
const searchInput = $("#check-search");
const filterToggle = $("#filter-toggle");
const filterPanel = $("#filter-panel");
const tagContainer = $("#tag-filters");

const adminSelect = $("#admin-select");
const adminTitle = $("#admin-title");
const adminDesc = $("#admin-desc");
const adminImage = $("#admin-image");
const adminTags = $("#admin-tags");
const createBtn = $("#admin-create");
const updateBtn = $("#admin-update");
const deleteBtn = $("#admin-delete");

function normalizeTags(value) {
  return value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

async function loadChecklist() {
  const loadedItems = [];
  const snapshot = await getDocs(collection(db, "checklist"));
  snapshot.forEach((docSnap) => {
    loadedItems.push({
      id: docSnap.id,
      label: docSnap.data().label || "Sans titre",
      description: docSnap.data().description || "",
      imageTag: docSnap.data().imageTag || "default",
      tags: Array.isArray(docSnap.data().tags) ? docSnap.data().tags : [],
      checked: Boolean(docSnap.data().checked)
    });
  });

  checklistItems = loadedItems;
  buildTagFilters();
  populateAdminSelect();
  renderChecklist();
}

function filterItems(items) {
  return items.filter((item) => {
    const q = searchQuery.toLowerCase();

    const matchesSearch =
      !q ||
      item.label.toLowerCase().includes(q) ||
      (item.description || "").toLowerCase().includes(q);

    const matchesTags =
      activeTags.size === 0 ||
      Array.from(activeTags).every((tag) => (item.tags || []).includes(tag));

    return matchesSearch && matchesTags;
  });
}

function sortItems(items) {
  const list = items.slice();

  list.sort((a, b) => a.label.localeCompare(b.label, "fr", { sensitivity: "base" }));

  if (sortMode === "za") {
    list.reverse();
    return list;
  }

  if (sortMode === "default") {
    const notDone = list.filter(i => !i.checked);
    const done = list.filter(i => i.checked);
    return [...notDone, ...done];
  }

  return list;
}

function renderChecklist() {
  if (!checklistContainer) return;
  checklistContainer.innerHTML = "";

  const filtered = filterItems(checklistItems);
  const sorted = sortItems(filtered);

  sorted.forEach((item) => {
    const wrapper = document.createElement("div");
    wrapper.className = "check-item";
    if (item.checked) wrapper.classList.add("checked");

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = item.checked;
    checkbox.disabled = !document.body.classList.contains("admin-mode");

    const textWrap = document.createElement("div");
    textWrap.className = "check-text";

    const label = document.createElement("div");
    label.className = "check-label";
    label.textContent = item.label;

    const desc = document.createElement("div");
    desc.className = "check-description";
    desc.textContent = item.description || "";

    textWrap.append(label, desc);
    wrapper.append(checkbox, textWrap);

    const img = IMAGE_MAP[item.imageTag];
    if (img) {
      wrapper.style.backgroundImage = `url(${img.src})`;
      wrapper.style.backgroundPosition = img.position || "center";
    }

    checkbox.addEventListener("change", async (event) => {
      item.checked = checkbox.checked;
      event.stopPropagation();
      await updateDoc(doc(db, "checklist", item.id), { checked: item.checked });
      renderChecklist();
    });

    wrapper.addEventListener("click", (event) => {
      if (event.target instanceof HTMLInputElement) return;
      const isOpen = wrapper.classList.contains("open");
      $$(".check-item.open").forEach((openItem) => openItem.classList.remove("open"));
      if (!isOpen) wrapper.classList.add("open");
    });

    checklistContainer.appendChild(wrapper);
  });
}

if (searchInput) {
  searchInput.addEventListener("input", (event) => {
    searchQuery = event.target.value.trim();
    renderChecklist();
  });
}

function buildTagFilters() {
  if (!tagContainer) return;
  tagContainer.innerHTML = "";
  activeTags.clear();

  const tags = new Set();
  checklistItems.forEach((item) => (item.tags || []).forEach((tag) => tags.add(tag)));

  tags.forEach((tag) => {
    const btn = document.createElement("button");
    btn.className = "tag-btn";
    btn.type = "button";
    btn.textContent = tag;

    btn.addEventListener("click", () => {
      if (activeTags.has(tag)) {
        activeTags.delete(tag);
        btn.classList.remove("active");
      } else {
        activeTags.add(tag);
        btn.classList.add("active");
      }
      renderChecklist();
    });

    tagContainer.appendChild(btn);
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
    renderChecklist();
  });
});

function populateAdminSelect() {
  if (!adminSelect) return;
  adminSelect.innerHTML = `<option value="">-- Choix coupon --</option>`;
  checklistItems.forEach((item) => {
    const option = document.createElement("option");
    option.value = item.id;
    option.textContent = item.label;
    adminSelect.appendChild(option);
  });
}

if (adminSelect) {
  adminSelect.addEventListener("change", () => {
    const item = checklistItems.find((entry) => entry.id === adminSelect.value);
    if (!item) return;
    adminTitle.value = item.label;
    adminDesc.value = item.description || "";
    adminImage.value = item.imageTag || "";
    adminTags.value = (item.tags || []).join(",");
  });
}

if (createBtn) {
  createBtn.addEventListener("click", async () => {
    const label = adminTitle.value.trim();
    if (!label) return;

    const newItem = {
      label,
      description: adminDesc.value.trim(),
      imageTag: adminImage.value,
      tags: normalizeTags(adminTags.value),
      checked: false
    };

    await addDoc(collection(db, "checklist"), newItem);
    await loadChecklist();
  });
}

if (updateBtn) {
  updateBtn.addEventListener("click", async () => {
    const selectedId = adminSelect.value;
    if (!selectedId) return;

    await updateDoc(doc(db, "checklist", selectedId), {
      label: adminTitle.value.trim(),
      description: adminDesc.value.trim(),
      imageTag: adminImage.value,
      tags: normalizeTags(adminTags.value)
    });

    await loadChecklist();
  });
}

if (deleteBtn) {
  deleteBtn.addEventListener("click", async () => {
    const selectedId = adminSelect.value;
    if (!selectedId) return;
    await deleteDoc(doc(db, "checklist", selectedId));
    adminSelect.value = "";
    adminTitle.value = "";
    adminDesc.value = "";
    adminImage.value = "default";
    adminTags.value = "";
    await loadChecklist();
  });
}

document.addEventListener("admin:enabled", renderChecklist);

await loadChecklist();
