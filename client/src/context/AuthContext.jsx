import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../utils/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check if user is logged in on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      loadUser();
    } else {
      setLoading(false);
    }
  }, []);

  const loadUser = async () => {
    try {
      const userData = await authAPI.getProfile();
      setUser(userData);
      setError(null);
    } catch (err) {
      console.error('Failed to load user:', err);
      localStorage.removeItem('token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      setError(null);
      const data = await authAPI.login({ email, password });
      localStorage.setItem('token', data.token);
      setUser({
        _id: data._id,
        name: data.name,
        email: data.email,
        phoneNumber: data.phoneNumber,
        isAdmin: data.isAdmin,
      });
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const register = async (name, email, password, phoneNumber) => {
    try {
      setError(null);
      const data = await authAPI.register({ name, email, password, phoneNumber });
      // Registration now only creates pending registration, no token yet
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const verifyEmail = async (email, otp) => {
    try {
      setError(null);
      const data = await authAPI.verifyEmail(email, otp);
      // After verification, user is created and token is returned
      localStorage.setItem('token', data.token);
      setUser({
        _id: data.user._id,
        name: data.user.name,
        email: data.user.email,
        phoneNumber: data.user.phoneNumber,
        isAdmin: data.user.isAdmin,
        emailVerified: data.user.emailVerified,
      });
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const resendOTP = async (email) => {
    try {
      setError(null);
      const data = await authAPI.resendOTP(email);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setError(null);
  };

  const updateProfile = async (userData) => {
    try {
      setError(null);
      const data = await authAPI.updateProfile(userData);
      if (data.token) {
        localStorage.setItem('token', data.token);
      }
      setUser({
        _id: data._id,
        name: data.name,
        email: data.email,
        phoneNumber: data.phoneNumber,
        isAdmin: data.isAdmin,
      });
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const updatePassword = async (currentPassword, newPassword) => {
    try {
      setError(null);
      const data = await authAPI.updatePassword({ currentPassword, newPassword });
      if (data.token) {
        localStorage.setItem('token', data.token);
      }
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const value = {
    user,
    loading,
    error,
    login,
    register,
    verifyEmail,
    resendOTP,
    logout,
    updateProfile,
    updatePassword,
    loadUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

