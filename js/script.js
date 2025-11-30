const STORAGE_KEY = "taskflow_tasks";
const THEME_KEY = "taskflow_theme";
const NAME_KEY = "taskflow_username";

let tasks = [];
let filters = {
  search: "",
  priority: "all",
};
let draggedTaskId = null;

document.addEventListener("DOMContentLoaded", () => {
  const searchInput = document.getElementById("searchInput");
  const priorityFilters = document.getElementById("priorityFilters");
  const addTaskSidebar = document.getElementById("addTaskSidebar");
  const addTaskMain = document.getElementById("addTaskMain");
  const clearAllBtn = document.getElementById("clearAllBtn");
  const themeToggle = document.getElementById("themeToggle");
  const themeIcon = document.getElementById("themeIcon");
  const currentDateEl = document.getElementById("currentDate");

  const taskModal = document.getElementById("taskModal");
  const modalBackdrop = document.getElementById("modalBackdrop");
  const closeModalBtn = document.getElementById("closeModalBtn");
  const cancelModalBtn = document.getElementById("cancelModalBtn");
  const taskForm = document.getElementById("taskForm");

  const taskIdInput = document.getElementById("taskId");
  const taskTitleInput = document.getElementById("taskTitle");
  const taskDescriptionInput = document.getElementById("taskDescription");
  const taskStatusSelect = document.getElementById("taskStatus");
  const taskPrioritySelect = document.getElementById("taskPriority");
  const taskDueDateInput = document.getElementById("taskDueDate");
  const modalTitle = document.getElementById("modalTitle");

  const todoColumn = document.getElementById("todoColumn");
  const inProgressColumn = document.getElementById("inProgressColumn");
  const completedColumn = document.getElementById("completedColumn");

  const countTodo = document.getElementById("count-todo");
  const countInProgress = document.getElementById("count-in-progress");
  const countCompleted = document.getElementById("count-completed");

  const statTotal = document.getElementById("statTotal");
  const statCompleted = document.getElementById("statCompleted");
  const statPercent = document.getElementById("statPercent");

  const columnBodies = document.querySelectorAll(".column-body");

  const avatarToggle = document.getElementById("avatarToggle");
  const avatarMenu = document.getElementById("avatarMenu");
  const avatarMenuTheme = document.getElementById("avatarMenuTheme");
  const avatarMenuClear = document.getElementById("avatarMenuClear");
  const avatarInitial = document.getElementById("avatarInitial");
  const avatarMenuInitial = document.getElementById("avatarMenuInitial");
  const avatarName = document.getElementById("avatarName");
  const avatarMenuSetName = document.getElementById("avatarMenuSetName");

  const filterToggle = document.getElementById("filterToggle");
  const filterBody = document.getElementById("filterBody");
  const filterHeader = document.querySelector(".sidebar-filter-header");

  function formatDate(dateString) {
    if (!dateString) return "";
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleDateString(undefined, {
      day: "2-digit",
      month: "short",
    });
  }

  function setCurrentDate() {
    const now = new Date();
    currentDateEl.textContent = now.toLocaleDateString(undefined, {
      weekday: "short",
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  function saveTasks() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  }

  function loadTasks() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      tasks = stored ? JSON.parse(stored) : [];
      if (!Array.isArray(tasks)) tasks = [];
    } catch (e) {
      console.error("Error loading tasks:", e);
      tasks = [];
    }
  }

  function applyThemeFromStorage() {
    const savedTheme = localStorage.getItem(THEME_KEY);
    if (savedTheme === "dark") {
      document.body.classList.add("dark-mode");
      themeIcon.textContent = "☀️";
    } else {
      document.body.classList.remove("dark-mode");
      themeIcon.textContent = "🌙";
    }
  }

  function toggleTheme() {
    const isDark = document.body.classList.toggle("dark-mode");
    localStorage.setItem(THEME_KEY, isDark ? "dark" : "light");
    themeIcon.textContent = isDark ? "☀️" : "🌙";
  }

  function applyName(name) {
    const display = name && name.trim() ? name.trim() : "User";
    const initial = display.charAt(0).toUpperCase();
    if (avatarInitial) avatarInitial.textContent = initial;
    if (avatarMenuInitial) avatarMenuInitial.textContent = initial;
    if (avatarName) avatarName.textContent = display;
  }

  function loadName() {
    const stored = localStorage.getItem(NAME_KEY);
    if (stored) {
      applyName(stored);
    } else {
      applyName("User");
    }
  }

  function setNameFlow() {
    const current = localStorage.getItem(NAME_KEY) || "";
    const entered = window.prompt("Enter your display name:", current);
    if (entered === null) return;
    const trimmed = entered.trim();
    if (!trimmed) {
      localStorage.removeItem(NAME_KEY);
      applyName("User");
      return;
    }
    localStorage.setItem(NAME_KEY, trimmed);
    applyName(trimmed);
  }

  function openModal(editTask) {
    if (editTask) {
      modalTitle.textContent = "Edit Task";
      taskIdInput.value = editTask.id;
      taskTitleInput.value = editTask.title;
      taskDescriptionInput.value = editTask.description || "";
      taskStatusSelect.value = editTask.status;
      taskPrioritySelect.value = editTask.priority;
      taskDueDateInput.value = editTask.dueDate || "";
    } else {
      modalTitle.textContent = "Add Task";
      taskIdInput.value = "";
      taskTitleInput.value = "";
      taskDescriptionInput.value = "";
      taskStatusSelect.value = "todo";
      taskPrioritySelect.value = "medium";
      taskDueDateInput.value = "";
    }
    taskModal.classList.remove("hidden");
    taskTitleInput.focus();
  }

  function closeModal() {
    taskModal.classList.add("hidden");
    taskForm.reset();
    taskIdInput.value = "";
  }

  function generateId() {
    return (
      Date.now().toString(36) +
      Math.random().toString(36).substring(2, 7)
    ).toUpperCase();
  }

  function createTaskElement(task) {
    const card = document.createElement("article");
    card.className = "task-card";
    card.draggable = true;
    card.dataset.id = task.id;

    const desc = task.description ? task.description.trim() : "";

    card.innerHTML = `
      <h4 class="task-title">${task.title}</h4>
      ${
        desc
          ? `<p class="task-desc">${desc}</p>`
          : `<p class="task-desc" style="opacity:.65;font-style:italic;">No description</p>`
      }
      <div class="task-meta">
        <div class="task-left">
          <span class="priority-badge priority-${task.priority}">
            ${task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
          </span>
          ${
            task.dueDate
              ? `<span class="due-date">Due • ${formatDate(
                  task.dueDate
                )}</span>`
              : ""
          }
        </div>
        <div class="task-actions">
          <button class="action-btn edit-btn" title="Edit task">✏️</button>
          <button class="action-btn delete-btn" title="Delete task">🗑️</button>
        </div>
      </div>
    `;

    const editBtn = card.querySelector(".edit-btn");
    const deleteBtn = card.querySelector(".delete-btn");

    editBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const found = tasks.find((t) => t.id === task.id);
      if (found) openModal(found);
    });

    deleteBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const confirmed = window.confirm("Delete this task permanently?");
      if (!confirmed) return;
      tasks = tasks.filter((t) => t.id !== task.id);
      saveTasks();
      renderTasks();
    });

    card.addEventListener("dragstart", () => {
      draggedTaskId = task.id;
      card.classList.add("dragging");
    });

    card.addEventListener("dragend", () => {
      draggedTaskId = null;
      card.classList.remove("dragging");
      columnBodies.forEach((body) => body.classList.remove("drag-over"));
    });

    return card;
  }

  function renderTasks() {
    todoColumn.innerHTML = "";
    inProgressColumn.innerHTML = "";
    completedColumn.innerHTML = "";

    let todoCount = 0;
    let inProgressCount = 0;
    let completedCount = 0;

    const search = filters.search.toLowerCase().trim();
    const priorityFilter = filters.priority;

    tasks.forEach((task) => {
      if (priorityFilter !== "all" && task.priority !== priorityFilter) return;

      if (search) {
        const combined =
          (task.title || "") + " " + (task.description || "");
        if (!combined.toLowerCase().includes(search)) return;
      }

      const element = createTaskElement(task);

      if (task.status === "todo") {
        todoColumn.appendChild(element);
        todoCount++;
      } else if (task.status === "in-progress") {
        inProgressColumn.appendChild(element);
        inProgressCount++;
      } else if (task.status === "completed") {
        completedColumn.appendChild(element);
        completedCount++;
      }
    });

    countTodo.textContent = todoCount;
    countInProgress.textContent = inProgressCount;
    countCompleted.textContent = completedCount;

    const total = todoCount + inProgressCount + completedCount;
    if (statTotal) statTotal.textContent = total;
    if (statCompleted) statCompleted.textContent = completedCount;
    if (statPercent) {
      if (!total) {
        statPercent.textContent = "0%";
      } else {
        const pct = Math.round((completedCount / total) * 100);
        statPercent.textContent = pct + "%";
      }
    }
  }

  function handleTaskFormSubmit(e) {
    e.preventDefault();

    const id = taskIdInput.value.trim();
    const title = taskTitleInput.value.trim();
    const description = taskDescriptionInput.value.trim();
    const status = taskStatusSelect.value;
    const priority = taskPrioritySelect.value;
    const dueDate = taskDueDateInput.value;

    if (!title) {
      alert("Title is required.");
      taskTitleInput.focus();
      return;
    }

    if (id) {
      const index = tasks.findIndex((t) => t.id === id);
      if (index !== -1) {
        tasks[index] = {
          ...tasks[index],
          title,
          description,
          status,
          priority,
          dueDate,
        };
      }
    } else {
      const newTask = {
        id: generateId(),
        title,
        description,
        status,
        priority,
        dueDate,
      };
      tasks.push(newTask);
    }

    saveTasks();
    renderTasks();
    closeModal();
  }

  function handleSearchInput(e) {
    filters.search = e.target.value || "";
    renderTasks();
  }

  function handlePriorityClick(e) {
    const btn = e.target.closest(".chip");
    if (!btn) return;
    const value = btn.dataset.priority;
    filters.priority = value;

    priorityFilters
      .querySelectorAll(".chip")
      .forEach((chip) => chip.classList.remove("chip-active"));
    btn.classList.add("chip-active");

    renderTasks();
  }

  function handleClearAll() {
    if (!tasks.length) {
      alert("No tasks to clear.");
      return;
    }
    const confirmed = window.confirm(
      "Clear ALL tasks? This cannot be undone."
    );
    if (!confirmed) return;
    tasks = [];
    saveTasks();
    renderTasks();
  }

  function updateTaskStatus(id, newStatus) {
    const index = tasks.findIndex((t) => t.id === id);
    if (index === -1) return;
    tasks[index].status = newStatus;
    saveTasks();
    renderTasks();
  }

  columnBodies.forEach((body) => {
    body.addEventListener("dragover", (e) => {
      e.preventDefault();
      body.classList.add("drag-over");
    });

    body.addEventListener("dragleave", () => {
      body.classList.remove("drag-over");
    });

    body.addEventListener("drop", () => {
      body.classList.remove("drag-over");
      if (!draggedTaskId) return;
      const column = body.closest(".column");
      const status = column.dataset.status;
      updateTaskStatus(draggedTaskId, status);
    });
  });

  function initFilterCollapse() {
    if (!filterBody || !filterToggle) return;

    const isMobile = window.innerWidth <= 900;

    if (isMobile) {
      if (!filterBody.classList.contains("collapsed")) {
        filterBody.classList.add("collapsed");
      }
      filterToggle.textContent = "▾";
      filterToggle.setAttribute("aria-expanded", "false");
    } else {
      filterBody.classList.remove("collapsed");
      filterToggle.textContent = "▾";
      filterToggle.setAttribute("aria-expanded", "true");
    }
  }

  if (filterToggle && filterBody) {
    const toggleFn = () => {
      const collapsed = filterBody.classList.toggle("collapsed");
      if (collapsed) {
        filterToggle.textContent = "▾";
        filterToggle.setAttribute("aria-expanded", "false");
      } else {
        filterToggle.textContent = "▴";
        filterToggle.setAttribute("aria-expanded", "true");
      }
    };

    filterToggle.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleFn();
    });

    if (filterHeader) {
      filterHeader.addEventListener("click", (e) => {
        if (e.target === filterToggle) return;
        toggleFn();
      });
    }

    window.addEventListener("resize", initFilterCollapse);
  }

  searchInput.addEventListener("input", handleSearchInput);
  priorityFilters.addEventListener("click", handlePriorityClick);

  addTaskSidebar.addEventListener("click", () => openModal());
  addTaskMain.addEventListener("click", () => openModal());

  clearAllBtn.addEventListener("click", handleClearAll);

  taskForm.addEventListener("submit", handleTaskFormSubmit);

  closeModalBtn.addEventListener("click", closeModal);
  cancelModalBtn.addEventListener("click", closeModal);
  modalBackdrop.addEventListener("click", closeModal);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !taskModal.classList.contains("hidden")) {
      closeModal();
    }
  });

  themeToggle.addEventListener("click", toggleTheme);

  function closeAvatarMenu() {
    avatarMenu.classList.add("hidden");
  }

  if (avatarToggle && avatarMenu) {
    avatarToggle.addEventListener("click", (e) => {
      e.stopPropagation();
      avatarMenu.classList.toggle("hidden");
    });

    document.addEventListener("click", (e) => {
      if (
        !avatarMenu.classList.contains("hidden") &&
        !avatarMenu.contains(e.target) &&
        e.target !== avatarToggle
      ) {
        closeAvatarMenu();
      }
    });
  }

  if (avatarMenuTheme) {
    avatarMenuTheme.addEventListener("click", () => {
      toggleTheme();
    });
  }

  if (avatarMenuClear) {
    avatarMenuClear.addEventListener("click", () => {
      handleClearAll();
      closeAvatarMenu();
    });
  }

  if (avatarMenuSetName) {
    avatarMenuSetName.addEventListener("click", () => {
      setNameFlow();
    });
  }

  setCurrentDate();
  applyThemeFromStorage();
  loadName();
  loadTasks();
  renderTasks();
  initFilterCollapse();
});
