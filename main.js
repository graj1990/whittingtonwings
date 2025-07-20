document.addEventListener("DOMContentLoaded", function () {
  const firebaseConfig = {
    apiKey: "AIzaSyCLO-NW-9rATuKwhiXPY4XOhUmO7En-vLo",
    authDomain: "whittingtonwings.firebaseapp.com",
    projectId: "whittingtonwings",
    storageBucket: "whittingtonwings.firebasestorage.app",
    messagingSenderId: "998219658034",
    appId: "1:998219658034:web:58b1d18a5a4c1aaac35d2b",
    measurementId: "G-WQ60E2HDEF"
  };

  firebase.initializeApp(firebaseConfig);
  const db = firebase.firestore();
  const auth = firebase.auth();
  const provider = new firebase.auth.GoogleAuthProvider();

  const signInBtn = document.getElementById("signInBtn");
  const signOutBtn = document.getElementById("signOutBtn");
  const userDisplay = document.getElementById("userDisplay");

  signInBtn.addEventListener("click", () => {
    auth.signInWithPopup(provider).catch((error) => {
      console.error("Sign in error", error);
    });
  });

  signOutBtn.addEventListener("click", () => {
    auth.signOut();
  });

  auth.onAuthStateChanged((user) => {
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

  // Wing Night + Leaderboard
  db.collection("siteData").doc("wingNight").get().then((doc) => {
    if (doc.exists) {
      const data = doc.data();
      document.getElementById("wingDate").textContent = data.date || "TBD";
      document.getElementById("wingLocation").textContent = data.location || "TBD";
    }
  });

  db.collection("siteData").doc("leaderboard").get().then((doc) => {
    if (doc.exists) {
      const winners = doc.data().Winners || [];
      winners.sort((a, b) => b.wins - a.wins);
      const container = document.getElementById("leaderboardContent");
      container.innerHTML = "";
      winners.forEach((winner, index) => {
        const div = document.createElement("div");
        const medal = ["🥇", "🥈", "🥉"][index] || "";
        div.innerHTML = `${medal} ${winner.name} - ${winner.wins} wins`;
        container.appendChild(div);
      });
    }
  });

  // Wing Commandments Toggle
  const commandmentsText = `🍗 The Wing Commandments 🍗 ... Victory isn’t given — it’s earned.`;
  const shortText = "Once a month, the Wing contenders gather...";
  const commandmentsPara = document.getElementById("commandmentsText");
  const readMoreBtn = document.getElementById("readMoreBtn");

  if (commandmentsPara && readMoreBtn) {
    commandmentsPara.textContent = shortText;
    readMoreBtn.addEventListener("click", () => {
      const isMore = readMoreBtn.textContent === "Read More";
      commandmentsPara.textContent = isMore ? commandmentsText : shortText;
      readMoreBtn.textContent = isMore ? "Show Less" : "Read More";
    });
  }

  // Chat Message Logic
  const chatBox = document.getElementById("chatMessages");
  const sendBtn = document.getElementById("sendMessage");
  const messageInput = document.getElementById("messageInput");
  const loadMoreBtn = document.getElementById("loadMoreMessagesBtn");

  let lastVisible = null;
  let loadedMessages = [];

  function renderMessage(doc) {
    const data = doc.data();
    const div = document.createElement("div");
    div.className = "chat-message";
    div.dataset.id = doc.id;
    div.innerHTML = `
      <strong>${data.senderName || "Anon"}</strong>: ${data.text}
      <div class="reactions">
        <button class="reaction-btn" data-emoji="👍">👍 ${data.reactions?.["👍"] || 0}</button>
        <button class="reaction-btn" data-emoji="🔥">🔥 ${data.reactions?.["🔥"] || 0}</button>
        <button class="reaction-btn" data-emoji="😂">😂 ${data.reactions?.["😂"] || 0}</button>
        <button class="reply-btn">Reply</button>
      </div>
    `;

    // Replies
    if (data.parentId) {
      div.classList.add("chat-reply");
    }

    // Append replies under parent
    if (data.parentId) {
      const parent = chatBox.querySelector(`[data-id="${data.parentId}"]`);
      if (parent) parent.appendChild(div);
    } else {
      chatBox.insertBefore(div, chatBox.firstChild);
    }

    // Reaction handling
    div.querySelectorAll(".reaction-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        if (!window.currentUser) return alert("Sign in to react.");
        const emoji = btn.dataset.emoji;
        db.collection("siteData").doc("messages").collection("messages")
          .doc(doc.id).update({
            [`reactions.${emoji}`]: firebase.firestore.FieldValue.increment(1)
          });
      });
    });

    // Reply handling
    div.querySelector(".reply-btn").addEventListener("click", () => {
      const reply = prompt("Reply to this message:");
      if (reply && window.currentUser) {
        db.collection("siteData").doc("messages").collection("messages").add({
          text: reply,
          senderName: window.currentUser.displayName,
          senderId: window.currentUser.uid,
          parentId: doc.id,
          timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
      }
    });
  }

  function loadMessages(initial = false) {
    let query = db.collection("siteData").doc("messages").collection("messages")
      .orderBy("timestamp", "desc")
      .limit(5);

    if (lastVisible && !initial) {
      query = query.startAfter(lastVisible);
    }

    query.get().then((snapshot) => {
      if (snapshot.empty) {
        loadMoreBtn.style.display = "none";
        return;
      }

      lastVisible = snapshot.docs[snapshot.docs.length - 1];

      snapshot.docs.reverse().forEach(doc => {
        if (!loadedMessages.includes(doc.id)) {
          loadedMessages.push(doc.id);
          renderMessage(doc);
        }
      });
    });
  }

  loadMoreBtn.addEventListener("click", () => loadMessages());
  loadMessages(true);

  // Chat Submission
  sendBtn.addEventListener("click", () => {
    const text = messageInput.value.trim();
    if (!text) return;
    if (!window.currentUser) {
      alert("Sign in to send a message.");
      return;
    }

    db.collection("siteData").doc("messages").collection("messages").add({
      text,
      senderName: window.currentUser.displayName,
      senderId: window.currentUser.uid,
      timestamp: firebase.firestore.FieldValue.serverTimestamp(),
      reactions: {}
    }).then(() => {
      messageInput.value = "";
    });
  });
});
