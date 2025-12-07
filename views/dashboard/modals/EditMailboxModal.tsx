import React, { useState } from 'react';
import { Mailbox } from '../../../types';
import api from '../../../api';
import Spinner from '../../../components/Spinner';

interface Props {
  mailbox: Mailbox;
  onClose: () => void;
  onSuccess: () => void;
}

const EditMailboxModal = ({ mailbox, onClose, onSuccess }: Props) => {
  const [password, setPassword] = useState('');
  const [quota, setQuota] = useState((mailbox as any).quota_bytes ? Math.round((mailbox as any).quota_bytes / 1024 / 1024 / 1024) : 1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
        const payload: any = {
            quota_bytes: quota * 1024 * 1024 * 1024
        };
        if (password) {
            payload.password = password;
        }

        await api.patch(`/api/mailboxes/${mailbox._id}`, payload);
        onSuccess();
    } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to update mailbox');
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 transition-opacity backdrop-blur-sm" onClick={onClose}></div>
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
        
        <div className="inline-block align-bottom bg-white rounded-xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-md w-full">
          <form onSubmit={handleSubmit}>
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-gray-900">Edit Mailbox</h3>
                    <p className="text-sm text-gray-500">{mailbox.email}</p>
                </div>
                
                {error && (
                    <div className="mb-4 bg-red-50 text-red-600 text-sm p-3 rounded-lg">
                        {error}
                    </div>
                )}

                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">New Password</label>
                        <input 
                            type="password" 
                            className="w-full border-gray-200 bg-gray-50 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                            placeholder="Leave blank to keep current"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            minLength={6}
                        />
                        <p className="text-xs text-gray-400 mt-1">Only enter if you want to change it.</p>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Storage Quota (GB)</label>
                        <input 
                            type="number" 
                            min="1"
                            max="50"
                            className="w-full border-gray-200 bg-gray-50 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                            value={quota}
                            onChange={e => setQuota(parseInt(e.target.value))}
                        />
                    </div>
                </div>
            </div>
            
            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full inline-flex justify-center rounded-lg border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm"
                >
                    {loading ? <Spinner /> : 'Save Changes'}
                </button>
                <button 
                    type="button" 
                    onClick={onClose} 
                    className="mt-3 w-full inline-flex justify-center rounded-lg border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                    Cancel
                </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditMailboxModal;