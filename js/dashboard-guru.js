// Dashboard Guru JavaScript
let selectedClass = null;
let selectedDate = new Date().toISOString().split('T')[0];
let attendanceData = {};

// Initialize Dashboard
document.addEventListener('DOMContentLoaded', function () {
    initializeDashboard();
});

function initializeDashboard() {
    // Check authentication
    const currentUser = getFromLocalStorage('currentUser');
    if (!currentUser || currentUser.role !== 'guru') {
        window.location.href = 'index.html';
        return;
    }

    // Update user info
    updateUserInfo(currentUser);

    // Update current date/time
    updateDateTime();
    setInterval(updateDateTime, 1000);

    // Set default date
    document.getElementById('dateSelect').value = selectedDate;

    // Load classes
    loadClasses();

    // Load statistics
    loadStatistics();

    // Load weekly recap
    loadWeeklyRecap();

    // Initialize with first tab
    switchTab('classes');
}

function updateUserInfo(user) {
    const userName = user.name || 'Guru';
    document.getElementById('userName').textContent = userName;
    document.getElementById('heroUserName').textContent = userName.split(' ')[0];
}

function updateDateTime() {
    const now = new Date();
    const dateOptions = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    };
    document.getElementById('currentDate').textContent =
        now.toLocaleDateString('id-ID', dateOptions) + ' - Siap untuk mengajar dan mencatat absensi hari ini';
}

// Tab Management
function switchTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });

    // Remove active class from all buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    // Show selected tab
    document.getElementById(`${tabName}-tab`).classList.add('active');
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

    // Load tab-specific content
    if (tabName === 'attendance') {
        loadAttendanceTab();
    } else if (tabName === 'reports') {
        loadReportsTab();
    }
}

// Classes Management
function loadClasses() {
    const classes = getClasses();
    const classesGrid = document.getElementById('classesGrid');
    const classSelect = document.getElementById('classSelect');

    // Clear existing content
    classesGrid.innerHTML = '';
    classSelect.innerHTML = '<option value="">Pilih Kelas</option>';

    // Generate class cards
    classes.forEach(cls => {
        // Add to grid
        const classCard = createClassCard(cls);
        classesGrid.appendChild(classCard);

        // Add to select
        const option = document.createElement('option');
        option.value = cls.id;
        option.textContent = cls.name;
        classSelect.appendChild(option);
    });
}

function createClassCard(cls) {
    const card = document.createElement('div');
    card.className = 'card slide-up';
    card.setAttribute('data-class-id', cls.id);
    card.setAttribute('data-class-name', cls.name.toLowerCase());

    const statusColor = cls.attendance >= 95 ? 'text-green-600' :
        cls.attendance >= 85 ? 'text-blue-600' :
            cls.attendance >= 75 ? 'text-yellow-600' : 'text-red-600';

    card.innerHTML = `
        <div class="card-header">
            <div class="flex items-center justify-between">
                <h4 class="card-title">Kelas ${cls.name}</h4>
                <span class="badge badge-success">${cls.studentCount} Siswa</span>
            </div>
            <p class="card-subtitle">Wali Kelas: ${cls.teacher}</p>
        </div>
        <div class="card-body">
            <div class="space-y-3">
                <div class="flex items-center justify-between">
                    <span class="text-sm text-gray-600">Kehadiran Hari Ini</span>
                    <span class="text-sm font-bold ${statusColor}">${cls.attendance}%</span>
                </div>
                <div class="progress">
                    <div class="progress-bar" style="width: ${cls.attendance}%"></div>
                </div>
                
                <div class="grid grid-cols-2 gap-2 text-center">
                    <div class="p-2 bg-green-50 rounded">
                        <p class="text-xs text-gray-600">Hadir</p>
                        <p class="text-sm font-bold text-green-600">
                            ${Math.floor(cls.studentCount * cls.attendance / 100)}
                        </p>
                    </div>
                    <div class="p-2 bg-red-50 rounded">
                        <p class="text-xs text-gray-600">Tidak Hadir</p>
                        <p class="text-sm font-bold text-red-600">
                            ${cls.studentCount - Math.floor(cls.studentCount * cls.attendance / 100)}
                        </p>
                    </div>
                </div>
            </div>
            
            <button class="btn btn-success w-full mt-4" onclick="selectClassForAttendance('${cls.id}')">
                <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M7 14s-1 0-1-1 1-4 5-4 5 3 5 4-1 1-1 1H7zm4-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/>
                    <path fill-rule="evenodd" d="M5.216 14A2.238 2.238 0 0 1 5 13c0-1.355.68-2.75 1.936-3.72A6.325 6.325 0 0 0 5 9c-4 0-5 3-5 4 0 .667.333 1 1 1h4.216z"/>
                    <path d="M4.5 8a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z"/>
                </svg>
                Input Absensi
            </button>
        </div>
    `;

    return card;
}

function selectClassForAttendance(classId) {
    selectedClass = classId;
    document.getElementById('classSelect').value = classId;

    // Switch to attendance tab
    switchTab('attendance');

    // Load students for this class
    loadClassStudents();
}

function filterClasses() {
    const searchTerm = document.getElementById('classSearch').value.toLowerCase();
    const classCards = document.querySelectorAll('[data-class-id]');

    classCards.forEach(card => {
        const className = card.getAttribute('data-class-name');
        if (className.includes(searchTerm)) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}

// Attendance Management
function loadAttendanceTab() {
    // Set default date if not set
    if (!document.getElementById('dateSelect').value) {
        document.getElementById('dateSelect').value = selectedDate;
    }

    // Load class students if class is selected
    if (selectedClass) {
        loadClassStudents();
    }
}

function loadClassStudents() {
    const classId = document.getElementById('classSelect').value;
    const date = document.getElementById('dateSelect').value;

    if (!classId) {
        document.getElementById('attendanceContent').innerHTML = `
            <div class="text-center py-12">
                <svg width="48" height="48" fill="currentColor" viewBox="0 0 16 16" style="opacity: 0.3;">
                    <path d="M7 14s-1 0-1-1 1-4 5-4 5 3 5 4-1 1-1 1H7zm4-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/>
                    <path fill-rule="evenodd" d="M5.216 14A2.238 2.238 0 0 1 5 13c0-1.355.68-2.75 1.936-3.72A6.325 6.325 0 0 0 5 9c-4 0-5 3-5 4 0 .667.333 1 1 1h4.216z"/>
                    <path d="M4.5 8a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z"/>
                </svg>
                <p class="mt-2 text-gray-500">Pilih kelas untuk mulai input absensi</p>
            </div>
        `;
        return;
    }

    selectedClass = classId;
    selectedDate = date;

    // Get class info
    const classes = getClasses();
    const classInfo = classes.find(c => c.id === classId);

    // Update class info
    document.getElementById('selectedClassInfo').textContent =
        `Kelas ${classInfo.name} - ${classInfo.studentCount} Siswa`;

    // Get students
    const students = getStudentsByClass(classId);

    // Load existing attendance
    loadExistingAttendance(classId, date);

    // Generate student list
    generateStudentList(students);
}

function loadExistingAttendance(classId, date) {
    const attendances = getFromLocalStorage('attendances') || [];
    const todayAttendances = attendances.filter(a => a.date === date);

    attendanceData = {};
    todayAttendances.forEach(att => {
        attendanceData[att.studentId] = att.status;
    });
}

function generateStudentList(students) {
    const content = document.getElementById('attendanceContent');

    let html = `
        <div class="mb-4">
            <div class="flex justify-between items-center mb-3">
                <div class="flex gap-4">
                    <div class="flex items-center">
                        <div class="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                        <span class="text-sm">Hadir</span>
                    </div>
                    <div class="flex items-center">
                        <div class="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                        <span class="text-sm">Izin</span>
                    </div>
                    <div class="flex items-center">
                        <div class="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                        <span class="text-sm">Sakit</span>
                    </div>
                    <div class="flex items-center">
                        <div class="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                        <span class="text-sm">Alpha</span>
                    </div>
                </div>
                <button class="btn btn-success" onclick="saveAttendance()">
                    <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M10.97 4.97a.75.75 0 0 1 1.07 1.05l-3.99 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425a.267.267 0 0 1 .02-.022z"/>
                    </svg>
                    Simpan Absensi
                </button>
            </div>
        </div>
        
        <div class="border rounded-lg max-h-96 overflow-y-auto">
            <table class="table">
                <thead class="bg-gray-50 sticky top-0">
                    <tr>
                        <th>No</th>
                        <th>NIS</th>
                        <th>Nama</th>
                        <th>Check In</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
    `;

    students.forEach((student, index) => {
        const currentStatus = attendanceData[student.id] || 'hadir';
        const checkInTime = currentStatus === 'hadir' ?
            formatTime(new Date(new Date().setHours(7 + Math.floor(Math.random() * 2), Math.floor(Math.random() * 60), 0)).toISOString()) : '-';

        html += `
            <tr>
                <td>${index + 1}</td>
                <td>${student.nis}</td>
                <td>${student.name}</td>
                <td>${checkInTime}</td>
                <td>
                    <select class="form-control form-select" onchange="updateAttendanceStatus('${student.id}', this.value)">
                        <option value="hadir" ${currentStatus === 'hadir' ? 'selected' : ''}>Hadir</option>
                        <option value="izin" ${currentStatus === 'izin' ? 'selected' : ''}>Izin</option>
                        <option value="sakit" ${currentStatus === 'sakit' ? 'selected' : ''}>Sakit</option>
                        <option value="alpha" ${currentStatus === 'alpha' ? 'selected' : ''}>Alpha</option>
                    </select>
                </td>
            </tr>
        `;
    });

    html += `
                </tbody>
            </table>
        </div>
    `;

    content.innerHTML = html;
}

function updateAttendanceStatus(studentId, status) {
    attendanceData[studentId] = status;
}

function saveAttendance() {
    const attendances = getFromLocalStorage('attendances') || [];
    const students = getStudentsByClass(selectedClass);

    students.forEach(student => {
        const status = attendanceData[student.id] || 'hadir';

        // Remove existing attendance for this student and date
        const existingIndex = attendances.findIndex(a =>
            a.studentId === student.id && a.date === selectedDate
        );

        if (existingIndex !== -1) {
            attendances.splice(existingIndex, 1);
        }

        // Add new attendance
        attendances.push({
            id: generateId(),
            studentId: student.id,
            classId: selectedClass,
            date: selectedDate,
            time: new Date().toTimeString().split(' ')[0],
            status: status,
            notes: `Input oleh guru pada ${new Date().toLocaleString('id-ID')}`,
            timestamp: new Date().toISOString()
        });
    });

    // Save to localStorage
    saveToLocalStorage('attendances', attendances);

    // Show success message
    showAlert('Data absensi berhasil disimpan!', 'success');

    // Refresh classes grid to update attendance percentages
    loadClasses();
}

// Reports Management
function loadReportsTab() {
    loadStatistics();
    loadWeeklyRecap();
}

function loadStatistics() {
    const classes = getClasses();
    const today = new Date().toISOString().split('T')[0];
    const attendances = getFromLocalStorage('attendances') || [];
    const todayAttendances = attendances.filter(a => a.date === today);

    // Calculate statistics
    let totalStudents = 0;
    let presentStudents = 0;

    classes.forEach(cls => {
        totalStudents += cls.studentCount;
        presentStudents += Math.floor(cls.studentCount * cls.attendance / 100);
    });

    const absentStudents = totalStudents - presentStudents;
    const percentage = totalStudents > 0 ? Math.round((presentStudents / totalStudents) * 100) : 0;

    // Update statistics
    document.getElementById('totalStudentsStat').textContent = totalStudents.toLocaleString();
    document.getElementById('presentStudentsStat').textContent = presentStudents.toLocaleString();
    document.getElementById('absentStudentsStat').textContent = absentStudents.toLocaleString();
    document.getElementById('attendancePercentageStat').textContent = percentage + '%';

    // Load top classes
    loadTopClasses(classes);
}

function loadTopClasses(classes) {
    const topClassesList = document.getElementById('topClassesList');

    // Sort classes by attendance
    const sortedClasses = [...classes].sort((a, b) => b.attendance - a.attendance).slice(0, 3);

    let html = '';
    sortedClasses.forEach((cls, index) => {
        const medalColor = index === 0 ? 'text-yellow-500' :
            index === 1 ? 'text-gray-400' : 'text-orange-400';

        html += `
            <div class="flex items-center justify-between">
                <div class="flex items-center">
                    <div class="w-6 h-6 bg-${medalColor.includes('yellow') ? 'yellow' : medalColor.includes('gray') ? 'gray' : 'orange'}-100 rounded-full flex items-center justify-center mr-2">
                        <span class="text-xs font-bold ${medalColor}">${index + 1}</span>
                    </div>
                    <span class="text-sm font-medium">${cls.name}</span>
                </div>
                <span class="text-sm font-bold text-green-600">${cls.attendance}%</span>
            </div>
        `;
    });

    topClassesList.innerHTML = html;
}

function loadWeeklyRecap() {
    const recapTable = document.getElementById('weeklyRecapTable');
    const classes = getClasses().slice(0, 10); // Show first 10 classes

    let html = '';
    classes.forEach(cls => {
        const days = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum'];
        let dayPercentages = [];

        // Generate random percentages for demo
        days.forEach(() => {
            dayPercentages.push(85 + Math.floor(Math.random() * 12));
        });

        const average = Math.round(dayPercentages.reduce((a, b) => a + b, 0) / dayPercentages.length);

        html += `
            <tr>
                <td class="font-medium">${cls.name}</td>
                ${dayPercentages.map(pct => `<td class="text-center text-green-600">${pct}%</td>`).join('')}
                <td class="text-center font-bold text-blue-600">${average}%</td>
            </tr>
        `;
    });

    recapTable.innerHTML = html;
}

function generateReport() {
    showAlert('Membuat laporan komprehensif...', 'info');
    setTimeout(() => {
        showAlert('Laporan berhasil dibuat!', 'success');
    }, 2000);
}

function showNotifications() {
    showAlert('Tidak ada notifikasi baru', 'info');
}

// Add tab styles
const tabStyles = `
.tab-navigation {
    margin-bottom: 2rem;
}

.tab-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1.5rem;
    background: transparent;
    border: none;
    border-bottom: 2px solid transparent;
    color: var(--gray-600);
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
}

.tab-btn:hover {
    color: var(--primary-blue);
    background: var(--gray-50);
}

.tab-btn.active {
    color: var(--primary-blue);
    border-bottom-color: var(--primary-blue);
    background: var(--blue-50);
}

.tab-content {
    display: none;
}

.tab-content.active {
    display: block;
    animation: fadeIn 0.3s ease-in;
}

@media (max-width: 640px) {
    .tab-btn {
        padding: 0.5rem 1rem;
        font-size: 0.875rem;
    }
    
    .tab-btn svg {
        width: 14px;
        height: 14px;
    }
}
`;

// Inject tab styles
const styleSheet = document.createElement('style');
styleSheet.textContent = tabStyles;
document.head.appendChild(styleSheet);