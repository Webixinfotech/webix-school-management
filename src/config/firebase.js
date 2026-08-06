const admin = require("firebase-admin");
const logger = require("./logger");
const path = require("path");
const fs = require("fs");

let firebaseApp = null;

/**
 * Initialize Firebase Admin SDK
 * Tries to load service account from JSON file, fallback to env variable
 */
function initializeFirebase() {
  logger.info("Firebase initialization is disabled locally.");
  return null;
}

/**
 * Get Firebase Admin instance
 */
function getFirebaseAdmin() {
  if (!firebaseApp) {
    firebaseApp = initializeFirebase();
  }
  return firebaseApp;
}

/**
 * Get Firebase Messaging instance
 */
function getMessaging() {
  if (!firebaseApp) {
    return null;
  }
  return admin.messaging();
}

module.exports = {
  initializeFirebase,
  getFirebaseAdmin,
  getMessaging,
};
