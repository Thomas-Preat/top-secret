import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
  updateDoc,
  doc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

/* ---------------- Firebase ---------------- */
const firebaseConfig = {
  apiKey: "AIzaSyCPawC7OPXmvzu2Fj8Uzfj1ZXQI3v-6VL8",
  authDomain: "topsecret-9ae10.firebaseapp.com",
  databaseURL: "https://topsecret-9ae10-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "topsecret-9ae10",
  storageBucket: "topsecret-9ae10.firebasestorage.app",
  messagingSenderId: "946145195302",
  appId: "1:946145195302:web:a25c392b7efde11137fde7",
  measurementId: "G-6E69WMM89W"
};


const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const auth = getAuth();

/* ---------------- Images ---------------- */
const IMAGE_MAP = {
  bed: { src: "/assets/images/bed.jpg", position: "50% 50%" },
  outside: {src: "../../assets/images/outside.jpg",position: "50% 30%"},
  cooking: {src: "../../assets/images/cooking.jpg",position: "50% 70%"}
  };

/* ---------------- Menu ---------------- */
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $all = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

const navToggle = $(".nav-toggle");
const navMenu = $("#primary-nav");

if (navToggle && navMenu) {
  navToggle.addEventListener("click", () => {
    const expanded = navToggle.getAttribute("aria-expanded") === "true";
    navToggle.setAttribute("aria-expanded", !expanded);
    navMenu.classList.toggle("show");
  });

  $all("#primary-nav a").forEach(link => {
    link.addEventListener("click", () => {
      navToggle.setAttribute("aria-expanded", false);
      navMenu.classList.remove("show");
    });
  });
}

/* ---------------- Checklist logic ---------------- */
const checklistContainer = document.getElementById("checklist");
const checklistRef = collection(db, "checklist");

let checklistItems = [];
let searchQuery = "";
let activeTags = new Set();
let sortMode = "default";

/* ---------- Load data ---------- */
const snapshot = await getDocs(checklistRef);
snapshot.forEach(docSnap => {
  checklistItems.push({ id: docSnap.id, ...docSnap.data() });
});

renderChecklist();
buildTagFilters(checklistItems);
setupFilterPanel();

/* ---------- Sorting ---------- */
function sortItems(items) {
  return items.slice().sort((a, b) => {
    switch (sortMode) {
      case "az":
        return a.label.localeCompare(b.label, "fr", { sensitivity: "base" });
      case "za":
        return b.label.localeCompare(a.label, "fr", { sensitivity: "base" });
      case "checked":
        return a.checked === b.checked
          ? a.label.localeCompare(b.label, "fr", { sensitivity: "base" })
          : a.checked ? 1 : -1;
      default:
        // unchecked first, then alphabetical
        if (a.checked !== b.checked) return a.checked ? 1 : -1;
        return a.label.localeCompare(b.label, "fr", { sensitivity: "base" });
    }
  });
}

/* ---------- Filtering ---------- */
function filterItems(items) {
  return items.filter(item => {
    const matchesSearch =
      !searchQuery ||
      item.label.toLowerCase().includes(searchQuery) ||
      (item.description || "").toLowerCase().includes(searchQuery);

    const matchesTags =
      activeTags.size === 0 ||
      (item.tags || []).some(tag => activeTags.has(tag));

    return matchesSearch && matchesTags;
  });
}

/* ---------- Render ---------- */
function renderChecklist() {
  checklistContainer.innerHTML = "";

  const filtered = filterItems(checklistItems);
  const sorted = sortItems(filtered);

  sorted.forEach(data => {
    const wrapper = document.createElement("div");
    wrapper.className = "check-item";
    if (data.checked) wrapper.classList.add("checked");

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = data.checked;

    const textWrap = document.createElement("div");
    textWrap.className = "check-text";

    const label = document.createElement("div");
    label.className = "check-label";
    label.textContent = data.label;

    const desc = document.createElement("div");
    desc.className = "check-description";
    desc.textContent = data.description || "";

    textWrap.appendChild(label);
    textWrap.appendChild(desc);

    wrapper.appendChild(checkbox);
    wrapper.appendChild(textWrap);

    const imgConf = IMAGE_MAP[data.imageTag];
    if (imgConf) {
      wrapper.style.backgroundImage = `url(${imgConf.src})`;
      wrapper.style.backgroundPosition = imgConf.position || "center";
    }

    checkbox.addEventListener("change", async () => {
      data.checked = checkbox.checked;
      await updateDoc(doc(db, "checklist", data.id), { checked: checkbox.checked });
      renderChecklist();
    });

    wrapper.addEventListener("click", e => {
    if (e.target.tagName === "INPUT") return; // ignore checkbox clicks

    const isOpen = wrapper.classList.contains("open");

    // close all items
    document.querySelectorAll(".check-item.open").forEach(i => i.classList.remove("open"));

    // toggle this one if it was closed
    if (!isOpen) {
        wrapper.classList.add("open");
    }
});


    checklistContainer.appendChild(wrapper);
  });
}

/* ---------- Search input ---------- */
const searchInput = document.getElementById("check-search");
if (searchInput) {
  searchInput.addEventListener("input", e => {
    searchQuery = e.target.value.trim().toLowerCase();
    renderChecklist();
  });
}

/* ---------- Tag filters ---------- */
function buildTagFilters(items) {
  const tagContainer = document.getElementById("tag-filters");
  if (!tagContainer) return;

  const tags = new Set();
  items.forEach(item => (item.tags || []).forEach(tag => tags.add(tag)));

  tagContainer.innerHTML = "";

  tags.forEach(tag => {
    const btn = document.createElement("button");
    btn.textContent = tag;
    btn.className = "tag-btn";

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

/* ---------- Filter panel ---------- */
function setupFilterPanel() {
  const filterToggle = document.getElementById("filter-toggle");
  const filterPanel = document.getElementById("filter-panel");

  if (!filterToggle || !filterPanel) return;

  // toggle panel
  filterToggle.addEventListener("click", e => {
    e.stopPropagation();
    filterPanel.hidden = !filterPanel.hidden;
  });

  // close panel when clicking outside
  document.addEventListener("click", () => {
    filterPanel.hidden = true;
  });

  filterPanel.addEventListener("click", e => e.stopPropagation());

  // sorting buttons
  filterPanel.querySelectorAll("[data-sort]").forEach(btn => {
    btn.addEventListener("click", () => {
      sortMode = btn.dataset.sort;
      filterPanel.querySelectorAll("[data-sort]").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      renderChecklist();
    });
  });
}

/* ---------------- Admin Toggle ---------------- */

const adminToggleBtn = document.getElementById("admin-menu-toggle");
const adminLoginForm = document.getElementById("admin-login");

adminToggleBtn.addEventListener("click", e => {
    e.stopPropagation();
    adminLoginForm.classList.toggle("active");
});

// Close when clicking outside
document.addEventListener("click", () => {
    adminLoginForm.classList.remove("active");
});

// Prevent clicks inside form from closing
adminLoginForm.addEventListener("click", e => e.stopPropagation());

/* ---------------- Login logic ---------------- */

const loginBtn = document.getElementById("loginBtn");
const usernameInput = document.getElementById("admin-username");
const passwordInput = document.getElementById("admin-password");
const loginMsg = document.getElementById("admin-login-msg");


loginBtn.addEventListener("click", async () => {
    const email = usernameInput.value;
    const password = passwordInput.value;

    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        // Success: enable admin mode
        document.body.classList.add("admin-mode");
        loginMsg.textContent = "Admin mode enabled!";
        adminLoginForm.style.display = "none";
    } catch (error) {
        loginMsg.textContent = "Login failed: " + error.message;
    }
});