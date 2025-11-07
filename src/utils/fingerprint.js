// src/utils/fingerprint.js
import FingerprintJS from '@fingerprintjs/fingerprintjs';

let fpPromise = null;

/**
 * Initialize FingerprintJS (call once on app load)
 */
export const initFingerprint = () => {
  if (!fpPromise) {
    fpPromise = FingerprintJS.load();
  }
  return fpPromise;
};

/**
 * Get browser fingerprint for voter identification
 * Returns a consistent ID for this browser/device
 * 
 * @returns {Promise<string>} Browser fingerprint
 */
export const getFingerprint = async () => {
  try {
    // Initialize if not already done
    if (!fpPromise) {
      await initFingerprint();
    }
    
    const fp = await fpPromise;
    const result = await fp.get();
    
    // Return the visitor ID (consistent across sessions)
    return result.visitorId;
  } catch (error) {
    console.error('Error generating fingerprint:', error);
    
    // Fallback to localStorage-based ID if fingerprinting fails
    let fallbackId = localStorage.getItem('voter_fallback_id');
    if (!fallbackId) {
      fallbackId = `fallback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('voter_fallback_id', fallbackId);
      console.log('Using fallback fingerprint:', fallbackId);
    }
    return fallbackId;
  }
};