
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Shield,
  Trash2,
  Search,
  Activity,
  Server,
  Globe,
  Settings,
  Save,
  Loader2,
  FileSpreadsheet,
  ArrowLeft,
  DollarSign,
  BarChart3,
  Plus
} from 'lucide-react';
import { User, Rank, Spreadsheet } from '../types';
import { api } from '../services/apiClient';

const AdminStats = ({ userCount }: { userCount: number }) => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
    <div className="bg-[#111] border border-white/5 p-6 rounded-[24px] flex items-center gap-4 hover:border-white/10 transition-colors shadow-lg">
      <div className="p-4 bg-indigo-500/10 text-indigo-400 rounded-2xl border border-indigo-500/20">
        <Users size={24} />
      </div>
      <div>
        <p className="text-[#666] text-sm font-bold uppercase tracking-wider">Total Users</p>
        <h3 className="text-3xl font-bold text-white mt-1">{userCount.toLocaleString()}</h3>
        <p className="text-emerald-400 text-xs font-bold flex items-center gap-1 mt-1">
          <Activity size={12} /> Active Sync
        </p>
      </div>
    </div>
    <div className="bg-[#111] border border-white/5 p-6 rounded-[24px] flex items-center gap-4 hover:border-white/10 transition-colors shadow-lg">
      <div className="p-4 bg-emerald-500/10 text-emerald-400 rounded-2xl border border-emerald-500/20">
        <DollarSign size={24} />
      </div>
      <div>
        <p className="text-[#666] text-sm font-bold uppercase tracking-wider">PostgreSQL</p>
        <h3 className="text-3xl font-bold text-white mt-1">Connected</h3>
        <p className="text-[#666] text-xs font-bold mt-1">Node.js API Operational</p>
      </div>
    </div>
    <div className="bg-[#111] border border-white/5 p-6 rounded-[24px] flex items-center gap-4 hover:border-white/10 transition-colors shadow-lg">
      <div className="p-4 bg-pink-500/10 text-pink-400 rounded-2xl border border-pink-500/20">
        <BarChart3 size={24} />
      </div>
      <div>
        <p className="text-[#666] text-sm font-bold uppercase tracking-wider">System Health</p>
        <h3 className="text-3xl font-bold text-white mt-1">100%</h3>
        <p className="text-[#666] text-xs font-bold mt-1">All services reachable</p>
      </div>
    </div>
  </div>
);

export const Admin: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'content' | 'users' | 'settings'>('content');
  const [users, setUsers] = useState<any[]>([]);
  const [sheets, setSheets] = useState<Spreadsheet[]>([]);
  const [loading, setLoading] = useState(true);
  const [userSearch, setUserSearch] = useState('');
  const [apiKeys, setApiKeys] = useState({ rapid: '', qcApp: '', qcSecret: '' });
  const navigate = useNavigate();

  // Check authentication
  useEffect(() => {
    const isAuthenticated = localStorage.getItem('admin_authenticated');
    if (!isAuthenticated) {
      navigate('/');
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('admin_authenticated');
    localStorage.removeItem('admin_login_time');
    navigate('/');
  };

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'users') {
        const data = await api.get('/admin/users');
        setUsers(data);
      } else if (activeTab === 'content') {
        const data = await api.get('/spreadsheets');
        setSheets(data);
      } else if (activeTab === 'settings') {
        const settings = await api.get('/settings');
        setApiKeys({
          rapid: settings.rapid_api_key || '',
          qcApp: settings.qc_app_id || '',
          qcSecret: settings.qc_secret || ''
        });
      }
    } catch (err) {
      console.error("Failed to load admin data", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRankUpdate = async (userId: string, newRank: string) => {
    try {
      await api.put(`/admin/users/${userId}/rank`, { rank: newRank });
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, rank: newRank } : u));
    } catch (err) {
      alert("Failed to update rank");
    }
  };

  const saveSettings = async () => {
    setLoading(true);
    try {
      await api.post('/admin/settings', [
        { key: 'rapid_api_key', value: apiKeys.rapid },
        { key: 'qc_app_id', value: apiKeys.qcApp },
        { key: 'qc_secret', value: apiKeys.qcSecret }
      ]);
      alert("Backend settings updated successfully!");
    } catch (err) {
      alert("Error saving settings");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] pt-28 pb-12">
      {/* Header */}
      <div className="sticky top-24 z-30 bg-[#050505]/95 backdrop-blur-md border-b border-white/5 py-4 px-6 md:px-12 flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/')} className="p-2 hover:bg-white/10 rounded-full transition-colors text-[#666] hover:text-white"><ArrowLeft size={24} /></button>
          <Shield size={28} className="text-red-500" />
          <h1 className="text-2xl font-bold text-white">Admin Control Panel</h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex gap-2 bg-[#1A1A1A] p-1 rounded-xl border border-white/5">
            <button onClick={() => setActiveTab('content')} className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'content' ? 'bg-white text-black' : 'text-[#666] hover:text-white'}`}>Content</button>
            <button onClick={() => setActiveTab('users')} className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'users' ? 'bg-white text-black' : 'text-[#666] hover:text-white'}`}>Users</button>
            <button onClick={() => setActiveTab('settings')} className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'settings' ? 'bg-primary text-black' : 'text-[#666] hover:text-white'}`}>Settings</button>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl text-sm font-bold transition-all flex items-center gap-2"
          >
            <ArrowLeft size={16} />
            Logout
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <AdminStats userCount={users.length || 0} />

        {activeTab === 'users' && (
          <div className="bg-[#111] border border-white/5 rounded-3xl overflow-hidden animate-fade-in-up">
            <div className="p-6 border-b border-white/5 bg-[#161616] flex justify-between items-center">
              <h3 className="text-lg font-bold text-white flex items-center gap-2"><Users size={20} className="text-primary" /> User Management</h3>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 text-[#666]" size={16} />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={userSearch}
                  onChange={e => setUserSearch(e.target.value)}
                  className="bg-[#0A0A0A] border border-white/10 rounded-xl pl-9 pr-4 py-2 text-sm text-white focus:border-primary outline-none w-64"
                />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-[#0A0A0A] text-[#666] text-xs font-bold uppercase tracking-wider">
                  <tr>
                    <th className="p-5">User</th>
                    <th className="p-5">Rank</th>
                    <th className="p-5">Reputation</th>
                    <th className="p-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {users.filter(u => u.username.toLowerCase().includes(userSearch.toLowerCase())).map(u => (
                    <tr key={u.id} className="hover:bg-[#1A1A1A] transition-colors">
                      <td className="p-5">
                        <div className="font-bold text-white">{u.username}</div>
                        <div className="text-[10px] text-[#666]">{u.email}</div>
                      </td>
                      <td className="p-5">
                        <select
                          value={u.rank}
                          onChange={e => handleRankUpdate(u.id, e.target.value)}
                          className="bg-[#222] border border-white/10 rounded px-2 py-1 text-xs text-white outline-none focus:border-primary"
                        >
                          <option value="Bronze">Bronze</option>
                          <option value="Silver">Silver</option>
                          <option value="Gold">Gold</option>
                          <option value="Platinum">Platinum</option>
                          <option value="Admin">Admin</option>
                        </select>
                      </td>
                      <td className="p-5 text-[#888] font-mono">{u.reputation}</td>
                      <td className="p-5 text-right">
                        <button className="text-[#666] hover:text-red-500 transition-colors"><Trash2 size={18} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'content' && (
          <div className="space-y-8 animate-fade-in-up">
            <div className="bg-[#111] border border-white/5 rounded-3xl overflow-hidden">
              <div className="p-6 border-b border-white/5 bg-[#161616] flex justify-between items-center">
                <h3 className="text-lg font-bold text-white flex items-center gap-2"><FileSpreadsheet size={20} className="text-green-500" /> Spreadsheets</h3>
                <button className="px-4 py-2 bg-primary hover:bg-primaryHover text-black font-bold rounded-xl text-xs flex items-center gap-2"><Plus size={16} /> Add Sheet</button>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {sheets.map(s => (
                    <div key={s.id} className="bg-[#1A1A1A] p-4 rounded-2xl border border-white/5 flex justify-between items-center group">
                      <div>
                        <div className="font-bold text-white group-hover:text-primary transition-colors">{s.title}</div>
                        <div className="text-[10px] text-[#666] font-bold uppercase">{s.items} Items • By {s.author}</div>
                      </div>
                      <button className="p-2 text-[#444] hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="max-w-3xl mx-auto bg-[#111] border border-white/5 rounded-3xl overflow-hidden animate-fade-in-up">
            <div className="p-6 border-b border-white/5 bg-[#161616]">
              <h3 className="text-lg font-bold text-white flex items-center gap-2"><Settings size={20} className="text-primary" /> Backend Settings</h3>
            </div>
            <div className="p-8 space-y-8">
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-[#666] uppercase tracking-widest flex items-center gap-2"><Globe size={14} /> Data APIs</h4>
                <div>
                  <label className="block text-xs font-bold text-[#444] mb-2">RapidAPI Key</label>
                  <input
                    type="password"
                    value={apiKeys.rapid}
                    onChange={e => setApiKeys({ ...apiKeys, rapid: e.target.value })}
                    className="w-full bg-[#0A0A0A] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary outline-none"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-xs font-bold text-[#666] uppercase tracking-widest flex items-center gap-2"><Server size={14} /> QC Service (Pointshaul)</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#444] mb-2">App ID</label>
                    <input
                      type="text"
                      value={apiKeys.qcApp}
                      onChange={e => setApiKeys({ ...apiKeys, qcApp: e.target.value })}
                      className="w-full bg-[#0A0A0A] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#444] mb-2">Secret Key</label>
                    <input
                      type="password"
                      value={apiKeys.qcSecret}
                      onChange={e => setApiKeys({ ...apiKeys, qcSecret: e.target.value })}
                      className="w-full bg-[#0A0A0A] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-white/5">
                <button onClick={saveSettings} disabled={loading} className="w-full py-4 bg-primary hover:bg-primaryHover text-black font-bold rounded-xl transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2">
                  {loading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                  Save All Configs
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
