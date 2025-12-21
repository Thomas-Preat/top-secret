import {
  collection,
  getDocs,
  updateDoc,
  addDoc,
  deleteDoc,
  doc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import { db } from "./firebase.js";

/* ---------------- Helpers ---------------- */
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $all = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

/* ---------------- Elements ---------------- */
const checklistContainer = $("#checklist");
const searchInput = $("#check-search");
const filterToggle = $("#filter-toggle");
const filterPanel = $("#filter-panel");
const tagContainer = $("#tag-filters");

/* Admin editor inputs/buttons */
const adminSelect = $("#admin-select");
const adminTitle = $("#admin-title");
const adminDesc = $("#admin-desc");
const adminImage = $("#admin-image");
const adminTags = $("#admin-tags");
const createBtn = $("#admin-create");
const updateBtn = $("#admin-update");
const deleteBtn = $("#admin-delete");

/* ---------------- Images ---------------- */
const IMAGE_MAP = {
  default: { src: "/assets/images/default.jpg", position: "50% 50%" },
  bed: { src: "/assets/images/bed.jpg", position: "50% 50%" },
  relax: { src: "/assets/images/relax.jpg", position: "80% 55%" },
  trobbio: { src: "/assets/images/trobbio.jpg", position: "50% 50%" },
  outside: { src: "../../assets/images/outside.jpg", position: "50% 30%" },
  cooking: { src: "../../assets/images/cooking.jpg", position: "50% 70%" }
};

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
  populateAdminSelect();
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
      [...activeTags].every(tag => (item.tags || []).includes(tag));

    return matchesSearch && matchesTags;
  });
}


/* ---------------- Sorting ---------------- */


function sortItems(items) {
  const list = items.slice();

  // Step 1: alphabetical base sort
  list.sort((a, b) =>
    a.label.localeCompare(b.label, "fr", { sensitivity: "base" })
  );

  // Step 2: apply selected mode
  if (sortMode === "za") {
    list.reverse();
    return list;
  }

  if (sortMode === "default") {
    const notDone = list.filter(i => !i.checked);
    const done = list.filter(i => i.checked);
    return [...notDone, ...done];
  }

  // az
  return list;
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
      await updateDoc(doc(db, "checklist", item.id), { checked: checkbox.checked });
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
  document.addEventListener("click", () => filterPanel.hidden = true);
}

$all("[data-sort]").forEach(btn => {
  btn.addEventListener("click", () => {
    sortMode = btn.dataset.sort;
    $all("[data-sort]").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    renderChecklist();
  });
});

/* ---------------- Admin editor ---------------- */
function populateAdminSelect() {
  if (!adminSelect) return;
  adminSelect.innerHTML = `<option value="">-- Select item --</option>`;
  checklistItems.forEach(item => {
    const option = document.createElement("option");
    option.value = item.id;
    option.textContent = item.label;
    adminSelect.appendChild(option);
  });
}

if (adminSelect) {
  adminSelect.addEventListener("change", () => {
    const item = checklistItems.find(i => i.id === adminSelect.value);
    if (!item) return;
    adminTitle.value = item.label;
    adminDesc.value = item.description || "";
    adminImage.value = item.imageTag || "";
    adminTags.value = (item.tags || []).join(",");
  });
}

/* ---------------- Admin CRUD ---------------- */
if (createBtn) {
  createBtn.addEventListener("click", async () => {
    const newItem = {
      label: adminTitle.value,
      description: adminDesc.value,
      imageTag: adminImage.value,
      tags: adminTags.value.split(",").map(t => t.trim())
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
      label: adminTitle.value,
      description: adminDesc.value,
      imageTag: adminImage.value,
      tags: adminTags.value.split(",").map(t => t.trim())
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
    adminImage.value = "";
    adminTags.value = "";
    await loadChecklist();
  });
}
