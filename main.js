document.addEventListener("DOMContentLoaded", () => {
  const signInBtn = document.getElementById("signInBtn");
  const signOutBtn = document.getElementById("signOutBtn");
  const userDisplay = document.getElementById("userDisplay");
  const messageInput = document.getElementById("messageInput");
  const sendBtn = document.getElementById("sendMessage");
  const chatBox = document.getElementById("chatMessages");

  // --- Sign In/Out ---
  signInBtn.addEventListener("click", () => {
    auth.signInWithPopup(provider).catch((error) => {
      console.error("Sign in error", error);
    });
  });

  signOutBtn.addEventListener("click", () => auth.signOut());

  // --- Auth State Listener ---
  auth.onAuthStateChanged((user) => {
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

  // --- Wing Night & Leaderboard ---
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

  // --- Chat Functions ---
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

  // Only insert top-level messages here; replies will be attached later
  if (!data.parentId) {
    chatBox.appendChild(div);
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

  function displayMessages(messageMap) {
    chatBox.innerHTML = "";

    const topLevel = Object.entries(messageMap)
      .filter(([_, val]) => !val.data.parentId)
      .sort((a, b) => b[1].data.timestamp?.toMillis() - a[1].data.timestamp?.toMillis());

    topLevel.forEach(([id, val]) => {
      chatBox.appendChild(val.div);

      const replies = Object.entries(messageMap)
        .filter(([_, reply]) => reply.data.parentId === id)
        .sort((a, b) => a[1].data.timestamp?.toMillis() - b[1].data.timestamp?.toMillis());

      replies.forEach(([_, replyVal]) => {
        val.div.appendChild(replyVal.div);
      });
    });
  }

  function addHandlers(messageMap) {
    Object.values(messageMap).forEach(({ div, data }) => {
      div.querySelectorAll(".reaction-btn").forEach(btn => {
        btn.onclick = () => {
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
        };
      });

      const replyBtn = div.querySelector(".reply-btn");
      if (replyBtn) {
        replyBtn.onclick = () => {
          const reply = prompt("Reply to this message:");
          if (reply && window.currentUser) {
            db.collection("siteData").doc("messages").collection("messages").add({
              text: reply,
              senderName: window.currentUser.displayName,
              senderId: window.currentUser.uid,
              parentId: data.parentId || replyBtn.dataset.id,
              timestamp: firebase.firestore.FieldValue.serverTimestamp(),
              reactions: {},
              reactionUsers: {}
            });
          }
        };
      }
    });
  }

function listenToMessages() {
  db.collection("siteData")
    .doc("messages")
    .collection("messages")
    .orderBy("timestamp", "desc")
    .onSnapshot(snapshot => {
      chatBox.innerHTML = "";
      const messageMap = {};
      const parentMap = {};
      const topLevelMessages = [];

      // Build maps
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        renderMessage(doc, messageMap);

        if (data.parentId) {
          parentMap[data.parentId] = parentMap[data.parentId] || [];
          parentMap[data.parentId].push(doc.id);
        } else {
          topLevelMessages.push(doc.id);
        }
      });

      // Append top-level messages in descending order
      topLevelMessages.forEach(parentId => {
        const parentDiv = messageMap[parentId];
        if (parentDiv) chatBox.appendChild(parentDiv);

        // Append replies under each parent
        const replies = parentMap[parentId];
        if (replies) {
          replies.forEach(replyId => {
            const replyDiv = messageMap[replyId];
            if (replyDiv) parentDiv.appendChild(replyDiv);
          });
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
      parentId: null,
      timestamp: firebase.firestore.FieldValue.serverTimestamp(),
      reactions: {},
      reactionUsers: {}
    }).then(() => {
      messageInput.value = "";
    });
  });
});
