document.addEventListener("DOMContentLoaded", function () {

  const API_URL = "https://helpdesk-backend-vvbv.onrender.com/api/tickets";

  let tickets = [];

  const ticketsEl = document.getElementById("tickets");
  const loginBox = document.getElementById("loginBox");
  const appContent = document.getElementById("appContent");

  if (!ticketsEl) {
    console.error("Missing #tickets container");
    return;
  }

  // =========================
  // LOAD TICKETS
  // =========================
  async function loadTickets() {
    try {
      const res = await fetch(API_URL);
      const data = await res.json();

      tickets = data;

      renderTickets(tickets);
      updateDashboard();
      updateAnalytics();
      renderCharts();

    } catch (err) {
      console.error("Error loading tickets:", err);
    }
  }

  loadTickets();

  // =========================
  // SUBMIT TICKET
  // =========================
  document.getElementById("ticketForm").addEventListener("submit", async function (e) {
    e.preventDefault();

    const name = document.getElementById("name").value;
    const issue = document.getElementById("issue").value;

    const ai = analyzeTicket(issue);

    const ticketData = {
      name,
      issue,
      status: "Pending",
      priority: ai.priority,
      category: ai.category,
      time: new Date().toLocaleString()
    };

    await submitToBackend(ticketData);

    this.reset();
  });

  // =========================
  // SEND TO BACKEND
  // =========================
  async function submitToBackend(ticketData) {
    try {
      await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(ticketData)
      });

      loadTickets();

    } catch (err) {
      console.error("Error saving ticket:", err);
    }
  }

  // =========================
  // CREATE TICKET
  // =========================
  function createTicket(ticketData) {

    const ticket = document.createElement("div");
    ticket.classList.add("ticket");

    ticket.dataset.priority = ticketData.priority;

    if (ticketData.status === "Resolved") {
      ticket.classList.add("resolved");
    }

    ticket.innerHTML = `
      <strong>${ticketData.name}</strong><br>
      ${ticketData.issue}<br>
      <span class="status">${ticketData.status}</span><br>
      <small>${ticketData.time}</small><br><br>
      <button class="resolveBtn">Resolve</button>
      <button class="deleteBtn">Delete</button>
    `;

    ticketsEl.appendChild(ticket);

    // =========================
    // DELETE (FIXED)
    // =========================
    ticket.querySelector(".deleteBtn").onclick = async function () {
      await fetch(`${API_URL}/${ticketData._id}`, {
        method: "DELETE"
      });

      loadTickets();
    };

    // =========================
    // RESOLVE (LOCAL ONLY)
    // =========================
    ticket.querySelector(".resolveBtn").onclick = function () {

      const updated = tickets.map(t =>
        t._id === ticketData._id
          ? { ...t, status: "Resolved" }
          : t
      );

      tickets = updated;
      renderTickets(tickets);
      updateDashboard();
      updateAnalytics();
      renderCharts();
    };
  }

  // =========================
  // RENDER
  // =========================
  function renderTickets(data) {
    ticketsEl.innerHTML = "";
    data.forEach(createTicket);
  }

  // =========================
  // DASHBOARD
  // =========================
  function updateDashboard() {
    document.getElementById("totalCount").textContent = tickets.length;

    document.getElementById("pendingCount").textContent =
      tickets.filter(t => t.status === "Pending").length;

    document.getElementById("resolvedCount").textContent =
      tickets.filter(t => t.status === "Resolved").length;
  }

  // =========================
  // ANALYTICS
  // =========================
  function updateAnalytics() {
    const total = tickets.length;
    const resolved = tickets.filter(t => t.status === "Resolved").length;
    const high = tickets.filter(t => t.priority === "High").length;

    const rate = total ? Math.round((resolved / total) * 100) : 0;

    const set = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.textContent = val;
    };

    set("ticketVolume", total);
    set("resolutionRate", rate + "%");
    set("highPriority", high);
  }

  // =========================
  // AI ENGINE
  // =========================
  function analyzeTicket(issue) {

    const text = issue.toLowerCase();

    let priority = "Low";
    let category = "General";

    if (text.includes("urgent") || text.includes("down") || text.includes("not working")) {
      priority = "High";
    } else if (text.includes("error") || text.includes("slow")) {
      priority = "Medium";
    }

    if (text.includes("wifi") || text.includes("internet")) {
      category = "Network";
    } else if (text.includes("login") || text.includes("password")) {
      category = "Access";
    }

    return { priority, category };
  }

  // =========================
  // CHARTS
  // =========================
  let statusChart, priorityChart;

  function renderCharts() {

    const statusCanvas = document.getElementById("statusChart");
    const priorityCanvas = document.getElementById("priorityChart");

    if (!statusCanvas || !priorityCanvas) return;

    const pending = tickets.filter(t => t.status === "Pending").length;
    const resolved = tickets.filter(t => t.status === "Resolved").length;

    const high = tickets.filter(t => t.priority === "High").length;
    const medium = tickets.filter(t => t.priority === "Medium").length;
    const low = tickets.filter(t => t.priority === "Low").length;

    if (statusChart) statusChart.destroy();
    if (priorityChart) priorityChart.destroy();

    statusChart = new Chart(statusCanvas, {
      type: "doughnut",
      data: {
        labels: ["Pending", "Resolved"],
        datasets: [{
          data: [pending, resolved]
        }]
      }
    });

    priorityChart = new Chart(priorityCanvas, {
      type: "bar",
      data: {
        labels: ["High", "Medium", "Low"],
        datasets: [{
          data: [high, medium, low]
        }]
      }
    });
  }

  // =========================
  // FILTER
  // =========================
  window.filterTickets = function (status) {
    const filtered =
      status === "all"
        ? tickets
        : tickets.filter(t => t.status === status);

    renderTickets(filtered);
  };

  // =========================
  // SEARCH
  // =========================
  window.searchTickets = function () {

    const value = document.getElementById("searchInput").value.toLowerCase();

    const filtered = tickets.filter(t =>
      t.name.toLowerCase().includes(value) ||
      t.issue.toLowerCase().includes(value)
    );

    renderTickets(filtered);
  };

  // =========================
  // LOGIN
  // =========================
  window.login = function () {

    const pass = document.getElementById("adminPass").value;

    if (pass === "admin123") {
      loginBox.style.display = "none";
      appContent.style.display = "block";
    } else {
      alert("Wrong password");
    }
  };

});