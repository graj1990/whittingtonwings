document.addEventListener("DOMContentLoaded", function () {
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
  firebase.initializeApp(firebaseConfig);
  const db = firebase.firestore();

import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";

const auth = getAuth();
const provider = new GoogleAuthProvider();

const signInBtn = document.getElementById("signInBtn");
const signOutBtn = document.getElementById("signOutBtn");
const userDisplay = document.getElementById("userDisplay");

// Sign In
signInBtn.addEventListener("click", () => {
  signInWithPopup(auth, provider)
    .then((result) => {
      // Signed in
    })
    .catch((error) => {
      console.error("Sign in error", error);
    });
});

// Sign Out
signOutBtn.addEventListener("click", () => {
  signOut(auth);
});

// Monitor Auth State
onAuthStateChanged(auth, (user) => {
  if (user) {
    signInBtn.style.display = "none";
    signOutBtn.style.display = "inline-block";
    userDisplay.textContent = `Signed in as: ${user.displayName}`;
    window.currentUser = user;
  } else {
    signInBtn.style.display = "inline-block";
    signOutBtn.style.display = "none";
    userDisplay.textContent = "";
    window.currentUser = null;
  }
});
  
  // Load Next Wing Night
  db.collection("siteData").doc("wingNight").get().then((doc) => {
    if (doc.exists) {
      const data = doc.data();
      document.getElementById("wingDate").textContent = data.date || "TBD";
      document.getElementById("wingLocation").textContent = data.location || "TBD";
    }
  });

// Load Leaderboard
db.collection("siteData").doc("leaderboard").get().then((doc) => {
  if (doc.exists) {
    const winners = doc.data().Winners || [];
    winners.sort((a, b) => b.wins - a.wins);
    const container = document.getElementById("leaderboardContent");
    container.innerHTML = "";
    winners.forEach((winner, index) => {
      const div = document.createElement("div");
      let medal = '';
      if (index === 0) medal = '🥇';
      else if (index === 1) medal = '🥈';
      else if (index === 2) medal = '🥉';

      div.innerHTML = `${medal} ${winner.name} - ${winner.wins} wins`;
      container.appendChild(div);
    });
  }
});

  // Wing Commandments Read More Toggle
  const commandmentsText = `
    🍗 The Wing Commandments 🍗

    Once a month, the Wing contenders gather. Each contender brings their own wings — marinated, seasoned, or sauced in secrecy.

    The host provides the grill, the drinks, and the arena. One by one, each contender takes their turn at the grill, cooking their wings to crispy, saucy perfection.

    Wings are served in rounds — hot off the grill — and sampled by all.

    When the final bite is eaten, the voting begins. Everyone gets one vote (and no, you can’t vote for yourself).

    The contender with the most votes claims the win. No cash. No trophy. Just pride, trash talk rights, and a place on the leaderboard.

    Victory isn’t given — it’s earned.
  `.trim();

  const shortText = "Once a month, the Wing contenders gather...";
  const commandmentsPara = document.getElementById("commandmentsText");
  const readMoreBtn = document.getElementById("readMoreBtn");

  if (commandmentsPara && readMoreBtn) {
    commandmentsPara.textContent = shortText;

    readMoreBtn.addEventListener("click", () => {
      if (readMoreBtn.textContent === "Read More") {
        commandmentsPara.textContent = commandmentsText;
        readMoreBtn.textContent = "Show Less";
      } else {
        commandmentsPara.textContent = shortText;
        readMoreBtn.textContent = "Read More";
      }
    });
  }

  // Chat: Load messages
  const chatBox = document.getElementById("chatMessages");

  function loadMessages() {
    db.collection("siteData").doc("messages").collection("messages")
      .orderBy("timestamp", "asc")
      .onSnapshot((snapshot) => {
        chatBox.innerHTML = "";
        snapshot.forEach((doc) => {
          const data = doc.data();
          const div = document.createElement("div");
          div.innerHTML = `<strong>${data.name}</strong>: ${data.message}`;
          chatBox.appendChild(div);
        });
        chatBox.scrollTop = chatBox.scrollHeight;
      });
  }

  loadMessages();

  // Chat: Send message
  const sendBtn = document.getElementById("sendMessage");
  const nameInput = document.getElementById("nameInput");
  const messageInput = document.getElementById("messageInput");

  if (sendBtn && nameInput && messageInput) {
    sendBtn.addEventListener("click", () => {
      const name = nameInput.value.trim();
      const message = messageInput.value.trim();

      if (!name || !message) return;

      db.collection("siteData").doc("messages").collection("messages").add({
        name,
        message,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
      }).then(() => {
        messageInput.value = "";
      });
    });
  }
});

document.getElementById("toggleCommandments").addEventListener("click", function () {
  const collapsed = document.getElementById("collapsedWingText");
  const full = document.getElementById("fullWingText");
  const button = this;

  if (full.style.display === "none") {
    collapsed.style.display = "none";
    full.style.display = "block";
    button.textContent = "Show Less";
  } else {
    collapsed.style.display = "block";
    full.style.display = "none";
    button.textContent = "Read More";
  }
});
