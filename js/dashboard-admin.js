// Dashboard Admin JavaScript
let currentTab = 'overview';

// Initialize Dashboard
document.addEventListener('DOMContentLoaded', function() {
    initializeDashboard();
});

function initializeDashboard() {
    // Check authentication
    const currentUser = getFromLocalStorage('currentUser');
    if (!currentUser || currentUser.role !== 'admin') {
        window.location.href = 'index.html';
        return;
    }

    // Update user info
    updateUserInfo(currentUser);
    
    // Update current date/time
    updateDateTime();
    setInterval(updateDateTime, 1000);
    
    // Load statistics
    loadStatistics();
    
    // Initialize with first tab
    switchTab('overview');
}

function updateUserInfo(user) {
    const userName = user.name || 'Admin';
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
        now.toLocaleDateString('id-ID', dateOptions) + ' - Sistem absensi berjalan normal';
    
    // Update last update time
    document.getElementById('lastUpdate').textContent = now.toLocaleString('id-ID');
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
    
    currentTab = tabName;
    
    // Load tab-specific content
    switch(tabName) {
        case 'overview':
            loadOverviewTab();
            break;
        case 'analytics':
            loadAnalyticsTab();
            break;
        case 'classes':
            loadClassesTab();
            break;
        case 'reports':
            loadReportsTab();
            break;
        case 'export':
            loadExportTab();
            break;
    }
}

// Statistics Management
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
    
    // Update statistics cards
    document.getElementById('totalStudentsCard').textContent = totalStudents.toLocaleString();
    document.getElementById('todayAttendanceCard').textContent = percentage + '%';
    document.getElementById('attendanceDetailsCard').textContent = `${presentStudents} hadir, ${absentStudents} tidak hadir`;
}

// Overview Tab
function loadOverviewTab() {
    loadAttendanceTrends();
    loadTopClasses();
}

function loadAttendanceTrends() {
    const trendsEl = document.getElementById('attendanceTrends');
    const days = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum'];
    
    let html = '';
    days.forEach(day => {
        const percentage = 85 + Math.floor(Math.random() * 12);
        const present = 900 + Math.floor(Math.random() * 100);
        const absent = 100 + Math.floor(Math.random() * 50);
        
        html += `
            <div class="flex items-center justify-between">
                <div class="flex items-center space-x-3">
                    <span class="text-sm font-medium w-8">${day}</span>
                    <div class="flex-1 max-w-xs">
                        <div class="progress">
                            <div class="progress-bar" style="width: ${percentage}%"></div>
                        </div>
                    </div>
                </div>
                <div class="text-right">
                    <span class="text-sm font-bold text-gray-900">${percentage}%</span>
                    <p class="text-xs text-gray-500">${present}/${present + absent}</p>
                </div>
            </div>
        `;
    });
    
    trendsEl.innerHTML = html;
}

function loadTopClasses() {
    const topClassesEl = document.getElementById('topClasses');
    const classes = getClasses();
    
    // Sort classes by attendance and get top 3
    const topClasses = [...classes].sort((a, b) => b.attendance - a.attendance).slice(0, 3);
    
    let html = '';
    topClasses.forEach((cls, index) => {
        const medalColor = index === 0 ? 'bg-yellow-500' : 
                          index === 1 ? 'bg-gray-400' : 'bg-orange-400';
        
        html += `
            <div class="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div class="flex items-center space-x-3">
                    <div class="w-8 h-8 ${medalColor} rounded-full flex items-center justify-center">
                        <span class="text-white font-bold text-sm">${index + 1}</span>
                    </div>
                    <div>
                        <p class="font-medium text-gray-900">${cls.name}</p>
                        <p class="text-sm text-gray-500">${cls.students} siswa</p>
                    </div>
                </div>
                <div class="text-right">
                    <span class="text-lg font-bold text-green-600">${cls.attendance}%</span>
                </div>
            </div>
        `;
    });
    
    topClassesEl.innerHTML = html;
}

// Analytics Tab
function loadAnalyticsTab() {
    loadGradeDistribution();
    loadAttendanceAnalysis();
}

function loadGradeDistribution() {
    const distributionEl = document.getElementById('gradeDistribution');
    const classes = getClasses();
    const grades = ['X', 'XI', 'XII'];
    
    let html = '';
    grades.forEach(grade => {
        const gradeClasses = classes.filter(cls => cls.grade === grade);
        const avgAttendance = Math.round(gradeClasses.reduce((sum, cls) => sum + cls.attendance, 0) / gradeClasses.length);
        const totalStudents = gradeClasses.reduce((sum, cls) => sum + cls.studentCount, 0);
        
        html += `
            <div class="p-4 bg-gray-50 rounded-lg">
                <div class="flex justify-between items-center mb-2">
                    <h4 class="font-medium text-gray-900">Kelas ${grade}</h4>
                    <span class="text-sm font-bold text-blue-600">${avgAttendance}%</span>
                </div>
                <div class="progress mb-2">
                    <div class="progress-bar" style="width: ${avgAttendance}%"></div>
                </div>
                <p class="text-xs text-gray-500">${totalStudents} siswa • ${gradeClasses.length} kelas</p>
            </div>
        `;
    });
    
    distributionEl.innerHTML = html;
}

function loadAttendanceAnalysis() {
    const analysisEl = document.getElementById('attendanceAnalysis');
    
    // Sample data for analysis
    const stats = {
        total: 18900,
        hadir: 16545,
        izin: 1512,
        sakit: 756,
        alpha: 378
    };
    
    stats.percentage = Math.round((stats.hadir / stats.total) * 100);
    
    let html = `
        <div class="grid grid-cols-2 gap-4 mb-4">
            <div class="p-4 bg-green-50 rounded-lg text-center">
                <svg width="32" height="32" fill="#22c55e" class="mx-auto mb-2" viewBox="0 0 16 16">
                    <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z"/>
                </svg>
                <p class="text-2xl font-bold text-green-600">${stats.percentage}%</p>
                <p class="text-sm text-gray-600">Rata-rata Hadir</p>
            </div>
            <div class="p-4 bg-red-50 rounded-lg text-center">
                <svg width="32" height="32" fill="#ef4444" class="mx-auto mb-2" viewBox="0 0 16 16">
                    <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM5.354 4.646a.5.5 0 1 0-.708.708L7.293 8l-2.647 2.646a.5.5 0 0 0 .708.708L8 8.707l2.646 2.647a.5.5 0 0 0 .708-.708L8.707 8l2.647-2.646a.5.5 0 0 0-.708-.708L8 7.293 5.354 4.646z"/>
                </svg>
                <p class="text-2xl font-bold text-red-600">${stats.total - stats.hadir}</p>
                <p class="text-sm text-gray-600">Tidak Hadir</p>
            </div>
        </div>
        
        <div class="space-y-2">
            <div class="flex justify-between items-center">
                <span class="text-sm text-gray-600">Hadir</span>
                <span class="text-sm font-bold text-green-600">${stats.hadir.toLocaleString()}</span>
            </div>
            <div class="flex justify-between items-center">
                <span class="text-sm text-gray-600">Izin</span>
                <span class="text-sm font-bold text-blue-600">${stats.izin.toLocaleString()}</span>
            </div>
            <div class="flex justify-between items-center">
                <span class="text-sm text-gray-600">Sakit</span>
                <span class="text-sm font-bold text-yellow-600">${stats.sakit.toLocaleString()}</span>
            </div>
            <div class="flex justify-between items-center">
                <span class="text-sm text-gray-600">Alpha</span>
                <span class="text-sm font-bold text-red-600">${stats.alpha.toLocaleString()}</span>
            </div>
        </div>
    `;
    
    analysisEl.innerHTML = html;
}

// Classes Tab
function loadClassesTab() {
    loadClassesTable();
}

function loadClassesTable() {
    const tableEl = document.getElementById('classesTable');
    const classes = getClasses();
    
    // Sort classes by attendance
    const sortedClasses = [...classes].sort((a, b) => b.attendance - a.attendance);
    
    let html = '';
    sortedClasses.forEach((cls, index) => {
        const rank = index + 1;
        const statusColor = cls.attendance >= 95 ? 'bg-green-100 text-green-800' : 
                           cls.attendance >= 85 ? 'bg-blue-100 text-blue-800' : 
                           cls.attendance >= 75 ? 'bg-yellow-100 text-yellow-800' : 
                           'bg-red-100 text-red-800';
        
        const statusText = cls.attendance >= 95 ? 'Sangat Baik' : 
                          cls.attendance >= 85 ? 'Baik' : 
                          cls.attendance >= 75 ? 'Cukup' : 'Perlu Perhatian';
        
        html += `
            <tr>
                <td>
                    <div class="flex items-center">
                        ${rank <= 3 ? `
                            <div class="w-6 h-6 ${rank === 1 ? 'bg-yellow-500' : rank === 2 ? 'bg-gray-400' : 'bg-orange-400'} rounded-full flex items-center justify-center mr-2">
                                <span class="text-white text-xs font-bold">${rank}</span>
                            </div>
                        ` : ''}
                        <span class="text-sm text-gray-900">#${rank}</span>
                    </div>
                </td>
                <td class="text-sm font-medium text-gray-900">${cls.name}</td>
                <td class="text-sm text-gray-900">${cls.teacher}</td>
                <td class="text-sm text-gray-900">${cls.studentCount}</td>
                <td>
                    <div class="flex items-center">
                        <span class="text-sm font-bold text-gray-900 mr-2">${cls.attendance}%</span>
                        <div class="w-16">
                            <div class="progress">
                                <div class="progress-bar" style="width: ${cls.attendance}%"></div>
                            </div>
                        </div>
                    </div>
                </td>
                <td>
                    <span class="badge ${statusColor}">${statusText}</span>
                </td>
            </tr>
        `;
    });
    
    tableEl.innerHTML = html;
}

function filterClasses() {
    const gradeFilter = document.getElementById('gradeFilter').value;
    const searchTerm = document.getElementById('classSearch').value.toLowerCase();
    const rows = document.querySelectorAll('#classesTable tr');
    
    rows.forEach(row => {
        const className = row.cells[1]?.textContent.toLowerCase() || '';
        const classGrade = row.cells[1]?.textContent.split(' ')[0] || '';
        
        const matchesGrade = gradeFilter === 'all' || classGrade === gradeFilter;
        const matchesSearch = className.includes(searchTerm);
        
        row.style.display = matchesGrade && matchesSearch ? '' : 'none';
    });
}

// Reports Tab
function loadReportsTab() {
    // Reports tab content is static, no dynamic loading needed
}

function generateDailyReport() {
    showAlert('Menghasilkan laporan harian...', 'info');
    setTimeout(() => {
        showAlert('Laporan harian berhasil dibuat!', 'success');
    }, 2000);
}

// Export Tab
function loadExportTab() {
    // Export tab content is static, no dynamic loading needed
}

function exportToPDF() {
    showAlert('Mengekspor laporan lengkap ke PDF...', 'info');
    setTimeout(() => {
        showAlert('Export PDF berhasil!', 'success');
    }, 2000);
}

function exportToExcel() {
    showAlert('Mengekspor data absensi ke Excel...', 'info');
    setTimeout(() => {
        showAlert('Export Excel berhasil!', 'success');
    }, 2000);
}

function exportAttendanceData() {
    showAlert('Mengekspor data absensi...', 'info');
    setTimeout(() => {
        showAlert('Export data absensi berhasil!', 'success');
    }, 2000);
}

function generateReport() {
    showAlert('Membuat laporan komprehensif...', 'info');
    setTimeout(() => {
        showAlert('Laporan komprehensif berhasil dibuat!', 'success');
    }, 2000);
}

function backupData() {
    showAlert('Membuat backup data...', 'info');
    setTimeout(() => {
        showAlert('Backup data berhasil dibuat!', 'success');
    }, 2000);
}

function showNotifications() {
    showAlert('Tidak ada notifikasi baru', 'info');
}

// Add tab styles (same as guru dashboard)
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