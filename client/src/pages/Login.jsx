import { useState } from 'react';
import api from '../api';
import { Link } from 'react-router-dom';

const Login = ({ setUser }) => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/auth/login', { identifier, password });
      localStorage.setItem('token', res.data.token);
      setUser({ token: res.data.token, ...res.data });
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 bg-gray-800 p-8 rounded-xl shadow-lg border border-gray-700">
      <h2 className="text-3xl font-bold mb-6 text-white text-center">Login</h2>
      {error && <p className="text-red-400 mb-4 bg-red-900/20 p-3 rounded border border-red-800 text-sm text-center">{error}</p>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-gray-300 text-sm font-medium mb-1">Email or Username</label>
          <input
            type="text"
            className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            required
            placeholder="Enter your email or username"
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
            placeholder="Enter your password"
          />
        </div>
        <button type="submit" className="w-full bg-indigo-600 text-white p-3 rounded-lg hover:bg-indigo-500 font-medium transition-all shadow-lg shadow-indigo-900/30 mt-2">
          Sign In
        </button>
      </form>
      <p className="mt-6 text-center text-gray-400 text-sm">
        Don't have an account? <Link to="/register" className="text-indigo-400 hover:text-indigo-300 font-medium">Register</Link>
      </p>
    </div>
  );
};

export default Login;
