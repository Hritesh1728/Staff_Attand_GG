const punchInButton = document.getElementById('punch-in-button');
const punchOutButton = document.getElementById('punch-out-button');
const attendanceStatus = document.getElementById('attendance-status');
const welcomeMessage = document.getElementById('welcome-message');


const PROXY_URL = process.env.PROXY_URL || 'http://localhost:3000/proxy';; // Replace with your proxy server URL
const ALLOWED_LOCATION = {
  latitude: 27.698215, // 
  longitude: 76.364715, //
};
const ALLOWED_RADIUS = 200; // Radius in meters

// Get the employee name from the query parameter
const urlParams = new URLSearchParams(window.location.search);
const employeeName = urlParams.get('employeeName');

if (employeeName) {
  welcomeMessage.textContent = `Welcome, ${employeeName}!`;
} else {
  welcomeMessage.textContent = 'Welcome!';
}

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
      throw new Error('You are not within the allowed location');
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