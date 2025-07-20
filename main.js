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
  // Load Wing Night Details
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
        const medal = ["🥇", "🥈", "🥉"][index] || "";
        div.innerHTML = `${medal} ${winner.name} - ${winner.wins} wins`;
        container.appendChild(div);
      });
    }
  });

  // Wing Commandments Toggle
  const commandmentsText = `🍗 The Wing Commandments 🍗

  Once a month, the Wing contenders gather. Each contender brings their own wings — marinated, seasoned, or sauced in secrecy.

  The host provides the grill, the drinks, and the arena. One by one, each contender takes their turn at the grill, cooking their wings to crispy, saucy perfection.

  Wings are served in rounds — hot off the grill — and sampled by all.

  When the final bite is eaten, the voting begins. Everyone gets one vote (and no, you can’t vote for yourself).

  The contender with the most votes claims the win. No cash. No trophy. Just pride, trash talk rights, and a place on the leaderboard.

  Victory isn’t given — it’s earned.`;

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
  // Chat functionality
  const chatBox = document.getElementById("chatMessages");
  const sendBtn = document.getElementById("sendMessage");
  const messageInput = document.getElementById("messageInput");
  const loadMoreBtn = document.getElementById("loadMoreMessagesBtn");
  let lastVisible = null;
  let loadedMessages = [];

  function formatTimestamp(timestamp) {
    const date = timestamp.toDate();
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  }

  function renderMessage(doc, chatBox) {
    const data = doc.data();
    const div = document.createElement("div");
    div.className = data.parentId ? "chat-message chat-reply" : "chat-message";
    div.dataset.id = doc.id;
  
    const time = data.timestamp?.toDate().toLocaleString() || "just now";
  
    div.innerHTML = `
      <div><strong>${data.senderName || "Anon"}</strong> <span style="font-size: 0.8em; color: #888">(${time})</span></div>
      <div>${data.text}</div>
      <div class="reactions">
        <button class="reaction-btn" data-emoji="👍">👍 ${data.reactions?.["👍"] || 0}</button>
        <button class="reaction-btn" data-emoji="🔥">🔥 ${data.reactions?.["🔥"] || 0}</button>
        <button class="reaction-btn" data-emoji="😂">😂 ${data.reactions?.["😂"] || 0}</button>
        <button class="reply-btn">Reply</button>
      </div>
    `;
  
    // Append or nest
    if (data.parentId) {
      const parent = chatBox.querySelector(`[data-id="${data.parentId}"]`);
      if (parent) parent.appendChild(div);
      else chatBox.appendChild(div); // fallback
    } else {
      chatBox.appendChild(div);
    }
  
    // Reaction click
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
  
    // Reply click
    div.querySelector(".reply-btn").addEventListener("click", () => {
      const reply = prompt("Reply to this message:");
      if (reply && window.currentUser) {
        db.collection("siteData").doc("messages").collection("messages").add({
          text: reply,
          senderName: window.currentUser.displayName,
          senderId: window.currentUser.uid,
          parentId: doc.id,
          timestamp: firebase.firestore.FieldValue.serverTimestamp(),
          reactions: {}
        });
      }
    });
  }
  
  function listenToMessages() {
    const chatBox = document.getElementById("chatMessages");
    chatBox.innerHTML = "";
  
    db.collection("siteData").doc("messages").collection("messages")
      .orderBy("timestamp", "asc")
      .onSnapshot(snapshot => {
        chatBox.innerHTML = "";
        snapshot.forEach(doc => {
          renderMessage(doc, chatBox);
        });
        chatBox.scrollTop = chatBox.scrollHeight;
      });
  }
  
  listenToMessages();

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

  sendBtn.addEventListener("click", () => {
    const text = messageInput.value.trim();
    if (!text) return;
    if (!window.currentUser) {
      alert("You must be signed in to send messages.");
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

// Wing Commandments Section Toggle
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
