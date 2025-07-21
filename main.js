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
    const messageInput = document.getElementById("messageInput");
    const sendBtn = document.getElementById("sendMessage");
    const authNotice = document.getElementById("authNotice");
  
    if (user) {
      signInBtn.style.display = "none";
      signOutBtn.style.display = "inline-block";
      userDisplay.textContent = `Signed in as: ${user.displayName}`;
      window.currentUser = user;
  
      // Enable chat input
      if (messageInput) messageInput.disabled = false;
      if (sendBtn) sendBtn.disabled = false;
      if (authNotice) authNotice.style.display = "none";
    } else {
      signInBtn.style.display = "inline-block";
      signOutBtn.style.display = "none";
      userDisplay.textContent = "";
      window.currentUser = null;
  
      // Disable chat input
      if (messageInput) messageInput.disabled = true;
      if (sendBtn) sendBtn.disabled = true;
      if (authNotice) authNotice.style.display = "block";
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

  // Chat functionality
  const chatBox = document.getElementById("chatMessages");
  const sendBtn = document.getElementById("sendMessage");
  const messageInput = document.getElementById("messageInput");
  let lastVisible = null;
  let loadedMessages = [];

  function formatTimestamp(timestamp) {
    const date = timestamp.toDate();
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    })}`;
  }

  function renderMessage(doc, messageMap, chatBox, prepend = false) {
    const data = doc.data();
    const div = document.createElement("div");
    div.className = data.parentId ? "chat-message chat-reply" : "chat-message";
    div.dataset.id = doc.id;

    const timestamp = data.timestamp?.toDate();
    const formattedTime = timestamp ? timestamp.toLocaleString() : "Just now";

    div.innerHTML = `
      <strong>${data.senderName || "Anon"}</strong>
      <span style="font-size: 0.85em; color: #888;"> (${formattedTime})</span><br/>
      ${data.text}
      <div class="reactions">
        <button class="reaction-btn" data-id="${doc.id}" data-emoji="👍">👍 ${data.reactions?.["👍"] || 0}</button>
        <button class="reaction-btn" data-id="${doc.id}" data-emoji="🔥">🔥 ${data.reactions?.["🔥"] || 0}</button>
        <button class="reaction-btn" data-id="${doc.id}" data-emoji="😂">😂 ${data.reactions?.["😂"] || 0}</button>
        <button class="reply-btn" data-id="${doc.id}">Reply</button>
      </div>
    `;

    messageMap[doc.id] = div;

    if (data.parentId && messageMap[data.parentId]) {
      messageMap[data.parentId].appendChild(div);
    } else if (!data.parentId) {
      if (prepend) {
        chatBox.insertBefore(div, chatBox.firstChild);
      } else {
        chatBox.appendChild(div);
      }
    }

    // Handle reactions
    div.querySelectorAll(".reaction-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        if (!window.currentUser) return alert("Sign in to react.");
        const messageId = btn.dataset.id;
        const emoji = btn.dataset.emoji;
        const messageRef = db.collection("siteData").doc("messages").collection("messages").doc(messageId);
        const userReactionField = `reactionUsers.${window.currentUser.uid}`;

        messageRef.get().then(snapshot => {
          const currentData = snapshot.data();
          const alreadyReacted = currentData.reactionUsers?.[window.currentUser.uid];

          if (alreadyReacted === emoji) return;

          const batch = db.batch();
          const updates = {};

          if (alreadyReacted && alreadyReacted !== emoji) {
            updates[`reactions.${alreadyReacted}`] = firebase.firestore.FieldValue.increment(-1);
          }

          updates[`reactions.${emoji}`] = firebase.firestore.FieldValue.increment(1);
          updates[userReactionField] = emoji;

          batch.update(messageRef, updates);
          return batch.commit();
        });
      });
    });

    // Handle replies
    div.querySelector(".reply-btn").addEventListener("click", () => {
      const reply = prompt("Reply to this message:");
      if (reply && window.currentUser) {
        db.collection("siteData").doc("messages").collection("messages").add({
          text: reply,
          senderName: window.currentUser.displayName,
          senderId: window.currentUser.uid,
          parentId: doc.id,
          timestamp: firebase.firestore.FieldValue.serverTimestamp(),
          reactions: {},
          reactionUsers: {}
        });
      }
    });
  }

  function listenToMessages() {
    const messageMap = {};
    chatBox.innerHTML = ""; // Clear previous messages
  
    db.collection("siteData")
      .doc("messages")
      .collection("messages")
      .orderBy("timestamp", "desc")
      .onSnapshot(snapshot => {
        snapshot.docChanges().forEach(change => {
          if (change.type === "added" && !messageMap[change.doc.id]) {
            renderMessage(change.doc, messageMap, chatBox);
          }
        });
      });
  }

  listenToMessages();

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
      reactions: {},
      reactionUsers: {}
    }).then(() => {
      messageInput.value = "";
    });
  });
}); // closes DOMContentLoaded
