import React, { useState } from 'react';
import { User } from '../../../types';
import api from '../../../api';
import Spinner from '../../../components/Spinner';

interface Props {
  user: User;
  onClose: () => void;
  onUpdate: (user: Partial<User>) => void;
}

const AccountSettingsModal = ({ user, onClose, onUpdate }: Props) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'security'>('profile');
  
  // Profile State
  const [email, setEmail] = useState(user.email);
  const [companyName, setCompanyName] = useState(user.company_name || '');
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMsg, setProfileMsg] = useState({ type: '', text: '' });

  // Password State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState({ type: '', text: '' });

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileMsg({ type: '', text: '' });
    
    try {
        const res = await api.put('/api/account/profile', { email, company_name: companyName });
        onUpdate(res.data.user);
        setProfileMsg({ type: 'success', text: 'Profile updated successfully' });
    } catch (err: any) {
        setProfileMsg({ type: 'error', text: err.response?.data?.error || 'Failed to update profile' });
    } finally {
        setProfileLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordLoading(true);
    setPasswordMsg({ type: '', text: '' });

    try {
        await api.put('/api/account/password', { currentPassword, newPassword });
        setPasswordMsg({ type: 'success', text: 'Password updated successfully' });
        setCurrentPassword('');
        setNewPassword('');
    } catch (err: any) {
        setPasswordMsg({ type: 'error', text: err.response?.data?.error || 'Failed to update password' });
    } finally {
        setPasswordLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 transition-opacity backdrop-blur-sm" onClick={onClose}></div>
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
        
        <div className="inline-block align-bottom bg-white rounded-xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-md w-full">
          
          <div className="bg-gray-50 px-4 py-3 border-b border-gray-100 flex justify-between items-center">
            <h3 className="text-lg font-bold text-gray-900">Account Settings</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          <div className="flex border-b border-gray-100">
            <button 
                className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'profile' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50' : 'text-gray-500 hover:text-gray-700'}`}
                onClick={() => setActiveTab('profile')}
            >
                Profile Info
            </button>
            <button 
                className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'security' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50' : 'text-gray-500 hover:text-gray-700'}`}
                onClick={() => setActiveTab('security')}
            >
                Security
            </button>
          </div>

          <div className="p-6">
            {/* PROFILE TAB */}
            {activeTab === 'profile' && (
                <form onSubmit={handleUpdateProfile} className="space-y-4">
                    {profileMsg.text && (
                        <div className={`text-sm p-3 rounded-lg ${profileMsg.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                            {profileMsg.text}
                        </div>
                    )}
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Email Address</label>
                        <input 
                            type="email" 
                            required 
                            className="w-full border-gray-200 bg-gray-50 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Company Name</label>
                        <input 
                            type="text" 
                            className="w-full border-gray-200 bg-gray-50 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                            value={companyName}
                            onChange={e => setCompanyName(e.target.value)}
                        />
                    </div>
                    <div className="pt-2">
                        <button 
                            type="submit" 
                            disabled={profileLoading}
                            className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition flex justify-center items-center"
                        >
                            {profileLoading ? <Spinner /> : 'Save Changes'}
                        </button>
                    </div>
                </form>
            )}

            {/* SECURITY TAB */}
            {activeTab === 'security' && (
                <form onSubmit={handleUpdatePassword} className="space-y-4">
                    {passwordMsg.text && (
                        <div className={`text-sm p-3 rounded-lg ${passwordMsg.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                            {passwordMsg.text}
                        </div>
                    )}
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Current Password</label>
                        <input 
                            type="password" 
                            required 
                            className="w-full border-gray-200 bg-gray-50 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                            value={currentPassword}
                            onChange={e => setCurrentPassword(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">New Password</label>
                        <input 
                            type="password" 
                            required 
                            minLength={6}
                            className="w-full border-gray-200 bg-gray-50 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                            value={newPassword}
                            onChange={e => setNewPassword(e.target.value)}
                        />
                        <p className="text-xs text-gray-400 mt-1">Must be at least 6 characters long</p>
                    </div>
                    <div className="pt-2">
                        <button 
                            type="submit" 
                            disabled={passwordLoading}
                            className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition flex justify-center items-center"
                        >
                            {passwordLoading ? <Spinner /> : 'Update Password'}
                        </button>
                    </div>
                </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountSettingsModal;