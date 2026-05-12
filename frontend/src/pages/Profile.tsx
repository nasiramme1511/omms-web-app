import React, { useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { User as UserIcon, Mail, Phone, MapPin, Building, Briefcase, Camera, Save, X } from 'lucide-react';
import OrgAdminPageHeader from '../components/org-admin/OrgAdminPageHeader';

const Profile: React.FC = () => {
  const { user, updateUser } = useAuth();
  const { pathname } = useLocation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isOrgProfile =
    pathname.startsWith('/org-admin/profile') || pathname.startsWith('/org/profile');
    
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: user?.address || '',
    organization_name: user?.organization_name || '',
    organization_type: user?.organization_type || '',
    sex: user?.sex || '',
    join_date: user?.join_date ? new Date(user?.join_date).toISOString().split('T')[0] : '',
  });

  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [removePhoto, setRemovePhoto] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', content: '' });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
      setRemovePhoto(false);
    }
  };

  const handleRemovePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
    setRemovePhoto(true);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', content: '' });

    try {
      const data = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          data.append(key, value);
        }
      });

      if (photoFile) {
        data.append('profile_photo', photoFile);
      }

      if (removePhoto) {
        data.append('remove_photo', 'true');
      }

      const response = await api.put('/auth/profile', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      updateUser(response.data);
      setMessage({ type: 'success', content: 'Profile updated successfully!' });
      setPhotoFile(null);
      setRemovePhoto(false);
    } catch (err: any) {
      setMessage({ type: 'error', content: err.response?.data?.message || 'Failed to update profile' });
    } finally {
      setLoading(false);
    }
  };

  const getProfilePhoto = () => {
    if (photoPreview) return photoPreview;
    if (removePhoto) return `https://ui-avatars.com/api/?name=${user?.name}&background=ecf39e&color=132a13`;
    if (user?.profile_photo_path) {
      return `/uploads/${user.profile_photo_path.replace(/\\/g, '/').replace(/^uploads[\/\\]/, '')}`;
    }
    return `https://ui-avatars.com/api/?name=${user?.name}&background=ecf39e&color=132a13`;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10 font-poppins">
      {isOrgProfile ? (
        <OrgAdminPageHeader
          title="Membership Profile"
          subtitle="View and edit your account information"
        />
      ) : (
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-black text-brand-dark tracking-tight">Account Settings</h1>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Sidebar Info */}
        <div className="lg:col-span-1 space-y-8">
           <div className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-gray-100 flex flex-col items-center text-center space-y-6">
              <div className="relative group">
                 <img
                    src={getProfilePhoto()}
                    alt="Profile"
                    className="w-32 h-32 rounded-[2rem] border-4 border-white shadow-xl ring-1 ring-gray-100 group-hover:scale-105 transition-all duration-500 object-cover"
                 />
                 <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    accept="image/*"
                 />
                 <button 
                    onClick={() => fileInputRef.current?.click()}
                    title="Change photo" 
                    type="button" 
                    className="absolute -bottom-2 -right-2 bg-brand-medium text-white p-3 rounded-2xl shadow-lg hover:bg-brand-light transition-all"
                 >
                    <Camera size={20} />
                 </button>
                 {(user?.profile_photo_path || photoPreview) && !removePhoto && (
                   <button 
                      onClick={handleRemovePhoto}
                      title="Remove photo" 
                      type="button" 
                      className="absolute -top-2 -right-2 bg-red-500 text-white p-2 rounded-xl shadow-lg hover:bg-red-600 transition-all"
                   >
                      <X size={16} />
                   </button>
                 )}
              </div>
              <div>
                 <h2 className="text-xl font-black text-brand-dark">{user?.name}</h2>
                 <p className="text-sm font-bold text-brand-deep opacity-60 uppercase tracking-widest mt-1">{user?.role}</p>
              </div>
              <div className="w-full pt-6 border-t border-gray-50 flex justify-center space-x-4">
                 <div className="px-4 py-2 bg-brand-pale/30 rounded-xl text-[10px] font-black text-brand-medium uppercase tracking-widest">
                    Verified
                 </div>
              </div>
           </div>

           <div className="bg-brand-dark rounded-[2rem] p-8 text-white space-y-6 shadow-xl relative overflow-hidden group">
              <div className="absolute -right-10 -top-10 w-32 h-32 bg-white opacity-5 rounded-full group-hover:scale-150 transition-transform duration-700"></div>
              <h3 className="text-lg font-black tracking-tight relative z-10">Account Security</h3>
              <p className="text-xs text-brand-pale/60 leading-relaxed relative z-10">Keep your account secure by enabling two-factor authentication and using a strong password.</p>
              <button type="button" className="w-full py-3 px-4 bg-brand-medium hover:bg-brand-light text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all relative z-10 shadow-lg shadow-brand-medium/20">
                 Change Password
              </button>
           </div>
        </div>

        {/* Main Form */}
        <div className="lg:col-span-2">
           <div className="bg-white rounded-[3rem] shadow-sm border border-gray-100 p-12">
              <form onSubmit={handleSubmit} className="space-y-10">
                 {message.content && (
                    <div className={`p-5 rounded-2xl text-sm font-bold border animate-fade-in-up ${
                      message.type === 'success' ? 'bg-brand-pale/30 text-brand-medium border-brand-pale/50' : 'bg-red-50 text-red-700 border-red-100'
                    }`}>
                       {message.content}
                    </div>
                 )}

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-brand-deep uppercase tracking-widest ml-1 opacity-50 flex items-center space-x-2">
                          <UserIcon size={14} />
                          <span>Full Name</span>
                       </label>
                       <input
                          name="name"
                          type="text"
                          required
                          value={formData.name}
                          onChange={handleChange}
                          className="w-full border-2 border-gray-50 bg-gray-50 rounded-2xl px-6 py-4 focus:border-brand-medium focus:ring-0 transition-all font-medium"
                       />
                    </div>

                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-brand-deep uppercase tracking-widest ml-1 opacity-50 flex items-center space-x-2">
                          <Mail size={14} />
                          <span>Email Address</span>
                       </label>
                       <input
                          name="email"
                          type="email"
                          required
                          value={formData.email}
                          onChange={handleChange}
                          className="w-full border-2 border-gray-50 bg-gray-50 rounded-2xl px-6 py-4 focus:border-brand-medium focus:ring-0 transition-all font-medium"
                       />
                    </div>

                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-brand-deep uppercase tracking-widest ml-1 opacity-50 flex items-center space-x-2">
                          <Phone size={14} />
                          <span>Phone Number</span>
                       </label>
                       <input
                          name="phone"
                          type="text"
                          value={formData.phone}
                          onChange={handleChange}
                          className="w-full border-2 border-gray-50 bg-gray-50 rounded-2xl px-6 py-4 focus:border-brand-medium focus:ring-0 transition-all font-medium"
                       />
                    </div>

                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-brand-deep uppercase tracking-widest ml-1 opacity-50 flex items-center space-x-2">
                          <MapPin size={14} />
                          <span>Address</span>
                       </label>
                       <input
                          name="address"
                          type="text"
                          value={formData.address}
                          onChange={handleChange}
                          className="w-full border-2 border-gray-50 bg-gray-50 rounded-2xl px-6 py-4 focus:border-brand-medium focus:ring-0 transition-all font-medium"
                       />
                    </div>

                    {user?.role === 'member' && (
                      <>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-brand-deep uppercase tracking-widest ml-1 opacity-50">Sex</label>
                          <select
                            name="sex"
                            title="Select sex"
                            value={formData.sex}
                            onChange={handleChange}
                            className="w-full border-2 border-gray-50 bg-gray-50 rounded-2xl px-6 py-4 focus:border-brand-medium focus:ring-0 transition-all font-medium appearance-none"
                          >
                            <option value="">Select Sex</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-brand-deep uppercase tracking-widest ml-1 opacity-50">Join Date</label>
                          <input
                            name="join_date"
                            type="date"
                            value={formData.join_date}
                            onChange={handleChange}
                            className="w-full border-2 border-gray-50 bg-gray-50 rounded-2xl px-6 py-4 focus:border-brand-medium focus:ring-0 transition-all font-medium"
                          />
                        </div>
                      </>
                    )}

                    {(user?.role === 'orgAdmin' || user?.role === 'SuperAdmin') && (
                      <>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-brand-deep uppercase tracking-widest ml-1 opacity-50 flex items-center space-x-2">
                              <Building size={14} />
                              <span>Organization</span>
                          </label>
                          <input
                              name="organization_name"
                              type="text"
                              required
                              value={formData.organization_name}
                              onChange={handleChange}
                              className="w-full border-2 border-gray-50 bg-gray-50 rounded-2xl px-6 py-4 focus:border-brand-medium focus:ring-0 transition-all font-medium"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-brand-deep uppercase tracking-widest ml-1 opacity-50 flex items-center space-x-2">
                              <Briefcase size={14} />
                              <span>Organization Type</span>
                          </label>
                          <select
                              name="organization_type"
                              title="Select organization type"
                              value={formData.organization_type}
                              onChange={handleChange}
                              className="w-full border-2 border-gray-50 bg-gray-50 rounded-2xl px-6 py-4 focus:border-brand-medium focus:ring-0 transition-all font-medium appearance-none"
                          >
                              <option value="business">Business</option>
                              <option value="nonprofit">Non-Profit</option>
                              <option value="government">Government</option>
                              <option value="other">Other</option>
                          </select>
                        </div>
                      </>
                    )}
                 </div>

                 <div className="pt-6">
                    <button
                       disabled={loading}
                       type="submit"
                       className="w-full py-5 bg-brand-medium text-white rounded-2xl font-black text-lg hover:bg-brand-light transition-all shadow-xl shadow-brand-medium/20 flex items-center justify-center space-x-3 disabled:opacity-50"
                    >
                       <Save size={20} />
                       <span>{loading ? 'Saving Changes...' : 'Save Settings'}</span>
                    </button>
                 </div>
              </form>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
