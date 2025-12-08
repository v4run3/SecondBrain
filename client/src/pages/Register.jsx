import { useState } from 'react';
import api from '../api';
import { Link, useNavigate } from 'react-router-dom';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const navigate = useNavigate();

  // Sanitize input to remove potentially dangerous characters
  const sanitizeInput = (input, type = 'text') => {
    if (type === 'name') {
      // Allow letters, spaces, hyphens, and apostrophes only
      return input.replace(/[^a-zA-Z\s'-]/g, '').slice(0, 50);
    } else if (type === 'username') {
      // Allow alphanumeric, underscores, and hyphens only
      return input.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 30);
    } else if (type === 'email') {
      // Basic email sanitization
      return input.trim().slice(0, 100);
    }
    return input;
  };

  // Validate individual fields
  const validateField = (fieldName, value) => {
    const errors = {};
    
    if (fieldName === 'name') {
      if (value.length < 2) {
        errors.name = 'Name must be at least 2 characters';
      } else if (value.length > 50) {
        errors.name = 'Name must not exceed 50 characters';
      } else if (!/^[a-zA-Z\s'-]+$/.test(value)) {
        errors.name = 'Name can only contain letters, spaces, hyphens, and apostrophes';
      }
    }
    
    if (fieldName === 'username') {
      if (value.length < 3) {
        errors.username = 'Username must be at least 3 characters';
      } else if (value.length > 30) {
        errors.username = 'Username must not exceed 30 characters';
      } else if (!/^[a-zA-Z0-9_-]+$/.test(value)) {
        errors.username = 'Username can only contain letters, numbers, underscores, and hyphens';
      }
    }
    
    if (fieldName === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        errors.email = 'Please enter a valid email address';
      }
    }
    
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});
    
    // Validate all fields
    const nameErrors = validateField('name', name);
    const usernameErrors = validateField('username', username);
    const emailErrors = validateField('email', email);
    
    const allErrors = { ...nameErrors, ...usernameErrors, ...emailErrors };
    
    if (Object.keys(allErrors).length > 0) {
      setFieldErrors(allErrors);
      setError('Please fix the errors above');
      return;
    }
    
    // Password validation logic
    const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;
    if (!passwordRegex.test(password)) {
      setError('Password must be at least 8 characters long and contain at least one uppercase letter, one number, and one special character.');
      return;
    }

    try {
      const res = await api.post('/auth/register', { name, email, username, password });
      // Don't set token yet. Redirect to verify.
      // res.data will contain { message, email }
      navigate('/verify-email', { state: { email: res.data.email } });
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 bg-gray-800 p-8 rounded-xl shadow-lg border border-gray-700">
      <h2 className="text-3xl font-bold mb-6 text-white text-center">Register</h2>
      {error && <p className="text-red-400 mb-4 bg-red-900/20 p-3 rounded border border-red-800 text-sm text-center">{error}</p>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-gray-300 text-sm font-medium mb-1">Name</label>
          <input
            type="text"
            className={`w-full p-3 bg-gray-700 border ${fieldErrors.name ? 'border-red-500' : 'border-gray-600'} rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all`}
            value={name}
            onChange={(e) => {
              const sanitized = sanitizeInput(e.target.value, 'name');
              setName(sanitized);
              setFieldErrors(prev => ({ ...prev, name: undefined }));
            }}
            onBlur={(e) => {
              const errors = validateField('name', e.target.value);
              setFieldErrors(prev => ({ ...prev, ...errors }));
            }}
            required
            placeholder="Enter your name"
            maxLength={50}
          />
          {fieldErrors.name && <p className="text-red-400 text-xs mt-1">{fieldErrors.name}</p>}
        </div>
        <div>
          <label className="block text-gray-300 text-sm font-medium mb-1">Username</label>
          <input
            type="text"
            className={`w-full p-3 bg-gray-700 border ${fieldErrors.username ? 'border-red-500' : 'border-gray-600'} rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all`}
            value={username}
            onChange={(e) => {
              const sanitized = sanitizeInput(e.target.value, 'username');
              setUsername(sanitized);
              setFieldErrors(prev => ({ ...prev, username: undefined }));
            }}
            onBlur={(e) => {
              const errors = validateField('username', e.target.value);
              setFieldErrors(prev => ({ ...prev, ...errors }));
            }}
            required
            placeholder="Choose a username"
            maxLength={30}
          />
          {fieldErrors.username && <p className="text-red-400 text-xs mt-1">{fieldErrors.username}</p>}
        </div>
        <div>
          <label className="block text-gray-300 text-sm font-medium mb-1">Email</label>
          <input
            type="email"
            className={`w-full p-3 bg-gray-700 border ${fieldErrors.email ? 'border-red-500' : 'border-gray-600'} rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all`}
            value={email}
            onChange={(e) => {
              const sanitized = sanitizeInput(e.target.value, 'email');
              setEmail(sanitized);
              setFieldErrors(prev => ({ ...prev, email: undefined }));
            }}
            onBlur={(e) => {
              const errors = validateField('email', e.target.value);
              setFieldErrors(prev => ({ ...prev, ...errors }));
            }}
            required
            placeholder="Enter your email"
            maxLength={100}
          />
          {fieldErrors.email && <p className="text-red-400 text-xs mt-1">{fieldErrors.email}</p>}
        </div>
        <div>
          <label className="block text-gray-300 text-sm font-medium mb-1">Password</label>
          <input
            type="password"
            className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="Choose a password"
            maxLength={128}
          />
        </div>
        <button type="submit" className="w-full bg-indigo-600 text-white p-3 rounded-lg hover:bg-indigo-500 font-medium transition-all shadow-lg shadow-indigo-900/30 mt-2">
          Create Account
        </button>
      </form>
      <p className="mt-6 text-center text-gray-400 text-sm">
        Already have an account? <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-medium">Login</Link>
      </p>
    </div>
  );
};

export default Register;
