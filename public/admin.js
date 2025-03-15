document.addEventListener('DOMContentLoaded', () => {
  const registerButton = document.getElementById('register-button');
  const logoutButton = document.getElementById('logout-button');
  const employeeNameInput = document.getElementById('employee-name');
  const adminStatusText = document.getElementById('admin-status');
  const employeeFilter = document.getElementById('employee-filter');
  const dateFilter = document.getElementById('date-filter');
  const showTodayButton = document.getElementById('show-today-button');
  const attendanceTableBody = document.querySelector('#attendance-table tbody');

  const PROXY_URL = config.PROXY_URL || 'http://localhost:3000/proxy'; // Replace with your proxy server URL

  const recordsPerPage = 10; // Set number of records per page
  let currentPage = 1;
  let paginatedRecords = [];

  // Fetch and display attendance records
  async function fetchAttendanceRecords() {
    try {
      const response = await fetch(`${PROXY_URL}?action=getAttendance`);
      if (!response.ok) {
        throw new Error(`Failed to fetch attendance records: ${response.statusText}`);
      }
      const records = await response.json();
      displayAttendanceRecords(records);
    } catch (error) {
      console.error('Error fetching attendance records:', error);
    }
  }
  function displayAttendanceRecords(records) {
    attendanceTableBody.innerHTML = ''; // Clear existing records
    // Sort records by date (newest first)
    records.sort((a, b) => new Date(b[0]) - new Date(a[0]));

    // Apply filters
    const employeeNameFilter = employeeFilter.value.trim().toLowerCase();
    const dateFilterValue = dateFilter.value;

    const filteredRecords = records.filter(record => {
        const matchesEmployee = record[4].toLowerCase().includes(employeeNameFilter);
        const matchesDate = dateFilterValue ? new Date(record[0]).toISOString().split('T')[0] === dateFilterValue : true;
        return matchesEmployee && matchesDate;
    });

    paginatedRecords = filteredRecords; // Store filtered records for pagination
    renderTable(currentPage);
    renderPaginationControls();
}

function renderTable(page) {
    attendanceTableBody.innerHTML = ''; // Clear table
    const start = (page - 1) * recordsPerPage;
    const end = start + recordsPerPage;
    const recordsToShow = paginatedRecords.slice(start, end);
    for (let i=0; i < recordsToShow.length ; i++) {
      const row = document.createElement('tr');
      const date = formatDateTime(recordsToShow[i][0]).formattedDate;
      const time = formatDateTime(recordsToShow[i][0]).formattedTime;
      row.innerHTML = `
          <td>${date}</td> <!-- Date -->
          <td>${time}</td> <!-- Time -->
          <td>${recordsToShow[i][3]}</td> <!-- Action -->
          <td>${recordsToShow[i][4]}</td> <!-- Employee Name -->
      `;
      attendanceTableBody.appendChild(row);
    };
}

function renderPaginationControls() {
    const totalPages = Math.ceil(paginatedRecords.length / recordsPerPage);
    const paginationContainer = document.getElementById('pagination-controls');
    paginationContainer.innerHTML = ''; // Clear old buttons

    if (totalPages > 1) {
        // Previous button
        const prevButton = document.createElement('button');
        prevButton.innerText = 'Previous';
        prevButton.disabled = currentPage === 1;
        prevButton.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                renderTable(currentPage);
                renderPaginationControls();
            }
        });
        paginationContainer.appendChild(prevButton);

        // // Page numbers
        // for (let i = 1; i <= totalPages; i++) {
        //     const pageButton = document.createElement('button');
        //     pageButton.innerText = i;
        //     pageButton.classList.add('page-button');
        //     if (i === currentPage) {
        //         pageButton.classList.add('active');
        //     }
        //     pageButton.addEventListener('click', () => {
        //         currentPage = i;
        //         renderTable(currentPage);
        //         renderPaginationControls();
        //     });
        //     paginationContainer.appendChild(pageButton);
        // }

        // Next button
        const nextButton = document.createElement('button');
        nextButton.innerText = 'Next';
        nextButton.disabled = currentPage === totalPages;
        nextButton.addEventListener('click', () => {
            if (currentPage < totalPages) {
                currentPage++;
                renderTable(currentPage);
                renderPaginationControls();
            }
        });
        paginationContainer.appendChild(nextButton);
    }
  }

  // Employee Registration
  registerButton.addEventListener('click', async () => {
    const employeeName = employeeNameInput.value.trim();
    if (!employeeName) {
      alert('Please enter employee name');
      return;
    }

    try {
      const publicKeyCredentialCreationOptions = {
        challenge: new Uint8Array(32), // Random challenge
        rp: {
          name: 'Staff Attendance App',
          id: window.location.hostname, // Use the current domain
        },
        user: {
          id: new Uint8Array(16), // Random user ID
          name: employeeName,
          displayName: employeeName,
        },
        pubKeyCredParams: [
          { type: 'public-key', alg: -7 }, // ES256
        ],
        authenticatorSelection: {
          userVerification: 'required', // Require biometric verification
        },
        timeout: 60000, // 1 minute timeout
      };

      const credential = await navigator.credentials.create({
        publicKey: publicKeyCredentialCreationOptions,
      });

      // Encode the credential ID as Base64
      const credentialId = btoa(String.fromCharCode(...new Uint8Array(credential.rawId)));

      // Save the credential using the proxy server
      await saveCredentialToGoogleSheets(employeeName, credentialId);
      adminStatusText.textContent = 'Status: Biometric registered';
      console.log('Biometric credential created:', credential);
    } catch (error) {
      adminStatusText.textContent = 'Status: Registration failed';
      console.error('Error registering biometric:', error);
    }
  });

  // Logout
  logoutButton.addEventListener('click', () => {
    window.location.href = 'index.html'; // Redirect to main page
  });

  // Save Credential to Google Sheets using Proxy Server
  async function saveCredentialToGoogleSheets(employeeName, credentialId) {
    const data = {
      action: 'register',
      employeeName,
      credentialId,
    };

    try {
      const response = await fetch(PROXY_URL, {
        method: 'POST',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error(`Failed to save credential: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('Credential saved:', result);
    } catch (error) {
      console.error('Error saving credential:', error);
      throw error;
    }
  }

  // Filter by Employee Name
  employeeFilter.addEventListener('input', () => {
    fetchAttendanceRecords();
  });

  // Filter by Date
  dateFilter.addEventListener('change', () => {
    fetchAttendanceRecords();
  });

  

  //Date format
  function formatDateTime(timestamp) {
    const dateObj = new Date(timestamp);

    // Format date as "15-Mar-2024"
    const day = dateObj.getDate();
    const month = dateObj.toLocaleString('en-US', { month: 'short' });
    const year = dateObj.getFullYear();
    const formattedDate = `${day}-${month}-${year}`;

    // Format time as "14:59:00"
    const hours = String(dateObj.getHours()).padStart(2, '0');
    const minutes = String(dateObj.getMinutes()).padStart(2, '0');
    const seconds = String(dateObj.getSeconds()).padStart(2, '0');
    const formattedTime = `${hours}:${minutes}:${seconds}`;

    return { formattedDate, formattedTime };
  }

  // Fetch attendance records on page load
  fetchAttendanceRecords();
});