/**
 * useCustomers Hook
 *
 * Manages customer data with Firebase Firestore persistence.
 * Provides real-time sync and offline support via localStorage fallback.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  deleteDoc,
  writeBatch,
  query,
  orderBy,
  Timestamp
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../lib/firebase';
import { useAuth } from './useAuth';
import { Lead } from '../types';

const LOCAL_STORAGE_KEY = 'renova8_customers';

interface UseCustomersReturn {
  customers: Lead[];
  loading: boolean;
  error: string | null;
  saveCustomer: (customer: Lead) => Promise<void>;
  updateCustomer: (customer: Lead) => Promise<void>;
  deleteCustomer: (customerId: string) => Promise<void>;
  syncStatus: 'synced' | 'syncing' | 'offline' | 'error';
}

export function useCustomers(): UseCustomersReturn {
  const { user } = useAuth();
  const [customers, setCustomers] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'offline' | 'error'>('synced');

  // Load from localStorage (fallback/initial load)
  const loadFromLocalStorage = useCallback((): Lead[] => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  }, []);

  // Save to localStorage
  const saveToLocalStorage = useCallback((data: Lead[]) => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.error('Failed to save to localStorage:', e);
    }
  }, []);

  // Convert Firestore document to Lead
  const docToLead = (docData: any, id: string): Lead => {
    return {
      ...docData,
      id,
      // Convert Firestore timestamps to numbers
      addedAt: docData.addedAt?.toMillis?.() || docData.addedAt || Date.now(),
      // Handle nested timestamp conversions
      invoices: docData.invoices?.map((inv: any) => ({
        ...inv,
        createdAt: inv.createdAt?.toMillis?.() || inv.createdAt,
        dueDate: inv.dueDate?.toMillis?.() || inv.dueDate,
        paidAt: inv.paidAt?.toMillis?.() || inv.paidAt,
        payments: inv.payments?.map((p: any) => ({
          ...p,
          date: p.date?.toMillis?.() || p.date,
        })),
      })),
      communications: docData.communications?.map((comm: any) => ({
        ...comm,
        timestamp: comm.timestamp?.toMillis?.() || comm.timestamp,
      })),
      history: docData.history?.map((h: any) => ({
        ...h,
        timestamp: h.timestamp?.toMillis?.() || h.timestamp,
      })),
    };
  };

  // Convert Lead to Firestore document
  const leadToDoc = (lead: Lead): any => {
    const doc: any = { ...lead };
    // Remove id from doc data (it's the document ID)
    delete doc.id;
    // Convert timestamps
    if (doc.addedAt) {
      doc.addedAt = Timestamp.fromMillis(doc.addedAt);
    }
    return doc;
  };

  // Setup real-time listener when user is authenticated
  useEffect(() => {
    if (!user || !isFirebaseConfigured()) {
      // Not authenticated or Firebase not configured - use localStorage only
      const localData = loadFromLocalStorage();
      setCustomers(localData);
      setLoading(false);
      setSyncStatus('offline');
      return;
    }

    setLoading(true);
    setSyncStatus('syncing');

    // Reference to user's customers collection
    const customersRef = collection(db, 'users', user.uid, 'customers');
    const q = query(customersRef, orderBy('addedAt', 'desc'));

    // Real-time listener
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const firebaseCustomers: Lead[] = [];
        snapshot.forEach((doc) => {
          firebaseCustomers.push(docToLead(doc.data(), doc.id));
        });

        setCustomers(firebaseCustomers);
        // Also save to localStorage as backup
        saveToLocalStorage(firebaseCustomers);
        setLoading(false);
        setSyncStatus('synced');
        setError(null);
      },
      (err) => {
        console.error('Error fetching customers:', err);
        // Fall back to localStorage on error
        const localData = loadFromLocalStorage();
        setCustomers(localData);
        setLoading(false);
        setSyncStatus('error');
        setError('Failed to sync with cloud. Using local data.');
      }
    );

    return () => unsubscribe();
  }, [user, loadFromLocalStorage, saveToLocalStorage]);

  // Migrate localStorage data to Firebase on first login
  useEffect(() => {
    if (!user || !isFirebaseConfigured()) return;

    const migrateLocalData = async () => {
      const localData = loadFromLocalStorage();
      if (localData.length === 0) return;

      // Check if user already has data in Firebase
      // If they do, don't migrate (to avoid duplicates)
      if (customers.length > 0) return;

      console.log(`Migrating ${localData.length} customers from localStorage to Firebase...`);
      setSyncStatus('syncing');

      try {
        const batch = writeBatch(db);
        const customersRef = collection(db, 'users', user.uid, 'customers');

        localData.forEach((customer) => {
          const docRef = doc(customersRef, customer.id);
          batch.set(docRef, leadToDoc(customer));
        });

        await batch.commit();
        console.log('Migration complete!');
        // Clear localStorage after successful migration
        // localStorage.removeItem(LOCAL_STORAGE_KEY); // Keep as backup
      } catch (err) {
        console.error('Migration failed:', err);
        setError('Failed to migrate local data to cloud.');
      }
    };

    migrateLocalData();
  }, [user, customers.length, loadFromLocalStorage]);

  // Save a new customer
  const saveCustomer = useCallback(async (customer: Lead) => {
    // Always update local state immediately
    setCustomers((prev) => {
      if (prev.find((c) => c.id === customer.id)) {
        return prev; // Already exists
      }
      const updated = [{ ...customer, addedAt: customer.addedAt || Date.now() }, ...prev];
      saveToLocalStorage(updated);
      return updated;
    });

    if (!user || !isFirebaseConfigured()) {
      return; // localStorage-only mode
    }

    try {
      setSyncStatus('syncing');
      const customerRef = doc(db, 'users', user.uid, 'customers', customer.id);
      await setDoc(customerRef, leadToDoc({
        ...customer,
        addedAt: customer.addedAt || Date.now(),
      }));
      setSyncStatus('synced');
    } catch (err) {
      console.error('Error saving customer:', err);
      setSyncStatus('error');
      setError('Failed to save to cloud. Saved locally.');
    }
  }, [user, saveToLocalStorage]);

  // Update an existing customer
  const updateCustomer = useCallback(async (customer: Lead) => {
    // Always update local state immediately
    setCustomers((prev) => {
      const updated = prev.map((c) => (c.id === customer.id ? customer : c));
      saveToLocalStorage(updated);
      return updated;
    });

    if (!user || !isFirebaseConfigured()) {
      return; // localStorage-only mode
    }

    try {
      setSyncStatus('syncing');
      const customerRef = doc(db, 'users', user.uid, 'customers', customer.id);
      await setDoc(customerRef, leadToDoc(customer), { merge: true });
      setSyncStatus('synced');
    } catch (err) {
      console.error('Error updating customer:', err);
      setSyncStatus('error');
      setError('Failed to sync update. Saved locally.');
    }
  }, [user, saveToLocalStorage]);

  // Delete a customer
  const deleteCustomer = useCallback(async (customerId: string) => {
    // Always update local state immediately
    setCustomers((prev) => {
      const updated = prev.filter((c) => c.id !== customerId);
      saveToLocalStorage(updated);
      return updated;
    });

    if (!user || !isFirebaseConfigured()) {
      return; // localStorage-only mode
    }

    try {
      setSyncStatus('syncing');
      const customerRef = doc(db, 'users', user.uid, 'customers', customerId);
      await deleteDoc(customerRef);
      setSyncStatus('synced');
    } catch (err) {
      console.error('Error deleting customer:', err);
      setSyncStatus('error');
      setError('Failed to sync deletion. Removed locally.');
    }
  }, [user, saveToLocalStorage]);

  return {
    customers,
    loading,
    error,
    saveCustomer,
    updateCustomer,
    deleteCustomer,
    syncStatus,
  };
}
