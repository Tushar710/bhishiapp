import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { BhishiScheme } from '../lib/types';
import { formatINR } from '../lib/formatters';
import { Search, Filter, Layers, Users, Calendar, ArrowRight, ShieldCheck, Plus } from 'lucide-react';
import { useAuth } from '../lib/authContext';

export const SchemesPage: React.FC = () => {
  const { isAdmin } = useAuth();
  const [schemes, setSchemes] = useState<BhishiScheme[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    const fetchSchemes = async () => {
      try {
        const snap = await getDocs(collection(db, 'bhishiSchemes'));
        const list: BhishiScheme[] = [];
        snap.forEach((d) => list.push({ id: d.id, ...d.data() } as BhishiScheme));
        setSchemes(list);
      } catch (err) {
        console.warn('Error loading schemes:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSchemes();
  }, []);

  const filteredSchemes = schemes.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.schemeCode.toLowerCase().includes(search.toLowerCase());
    const matchesStatus =
      statusFilter === 'all' ? true : s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6 pb-20 md:pb-8">
      {/* Title & Action Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Bhishi Schemes Catalog
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Browse active rotation groups, inspect terms, and apply for scheduled membership.
          </p>
        </div>

        {isAdmin && (
          <Link
            to="/admin/schemes"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white transition shadow-sm whitespace-nowrap self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Scheme</span>
          </Link>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by scheme code or title..."
            className="w-full min-h-[44px] pl-10 pr-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white"
          />
        </div>

        {/* Segmented Controls for Status */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl w-full sm:w-auto overflow-x-auto no-scrollbar">
          {['all', 'open', 'active', 'completed'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`min-h-[36px] px-3.5 py-1.5 text-xs font-bold rounded-lg transition uppercase whitespace-nowrap shrink-0 ${
                statusFilter === st
                  ? 'bg-white text-emerald-700 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Scheme Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-64 rounded-3xl bg-slate-200 animate-pulse" />
          ))}
        </div>
      ) : filteredSchemes.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 p-8 space-y-3 shadow-xs">
          <Layers className="w-12 h-12 mx-auto text-slate-400 stroke-[1.5]" />
          <h3 className="text-base font-bold text-slate-900">No Schemes Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {search || statusFilter !== 'all'
              ? 'No schemes match your filter criteria. Try adjusting your search term.'
              : 'The database is currently clean and fresh. Administrators can publish the first Bhishi scheme.'}
          </p>
          {isAdmin && (
            <Link
              to="/admin/schemes"
              className="inline-flex items-center gap-1.5 px-4 py-2 mt-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white transition shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Publish First Bhishi Scheme</span>
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSchemes.map((scheme) => {
            const nominalTotal = scheme.monthlyContribution * scheme.durationMonths;
            const monthlyPot = scheme.monthlyContribution * scheme.totalMembers;

            return (
              <div
                key={scheme.id}
                className="rounded-3xl bg-white border border-slate-200 p-6 flex flex-col justify-between hover:border-slate-300 transition shadow-xs space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[11px] font-mono text-emerald-700 font-bold tracking-wider">
                        {scheme.schemeCode}
                      </span>
                      <h3 className="text-base font-bold text-slate-900 leading-snug mt-0.5">
                        {scheme.name}
                      </h3>
                    </div>
                    <span
                      className={`text-[10px] px-2.5 py-1 rounded-md font-bold uppercase tracking-wider ${
                        scheme.status === 'open'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : scheme.status === 'active'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {scheme.status}
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                    {scheme.description || 'Structured community monthly rotation savings group.'}
                  </p>

                  {/* Financial Metrics Strip */}
                  <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/60">
                      <p className="text-slate-500 text-[11px]">Monthly Due</p>
                      <p className="text-base font-bold text-slate-900 font-mono tabular-nums mt-0.5">
                        {formatINR(scheme.monthlyContribution)}
                      </p>
                    </div>

                    <div className="p-3 rounded-2xl bg-emerald-50/60 border border-emerald-200/80">
                      <p className="text-emerald-700 text-[11px]">Monthly Total Pot</p>
                      <p className="text-base font-bold text-emerald-700 font-mono tabular-nums mt-0.5">
                        {formatINR(monthlyPot)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                    <span className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      <span>{scheme.totalMembers} Members Capacity</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>{scheme.durationMonths} Months</span>
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-400 border-t border-slate-100 pt-2">
                    <span>Nominal scheduled contributions: </span>
                    <span className="font-mono text-slate-700 font-bold">{formatINR(nominalTotal)}</span>
                  </div>
                </div>

                <div className="pt-3">
                  <Link
                    to={`/schemes/${scheme.id}`}
                    className="w-full min-h-[44px] flex items-center justify-center gap-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs font-bold text-white transition shadow-xs"
                  >
                    <span>View Scheme & Apply</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
