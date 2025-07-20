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
        div.textContent = `${index + 1}. ${winner.name} - ${winner.wins} wins`;
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
