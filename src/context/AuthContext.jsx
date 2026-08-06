import { createContext, useContext, useState, useEffect } from 'react';
import { loginAPI, getMeAPI, logoutAPI, updateProfileAPI, changePasswordAPI, getTeacherProfileAPI } from '../api/auth';
import { removeToken as removeFcmToken } from '../services/FCMService';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check if user is already logged in on app start
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const response = await getMeAPI();
        let userData = response.data.data || response.data.user;

        // If user is a teacher, fetch their profile to get permissions
        if (userData?.role === 'teacher') {
          try {
            const profileRes = await getTeacherProfileAPI();
            if (profileRes.data?.data?.permissions) {
              userData.permissions = profileRes.data.data.permissions;
            }
          } catch (err) {
            console.error('Failed to fetch teacher profile:', err);
          }
        }

        setUser(userData);
        setIsAuthenticated(true);
      } catch (error) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      } 
    };
    checkAuth();
  }, []);

  // Login function - supports both email and phone
  const login = async (emailOrPhone, password) => {
    try {
      // Trim input and determine if it's email or phone
      const trimmedInput = (emailOrPhone || '').trim();
      const isEmail = trimmedInput.includes('@');
      const payload = isEmail 
        ? { email: trimmedInput, password }
        : { phone: trimmedInput, password };

      const response = await loginAPI(payload);
      
      if (!response.data.success) {
        return { success: false, error: 'Login failed. Please check your credentials.' };
      }

      const { token, user: initialUserData } = response.data;
      let userData = { ...initialUserData };

      // Save to localStorage so API calls have token
      localStorage.setItem('token', token);

      // If user is a teacher, fetch their profile to get permissions
      if (userData?.role === 'teacher') {
        try {
          const profileRes = await getTeacherProfileAPI();
          if (profileRes.data?.data?.permissions) {
            userData.permissions = profileRes.data.data.permissions;
          }
        } catch (err) {
          console.error('Failed to fetch teacher profile during login:', err);
        }
      }

      localStorage.setItem('user', JSON.stringify(userData));

      setUser(userData);
      setIsAuthenticated(true);

      return { success: true, user: userData };
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.response?.data?.error ||
        'Login failed. Please try again.';
      return { success: false, error: message };
    }
  };

  // Logout function
  const logout = async () => {
    try {
      const token = localStorage.getItem('token');
      await removeFcmToken(token);
      await logoutAPI();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('fcm_token');
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  // Update profile function
  const updateProfile = async (profileData) => {
    try {
      const response = await updateProfileAPI(profileData);
      
      if (!response.data.success) {
        return { success: false, error: response.data.message || 'Failed to update profile' };
      }

      const updatedUser = response.data.data;
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));

      return { success: true, user: updatedUser };
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.response?.data?.error ||
        'Failed to update profile. Please try again.';
      return { success: false, error: message };
    }
  };

  // Change password function
  const changePassword = async (passwordData) => {
    try {
      const response = await changePasswordAPI(passwordData);
      
      if (!response.data.success) {
        return { success: false, error: response.data.message || 'Failed to change password' };
      }

      const { token, user: userData } = response.data;

      // Update token if provided
      if (token) {
        localStorage.setItem('token', token);
      }
      
      if (userData) {
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
      }

      return { success: true, message: 'Password changed successfully' };
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.response?.data?.error ||
        'Failed to change password. Please try again.';
      return { success: false, error: message };
    }
  };

  // Update user in context (after profile update)
  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  // Refresh user data from API
  const refreshUser = async () => {
    try {
      const response = await getMeAPI();
      const userData = response.data.data || response.data.user;
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      return userData;
    } catch (error) {
      console.error('Failed to refresh user:', error);
      return null;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated,
        login,
        logout,
        updateProfile,
        changePassword,
        updateUser,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return context;
};

export default AuthContext;
