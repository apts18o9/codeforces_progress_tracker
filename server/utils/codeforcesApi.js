// server/utils/codeforcesApi.js

const axios = require('axios');


const CODEFORCES_API_BASE_URL = 'https://codeforces.com/api/';


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

