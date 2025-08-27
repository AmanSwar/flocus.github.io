document.addEventListener('DOMContentLoaded', () => {
    // --- SHARED ELEMENTS & DATA ---
    const totalHoursDisplay = document.getElementById('total-hours');
    const notificationSound = document.getElementById('notification-sound');
    const focusRatioDisplay = document.getElementById('focus-ratio-display');

    // --- SIMPLE TOASTS (non-blocking instead of alerts) ---
    const toastContainer = document.getElementById('toast-container');
    function toast(message, ms = 2600) {
        const t = document.createElement('div');
        t.className = 'toast';
        t.textContent = message;
        toastContainer.appendChild(t);
        setTimeout(() => {
            t.style.opacity = '0';
            t.style.transform = 'translateY(8px)';
            setTimeout(() => t.remove(), 180);
        }, ms);
    }

    // --- POMODORO TIMER ---
    const pomodoroDisplay = document.getElementById('pomodoro-display');
    const focusInput = document.getElementById('focus-time-input');
    const breakInput = document.getElementById('break-time-input');
    const startBtn = document.getElementById('pomodoro-start');
    const pauseBtn = document.getElementById('pomodoro-pause');
    const resetBtn = document.getElementById('pomodoro-reset');

    let pomodoroInterval;
    let isPomodoroPaused = true;
    let isBreakTime = false;
    let pomodoroSeconds = (parseInt(focusInput.value, 10) * 60);

    function updatePomodoroDisplay() {
        const minutes = Math.floor(pomodoroSeconds / 60);
        const seconds = pomodoroSeconds % 60;
        const text = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        pomodoroDisplay.textContent = text;
        document.title = `${text} — ${isBreakTime ? 'Break' : 'Focus'} · Focus Dashboard`;
    }

    function startPomodoro() {
        if (!isPomodoroPaused) return;
        isPomodoroPaused = false;
        startBtn.textContent = 'Start';
        pomodoroInterval = setInterval(() => {
            if (pomodoroSeconds > 0) {
                pomodoroSeconds--;
                updatePomodoroDisplay();
            } else {
                clearInterval(pomodoroInterval);
                try { notificationSound.play().catch(() => { }); } catch (e) { }
                let message = "Break's over! Time to focus.";
                if (!isBreakTime) {
                    // Focus completed, log focus window
                    const focusSecs = parseInt(focusInput.value, 10) * 60;
                    logStudyTime(focusSecs);
                    message = 'Focus session complete! Logged successfully. Time for a break.';
                }
                isBreakTime = !isBreakTime;
                resetPomodoro();
                toast(message);
            }
        }, 1000);
    }

    function pausePomodoro() {
        isPomodoroPaused = true;
        clearInterval(pomodoroInterval);
        startBtn.textContent = 'Resume';
    }

    function resetPomodoro() {
        clearInterval(pomodoroInterval);
        const durationMin = isBreakTime ? parseInt(breakInput.value, 10) : parseInt(focusInput.value, 10);
        pomodoroSeconds = (isNaN(durationMin) ? 0 : durationMin) * 60;
        isPomodoroPaused = true;
        updatePomodoroDisplay();
        startBtn.textContent = 'Start';
    }

    startBtn.addEventListener('click', startPomodoro);
    pauseBtn.addEventListener('click', pausePomodoro);
    resetBtn.addEventListener('click', () => { isBreakTime = false; resetPomodoro(); });
    focusInput.addEventListener('change', resetPomodoro);
    breakInput.addEventListener('change', resetPomodoro);

    // --- FLOWMODORO TIMER ---
    const flowmodoroDisplay = document.getElementById('flowmodoro-display');
    const flowStartBtn = document.getElementById('flowmodoro-start');
    const flowStopBtn = document.getElementById('flowmodoro-stop');
    const flowResetBtn = document.getElementById('flowmodoro-reset');

    let flowInterval;
    let flowSeconds = 0;

    function updateFlowmodoroDisplay() {
        const hours = Math.floor(flowSeconds / 3600);
        const minutes = Math.floor((flowSeconds % 3600) / 60);
        const seconds = flowSeconds % 60;
        flowmodoroDisplay.textContent =
            `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }

    flowStartBtn.addEventListener('click', () => {
        if (flowInterval) return;
        const startAt = Date.now() - flowSeconds * 1000;
        flowInterval = setInterval(() => {
            flowSeconds = Math.floor((Date.now() - startAt) / 1000);
            updateFlowmodoroDisplay();
        }, 1000);
    });

    flowStopBtn.addEventListener('click', () => {
        if (flowSeconds > 0) {
            clearInterval(flowInterval);
            flowInterval = null;
            logStudyTime(flowSeconds);
            toast(`Logged ${Math.floor(flowSeconds / 60)} minutes of flow time.`);
            flowSeconds = 0;
            updateFlowmodoroDisplay();
        }
    });

    flowResetBtn.addEventListener('click', () => {
        clearInterval(flowInterval);
        flowInterval = null;
        flowSeconds = 0;
        updateFlowmodoroDisplay();
    });

    // --- TASK LIST ---
    const taskInput = document.getElementById('task-input');
    const addTaskBtn = document.getElementById('add-task-btn');
    const taskList = document.getElementById('task-list');
    let tasks = JSON.parse(localStorage.getItem('tasks')) || [];

    function saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(tasks));
    }

    function renderTasks() {
        taskList.innerHTML = '';
        tasks.forEach((task, index) => {
            const li = document.createElement('li');
            li.className = task.completed ? 'completed' : '';

            const taskText = document.createElement('span');
            taskText.textContent = task.text;
            taskText.title = "Mark complete";
            taskText.addEventListener('click', () => toggleTask(index));

            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = 'Delete';
            deleteBtn.className = 'delete-btn';
            deleteBtn.addEventListener('click', () => deleteTask(index));

            li.appendChild(taskText);
            li.appendChild(deleteBtn);
            taskList.appendChild(li);
        });
    }

    function addTask() {
        const text = taskInput.value.trim();
        if (!text) return;
        tasks.unshift({ text, completed: false });
        taskInput.value = '';
        saveTasks();
        renderTasks();
    }

    function toggleTask(index) {
        tasks[index].completed = !tasks[index].completed;
        saveTasks();
        renderTasks();
    }

    function deleteTask(index) {
        tasks.splice(index, 1);
        saveTasks();
        renderTasks();
    }

    addTaskBtn.addEventListener('click', addTask);
    taskInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') addTask(); });

    // --- STUDY TIME LOGGING & WEEKLY REPORT ---
    const weeklyReportContainer = document.getElementById('weekly-report');
    let dailyLog = JSON.parse(localStorage.getItem('dailyLog')) || {};

    function logStudyTime(seconds) {
        const today = new Date().toISOString().slice(0, 10);
        dailyLog[today] = (dailyLog[today] || 0) + seconds;
        localStorage.setItem('dailyLog', JSON.stringify(dailyLog));
        updateTotalDisplay();
        renderWeeklyReport();
        updateFocusRatio();
    }

    function updateTotalDisplay() {
        const today = new Date().toISOString().slice(0, 10);
        const secondsStudiedToday = dailyLog[today] || 0;
        const hours = Math.floor(secondsStudiedToday / 3600);
        const minutes = Math.floor((secondsStudiedToday % 3600) / 60);
        totalHoursDisplay.textContent = `${hours} hours ${minutes} minutes`;
    }

    function updateFocusRatio() {
        const today = new Date().toISOString().slice(0, 10);
        const secondsStudiedToday = dailyLog[today] || 0;
        const hoursStudied = Math.floor(secondsStudiedToday / 3600);

        // Hours passed in the day (1..24). Avoid divide-by-zero at midnight.
        const now = new Date();
        const hoursPassed = Math.max(1, now.getHours());

        focusRatioDisplay.textContent = `${hoursStudied} / ${hoursPassed}`;
    }

    function renderWeeklyReport() {
        weeklyReportContainer.innerHTML = '';
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const today = new Date();
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());

        for (let i = 0; i < 7; i++) {
            const day = new Date(startOfWeek);
            day.setDate(startOfWeek.getDate() + i);
            const dateString = day.toISOString().slice(0, 10);

            const secondsStudied = dailyLog[dateString] || 0;
            const hours = Math.floor(secondsStudied / 3600);
            const minutes = Math.floor((secondsStudied % 3600) / 60);
            const displayTime = `${hours}h ${minutes}m`;

            const dayDiv = document.createElement('div');
            dayDiv.className = 'day-report';
            dayDiv.innerHTML = `
        <div class="day-name">${dayNames[i]}</div>
        <div class="day-hours">${displayTime}</div>
      `;
            weeklyReportContainer.appendChild(dayDiv);
        }
    }

    // --- INITIALIZATION ---
    function initialize() {
        updateTotalDisplay();
        updatePomodoroDisplay();
        updateFlowmodoroDisplay();
        renderTasks();
        renderWeeklyReport();
        updateFocusRatio();
        setInterval(updateFocusRatio, 60_000);
    }

    initialize();
});
