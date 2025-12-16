import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

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


const checklistRef = collection(db, "checklist");
const snapshot = await getDocs(checklistRef);

snapshot.forEach(d => {
    console.log(d.id, d.data());
});
