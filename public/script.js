document.addEventListener('DOMContentLoaded', () => {
  const adminLoginButton = document.getElementById('admin-login-button');
  const authButton = document.getElementById('auth-button');
  const authEmployeeNameInput = document.getElementById('auth-employee-name');
  const statusText = document.getElementById('status');

  const PASSKEY = 'admin123'; // Hardcoded passkey for demo purposes
  const PROXY_URL = 'http://localhost:3000/proxy'; // Replace with your proxy server URL

  // Admin Login
  adminLoginButton.addEventListener('click', () => {
    const passkey = prompt('Enter passkey:'); // Ask for the passkey
    if (passkey === PASSKEY) {
      window.location.href = 'admin.html'; // Redirect to admin page
    } else {
      alert('Invalid passkey');
    }
  });

  // Employee Authentication
  authButton.addEventListener('click', async () => {
    const employeeName = authEmployeeNameInput.value.trim();

    if (!employeeName) {
      alert('Please enter your name');
      return;
    }

    try {
      const url = `${PROXY_URL}?action=getCredential&employeeName=${encodeURIComponent(employeeName)}`;
      console.log('Fetching URL:', url);

      const credentialResponse = await fetch(url);
      if (!credentialResponse.ok) {
        throw new Error(`Failed to fetch credential: ${credentialResponse.statusText}`);
      }

      const credentialData = await credentialResponse.json();
      if (credentialData.error) {
        throw new Error(credentialData.error);
      }

      const credentialId = credentialData.credentialId;
      if (!credentialId) {
        throw new Error('No biometric credential found for this employee');
      }

      // Decode the Base64-encoded credential ID
      const decodedCredentialId = Uint8Array.from(atob(credentialId), (c) => c.charCodeAt(0));

      const publicKeyCredentialRequestOptions = {
        challenge: new Uint8Array(32), // Random challenge
        rpId: window.location.hostname, // Use the current domain
        allowCredentials: [
          {
            id: decodedCredentialId, // Use the decoded credential ID
            type: 'public-key',
          },
        ],
        userVerification: 'required', // Require biometric verification
        timeout: 60000, // 1 minute timeout
      };

      const assertion = await navigator.credentials.get({
        publicKey: publicKeyCredentialRequestOptions,
      });

      // Encode assertion.id as Base64 for comparison
      const assertionId = btoa(String.fromCharCode(...new Uint8Array(assertion.rawId)));

      if (assertionId === credentialId) {
        statusText.textContent = 'Status: Authenticated';
        console.log('Biometric authentication successful:', assertion);

        window.location.href = `attendance.html?employeeName=${encodeURIComponent(employeeName)}`;
      } else {
        throw new Error('Biometric authentication failed');
      }
    } catch (error) {
      if (error.name === 'NotAllowedError') {
        statusText.textContent = 'Status: Biometric authentication denied';
      } else {
        statusText.textContent = `Status: ${error.message}`;
      }
      console.error('Authentication error:', error);
    }
  });
});



// document.addEventListener('DOMContentLoaded', () => {
//   const adminSection = document.getElementById('admin-section');
//   const registerSection = document.getElementById('register-section');
//   const attendanceSection = document.getElementById('attendance-section');
//   const passkeyInput = document.getElementById('passkey');
//   const adminLoginButton = document.getElementById('admin-login');
//   const employeeNameInput = document.getElementById('employee-name');
//   const registerButton = document.getElementById('register-button');
//   const authButton = document.getElementById('auth-button');
//   const authEmployeeNameInput = document.getElementById('auth-employee-name');
//   const statusText = document.getElementById('status');

//   const PASSKEY = 'admin123'; // Hardcoded passkey for demo purposes
//   const PROXY_URL = config.PROXY_URL || 'http://localhost:3000/proxy'; // Replace with your proxy server URL

//   // Admin Login
//   adminLoginButton.addEventListener('click', () => {
//     if (passkeyInput.value === PASSKEY) {
//       adminSection.style.display = 'none';
//       registerSection.style.display = 'block';
//       attendanceSection.style.display = 'block';
//     } else {
//       alert('Invalid passkey');
//     }
//   });

//   // Register Biometric
//   registerButton.addEventListener('click', async () => {
//     const employeeName = employeeNameInput.value.trim();
//     if (!employeeName) {
//       alert('Please enter employee name');
//       return;
//     }
  
//     try {
//       const publicKeyCredentialCreationOptions = {
//         challenge: new Uint8Array(32), // Random challenge
//         rp: {
//           name: 'Staff Attendance App',
//           id: window.location.hostname, // Use the current domain
//         },
//         user: {
//           id: new Uint8Array(16), // Random user ID
//           name: employeeName,
//           displayName: employeeName,
//         },
//         pubKeyCredParams: [
//           { type: 'public-key', alg: -7 }, // ES256
//         ],
//         authenticatorSelection: {
//           userVerification: 'required', // Require biometric verification
//         },
//         timeout: 60000, // 1 minute timeout
//       };
  
//       const credential = await navigator.credentials.create({
//         publicKey: publicKeyCredentialCreationOptions,
//       });
  
//       // Encode the credential ID as Base64
//       const credentialId = btoa(String.fromCharCode(...new Uint8Array(credential.rawId)));
  
//       // Save the credential using the proxy server
//       await saveCredentialToGoogleSheets(employeeName, credentialId);
//       statusText.textContent = 'Status: Biometric registered';
//       console.log('Biometric credential created:', credential);
//     } catch (error) {
//       statusText.textContent = 'Status: Registration failed';
//       console.error('Error registering biometric:', error);
//     }
//   });

//   // Authentication
//   authButton.addEventListener('click', async () => {
//     const employeeName = authEmployeeNameInput.value.trim();
  
//     if (!employeeName) {
//       alert('Please enter your name');
//       return;
//     }
  
//     try {
//       const url = `${PROXY_URL}?action=getCredential&employeeName=${encodeURIComponent(employeeName)}`;
//       // console.log('Fetching URL:', url);
  
//       const credentialResponse = await fetch(url);
//       if (!credentialResponse.ok) {
//         throw new Error(`Failed to fetch credential: ${credentialResponse.statusText}`);
//       }
  
//       const credentialData = await credentialResponse.json();
//       if (credentialData.error) {
//         throw new Error(credentialData.error);
//       }
  
//       const credentialId = credentialData.credentialId;
//       if (!credentialId) {
//         throw new Error('No biometric credential found for this employee');
//       }
  
//       // Decode the Base64-encoded credential ID
//       const decodedCredentialId = Uint8Array.from(atob(credentialId), (c) => c.charCodeAt(0));
  
//       const publicKeyCredentialRequestOptions = {
//         challenge: new Uint8Array(32), // Random challenge
//         rpId: window.location.hostname, // Use the current domain
//         allowCredentials: [
//           {
//             id: decodedCredentialId, // Use the decoded credential ID
//             type: 'public-key',
//           },
//         ],
//         userVerification: 'required', // Require biometric verification
//         timeout: 60000, // 1 minute timeout
//       };
  
//       const assertion = await navigator.credentials.get({
//         publicKey: publicKeyCredentialRequestOptions,
//       });
  
//       // Encode assertion.id as Base64 for comparison
//       const assertionId = btoa(String.fromCharCode(...new Uint8Array(assertion.rawId)));
  
//       if (assertionId === credentialId) {
//         statusText.textContent = 'Status: Authenticated';
//         console.log('Biometric authentication successful:', assertion);
  
//         window.location.href = `attendance.html?employeeName=${encodeURIComponent(employeeName)}`;
//       } else {
//         throw new Error('Biometric authentication failed');
//       }
//     } catch (error) {
//       if (error.name === 'NotAllowedError') {
//         statusText.textContent = 'Status: Biometric authentication denied';
//       } else {
//         statusText.textContent = `Status: ${error.message}`;
//       }
//       console.error('Authentication error:', error);
//     }
//   });

//   // Save Credential to Google Sheets using Proxy Server
//   async function saveCredentialToGoogleSheets(employeeName, credentialId) {
//     const data = {
//       action: 'register',
//       employeeName,
//       credentialId,
//     };

//     try {
//       const response = await fetch(PROXY_URL, {
//         method: 'POST',
//         body: JSON.stringify(data),
//         headers: { 'Content-Type': 'application/json' },
//       });

//       if (!response.ok) {
//         throw new Error(`Failed to save credential: ${response.statusText}`);
//       }

//       const result = await response.json();
//       console.log('Credential saved:', result);
//     } catch (error) {
//       console.error('Error saving credential:', error);
//       throw error;
//     }
//   }
// });
