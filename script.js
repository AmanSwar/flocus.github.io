document.addEventListener('DOMContentLoaded', () => {
    // --- SHARED ELEMENTS & DATA ---
    const totalHoursDisplay = document.getElementById('total-hours');
    const notificationSound = document.getElementById('notification-sound');
    const focusRatioDisplay = document.getElementById('focus-ratio-display');

    // --- MANTRAS (sourced from Motivation & Mantras page) ---
    const MANTRAS = [
        "The Grind is the Glory.",
        "Every second you spend elsewhere is taken from something that matters.",
        "Learning is not supposed to be fun. It should feel like effort — the mental equivalent of sweating.",
        "Seek the meal, not the snack. Textbooks, docs, longform. Allocate the time. Process, manipulate, learn.",
        "If your work doesn't make you hate it for how difficult it is, are you really even trying?",
        "Your brain should feel overwhelmed with how much there is to learn and how little time you have.",
        "Sit down and bear the discomfort. This is the sign of your brain changing and adapting.",
        "There is no cheat code. No shortcut. You have to put in the hours.",
        "Getting better is a product of Practice and Consistency.",
        "\"My competitive advantage is that I am willing to sit down and fully debug and completely understand code.\" — Young OpenAI Engineer",
        "Effortless is a myth. — Roger Federer",
        "Grit > Gift.",
        "Discipline is talent.",
        "Belief in yourself has to be earned.",
        "You only have one life and time is ticking away.",
        "Time is not stopping for you. Every second you spend is gone forever.",
        "Have a clear goal for each session. Know the why.",
        "Break down every concept. Learn bit by bit.",
        "This exact moment will never come back in your lifetime. Use it.",
        "Have strong resilience. There is no shortcut to success — you have to put in the hours.",
        "Be a person of character. Stand by your constitution.",
        "Every wrong move you take, you trade it with something. Every action has multi-order consequences.",
        "Close those tabs of 'Learn XYZ in 10 minutes'. Seek depth.",
        "Declare your intent: are you consuming content to be entertained, or to learn?",
    ];

    // --- FOCUS MODE STATE ---
    let focusMode = false;
    let activeTimerType = null; // 'pomodoro' | 'flow'
    let mantraInterval = null;
    let currentMantraIndex = 0;

    const focusOverlay = document.getElementById('focus-overlay');
    const focusTimerEl = document.getElementById('focus-timer-display');
    const focusPhaseEl = document.getElementById('focus-phase');
    const focusPauseBtn = document.getElementById('focus-pause-btn');
    const focusExitBtn = document.getElementById('focus-exit-btn');
    const focusMantraEl = document.getElementById('focus-mantra');

    function shuffleArray(arr) {
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
    }

    function showMantra() {
        focusMantraEl.classList.add('fade-out');
        setTimeout(() => {
            focusMantraEl.textContent = MANTRAS[currentMantraIndex];
            currentMantraIndex = (currentMantraIndex + 1) % MANTRAS.length;
            focusMantraEl.classList.remove('fade-out');
        }, 600);
    }

    function enterFocusMode(timerType) {
        focusMode = true;
        activeTimerType = timerType;
        shuffleArray(MANTRAS);
        currentMantraIndex = 0;
        focusOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
        showMantra();
        mantraInterval = setInterval(showMantra, 300_000); // every 5 minutes
    }

    function exitFocusMode() {
        focusMode = false;
        activeTimerType = null;
        focusOverlay.classList.remove('active');
        document.body.style.overflow = '';
        clearInterval(mantraInterval);
        mantraInterval = null;
    }

    // --- SIMPLE TOASTS ---
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
        if (focusMode && activeTimerType === 'pomodoro') {
            focusTimerEl.textContent = text;
        }
    }

    function startPomodoro() {
        if (!isPomodoroPaused) return;
        isPomodoroPaused = false;
        startBtn.textContent = 'Resume';

        if (!focusMode) {
            enterFocusMode('pomodoro');
        }
        focusPhaseEl.textContent = isBreakTime ? 'Break Time' : 'Focus';
        focusPauseBtn.textContent = 'Pause';

        pomodoroInterval = setInterval(() => {
            if (pomodoroSeconds > 0) {
                pomodoroSeconds--;
                updatePomodoroDisplay();
            } else {
                clearInterval(pomodoroInterval);
                try { notificationSound.play().catch(() => { }); } catch (e) { }
                let message = "Break's over! Time to focus.";
                if (!isBreakTime) {
                    const focusSecs = parseInt(focusInput.value, 10) * 60;
                    logStudyTime(focusSecs);
                    message = 'Focus session complete! Logged. Time for a break.';
                }
                isBreakTime = !isBreakTime;
                resetPomodoro();
                toast(message);
                // Auto-advance to next phase while in focus mode
                if (focusMode) {
                    setTimeout(() => startPomodoro(), 800);
                }
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
        const text = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        flowmodoroDisplay.textContent = text;
        if (focusMode && activeTimerType === 'flow') {
            focusTimerEl.textContent = text;
        }
    }

    flowStartBtn.addEventListener('click', () => {
        if (flowInterval) return;
        const startAt = Date.now() - flowSeconds * 1000;
        flowInterval = setInterval(() => {
            flowSeconds = Math.floor((Date.now() - startAt) / 1000);
            updateFlowmodoroDisplay();
        }, 1000);
        focusPhaseEl.textContent = 'Flow';
        focusPauseBtn.textContent = 'Pause';
        enterFocusMode('flow');
    });

    flowStopBtn.addEventListener('click', () => {
        if (flowSeconds > 0) {
            clearInterval(flowInterval);
            flowInterval = null;
            logStudyTime(flowSeconds);
            toast(`Logged ${Math.floor(flowSeconds / 60)} minutes of flow time.`);
            flowSeconds = 0;
            updateFlowmodoroDisplay();
            if (focusMode) exitFocusMode();
        }
    });

    flowResetBtn.addEventListener('click', () => {
        clearInterval(flowInterval);
        flowInterval = null;
        flowSeconds = 0;
        updateFlowmodoroDisplay();
        if (focusMode) exitFocusMode();
    });

    // --- FOCUS OVERLAY CONTROLS ---
    focusPauseBtn.addEventListener('click', () => {
        if (activeTimerType === 'pomodoro') {
            if (isPomodoroPaused) {
                startPomodoro();
            } else {
                pausePomodoro();
                focusPauseBtn.textContent = 'Resume';
            }
        } else if (activeTimerType === 'flow') {
            if (flowInterval) {
                // Pause flow
                clearInterval(flowInterval);
                flowInterval = null;
                focusPauseBtn.textContent = 'Resume';
            } else {
                // Resume flow from saved flowSeconds
                const startAt = Date.now() - flowSeconds * 1000;
                flowInterval = setInterval(() => {
                    flowSeconds = Math.floor((Date.now() - startAt) / 1000);
                    updateFlowmodoroDisplay();
                }, 1000);
                focusPauseBtn.textContent = 'Pause';
            }
        }
    });

    focusExitBtn.addEventListener('click', () => {
        if (activeTimerType === 'pomodoro' && !isPomodoroPaused) {
            pausePomodoro();
        } else if (activeTimerType === 'flow' && flowInterval) {
            clearInterval(flowInterval);
            flowInterval = null;
        }
        exitFocusMode();
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
