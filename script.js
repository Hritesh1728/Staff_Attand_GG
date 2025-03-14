const adminSection = document.getElementById('admin-section');
const registerSection = document.getElementById('register-section');
const attendanceSection = document.getElementById('attendance-section');
const passkeyInput = document.getElementById('passkey');
const adminLoginButton = document.getElementById('admin-login');
const employeeNameInput = document.getElementById('employee-name');
const registerButton = document.getElementById('register-button');
const authButton = document.getElementById('auth-button');
const statusText = document.getElementById('status');

const PASSKEY = 'admin123'; // Hardcoded passkey for demo purposes
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxtxvlhmicE5C2v5xGwe3SxXFBG64CMH4W3BDNecMU8quCWTeAXhdx_9phpNesfVmWH/exec'; // Replace with your Google Apps Script URL

// Admin Login
adminLoginButton.addEventListener('click', () => {
  if (passkeyInput.value === PASSKEY) {
    adminSection.style.display = 'none';
    registerSection.style.display = 'block';
    attendanceSection.style.display = 'block';
  } else {
    alert('Invalid passkey');
  }
});

// Register Biometric
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

    // Save the credential to Google Sheets
    await saveCredentialToGoogleSheets(employeeName, credential.id);
    statusText.textContent = 'Status: Biometric registered';
    console.log('Biometric credential created:', credential);
  } catch (error) {
    statusText.textContent = 'Status: Registration failed';
    console.error('Error registering biometric:', error);
  }
});

// Authenticate with Biometric
authButton.addEventListener('click', async () => {
  try {
    const credentialId = await getCredentialFromGoogleSheets();
    if (!credentialId) {
      throw new Error('No biometric credential found');
    }

    const publicKeyCredentialRequestOptions = {
      challenge: new Uint8Array(32), // Random challenge
      rpId: window.location.hostname, // Use the current domain
      allowCredentials: [
        {
          id: Uint8Array.from(atob(credentialId), (c) => c.charCodeAt(0)), // Convert credential ID to Uint8Array
          type: 'public-key',
        },
      ],
      userVerification: 'required', // Require biometric verification
      timeout: 60000, // 1 minute timeout
    };

    const assertion = await navigator.credentials.get({
      publicKey: publicKeyCredentialRequestOptions,
    });

    if (assertion.id === credentialId) {
      statusText.textContent = 'Status: Authenticated';
      console.log('Biometric authentication successful:', assertion);
    } else {
      throw new Error('Biometric authentication failed');
    }
  } catch (error) {
    if (error.name === 'NotAllowedError') {
      statusText.textContent = 'Status: Biometric authentication denied';
    } else {
      statusText.textContent = 'Status: Authentication failed';
    }
    console.error('Authentication error:', error);
  }
});

// Save Credential to Google Sheets
async function saveCredentialToGoogleSheets(employeeName, credentialId) {
  const data = {
    action: 'register',
    employeeName,
    credentialId,
  };

  const response = await fetch(GOOGLE_SCRIPT_URL, {
    method: 'POST',
    body: JSON.stringify(data),
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    throw new Error('Failed to save credential');
  }
}

// Get Credential from Google Sheets
async function getCredentialFromGoogleSheets() {
  const response = await fetch(`${GOOGLE_SCRIPT_URL}?action=getCredential`);
  const data = await response.json();
  return data.credentialId;
}