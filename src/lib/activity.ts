import { collection, doc, setDoc } from 'firebase/firestore';
import { db } from './firebase';

export async function sendNotification(
  userId: string,
  title: string,
  message: string,
  type: 'dues' | 'payment' | 'membership' | 'payout' | 'system' = 'system',
  link?: string
): Promise<void> {
  try {
    const notifRef = doc(collection(db, 'notifications'));
    await setDoc(notifRef, {
      id: notifRef.id,
      userId,
      title,
      message,
      type,
      link: link || '',
      read: false,
      createdAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Failed to create notification:', err);
  }
}

export async function logAdminAction(
  adminId: string,
  adminEmail: string,
  action: string,
  targetEntity: string,
  entityId: string,
  details: string
): Promise<void> {
  try {
    const logRef = doc(collection(db, 'auditLogs'));
    await setDoc(logRef, {
      id: logRef.id,
      adminId,
      adminEmail,
      action,
      targetEntity,
      entityId,
      details,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Failed to create audit log:', err);
  }
}
