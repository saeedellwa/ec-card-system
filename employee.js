// employee.js
//
// This script populates the employee card page with data from the
// `employees` array defined in data.js or from localStorage. It reads
// the `ecNo` query parameter from the URL and searches the array for
// a matching entry.  Custom logos and photo data are respected; if
// not provided, default base64 logos are used (defined in
// employee.html).

(function () {
  // Helper to get a query parameter by name
  function getQueryParam(name) {
    const params = new URLSearchParams(window.location.search);
    return params.get(name);
  }

  // Load employee list from localStorage or from the global employees array
  function loadEmployees() {
    let list = [];
    try {
      const stored = localStorage.getItem('employees');
      if (stored) {
        list = JSON.parse(stored);
      } else if (Array.isArray(window.employees)) {
        list = window.employees;
      }
    } catch (err) {
      console.error(err);
    }
    return list;
  }

  const ecNoParam = getQueryParam('ecNo');
  const list = loadEmployees();
  const employee = list.find((e) => e.ecNo === ecNoParam);

  // Populate text content helper
  function setText(id, text) {
    const el = document.getElementById(id);
    if (el) {
      el.textContent = text;
    }
  }

  if (!employee) {
    setText('employeeName', 'Employee not found');
    return;
  }

  // Set basic profile info
  const photoEl = document.getElementById('photo');
  if (employee.photoData) {
    // If a base64-encoded photo is provided, use it directly
    photoEl.src = employee.photoData;
  } else if (employee.photo) {
    // Fall back to using the photo property as a relative path. For the base64
    // version of this project there is no public/photos folder, so the
    // property should contain either a full URL or another data URI.
    photoEl.src = employee.photo;
  }

  setText('employeeName', employee.name);
  setText('ecNo', 'EC No: ' + employee.ecNo);
  setText('ecDate', 'EC Date: ' + (employee.ecDate || ''));

  // Assign logos to the header and sections.  If the employee provides
  // custom logos (`logoLeft` or `logoRight`) we use those values; otherwise
  // fall back to the globally defined LOGO_GREEN and LOGO_PURPLE constants
  // defined in employee.html.  The header uses the CSS class `logo` and the
  // sections use the CSS class `section-logo`.  Each image has a
  // `data-type` attribute indicating which logo (green or purple) to apply.
  const headerLogos = document.querySelectorAll('header img.logo');
  headerLogos.forEach((img) => {
    const type = img.dataset.type;
    if (type === 'green') {
      img.src = employee.logoRight || window.LOGO_GREEN;
    } else {
      // purple
      img.src = employee.logoLeft || window.LOGO_PURPLE;
    }
  });
  // Assign logos for section headers
  const sectionLogos = document.querySelectorAll('img.section-logo');
  sectionLogos.forEach((img) => {
    const type = img.dataset.type;
    if (type === 'green') {
      img.src = employee.logoRight || window.LOGO_GREEN;
    } else {
      img.src = employee.logoLeft || window.LOGO_PURPLE;
    }
  });

  // Utility to create a row in the details table
  function createDetailRow(label, value, highlight = false) {
    const row = document.createElement('div');
    row.className = 'details-row';
    const labelSpan = document.createElement('span');
    labelSpan.textContent = label;
    const valueSpan = document.createElement('span');
    valueSpan.textContent = value || '';
    if (highlight) {
      valueSpan.classList.add('highlight-value');
    }
    row.appendChild(labelSpan);
    row.appendChild(valueSpan);
    return row;
  }

  // Build personal details section
  const personal = document.getElementById('personalDetails');
  personal.appendChild(createDetailRow('Birth Date', employee.birthDate));
  personal.appendChild(createDetailRow('Passport No', employee.passportNo));
  personal.appendChild(createDetailRow('Passport Issue Date', employee.passportIssueDate));
  personal.appendChild(createDetailRow('Passport Expire Date', employee.passportExpireDate));
  personal.appendChild(createDetailRow('Visa No', employee.visaNo));
  personal.appendChild(createDetailRow('Visa Issue Date', employee.visaIssueDate));
  personal.appendChild(createDetailRow('Visa Expire Date', employee.visaExpireDate));
  personal.appendChild(createDetailRow('Referral No', employee.referralNo));
  // Highlight certain rows to match the design
  personal.appendChild(createDetailRow('Recruiting Agency', employee.recruitingAgency, true));
  personal.appendChild(createDetailRow('Employer', employee.employer, true));
  personal.appendChild(createDetailRow('Country', employee.country, true));

  // Build BMET details section
  const bmet = document.getElementById('bmetDetails');
  bmet.appendChild(createDetailRow('BMET No', employee.bmetNo));
  bmet.appendChild(createDetailRow('Name', employee.name.toUpperCase()));
  bmet.appendChild(createDetailRow('Birth Date', employee.birthDate));
  bmet.appendChild(createDetailRow('Gender', employee.gender));
  bmet.appendChild(createDetailRow('Blood Group', employee.bloodGroup));
  bmet.appendChild(createDetailRow('NID', employee.nid));

  // Build passport details section
  const passport = document.getElementById('passportDetails');
  passport.appendChild(createDetailRow('Name', employee.passportName));
  passport.appendChild(createDetailRow('Passport No 1', employee.passportNo1));
})();
