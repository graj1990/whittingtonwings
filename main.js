// main.js
import { db, auth } from "./firebase.js";
import {
  doc,
  getDoc,
  setDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore-compat.js";
import {
  signInWithEmailAndPassword,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth-compat.js";

// === CONFIG ===
const adminEmail = "graysonjarrod@gmail.com"; // <== replace with YOUR Firebase admin email

// === DOM ELEMENTS ===
const dateEl = document.getElementById("event-date");
const locationEl = document.getElementById("event-location");
const adminForm = document.getElementById("admin-form");
const editDate = document.getElementById("edit-date");
const editLocation = document.getElementById("edit-location");
const saveBtn = document.getElementById("save-event");

// === FUNCTIONS ===

// Load event data from Firestore
async function loadEvent() {
  const ref = doc(db, "events", "next");
  const snap = await getDoc(ref);

  if (snap.exists()) {
    const data = snap.data();
    dateEl.textContent = data.date || "TBD";
    locationEl.textContent = data.location || "TBD";
    editDate.value = data.date;
    editLocation.value = data.location;
  } else {
    dateEl.textContent = "No event found";
    locationEl.textContent = "-";
  }
}

// Save updated data to Firestore
async function saveEvent() {
  const newDate = editDate.value;
  const newLocation = editLocation.value;

  const ref = doc(db, "events", "next");
  await setDoc(ref, {
    date: newDate,
    location: newLocation
  });

  loadEvent();
  alert("Wing Night updated!");
}

// Handle login & admin form display
function checkAuth() {
  onAuthStateChanged(auth, (user) => {
    if (user && user.email === adminEmail) {
      adminForm.style.display = "block";
    } else {
      adminForm.style.display = "none";
    }
  });
}

// === EVENT LISTENERS ===
saveBtn.addEventListener("click", saveEvent);

// Prompt login on page load
window.addEventListener("DOMContentLoaded", async () => {
  await loadEvent();
  checkAuth();

  // Prompt login if not already signed in
  auth.onAuthStateChanged((user) => {
    if (!user) {
      const email = prompt("Admin login - email:");
      const password = prompt("Admin login - password:");
      if (email && password) {
        signInWithEmailAndPassword(auth, email, password)
          .then(() => console.log("Logged in"))
          .catch((err) => alert("Login failed: " + err.message));
      }
    }
  });
});
