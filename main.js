import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getFirestore,
  doc,
  getDoc,
  getDocs,
  collection,
  query,
  orderBy,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCLO-NW-9rATuKwhiXPY4XOhUmO7En-vLo",
  authDomain: "whittingtonwings.firebaseapp.com",
  projectId: "whittingtonwings",
  storageBucket: "whittingtonwings.firebasestorage.app",
  messagingSenderId: "998219658034",
  appId: "1:998219658034:web:58b1d18a5a4c1aaac35d2b",
  measurementId: "G-WQ60E2HDEF"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function loadWingNightData() {
  try {
    const docRef = doc(db, "siteData", "wingNight");
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      document.getElementById("wing-date").textContent = docSnap.data().date || "Unknown";
      document.getElementById("wing-location").textContent = docSnap.data().location || "Unknown";
    } else {
      throw new Error("Document not found");
    }
  } catch (error) {
    console.error("Error loading data:", error);
    document.getElementById("wing-date").textContent = "Error";
    document.getElementById("wing-location").textContent = "Error";
  }
}

async function loadLeaderboard() {
  try {
    const docRef = doc(db, "siteData", "leaderboard");
    const docSnap = await getDoc(docRef);
    const container = document.getElementById("leaderboard");
    container.innerHTML = "";
    if (docSnap.exists()) {
      const winners = docSnap.data().Winners || [];
      winners.sort((a, b) => b.wins - a.wins);
      winners.forEach((winner, index) => {
        const div = document.createElement("div");
        div.className = "winner";
        div.innerHTML = `<strong>#${index + 1}</strong> ${winner.name} - ${winner.wins} wins`;
        container.appendChild(div);
      });
    }
  } catch (error) {
    console.error("Error loading leaderboard:", error);
  }
}

function setupCommandmentsToggle() {
  const toggleBtn = document.getElementById("toggle-charter");
  const fullText = document.getElementById("charter-text");
  toggleBtn.addEventListener("click", () => {
    fullText.classList.toggle("hidden");
    toggleBtn.textContent = fullText.classList.contains("hidden") ? "Show more" : "Show less";
  });
}

async function loadChatMessages() {
  try {
    const messagesRef = collection(db, "siteData", "messages", "messages");
    const q = query(messagesRef, orderBy("timestamp", "asc"));
    const querySnapshot = await getDocs(q);
    const chatBox = document.getElementById("chat-box");
    chatBox.innerHTML = "";
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const message = document.createElement("div");
      message.classList.add("chat-message");
      message.innerHTML = `<strong>${data.name}:</strong> ${data.message}`;
      chatBox.appendChild(message);
    });
    chatBox.scrollTop = chatBox.scrollHeight;
  } catch (error) {
    console.error("Error loading chat:", error);
  }
}

async function sendMessage(event) {
  event.preventDefault();
  const name = document.getElementById("chat-name").value.trim();
  const message = document.getElementById("chat-message").value.trim();
  if (!name || !message) return;

  try {
    const messagesRef = collection(db, "siteData", "messages", "messages");
    await addDoc(messagesRef, {
      name,
      message,
      timestamp: serverTimestamp()
    });
    document.getElementById("chat-message").value = "";
    loadChatMessages();
  } catch (error) {
    console.error("Error sending message:", error);
  }
}

document.getElementById("chat-form").addEventListener("submit", sendMessage);

loadWingNightData();
loadLeaderboard();
setupCommandmentsToggle();
loadChatMessages();
