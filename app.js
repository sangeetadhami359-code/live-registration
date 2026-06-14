// App State Constants
const WIFI_SSID = 'Auditorium-Guest-HighSpeed';
const WIFI_PASSWORD = 'LiveEvent2026!';
const ITEMS_PER_PAGE = 8;

// Local Variables
let registry = [];
let filteredRegistry = [];
let currentPage = 1;
let kioskMode = false;
let isOnline = true;
let emailjsConfig = null;
let currentSuccessStudent = null;
let currentFilter = 'all'; // Filter state: all, sent, failed, mock

// DOM Element Selectors
const docBody = document.body;
const splashScreen = document.getElementById('splashScreen');
const appContainer = document.getElementById('appContainer');

const registrationForm = document.getElementById('registrationForm');
const studentIdInput = document.getElementById('studentId');
const studentNameInput = document.getElementById('studentName');
const studentEmailInput = document.getElementById('studentEmail');
const submitBtn = document.getElementById('submitBtn');
const submitBtnText = submitBtn.querySelector('span');

const registrationFormState = document.getElementById('registrationFormState');
const successState = document.getElementById('successState');
const successName = document.getElementById('successName');
const successEmail = document.getElementById('successEmail');
const successSsid = document.getElementById('successSsid');
const successPassword = document.getElementById('successPassword');
const registerNextBtn = document.getElementById('registerNextBtn');

const statTotal = document.getElementById('statTotal');
const statSent = document.getElementById('statSent');
const statFailed = document.getElementById('statFailed');

const searchInput = document.getElementById('searchInput');
const clearSearchBtn = document.getElementById('clearSearchBtn');
const refreshBtn = document.getElementById('refreshBtn');
const exportCsvBtn = document.getElementById('exportCsvBtn');
const kioskToggleBtn = document.getElementById('kioskToggleBtn');
const kioskStatusText = document.getElementById('kioskStatusText');

const statusDot = document.getElementById('statusDot');
const statusText = document.getElementById('statusText');
const toastContainer = document.getElementById('toastContainer');
const tableBody = document.getElementById('tableBody');
const emptyState = document.getElementById('emptyState');
const paginationContainer = document.getElementById('paginationContainer');
const paginationInfo = document.getElementById('paginationInfo');
const prevPageBtn = document.getElementById('prevPageBtn');
const nextPageBtn = document.getElementById('nextPageBtn');

// Config Modal Elements
const configToggleBtn = document.getElementById('configToggleBtn');
const configModal = document.getElementById('configModal');
const closeConfigBtn = document.getElementById('closeConfigBtn');
const saveConfigBtn = document.getElementById('saveConfigBtn');
const emailjsPublicKey = document.getElementById('emailjsPublicKey');
const emailjsServiceId = document.getElementById('emailjsServiceId');
const emailjsTemplateId = document.getElementById('emailjsTemplateId');

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
  // 1. Parse Splash Screen sequence
  runSplashSequence();

  // 2. Initialize Network Status
  updateNetworkStatus();
  window.addEventListener('online', updateNetworkStatus);
  window.addEventListener('offline', updateNetworkStatus);

  // 3. Load Local Registry Data
  loadRegistry();

  // 4. Load EmailJS Configuration
  loadEmailConfig();

  // 5. Bind Events
  bindEventHandlers();

  // 6. Render registry list
  renderRegistry();

  // 7. Parse Lucide Icons
  lucide.createIcons();
});

// --- Helper: Splash Sequence (4 Seconds) ---
function runSplashSequence() {
  const loadingPhrases = [
    'Initializing desk credentials...',
    'Loading localStorage database...',
    'Syncing network state indicators...',
    'Desk portal is ready!'
  ];

  const splashLoadingText = document.querySelector('.splash-loading-text');
  
  // Cycle phrases during loading progress
  let phase = 0;
  const phaseInterval = setInterval(() => {
    phase++;
    if (splashLoadingText && loadingPhrases[phase]) {
      splashLoadingText.textContent = loadingPhrases[phase];
    }
    if (phase >= loadingPhrases.length - 1) {
      clearInterval(phaseInterval);
    }
  }, 1000);

  // After 4.2 seconds, start fading out splash overlay
  setTimeout(() => {
    splashScreen.classList.add('fade-out');
    appContainer.classList.remove('hidden-opacity');
    
    // Auto-focus first input box
    setTimeout(() => {
      studentIdInput.focus();
    }, 400);

    // Remove splash screen element from DOM tree entirely after transition
    setTimeout(() => {
      splashScreen.remove();
    }, 600);

  }, 4200);
}

// --- Helper: Network Status ---
function updateNetworkStatus() {
  isOnline = navigator.onLine;
  if (isOnline) {
    statusDot.classList.remove('offline');
    statusText.textContent = 'Online';
  } else {
    statusDot.classList.add('offline');
    statusText.textContent = 'Offline';
    showToast('warning', 'Offline Mode Active', 'Registrations will be saved locally on this device.');
  }
}

// --- Helper: Toast Messages ---
function showToast(type, title, message) {
  const id = 'toast-' + Date.now() + Math.floor(Math.random() * 100);
  const toast = document.createElement('div');
  toast.id = id;
  toast.className = `toast toast-${type}`;
  
  let iconName = 'check-circle';
  if (type === 'error') iconName = 'alert-circle';
  if (type === 'warning') iconName = 'alert-triangle';

  toast.innerHTML = `
    <i data-lucide="${iconName}" class="toast-icon"></i>
    <div class="toast-content">
      <div class="toast-title">${title}</div>
      <div class="toast-msg">${message}</div>
    </div>
    <button class="toast-close" onclick="this.parentElement.remove()">
      <i data-lucide="x"></i>
    </button>
  `;
  
  toastContainer.appendChild(toast);
  lucide.createIcons({ attrs: { class: 'lucide' } });

  // Auto-remove toast
  setTimeout(() => {
    const existing = document.getElementById(id);
    if (existing) {
      existing.remove();
    }
  }, 4500);
}

// --- Local Database Helpers (localStorage) ---
function loadRegistry() {
  const data = localStorage.getItem('live_event_registry');
  if (data) {
    try {
      registry = JSON.parse(data);
    } catch (e) {
      console.error('Failed to parse registry data', e);
      registry = [];
    }
  } else {
    registry = [];
  }
}

function saveRegistry() {
  localStorage.setItem('live_event_registry', JSON.stringify(registry));
  updateStats();
}

function loadEmailConfig() {
  const config = localStorage.getItem('emailjs_config');
  if (config) {
    try {
      emailjsConfig = JSON.parse(config);
      // Pre-fill modal fields
      emailjsPublicKey.value = emailjsConfig.publicKey || '';
      emailjsServiceId.value = emailjsConfig.serviceId || '';
      emailjsTemplateId.value = emailjsConfig.templateId || '';
      
      // Initialize EmailJS
      if (emailjsConfig.publicKey) {
        emailjs.init({ publicKey: emailjsConfig.publicKey });
      }
    } catch (e) {
      console.error('Failed to load email config', e);
    }
  }
}

// --- Stats Counter Updater ---
function updateStats() {
  statTotal.textContent = registry.length;
  statSent.textContent = registry.filter(s => s.emailSent).length;
  statFailed.textContent = registry.filter(s => s.emailError && !s.emailSent).length;
}

// --- Event Handlers Setup ---
function bindEventHandlers() {
  // Form submission
  registrationForm.addEventListener('submit', handleRegistrationSubmit);

  // UI/UX Improvement: Enter key navigation between input boxes
  studentIdInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      studentNameInput.focus();
    }
  });

  studentNameInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      studentEmailInput.focus();
    }
  });

  // UI/UX Improvement: Filter Chip bindings
  const filterChips = document.querySelectorAll('.filter-chip');
  filterChips.forEach(chip => {
    chip.addEventListener('click', () => {
      filterChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      currentFilter = chip.getAttribute('data-filter');
      currentPage = 1;
      renderRegistry();
    });
  });

  // Kiosk Mode toggle
  kioskToggleBtn.addEventListener('click', toggleKioskMode);

  // Config Modal actions
  configToggleBtn.addEventListener('click', () => configModal.classList.remove('hidden'));
  closeConfigBtn.addEventListener('click', () => configModal.classList.add('hidden'));
  saveConfigBtn.addEventListener('click', saveEmailConfig);


  // Next registration trigger
  registerNextBtn.addEventListener('click', resetSuccessOverlay);

  // Search input change
  searchInput.addEventListener('input', handleSearch);
  
  // Clear search query
  clearSearchBtn.addEventListener('click', () => {
    searchInput.value = '';
    clearSearchBtn.classList.add('hidden');
    handleSearch();
  });

  // Table refresh
  refreshBtn.addEventListener('click', () => {
    const icon = refreshBtn.querySelector('svg');
    if (icon) icon.classList.add('spin-animation');
    
    loadRegistry();
    renderRegistry();
    showToast('success', 'Registry Refreshed', 'Database list successfully updated.');
    
    setTimeout(() => {
      if (icon) icon.classList.remove('spin-animation');
    }, 800);
  });

  // Export CSV
  exportCsvBtn.addEventListener('click', handleCsvExport);

  // Pagination buttons
  prevPageBtn.addEventListener('click', () => {
    if (currentPage > 1) {
      currentPage--;
      renderRegistryTable();
    }
  });

  nextPageBtn.addEventListener('click', () => {
    const totalPages = Math.ceil(filteredRegistry.length / ITEMS_PER_PAGE);
    if (currentPage < totalPages) {
      currentPage++;
      renderRegistryTable();
    }
  });
}

// --- Form Validation Helper ---
function validateForm(studentId, name, email) {
  let isValid = true;

  // Clear previous errors
  document.getElementById('errorStudentId').textContent = '';
  document.getElementById('errorStudentName').textContent = '';
  document.getElementById('errorStudentEmail').textContent = '';
  studentIdInput.classList.remove('input-error');
  studentNameInput.classList.remove('input-error');
  studentEmailInput.classList.remove('input-error');

  if (!studentId) {
    document.getElementById('errorStudentId').textContent = 'Student ID is required';
    studentIdInput.classList.add('input-error');
    isValid = false;
  } else if (studentId.length < 3) {
    document.getElementById('errorStudentId').textContent = 'Student ID must be at least 3 characters';
    studentIdInput.classList.add('input-error');
    isValid = false;
  }

  if (!name) {
    document.getElementById('errorStudentName').textContent = 'Full name is required';
    studentNameInput.classList.add('input-error');
    isValid = false;
  }

  if (!email) {
    document.getElementById('errorStudentEmail').textContent = 'Email address is required';
    studentEmailInput.classList.add('input-error');
    isValid = false;
  } else {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      document.getElementById('errorStudentEmail').textContent = 'Enter a valid email address';
      studentEmailInput.classList.add('input-error');
      isValid = false;
    }
  }

  return isValid;
}

// --- Submit Registration Handler ---
async function handleRegistrationSubmit(e) {
  e.preventDefault();

  const id = studentIdInput.value.trim();
  const name = studentNameInput.value.trim();
  const email = studentEmailInput.value.trim().toLowerCase();

  if (!validateForm(id, name, email)) return;

  // Duplicate check (case-insensitive)
  const duplicateId = registry.find(s => s.id.toLowerCase() === id.toLowerCase());
  if (duplicateId) {
    document.getElementById('errorStudentId').textContent = `Duplicate ID: "${id}" is already registered.`;
    studentIdInput.classList.add('input-error');
    showToast('error', 'Duplicate Student ID', 'This student is already checked in.');
    return;
  }

  const duplicateEmail = registry.find(s => s.email.toLowerCase() === email.toLowerCase());
  if (duplicateEmail) {
    document.getElementById('errorStudentEmail').textContent = `Duplicate Email: "${email}" is already registered.`;
    studentEmailInput.classList.add('input-error');
    showToast('error', 'Duplicate Email Address', 'This email address is already checked in.');
    return;
  }

  // Create student record
  const student = {
    id,
    name,
    email,
    timestamp: new Date().toISOString(),
    emailSent: false,
    emailSentAt: null,
    emailError: null,
    provider: 'mock' // Default
  };

  // Set loading state
  submitBtn.disabled = true;
  const originalHtml = submitBtn.innerHTML;
  submitBtn.innerHTML = '<div class="spinner"></div><span>Sending Email...</span>';

  try {
    const emailResult = await sendWifiEmail(student);
    
    if (emailResult.success) {
      student.emailSent = true;
      student.emailSentAt = new Date().toISOString();
      student.provider = emailResult.provider;
      showToast('success', 'Registration Completed', `Wi-Fi passcode dispatched to ${student.email}`);
    } else {
      student.emailSent = false;
      student.emailError = emailResult.error || 'Failed';
      showToast('warning', 'Email Failed', emailResult.error || 'Check config or email logs.');
    }
  } catch (err) {
    console.error(err);
    student.emailSent = false;
    student.emailError = err.message || 'Error';
    showToast('error', 'Connection Error', 'Failed to dispatch email.');
  }

  // Save student to registry
  registry.unshift(student); // Prepend to show new check-ins first
  saveRegistry();
  renderRegistry();

  // Show Success Card View
  currentSuccessStudent = student;
  successName.textContent = student.name;
  successEmail.textContent = student.email;
  successSsid.textContent = WIFI_SSID;
  successPassword.textContent = WIFI_PASSWORD;

  registrationFormState.classList.add('hidden');
  successState.classList.remove('hidden');

  // Reset submit button state
  submitBtn.innerHTML = originalHtml;
  submitBtn.disabled = false;
}

// --- Email Dispatch Helper (EmailJS or Local Fallback) ---
async function sendWifiEmail(student) {
  // Check if EmailJS is configured
  if (emailjsConfig && emailjsConfig.publicKey && emailjsConfig.serviceId && emailjsConfig.templateId) {
    try {
      console.log(`[EmailJS] Sending email to ${student.email}...`);
      const params = {
        student_name: student.name,
        student_email: student.email,
        student_id: student.id,
        wifi_ssid: WIFI_SSID,
        wifi_password: WIFI_PASSWORD
      };
      
      const response = await emailjs.send(
        emailjsConfig.serviceId,
        emailjsConfig.templateId,
        params
      );
      
      console.log('[EmailJS] Success Response:', response);
      return { success: true, provider: 'emailjs' };
    } catch (error) {
      console.error('[EmailJS] Error Dispatching:', error);
      return { success: false, error: error.text || 'EmailJS rejected send request' };
    }
  } else {
    // FALLBACK: Local Mock Email Logging
    console.log('--------------------------------------------------');
    console.log(`[MOCK EMAIL SENT (No credentials configured)]`);
    console.log(`To: ${student.email}`);
    console.log(`Name: ${student.name}`);
    console.log(`Wi-Fi SSID: ${WIFI_SSID}`);
    console.log(`Wi-Fi Password: ${WIFI_PASSWORD}`);
    console.log('--------------------------------------------------');
    
    // Save to local mock list as a fallback
    let mockEmails = [];
    const savedMocks = localStorage.getItem('mock_sent_emails');
    if (savedMocks) {
      try { mockEmails = JSON.parse(savedMocks); } catch (e) {}
    }
    mockEmails.unshift({
      to: student.email,
      name: student.name,
      id: student.id,
      ssid: WIFI_SSID,
      password: WIFI_PASSWORD,
      sentAt: new Date().toISOString()
    });
    localStorage.setItem('mock_sent_emails', JSON.stringify(mockEmails));
    
    return { success: true, provider: 'mock' };
  }
}

// --- Manual Resend Handler ---
async function handleResendEmail(id) {
  const student = registry.find(s => s.id === id);
  if (!student) return;

  const btn = document.querySelector(`button[data-resend-id="${id}"]`);
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<div class="spinner" style="width:12px; height:12px;"></div>';
  }

  try {
    const result = await sendWifiEmail(student);
    const index = registry.findIndex(s => s.id === id);
    
    if (result.success) {
      registry[index].emailSent = true;
      registry[index].emailSentAt = new Date().toISOString();
      registry[index].emailError = null;
      registry[index].provider = result.provider;
      showToast('success', 'Email Sent', `Wi-Fi credentials successfully resent to ${student.email}`);
    } else {
      registry[index].emailSent = false;
      registry[index].emailError = result.error || 'Resend Failed';
      showToast('error', 'Resend Failed', result.error || 'Verification error occurred.');
    }
  } catch (err) {
    console.error(err);
    showToast('error', 'Network Error', 'Could not execute mail trigger.');
  }

  saveRegistry();
  renderRegistry();
}

// --- Delete Attendee Handler ---
function handleDeleteStudent(id) {
  if (!confirm(`Are you sure you want to delete registration for Student ID ${id}?`)) return;

  const index = registry.findIndex(s => s.id === id);
  if (index !== -1) {
    const studentName = registry[index].name;
    registry.splice(index, 1);
    saveRegistry();
    renderRegistry();
    showToast('success', 'Attendee Removed', `Registration for ${studentName} deleted successfully.`);
    
    // Clear success card if we deleted the current active success student
    if (currentSuccessStudent && currentSuccessStudent.id === id) {
      resetSuccessOverlay();
    }
  }
}

// --- Save EmailJS settings modal ---
function saveEmailConfig() {
  const key = emailjsPublicKey.value.trim();
  const service = emailjsServiceId.value.trim();
  const template = emailjsTemplateId.value.trim();

  if (!key || !service || !template) {
    showToast('error', 'Invalid Settings', 'All configuration fields are required.');
    return;
  }

  emailjsConfig = {
    publicKey: key,
    serviceId: service,
    templateId: template
  };

  localStorage.setItem('emailjs_config', JSON.stringify(emailjsConfig));
  emailjs.init({ publicKey: key });
  configModal.classList.add('hidden');
  showToast('success', 'Credentials Saved', 'EmailJS configured successfully. Real emails are now active.');
}

// --- Search Filter Logic ---
function handleSearch() {
  const query = searchInput.value.toLowerCase().trim();
  
  if (query) {
    clearSearchBtn.classList.remove('hidden');
  } else {
    clearSearchBtn.classList.add('hidden');
  }

  // Reload registry with filters
  renderRegistry();
}

// --- CSV Export Builder ---
function handleCsvExport() {
  if (registry.length === 0) {
    showToast('error', 'Export Failed', 'Registry list is currently empty.');
    return;
  }

  const headers = ['Timestamp', 'Student ID', 'Name', 'Email Address', 'Email Status', 'Dispatched At', 'Error Code'];
  const rows = registry.map(student => {
    const timestamp = student.timestamp || '';
    const id = `"${student.id.replace(/"/g, '""')}"`;
    const name = `"${student.name.replace(/"/g, '""')}"`;
    const email = `"${student.email.replace(/"/g, '""')}"`;
    const status = student.emailSent ? 'Sent' : 'Failed';
    const sentAt = student.emailSentAt || '';
    const error = student.emailError ? `"${student.emailError.replace(/"/g, '""')}"` : '';

    return [timestamp, id, name, email, status, sentAt, error].join(',');
  });

  const csvContent = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  
  // Download trigger
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', 'live_event_registry_export.csv');
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  showToast('success', 'Export Successful', 'Registry CSV sheet downloaded.');
}

// --- Kiosk / Self-Service Toggle ---
function toggleKioskMode() {
  kioskMode = !kioskMode;
  if (kioskMode) {
    docBody.classList.add('kiosk-mode-active');
    kioskStatusText.textContent = 'Volunteer Mode';
    kioskToggleBtn.classList.add('btn-primary');
    kioskToggleBtn.classList.remove('btn-secondary');
    showToast('success', 'Kiosk Mode Enabled', 'Kiosk / Student Self-Service screen active.');
  } else {
    docBody.classList.remove('kiosk-mode-active');
    kioskStatusText.textContent = 'Kiosk Mode';
    kioskToggleBtn.classList.remove('btn-primary');
    kioskToggleBtn.classList.add('btn-secondary');
    showToast('success', 'Volunteer Mode Enabled', 'Registry dashboard panels restored.');
  }
}

// --- Success Overlay resets ---
function resetSuccessOverlay() {
  currentSuccessStudent = null;
  successState.classList.add('hidden');
  registrationFormState.classList.remove('hidden');
  registrationForm.reset();
  studentIdInput.focus();
}


// --- Render Table & Lists ---
function renderRegistry() {
  const query = searchInput.value.toLowerCase().trim();
  
  // 1. First filter by search queries
  let result = registry.filter(student => 
    student.name.toLowerCase().includes(query) ||
    student.email.toLowerCase().includes(query) ||
    student.id.toLowerCase().includes(query)
  );

  // 2. Next filter by Quick Chips state
  if (currentFilter === 'sent') {
    result = result.filter(student => student.emailSent);
  } else if (currentFilter === 'failed') {
    result = result.filter(student => student.emailError !== null && !student.emailSent);
  } else if (currentFilter === 'mock') {
    result = result.filter(student => student.provider === 'mock');
  }

  filteredRegistry = result;
  
  updateStats();
  renderRegistryTable();
}

function renderRegistryTable() {
  tableBody.innerHTML = '';
  
  const totalItems = filteredRegistry.length;
  
  if (totalItems === 0) {
    emptyState.classList.remove('hidden');
    paginationContainer.classList.add('hidden');
    return;
  }

  emptyState.classList.add('hidden');

  // Compute pagination rows
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
  if (currentPage > totalPages) currentPage = Math.max(totalPages, 1);

  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, totalItems);
  const pageItems = filteredRegistry.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  // Render rows
  pageItems.forEach(student => {
    const row = document.createElement('tr');
    
    // Format timestamp
    const date = new Date(student.timestamp);
    const localTime = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Format badge status
    let badgeClass = 'badge-success';
    let badgeLabel = 'Sent';
    if (!student.emailSent) {
      badgeClass = 'badge-error';
      badgeLabel = 'Failed';
    }
    
    // Check if mock email was logged
    if (student.provider === 'mock') {
      badgeClass = 'badge-warning';
      badgeLabel = 'Mock';
    }

    row.innerHTML = `
      <td>
        <div class="student-meta">
          <span class="student-name">${student.name}</span>
          <span class="student-id">${student.id} | ${student.email}</span>
        </div>
      </td>
      <td>${localTime}</td>
      <td>
        <span class="badge ${badgeClass}" title="${student.emailError || 'Email successfully sent'}">
          ${badgeLabel}
        </span>
      </td>
      <td>
        <div class="action-cell">
          <button 
            data-resend-id="${student.id}" 
            class="table-action-btn" 
            title="Resend passcode email"
            onclick="handleResendEmail('${student.id}')"
          >
            <i data-lucide="mail"></i>
          </button>
          <button 
            class="table-action-btn delete-btn" 
            title="Delete registration record"
            onclick="handleDeleteStudent('${student.id}')"
          >
            <i data-lucide="trash-2"></i>
          </button>
        </div>
      </td>
    `;
    tableBody.appendChild(row);
  });

  // Render pagination bar
  if (totalPages > 1) {
    paginationContainer.classList.remove('hidden');
    paginationInfo.textContent = `Showing ${startIndex + 1} to ${endIndex} of ${totalItems} attendees`;
    prevPageBtn.disabled = currentPage === 1;
    nextPageBtn.disabled = currentPage === totalPages;
  } else {
    paginationContainer.classList.add('hidden');
  }

  // Parse vector icons
  lucide.createIcons();
}
