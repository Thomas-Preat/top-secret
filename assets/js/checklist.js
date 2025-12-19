import {
  collection,
  getDocs,
  updateDoc,
  doc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import { db } from "./firebase.js";

/* ---------------- Images ---------------- */

const IMAGE_MAP = {
  bed: { src: "/assets/images/bed.jpg", position: "50% 50%" },
  outside: { src: "../../assets/images/outside.jpg", position: "50% 30%" },
  cooking: { src: "../../assets/images/cooking.jpg", position: "50% 70%" }
};

/* ---------------- Helpers ---------------- */

const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $all = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

/* ---------------- Elements ---------------- */

const checklistContainer = $("#checklist");
const searchInput = $("#check-search");
const filterToggle = $("#filter-toggle");
const filterPanel = $("#filter-panel");
const tagContainer = $("#tag-filters");

/* ---------------- State ---------------- */

let checklistItems = [];
let searchQuery = "";
let activeTags = new Set();
let sortMode = "default";

/* ---------------- Load data ---------------- */

async function loadChecklist() {
  checklistItems = [];

  const snapshot = await getDocs(collection(db, "checklist"));
  snapshot.forEach(docSnap => {
    checklistItems.push({ id: docSnap.id, ...docSnap.data() });
  });

  buildTagFilters();
  renderChecklist();
}

await loadChecklist();

/* ---------------- Filtering ---------------- */

function filterItems(items) {
  return items.filter(item => {
    const q = searchQuery.toLowerCase();

    const matchesSearch =
      !q ||
      item.label.toLowerCase().includes(q) ||
      (item.description || "").toLowerCase().includes(q);

    const matchesTags =
      activeTags.size === 0 ||
      (item.tags || []).some(tag => activeTags.has(tag));

    return matchesSearch && matchesTags;
  });
}

/* ---------------- Sorting ---------------- */

function sortItems(items) {
  return items.slice().sort((a, b) => {
    if (sortMode === "az") {
      return a.label.localeCompare(b.label, "fr", { sensitivity: "base" });
    }

    if (sortMode === "za") {
      return b.label.localeCompare(a.label, "fr", { sensitivity: "base" });
    }

    if (a.checked !== b.checked) return a.checked ? 1 : -1;
    return a.label.localeCompare(b.label, "fr", { sensitivity: "base" });
  });
}

/* ---------------- Render ---------------- */

function renderChecklist() {
  if (!checklistContainer) return;

  checklistContainer.innerHTML = "";

  const filtered = filterItems(checklistItems);
  const sorted = sortItems(filtered);

  sorted.forEach(item => {
    const wrapper = document.createElement("div");
    wrapper.className = "check-item";
    if (item.checked) wrapper.classList.add("checked");

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = item.checked;

    if (!document.body.classList.contains("admin-mode")) {
      checkbox.disabled = true;
      checkbox.style.display = "none";
    }

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

    checkbox.addEventListener("change", async () => {
      item.checked = checkbox.checked;
      await updateDoc(doc(db, "checklist", item.id), {
        checked: checkbox.checked
      });
      renderChecklist();
    });

    wrapper.addEventListener("click", e => {
      if (e.target.tagName === "INPUT") return;

      const isOpen = wrapper.classList.contains("open");
      $all(".check-item.open").forEach(i => i.classList.remove("open"));
      if (!isOpen) wrapper.classList.add("open");
    });

    checklistContainer.appendChild(wrapper);
  });
}

/* ---------------- Search ---------------- */

if (searchInput) {
  searchInput.addEventListener("input", e => {
    searchQuery = e.target.value.trim();
    renderChecklist();
  });
}

/* ---------------- Tags ---------------- */

function buildTagFilters() {
  if (!tagContainer) return;

  tagContainer.innerHTML = "";
  activeTags.clear();

  const tags = new Set();
  checklistItems.forEach(i => (i.tags || []).forEach(t => tags.add(t)));

  tags.forEach(tag => {
    const btn = document.createElement("button");
    btn.className = "tag-btn";
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

/* ---------------- Sort menu ---------------- */

if (filterToggle && filterPanel) {
  filterToggle.addEventListener("click", e => {
    e.stopPropagation();
    filterPanel.hidden = !filterPanel.hidden;
  });

  filterPanel.addEventListener("click", e => e.stopPropagation());

  document.addEventListener("click", () => {
    filterPanel.hidden = true;
  });
}

$all("[data-sort]").forEach(btn => {
  btn.addEventListener("click", () => {
    sortMode = btn.dataset.sort;

    $all("[data-sort]").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");

    renderChecklist();
  });
});
