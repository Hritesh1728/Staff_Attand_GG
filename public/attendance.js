document.addEventListener('DOMContentLoaded', () => {
  const punchInButton = document.getElementById('punch-in-button');
  const punchOutButton = document.getElementById('punch-out-button');
  const attendanceStatus = document.getElementById('attendance-status');
  const welcomeMessage = document.getElementById('welcome-message');
  const attendanceTableBody = document.querySelector('#attendance-table tbody');

  const PROXY_URL = config.PROXY_URL || 'http://localhost:3000/proxy'; // Replace with your Google Script URL
  const ALLOWED_LOCATION = {
    latitude: 27.6876988, // Allowed latitude
    longitude: 76.3527898, // Allowed longitude
  };
  const ALLOWED_RADIUS = 150; // Radius in meters

  // Get the employee name from the query parameter
  const urlParams = new URLSearchParams(window.location.search);
  const employeeName = urlParams.get('employeeName');

  if (employeeName) {
    welcomeMessage.textContent = `Welcome, ${employeeName}!`;
  } else {
    welcomeMessage.textContent = 'Welcome!';
  }

  // Fetch and display attendance records
  async function fetchAttendanceRecords() {
    try {
      const response = await fetch(`${PROXY_URL}?action=getAttendance`);
      if (!response.ok) {
        throw new Error(`Failed to fetch attendance records: ${response.statusText}`);
      }
      const records = await response.json();
      console.log('Attendance records:', records);
      displayAttendanceRecords(records);
    } catch (error) {
      console.error('Error fetching attendance records:', error);
    }
  }

  // Display attendance records in the table
  function displayAttendanceRecords(records) {
    // Clear existing records
    attendanceTableBody.innerHTML = '';

    // Ensure records is an array
    if (!Array.isArray(records)) {
      console.error('Invalid data format: Expected an array');
      return;
    }

    // Filter records for the current employee
    const filteredRecords = records.filter(record => record[4] === employeeName);

    // Sort records in reverse chronological order (most recent first)
    filteredRecords.sort((a, b) => new Date(b[0]) - new Date(a[0]));

    // Check the latest action and update button states
    if (filteredRecords.length > 0) {
      const latestAction = filteredRecords[0][3]; // Action is in the 4th column (index 3)
      if (latestAction === 'punchIn') {
        punchInButton.disabled = true; // Disable Punch In button
        punchOutButton.disabled = false; // Enable Punch Out button
        attendanceStatus.textContent = 'Status: Punched In';
      } else if (latestAction === 'punchOut') {
        punchInButton.disabled = false; // Enable Punch In button
        punchOutButton.disabled = true; // Disable Punch Out button
        attendanceStatus.textContent = 'Status: Punched Out';
      } else {
        // For other actions (e.g., Absent, Missing), enable Punch In by default
        punchInButton.disabled = false; // Enable Punch In button
        punchOutButton.disabled = true; // Disable Punch Out button
        attendanceStatus.textContent = 'Status: Ready';
      }
    } else {
      // If no records exist, enable Punch In by default
      punchInButton.disabled = false; // Enable Punch In button
      punchOutButton.disabled = true; // Disable Punch Out button
      attendanceStatus.textContent = 'Status: Ready';
    }

    // Chunk the records into pages of 10 entries each
    const chunkSize = 5;
    const totalPages = Math.ceil(filteredRecords.length / chunkSize);
    let currentPage = 1;

    // Function to display a specific page of records
    function displayPage(page) {
      attendanceTableBody.innerHTML = ''; // Clear existing rows
      const startIndex = (page - 1) * chunkSize;
      const endIndex = startIndex + chunkSize;
      const pageRecords = filteredRecords.slice(startIndex, endIndex);

      for (let i = 0; i < pageRecords.length; i++) {
        const record = pageRecords[i];
        const row = document.createElement('tr');
        const date = formatDateTime(record[0]).formattedDate;
        const time = formatDateTime(record[0]).formattedTime;
        row.innerHTML = `
          <td>${date}</td> <!-- Timestamp -->
          <td>${time}</td> <!-- Latitude -->
          <td>${record[3]}</td> <!-- Action -->
          <td>${record[4]}</td> <!-- Employee Name -->
        `;
        attendanceTableBody.appendChild(row);
      }
    }
    

    // Display the first page initially
    displayPage(currentPage);

    // Add pagination controls
    const paginationDiv = document.createElement('div');
    paginationDiv.className = 'pagination';

    const prevButton = document.createElement('button');
    prevButton.textContent = 'Previous';
    prevButton.disabled = currentPage === 1;
    prevButton.addEventListener('click', () => {
      if (currentPage > 1) {
        currentPage--;
        displayPage(currentPage);
        prevButton.disabled = currentPage === 1;
        nextButton.disabled = currentPage === totalPages;
      }
    });

    const nextButton = document.createElement('button');
    nextButton.textContent = 'Next';
    nextButton.disabled = currentPage === totalPages;
    nextButton.addEventListener('click', () => {
      if (currentPage < totalPages) {
        currentPage++;
        displayPage(currentPage);
        prevButton.disabled = currentPage === 1;
        nextButton.disabled = currentPage === totalPages;
      }
    });

    paginationDiv.appendChild(prevButton);
    paginationDiv.appendChild(nextButton);

    // Append pagination controls to the table container
    const tableContainer = document.querySelector('#attendance-records div');
    tableContainer.innerHTML = '';
    tableContainer.appendChild(paginationDiv);
  }
  // Logout
  logoutButton.addEventListener('click', () => {
    window.location.href = 'index.html'; // Redirect to main page
  });  

  // Punch In
  punchInButton.addEventListener('click', async () => {
    try {
      const coords = await getLocation();
      const distance = getDistance(
        ALLOWED_LOCATION.latitude,
        ALLOWED_LOCATION.longitude,
        coords.latitude,
        coords.longitude
      );

      if (distance > ALLOWED_RADIUS) {
        throw new Error('Punch Allowed within Gopal Garments Only');
      }

      const timestamp = new Date().toISOString();

      const data = {
        action: 'punchIn',
        timestamp,
        latitude: coords.latitude,
        longitude: coords.longitude,
        employeeName, // Include the employee name in the request
      };

      const response = await fetch(PROXY_URL, {
        method: 'POST',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error(`Failed to punch in: ${response.statusText}`);
      }

      attendanceStatus.textContent = 'Status: Punched In';
      punchInButton.disabled = true; // Disable Punch In button
      punchOutButton.disabled = false; // Enable Punch Out button
      fetchAttendanceRecords(); // Refresh attendance records
      console.log('Punched in:', data);
    } catch (error) {
      attendanceStatus.textContent = `Status: ${error.message}`;
      console.error('Punch in error:', error);
    }
  });

  // Punch Out
  punchOutButton.addEventListener('click', async () => {
    try {
      const coords = await getLocation();
      const distance = getDistance(
        ALLOWED_LOCATION.latitude,
        ALLOWED_LOCATION.longitude,
        coords.latitude,
        coords.longitude
      );

      if (distance > ALLOWED_RADIUS) {
        throw new Error('You are not within the allowed location');
      }

      const timestamp = new Date().toISOString();

      const data = {
        action: 'punchOut',
        timestamp,
        latitude: coords.latitude,
        longitude: coords.longitude,
        employeeName, // Include the employee name in the request
      };

      const response = await fetch(PROXY_URL, {
        method: 'POST',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error(`Failed to punch out: ${response.statusText}`);
      }

      attendanceStatus.textContent = 'Status: Punched Out';
      punchInButton.disabled = false; // Enable Punch In button
      punchOutButton.disabled = true; // Disable Punch Out button
      fetchAttendanceRecords(); // Refresh attendance records
      console.log('Punched out:', data);
    } catch (error) {
      attendanceStatus.textContent = `Status: ${error.message}`;
      console.error('Punch out error:', error);
    }
  });

  // Get User's Location
  async function getLocation() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject('Geolocation is not supported by your browser');
      } else {
        navigator.geolocation.getCurrentPosition(
          (position) => resolve(position.coords),
          (error) => reject(error)
        );
      }
    });
  }

  // Calculate Distance Between Two Coordinates
  function getDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // Earth radius in meters
    const φ1 = (lat1 * Math.PI) / 180; // Convert latitude to radians
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  }
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