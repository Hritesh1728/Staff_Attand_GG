document.addEventListener('DOMContentLoaded', () => {
    const registerButton = document.getElementById('register-button');
    const logoutButton = document.getElementById('logout-button');
    const employeeNameInput = document.getElementById('employee-name');
    const adminStatusText = document.getElementById('admin-status');
  
    const PROXY_URL = 'http://localhost:3000/proxy'; // Replace with your proxy server URL
  
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
  });