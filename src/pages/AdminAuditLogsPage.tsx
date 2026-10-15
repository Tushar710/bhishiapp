import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { AuditLogItem } from '../lib/types';
import { formatDateTime } from '../lib/formatters';
import { FileText, Search } from 'lucide-react';

export const AdminAuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const snap = await getDocs(collection(db, 'auditLogs'));
        const list: AuditLogItem[] = [];
        snap.forEach((d) => list.push({ id: d.id, ...d.data() } as AuditLogItem));
        list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        setLogs(list);
      } catch (err) {
        console.warn('Error fetching audit logs:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, []);

  const filteredLogs = logs.filter((log) => {
    const term = search.toLowerCase();
    return (
      log.action.toLowerCase().includes(term) ||
      (log.adminEmail || '').toLowerCase().includes(term) ||
      log.targetEntity.toLowerCase().includes(term) ||
      log.details.toLowerCase().includes(term)
    );
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6 pb-20 md:pb-8">
      {/* Header */}
      <div className="pb-4 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Immutable Audit Trail
          </h1>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 font-mono font-bold border border-emerald-200">
            Append-Only
          </span>
        </div>
        <p className="text-xs text-slate-500 mt-1">
          Cryptographically timestamped log of privileged administrative changes, payment approvals, and member rotations.
        </p>
      </div>

      {/* Search Bar */}
      <div className="relative w-full sm:w-96">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter by action, admin email, entity..."
          className="w-full min-h-[44px] pl-9 pr-3 py-2 text-xs rounded-xl bg-white border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 shadow-2xs"
        />
      </div>

      {/* Audit Log Table */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 rounded-2xl bg-slate-200 animate-pulse" />
          ))}
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 p-8 space-y-3 shadow-2xs">
          <FileText className="w-12 h-12 mx-auto text-slate-400 stroke-[1.5]" />
          <h3 className="text-base font-bold text-slate-900">No Audit Events Logged</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Privileged administrative events will be permanently recorded here as you configure schemes, approve memberships, and verify payments.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-3xl bg-white border border-slate-200/90 shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Timestamp</th>
                  <th className="py-3.5 px-4">Action</th>
                  <th className="py-3.5 px-4">Admin Email</th>
                  <th className="py-3.5 px-4">Domain / Entity</th>
                  <th className="py-3.5 px-4">Audit Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition">
                    <td className="py-3.5 px-4 font-mono text-slate-500 whitespace-nowrap">
                      {formatDateTime(log.timestamp)}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-mono text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 font-mono text-[11px]">
                      {log.adminEmail || 'admin'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 font-mono">
                      {log.targetEntity}
                    </td>
                    <td className="py-3.5 px-4 text-slate-800 text-xs leading-relaxed max-w-md">
                      {log.details}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
