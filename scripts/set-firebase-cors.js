#!/usr/bin/env node
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin with ENV preferred and fallback to file
let initialized = false;
try {
  if (
    process.env.FIREBASE_PROJECT_ID &&
    process.env.FIREBASE_CLIENT_EMAIL &&
    process.env.FIREBASE_PRIVATE_KEY
  ) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      }),
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    });
    initialized = true;
  }
} catch {}

if (!initialized) {
  try {
    const jsonPath = path.join(__dirname, '..', 'firebase-key.json');
    const serviceAccount = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET || 'm-t-m-62972.firebasestorage.app',
    });
    initialized = true;
  } catch (err) {
    console.error('❌ Brak poświadczeń Firebase. Ustaw ENV lub dostarcz firebase-key.json');
    process.exit(1);
  }
}

const bucket = admin.storage().bucket();

// CORS configuration
const corsConfig = [
  {
    origin: ['*'],
    method: ['GET'],
    maxAgeSeconds: 3600
  }
];

async function setCors() {
  try {
    console.log('Setting CORS configuration for Firebase Storage...');
    await bucket.setCorsConfiguration(corsConfig);
    console.log('✅ CORS configuration set successfully!');
    console.log('Images should now load in Chrome.');
  } catch (error) {
    console.error('❌ Error setting CORS:', error.message);
  }
}

setCors();