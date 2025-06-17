// server/utils/codeforcesApi.js

const axios = require('axios');
// No need for dotenv here if environment variables are loaded in app.js/server.js
// and passed where needed, or if API keys are not directly used in public endpoints.

const CODEFORCES_API_BASE_URL = 'https://codeforces.com/api/';

/**
 * Helper function to extract a Codeforces handle from a full URL.
 * This ensures that only the actual handle is used for API requests.
 * @param {string} input - The string that might be a handle or a full URL.
 * @returns {string} The extracted Codeforces handle, or an empty string if input is invalid.
 */
const extractHandleFromUrl = (input) => {
  if (!input) return ''; // Handle null or empty input
  const urlPrefixes = [
    'https://codeforces.com/profile/',
    'http://codeforces.com/profile/',
    'codeforces.com/profile/'
  ];
  let cleaned = input.trim(); // Remove leading/trailing whitespace
  for (const prefix of urlPrefixes) {
    if (cleaned.startsWith(prefix)) {
      cleaned = cleaned.substring(prefix.length); // Remove the URL prefix
      break; // Stop after finding the first matching prefix
    }
  }
  return cleaned.trim(); // Trim again in case there was trailing whitespace after prefix
};

/**
 * Fetches user information (rating, max rating, etc.) from the Codeforces API.
 * Uses the cleaned handle for the API request.
 * @param {string} handle - The Codeforces user handle (can be a raw handle or a profile URL).
 * @returns {Promise<object|null>} A promise that resolves to the user info object if successful, or null otherwise.
 */
const fetchUserInfo = async (handle) => {
  const cleanedHandle = extractHandleFromUrl(handle); // Ensure only handle is used
  if (!cleanedHandle) {
    console.warn(`[CF_API] fetchUserInfo: No valid handle to fetch user info for. Input: "${handle}"`);
    return null;
  }
  try {
    const response = await axios.get(`${CODEFORCES_API_BASE_URL}user.info?handles=${cleanedHandle}`);
    if (response.data.status === 'OK' && response.data.result.length > 0) {
      return response.data.result[0]; // Return the first (and usually only) result
    }
    // Log Codeforces API's specific error comment if available
    console.warn(`[CF_API] fetchUserInfo Warning for ${cleanedHandle}: ${response.data.comment || 'Unknown error'}`);
    return null;
  } catch (error) {
    console.error(`[CF_API] Error fetching user info for ${cleanedHandle}: ${error.message}`);
    if (error.response) {
      // Log detailed error response from Codeforces if available
      console.error(`[CF_API] Status: ${error.response.status}, Data: ${JSON.stringify(error.response.data)}`);
    }
    return null;
  }
};

/**
 * Fetches contest rating history for a user from the Codeforces API.
 * Uses the cleaned handle for the API request.
 * @param {string} handle - The Codeforces user handle (can be a raw handle or a profile URL).
 * @returns {Promise<Array<object>>} A promise that resolves to an array of contest rating objects, or an empty array.
 */
const fetchUserRatingHistory = async (handle) => {
  const cleanedHandle = extractHandleFromUrl(handle); // Ensure only handle is used
  if (!cleanedHandle) {
    console.warn(`[CF_API] fetchUserRatingHistory: No valid handle to fetch rating history for. Input: "${handle}"`);
    return [];
  }
  try {
    const response = await axios.get(`${CODEFORCES_API_BASE_URL}user.rating?handle=${cleanedHandle}`);
    if (response.data.status === 'OK') {
      return response.data.result; // Return the array of rating changes
    }
    console.warn(`[CF_API] fetchUserRatingHistory Warning for ${cleanedHandle}: ${response.data.comment || 'Unknown error'}`);
    return [];
  } catch (error) {
    console.error(`[CF_API] Error fetching user rating history for ${cleanedHandle}: ${error.message}`);
    if (error.response) {
      console.error(`[CF_API] Status: ${error.response.status}, Data: ${JSON.stringify(error.response.data)}`);
    }
    return [];
  }
};

/**
 * Fetches user submissions from the Codeforces API.
 * Uses the cleaned handle for the API request.
 * @param {string} handle - The Codeforces user handle (can be a raw handle or a profile URL).
 * @param {number} count - Number of latest submissions to fetch (default: 1000).
 * @returns {Promise<Array<object>>} A promise that resolves to an array of submission objects, or an empty array.
 */
const fetchUserSubmissions = async (handle, count = 1000) => {
  const cleanedHandle = extractHandleFromUrl(handle); // Ensure only handle is used
  if (!cleanedHandle) {
    console.warn(`[CF_API] fetchUserSubmissions: No valid handle to fetch submissions for. Input: "${handle}"`);
    return [];
  }
  try {
    const response = await axios.get(`${CODEFORCES_API_BASE_URL}user.status?handle=${cleanedHandle}&from=1&count=${count}`);
    if (response.data.status === 'OK') {
      return response.data.result; // Return the array of submissions
    }
    console.warn(`[CF_API] fetchUserSubmissions Warning for ${cleanedHandle}: ${response.data.comment || 'Unknown error'}`);
    return [];
  } catch (error) {
    console.error(`[CF_API] Error fetching user submissions for ${cleanedHandle}: ${error.message}`);
    if (error.response) {
      console.error(`[CF_API] Status: ${error.response.status}, Data: ${JSON.stringify(error.response.data)}`);
    }
    return [];
  }
};

module.exports = {
  fetchUserInfo,
  fetchUserRatingHistory,
  fetchUserSubmissions,
};

