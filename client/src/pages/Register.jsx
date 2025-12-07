import { useState } from 'react';
import api from '../api';
import { Link } from 'react-router-dom';

const Register = ({ setUser }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Password validation logic
    const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
    if (!passwordRegex.test(password)) {
      setError('Password must be at least 8 characters long and contain at least one uppercase letter, one number, and one special character.');
      return;
    }

    try {
      const res = await api.post('/auth/register', { name, email, username, password });
      localStorage.setItem('token', res.data.token);
      setUser({ token: res.data.token, ...res.data });
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
            className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="Enter your name"
          />
        </div>
        <div>
          <label className="block text-gray-300 text-sm font-medium mb-1">Username</label>
          <input
            type="text"
            className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            placeholder="Choose a username"
          />
        </div>
        <div>
          <label className="block text-gray-300 text-sm font-medium mb-1">Email</label>
          <input
            type="email"
            className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="Enter your email"
          />
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
