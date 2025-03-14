import express from 'express';
import fetch from 'node-fetch';
import cors from 'cors';
import path from 'path';
const app = express();
const PORT = process.env.PORT || 3000;
import { fileURLToPath } from 'url';

// Convert `__dirname` to work with ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors()); // Enable CORS for all routes
app.use(express.json());

// Serve static files from the "public" folder
app.use(express.static(path.join(__dirname, 'public')));

const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxtxvlhmicE5C2v5xGwe3SxXFBG64CMH4W3BDNecMU8quCWTeAXhdx_9phpNesfVmWH/exec'; // Replace with your Google Apps Script URL

// Proxy route for fetching credentials
app.get('/proxy', async (req, res) => {
  const employeeName = req.query.employeeName; // Get the employeeName from the query parameters

  if (!employeeName) {
    return res.status(400).json({ error: 'Employee name is required' });
  }

  try {
    // Forward the request to Google Apps Script with the employeeName parameter
    const response = await fetch(`${GOOGLE_SCRIPT_URL}?action=getCredential&employeeName=${encodeURIComponent(employeeName)}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch credential: ${response.statusText}`);
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ error: 'Proxy error', details: error.message });
  }
});

// Proxy route for saving credentials
app.post('/proxy', async (req, res) => {
  try {
    const response = await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      body: JSON.stringify(req.body),
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`Failed to save credential: ${response.statusText}`);
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ error: 'Proxy error', details: error.message });
  }
});

// Serve the frontend for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});




// import fetch from 'node-fetch';
// import express from 'express';
// import cors from 'cors';
// import path from 'path';
// import { fileURLToPath } from 'url';

// // Fix for __dirname in ES modules
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// const app = express();
// const PORT = 3000;

// app.use(cors()); // Enable CORS for all routes
// app.use(express.json());

// // Serve static files from the "public" folder
// app.use(express.static(path.join(__dirname, 'public')));

// const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxtxvlhmicE5C2v5xGwe3SxXFBG64CMH4W3BDNecMU8quCWTeAXhdx_9phpNesfVmWH/exec'; // Replace with your Google Apps Script URL

// // Proxy route for fetching credentials
// app.get('/proxy', async (req, res) => {
//   const employeeName = req.query.employeeName; // Get the employeeName from the query parameters

//   if (!employeeName) {
//     return res.status(400).json({ error: 'Employee name is required' });
//   }

//   try {
//     // Forward the request to Google Apps Script with the employeeName parameter
//     const response = await fetch(`${GOOGLE_SCRIPT_URL}?action=getCredential&employeeName=${encodeURIComponent(employeeName)}`);
//     if (!response.ok) {
//       throw new Error(`Failed to fetch credential: ${response.statusText}`);
//     }

//     const data = await response.json();
//     res.json(data);
//   } catch (error) {
//     console.error('Proxy error:', error);
//     res.status(500).json({ error: 'Proxy error', details: error.message });
//   }
// });

// // Proxy route for saving credentials
// app.post('/proxy', async (req, res) => {
//   try {
//     const response = await fetch(GOOGLE_SCRIPT_URL, {
//       method: 'POST',
//       body: JSON.stringify(req.body),
//       headers: { 'Content-Type': 'application/json' },
//     });

//     if (!response.ok) {
//       throw new Error(`Failed to save credential: ${response.statusText}`);
//     }

//     const data = await response.json();
//     res.json(data);
//   } catch (error) {
//     console.error('Proxy error:', error);
//     res.status(500).json({ error: 'Proxy error', details: error.message });
//   }
// });

// app.listen(PORT, () => {
//   console.log(`Proxy server running on http://localhost:${PORT}`);
// });