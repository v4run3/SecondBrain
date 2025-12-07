import { useState, useEffect, useRef } from 'react';
import { User, Camera, Key, Save, Loader2, ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';

const Profile = () => {
    const [user, setUser] = useState(null);
    const [name, setName] = useState('');
    const [bio, setBio] = useState('');
    const [apiKey, setApiKey] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const fileInputRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        fetchProfile();
        const savedKey = localStorage.getItem('groqApiKey');
        if (savedKey) setApiKey(savedKey);
    }, []);

    const fetchProfile = async () => {
        try {
            const res = await api.get('/user/profile');
            setUser(res.data);
            setName(res.data.name);
            setBio(res.data.bio || '');
        } catch (err) {
            console.error(err);
            setError('Failed to load profile');
        } finally {
             setLoading(false);
        }
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMessage('');
        setError('');

        try {
            // Update Backend Profile
            const res = await api.put('/user/profile', { name, bio });
            setUser(res.data);
            
            // Update Local Storage API Key
            if (apiKey.trim()) {
                 if (!apiKey.startsWith('gsk_')) {
                    setError('Invalid API Key format. Must start with "gsk_"');
                    setSaving(false);
                    return;
                }
                localStorage.setItem('groqApiKey', apiKey.trim());
            } else {
                localStorage.removeItem('groqApiKey');
            }

            setMessage('Profile updated successfully!');
            setTimeout(() => setMessage(''), 3000);
        } catch (err) {
            setError(err.response?.data?.message || 'Update failed');
        } finally {
            setSaving(false);
        }
    };

    const handleAvatarUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('avatar', file);

        setUploading(true);
        try {
            const res = await api.post('/user/profile/avatar', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            // Update user state with new avatar URL
            setUser(prev => ({ ...prev, profilePicture: res.data.profilePicture }));
            setMessage('Avatar updated!');
            setTimeout(() => setMessage(''), 3000);
        } catch (err) {
            console.error(err);
            setError('Failed to upload avatar');
        } finally {
            setUploading(false);
        }
    };

    const getAvatarUrl = (path) => {
        if (!path) return null;
        if (path.startsWith('http')) return path;
        return `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}${path}`;
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">
                <Loader2 className="animate-spin w-8 h-8 text-indigo-500" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-900 text-gray-100 p-6">
            <div className="max-w-2xl mx-auto">
                <div className="mb-8 flex items-center gap-4">
                    <Link to="/dashboard" className="p-2 rounded-full hover:bg-gray-800 transition-colors">
                        <ArrowLeft className="w-6 h-6 text-gray-400" />
                    </Link>
                    <h1 className="text-3xl font-bold">Profile Settings</h1>
                </div>

                <div className="bg-gray-800 rounded-xl shadow-lg border border-gray-700 p-8">
                    {/* Avatar Section */}
                    <div className="flex flex-col items-center mb-8">
                        <div className="relative group">
                            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-gray-700 bg-gray-900 flex items-center justify-center">
                                {user?.profilePicture ? (
                                    <img 
                                        src={getAvatarUrl(user.profilePicture)} 
                                        alt="Profile" 
                                        className="w-full h-full object-cover"
                                        onError={(e) => { e.target.src = null; }} // Fallback if image fails
                                    />
                                ) : (
                                    <User className="w-16 h-16 text-gray-500" />
                                )}
                            </div>
                            <button 
                                onClick={() => fileInputRef.current?.click()}
                                className="absolute bottom-0 right-0 p-2 bg-indigo-600 rounded-full hover:bg-indigo-500 transition-colors shadow-lg border-2 border-gray-800 group-hover:scale-110"
                                title="Change Avatar"
                            >
                                {uploading ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : <Camera className="w-4 h-4 text-white" />}
                            </button>
                            <input 
                                type="file" 
                                ref={fileInputRef} 
                                className="hidden" 
                                accept="image/*"
                                onChange={handleAvatarUpload}
                            />
                        </div>
                        <h2 className="mt-4 text-xl font-semibold">{user?.name}</h2>
                        <p className="text-gray-400 text-sm">@{user?.username || 'username'}</p>
                        <p className="text-gray-500 text-xs mt-1">{user?.email}</p>
                    </div>

                    {/* Feedback Messages */}
                    {message && (
                        <div className="mb-6 p-4 bg-green-900/30 border border-green-800 text-green-300 rounded-lg text-center font-medium">
                            {message}
                        </div>
                    )}
                    {error && (
                        <div className="mb-6 p-4 bg-red-900/30 border border-red-800 text-red-300 rounded-lg text-center font-medium">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleUpdateProfile} className="space-y-6">
                        {/* Personal Info */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold border-b border-gray-700 pb-2 mb-4">Personal Information</h3>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Full Name</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                                    placeholder="Your Name"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Bio</label>
                                <textarea
                                    value={bio}
                                    onChange={(e) => setBio(e.target.value)}
                                    rows="3"
                                    className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                                    placeholder="Tell us a little about yourself..."
                                />
                            </div>
                        </div>

                        {/* API Configuration */}
                        <div className="space-y-4 pt-4">
                            <h3 className="text-lg font-semibold border-b border-gray-700 pb-2 mb-4 flex items-center gap-2">
                                <Key className="w-5 h-5 text-indigo-400" />
                                API Configuration
                            </h3>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Groq API Key</label>
                                <div className="relative">
                                    <input
                                        type="password"
                                        value={apiKey}
                                        onChange={(e) => setApiKey(e.target.value)}
                                        className="w-full p-3 pl-10 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all placeholder-gray-500"
                                        placeholder="gsk_..."
                                    />
                                    <Key className="w-5 h-5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                                </div>
                                <p className="mt-2 text-xs text-gray-400">
                                    Required for AI Chat functionality.Get one from <a href="https://groq.com" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline">Groq</a>. Stored locally on your device.
                                </p>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="pt-6 flex justify-end">
                            <button
                                type="submit"
                                disabled={saving}
                                className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 font-medium shadow-lg shadow-indigo-900/30 flex items-center gap-2 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                                Save Changes
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Profile;
