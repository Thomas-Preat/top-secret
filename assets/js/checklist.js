// assets/js/checklist.js
import { db } from "./firebase.js";
import {
  collection,
  getDocs,
  updateDoc,
  addDoc,
  deleteDoc,
  doc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* ---------- Guard ---------- */
const checklistContainer = document.getElementById("checklist");

/* ---------- Images ---------- */
const IMAGE_MAP = {
  bed: { src: "/assets/images/bed.jpg", position: "50% 50%" },
  outside: { src: "../../assets/images/outside.jpg", position: "50% 30%" },
  cooking: { src: "../../assets/images/cooking.jpg", position: "50% 70%" }
};

/* ---------- Data ---------- */
const checklistRef = collection(db, "checklist");
let checklistItems = [];

/* ---------- Load ---------- */
async function loadChecklist() {
  checklistItems = [];
  const snap = await getDocs(checklistRef);
  snap.forEach(d => checklistItems.push({ id: d.id, ...d.data() }));
  renderChecklist();
}

await loadChecklist();

/* ---------- Render ---------- */
function renderChecklist() {
  checklistContainer.innerHTML = "";

  checklistItems.forEach(item => {
    const wrapper = document.createElement("div");
    wrapper.className = "check-item";
    if (item.checked) wrapper.classList.add("checked");

    /* background image */
    const img = IMAGE_MAP[item.imageTag];
    if (img) {
      wrapper.style.backgroundImage = `url(${img.src})`;
      wrapper.style.backgroundPosition = img.position || "center";
    }

    /* checkbox */
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = item.checked;

    /* text */
    const textWrap = document.createElement("div");
    textWrap.className = "check-text";

    const label = document.createElement("div");
    label.className = "check-label";
    label.textContent = item.label;

    const desc = document.createElement("div");
    desc.className = "check-description";
    desc.textContent = item.description || "";

    textWrap.appendChild(label);
    textWrap.appendChild(desc);

    wrapper.appendChild(checkbox);
    wrapper.appendChild(textWrap);

    /* checkbox logic */
    checkbox.addEventListener("change", async e => {
      e.stopPropagation();
      await updateDoc(doc(db, "checklist", item.id), {
        checked: checkbox.checked
      });
      await loadChecklist();
    });

    /* open / close */
    wrapper.addEventListener("click", e => {
      if (e.target.tagName === "INPUT") return;

      const isOpen = wrapper.classList.contains("open");
      document.querySelectorAll(".check-item.open").forEach(el =>
        el.classList.remove("open")
      );

      if (!isOpen) wrapper.classList.add("open");
    });

    checklistContainer.appendChild(wrapper);
  });
}

/* ---------- Admin editor ---------- */
if (document.body.classList.contains("admin-mode")) {
  enableAdminEditor();
}

function enableAdminEditor() {
  const editor = document.getElementById("admin-editor");
  if (!editor) return;

  editor.style.display = "flex";

  const titleInput = document.getElementById("admin-title");
  const descInput = document.getElementById("admin-desc");
  const imageSelect = document.getElementById("admin-image");
  const tagsInput = document.getElementById("admin-tags");
  const createBtn = document.getElementById("admin-create");
  const updateBtn = document.getElementById("admin-update");
  const deleteBtn = document.getElementById("admin-delete");

  let selectedId = null;

  checklistContainer.addEventListener("click", e => {
    const item = e.target.closest(".check-item");
    if (!item) return;

    const idx = [...checklistContainer.children].indexOf(item);
    selectedId = checklistItems[idx].id;

    const data = checklistItems[idx];
    titleInput.value = data.label;
    descInput.value = data.description || "";
    imageSelect.value = data.imageTag || "";
    tagsInput.value = (data.tags || []).join(",");
  });

  createBtn.addEventListener("click", async () => {
    await addDoc(checklistRef, {
      label: titleInput.value,
      description: descInput.value,
      imageTag: imageSelect.value,
      tags: tagsInput.value.split(",").map(t => t.trim()),
      checked: false
    });
    await loadChecklist();
  });

  updateBtn.addEventListener("click", async () => {
    if (!selectedId) return;
    await updateDoc(doc(db, "checklist", selectedId), {
      label: titleInput.value,
      description: descInput.value,
      imageTag: imageSelect.value,
      tags: tagsInput.value.split(",").map(t => t.trim())
    });
    await loadChecklist();
  });

  deleteBtn.addEventListener("click", async () => {
    if (!selectedId) return;
    await deleteDoc(doc(db, "checklist", selectedId));
    selectedId = null;
    await loadChecklist();
  });
}
