import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
  updateDoc,
  doc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";


// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
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

const IMAGE_MAP = {
    bed: {
        src: "/assets/images/bed.jpg",
        position: "50% 50%",
        opacity: "0.2"
    },
    fruits: {
        src: "/assets/images/fruits.jpg",
        position: "center top"
    },
    fireplace: {
        src: "/assets/images/fireplace.jpg",
        position: "center bottom"
    }
};



//-----------------------------------------------------

//function to select elements
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $all = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

//menu toggle
const navToggle = $('.nav-toggle');
const navMenu = $('#primary-nav');

if (navToggle && navMenu) {
    console.log('ici');
    navToggle.addEventListener('click', () => {
        console.log('click');
        const expanded = navToggle.getAttribute('aria-expanded') === 'true';
        navToggle.setAttribute('aria-expanded', !expanded);
        navMenu.classList.toggle('show');
    });

    // close menu when clicking a link
    $all('#primary-nav a').forEach(link => {
        link.addEventListener('click', () => {
            console.log('click link');
            navToggle.setAttribute('aria-expanded', false);
            navMenu.classList.remove('show');
        });
    });
}

//-----------------------------------------------------

//checklist

const checklistContainer = document.getElementById("checklist");

const checklistRef = collection(db, "checklist");
const snapshot = await getDocs(checklistRef);

snapshot.forEach(docSnap => {
    const data = docSnap.data();

    const wrapper = document.createElement("div");

    const checkbox = document.createElement("input");

    checkbox.type = "checkbox";
    checkbox.checked = data.checked;

    const label = document.createElement("span");
    label.textContent = data.label;

    checkbox.addEventListener("change", async () => {
        await updateDoc(doc(db, "checklist", docSnap.id), {
            checked: checkbox.checked
        });
    });

    wrapper.appendChild(checkbox);
    wrapper.appendChild(label);

    wrapper.classList.add("check-item");

    wrapper.addEventListener("click", e => {
        if (e.target.tagName !== "INPUT") {
            checkbox.checked = !checkbox.checked;
            checkbox.dispatchEvent(new Event("change"));
        }
    });

    checklistContainer.appendChild(wrapper);

    const imgConf = IMAGE_MAP[data.imageTag];

    if (imgConf) {
        wrapper.style.backgroundImage = `url(${imgConf.src})`;
        wrapper.style.backgroundPosition = imgConf.position;
        wrapper.style.backgroundopacity = imgConf.opacity || "1";
}



    const updateStyle = () => {
        wrapper.classList.toggle("checked", checkbox.checked);
    };

    updateStyle();
    
    checkbox.addEventListener("change", updateStyle);
});

