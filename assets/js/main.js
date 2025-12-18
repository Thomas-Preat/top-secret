import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
  updateDoc,
  doc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* Firebase config */
const firebaseConfig = {
  apiKey: "AIzaSyCPawC7OPXmvzu2Fj8Uzfj1ZXQI3v-6VL8",
  authDomain: "topsecret-9ae10.firebaseapp.com",
  projectId: "topsecret-9ae10",
  storageBucket: "topsecret-9ae10.firebasestorage.app",
  messagingSenderId: "946145195302",
  appId: "1:946145195302:web:a25c392b7efde11137fde7"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/* Image mapping (GitHub Pages safe paths) */
const IMAGE_MAP = {
  bed: {
    src: "../../assets/images/bed.jpg",
    position: "50% 50%"
  },
  fruits: {
    src: "../../assets/images/fruits.jpg",
    position: "center top"
  },
  fireplace: {
    src: "../../assets/images/fireplace.jpg",
    position: "center bottom"
  }
};

/* -------------------------------------------------- */
/* helpers */

const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $all = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

/* -------------------------------------------------- */
/* nav menu */

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

/* -------------------------------------------------- */
/* checklist */

const checklistContainer = document.getElementById("checklist");

const checklistRef = collection(db, "checklist");
const snapshot = await getDocs(checklistRef);

snapshot.forEach(docSnap => {
  const data = docSnap.data();

  const wrapper = document.createElement("div");
  wrapper.classList.add("check-item");

  /* checkbox */
  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.checked = data.checked;

  /* text container */
  const textWrap = document.createElement("div");
  textWrap.classList.add("check-text");

  const label = document.createElement("div");
  label.classList.add("check-label");
  label.textContent = data.label;

  const desc = document.createElement("div");
  desc.classList.add("check-description");
  desc.textContent = data.description || "";

  textWrap.appendChild(label);
  textWrap.appendChild(desc);

  wrapper.appendChild(checkbox);
  wrapper.appendChild(textWrap);
  checklistContainer.appendChild(wrapper);

  /* checked style */
  const updateStyle = () => {
    wrapper.classList.toggle("checked", checkbox.checked);
  };
  updateStyle();

  /* persist checkbox to Firestore */
  checkbox.addEventListener("change", async () => {
    await updateDoc(doc(db, "checklist", docSnap.id), {
      checked: checkbox.checked
    });
    updateStyle();
  });

  /* background image */
  const imgConf = IMAGE_MAP[data.imageTag];
  if (imgConf) {
    wrapper.style.backgroundImage = `url(${imgConf.src})`;
    wrapper.style.backgroundPosition = imgConf.position;
  }

  /* accordion behavior */
  wrapper.addEventListener("click", e => {
    if (e.target.tagName === "INPUT") return;

    const isOpen = wrapper.classList.contains("open");

    document.querySelectorAll(".check-item.open").forEach(item => {
      item.classList.remove("open");
    });

    if (!isOpen) {
      wrapper.classList.add("open");
    }
  });
});
