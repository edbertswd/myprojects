/**
 * User API Service
 * Handles user-related API calls including manager applications
 */

import api from './api';

/**
 * Submit manager application
 * @param {Object} applicationData - Manager application data
 * @returns {Promise} Response with application details
 */
export async function submitManagerApplication(applicationData) {
  const response = await api.post('/users/apply-manager/', applicationData);
  return response.data;
}

/**
 * Get current user's manager application status
 * @returns {Promise} Response with application status or 404 if no application
 */
export async function getManagerApplicationStatus() {
  try {
    const response = await api.get('/users/manager-application-status/');
    return response.data;
  } catch (error) {
    if (error.response?.status === 404) {
      return null; // No application found
    }
    throw error;
  }
}
