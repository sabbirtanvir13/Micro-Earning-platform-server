import jwt from 'jsonwebtoken';
import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';
import User from '../models/User.js';
import { createNotification } from '../utils/notificationHelper.js';

// Initialize Firebase Admin if not already initialized and env vars are present
if (!admin.apps.length) {
  // Look for serviceAccountKey.json in several likely locations (fix path issues)
  const candidatePaths = [
    path.resolve(process.cwd(), 'serviceAccountKey.json'),
    path.resolve(process.cwd(), 'server', 'serviceAccountKey.json'),
    path.resolve(process.cwd(), '..', 'server', 'serviceAccountKey.json'),
  ];

  let keyFile = candidatePaths.find((p) => fs.existsSync(p));
  const hasKeyFile = Boolean(keyFile);

  const firebaseProjectId = process.env.FIREBASE_PROJECT_ID;
  const firebasePrivateKey = process.env.FIREBASE_PRIVATE_KEY;
  const firebaseClientEmail = process.env.FIREBASE_CLIENT_EMAIL;

  const looksLikePem = (key) => typeof key === 'string' && /-----BEGIN PRIVATE KEY-----/.test(key) && /-----END PRIVATE KEY-----/.test(key);

  try {
    let initialized = false;

    if (hasKeyFile) {
      const raw = fs.readFileSync(keyFile, 'utf8');
      try {
        const serviceAccount = JSON.parse(raw);
        if (!serviceAccount.private_key || !looksLikePem(serviceAccount.private_key)) {
          console.warn('serviceAccountKey.json found but private_key looks invalid; skipping file-based Firebase init.');
        } else {
          admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
          console.log('Firebase Admin initialized from serviceAccountKey.json');
          initialized = true;
        }
      } catch (jsonErr) {
        console.error('Failed to parse serviceAccountKey.json at', keyFile);
        console.error('First 800 chars of file:', raw.slice(0, 800));
        console.warn('serviceAccountKey.json is not valid JSON; will attempt env-var initialization if available.');
      }
    }

    if (!initialized && firebaseProjectId && firebasePrivateKey && firebaseClientEmail) {
      const fixedKey = firebasePrivateKey.replace(/\\n/g, '\n');
      if (!looksLikePem(fixedKey)) {
        console.warn('FIREBASE_PRIVATE_KEY found but does not appear to be a valid PEM; wrap the key with quotes and use \\n+ to represent newlines, or place serviceAccountKey.json in server/.');
      } else {
        admin.initializeApp({
          credential: admin.credential.cert({
            projectId: firebaseProjectId,
            privateKey: fixedKey,
            clientEmail: firebaseClientEmail,
          }),
        });
        console.log('Firebase Admin initialized from environment variables');
        initialized = true;
      }
    }

    if (!initialized) {
      console.warn('Skipping Firebase Admin initialization: set FIREBASE_PROJECT_ID, FIREBASE_PRIVATE_KEY, and FIREBASE_CLIENT_EMAIL in server/.env or provide a valid server/serviceAccountKey.json');
    }
  } catch (error) {
    console.error('Firebase Admin initialization error:', error);
  }
}

const generateToken = (userId, email, role) => {
  return jwt.sign({ userId, email, role }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  });
};

// Verify Firebase token and issue JWT
export const verifyFirebase = async (req, res) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({ message: 'Firebase token required' });
    }

    let decodedToken;

    if (admin.apps.length) {
      // Prefer Admin SDK when available
      decodedToken = await admin.auth().verifyIdToken(idToken);
    } else {
      // Fallback: use Firebase Auth REST API to lookup token (requires FIREBASE_API_KEY)
      const apiKey = process.env.FIREBASE_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ message: 'Firebase Admin not configured on server' });
      }

      const lookupUrl = `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`;
      const lookupRes = await fetch(lookupUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });

      if (!lookupRes.ok) {
        const text = await lookupRes.text();
        console.error('Firebase REST lookup failed:', lookupRes.status, text);
        return res.status(401).json({ message: 'Invalid Firebase token (REST lookup failed)' });
      }

      const lookupJson = await lookupRes.json();
      const userRecord = lookupJson.users && lookupJson.users[0];
      if (!userRecord) {
        return res.status(401).json({ message: 'Invalid Firebase token' });
      }

      decodedToken = {
        email: userRecord.email,
        name: userRecord.displayName,
        picture: userRecord.photoUrl,
        uid: userRecord.localId,
      };
    }

    const { email, name, picture, uid } = decodedToken;

    // Find or create user
    let user = await User.findOne({ email });

    if (!user) {
      user = new User({
        email,
        displayName: name,
        photoURL: picture,
        role: 'worker', // Default role, will be set on role selection
      });
      await user.save();
    } else {
      // Update user info if changed
      user.displayName = name || user.displayName;
      user.photoURL = picture || user.photoURL;
      await user.save();
    }

    // Generate JWT token
    const token = generateToken(user._id, user.email, user.role);

    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        role: user.role,
        coins: user.coins,
        initialCoinsReceived: user.initialCoinsReceived,
      },
    });
  } catch (error) {
    console.error('Firebase verification error:', error);
    res.status(401).json({ message: 'Invalid Firebase token', error: error.message });
  }
};

// Select role and grant initial coins
export const selectRole = async (req, res) => {
  try {
    const { role } = req.body;
    const userId = req.user._id;

    if (!['worker', 'buyer', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.role !== 'worker' && user.role !== role) {
      return res.status(400).json({ message: 'Role already set' });
    }

    // Grant initial coins if not received
    if (!user.initialCoinsReceived) {
      if (role === 'worker') {
        user.coins += 10;
      } else if (role === 'buyer') {
        user.coins += 50;
      }
      user.initialCoinsReceived = true;
    }

    user.role = role;
    await user.save();

    // Generate new token with updated role
    const token = generateToken(user._id, user.email, user.role);

    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        role: user.role,
        coins: user.coins,
        initialCoinsReceived: user.initialCoinsReceived,
      },
    });
  } catch (error) {
    console.error('Role selection error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get current user profile
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-__v');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      user: {
        id: user._id,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        role: user.role,
        coins: user.coins,
        totalEarned: user.totalEarned,
        totalSpent: user.totalSpent,
        profileImage: user.profileImage,
        isActive: user.isActive,
        initialCoinsReceived: user.initialCoinsReceived,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
