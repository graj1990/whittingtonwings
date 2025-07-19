// Import Firebase functions
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// Your Firebase configuration
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
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Load Wing Night data
async function loadWingNightData() {
  try {
    const docRef = doc(db, "siteData", "wingNight");
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      document.getElementById("wingNightDate").textContent = data.date;
      document.getElementById("wingNightLocation").textContent = data.location;
    } else {
      document.getElementById("wingNightDate").textContent = "Not found";
      document.getElementById("wingNightLocation").textContent = "Not found";
    }
  } catch (error) {
    console.error("Error loading data:", error);
    document.getElementById("wingNightDate").textContent = "Error";
    document.getElementById("wingNightLocation").textContent = "Error";
  }
}

loadWingNightData();
