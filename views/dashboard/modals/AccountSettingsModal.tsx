import React, { useState, useEffect } from 'react';
import { User } from '../../../types';
import api from '../../../api';
import Spinner from '../../../components/Spinner';

interface Props {
  user: User;
  onClose: () => void;
  onUpdate: (user: Partial<User>) => void;
}

const AccountSettingsModal = ({ user, onClose, onUpdate }: Props) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'server'>('profile');
  
  // Profile State
  const [email, setEmail] = useState(user.email);
  const [firstName, setFirstName] = useState(user.first_name || '');
  const [lastName, setLastName] = useState(user.last_name || '');
  const [companyName, setCompanyName] = useState(user.company_name || '');
  const [recoveryEmail, setRecoveryEmail] = useState(user.recovery_email || '');
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMsg, setProfileMsg] = useState({ type: '', text: '' });

  // Password State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState({ type: '', text: '' });

  // Server Config State
  const [smtpHostname, setSmtpHostname] = useState('');
  const [systemEmailAddress, setSystemEmailAddress] = useState('');
  const [serverLoading, setServerLoading] = useState(false);
  const [serverMsg, setServerMsg] = useState({ type: '', text: '' });

  // Load Server Config when tab is clicked
  useEffect(() => {
    if (activeTab === 'server') {
        fetchServerConfig();
    }
  }, [activeTab]);

  const fetchServerConfig = async () => {
    setServerLoading(true);
    try {
        const res = await api.get('/api/system/config');
        setSmtpHostname(res.data.smtp_hostname || '');
        setSystemEmailAddress(res.data.system_email_address || '');
    } catch (err) {
        console.error(err);
    } finally {
        setServerLoading(false);
    }
  };

  const handleDetectHostname = async () => {
    setServerLoading(true);
    setServerMsg({ type: '', text: '' });
    try {
        const res = await api.get('/api/system/diagnostics');
        if (res.data.rdns && res.data.rdns.ptrs && res.data.rdns.ptrs.length > 0) {
            setSmtpHostname(res.data.rdns.ptrs[0]);
            setServerMsg({ type: 'success', text: `Detected: ${res.data.rdns.ptrs[0]}` });
        } else {
             setServerMsg({ type: 'error', text: 'Could not detect PTR record automatically. Please enter it manually.' });
        }
    } catch (err) {
        setServerMsg({ type: 'error', text: 'Detection failed.' });
    } finally {
        setServerLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileMsg({ type: '', text: '' });
    
    try {
        const res = await api.put('/api/account/profile', { 
            email, 
            company_name: companyName, 
            recovery_email: recoveryEmail,
            first_name: firstName,
            last_name: lastName
        });
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

  const handleUpdateServer = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerLoading(true);
    setServerMsg({ type: '', text: '' });

    try {
        await api.put('/api/system/config', { smtp_hostname: smtpHostname, system_email_address: systemEmailAddress });
        setServerMsg({ type: 'success', text: 'Server configuration saved' });
    } catch (err: any) {
        setServerMsg({ type: 'error', text: err.response?.data?.error || 'Failed to save config' });
    } finally {
        setServerLoading(false);
    }
  };

  const TabButton = ({ id, label }: { id: typeof activeTab, label: string }) => (
    <button 
        className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === id ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50' : 'text-gray-500 hover:text-gray-700'}`}
        onClick={() => setActiveTab(id)}
    >
        {label}
    </button>
  );

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 transition-opacity backdrop-blur-sm" onClick={onClose}></div>
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
        
        <div className="inline-block align-bottom bg-white rounded-xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-md w-full">
          
          <div className="bg-gray-50 px-4 py-3 border-b border-gray-100 flex justify-between items-center">
            <h3 className="text-lg font-bold text-gray-900">Settings</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          <div className="flex border-b border-gray-100">
            <TabButton id="profile" label="Profile" />
            <TabButton id="security" label="Security" />
            <TabButton id="server" label="Server Config" />
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
                    <div className="grid grid-cols-2 gap-3">
                         <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">First Name</label>
                            <input 
                                type="text" 
                                className="w-full border-gray-200 bg-gray-50 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                value={firstName}
                                onChange={e => setFirstName(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Last Name</label>
                            <input 
                                type="text" 
                                className="w-full border-gray-200 bg-gray-50 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                value={lastName}
                                onChange={e => setLastName(e.target.value)}
                            />
                        </div>
                    </div>
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
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Recovery Email</label>
                        <input 
                            type="email" 
                            className="w-full border-gray-200 bg-gray-50 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                            value={recoveryEmail}
                            onChange={e => setRecoveryEmail(e.target.value)}
                            placeholder="To reset your password"
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

            {/* SERVER TAB */}
            {activeTab === 'server' && (
                <form onSubmit={handleUpdateServer} className="space-y-4">
                    {serverMsg.text && (
                        <div className={`text-sm p-3 rounded-lg ${serverMsg.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                            {serverMsg.text}
                        </div>
                    )}
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Server Hostname (HELO/EHLO)</label>
                        <div className="flex gap-2">
                            <input 
                                type="text" 
                                className="flex-1 border-gray-200 bg-gray-50 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none font-mono"
                                placeholder="e.g. mail.your-domain.com"
                                value={smtpHostname}
                                onChange={e => setSmtpHostname(e.target.value)}
                            />
                            <button
                                type="button"
                                onClick={handleDetectHostname}
                                disabled={serverLoading}
                                className="bg-gray-100 text-gray-700 px-3 py-2 rounded-lg text-xs font-bold hover:bg-gray-200 transition border border-gray-200 whitespace-nowrap"
                            >
                                {serverLoading ? 'Detecting...' : 'Auto-Detect'}
                            </button>
                        </div>
                        <p className="text-xs text-gray-400 mt-2 leading-relaxed">
                            This hostname is announced to other mail servers. For best deliverability, this <strong>must match</strong> your Reverse DNS (PTR) record.
                        </p>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">System Sender Email</label>
                        <input 
                            type="email" 
                            className="w-full border-gray-200 bg-gray-50 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                            placeholder="noreply@yourdomain.com"
                            value={systemEmailAddress}
                            onChange={e => setSystemEmailAddress(e.target.value)}
                        />
                        <p className="text-xs text-gray-400 mt-2">
                            The "From" address for system notifications (OTP, alerts). Ensure this domain is verified.
                        </p>
                    </div>

                    <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                         <h4 className="text-xs font-bold text-blue-800 uppercase mb-1">Recommendation</h4>
                         <p className="text-xs text-blue-700">
                             Use the Auto-Detect button above to find your correct hostname from your server provider.
                         </p>
                    </div>

                    <div className="pt-2">
                        <button 
                            type="submit" 
                            disabled={serverLoading}
                            className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition flex justify-center items-center"
                        >
                            {serverLoading ? <Spinner /> : 'Save Configuration'}
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