const profileNav = document.querySelector(".main-nav");
const menuButton = document.querySelector("[data-profile-menu]");
const tabs = document.querySelectorAll("[data-profile-tab]");
const panels = document.querySelectorAll("[data-profile-panel]");
const loginForm = document.querySelector("[data-login-form]");
const loginNote = document.querySelector("[data-login-note]");
const demoUser = document.querySelector("[data-demo-user]");
const demoStatus = document.querySelector("[data-demo-status]");
const accountName = document.querySelector("[data-account-name]");

function setActivePanel(panelName) {
  tabs.forEach((tab) => {
    tab.classList.toggle("active", tab.dataset.profileTab === panelName);
  });

  panels.forEach((panel) => {
    panel.classList.toggle("active", panel.dataset.profilePanel === panelName);
  });
}

function updateDemoUser() {
  const storedName = localStorage.getItem("nevoDemoUser");
  if (!storedName) return;
  demoUser.textContent = storedName;
  accountName.textContent = storedName;
  demoStatus.textContent = "Logged in demo member";
}

tabs.forEach((tab) => {
  tab.addEventListener("click", () => setActivePanel(tab.dataset.profileTab));
});

menuButton.addEventListener("click", () => {
  profileNav.classList.toggle("open");
});

profileNav.addEventListener("click", () => {
  profileNav.classList.remove("open");
});

loginForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const name = document.querySelector("#login-name").value.trim() || "Demo User";
  localStorage.setItem("nevoDemoUser", name);
  updateDemoUser();
  loginNote.textContent = "Login successful for demo preview.";
  setActivePanel("account");
});

updateDemoUser();
