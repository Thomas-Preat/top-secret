// assets/js/main.js
import { auth } from "./firebase.js";
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

/* ---------- Helpers ---------- */
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $all = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

/* ---------- Navigation ---------- */
const navToggle = $(".nav-toggle");
const navMenu = $("#primary-nav");

if (navToggle && navMenu) {
  navToggle.addEventListener("click", () => {
    navMenu.classList.toggle("show");
  });

  $all("#primary-nav a").forEach(link => {
    link.addEventListener("click", () => {
      navMenu.classList.remove("show");
    });
  });
}

/* ---------- Admin menu toggle ---------- */
const adminToggleBtn = $("#admin-menu-toggle");
const adminLoginForm = $("#admin-login");

if (adminToggleBtn && adminLoginForm) {
  adminToggleBtn.addEventListener("click", e => {
    e.stopPropagation();
    adminLoginForm.classList.toggle("active");
  });

  document.addEventListener("click", () => {
    adminLoginForm.classList.remove("active");
  });

  adminLoginForm.addEventListener("click", e => e.stopPropagation());
}

/* ---------- Login ---------- */
const loginBtn = $("#loginBtn");
const usernameInput = $("#admin-username");
const passwordInput = $("#admin-password");
const loginMsg = $("#admin-login-msg");

if (loginBtn) {
  loginBtn.addEventListener("click", async () => {
    try {
      await signInWithEmailAndPassword(
        auth,
        usernameInput.value,
        passwordInput.value
      );

      document.body.classList.add("admin-mode");
      loginMsg.textContent = "Admin mode enabled";
      adminLoginForm.classList.remove("active");

      // Show admin editor
      showAdminEditor();

      // optionally call your enableAdminEditor() here if you have one
      if (typeof enableAdminEditor === "function") enableAdminEditor();

    } catch (err) {
      loginMsg.textContent = "Login failed: " + err.message;
    }
  });
}


/* ---------- Admin editor setup ---------- */
function showAdminEditor() {
  const editor = document.getElementById("admin-editor");
  if (!editor) return;
  editor.style.display = "flex"; // show the editor
}
