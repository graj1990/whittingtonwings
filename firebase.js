// firebase.js
const firebaseConfig = {
  apiKey: "AIzaSyCLO-NW-9rATuKwhiXPY4XOhUmO7En-vLo",
  authDomain: "whittingtonwings.firebaseapp.com",
  projectId: "whittingtonwings",
  storageBucket: "whittingtonwings.firebasestorage.app",
  messagingSenderId: "998219658034",
  appId: "1:998219658034:web:58b1d18a5a4c1aaac35d2b",
  measurementId: "G-WQ60E2HDEF"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Set globals
window.db = firebase.firestore();
window.auth = firebase.auth();
window.provider = new firebase.auth.GoogleAuthProvider();
