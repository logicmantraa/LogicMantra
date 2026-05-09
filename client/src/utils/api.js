const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Get token from localStorage
const getToken = () => {
  return localStorage.getItem('token');
};

// API request helper
const apiRequest = async (endpoint, options = {}) => {
  const token = getToken();
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  if (config.body && typeof config.body === 'object' && !(config.body instanceof FormData)) {
    config.body = JSON.stringify(config.body);
  }

  try {
    const response = await fetch(`${API_URL}${endpoint}`, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Something went wrong');
    }

    return data;
  } catch (error) {
    throw error;
  }
};

// Auth API
export const authAPI = {
  register: (userData) => apiRequest('/auth/register', {
    method: 'POST',
    body: userData,
  }),
  login: (credentials) => apiRequest('/auth/login', {
    method: 'POST',
    body: credentials,
  }),
  verifyOTP: (data) => apiRequest('/auth/verify-otp', {
    method: 'POST',
    body: data,
  }),
  resendOTP: (email) => apiRequest('/auth/resend-otp', {
    method: 'POST',
    body: { email },
  }),
  forgotPassword: (email) => apiRequest('/auth/forgot-password', {
    method: 'POST',
    body: { email },
  }),
  resetPassword: (data) => apiRequest('/auth/reset-password', {
    method: 'POST',
    body: data,
  }),
  getProfile: () => apiRequest('/auth/profile'),
  updateProfile: (userData) => apiRequest('/auth/profile', {
    method: 'PUT',
    body: userData,
  }),
  updatePassword: (passwordData) => apiRequest('/auth/update-password', {
    method: 'PUT',
    body: passwordData,
  }),
};

// Product API
export const productAPI = {
  getProducts: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/store${queryString ? `?${queryString}` : ''}`);
  },
  getProductById: (id) => apiRequest(`/store/${id}`),
  createProduct: (productData) => apiRequest('/store', {
    method: 'POST',
    body: productData,
  }),
  updateProduct: (id, productData) => apiRequest(`/store/${id}`, {
    method: 'PUT',
    body: productData,
  }),
  deleteProduct: (id) => apiRequest(`/store/${id}`, {
    method: 'DELETE',
  }),
};

// Access API (User Library)
export const accessAPI = {
  getMyLibrary: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/library${queryString ? `?${queryString}` : ''}`);
  },
  addToLibrary: (productId) => apiRequest('/library', {
    method: 'POST',
    body: { productId },
  }),
  checkAccess: (productId) => apiRequest(`/library/check/${productId}`),
  updateProgress: (accessId, progressData) => apiRequest(`/library/${accessId}/progress`, {
    method: 'PUT',
    body: progressData,
  }),
};

// Rating API
export const ratingAPI = {
  submitRating: (ratingData) => apiRequest('/ratings', {
    method: 'POST',
    body: ratingData,
  }),
  getProductRatings: (productId) => apiRequest(`/ratings/product/${productId}`),
  getMyRating: (productId) => apiRequest(`/ratings/product/${productId}/my-rating`),
  updateRating: (ratingId, ratingData) => apiRequest(`/ratings/${ratingId}`, {
    method: 'PUT',
    body: ratingData,
  }),
  deleteRating: (ratingId) => apiRequest(`/ratings/${ratingId}`, {
    method: 'DELETE',
  }),
};

// Store API (Updated for Product architecture)
export const storeAPI = {
  getStoreItems: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/store${queryString ? `?${queryString}` : ''}`);
  },
  getStoreItemById: (id) => apiRequest(`/store/${id}`),
  createStoreItem: (itemData) => apiRequest('/store', {
    method: 'POST',
    body: itemData,
  }),
  updateStoreItem: (id, itemData) => apiRequest(`/store/${id}`, {
    method: 'PUT',
    body: itemData,
  }),
  deleteStoreItem: (id) => apiRequest(`/store/${id}`, {
    method: 'DELETE',
  }),
  purchaseItem: (id) => apiRequest(`/store/${id}/purchase`, {
    method: 'POST',
  }),
};

// User API (Admin)
export const userAPI = {
  getUsers: () => apiRequest('/users'),
  getUserById: (id) => apiRequest(`/users/${id}`),
  updateUser: (id, userData) => apiRequest(`/users/${id}`, {
    method: 'PUT',
    body: userData,
  }),
  deleteUser: (id) => apiRequest(`/users/${id}`, {
    method: 'DELETE',
  }),
  checkSubscription: () => apiRequest('/users/check-subscription'),
};

// Lecture API (Updated for Product architecture)
export const lectureAPI = {
  getLecturesByProduct: (productId) => apiRequest(`/lectures/product/${productId}`),
  getLectureById: (id) => apiRequest(`/lectures/${id}`),
  createLecture: (lectureData) => {
    return apiRequest('/lectures', {
      method: 'POST',
      body: lectureData,
    });
  },
  updateLecture: (lectureId, lectureData) => {
    return apiRequest(`/lectures/${lectureId}`, {
      method: 'PUT',
      body: lectureData,
    });
  },
  deleteLecture: (lectureId) => {
    return apiRequest(`/lectures/${lectureId}`, {
      method: 'DELETE',
    });
  },
};

// Resource API (Updated for Product architecture)
export const resourceAPI = {
  getResources: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/resources${queryString ? `?${queryString}` : ''}`);
  },
  getResourcesByProduct: (productId) => apiRequest(`/resources/product/${productId}`),
  getResourcesByLecture: (lectureId) => apiRequest(`/resources/lecture/${lectureId}`),
  getResourceById: (id) => apiRequest(`/resources/${id}`),
  createResource: (resourceData) => apiRequest('/resources', {
    method: 'POST',
    body: resourceData,
  }),
  updateResource: (id, resourceData) => apiRequest(`/resources/${id}`, {
    method: 'PUT',
    body: resourceData,
  }),
  deleteResource: (id) => apiRequest(`/resources/${id}`, {
    method: 'DELETE',
  }),
};

// Admin API
export const adminAPI = {
  getDashboardStats: () => apiRequest('/admin/dashboard'),
};

// Contact API
export const contactAPI = {
  submitContact: (contactData) => apiRequest('/contact', {
    method: 'POST',
    body: contactData,
  }),
  getContacts: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/contact${queryString ? `?${queryString}` : ''}`);
  },
  getContactById: (id) => apiRequest(`/contact/${id}`),
  updateContactStatus: (id, status) => apiRequest(`/contact/${id}`, {
    method: 'PUT',
    body: { status },
  }),
  deleteContact: (id) => apiRequest(`/contact/${id}`, {
    method: 'DELETE',
  }),
};

export default apiRequest;

