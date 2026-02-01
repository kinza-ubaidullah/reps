
import React, { useState, useEffect } from 'react';
import { User, Rank } from '../types';
import { User as UserIcon, Shield, Calendar, Edit2, Award, ArrowLeft, CheckCircle, Zap, Camera, X, Save, Loader2, Image as ImageIcon, Upload } from 'lucide-react';
import { RANK_COLORS } from '../constants';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/apiClient';
import { useWishlist } from '../context/WishlistContext';

interface ProfileProps {
  user: User;
}

const RANK_THRESHOLDS = {
  [Rank.BRONZE]: { min: 0, max: 100 },
  [Rank.SILVER]: { min: 100, max: 500 },
  [Rank.GOLD]: { min: 500, max: 1500 },
  [Rank.PLATINUM]: { min: 1500, max: 5000 },
  [Rank.ADMIN]: { min: 0, max: 999999 }
};

export const Profile: React.FC<ProfileProps> = ({ user: initialUser }) => {
  const navigate = useNavigate();
  const { items } = useWishlist();
  const [user, setUser] = useState<User>(initialUser);
  const [loading, setLoading] = useState(false);
  const [claimedDaily, setClaimedDaily] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  useEffect(() => {
    setUser(initialUser);
  }, [initialUser]);

  const calculateProgress = (reputation: number, rank: Rank) => {
    if (rank === Rank.ADMIN) return 100;
    const currentTier = RANK_THRESHOLDS[rank];
    const totalRange = currentTier.max - currentTier.min;
    const progressInTier = reputation - currentTier.min;
    return Math.round(Math.min(100, Math.max(0, (progressInTier / totalRange) * 100)));
  };

  const getNextRank = (rank: Rank) => {
    if (rank === Rank.BRONZE) return Rank.SILVER;
    if (rank === Rank.SILVER) return Rank.GOLD;
    if (rank === Rank.GOLD) return Rank.PLATINUM;
    return 'Max Level';
  };

  const currentProgress = calculateProgress(user.reputation, user.rank);
  const nextRank = getNextRank(user.rank);
  const pointsToNext = user.rank === Rank.ADMIN ? 0 : RANK_THRESHOLDS[user.rank].max - user.reputation;

  const handleDailyCheckIn = async () => {
    if (claimedDaily || loading) return;
    setLoading(true);

    try {
      const updatedUser = await api.post('/profile/checkin', {});
      setUser({
        ...user,
        reputation: updatedUser.reputation,
        rank: updatedUser.rank as Rank
      });
      setClaimedDaily(true);
    } catch (err) {
      console.error("Error claiming bonus:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12 pt-6 px-4 md:px-0">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate(-1)} className="w-10 h-10 flex items-center justify-center bg-[#1A1A1A] hover:bg-white hover:text-black rounded-full transition-all border border-white/10"><ArrowLeft size={20} /></button>
        <h1 className="text-2xl font-bold text-white">My Profile</h1>
      </div>

      <div className="bg-[#111] border border-white/10 rounded-3xl overflow-hidden shadow-2xl relative">
        <div className="h-48 relative bg-[#0A0A0A]">
          {user.banner ? <img src={user.banner} alt="Banner" className="w-full h-full object-cover opacity-80" /> : <div className="w-full h-full bg-gradient-to-r from-primary/20 via-orange-900/20 to-[#111]"></div>}
        </div>

        <div className="px-6 md:px-10 pb-10 relative">
          <div className="relative -mt-20 mb-6 flex flex-col md:flex-row justify-between items-end gap-4">
            <div className="w-32 h-32 rounded-full border-4 border-[#111] bg-slate-800 flex items-center justify-center overflow-hidden shadow-xl ring-2 ring-white/10 group relative">
              {user.avatar ? <img src={user.avatar} className="w-full h-full object-cover" /> : <UserIcon size={48} className="text-slate-400" />}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <button onClick={handleDailyCheckIn} disabled={claimedDaily || loading} className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all border shadow-lg ${claimedDaily ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-primary hover:bg-primaryHover text-black'}`}>
                {loading ? <Loader2 className="animate-spin" size={16} /> : (claimedDaily ? <CheckCircle size={16} /> : <Zap size={16} fill="currentColor" />)}
                {claimedDaily ? 'System Operational' : 'Daily Check-in (+15 Rep)'}
              </button>
              <button onClick={() => setIsEditModalOpen(true)} className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#222] hover:bg-[#333] rounded-xl text-sm font-bold text-white transition-colors border border-white/10"><Edit2 size={16} /> <span className="hidden sm:inline">Edit Profile</span></button>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row justify-between gap-8">
            <div className="flex-1">
              <h2 className="text-4xl font-bold flex flex-wrap items-center gap-3 text-white">
                {user.username}
                <span className={`text-sm px-3 py-1 rounded-lg border bg-[#1A1A1A] tracking-wider uppercase ${RANK_COLORS[user.rank]} border-white/10`}>{user.rank}</span>
              </h2>
              <div className="flex flex-wrap items-center gap-4 mt-4 text-[#888] text-sm font-medium">
                <span className="flex items-center gap-1.5"><Shield size={16} className="text-primary" /> ID: <span className="font-mono text-white/60">{String(user.id || 'Unknown').slice(0, 8)}...</span></span>
                <span className="flex items-center gap-1.5"><Calendar size={16} className="text-primary" /> Joined {new Date(user.joinDate).toLocaleDateString()}</span>
              </div>
              <p className="mt-6 text-[#ccc] leading-relaxed max-w-xl bg-[#1A1A1A] p-4 rounded-xl border border-white/5 italic">"{user.description || "Just joined the community."}"</p>
            </div>

            <div className="w-full lg:w-80 bg-[#161616] rounded-2xl p-6 border border-white/5 shadow-inner">
              <div className="flex items-center gap-3 mb-4 text-white font-bold text-lg"><Award size={24} className="text-yellow-500" /> Rank Progress</div>
              <div className="w-full bg-[#333] h-4 rounded-full overflow-hidden p-0.5 mb-2"><div className="bg-gradient-to-r from-primary to-orange-500 h-full rounded-full transition-all duration-1000" style={{ width: `${currentProgress}%` }}></div></div>
              <div className="flex justify-between items-center mt-3"><p className="text-sm text-white font-bold">{user.reputation} <span className="text-[#666] font-normal">Reputation</span></p><p className="text-xs text-primary font-bold">{pointsToNext > 0 ? `${pointsToNext} to next level` : 'Max Level'}</p></div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        <div className="bg-[#111] border border-white/10 rounded-2xl p-6 text-center hover:border-primary/30 transition-colors"><h3 className="text-3xl font-bold text-white mb-1">0</h3><p className="text-[#666] text-xs font-bold uppercase tracking-wider">Posts</p></div>
        <div className="bg-[#111] border border-white/10 rounded-2xl p-6 text-center hover:border-primary/30 transition-colors"><h3 className="text-3xl font-bold text-white mb-1">0</h3><p className="text-[#666] text-xs font-bold uppercase tracking-wider">Sheets</p></div>
        <div className="bg-[#111] border border-white/10 rounded-2xl p-6 text-center hover:border-primary/30 transition-colors"><h3 className="text-3xl font-bold text-white mb-1">{user.reputation}</h3><p className="text-[#666] text-xs font-bold uppercase tracking-wider">Reputation</p></div>
        <div className="bg-[#111] border border-white/10 rounded-2xl p-6 text-center hover:border-primary/30 transition-colors"><h3 className="text-3xl font-bold text-white mb-1">{items.length}</h3><p className="text-[#666] text-xs font-bold uppercase tracking-wider">Saved Items</p></div>
      </div>

      {isEditModalOpen && <EditProfileModal user={user} onClose={() => setIsEditModalOpen(false)} onUpdate={(updated) => setUser(updated)} />}
    </div>
  );
};

const EditProfileModal = ({ user, onClose, onUpdate }: { user: User, onClose: () => void, onUpdate: (u: User) => void }) => {
  const [username, setUsername] = useState(user.username);
  const [description, setDescription] = useState(user.description || '');
  const [avatarUrl, setAvatarUrl] = useState(user.avatar || '');
  const [bannerUrl, setBannerUrl] = useState(user.banner || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await api.put('/profile', { username, description, avatar_url: avatarUrl, banner_url: bannerUrl });
      onUpdate({ ...user, username, description, avatar: avatarUrl, banner: bannerUrl });
      onClose();
    } catch (err) {
      console.error("Update Error", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in-up">
      <div className="bg-[#111] w-full max-w-lg rounded-3xl border border-white/10 shadow-2xl overflow-hidden relative flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-[#161616]">
          <h3 className="text-xl font-bold text-white">Edit Profile</h3>
          <button onClick={onClose} className="text-[#666] hover:text-white transition-colors"><X size={24} /></button>
        </div>
        <div className="p-8 overflow-y-auto space-y-8">
          <div className="flex flex-col items-center gap-4">
            <div className="relative w-24 h-24 rounded-full bg-[#1A1A1A] border-2 border-dashed border-white/20 flex items-center justify-center overflow-hidden">
              {avatarUrl ? <img src={avatarUrl} className="w-full h-full object-cover" /> : <UserIcon className="text-[#444]" size={32} />}
            </div>
            <input type="text" value={avatarUrl} onChange={e => setAvatarUrl(e.target.value)} placeholder="Avatar URL" className="w-full bg-[#0A0A0A] border border-[#222] rounded-xl px-4 py-2 text-white outline-none focus:border-primary" />
          </div>
          <div className="space-y-4">
            <div><label className="text-xs font-bold text-[#666] uppercase">Username</label><input type="text" value={username} onChange={e => setUsername(e.target.value)} className="w-full bg-[#0A0A0A] border border-[#222] rounded-xl px-4 py-3 text-white focus:border-primary outline-none" /></div>
            <div><label className="text-xs font-bold text-[#666] uppercase">Bio</label><textarea value={description} onChange={e => setDescription(e.target.value)} className="w-full bg-[#0A0A0A] border border-[#222] rounded-xl px-4 py-3 text-white focus:border-primary outline-none" /></div>
          </div>
        </div>
        <div className="p-6 border-t border-white/5 bg-[#161616] flex justify-end gap-3">
          <button onClick={onClose} className="px-6 py-3 text-[#888] hover:text-white font-bold transition-colors">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="px-8 py-3 bg-primary hover:bg-primaryHover text-black font-bold rounded-xl transition-all shadow-lg flex items-center gap-2">
            {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />} Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};
