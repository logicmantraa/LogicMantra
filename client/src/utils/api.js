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

// Course API
export const courseAPI = {
  getCourses: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/courses${queryString ? `?${queryString}` : ''}`);
  },
  getCourseById: (id) => apiRequest(`/courses/${id}`),
  createCourse: (courseData) => apiRequest('/courses', {
    method: 'POST',
    body: courseData,
  }),
  updateCourse: (id, courseData) => apiRequest(`/courses/${id}`, {
    method: 'PUT',
    body: courseData,
  }),
  deleteCourse: (id) => apiRequest(`/courses/${id}`, {
    method: 'DELETE',
  }),
};

// Enrollment API
export const enrollmentAPI = {
  enroll: (courseId) => apiRequest('/enrollments', {
    method: 'POST',
    body: { courseId },
  }),
  getMyEnrollments: () => apiRequest('/enrollments/my-courses'),
  checkEnrollment: (courseId) => apiRequest(`/enrollments/check/${courseId}`),
  updateProgress: (enrollmentId, lectureId) => apiRequest(`/enrollments/${enrollmentId}/progress`, {
    method: 'PUT',
    body: { lectureId },
  }),
};

// Rating API
export const ratingAPI = {
  submitRating: (ratingData) => apiRequest('/ratings', {
    method: 'POST',
    body: ratingData,
  }),
  getCourseRatings: (courseId) => apiRequest(`/ratings/course/${courseId}`),
  getMyRating: (courseId) => apiRequest(`/ratings/course/${courseId}/my-rating`),
  updateRating: (ratingId, ratingData) => apiRequest(`/ratings/${ratingId}`, {
    method: 'PUT',
    body: ratingData,
  }),
  deleteRating: (ratingId) => apiRequest(`/ratings/${ratingId}`, {
    method: 'DELETE',
  }),
};

// Store API
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

// Lecture API
export const lectureAPI = {
  // Compatibility helpers for admin views
  getCourses: () => apiRequest('/courses'),
  getLectures: (courseId) => apiRequest(`/lectures/course/${courseId}`),

  getLecturesByCourse: (courseId) => apiRequest(`/lectures/course/${courseId}`),
  getLectureById: (id) => apiRequest(`/lectures/${id}`),
  createLecture: (courseIdOrData, lectureData) => {
    const payload = lectureData ? { ...lectureData, courseId: courseIdOrData } : courseIdOrData;
    return apiRequest('/lectures', {
    method: 'POST',
      body: payload,
    });
  },
  updateLecture: (lectureIdOrCourseId, lectureIdOrData, maybeData) => {
    const id = maybeData ? lectureIdOrData : lectureIdOrCourseId;
    const payload = maybeData || lectureIdOrData;
    return apiRequest(`/lectures/${id}`, {
    method: 'PUT',
      body: payload,
    });
  },
  deleteLecture: (lectureIdOrCourseId, maybeLectureId) => {
    const id = maybeLectureId || lectureIdOrCourseId;
    return apiRequest(`/lectures/${id}`, {
    method: 'DELETE',
    });
  },
};

// Resource API
export const resourceAPI = {
  getResources: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/resources${queryString ? `?${queryString}` : ''}`);
  },
  getResourcesByCourse: (courseId) => apiRequest(`/resources/course/${courseId}`),
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

