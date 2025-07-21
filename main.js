// Imports and DOM Setup

document.addEventListener("DOMContentLoaded", () => {
  const signInBtn = document.getElementById("signInBtn");
  const signOutBtn = document.getElementById("signOutBtn");
  const userDisplay = document.getElementById("userDisplay");

  signInBtn.addEventListener("click", () => {
    auth.signInWithPopup(provider).catch((error) => {
      console.error("Sign in error", error);
    });
  });

  signOutBtn.addEventListener("click", () => auth.signOut());

// Auth State Handling
  
  auth.onAuthStateChanged((user) => {
    const messageInput = document.getElementById("messageInput");
    const sendBtn = document.getElementById("sendMessage");
    const authNotice = document.getElementById("authNotice");

    if (user) {
      signInBtn.style.display = "none";
      signOutBtn.style.display = "inline-block";
      userDisplay.textContent = `Signed in as: ${user.displayName}`;
      window.currentUser = user;
      messageInput.disabled = false;
      sendBtn.disabled = false;
      authNotice.style.display = "none";
    } else {
      signInBtn.style.display = "inline-block";
      signOutBtn.style.display = "none";
      userDisplay.textContent = "";
      window.currentUser = null;
      messageInput.disabled = true;
      sendBtn.disabled = true;
      authNotice.style.display = "block";
    }
  });

// Wing Night + Leaderboard Load

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

// Chat Message Logic (Replies + Reactions + Descending Order)

  const chatBox = document.getElementById("chatMessages");
  const sendBtn = document.getElementById("sendMessage");
  const messageInput = document.getElementById("messageInput");

  function formatTimestamp(timestamp) {
    const date = timestamp.toDate();
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    })}`;
  }

  function renderMessage(doc, messageMap) {
    const data = doc.data();
    const div = document.createElement("div");
    div.className = data.parentId ? "chat-message chat-reply" : "chat-message";
    div.dataset.id = doc.id;

    const timestamp = data.timestamp?.toDate();
    const formattedTime = timestamp ? formatTimestamp(data.timestamp) : "Just now";

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
    } else {
      chatBox.appendChild(div);
    }

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
    chatBox.innerHTML = "";

    db.collection("siteData")
      .doc("messages")
      .collection("messages")
      .orderBy("timestamp", "desc")
      .onSnapshot(snapshot => {
        chatBox.innerHTML = ""; // reset on every update
        snapshot.docs.forEach(doc => {
          renderMessage(doc, messageMap);
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
      parentId: null,
      timestamp: firebase.firestore.FieldValue.serverTimestamp(),
      reactions: {},
      reactionUsers: {}
    }).then(() => {
      messageInput.value = "";
    });
  });
}); // 👈 This closes the DOMContentLoaded event listener
