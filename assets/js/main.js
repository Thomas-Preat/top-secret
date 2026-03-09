// assets/js/main.js
import { auth } from "./firebase.js";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const $ = (selector, ctx = document) => ctx.querySelector(selector);
const $$ = (selector, ctx = document) => Array.from(ctx.querySelectorAll(selector));

function initNavigation() {
  const navToggle = $(".nav-toggle");
  const navMenu = $("#primary-nav");
  if (!navToggle || !navMenu) return;

  navToggle.addEventListener("click", () => {
    const isOpen = navMenu.classList.toggle("show");
    navToggle.setAttribute("aria-expanded", String(isOpen));
  });

  $$("#primary-nav a").forEach((link) => {
    link.addEventListener("click", () => {
      navMenu.classList.remove("show");
      navToggle.setAttribute("aria-expanded", "false");
    });
  });
}

function setAdminLoginOpen(isOpen, adminToggleBtn, adminLoginForm) {
  adminToggleBtn.setAttribute("aria-expanded", String(isOpen));
  adminLoginForm.hidden = !isOpen;
  adminLoginForm.classList.toggle("active", isOpen);
}

function showAdminEditor() {
  const editor = $("#admin-editor");
  if (!editor) return;
  editor.hidden = false;
  editor.style.display = "flex";
}

function hideAdminEditor() {
  const editor = $("#admin-editor");
  if (!editor) return;
  editor.hidden = true;
  editor.style.display = "none";
}

function setAdminMode(isEnabled) {
  const isAlreadyEnabled = document.body.classList.contains("admin-mode");

  if (isEnabled) {
    document.body.classList.add("admin-mode");
    showAdminEditor();
    if (!isAlreadyEnabled) {
      document.dispatchEvent(new CustomEvent("admin:enabled"));
    }
    return;
  }

  document.body.classList.remove("admin-mode");
  hideAdminEditor();
}

function updateAdminStatusUI(user, adminToggleBtn, loginMsg) {
  if (adminToggleBtn) {
    adminToggleBtn.textContent = user ? "Admin (connecte)" : "Admin";
  }

  if (!loginMsg) return;
  if (user) {
    const email = user.email || "utilisateur";
    loginMsg.textContent = `Connecte en tant que ${email}.`;
  } else {
    loginMsg.textContent = "Non connecte. Connecte-toi pour activer le mode admin.";
  }
}

function initAdminLogin() {
  const adminToggleBtn = $("#admin-menu-toggle");
  const adminLoginForm = $("#admin-login");
  const loginBtn = $("#loginBtn");
  const logoutBtn = $("#logoutBtn");
  const usernameInput = $("#admin-username");
  const passwordInput = $("#admin-password");
  const loginMsg = $("#admin-login-msg");
  let currentUser = null;

  if (!adminToggleBtn || !adminLoginForm) return;

  adminToggleBtn.addEventListener("click", (event) => {
    event.stopPropagation();
    const isOpen = adminLoginForm.hidden;
    updateAdminStatusUI(currentUser, adminToggleBtn, loginMsg);
    setAdminLoginOpen(isOpen, adminToggleBtn, adminLoginForm);
  });

  adminLoginForm.addEventListener("click", (event) => event.stopPropagation());

  document.addEventListener("click", () => {
    setAdminLoginOpen(false, adminToggleBtn, adminLoginForm);
  });

  // Keep admin UI in sync with Firebase persisted session on refresh/navigation.
  onAuthStateChanged(auth, (user) => {
    currentUser = user;
    setAdminMode(Boolean(user));
    updateAdminStatusUI(user, adminToggleBtn, loginMsg);
  });

  if (!loginBtn || !usernameInput || !passwordInput || !loginMsg) return;

  loginBtn.addEventListener("click", async () => {
    const email = usernameInput.value.trim();
    const password = passwordInput.value;

    if (!email || !password) {
      loginMsg.textContent = "Email and password are required.";
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, email, password);
      loginMsg.textContent = "Admin mode enabled.";
      setAdminLoginOpen(false, adminToggleBtn, adminLoginForm);
    } catch (error) {
      loginMsg.textContent = `Login failed: ${error.message}`;
    }
  });

  logoutBtn?.addEventListener("click", async () => {
    if (!currentUser) {
      loginMsg.textContent = "Aucune session admin active.";
      return;
    }

    try {
      await signOut(auth);
      loginMsg.textContent = "Logout reussi.";
      setAdminLoginOpen(false, adminToggleBtn, adminLoginForm);
      usernameInput.value = "";
      passwordInput.value = "";
    } catch (error) {
      loginMsg.textContent = `Logout failed: ${error.message}`;
    }
  });
}

function init() {
  initNavigation();
  initAdminLogin();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
