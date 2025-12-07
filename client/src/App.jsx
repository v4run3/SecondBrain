import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, Link } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Landing from './pages/Landing';
import Profile from './pages/Profile';
import { useState, useEffect, useRef } from 'react';
import { Brain, User, LogOut, ChevronDown } from 'lucide-react';
import api from './api';

function AppContent() {
  const [user, setUser] = useState(null);
  const location = useLocation();
  const isLanding = location.pathname === '/';
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          // Set initial token state to avoid flickering login screen
          setUser({ token }); 
          const res = await api.get('/user/profile');
          setUser({ token, ...res.data });
        } catch (err) {
          console.error("Failed to fetch user", err);
          // If token is invalid, clear it
          if (err.response && err.response.status === 401) {
            localStorage.removeItem('token');
            setUser(null);
          }
        }
      }
    };
    fetchUser();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setIsDropdownOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      {!isLanding && (
        <nav className="bg-gray-800 shadow-lg border-b border-gray-700 p-4">
          <div className="container mx-auto flex justify-between items-center">
            <Link to="/" className="text-xl font-bold text-indigo-400 flex items-center gap-2 hover:text-indigo-300 transition-colors">
              <Brain className="w-6 h-6" />
              SecondBrain
            </Link>
            {user && (
              <div className="relative" ref={dropdownRef}>
                <button 
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center gap-2 hover:bg-gray-700 py-1.5 px-3 rounded-lg transition-colors focus:outline-none"
                >
                  <div className="w-8 h-8 rounded-full bg-gray-700 border border-gray-600 flex items-center justify-center overflow-hidden">
                    {user?.profilePicture ? (
                        <img 
                          src={user.profilePicture.startsWith('http') ? user.profilePicture : `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}${user.profilePicture}`} 
                          alt="Profile" 
                          className="w-full h-full object-cover"
                          onError={(e) => { e.target.src = null; }} 
                        />
                    ) : (
                        <User className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                  <ChevronDown size={16} className={`text-gray-400 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-xl shadow-xl border border-gray-700 py-1 z-50 animate-in fade-in zoom-in duration-200 origin-top-right">
                    <Link 
                      to="/profile" 
                      className="flex items-center gap-2 px-4 py-3 text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                      onClick={() => setIsDropdownOpen(false)}
                    >
                      <User size={18} />
                      Profile
                    </Link>
                    <button 
                      onClick={logout}
                      className="w-full flex items-center gap-2 px-4 py-3 text-red-400 hover:bg-gray-700 hover:text-red-300 transition-colors text-left border-t border-gray-700"
                    >
                      <LogOut size={18} />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </nav>
      )}
      <div className={!isLanding ? "p-4" : ""}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={!user ? <Login setUser={setUser} /> : <Navigate to="/dashboard" />} />
          <Route path="/register" element={!user ? <Register setUser={setUser} /> : <Navigate to="/dashboard" />} />
          <Route path="/dashboard" element={user ? <Dashboard /> : <Navigate to="/login" />} />
          <Route path="/profile" element={user ? <Profile /> : <Navigate to="/login" />} />
          {/* Fallback for unknown routes */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
