import React, { useState, useEffect } from 'react';
import { InAppNotification } from '../lib/types';
import { db } from '../lib/firebase';
import { collection, query, where, onSnapshot, doc, updateDoc, writeBatch } from 'firebase/firestore';
import { useAuth } from '../lib/authContext';
import { formatDateTime } from '../lib/formatters';
import { X, Bell, Check, ExternalLink, Inbox } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface NotificationDrawerProps {
  onClose: () => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({ onClose }) => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  useEffect(() => {
    if (!currentUser) return;

    const q = query(
      collection(db, 'notifications'),
      where('userId', 'in', [currentUser.uid, 'all'])
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const list: InAppNotification[] = [];
        snap.forEach((d) => {
          list.push({ id: d.id, ...d.data() } as InAppNotification);
        });
        // Sort descending by creation date
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setNotifications(list);
        setLoading(false);
      },
      (err) => {
        console.warn('Notifications snapshot error:', err);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [currentUser]);

  const markAsRead = async (id: string) => {
    try {
      await updateDoc(doc(db, 'notifications', id), {
        read: true,
      });
    } catch (e) {
      console.error(e);
    }
  };

  const markAllAsRead = async () => {
    const unread = notifications.filter((n) => !n.read);
    if (!unread.length) return;
    try {
      const batch = writeBatch(db);
      unread.forEach((n) => {
        batch.update(doc(db, 'notifications', n.id), { read: true });
      });
      await batch.commit();
    } catch (e) {
      console.error(e);
    }
  };

  const handleNotificationClick = (item: InAppNotification) => {
    if (!item.read) {
      markAsRead(item.id);
    }
    if (item.link) {
      onClose();
      navigate(item.link);
    }
  };

  const displayedList =
    filter === 'unread' ? notifications.filter((n) => !n.read) : notifications;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs">
      <div className="w-full max-w-md bg-slate-900 border-l border-slate-800 h-full flex flex-col text-white shadow-2xl animate-in slide-in-from-right duration-200">
        {/* Top bar */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-bold">Notifications</h2>
            <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
              {notifications.filter((n) => !n.read).length} unread
            </span>
          </div>
          <button
            onClick={onClose}
            aria-label="Close notifications"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter & Action strip */}
        <div className="px-4 py-2 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-1 p-0.5 bg-slate-800 rounded-lg">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                filter === 'all' ? 'bg-slate-700 text-white shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                filter === 'unread' ? 'bg-slate-700 text-white shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
            >
              Unread
            </button>
          </div>

          <button
            onClick={markAllAsRead}
            className="text-xs text-emerald-400 hover:text-emerald-300 transition font-medium"
          >
            Mark all read
          </button>
        </div>

        {/* List Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 rounded-xl bg-slate-800/60 animate-pulse" />
              ))}
            </div>
          ) : displayedList.length === 0 ? (
            <div className="py-16 text-center text-slate-500">
              <Inbox className="w-10 h-10 mx-auto text-slate-600 mb-2 stroke-[1.5]" />
              <p className="text-sm font-semibold text-slate-400">No notifications</p>
              <p className="text-xs mt-1">You are up to date on all Bhishi dues and updates.</p>
            </div>
          ) : (
            displayedList.map((notif) => (
              <div
                key={notif.id}
                onClick={() => handleNotificationClick(notif)}
                className={`p-3.5 rounded-xl border transition cursor-pointer ${
                  notif.read
                    ? 'bg-slate-800/40 border-slate-800/80 text-slate-400'
                    : 'bg-slate-800 border-slate-700 text-slate-200 shadow-sm'
                } hover:border-slate-600`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    {!notif.read && (
                      <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                    )}
                    <h4 className="text-xs font-semibold text-white truncate max-w-[220px]">
                      {notif.title}
                    </h4>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono shrink-0">
                    {formatDateTime(notif.createdAt)}
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">{notif.message}</p>
                {notif.link && (
                  <div className="mt-2 flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                    <span>View Details</span>
                    <ExternalLink className="w-3 h-3" />
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
