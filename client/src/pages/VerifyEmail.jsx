import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../api';
import { Mail, ArrowRight, Loader2 } from 'lucide-react';

const VerifyEmail = ({ setUser }) => {
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email;

  useEffect(() => {
    if (!email) {
      navigate('/register');
    }
  }, [email, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await api.post('/auth/verify-email', { email, otp });
      localStorage.setItem('token', res.data.token);
      setUser({ token: res.data.token, ...res.data });
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Verification failed');
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-20 bg-gray-800 p-8 rounded-xl shadow-lg border border-gray-700">
      <div className="flex justify-center mb-6">
        <div className="bg-indigo-900/50 p-4 rounded-full">
            <Mail className="w-8 h-8 text-indigo-400" />
        </div>
      </div>
      
      <h2 className="text-2xl font-bold mb-2 text-white text-center">Verify your Email</h2>
      <p className="text-gray-400 text-center mb-8 text-sm">
        We've sent a 6-digit code to <span className="text-indigo-300 font-medium">{email}</span>
      </p>

      {error && (
        <div className="mb-6 p-3 bg-red-900/30 border border-red-800 text-red-300 rounded text-sm text-center">
            {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-gray-400 text-xs font-medium mb-2 uppercase tracking-wide">Verification Code</label>
          <input
            type="text"
            className="w-full p-4 bg-gray-900 border border-gray-600 rounded-lg text-white text-center text-2xl font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all placeholder-gray-700"
            value={otp}
            onChange={(e) => {
                // limit to 6 digits
                const val = e.target.value.replace(/\D/g, ''); 
                if (val.length <= 6) setOtp(val);
            }}
            required
            placeholder="000000"
            autoFocus
          />
        </div>

        <button 
            type="submit" 
            disabled={loading || otp.length !== 6}
            className="w-full bg-indigo-600 text-white p-3 rounded-lg hover:bg-indigo-500 font-medium transition-all shadow-lg shadow-indigo-900/30 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? <Loader2 className="animate-spin w-5 h-5"/> : <>Verify Email <ArrowRight className="w-4 h-4" /></>}
        </button>
      </form>
    </div>
  );
};

export default VerifyEmail;
