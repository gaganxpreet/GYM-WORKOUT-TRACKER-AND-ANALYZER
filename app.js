// App State Management
class FitnessApp {
    constructor() {
        this.currentScreen = 'home';
        this.currentWorkout = null;
        this.activeWorkoutData = null;
        this.timer = null;
        this.timerDuration = 0;
        this.timerRemaining = 0;
        this.isTimerRunning = false;
        
        this.init();
    }

    init() {
        this.loadData();
        this.setupEventListeners();
        this.updateUI();
        this.showScreen('home');
        // Initialize date on homepage
        this.updateCurrentDate();
    }

    // Update current date on home screen
    updateCurrentDate() {
        const now = new Date();
        const dateOptions = { weekday: 'long', month: 'long', day: 'numeric' };
        document.getElementById('current-date').textContent = now.toLocaleDateString('en-US', dateOptions);
    }

    // Data Management
    loadData() {
        // Load workouts or initialize with empty array
        this.workouts = JSON.parse(localStorage.getItem('workouts') || '[]');
        
        // Load body measurements or initialize with default values
        this.bodyMeasurements = JSON.parse(localStorage.getItem('bodyMeasurements') || '{}');
        
        // Initialize body measurements with default values if empty
        const defaultMeasurements = ['Chest', 'Shoulders', 'Waist', 'Arms', 'Legs'];
        defaultMeasurements.forEach(part => {
            if (!this.bodyMeasurements[part]) {
                this.bodyMeasurements[part] = { value: 0, change: 0, date: new Date().toISOString() };
            }
        });
        
        // Load achievements or initialize with defaults
        this.achievements = JSON.parse(localStorage.getItem('achievements') || JSON.stringify([
            { id: 1, name: "First Workout", description: "Complete your first workout", icon: "🏆", unlocked: false },
            { id: 2, name: "10 Workouts", description: "Complete 10 workouts", icon: "🎯", unlocked: false },
            { id: 3, name: "100kg Squat", description: "Squat 100kg or more", icon: "💪", unlocked: false },
            { id: 4, name: "Consistent", description: "Work out 3x per week for a month", icon: "📅", unlocked: false }
        ]));
        
        // Load user profile or initialize with defaults
        this.userProfile = JSON.parse(localStorage.getItem('userProfile') || JSON.stringify({
            name: "John Doe",
            joinDate: "2022-10-01",
            preferences: { notifications: true, darkMode: true }
        }));
        
        // Load strength metrics or initialize with defaults
        this.strengthMetrics = JSON.parse(localStorage.getItem('strengthMetrics') || JSON.stringify([
            { exercise: "Bench Press", currentMax: 0, improvement: 0 },
            { exercise: "Squat", currentMax: 0, improvement: 0 },
            { exercise: "Deadlift", currentMax: 0, improvement: 0 },
            { exercise: "Pull-ups", currentMax: 0, improvement: 0 }
        ]));
    }

    saveData() {
        localStorage.setItem('workouts', JSON.stringify(this.workouts));
        localStorage.setItem('bodyMeasurements', JSON.stringify(this.bodyMeasurements));
        localStorage.setItem('achievements', JSON.stringify(this.achievements));
        localStorage.setItem('userProfile', JSON.stringify(this.userProfile));
        localStorage.setItem('strengthMetrics', JSON.stringify(this.strengthMetrics));
    }

    // Event Listeners
    setupEventListeners() {
        // Bottom navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const screen = e.currentTarget.dataset.screen;
                this.showScreen(screen);
            });
        });

        // Filter tabs for workouts
        document.querySelectorAll('.filter-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                this.setActiveFilterTab(e.target);
                this.filterWorkouts(e.target.dataset.filter);
            });
        });

        // Progress tabs
        document.querySelectorAll('.progress-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                this.setActiveProgressTab(e.target);
                this.showProgressTab(e.target.dataset.tab);
            });
        });

        // Start workout button
        document.getElementById('start-workout-btn').addEventListener('click', () => {
            this.showWorkoutSelection();
        });

        // Create workout buttons
        document.getElementById('create-first-workout-btn').addEventListener('click', () => {
            this.showWorkoutSelection();
        });
        
        // Add workout FAB
        document.getElementById('add-workout-fab').addEventListener('click', () => {
            this.showWorkoutSelection();
        });

        // Settings
        document.getElementById('settings-btn').addEventListener('click', () => {
            this.showModal('settings-modal');
        });

        // Active workout controls
        document.getElementById('complete-set-btn').addEventListener('click', () => {
            this.completeSet();
        });
        document.getElementById('next-exercise-btn').addEventListener('click', () => {
            this.nextExercise();
        });
        document.getElementById('finish-workout-btn').addEventListener('click', () => {
            this.finishWorkout();
        });
        document.getElementById('back-to-home').addEventListener('click', () => {
            if (confirm('Are you sure you want to leave this workout? Progress will be lost.')) {
                this.activeWorkoutData = null;
                this.showScreen('home');
            }
        });

        // Timer controls
        document.querySelectorAll('.timer-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.setTimerDuration(parseInt(e.target.dataset.time));
            });
        });
        
        document.getElementById('start-timer').addEventListener('click', () => {
            // Only start if timer isn't already running
            if (!this.isTimerRunning) {
                this.startTimer();
            }
        });
        
        document.getElementById('stop-timer').addEventListener('click', () => {
            if (this.isTimerRunning) {
                this.stopTimer();
            }
        });

        // Body measurements
        document.getElementById('add-measurement-btn').addEventListener('click', () => {
            this.showModal('measurement-modal');
        });
        document.getElementById('save-measurement-btn').addEventListener('click', () => {
            this.saveMeasurement();
        });

        // Modal close buttons
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.hideModal(e.target.closest('.modal').id);
            });
        });

        // Settings toggles
        document.getElementById('notifications-toggle').addEventListener('change', (e) => {
            this.userProfile.preferences.notifications = e.target.checked;
            this.saveData();
        });
        document.getElementById('dark-mode-toggle').addEventListener('change', (e) => {
            this.userProfile.preferences.darkMode = e.target.checked;
            this.saveData();
        });

        // Export data
        document.getElementById('export-data-btn').addEventListener('click', () => {
            this.exportData();
        });

        // Logout
        document.getElementById('logout-btn').addEventListener('click', () => {
            if (confirm('Are you sure you want to log out?')) {
                localStorage.clear();
                location.reload();
            }
        });
    }

    // Navigation
    showScreen(screenName) {
        // Hide all screens
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });

        // Show target screen
        document.getElementById(`${screenName}-screen`).classList.add('active');

        // Update navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-screen="${screenName}"]`).classList.add('active');

        this.currentScreen = screenName;
        
        // Update screen-specific content
        if (screenName === 'home') {
            this.updateHomeScreen();
        } else if (screenName === 'workouts') {
            this.updateWorkoutsScreen();
        } else if (screenName === 'progress') {
            this.updateProgressScreen();
        } else if (screenName === 'profile') {
            this.updateProfileScreen();
        }
    }

    // Home Screen Updates
    updateHomeScreen() {
        // Update date
        this.updateCurrentDate();

        // Update statistics
        this.updateStatistics();

        // Update latest workout
        this.updateLatestWorkout();

        // Update suggested workouts
        this.updateSuggestedWorkouts();
    }

    updateStatistics() {
        const thisWeekCount = this.getThisWeekWorkouts().length;
        const totalWorkouts = this.workouts.filter(w => w.isCompleted).length;
        const completedExercises = this.workouts.reduce((sum, w) => {
            if (w.isCompleted) {
                return sum + w.exercises.length;
            }
            return sum;
        }, 0);

        document.getElementById('this-week-count').textContent = thisWeekCount;
        document.getElementById('total-workouts-count').textContent = totalWorkouts;
        document.getElementById('completed-exercises-count').textContent = completedExercises;
    }

    updateLatestWorkout() {
        const latestWorkout = this.workouts
            .filter(w => w.isCompleted)
            .sort((a, b) => new Date(b.endTime) - new Date(a.endTime))[0];

        const container = document.getElementById('latest-workout-content');
        
        if (latestWorkout) {
            container.innerHTML = `
                <div class="workout-list-item">
                    <h4>${latestWorkout.name}</h4>
                    <div class="workout-list-meta">
                        <span>${new Date(latestWorkout.date).toLocaleDateString()}</span>
                        <span>${latestWorkout.exercises.length} exercises</span>
                        <span>${latestWorkout.totalDuration} min</span>
                    </div>
                </div>
            `;
        } else {
            container.innerHTML = `
                <div class="empty-state">
                    <p>No workouts yet. Start your fitness journey!</p>
                    <button class="btn btn--secondary" id="create-first-workout-btn">Create First Workout</button>
                </div>
            `;
            // Re-attach event listener
            document.getElementById('create-first-workout-btn').addEventListener('click', () => {
                this.showWorkoutSelection();
            });
        }
    }

    updateSuggestedWorkouts() {
        const suggestedWorkouts = [
            {
                id: 1, name: "Chest & Triceps", exerciseCount: 8, duration: "45-60 min",
                exercises: [
                    {name: "Bench Press", sets: 3, reps: "8-12"},
                    {name: "Incline Dumbbell Press", sets: 3, reps: "10-12"},
                    {name: "Chest Flyes", sets: 3, reps: "12-15"},
                    {name: "Dips", sets: 3, reps: "10-15"},
                    {name: "Tricep Pushdowns", sets: 3, reps: "12-15"},
                    {name: "Overhead Tricep Extension", sets: 3, reps: "10-12"},
                    {name: "Close-grip Push-ups", sets: 2, reps: "15-20"},
                    {name: "Diamond Push-ups", sets: 2, reps: "10-15"}
                ]
            },
            {
                id: 2, name: "Back & Biceps", exerciseCount: 7, duration: "40-50 min",
                exercises: [
                    {name: "Pull-ups/Lat Pulldown", sets: 3, reps: "8-12"},
                    {name: "Barbell Rows", sets: 3, reps: "8-10"},
                    {name: "Seated Cable Rows", sets: 3, reps: "10-12"},
                    {name: "Bicep Curls", sets: 3, reps: "12-15"},
                    {name: "Hammer Curls", sets: 3, reps: "10-12"},
                    {name: "Face Pulls", sets: 3, reps: "15-20"},
                    {name: "Reverse Flyes", sets: 2, reps: "12-15"}
                ]
            },
            {
                id: 3, name: "Legs", exerciseCount: 6, duration: "50-65 min",
                exercises: [
                    {name: "Squats", sets: 4, reps: "8-12"},
                    {name: "Romanian Deadlifts", sets: 3, reps: "10-12"},
                    {name: "Leg Press", sets: 3, reps: "12-15"},
                    {name: "Leg Curls", sets: 3, reps: "12-15"},
                    {name: "Calf Raises", sets: 4, reps: "15-20"},
                    {name: "Lunges", sets: 3, reps: "10-12 each leg"}
                ]
            },
            {
                id: 4, name: "Full Body", exerciseCount: 10, duration: "60-75 min",
                exercises: [
                    {name: "Deadlifts", sets: 3, reps: "6-8"},
                    {name: "Squats", sets: 3, reps: "8-12"},
                    {name: "Bench Press", sets: 3, reps: "8-12"},
                    {name: "Pull-ups", sets: 3, reps: "8-12"},
                    {name: "Overhead Press", sets: 3, reps: "8-10"},
                    {name: "Barbell Rows", sets: 3, reps: "8-10"},
                    {name: "Dips", sets: 2, reps: "10-15"},
                    {name: "Planks", sets: 3, reps: "30-60 seconds"},
                    {name: "Bicep Curls", sets: 2, reps: "12-15"},
                    {name: "Tricep Extensions", sets: 2, reps: "12-15"}
                ]
            }
        ];

        const grid = document.getElementById('suggested-workouts-grid');
        grid.innerHTML = suggestedWorkouts.map(workout => `
            <div class="workout-card">
                <div class="workout-card-header">
                    <h4 class="workout-name">${workout.name}</h4>
                </div>
                <div class="workout-meta">
                    ${workout.exerciseCount} exercises • ${workout.duration}
                </div>
                <button class="btn btn--primary workout-start-btn" data-workout-id="${workout.id}">
                    Start
                </button>
            </div>
        `).join('');

        // Add event listeners to start buttons
        document.querySelectorAll('.workout-start-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const workoutId = parseInt(e.target.dataset.workoutId);
                const workout = suggestedWorkouts.find(w => w.id === workoutId);
                this.startWorkout(workout);
            });
        });
    }

    // Workout Management
    showWorkoutSelection() {
        this.showModal('workout-selection-modal');
        this.updateWorkoutSelectionModal();
    }

    updateWorkoutSelectionModal() {
        const suggestedWorkouts = [
            {
                id: 1, name: "Chest & Triceps", exerciseCount: 8, duration: "45-60 min",
                exercises: [
                    {name: "Bench Press", sets: 3, reps: "8-12"},
                    {name: "Incline Dumbbell Press", sets: 3, reps: "10-12"},
                    {name: "Chest Flyes", sets: 3, reps: "12-15"},
                    {name: "Dips", sets: 3, reps: "10-15"},
                    {name: "Tricep Pushdowns", sets: 3, reps: "12-15"},
                    {name: "Overhead Tricep Extension", sets: 3, reps: "10-12"},
                    {name: "Close-grip Push-ups", sets: 2, reps: "15-20"},
                    {name: "Diamond Push-ups", sets: 2, reps: "10-15"}
                ]
            },
            {
                id: 2, name: "Back & Biceps", exerciseCount: 7, duration: "40-50 min",
                exercises: [
                    {name: "Pull-ups/Lat Pulldown", sets: 3, reps: "8-12"},
                    {name: "Barbell Rows", sets: 3, reps: "8-10"},
                    {name: "Seated Cable Rows", sets: 3, reps: "10-12"},
                    {name: "Bicep Curls", sets: 3, reps: "12-15"},
                    {name: "Hammer Curls", sets: 3, reps: "10-12"},
                    {name: "Face Pulls", sets: 3, reps: "15-20"},
                    {name: "Reverse Flyes", sets: 2, reps: "12-15"}
                ]
            },
            {
                id: 3, name: "Legs", exerciseCount: 6, duration: "50-65 min",
                exercises: [
                    {name: "Squats", sets: 4, reps: "8-12"},
                    {name: "Romanian Deadlifts", sets: 3, reps: "10-12"},
                    {name: "Leg Press", sets: 3, reps: "12-15"},
                    {name: "Leg Curls", sets: 3, reps: "12-15"},
                    {name: "Calf Raises", sets: 4, reps: "15-20"},
                    {name: "Lunges", sets: 3, reps: "10-12 each leg"}
                ]
            },
            {
                id: 4, name: "Full Body", exerciseCount: 10, duration: "60-75 min",
                exercises: [
                    {name: "Deadlifts", sets: 3, reps: "6-8"},
                    {name: "Squats", sets: 3, reps: "8-12"},
                    {name: "Bench Press", sets: 3, reps: "8-12"},
                    {name: "Pull-ups", sets: 3, reps: "8-12"},
                    {name: "Overhead Press", sets: 3, reps: "8-10"},
                    {name: "Barbell Rows", sets: 3, reps: "8-10"},
                    {name: "Dips", sets: 2, reps: "10-15"},
                    {name: "Planks", sets: 3, reps: "30-60 seconds"},
                    {name: "Bicep Curls", sets: 2, reps: "12-15"},
                    {name: "Tricep Extensions", sets: 2, reps: "12-15"}
                ]
            }
        ];

        const container = document.getElementById('workout-selection-list');
        container.innerHTML = suggestedWorkouts.map(workout => `
            <div class="workout-card">
                <div class="workout-card-header">
                    <h4 class="workout-name">${workout.name}</h4>
                </div>
                <div class="workout-meta">
                    ${workout.exerciseCount} exercises • ${workout.duration}
                </div>
                <button class="btn btn--primary workout-select-btn" data-workout-id="${workout.id}">
                    Start
                </button>
            </div>
        `).join('');

        // Add event listeners
        document.querySelectorAll('.workout-select-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const workoutId = parseInt(e.target.dataset.workoutId);
                const workout = suggestedWorkouts.find(w => w.id === workoutId);
                this.hideModal('workout-selection-modal');
                this.startWorkout(workout);
            });
        });
    }

    startWorkout(workoutTemplate) {
        // Create new workout session
        this.activeWorkoutData = {
            id: Date.now(),
            name: workoutTemplate.name,
            date: new Date().toISOString().split('T')[0],
            exercises: workoutTemplate.exercises.map(exercise => ({
                name: exercise.name,
                targetSets: exercise.sets,
                targetReps: exercise.reps,
                completedSets: [],
                currentSet: 1
            })),
            currentExercise: 0,
            startTime: new Date().toISOString(),
            isCompleted: false,
            isInProgress: true
        };

        // Default timer to 60 seconds for convenience
        this.setTimerDuration(60);
        
        this.showScreen('active-workout');
        this.updateActiveWorkoutUI();
    }

    updateActiveWorkoutUI() {
        if (!this.activeWorkoutData) return;

        const workout = this.activeWorkoutData;
        const currentExercise = workout.exercises[workout.currentExercise];

        // Update workout header
        document.getElementById('active-workout-name').textContent = workout.name;
        document.getElementById('workout-progress').textContent = 
            `Exercise ${workout.currentExercise + 1} of ${workout.exercises.length}`;

        // Update current exercise
        document.getElementById('current-exercise-name').textContent = currentExercise.name;
        document.getElementById('current-set-info').textContent = 
            `Set ${currentExercise.currentSet} of ${currentExercise.targetSets} • ${currentExercise.targetReps} reps`;

        // Clear input fields
        document.getElementById('weight-input').value = '';
        document.getElementById('reps-input').value = '';
    }

    completeSet() {
        if (!this.activeWorkoutData) return;

        const weight = parseFloat(document.getElementById('weight-input').value) || 0;
        const reps = parseInt(document.getElementById('reps-input').value) || 0;

        if (weight === 0 || reps === 0) {
            alert('Please enter weight and reps');
            return;
        }

        const currentExercise = this.activeWorkoutData.exercises[this.activeWorkoutData.currentExercise];
        
        // Add completed set
        currentExercise.completedSets.push({
            setNumber: currentExercise.currentSet,
            weight: weight,
            reps: reps,
            timestamp: new Date().toISOString()
        });

        // Update 1RM and strength metrics
        this.updateStrengthMetrics(currentExercise.name, weight, reps);

        // Move to next set or exercise
        if (currentExercise.currentSet < currentExercise.targetSets) {
            currentExercise.currentSet++;
            this.updateActiveWorkoutUI();
            
            // Auto-start timer
            this.startTimer();
        } else {
            this.nextExercise();
        }
    }

    nextExercise() {
        if (!this.activeWorkoutData) return;

        if (this.activeWorkoutData.currentExercise < this.activeWorkoutData.exercises.length - 1) {
            this.activeWorkoutData.currentExercise++;
            this.updateActiveWorkoutUI();
        } else {
            // Workout complete
            this.finishWorkout();
        }
    }

    finishWorkout() {
        if (!this.activeWorkoutData) return;

        // Calculate workout duration
        const startTime = new Date(this.activeWorkoutData.startTime);
        const endTime = new Date();
        const duration = Math.round((endTime - startTime) / (1000 * 60)); // minutes

        // Finalize workout data
        this.activeWorkoutData.endTime = endTime.toISOString();
        this.activeWorkoutData.totalDuration = duration;
        this.activeWorkoutData.isCompleted = true;
        this.activeWorkoutData.isInProgress = false;

        // Save to workouts
        this.workouts.push(this.activeWorkoutData);
        this.saveData();

        // Check achievements
        this.checkAchievements();

        // Clear active workout
        this.activeWorkoutData = null;

        // Return to home
        this.showScreen('home');
        this.updateUI();

        alert('Workout completed! Great job! 💪');
    }

    // Timer functionality
    setTimerDuration(seconds) {
        if (!seconds || seconds <= 0) {
            seconds = 60; // Default to 60 seconds
        }
        
        this.timerDuration = seconds;
        this.timerRemaining = seconds;
        this.updateTimerDisplay();
        
        // Update button states
        document.querySelectorAll('.timer-btn').forEach(btn => {
            btn.classList.remove('active');
            if (parseInt(btn.dataset.time) === seconds) {
                btn.classList.add('active');
            }
        });
    }

    startTimer() {
        // Stop any existing timer first
        this.stopTimer();
        
        if (this.timerDuration === 0) {
            this.setTimerDuration(60); // Default to 60 seconds
        }
        
        this.isTimerRunning = true;
        this.timerRemaining = this.timerDuration;
        
        this.timer = setInterval(() => {
            this.timerRemaining--;
            this.updateTimerDisplay();
            
            if (this.timerRemaining <= 0) {
                this.stopTimer();
                this.playTimerAlert();
            }
        }, 1000);
    }

    stopTimer() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
        this.isTimerRunning = false;
    }

    updateTimerDisplay() {
        const minutes = Math.floor(this.timerRemaining / 60);
        const seconds = this.timerRemaining % 60;
        const display = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        document.getElementById('timer-text').textContent = display;
    }

    playTimerAlert() {
        // Simple alert for timer completion
        alert('Rest time is over! 🔔');
    }

    // Workouts Screen
    updateWorkoutsScreen() {
        this.filterWorkouts('all');
    }

    setActiveFilterTab(activeTab) {
        document.querySelectorAll('.filter-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        activeTab.classList.add('active');
    }

    filterWorkouts(filter) {
        let filteredWorkouts = [...this.workouts];

        switch (filter) {
            case 'week':
                filteredWorkouts = this.getThisWeekWorkouts();
                break;
            case 'completed':
                filteredWorkouts = this.workouts.filter(w => w.isCompleted);
                break;
            case 'progress':
                filteredWorkouts = this.workouts.filter(w => w.isInProgress);
                break;
        }

        this.displayWorkoutsList(filteredWorkouts);
    }

    displayWorkoutsList(workouts) {
        const container = document.getElementById('workouts-list');
        
        if (workouts.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <p>No workouts found.</p>
                    <button class="btn btn--primary" id="create-workout-btn">Create Workout</button>
                </div>
            `;
            // Re-attach event listener
            document.getElementById('create-workout-btn').addEventListener('click', () => {
                this.showWorkoutSelection();
            });
            return;
        }

        container.innerHTML = workouts.map(workout => `
            <div class="workout-list-item" data-workout-id="${workout.id}">
                <h4>${workout.name}</h4>
                <div class="workout-list-meta">
                    <span>${new Date(workout.date).toLocaleDateString()}</span>
                    <span>${workout.exercises.length} exercises</span>
                    <span>${workout.totalDuration || 0} min</span>
                    <span class="workout-status ${workout.isCompleted ? 'completed' : 'in-progress'}">
                        ${workout.isCompleted ? 'Completed' : 'In Progress'}
                    </span>
                </div>
            </div>
        `).join('');
    }

    // Progress Screen
    updateProgressScreen() {
        this.updateStrengthTab();
        this.updateProgressChart();
        this.updateBodyMeasurements();
    }

    setActiveProgressTab(activeTab) {
        document.querySelectorAll('.progress-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        activeTab.classList.add('active');
    }

    showProgressTab(tabName) {
        document.querySelectorAll('.progress-tab-content').forEach(content => {
            content.classList.remove('active');
        });
        
        if (tabName === 'strength') {
            document.getElementById('strength-tab').classList.add('active');
        } else if (tabName === 'progress') {
            document.getElementById('progress-tab-content').classList.add('active');
            // Re-draw chart when tab becomes visible
            setTimeout(() => {
                this.updateProgressChart();
            }, 100);
        } else if (tabName === 'body') {
            document.getElementById('body-tab').classList.add('active');
        }
    }

    updateStrengthTab() {
        const container = document.getElementById('strength-metrics');
        container.innerHTML = this.strengthMetrics.map(metric => `
            <div class="strength-card">
                <div class="strength-exercise">${metric.exercise}</div>
                <div class="strength-value">${metric.currentMax}kg</div>
                <div class="strength-improvement">+${metric.improvement.toFixed(1)}%</div>
            </div>
        `).join('');
    }

    updateProgressChart() {
        const ctx = document.getElementById('progress-chart').getContext('2d');
        
        // Sample progress data - in a real app this would be based on actual workout data
        const progressData = {
            labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6'],
            datasets: [{
                label: 'Bench Press (1RM)',
                data: [80, 82, 85, 87, 90, 92],
                borderColor: '#007AFF',
                backgroundColor: 'rgba(0, 122, 255, 0.1)',
                tension: 0.4,
                fill: true
            }]
        };

        // Check if chart already exists and destroy it
        if (window.progressChart) {
            window.progressChart.destroy();
        }

        window.progressChart = new Chart(ctx, {
            type: 'line',
            data: progressData,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: {
                            color: '#ffffff'
                        }
                    }
                },
                scales: {
                    x: {
                        ticks: {
                            color: '#ffffff'
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        }
                    },
                    y: {
                        ticks: {
                            color: '#ffffff'
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        }
                    }
                }
            }
        });
        
        // Add personal records
        const prList = document.getElementById('personal-records-list');
        prList.innerHTML = `
            <div class="pr-item">
                <span class="pr-exercise">Bench Press</span>
                <span class="pr-value">92 kg (Jun 1, 2025)</span>
            </div>
            <div class="pr-item">
                <span class="pr-exercise">Deadlift</span>
                <span class="pr-value">140 kg (May 25, 2025)</span>
            </div>
            <div class="pr-item">
                <span class="pr-exercise">Squat</span>
                <span class="pr-value">115 kg (May 28, 2025)</span>
            </div>
        `;
    }

    updateBodyMeasurements() {
        const measurements = ['Chest', 'Shoulders', 'Waist', 'Arms', 'Legs'];
        const container = document.getElementById('body-measurements');
        
        container.innerHTML = measurements.map(part => {
            const current = this.bodyMeasurements[part] || { value: 0, change: 0 };
            return `
                <div class="body-measurement-card">
                    <div class="measurement-part">${part}</div>
                    <div class="measurement-value">${current.value} cm</div>
                    <div class="measurement-change">${current.change >= 0 ? '+' : ''}${current.change} cm</div>
                </div>
            `;
        }).join('');
    }

    saveMeasurement() {
        const type = document.getElementById('measurement-type').value;
        const value = parseFloat(document.getElementById('measurement-value').value);
        
        if (!value || value <= 0) {
            alert('Please enter a valid measurement');
            return;
        }

        const previousValue = this.bodyMeasurements[type]?.value || 0;
        const change = previousValue > 0 ? value - previousValue : 0;

        this.bodyMeasurements[type] = {
            value: value,
            change: change,
            date: new Date().toISOString()
        };

        this.saveData();
        this.hideModal('measurement-modal');
        this.updateBodyMeasurements();
        
        // Clear form
        document.getElementById('measurement-value').value = '';
    }

    // Profile Screen
    updateProfileScreen() {
        // Update profile stats
        const totalWorkouts = this.workouts.filter(w => w.isCompleted).length;
        const totalHours = Math.round(this.workouts.reduce((sum, w) => sum + (w.totalDuration || 0), 0) / 60);
        const personalRecords = this.strengthMetrics.filter(m => m.currentMax > 0).length;

        document.getElementById('profile-workouts').textContent = totalWorkouts;
        document.getElementById('profile-hours').textContent = totalHours;
        document.getElementById('profile-records').textContent = personalRecords;

        // Update achievements
        this.updateAchievements();
    }

    updateAchievements() {
        const container = document.getElementById('achievements-grid');
        container.innerHTML = this.achievements.map(achievement => `
            <div class="achievement-card ${achievement.unlocked ? '' : 'locked'}">
                <div class="achievement-icon">${achievement.icon}</div>
                <div class="achievement-name">${achievement.name}</div>
                <div class="achievement-description">${achievement.description}</div>
            </div>
        `).join('');
    }

    // Utility functions
    getThisWeekWorkouts() {
        const now = new Date();
        // Get Monday of current week
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1));
        startOfWeek.setHours(0, 0, 0, 0);
        
        // Get Sunday of current week
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);
        
        return this.workouts.filter(workout => {
            const workoutDate = new Date(workout.date);
            return workoutDate >= startOfWeek && workoutDate <= endOfWeek;
        });
    }

    updateStrengthMetrics(exerciseName, weight, reps) {
        // Calculate 1RM using Epley formula: 1RM = weight × (1 + reps/30)
        const oneRM = weight * (1 + reps / 30);
        
        const metric = this.strengthMetrics.find(m => 
            exerciseName.toLowerCase().includes(m.exercise.toLowerCase().split(' ')[0])
        );
        
        if (metric) {
            const previousMax = metric.currentMax;
            if (oneRM > metric.currentMax) {
                metric.currentMax = Math.round(oneRM);
                if (previousMax > 0) {
                    metric.improvement = ((oneRM - previousMax) / previousMax) * 100;
                }
            }
        }
        
        this.saveData();
    }

    checkAchievements() {
        const totalWorkouts = this.workouts.filter(w => w.isCompleted).length;
        const maxSquat = this.strengthMetrics.find(m => m.exercise === 'Squat')?.currentMax || 0;
        
        // First Workout
        if (totalWorkouts >= 1 && !this.achievements[0].unlocked) {
            this.achievements[0].unlocked = true;
            this.showAchievementUnlocked(this.achievements[0]);
        }
        
        // 10 Workouts
        if (totalWorkouts >= 10 && !this.achievements[1].unlocked) {
            this.achievements[1].unlocked = true;
            this.showAchievementUnlocked(this.achievements[1]);
        }
        
        // 100kg Squat
        if (maxSquat >= 100 && !this.achievements[2].unlocked) {
            this.achievements[2].unlocked = true;
            this.showAchievementUnlocked(this.achievements[2]);
        }
        
        // Consistent (simplified check)
        const thisWeekWorkouts = this.getThisWeekWorkouts().length;
        if (thisWeekWorkouts >= 3 && !this.achievements[3].unlocked) {
            this.achievements[3].unlocked = true;
            this.showAchievementUnlocked(this.achievements[3]);
        }
        
        this.saveData();
    }

    showAchievementUnlocked(achievement) {
        setTimeout(() => {
            alert(`🏆 Achievement Unlocked: ${achievement.name}!\n${achievement.description}`);
        }, 1000);
    }

    // Modal management
    showModal(modalId) {
        document.getElementById(modalId).classList.add('active');
    }

    hideModal(modalId) {
        document.getElementById(modalId).classList.remove('active');
    }

    // Data export
    exportData() {
        const data = {
            workouts: this.workouts,
            bodyMeasurements: this.bodyMeasurements,
            achievements: this.achievements,
            strengthMetrics: this.strengthMetrics,
            userProfile: this.userProfile,
            exportDate: new Date().toISOString()
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `gym-data-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        alert('Data exported successfully!');
    }

    // Update all UI components
    updateUI() {
        this.updateHomeScreen();
        this.updateWorkoutsScreen();
        this.updateProgressScreen();
        this.updateProfileScreen();
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.fitnessApp = new FitnessApp();
});