import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import {
  collection, query, orderBy, limit,
  onSnapshot, writeBatch, doc,
} from 'firebase/firestore';

export function useNotifications(user) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }
    const q = query(
      collection(db, 'notifications', user.uid, 'items'),
      orderBy('createdAt', 'desc'),
      limit(20)
    );
    const unsub = onSnapshot(q, snap => {
      const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setNotifications(items);
      setUnreadCount(items.filter(n => !n.read).length);
    }, () => {});
    return unsub;
  }, [user?.uid]);

  async function markAllRead() {
    if (!user) return;
    const unread = notifications.filter(n => !n.read);
    if (unread.length === 0) return;
    const batch = writeBatch(db);
    unread.forEach(n => {
      batch.update(doc(db, 'notifications', user.uid, 'items', n.id), { read: true });
    });
    await batch.commit().catch(() => {});
  }

  return { notifications, unreadCount, markAllRead };
}
