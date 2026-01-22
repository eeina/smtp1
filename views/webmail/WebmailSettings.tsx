import React, { useState } from 'react';
import { User } from '../../types';
import api from '../../api';
import { useToast } from '../../components/ToastContext';

interface Props {
  user: User;
  onClose: () => void;
  onLogout: () => void;
}

const WebmailSettings = ({ user, onClose, onLogout }: Props) => {
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState('profile');
  
  const [firstName, setFirstName] = useState(user.first_name || '');
  const [lastName, setLastName] = useState(user.last_name || '');
  const [signature, setSignature] = useState(user.signature || '');
  
  const [newPassword, setNewPassword] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSaveProfile = async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);
      try {
          await api.put('/api/webmail/profile', { first_name: firstName, last_name: lastName, signature });
          addToast('Profile saved', 'success');
      } catch(e) {
          addToast('Error saving profile', 'error');
      } finally {
          setLoading(false);
      }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);
      try {
          await api.put('/api/webmail/password', { currentPassword, newPassword });
          addToast('Password updated', 'success');
          setCurrentPassword('');
          setNewPassword('');
      } catch(e) {
          addToast('Error updating password', 'error');
      } finally {
          setLoading(false);
      }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <div className="bg-zinc-900 border border-zinc-800 w-full max-w-lg rounded-xl shadow-2xl overflow-hidden text-zinc-300">
            <div className="px-6 py-4 border-b border-zinc-800 flex justify-between items-center bg-black">
                <h2 className="font-bold text-white">Settings</h2>
                <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            </div>

            <div className="flex border-b border-zinc-800">
                <button onClick={() => setActiveTab('profile')} className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'profile' ? 'text-white border-b-2 border-emerald-500 bg-zinc-800/50' : 'text-zinc-500 hover:text-zinc-300'}`}>Profile</button>
                <button onClick={() => setActiveTab('security')} className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'security' ? 'text-white border-b-2 border-emerald-500 bg-zinc-800/50' : 'text-zinc-500 hover:text-zinc-300'}`}>Security</button>
            </div>

            <div className="p-6">
                {activeTab === 'profile' && (
                    <form onSubmit={handleSaveProfile} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">First Name</label>
                                <input type="text" className="w-full bg-black border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none transition-colors" value={firstName} onChange={e => setFirstName(e.target.value)} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Last Name</label>
                                <input type="text" className="w-full bg-black border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none transition-colors" value={lastName} onChange={e => setLastName(e.target.value)} />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Signature</label>
                            <textarea className="w-full h-24 bg-black border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none transition-colors resize-none" value={signature} onChange={e => setSignature(e.target.value)} placeholder="Email signature..." />
                        </div>
                        <button type="submit" disabled={loading} className="w-full bg-white text-black font-bold py-2 rounded-lg hover:bg-zinc-200 transition-colors disabled:opacity-50">
                            {loading ? 'Saving...' : 'Save Profile'}
                        </button>
                    </form>
                )}

                {activeTab === 'security' && (
                    <form onSubmit={handleChangePassword} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Current Password</label>
                            <input type="password" required className="w-full bg-black border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none transition-colors" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">New Password</label>
                            <input type="password" required minLength={6} className="w-full bg-black border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none transition-colors" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
                        </div>
                        <button type="submit" disabled={loading} className="w-full bg-white text-black font-bold py-2 rounded-lg hover:bg-zinc-200 transition-colors disabled:opacity-50">
                            {loading ? 'Updating...' : 'Update Password'}
                        </button>
                    </form>
                )}
            </div>
            
            <div className="bg-black px-6 py-4 flex justify-between items-center border-t border-zinc-800">
                 <button onClick={onLogout} className="text-red-500 text-sm font-bold hover:text-red-400">Sign Out</button>
                 <button onClick={onClose} className="text-zinc-500 text-sm font-bold hover:text-zinc-300">Cancel</button>
            </div>
        </div>
    </div>
  );
};

export default WebmailSettings;