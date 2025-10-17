// Dashboard Siswa JavaScript
let todayAttendance = {
    checkIn: null,
    checkOut: null
};

// Initialize Dashboard
document.addEventListener('DOMContentLoaded', function () {
    initializeDashboard();
});

function initializeDashboard() {
    // Check authentication
    const currentUser = getFromLocalStorage('currentUser');
    if (!currentUser || currentUser.role !== 'siswa') {
        window.location.href = 'index.html';
        return;
    }

    // Update user info
    updateUserInfo(currentUser);

    // Update current date/time
    updateDateTime();
    setInterval(updateDateTime, 1000);

    // Load today's attendance
    loadTodayAttendance();

    // Load attendance statistics
    loadAttendanceStats();

    // Generate calendar
    generateCalendar();

    // Load attendance history
    loadAttendanceHistory();

    // Update every minute for real-time feel
    setInterval(loadTodayAttendance, 60000);
}

function updateUserInfo(user) {
    const userName = user.name || 'Siswa';
    document.getElementById('userName').textContent = userName;
    document.getElementById('heroUserName').textContent = userName.split(' ')[0];
}

function updateDateTime() {
    const now = new Date();

    // Update current date
    const dateOptions = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    };
    document.getElementById('currentDate').textContent =
        now.toLocaleDateString('id-ID', dateOptions) + ' - Jangan lupa absen ya!';

    // Update attendance date
    document.getElementById('attendanceDate').textContent =
        now.toLocaleDateString('id-ID', dateOptions);

    // Update current month
    const monthOptions = { month: 'long', year: 'numeric' };
    document.getElementById('currentMonth').textContent =
        now.toLocaleDateString('id-ID', monthOptions);
}

function loadTodayAttendance() {
    const today = new Date().toISOString().split('T')[0];
    const attendances = getFromLocalStorage('attendances') || [];
    const currentUser = getFromLocalStorage('currentUser');

    const todayAttendanceRecord = attendances.find(a =>
        a.studentId === currentUser.id && a.date === today
    );

    if (todayAttendanceRecord) {
        todayAttendance.checkIn = todayAttendanceRecord.checkIn;
        todayAttendance.checkOut = todayAttendanceRecord.checkOut;
        updateAttendanceDisplay();
    }
}

function updateAttendanceDisplay() {
    const checkInTimeEl = document.getElementById('checkInTime');
    const checkOutTimeEl = document.getElementById('checkOutTime');
    const checkInBtn = document.getElementById('checkInBtn');
    const checkOutBtn = document.getElementById('checkOutBtn');

    if (todayAttendance.checkIn) {
        checkInTimeEl.textContent = formatTime(todayAttendance.checkIn);
        checkInBtn.disabled = true;
        checkInBtn.innerHTML = `
            <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z"/>
            </svg>
            Sudah Absen Masuk
        `;
    }

    if (todayAttendance.checkOut) {
        checkOutTimeEl.textContent = formatTime(todayAttendance.checkOut);
        checkOutBtn.disabled = true;
        checkOutBtn.innerHTML = `
            <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z"/>
            </svg>
            Sudah Absen Pulang
        `;
    } else if (todayAttendance.checkIn) {
        checkOutBtn.disabled = false;
    }
}

function checkIn() {
    const currentUser = getFromLocalStorage('currentUser');
    const now = new Date();

    // Show loading
    const checkInBtn = document.getElementById('checkInBtn');
    const originalText = checkInBtn.innerHTML;
    checkInBtn.disabled = true;
    checkInBtn.innerHTML = '<div class="spinner"></div> Memproses...';

    // Simulate API call
    setTimeout(() => {
        const attendance = recordAttendance(currentUser.id, 'hadir', 'Absen masuk tepat waktu');
        todayAttendance.checkIn = attendance.checkIn;

        updateAttendanceDisplay();

        showAlert('Absen masuk berhasil!', 'success');

        // Refresh calendar and history
        generateCalendar();
        loadAttendanceHistory();
    }, 1000);
}

function checkOut() {
    const currentUser = getFromLocalStorage('currentUser');
    const now = new Date();

    // Show loading
    const checkOutBtn = document.getElementById('checkOutBtn');
    const originalText = checkOutBtn.innerHTML;
    checkOutBtn.disabled = true;
    checkOutBtn.innerHTML = '<div class="spinner"></div> Memproses...';

    // Simulate API call
    setTimeout(() => {
        const attendances = getFromLocalStorage('attendances') || [];
        const today = new Date().toISOString().split('T')[0];

        // Find today's attendance and update it
        const todayIndex = attendances.findIndex(a =>
            a.studentId === currentUser.id && a.date === today
        );

        if (todayIndex !== -1) {
            attendances[todayIndex].checkOut = now.toISOString();
            attendances[todayIndex].notes = 'Absen pulang tepat waktu';
            saveToLocalStorage('attendances', attendances);
        }

        todayAttendance.checkOut = now.toISOString();

        updateAttendanceDisplay();

        showAlert('Absen pulang berhasil!', 'success');

        // Refresh calendar and history
        generateCalendar();
        loadAttendanceHistory();
    }, 1000);
}

function loadAttendanceStats() {
    const currentUser = getFromLocalStorage('currentUser');
    const now = new Date();
    const stats = getAttendanceStats(currentUser.id, now.getMonth(), now.getFullYear());

    // Update percentage and progress
    document.getElementById('hadirPercentage').textContent = stats.percentage + '%';
    document.getElementById('hadirProgress').style.width = stats.percentage + '%';

    // Update counts
    document.getElementById('izinCount').textContent = stats.izin;
    document.getElementById('sakitCount').textContent = stats.sakit;
    document.getElementById('alphaCount').textContent = stats.alpha;

    // Update attendance level
    let level = 'Perlu Perbaikan';
    if (stats.percentage >= 95) level = 'Sangat Baik';
    else if (stats.percentage >= 90) level = 'Baik';
    else if (stats.percentage >= 80) level = 'Cukup';

    document.getElementById('attendanceLevel').textContent = level;
}

function generateCalendar() {
    const calendarEl = document.getElementById('calendar');
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const today = now.getDate();

    // Get first day of month and number of days
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Get attendance data
    const currentUser = getFromLocalStorage('currentUser');
    const attendances = getFromLocalStorage('attendances') || [];
    const monthAttendances = attendances.filter(a => {
        const date = new Date(a.date);
        return a.studentId === currentUser.id &&
            date.getMonth() === month &&
            date.getFullYear() === year;
    });

    // Create calendar HTML
    let calendarHTML = `
        <div class="calendar-header">
            <h4>${now.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}</h4>
        </div>
        <div class="calendar-grid">
            <div class="calendar-weekdays">
                <div>Min</div>
                <div>Sen</div>
                <div>Sel</div>
                <div>Rab</div>
                <div>Kam</div>
                <div>Jum</div>
                <div>Sab</div>
            </div>
            <div class="calendar-days">
    `;

    // Add empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
        calendarHTML += '<div class="calendar-day empty"></div>';
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const attendance = monthAttendances.find(a => a.date === dateStr);

        let statusClass = '';
        let statusIndicator = '';

        if (attendance) {
            statusClass = ` status-${attendance.status}`;
            statusIndicator = `<div class="status-indicator ${attendance.status}"></div>`;
        }

        const isToday = day === today ? ' today' : '';
        const isWeekend = new Date(year, month, day).getDay() === 0 ||
            new Date(year, month, day).getDay() === 6 ? ' weekend' : '';

        calendarHTML += `
            <div class="calendar-day${isToday}${isWeekend}${statusClass}">
                <div class="day-number">${day}</div>
                ${statusIndicator}
            </div>
        `;
    }

    calendarHTML += `
            </div>
        </div>
    `;

    calendarEl.innerHTML = calendarHTML;
}

function loadAttendanceHistory() {
    const historyEl = document.getElementById('attendanceHistory');
    const currentUser = getFromLocalStorage('currentUser');
    const history = getAttendanceHistory(currentUser.id, 5);

    if (history.length === 0) {
        historyEl.innerHTML = `
            <div class="text-center py-8 text-gray-500">
                <svg width="48" height="48" fill="currentColor" viewBox="0 0 16 16" style="opacity: 0.3;">
                    <path d="M2 2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v13.5a.5.5 0 0 1-.777.416L8 13.101l-5.223 2.815A.5.5 0 0 1 2 15.5V2zm2-1a1 1 0 0 0-1 1v12.566l4.723-2.482a.5.5 0 0 1 .554 0L13 14.566V2a1 1 0 0 0-1-1H4z"/>
                </svg>
                <p class="mt-2">Belum ada riwayat absensi</p>
            </div>
        `;
        return;
    }

    let historyHTML = '';
    history.forEach(record => {
        const statusColor = getStatusColor(record.status);
        const statusIcon = getStatusIcon(record.status);
        const date = new Date(record.date);
        const checkInText = record.checkIn ? formatTime(record.checkIn) : null;
        const checkOutText = record.checkOut ? formatTime(record.checkOut) : null;

        historyHTML += `
            <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div class="flex items-center space-x-3">
                    <div class="p-2 rounded-full ${statusColor}">
                        ${statusIcon}
                    </div>
                    <div>
                        <p class="text-sm font-medium text-gray-900">
                            ${date.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}
                        </p>
                        <p class="text-xs text-gray-500">
                            ${checkInText ? `Masuk: ${checkInText}` : 'Tidak hadir'} • 
                            ${checkOutText ? `Pulang: ${checkOutText}` : ''}
                        </p>
                    </div>
                </div>
                <span class="badge ${statusColor}">
                    ${record.status.toUpperCase()}
                </span>
            </div>
        `;
    });

    historyEl.innerHTML = historyHTML;
}

function getStatusColor(status) {
    switch (status) {
        case 'hadir': return 'bg-green-100 text-green-800';
        case 'izin': return 'bg-blue-100 text-blue-800';
        case 'sakit': return 'bg-yellow-100 text-yellow-800';
        case 'alpha': return 'bg-red-100 text-red-800';
        default: return 'bg-gray-100 text-gray-800';
    }
}

function getStatusIcon(status) {
    switch (status) {
        case 'hadir': return `
            <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z"/>
            </svg>
        `;
        case 'izin': return `
            <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                <path d="M5.255 5.786a.237.237 0 0 0 .241.247h.825c.138 0 .248-.113.266-.25.09-.656.54-1.134 1.342-1.134.686 0 1.314.343 1.314 1.168 0 .635-.374.927-.965 1.371-.673.489-1.206 1.06-1.168 1.987l.003.217a.25.25 0 0 0 .25.246h.811a.25.25 0 0 0 .25-.25v-.105c0-.718.273-.927 1.01-1.486.609-.463 1.244-.977 1.244-2.056 0-1.511-1.276-2.241-2.673-2.241-1.267 0-2.655.59-2.75 2.286zm1.557 5.763c0 .533.425.927 1.01.927.609 0 1.028-.394 1.028-.927 0-.552-.42-.94-1.029-.94-.584 0-1.009.388-1.009.94z"/>
            </svg>
        `;
        case 'sakit': return `
            <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                <path d="M5.255 5.786a.237.237 0 0 0 .241.247h.825c.138 0 .248-.113.266-.25.09-.656.54-1.134 1.342-1.134.686 0 1.314.343 1.314 1.168 0 .635-.374.927-.965 1.371-.673.489-1.206 1.06-1.168 1.987l.003.217a.25.25 0 0 0 .25.246h.811a.25.25 0 0 0 .25-.25v-.105c0-.718.273-.927 1.01-1.486.609-.463 1.244-.977 1.244-2.056 0-1.511-1.276-2.241-2.673-2.241-1.267 0-2.655.59-2.75 2.286zm1.557 5.763c0 .533.425.927 1.01.927.609 0 1.028-.394 1.028-.927 0-.552-.42-.94-1.029-.94-.584 0-1.009.388-1.009.94z"/>
            </svg>
        `;
        case 'alpha': return `
            <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM5.354 4.646a.5.5 0 1 0-.708.708L7.293 8l-2.647 2.646a.5.5 0 0 0 .708.708L8 8.707l2.646 2.647a.5.5 0 0 0 .708-.708L8.707 8l2.647-2.646a.5.5 0 0 0-.708-.708L8 7.293 5.354 4.646z"/>
            </svg>
        `;
        default: return '';
    }
}

function showNotifications() {
    showAlert('Tidak ada notifikasi baru', 'info');
}

// Add calendar styles
const calendarStyles = `
.calendar-container {
    font-family: var(--font-sans);
}

.calendar-header {
    text-align: center;
    margin-bottom: 1rem;
}

.calendar-header h4 {
    margin: 0;
    color: var(--gray-900);
    font-weight: 600;
}

.calendar-grid {
    border: 1px solid var(--gray-200);
    border-radius: var(--radius-md);
    overflow: hidden;
}

.calendar-weekdays {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    background: var(--gray-50);
}

.calendar-weekdays > div {
    padding: 0.5rem;
    text-align: center;
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--gray-600);
    border-right: 1px solid var(--gray-200);
}

.calendar-weekdays > div:last-child {
    border-right: none;
}

.calendar-days {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
}

.calendar-day {
    min-height: 3rem;
    border-right: 1px solid var(--gray-200);
    border-top: 1px solid var(--gray-200);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    position: relative;
    cursor: pointer;
    transition: background-color 0.2s;
}

.calendar-day:nth-child(7n) {
    border-right: none;
}

.calendar-day:hover {
    background: var(--gray-50);
}

.calendar-day.today {
    background: var(--blue-50);
}

.calendar-day.today .day-number {
    font-weight: 700;
    color: var(--primary-blue);
}

.calendar-day.weekend {
    background: var(--gray-50);
}

.calendar-day.empty {
    cursor: default;
}

.calendar-day.empty:hover {
    background: transparent;
}

.day-number {
    font-size: 0.875rem;
    color: var(--gray-700);
}

.status-indicator {
    position: absolute;
    bottom: 2px;
    width: 6px;
    height: 6px;
    border-radius: 50%;
}

.status-indicator.hadir {
    background: var(--success);
}

.status-indicator.izin {
    background: var(--info);
}

.status-indicator.sakit {
    background: var(--warning);
}

.status-indicator.alpha {
    background: var(--error);
}

.calendar-day.status-hadir {
    background: rgba(34, 197, 94, 0.1);
}

.calendar-day.status-izin {
    background: rgba(59, 130, 246, 0.1);
}

.calendar-day.status-sakit {
    background: rgba(245, 158, 11, 0.1);
}

.calendar-day.status-alpha {
    background: rgba(239, 68, 68, 0.1);
}
`;

// Inject calendar styles
const styleSheet = document.createElement('style');
styleSheet.textContent = calendarStyles;
document.head.appendChild(styleSheet);