import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { Search, Plus, Download, MoreHorizontal, Edit2, Trash2 } from 'lucide-react';

type OrgAdmin = {
  id: number;
  name: string;
  email: string;
  role: string;
  organization_name?: string | null;
  profile_photo_path?: string | null;
};

const csvEscape = (value: unknown) => {
  const s = String(value ?? '');
  const needsQuotes = /[",\n]/.test(s);
  return needsQuotes ? `"${s.replace(/"/g, '""')}"` : s;
};

const downloadCsv = (filename: string, rows: Record<string, unknown>[]) => {
  if (!rows.length) return;
  const headers = Object.keys(rows[0] || {});
  const csv = [
    headers.join(','),
    ...rows.map((r) => headers.map((h) => csvEscape(r[h])).join(',')),
  ].join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};

const SuperAdminOrgAdmins: React.FC = () => {
  const [q, setQ] = useState('');
  const [openMenuFor, setOpenMenuFor] = useState<number | null>(null);
  const menuContainerRef = useRef<HTMLDivElement>(null);

  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: orgAdmins, isLoading } = useQuery<OrgAdmin[]>({
    queryKey: ['admin', 'organizations'],
    queryFn: () => api.get('/admin/organizations').then((r) => r.data),
  });

  useEffect(() => {
    if (openMenuFor == null) return;
    const onDoc = (e: MouseEvent) => {
      if (menuContainerRef.current && !menuContainerRef.current.contains(e.target as Node)) {
        setOpenMenuFor(null);
      }
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [openMenuFor]);

  const filtered = useMemo(() => {
    const list = orgAdmins ?? [];
    const term = q.trim().toLowerCase();
    if (!term) return list;
    return list.filter(
      (u) =>
        (u.name && u.name.toLowerCase().includes(term)) ||
        (u.email && u.email.toLowerCase().includes(term)) ||
        (u.organization_name && u.organization_name.toLowerCase().includes(term))
    );
  }, [orgAdmins, q]);

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/admin/organizations/${id}`),
    onSuccess: () => {
      setOpenMenuFor(null);
      queryClient.invalidateQueries({ queryKey: ['admin', 'organizations'] });
    },
  });

  return (
    <div className="space-y-6" ref={menuContainerRef}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Organization Admins</h1>
          <p className="text-sm text-slate-500">Manage all organization administrators on the platform</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-sky-600 text-white text-sm font-bold hover:bg-sky-500"
            onClick={() => navigate('/super-admin/add-admin')}
          >
            <Plus size={18} />
            Add Admin
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 text-sm font-bold text-slate-700 hover:bg-slate-50"
            onClick={() =>
              downloadCsv(
                'org-admins.csv',
                filtered.map((u) => ({
                  name: u.name,
                  email: u.email,
                  organization_name: u.organization_name ?? '',
                  role: u.role,
                }))
              )
            }
          >
            <Download size={18} />
            Export
          </button>
        </div>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search admins…"
          className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 text-sm"
        />
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left p-4 font-bold text-slate-600">Name</th>
              <th className="text-left p-4 font-bold text-slate-600">Email</th>
              <th className="text-left p-4 font-bold text-slate-600">Organization</th>
              <th className="text-left p-4 font-bold text-slate-600">Role</th>
              <th className="w-12 p-4" />
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-slate-500">
                  Loading…
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-slate-500">
                  No organization admins found
                </td>
              </tr>
            ) : (
              filtered.map((u) => (
                <tr key={u.id} className="border-t border-slate-100 hover:bg-slate-50/80">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={
                          u.profile_photo_path
                            ? `/uploads/${u.profile_photo_path.replace(/\\/g, '/').replace(/^uploads[\/\\]/, '')}`
                            : `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}&background=e0e7ff&color=3730a3`
                        }
                        alt=""
                        className="w-9 h-9 rounded-full object-cover ring-1 ring-gray-100 shrink-0"
                      />
                      <span className="font-medium text-slate-900">{u.name}</span>
                    </div>
                  </td>
                  <td className="p-4 text-slate-600">{u.email}</td>
                  <td className="p-4 text-slate-600">{u.organization_name ?? '—'}</td>
                  <td className="p-4">
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-sky-100 text-sky-800">
                      {u.role}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="relative">
                      {openMenuFor === u.id ? (
                        <button
                          title="more options"
                          type="button"
                          className="p-1 rounded hover:bg-slate-200 text-slate-500"
                          aria-haspopup="true"
                          aria-expanded="true"
                          onClick={() => setOpenMenuFor((prev) => (prev === u.id ? null : u.id))}
                        >
                          <MoreHorizontal size={18} />
                        </button>
                      ) : (
                        <button
                          title="more options"
                          type="button"
                          className="p-1 rounded hover:bg-slate-200 text-slate-500"
                          aria-haspopup="true"
                          aria-expanded="false"
                          onClick={() => setOpenMenuFor((prev) => (prev === u.id ? null : u.id))}
                        >
                          <MoreHorizontal size={18} />
                        </button>
                      )}
                      {openMenuFor === u.id ? (
                        <div className="absolute right-0 mt-2 w-40 bg-white border border-slate-200 rounded-lg shadow-sm z-10">
                          <button
                            type="button"
                            onClick={() => {
                              setOpenMenuFor(null);
                              navigate(`/super-admin/organizations?mode=edit&editId=${u.id}`);
                            }}
                            className="w-full text-left px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 inline-flex items-center gap-2"
                          >
                            <Edit2 size={16} />
                            Edit
                          </button>
                          <button
                            type="button"
                            disabled={deleteMutation.isPending}
                            onClick={() => {
                              if (!confirm('Delete this organization admin?')) return;
                              deleteMutation.mutate(u.id);
                            }}
                            className="w-full text-left px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 inline-flex items-center gap-2 disabled:opacity-50"
                          >
                            <Trash2 size={16} />
                            Delete
                          </button>
                        </div>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SuperAdminOrgAdmins;
