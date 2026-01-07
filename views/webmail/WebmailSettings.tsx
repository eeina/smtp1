import React, { useState } from 'react';
import { User } from '../../types';
import api from '../../api';
import Spinner from '../../components/Spinner';
import { useToast } from '../../components/ToastContext';

interface Props {
  user: User;
  onClose: () => void;
  onLogout: () => void;
}

const WebmailSettings = ({ user, onClose, onLogout }: Props) => {
  const { addToast } = useToast();
  const [settingsTab, setSettingsTab] = useState<'config' | 'profile' | 'security'>('config');
  
  // Profile/Signature state
  const [firstName, setFirstName] = useState(user.first_name || '');
  const [lastName, setLastName] = useState(user.last_name || '');
  const [signature, setSignature] = useState(user.signature || '');
  const [profileLoading, setProfileLoading] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passLoading, setPassLoading] = useState(false);

  const handleUpdateProfile = async (e: React.FormEvent) => {
      e.preventDefault();
      setProfileLoading(true);
      try {
          const res = await api.put('/api/webmail/profile', { first_name: firstName, last_name: lastName, signature });
          addToast('Profile updated', 'success');
          // Update local user state if we had a global state management, but since it's passed via props, we'd need a callback. 
          // For now, it updates the backend correctly.
      } catch (err: any) {
          addToast(err.response?.data?.error || 'Failed to update profile', 'error');
      } finally {
          setProfileLoading(false);
      }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
      e.preventDefault();
      setPassLoading(true);
      try {
          await api.put('/api/webmail/password', { currentPassword, newPassword });
          addToast('Password updated successfully', 'success');
          setCurrentPassword('');
          setNewPassword('');
      } catch (err: any) {
          addToast(err.response?.data?.error || 'Failed to update password', 'error');
      } finally {
          setPassLoading(false);
      }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
        <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                <h3 className="text-lg font-bold text-gray-900">App Settings</h3>
                <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            </div>
            
            <div className="flex border-b border-gray-100">
                <button 
                    onClick={() => setSettingsTab('config')} 
                    className={`flex-1 py-3 text-sm font-medium transition-colors ${settingsTab === 'config' ? 'text-green-600 border-b-2 border-green-600 bg-green-50/50' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Info
                </button>
                <button 
                    onClick={() => setSettingsTab('profile')} 
                    className={`flex-1 py-3 text-sm font-medium transition-colors ${settingsTab === 'profile' ? 'text-green-600 border-b-2 border-green-600 bg-green-50/50' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Profile
                </button>
                <button 
                    onClick={() => setSettingsTab('security')} 
                    className={`flex-1 py-3 text-sm font-medium transition-colors ${settingsTab === 'security' ? 'text-green-600 border-b-2 border-green-600 bg-green-50/50' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Security
                </button>
            </div>

            <div className="p-6">
                {settingsTab === 'config' && (
                    <div className="space-y-4">
                        <div className="bg-green-50 text-green-800 p-4 rounded-xl text-sm mb-2 border border-green-100 flex gap-3">
                            <svg className="w-5 h-5 flex-shrink-0 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            <p>External App Configuration</p>
                        </div>
                        <div className="grid grid-cols-3 items-center text-sm"><span className="font-medium text-gray-500">SMTP Host</span><code className="col-span-2 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100 block text-gray-800 font-mono select-all">{window.location.hostname}</code></div>
                        <div className="grid grid-cols-3 items-center text-sm"><span className="font-medium text-gray-500">Port</span><code className="col-span-2 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100 block text-gray-800 font-mono">587 (No SSL)</code></div>
                        <div className="grid grid-cols-3 items-center text-sm"><span className="font-medium text-gray-500">Username</span><code className="col-span-2 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100 block text-gray-800 font-mono select-all">{user.email}</code></div>
                    </div>
                )}

                {settingsTab === 'profile' && (
                    <form onSubmit={handleUpdateProfile} className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">First Name</label>
                                <input type="text" className="w-full border-gray-200 bg-gray-50 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none" value={firstName} onChange={e => setFirstName(e.target.value)} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Last Name</label>
                                <input type="text" className="w-full border-gray-200 bg-gray-50 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none" value={lastName} onChange={e => setLastName(e.target.value)} />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Email Signature</label>
                            <textarea 
                                className="w-full border-gray-200 bg-gray-50 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none h-24 resize-none font-sans"
                                value={signature}
                                onChange={e => setSignature(e.target.value)}
                                placeholder="Best regards,&#10;Eeina Health Team"
                            />
                            <p className="text-[10px] text-gray-400 mt-1 uppercase font-black tracking-widest">Appended to new emails</p>
                        </div>
                        <button type="submit" disabled={profileLoading} className="w-full bg-green-600 text-white px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-green-700 transition flex justify-center items-center">
                            {profileLoading ? <Spinner /> : 'Save Profile'}
                        </button>
                    </form>
                )}

                {settingsTab === 'security' && (
                    <form onSubmit={handleChangePassword} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Current Password</label>
                            <input type="password" required className="w-full border-gray-200 bg-gray-50 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">New Password</label>
                            <input type="password" required minLength={6} className="w-full border-gray-200 bg-gray-50 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
                        </div>
                        <button type="submit" disabled={passLoading} className="w-full bg-green-600 text-white px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-green-700 transition flex justify-center items-center">
                            {passLoading ? <Spinner /> : 'Update Password'}
                        </button>
                    </form>
                )}
            </div>
            <div className="px-6 py-4 bg-gray-50 flex justify-between items-center">
                <button onClick={onLogout} className="text-sm font-black uppercase tracking-widest text-red-500 hover:text-red-700">Logout</button>
                <button onClick={onClose} className="text-sm font-bold text-gray-600 hover:text-gray-900 bg-white border border-gray-300 px-4 py-2 rounded-xl hover:bg-gray-50 transition-colors">Close</button>
            </div>
        </div>
    </div>
  );
};

export default WebmailSettings;