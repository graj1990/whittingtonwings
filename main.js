import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Firebase configuration
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

// Load Next Wing Night
async function loadWingNightData() {
  const docRef = doc(db, "siteData", "wingNight");

  try {
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      document.getElementById("date").textContent = data.date || "TBD";
      document.getElementById("location").textContent = data.location || "TBD";
    } else {
      throw new Error("No such document");
    }
  } catch (err) {
    console.error("Error loading data:", err.message);
    document.getElementById("date").textContent = "Error";
    document.getElementById("location").textContent = "Error";
  }
}

// Load Leaderboard
async function loadLeaderboardData() {
  const docRef = doc(db, "siteData", "leaderboard");

  try {
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      const winners = data.Winners || [];

      // Sort by wins descending
      winners.sort((a, b) => b.wins - a.wins);

      const list = document.getElementById("leaderboard-list");
      list.innerHTML = "";

      const medals = ["🥇", "🥈", "🥉"];

      winners.forEach((person, index) => {
        const li = document.createElement("li");
        const medal = medals[index] || "";
        li.textContent = `${medal} ${person.name} - ${person.wins} wins`;
        list.appendChild(li);
      });
    } else {
      throw new Error("No leaderboard document found");
    }
  } catch (err) {
    console.error("Error loading leaderboard:", err.message);
    const list = document.getElementById("leaderboard-list");
    list.innerHTML = "<li>Error loading leaderboard</li>";
  }
}

// Expand/Collapse Wing Commandments
document.addEventListener("DOMContentLoaded", () => {
  const preview = document.getElementById("commandments-preview");
  const full = document.getElementById("commandments-full");
  const expandBtn = document.getElementById("toggle-commandments");
  const collapseBtn = document.getElementById("toggle-less");

  expandBtn?.addEventListener("click", () => {
    preview.style.display = "none";
    full.style.display = "block";
  });

  collapseBtn?.addEventListener("click", () => {
    full.style.display = "none";
    preview.style.display = "block";
  });

  loadWingNightData();
  loadLeaderboardData();
});
