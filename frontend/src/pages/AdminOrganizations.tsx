import React, { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { User, Plan } from '../types';
import { Plus, Search, Filter, MoreVertical, Edit2, Trash2, X, Building, Mail, User as UserIcon } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import useBodyScrollLock from '../hooks/useBodyScrollLock';

const AdminOrganizations: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOrg, setEditingOrg] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    organization_name: '',
    organization_type: 'business',
    plan_id: '',
  });
  useBodyScrollLock(isModalOpen);

  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  const { data: organizations, isLoading: orgsLoading } = useQuery<User[]>({
    queryKey: ['admin', 'organizations'],
    queryFn: () => api.get('/admin/organizations').then(res => res.data),
  });

  const { data: plans } = useQuery<Plan[]>({
    queryKey: ['plans'],
    queryFn: () => api.get('/plans').then(res => res.data),
  });

  const createMutation = useMutation({
    mutationFn: (newOrg: any) => api.post('/admin/organizations', newOrg),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'organizations'] });
      closeModal();
    },
  });

  const updateMutation = useMutation({
    mutationFn: (updatedOrg: any) => api.put(`/admin/organizations/${updatedOrg.id}`, updatedOrg),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'organizations'] });
      closeModal();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/organizations/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'organizations'] });
    },
  });

  const openModal = (org?: User) => {
    if (org) {
      setEditingOrg(org);
      setFormData({
        name: org.name,
        email: org.email,
        password: '', // Don't show password
        organization_name: org.organization_name || '',
        organization_type: org.organization_type || 'business',
        plan_id: org.plan_id?.toString() || '',
      });
    } else {
      setEditingOrg(null);
      setFormData({
        name: '',
        email: '',
        password: '',
        organization_name: '',
        organization_type: 'business',
        plan_id: '',
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingOrg(null);
    // If this modal was opened via query params, clear them so it doesn't reopen on refresh.
    setSearchParams({});
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingOrg) {
      updateMutation.mutate({ ...formData, id: editingOrg.id });
    } else {
      createMutation.mutate(formData);
    }
  };

  // Support deep-linking to the add/edit modal from other super-admin pages.
  useEffect(() => {
    const mode = searchParams.get('mode');
    const editIdRaw = searchParams.get('editId');

    if (mode !== 'add' && mode !== 'edit') return;
    if (mode === 'add') {
      openModal();
      return;
    }

    if (mode === 'edit' && editIdRaw && organizations) {
      const org = organizations.find((o) => o.id === editIdRaw);
      if (org) openModal(org);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, organizations, orgsLoading]);

  const filteredOrgs = organizations?.filter(org =>
    org.organization_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    org.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 font-poppins">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-black text-brand-dark tracking-tight">Organizations</h1>
        <button
          onClick={() => openModal()}
          className="bg-brand-medium text-white px-6 py-2.5 rounded-xl flex items-center space-x-2 hover:bg-brand-dark transition-all shadow-sm shadow-brand-medium/20 text-sm font-bold"
        >
          <Plus size={18} />
          <span>Add Organization</span>
        </button>
      </div>

      <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b bg-gray-50/50 flex items-center justify-between">
          <h2 className="text-lg font-black text-brand-dark tracking-tight">Active Organizations</h2>
          <div className="relative w-64">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-medium/50" size={16} />
             <input 
                type="text" 
                placeholder="Search..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white border border-gray-100 rounded-xl focus:border-brand-medium focus:ring-0 transition-all text-sm font-medium"
             />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50/30 text-brand-deep text-[10px] font-black uppercase tracking-[0.2em]">
              <tr>
                <th className="px-8 py-4">Organization</th>
                <th className="px-8 py-4">Admin</th>
                <th className="px-8 py-4">Plan</th>
                <th className="px-8 py-4">Status</th>
                <th className="px-8 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orgsLoading ? (
                <tr><td colSpan={5} className="px-8 py-10 text-center text-gray-400 font-medium">Loading organizations...</td></tr>
              ) : filteredOrgs?.length === 0 ? (
                <tr><td colSpan={5} className="px-8 py-10 text-center text-gray-400 font-medium">No organizations found</td></tr>
              ) : (
                filteredOrgs?.map((org) => (
                  <tr key={org.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-8 py-5">
                      <div className="flex items-center space-x-4">
                        <img
                          src={
                            org.profile_photo_path
                              ? `/uploads/${org.profile_photo_path.replace(/\\/g, '/').replace(/^uploads[\/\\]/, '')}`
                              : `https://ui-avatars.com/api/?name=${encodeURIComponent(org.organization_name || org.name)}&background=ecf39e&color=132a13`
                          }
                          alt=""
                          className="w-11 h-11 rounded-2xl object-cover ring-1 ring-gray-100 shadow-sm shrink-0"
                        />
                        <div>
                          <p className="text-sm font-bold text-brand-dark">{org.organization_name}</p>
                          <p className="text-[10px] font-black text-brand-deep/50 uppercase tracking-widest">{org.organization_type}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex flex-col">
                        <p className="text-sm font-bold text-brand-dark">{org.name}</p>
                        <p className="text-xs text-brand-deep font-medium opacity-60">{org.email}</p>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <span className="px-3 py-1 text-[10px] font-black rounded-lg bg-brand-pale/40 text-brand-medium uppercase tracking-widest">
                        {org.plan?.name || 'Free'}
                      </span>
                    </td>
                    <td className="px-8 py-5">
                      <span className="inline-flex items-center space-x-1.5 text-[10px] font-black text-brand-medium uppercase tracking-widest">
                        <div className="w-1.5 h-1.5 bg-brand-medium rounded-full animate-pulse"></div>
                        <span>Active</span>
                      </span>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex justify-end space-x-2">
                        <button 
                        title='Editorganization'
                          onClick={() => openModal(org)}
                          className="p-2 bg-white shadow-sm border border-gray-100 rounded-xl hover:text-brand-medium transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                        title='Delete organization'
                          onClick={() => { if (confirm('Are you sure you want to delete this organization?')) deleteMutation.mutate(org.id) }}
                          className="p-2 bg-white shadow-sm border border-gray-100 rounded-xl hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="text-lg font-bold">{editingOrg ? 'Edit Organization' : 'Add New Organization'}</h3>
              <button onClick={closeModal} title="Close"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-4 overflow-y-auto flex-1">
              <div className="space-y-4">
                 <p className="text-xs font-bold text-gray-400 uppercase tracking-widest border-b pb-2">Organization Details</p>
                 <div>
                   <label className="block text-sm font-medium text-gray-700">Organization Name</label>
                   <div className="mt-1 relative rounded-md shadow-sm">
                      <Building className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                      <input
                        type="text"
                        required
                        value={formData.organization_name}
                        onChange={(e) => setFormData({ ...formData, organization_name: e.target.value })}
                        className="w-full border rounded-lg pl-10 pr-3 py-2"
                        placeholder="Organization Name"
                      />
                   </div>
                 </div>
                 <div>
                   <label className="block text-sm font-medium text-gray-700">Organization Type</label>
                   <select
                   title='Organization type'
                     value={formData.organization_type}
                     onChange={(e) => setFormData({ ...formData, organization_type: e.target.value })}
                     className="mt-1 w-full border rounded-lg px-3 py-2"
                   >
                     <option value="business">Business</option>
                     <option value="nonprofit">Non-Profit</option>
                     <option value="government">Government</option>
                     <option value="other">Other</option>
                   </select>
                 </div>
                 <div>
                   <label className="block text-sm font-medium text-gray-700">Initial Plan</label>
                   <select
                   title='Initial plan'
                     value={formData.plan_id}
                     onChange={(e) => setFormData({ ...formData, plan_id: e.target.value })}
                     className="mt-1 w-full border rounded-lg px-3 py-2"
                   >
                     <option value="">Select a Plan</option>
                     {plans?.map(plan => (
                        <option key={plan.id} value={plan.id}>{plan.name} - ${plan.price}</option>
                     ))}
                   </select>
                 </div>
              </div>

              <div className="space-y-4 pt-4">
                 <p className="text-xs font-bold text-gray-400 uppercase tracking-widest border-b pb-2">Admin Details</p>
                 <div>
                   <label className="block text-sm font-medium text-gray-700">Admin Name</label>
                   <input
                   title='Admin name'
                     type="text"
                     required
                     value={formData.name}
                     onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                     className="mt-1 w-full border rounded-lg px-3 py-2"
                   />
                 </div>
                 <div>
                   <label className="block text-sm font-medium text-gray-700">Admin Email</label>
                   <div className="mt-1 relative rounded-md shadow-sm">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                      <input
                      title='Admin email'
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full border rounded-lg pl-10 pr-3 py-2"
                      />
                   </div>
                 </div>
                 {!editingOrg && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Initial Password</label>
                      <input
                      title='Initial password'
                        type="password"
                        required
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="mt-1 w-full border rounded-lg px-3 py-2"
                      />
                    </div>
                 )}
              </div>

              <div className="pt-6 flex space-x-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {editingOrg ? 'Update Organization' : 'Create Organization'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOrganizations;
