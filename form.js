// form.js
//
// This script handles adding and editing employees in the admin system. It
// supports file uploads with optional cropping (using Cropper.js) for
// the employee photo and two logos (left and right). The form values
// are persisted into localStorage so that the dashboard and card pages
// can access the updated list. When editing an existing employee the
// form is prepopulated with current values. On save the list is updated
// and the user is redirected back to the dashboard.

(function () {
  // Retrieve query params
  function getQueryParam(name) {
    const params = new URLSearchParams(window.location.search);
    return params.get(name);
  }

  // Helpers to load and save the employees list from localStorage or fallback
  function loadEmployees() {
    let list = [];
    try {
      const stored = localStorage.getItem('employees');
      if (stored) {
        list = JSON.parse(stored);
      } else if (Array.isArray(window.employees)) {
        list = window.employees;
        localStorage.setItem('employees', JSON.stringify(list));
      }
    } catch (err) {
      console.error(err);
    }
    return list;
  }
  function saveEmployees(list) {
    localStorage.setItem('employees', JSON.stringify(list));
    // update global variable for card pages
    window.employees = list;
  }

  // Grab DOM elements
  const form = document.getElementById('employeeForm');
  const formTitle = document.getElementById('formTitle');
  const submitBtn = document.getElementById('submitBtn');
  // File inputs and drop zones
  const photoFile = document.getElementById('photoFile');
  const logoLeftFile = document.getElementById('logoLeftFile');
  const logoRightFile = document.getElementById('logoRightFile');
  const photoDrop = document.getElementById('photoDrop');
  const logoLeftDrop = document.getElementById('logoLeftDrop');
  const logoRightDrop = document.getElementById('logoRightDrop');
  // Hidden text input for photo (stores base64 or URL)
  const photoInput = document.getElementById('photo');

  // Cropper related elements
  const cropModal = document.getElementById('cropModal');
  const cropImage = document.getElementById('cropImage');
  const cropOk = document.getElementById('cropOk');
  const cropCancel = document.getElementById('cropCancel');
  let cropper = null;
  let currentField = null;
  // Variables to store cropped images for logos
  let photoData = '';
  let logoLeftData = '';
  let logoRightData = '';

  // Assign header logos using global variables or defaults.  We do not
  // override them here; the card page will handle fallback if these
  // variables remain empty.
  const LOGO_GREEN = window.LOGO_GREEN || '';
  const LOGO_PURPLE = window.LOGO_PURPLE || '';
  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('header img.logo').forEach((img) => {
      const type = img.dataset.type;
      img.src = type === 'green' ? LOGO_GREEN : LOGO_PURPLE;
    });
  });

  // Initialize form state for edit or new
  const indexParam = getQueryParam('index');
  let employeesList = loadEmployees();
  let editingIndex = indexParam !== null ? parseInt(indexParam, 10) : null;
  let editingEmployee = null;
  if (!isNaN(editingIndex) && employeesList[editingIndex]) {
    editingEmployee = employeesList[editingIndex];
  }
  if (editingEmployee) {
    formTitle.textContent = 'Edit Employee';
    submitBtn.textContent = 'Update';
    // Prefill values
    form.ecNo.value = editingEmployee.ecNo || '';
    form.name.value = editingEmployee.name || '';
    // The EC date is stored as a formatted string (e.g., 30/Sep/2025).
    // Try to convert to ISO for input value. If parse fails, leave blank.
    form.ecDate.value = formatToISO(editingEmployee.ecDate);
    form.birthDate.value = editingEmployee.birthDate || '';
    form.passportNo.value = editingEmployee.passportNo || '';
    form.passportIssueDate.value = editingEmployee.passportIssueDate || '';
    form.passportExpireDate.value = editingEmployee.passportExpireDate || '';
    form.visaNo.value = editingEmployee.visaNo || '';
    form.visaIssueDate.value = editingEmployee.visaIssueDate || '';
    form.visaExpireDate.value = editingEmployee.visaExpireDate || '';
    form.referralNo.value = editingEmployee.referralNo || '';
    form.recruitingAgency.value = editingEmployee.recruitingAgency || '';
    form.employer.value = editingEmployee.employer || '';
    form.country.value = editingEmployee.country || '';
    form.bmetNo.value = editingEmployee.bmetNo || '';
    form.gender.value = editingEmployee.gender || '';
    form.bloodGroup.value = editingEmployee.bloodGroup || '';
    form.nid.value = editingEmployee.nid || '';
    form.passportName.value = editingEmployee.passportName || '';
    form.passportNo1.value = editingEmployee.passportNo1 || '';
    // Prefill photo and logos
    photoData = editingEmployee.photoData || editingEmployee.photo || '';
    if (photoData) {
      photoInput.value = photoData;
      photoDrop.textContent = 'Photo loaded';
    }
    logoLeftData = editingEmployee.logoLeft || '';
    if (logoLeftData) {
      logoLeftDrop.textContent = 'Left logo loaded';
    }
    logoRightData = editingEmployee.logoRight || '';
    if (logoRightData) {
      logoRightDrop.textContent = 'Right logo loaded';
    }
  }

  // Helper to parse formatted date (e.g., 30/Sep/2025) to ISO string (YYYY-MM-DD)
  function formatToISO(dateStr) {
    if (!dateStr) return '';
    // Accept date string in formats like "DD/MMM/YYYY" or "YYYY-MM-DD"
    const parts = dateStr.split(/[\/]/);
    if (parts.length === 3) {
      // If the middle part contains letters (month abbreviation), convert
      if (/[a-zA-Z]/.test(parts[1])) {
        const day = parts[0];
        const monthAbbr = parts[1].substring(0, 3);
        const year = parts[2];
        const monthMap = {
          Jan: '01',
          Feb: '02',
          Mar: '03',
          Apr: '04',
          May: '05',
          Jun: '06',
          Jul: '07',
          Aug: '08',
          Sep: '09',
          Oct: '10',
          Nov: '11',
          Dec: '12',
        };
        const month = monthMap[monthAbbr] || '01';
        return `${year}-${month}-${day.padStart(2, '0')}`;
      }
      // Already ISO-ish; ensure zero padding
      return `${parts[0].padStart(4, '0')}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
    }
    return '';
  }

  // Utility to format ISO date (YYYY-MM-DD) to "DD/Mon/YYYY" for ecDate
  function formatECDate(isoDate) {
    if (!isoDate) return '';
    const [year, month, day] = isoDate.split('-');
    const monthMap = {
      '01': 'Jan',
      '02': 'Feb',
      '03': 'Mar',
      '04': 'Apr',
      '05': 'May',
      '06': 'Jun',
      '07': 'Jul',
      '08': 'Aug',
      '09': 'Sep',
      '10': 'Oct',
      '11': 'Nov',
      '12': 'Dec',
    };
    return `${day.padStart(2, '0')}/${monthMap[month] || 'Jan'}/${year}`;
  }

  // Bind file and drop zone events for photo and logos
  function setupFileInput(fileInput, dropZone, field) {
    // File input change
    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        handleFile(file, field);
      }
    });
    // Drag over
    dropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropZone.classList.add('dragover');
    });
    dropZone.addEventListener('dragleave', () => {
      dropZone.classList.remove('dragover');
    });
    dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropZone.classList.remove('dragover');
      const file = e.dataTransfer.files[0];
      if (file) {
        handleFile(file, field);
      }
    });
    // Also clicking drop zone triggers file input
    dropZone.addEventListener('click', () => {
      fileInput.click();
    });
  }

  // Setup event handlers for each input
  setupFileInput(photoFile, photoDrop, 'photo');
  setupFileInput(logoLeftFile, logoLeftDrop, 'logoLeft');
  setupFileInput(logoRightFile, logoRightDrop, 'logoRight');

  // Handle file reading and cropping
  function handleFile(file, field) {
    const reader = new FileReader();
    reader.onload = function (e) {
      currentField = field;
      cropImage.src = e.target.result;
      cropModal.style.display = 'flex';
      // Destroy previous cropper if any
      if (cropper) {
        cropper.destroy();
      }
      // Use a square crop for all fields; the actual aspect ratio doesn't
      // matter much for logos as they will be scaled by CSS later.
      cropper = new Cropper(cropImage, {
        aspectRatio: 1,
        viewMode: 1,
        background: false,
        zoomable: true,
      });
    };
    reader.readAsDataURL(file);
  }

  cropCancel.addEventListener('click', () => {
    if (cropper) {
      cropper.destroy();
      cropper = null;
    }
    cropModal.style.display = 'none';
    currentField = null;
  });

  cropOk.addEventListener('click', () => {
    if (!cropper || !currentField) {
      cropModal.style.display = 'none';
      return;
    }
    const canvas = cropper.getCroppedCanvas({
      width: 300,
      height: 300,
    });
    const dataUrl = canvas.toDataURL('image/png');
    if (currentField === 'photo') {
      photoData = dataUrl;
      photoInput.value = dataUrl;
      photoDrop.textContent = 'Photo selected';
    } else if (currentField === 'logoLeft') {
      logoLeftData = dataUrl;
      logoLeftDrop.textContent = 'Left logo selected';
    } else if (currentField === 'logoRight') {
      logoRightData = dataUrl;
      logoRightDrop.textContent = 'Right logo selected';
    }
    cropper.destroy();
    cropper = null;
    cropModal.style.display = 'none';
    currentField = null;
  });

  // Form submit handler
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const employee = {
      ecNo: form.ecNo.value.trim(),
      name: form.name.value.trim(),
      ecDate: formatECDate(form.ecDate.value),
      birthDate: form.birthDate.value,
      passportNo: form.passportNo.value.trim(),
      passportIssueDate: form.passportIssueDate.value,
      passportExpireDate: form.passportExpireDate.value,
      visaNo: form.visaNo.value.trim(),
      visaIssueDate: form.visaIssueDate.value,
      visaExpireDate: form.visaExpireDate.value,
      referralNo: form.referralNo.value.trim(),
      recruitingAgency: form.recruitingAgency.value.trim(),
      employer: form.employer.value.trim(),
      country: form.country.value.trim(),
      bmetNo: form.bmetNo.value.trim(),
      gender: form.gender.value.trim(),
      bloodGroup: form.bloodGroup.value.trim(),
      nid: form.nid.value.trim(),
      passportName: form.passportName.value.trim(),
      passportNo1: form.passportNo1.value.trim(),
    };
    // Only include data URI values if they exist
    if (photoData) employee.photoData = photoData;
    // Because the original card uses `logoLeft` for purple and `logoRight` for green,
    // store them accordingly.  If both are empty they will fallback to defaults.
    if (logoLeftData) employee.logoLeft = logoLeftData;
    if (logoRightData) employee.logoRight = logoRightData;
    // Determine if editing or adding
    if (editingEmployee) {
      employeesList[editingIndex] = employee;
    } else {
      // Avoid duplicate ecNo; optionally check
      employeesList.push(employee);
    }
    saveEmployees(employeesList);
    // Redirect to dashboard
    window.location.href = 'dashboard.html';
  
})();});
})();
