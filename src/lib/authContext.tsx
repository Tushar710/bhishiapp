import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  onSnapshot,
  serverTimestamp,
  collection,
  query,
  where,
  getDocs,
} from 'firebase/firestore';
import { auth, db, googleProvider, handleFirestoreError, OperationType } from './firebase';
import { AppUser, UserRole } from './types';
import { generateReferralCode } from './formatters';

export const BOOTSTRAP_ADMIN_EMAIL = 'pawartushar710@gmail.com';

interface AuthContextType {
  currentUser: User | null;
  userData: AppUser | null;
  role: UserRole;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  loading: boolean;
  bootstrapAdminEmail: string;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  loginAdminQuick: (pass?: string) => Promise<void>;
  registerWithEmail: (email: string, pass: string, fullName: string, phone: string, referralCode?: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  updateUserProfile: (fullName: string, phone: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Sync with Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        const userRef = doc(db, 'users', user.uid);
        try {
          const userSnap = await getDoc(userRef);
          if (!userSnap.exists()) {
            // First time login via Google or similar provider
            const isDefaultAdmin = user.email === BOOTSTRAP_ADMIN_EMAIL;
            const newUserData: AppUser = {
              uid: user.uid,
              email: user.email || '',
              fullName: user.displayName || user.email?.split('@')[0] || 'Member',
              phone: user.phoneNumber || '',
              role: isDefaultAdmin ? 'superadmin' : 'member',
              referralCode: generateReferralCode(user.displayName || 'BHIS'),
              status: 'active',
              createdAt: new Date().toISOString(),
            };
            await setDoc(userRef, {
              ...newUserData,
              createdAtServer: serverTimestamp(),
            });

            // If bootstrapped admin, also register in admins collection for zero-trust rules
            if (isDefaultAdmin) {
              const adminRef = doc(db, 'admins', user.uid);
              await setDoc(adminRef, {
                uid: user.uid,
                email: user.email,
                role: 'superadmin',
                grantedAt: new Date().toISOString(),
              });
            }

            setUserData(newUserData);
          } else {
            setUserData(userSnap.data() as AppUser);
          }
        } catch (err) {
          console.error('Error fetching user document:', err);
        }

        // Live snapshot listener for user document changes
        const unsubDoc = onSnapshot(
          userRef,
          (docSnap) => {
            if (docSnap.exists()) {
              setUserData(docSnap.data() as AppUser);
            }
          },
          (err) => {
            console.error('User doc snapshot error:', err);
          }
        );

        setLoading(false);
        return () => unsubDoc();
      } else {
        setUserData(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const loginWithEmail = async (email: string, pass: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, pass);
    } catch (err: any) {
      // If this is the designated superadmin and they haven't registered in Firebase Auth yet, auto-provision
      if (
        email.trim().toLowerCase() === BOOTSTRAP_ADMIN_EMAIL.toLowerCase() &&
        (err?.code === 'auth/user-not-found' ||
          err?.code === 'auth/invalid-credential' ||
          err?.code === 'auth/invalid-login-credentials')
      ) {
        try {
          await registerWithEmail(
            BOOTSTRAP_ADMIN_EMAIL,
            pass,
            'Super Administrator',
            '+919876543210'
          );
          return;
        } catch {
          // If auto-provisioning fails, throw the original auth error
          throw err;
        }
      }
      throw err;
    }
  };

  const loginAdminQuick = async (pass: string = 'Admin@123456') => {
    try {
      await signInWithEmailAndPassword(auth, BOOTSTRAP_ADMIN_EMAIL, pass);
    } catch (err: any) {
      if (
        err?.code === 'auth/user-not-found' ||
        err?.code === 'auth/invalid-credential' ||
        err?.code === 'auth/invalid-login-credentials'
      ) {
        await registerWithEmail(
          BOOTSTRAP_ADMIN_EMAIL,
          pass,
          'Super Administrator',
          '+919876543210'
        );
      } else {
        throw err;
      }
    }
  };

  const registerWithEmail = async (
    email: string,
    pass: string,
    fullName: string,
    phone: string,
    referralCode?: string
  ) => {
    const cred = await createUserWithEmailAndPassword(auth, email, pass);
    const user = cred.user;
    const isDefaultAdmin = email === BOOTSTRAP_ADMIN_EMAIL;
    const assignedRole: UserRole = isDefaultAdmin ? 'superadmin' : 'member';
    const myReferralCode = generateReferralCode(fullName);

    const userProfile: AppUser = {
      uid: user.uid,
      email,
      fullName,
      phone,
      role: assignedRole,
      referralCode: myReferralCode,
      referredBy: referralCode || undefined,
      status: 'active',
      createdAt: new Date().toISOString(),
    };

    try {
      await setDoc(doc(db, 'users', user.uid), {
        ...userProfile,
        createdAtServer: serverTimestamp(),
      });

      if (isDefaultAdmin) {
        await setDoc(doc(db, 'admins', user.uid), {
          uid: user.uid,
          email,
          role: 'superadmin',
          grantedAt: new Date().toISOString(),
        });
      }

      // Record referral if provided
      if (referralCode && referralCode.trim()) {
        try {
          const q = query(
            collection(db, 'users'),
            where('referralCode', '==', referralCode.trim().toUpperCase())
          );
          const snap = await getDocs(q);
          if (!snap.empty) {
            const referrerDoc = snap.docs[0];
            const referrerId = referrerDoc.id;
            if (referrerId !== user.uid) {
              const refDoc = doc(collection(db, 'referrals'));
              await setDoc(refDoc, {
                id: refDoc.id,
                referrerId,
                refereeId: user.uid,
                referralCode: referralCode.trim().toUpperCase(),
                status: 'registered',
                rewardAmount: 200,
                createdAt: new Date().toISOString(),
              });
            }
          }
        } catch (e) {
          console.warn('Could not process referral record:', e);
        }
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `users/${user.uid}`);
    }
  };

  const loginWithGoogle = async () => {
    await signInWithPopup(auth, googleProvider);
  };

  const logout = async () => {
    await signOut(auth);
  };

  const updateUserProfile = async (fullName: string, phone: string) => {
    if (!currentUser) return;
    try {
      await setDoc(
        doc(db, 'users', currentUser.uid),
        {
          fullName,
          phone,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${currentUser.uid}`);
    }
  };

  const role: UserRole =
    userData?.role ||
    (currentUser?.email === BOOTSTRAP_ADMIN_EMAIL ? 'superadmin' : 'member');
  const isAdmin = role === 'admin' || role === 'superadmin' || currentUser?.email === BOOTSTRAP_ADMIN_EMAIL;
  const isSuperAdmin = role === 'superadmin' || currentUser?.email === BOOTSTRAP_ADMIN_EMAIL;

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userData,
        role,
        isAdmin,
        isSuperAdmin,
        loading,
        bootstrapAdminEmail: BOOTSTRAP_ADMIN_EMAIL,
        loginWithEmail,
        loginAdminQuick,
        registerWithEmail,
        loginWithGoogle,
        logout,
        updateUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
