const pageCache = {};

function navigate(page) {
  if (pageCache[page]) {
    document.getElementById("content").innerHTML = pageCache[page];
    setupAppointments();
    setupMealPlanButtons();
    history.pushState({ page }, "", "#" + page);
  } else {
    fetch(`pages/${page}.html`)
      .then((response) => response.text())
      .then((data) => {
        pageCache[page] = data;
        document.getElementById("content").innerHTML = data;
        setupAppointments();
        setupMealPlanButtons();
        history.pushState({ page }, "", "#" + page);
      })
      .catch(() => {
        document.getElementById("content").innerHTML =
          "<h2>Page Not Found</h2>";
      });
  }
}

window.addEventListener("popstate", (event) => {
  if (event.state && event.state.page) {
    navigate(event.state.page);
  }
});

const initialPage = location.hash.replace("#", "") || "home";
navigate(initialPage);
setupAppointments();
setupMealPlanButtons();

function setupAppointments() {
  const form = document.getElementById("appointment-form");
  const titleInput = document.getElementById("appointment-title");
  const dateInput = document.getElementById("appointment-date");
  const appointmentsList = document.getElementById("appointments-list");

  if (!form || !titleInput || !dateInput || !appointmentsList) return;

  let appointments;
  try {
    appointments = JSON.parse(localStorage.getItem("appointments")) || [];
  } catch {
    appointments = [];
    localStorage.setItem("appointments", JSON.stringify([]));
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const title = titleInput.value;
    const date = dateInput.value;

    if (title && date) {
      const appointment = { id: Date.now(), title, date };
      appointments.push(appointment);
      saveAppointments();
      renderAppointments();
      form.reset();
    }
  });

  function saveAppointments() {
    localStorage.setItem("appointments", JSON.stringify(appointments));
  }

  function renderAppointments() {
    appointmentsList.innerHTML = "";
    appointments.forEach((app) => {
      const li = document.createElement("li");
      li.className =
        "list-group-item d-flex justify-content-between align-items-center";
      li.innerHTML = `
                <span><strong>${app.title}</strong> - ${new Date(
        app.date
      ).toLocaleString()}</span>
                <div>
                    <button class="btn btn-warning btn-sm me-2" onclick="editAppointment(${
                      app.id
                    })">Edit</button>
                    <button class="btn btn-danger btn-sm" onclick="deleteAppointment(${
                      app.id
                    })">Delete</button>
                </div>`;
      appointmentsList.appendChild(li);
    });
  }

  window.editAppointment = function (id) {
    const appointment = appointments.find((app) => app.id === id);
    if (appointment) {
      titleInput.value = appointment.title;
      dateInput.value = appointment.date;
      deleteAppointment(id);
    }
  };

  window.deleteAppointment = function (id) {
    appointments = appointments.filter((app) => app.id !== id);
    saveAppointments();
    renderAppointments();
  };

  renderAppointments();
}

function setupMealPlanButtons() {
  const mealPlanText = [...document.querySelectorAll(".card-text")].find((el) =>
    el.textContent.includes("Your current meal plan:")
  );

  if (mealPlanText) {
    document.querySelectorAll(".choose-meal-plan").forEach((button) => {
      button.addEventListener("click", () => {
        const selectedMealPlan = button.getAttribute("data-meal-plan");
        mealPlanText.textContent = `Your current meal plan: ${selectedMealPlan}`;
      });
    });
  }
}
