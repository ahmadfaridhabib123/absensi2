// Global Variables
let currentUser = null;
let currentRole = null;

// Initialize App
document.addEventListener('DOMContentLoaded', function () {
    initializeApp();
});

function initializeApp() {
    // Check if user is already logged in
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        currentRole = currentUser.role;
        redirectToDashboard(currentRole);
    }

    // Add smooth scrolling
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });
}

// Role Selection
function selectRole(role) {
    currentRole = role;

    // Show loading animation
    showLoading();

    // Simulate authentication delay
    setTimeout(() => {
        hideLoading();

        // Create user object
        currentUser = {
            id: generateId(),
            role: role,
            name: getDefaultName(role),
            email: getDefaultEmail(role),
            loginTime: new Date().toISOString()
        };

        // Save to localStorage
        localStorage.setItem('currentUser', JSON.stringify(currentUser));

        // Redirect to appropriate dashboard
        redirectToDashboard(role);
    }, 1500);
}

function getDefaultName(role) {
    const names = {
        siswa: 'Ahmad Rizki',
        guru: 'Budi Santoso, S.Pd',
        admin: 'Dr. Ahmad Wijaya, M.Pd'
    };
    return names[role] || 'User';
}

function getDefaultEmail(role) {
    const emails = {
        siswa: 'ahmad.rizki@sman-gurah.sch.id',
        guru: 'budi.santoso@sman-gurah.sch.id',
        admin: 'ahmad.wijaya@sman-gurah.sch.id'
    };
    return emails[role] || 'user@sman-gurah.sch.id';
}

function redirectToDashboard(role) {
    const dashboards = {
        siswa: 'dashboard-siswa.html',
        guru: 'dashboard-guru.html',
        admin: 'dashboard-admin.html'
    };

    const dashboardFile = dashboards[role];
    if (dashboardFile) {
        window.location.href = dashboardFile;
    }
}

// Loading Functions
function showLoading() {
    const loadingDiv = document.createElement('div');
    loadingDiv.id = 'loadingOverlay';
    loadingDiv.className = 'loading-overlay';
    loadingDiv.innerHTML = `
        <div class="loading-spinner">
            <div class="spinner"></div>
            <p>Sedang memuat...</p>
        </div>
    `;
    document.body.appendChild(loadingDiv);
}

function hideLoading() {
    const loadingDiv = document.getElementById('loadingOverlay');
    if (loadingDiv) {
        loadingDiv.remove();
    }
}

// Modal Functions
function showHelp() {
    document.getElementById('helpModal').style.display = 'block';
    document.body.style.overflow = 'hidden';
}

function showSettings() {
    document.getElementById('settingsModal').style.display = 'block';
    document.body.style.overflow = 'hidden';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
    document.body.style.overflow = 'auto';
}

// Close modal when clicking outside
window.onclick = function (event) {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

// Utility Functions
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function formatDate(date) {
    const options = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    };
    return new Date(date).toLocaleDateString('id-ID', options);
}

function formatTime(date) {
    return new Date(date).toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

function showAlert(message, type = 'info') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" onclick="this.parentElement.remove()"></button>
    `;

    // Insert at the top of the container
    const container = document.querySelector('.container');
    if (container) {
        container.insertBefore(alertDiv, container.firstChild);
    }

    // Auto remove after 5 seconds
    setTimeout(() => {
        if (alertDiv.parentElement) {
            alertDiv.remove();
        }
    }, 5000);
}

// Storage Functions
function saveToLocalStorage(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
        return true;
    } catch (error) {
        console.error('Error saving to localStorage:', error);
        return false;
    }
}

function getFromLocalStorage(key) {
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : null;
    } catch (error) {
        console.error('Error reading from localStorage:', error);
        return null;
    }
}

function removeFromLocalStorage(key) {
    try {
        localStorage.removeItem(key);
        return true;
    } catch (error) {
        console.error('Error removing from localStorage:', error);
        return false;
    }
}

// Attendance Functions
function recordAttendance(studentId, status, notes = '') {
    const now = new Date();
    const attendance = {
        id: generateId(),
        studentId: studentId,
        date: now.toISOString().split('T')[0],
        checkIn: now.toISOString(),
        checkOut: null,
        status: status,
        notes: notes,
        timestamp: now.toISOString()
    };

    // Get existing attendance records
    let attendances = getFromLocalStorage('attendances') || [];
    attendances.push(attendance);

    // Save to localStorage
    saveToLocalStorage('attendances', attendances);

    return attendance;
}

function getAttendanceHistory(studentId, days = 7) {
    const attendances = getFromLocalStorage('attendances') || [];
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    return attendances
        .filter(a => a.studentId === studentId && new Date(a.date) >= cutoffDate)
        .sort((a, b) => new Date(b.date) - new Date(a.date));
}

function getAttendanceStats(studentId, month = new Date().getMonth(), year = new Date().getFullYear()) {
    const attendances = getFromLocalStorage('attendances') || [];
    const monthAttendances = attendances.filter(a => {
        const date = new Date(a.date);
        return a.studentId === studentId &&
            date.getMonth() === month &&
            date.getFullYear() === year;
    });

    const stats = {
        total: monthAttendances.length,
        hadir: monthAttendances.filter(a => a.status === 'hadir').length,
        izin: monthAttendances.filter(a => a.status === 'izin').length,
        sakit: monthAttendances.filter(a => a.status === 'sakit').length,
        alpha: monthAttendances.filter(a => a.status === 'alpha').length
    };

    stats.percentage = stats.total > 0 ? Math.round((stats.hadir / stats.total) * 100) : 0;

    return stats;
}

// Class Management Functions
function getClasses() {
    return getFromLocalStorage('classes') || generateDefaultClasses();
}

function generateDefaultClasses() {
    const classes = [];
    const grades = ['X', 'XI', 'XII'];

    grades.forEach(grade => {
        for (let i = 1; i <= 10; i++) {
            classes.push({
                id: `${grade}-${i}`,
                name: `${grade} ${i}`,
                grade: grade,
                program: i <= 5 ? 'IPA' : 'IPS',
                studentCount: 32 + Math.floor(Math.random() * 8),
                teacher: `Guru ${grade} ${i}`,
                attendance: 75 + Math.floor(Math.random() * 20)
            });
        }
    });

    saveToLocalStorage('classes', classes);
    return classes;
}

function getStudentsByClass(classId) {
    const students = getFromLocalStorage('students') || generateDefaultStudents();
    return students.filter(student => student.className === classId);
}

function generateDefaultStudents() {
    const students = [];
    const classes = getClasses();
    let studentId = 1;

    classes.forEach(cls => {
        for (let i = 1; i <= cls.studentCount; i++) {
            students.push({
                id: `student-${studentId}`,
                name: `Siswa ${studentId.toString().padStart(3, '0')}`,
                nis: `2024${cls.grade}${cls.program}${i.toString().padStart(3, '0')}`,
                className: cls.name,
                email: `siswa${studentId}@sman-gurah.sch.id`
            });
            studentId++;
        }
    });

    saveToLocalStorage('students', students);
    return students;
}

// Export Functions
function exportToPDF(data, filename) {
    // This is a placeholder for PDF export functionality
    // In a real application, you would use a library like jsPDF
    showAlert('Fitur export PDF akan segera tersedia', 'info');
}

function exportToExcel(data, filename) {
    // This is a placeholder for Excel export functionality
    // In a real application, you would use a library like SheetJS
    showAlert('Fitur export Excel akan segera tersedia', 'info');
}

// Print Function
function printElement(elementId) {
    const element = document.getElementById(elementId);
    if (!element) return;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <html>
            <head>
                <title>Print</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    table { width: 100%; border-collapse: collapse; }
                    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                    th { background-color: #f2f2f2; }
                    .no-print { display: none; }
                </style>
            </head>
            <body>
                ${element.innerHTML}
            </body>
        </html>
    `);
    printWindow.document.close();
    printWindow.print();
}

// Logout Function
function logout() {
    if (confirm('Apakah Anda yakin ingin keluar?')) {
        removeFromLocalStorage('currentUser');
        currentUser = null;
        currentRole = null;
        window.location.href = 'index.html';
    }
}

// Keyboard Shortcuts
document.addEventListener('keydown', function (e) {
    // ESC to close modals
    if (e.key === 'Escape') {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            if (modal.style.display === 'block') {
                modal.style.display = 'none';
                document.body.style.overflow = 'auto';
            }
        });
    }

    // Ctrl+H for help
    if (e.ctrlKey && e.key === 'h') {
        e.preventDefault();
        showHelp();
    }

    // Ctrl+, for settings
    if (e.ctrlKey && e.key === ',') {
        e.preventDefault();
        showSettings();
    }
});

// Add CSS for loading overlay and modals
const additionalCSS = `
.loading-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
}

.loading-spinner {
    background: white;
    padding: 2rem;
    border-radius: 1rem;
    text-align: center;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
}

.loading-spinner p {
    margin-top: 1rem;
    color: var(--gray-600);
}

.modal {
    position: fixed;
    z-index: 1000;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
}

.modal-content {
    background-color: white;
    margin: 2rem;
    padding: 0;
    border-radius: 1rem;
    width: 100%;
    max-width: 500px;
    max-height: 80vh;
    overflow-y: auto;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
}

.modal-header {
    padding: 1.5rem;
    border-bottom: 1px solid var(--gray-200);
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.modal-header h3 {
    margin: 0;
    color: var(--gray-900);
}

.close-btn {
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    color: var(--gray-500);
    padding: 0;
    width: 2rem;
    height: 2rem;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 0.375rem;
}

.close-btn:hover {
    background: var(--gray-100);
    color: var(--gray-700);
}

.modal-body {
    padding: 1.5rem;
}

.help-section {
    margin-bottom: 1.5rem;
}

.help-section h4 {
    margin-bottom: 0.5rem;
    color: var(--gray-900);
}

.help-section ul {
    margin: 0;
    padding-left: 1.5rem;
}

.help-section li {
    margin-bottom: 0.25rem;
    color: var(--gray-600);
}

.form-check {
    margin-bottom: 0.5rem;
}

.form-check-input {
    margin-right: 0.5rem;
}

.form-check-label {
    color: var(--gray-700);
}

.btn-close {
    background: none;
    border: none;
    font-size: 1.25rem;
    cursor: pointer;
    color: var(--gray-500);
    padding: 0.25rem;
    border-radius: 0.25rem;
}

.btn-close:hover {
    background: var(--gray-100);
    color: var(--gray-700);
}

@media (max-width: 640px) {
    .modal-content {
        margin: 1rem;
        max-height: 90vh;
    }
    
    .modal-header,
    .modal-body {
        padding: 1rem;
    }
}
`;

// Inject additional CSS
const styleSheet = document.createElement('style');
styleSheet.textContent = additionalCSS;
document.head.appendChild(styleSheet);