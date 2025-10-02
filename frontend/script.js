let currentUser = null;

async function signup() {
  const username = document.getElementById("signupUsername").value;
  const password = document.getElementById("signupPassword").value;
  const role = document.getElementById("signupRole").value;

  const res = await fetch("http://127.0.0.1:8000/signup", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({username, password, role})
  });

  const data = await res.json();
  alert(data.msg || JSON.stringify(data));
}

async function login() {
  const username = document.getElementById("loginUsername").value;
  const password = document.getElementById("loginPassword").value;

  const res = await fetch("http://127.0.0.1:8000/login", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({username, password})
  });

  if (res.ok) {
    const user = await res.json();
    currentUser = user;
    document.getElementById("auth").style.display = "none";
    document.getElementById("dashboard").style.display = "block";
    document.getElementById("userName").innerText = user.username;
    document.getElementById("userRole").innerText = user.role;

    if (user.role === "organizer") {
      document.getElementById("organizerPanel").style.display = "block";
    }

    loadEvents();
  } else {
    alert("Login failed!");
  }
}

async function createEvent() {
  const name = document.getElementById("eventName").value;

  const res = await fetch("http://127.0.0.1:8000/events", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({name, organizer_id: currentUser.id})
  });

  const data = await res.json();
  alert(data.msg || JSON.stringify(data));
  loadEvents();
}

async function loadEvents() {
  const res = await fetch("http://127.0.0.1:8000/events");
  const events = await res.json();

  const list = document.getElementById("eventList");
  list.innerHTML = "";
  events.forEach(ev => {
    const li = document.createElement("li");
    li.innerHTML = `${ev.name} 
      ${currentUser.role === "attendee" ? `<button onclick="registerEvent(${ev.id})">Register</button>` : ""}`;
    list.appendChild(li);
  });
}

async function registerEvent(eventId) {
  const res = await fetch("http://127.0.0.1:8000/register", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({user_id: currentUser.id, event_id: eventId})
  });

  const data = await res.json();
  alert(data.msg || JSON.stringify(data));
}

// ----------------------------
// Mock Database (for testing)
// Replace with real API calls later
// ----------------------------
let users = JSON.parse(localStorage.getItem("users")) || [];
let events = JSON.parse(localStorage.getItem("events")) || [];

// ----------------------------
// SIGNUP
// ----------------------------
document.addEventListener("DOMContentLoaded", () => {
  const signupForm = document.getElementById("signupForm");
  if (signupForm) {
    signupForm.addEventListener("submit", (e) => {
      e.preventDefault();

      const username = document.getElementById("signupUsername").value.trim();
      const password = document.getElementById("signupPassword").value.trim();
      const role = document.getElementById("signupRole").value;

      // Check if user exists
      if (users.find((u) => u.username === username)) {
        alert("⚠️ Username already exists!");
        return;
      }

      // Save user
      const newUser = { username, password, role };
      users.push(newUser);
      localStorage.setItem("users", JSON.stringify(users));

      alert("✅ Account created successfully! Please login.");
      window.location.href = "login.html";
    });
  }

  // ----------------------------
  // LOGIN
  // ----------------------------
  const loginForm = document.getElementById("loginForm");
  if (loginForm) {
    loginForm.addEventListener("submit", (e) => {
      e.preventDefault();

      const username = document.getElementById("loginUsername").value.trim();
      const password = document.getElementById("loginPassword").value.trim();

      const user = users.find(
        (u) => u.username === username && u.password === password
      );

      if (!user) {
        alert("❌ Invalid username or password!");
        return;
      }

      // Save current user session
      localStorage.setItem("currentUser", JSON.stringify(user));

      // Redirect based on role
      if (user.role === "organizer") {
        window.location.href = "organizer-dashboard.html";
      } else {
        window.location.href = "attendee-dashboard.html";
      }
    });
  }

  // ----------------------------
  // ORGANIZER DASHBOARD
  // ----------------------------
  const createEventForm = document.getElementById("createEventForm");
  if (createEventForm) {
    renderEvents();

    createEventForm.addEventListener("submit", (e) => {
      e.preventDefault();

      const name = document.getElementById("eventName").value.trim();
      const date = document.getElementById("eventDate").value;
      const description = document
        .getElementById("eventDescription")
        .value.trim();

      const currentUser = JSON.parse(localStorage.getItem("currentUser"));

      const newEvent = {
        id: Date.now(),
        name,
        date,
        description,
        organizer: currentUser.username,
      };

      events.push(newEvent);
      localStorage.setItem("events", JSON.stringify(events));

      alert("🎉 Event created successfully!");
      renderEvents();
      createEventForm.reset();
    });
  }

  // ----------------------------
  // ATTENDEE DASHBOARD
  // ----------------------------
  const availableEvents = document.getElementById("availableEvents");
  if (availableEvents) {
    renderAvailableEvents();
  }
});

// ----------------------------
// FUNCTIONS
// ----------------------------
function renderEvents() {
  const eventList = document.getElementById("eventList");
  if (!eventList) return;

  eventList.innerHTML = "";

  const currentUser = JSON.parse(localStorage.getItem("currentUser"));
  const myEvents = events.filter((e) => e.organizer === currentUser.username);

  myEvents.forEach((event) => {
    const li = document.createElement("li");
    li.textContent = `${event.name} - ${event.date}`;
    eventList.appendChild(li);
  });
}

function renderAvailableEvents() {
  const availableEvents = document.getElementById("availableEvents");
  if (!availableEvents) return;

  availableEvents.innerHTML = "";

  events.forEach((event) => {
    const li = document.createElement("li");
    li.innerHTML = `
      <div>
        <strong>${event.name}</strong> <br>
        📅 ${event.date} <br>
        📝 ${event.description}
      </div>
      <button onclick="joinEvent(${event.id})">Join</button>
    `;
    availableEvents.appendChild(li);
  });
}

function joinEvent(eventId) {
  const currentUser = JSON.parse(localStorage.getItem("currentUser"));
  alert(`🎟️ ${currentUser.username} joined event ID: ${eventId}`);
}

// =================== SIGN UP ===================
document.getElementById("signupForm")?.addEventListener("submit", function (e) {
  e.preventDefault();

  const username = document.getElementById("signupUsername").value.trim();
  const email = document.getElementById("signupEmail").value.trim();
  const password = document.getElementById("signupPassword").value.trim();
  const role = document.getElementById("signupRole").value;

  let users = JSON.parse(localStorage.getItem("users")) || [];

  // 🔹 Check if email already exists
  const emailExists = users.some(user => user.email === email);
  if (emailExists) {
    alert("This email is already registered. Please use another one.");
    return;
  }

  // Save new user
  users.push({ username, email, password, role });
  localStorage.setItem("users", JSON.stringify(users));

  alert("Account created successfully! You can now log in.");
  window.location.href = "login.html";
});


// =================== LOGIN ===================
document.getElementById("loginForm")?.addEventListener("submit", function (e) {
  e.preventDefault();

  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value.trim();

  let users = JSON.parse(localStorage.getItem("users")) || [];

  // 🔹 Match email + password
  const user = users.find(u => u.email === email && u.password === password);

  if (!user) {
    alert("Invalid email or password.");
    return;
  }

  // Store logged-in user
  localStorage.setItem("loggedInUser", JSON.stringify(user));

  // Redirect based on role
  if (user.role === "organizer") {
    window.location.href = "organizer_dashboard.html";
  } else {
    window.location.href = "attendee_dashboard.html";
  }
});


// LOGIN
document.getElementById("loginForm")?.addEventListener("submit", function (e) {
  e.preventDefault();

  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value.trim();

  let users = JSON.parse(localStorage.getItem("users")) || [];

  // find matching user
  const user = users.find(u => u.email === email && u.password === password);

  if (!user) {
    alert("Invalid email or password.");
    return;
  }

  // store current user in localStorage
  localStorage.setItem("currentUser", JSON.stringify(user));

  alert(`Welcome back, ${user.username} (${user.role})!`);

  // redirect based on role
  if (user.role === "organizer") {
    window.location.href = "organizer_dashboard.html";
  } else {
    window.location.href = "attendee_dashboard.html";
  }
});
