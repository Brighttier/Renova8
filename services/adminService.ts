/**
 * Admin Service - Firestore Operations for Platform Admin
 *
 * Handles all admin-related database operations including:
 * - Admin authentication and setup
 * - User management
 * - Revenue tracking
 * - Website hosting management
 * - Support tickets
 */

import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  onSnapshot,
  Timestamp,
  increment,
  writeBatch,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../lib/firebase';
import {
  PlatformAdmin,
  AdminRole,
  AdminPermission,
  PlatformUser,
  RevenueMetrics,
  Transaction,
  HostedWebsite,
  SupportTicket,
  TicketMessage,
  PlatformAnalytics,
  SystemHealth,
  TicketPriority,
  TicketStatus,
  TicketCategory,
  PlatformAPISettings,
  ApiKeyConfig,
  RateLimitConfig,
  TokenLimitConfig,
  ApiKeyRotationStrategy,
  DEFAULT_PLATFORM_API_SETTINGS,
} from '../types';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { functions as firebaseFunctions } from '../lib/firebase';

// ============================================
// Constants
// ============================================

const COLLECTIONS = {
  ADMINS: 'platform_admins',
  ADMIN_CONFIG: 'platform_config',
  USERS: 'users',
  TRANSACTIONS: 'transactions',
  SUBSCRIPTIONS: 'subscriptions',
  WEBSITES: 'websites',
  SUPPORT_TICKETS: 'support_tickets',
  ANALYTICS: 'platform_analytics',
  REVENUE_METRICS: 'revenue_metrics',
};

// Default permissions by role
const ROLE_PERMISSIONS: Record<AdminRole, AdminPermission[]> = {
  super_admin: [
    'users.view', 'users.edit', 'users.delete', 'users.suspend',
    'revenue.view', 'revenue.refund', 'revenue.export',
    'hosting.view', 'hosting.suspend', 'hosting.delete',
    'support.view', 'support.respond', 'support.escalate',
    'analytics.view', 'analytics.export',
    'settings.view', 'settings.edit',
    'admins.view', 'admins.create', 'admins.edit', 'admins.delete',
  ],
  finance_admin: [
    'users.view',
    'revenue.view', 'revenue.refund', 'revenue.export',
    'analytics.view', 'analytics.export',
  ],
  support_admin: [
    'users.view', 'users.edit',
    'support.view', 'support.respond', 'support.escalate',
  ],
  technical_admin: [
    'users.view',
    'hosting.view', 'hosting.suspend',
    'analytics.view',
  ],
  analytics_admin: [
    'users.view',
    'revenue.view',
    'analytics.view', 'analytics.export',
  ],
};

// ============================================
// Admin Setup & Authentication
// ============================================

/**
 * Check if platform admin has been set up (first-time setup check)
 */
export async function checkAdminSetupStatus(): Promise<{ isSetup: boolean; adminCount: number }> {
  if (!isFirebaseConfigured() || !db) {
    return { isSetup: false, adminCount: 0 };
  }

  try {
    const configDoc = await getDoc(doc(db, COLLECTIONS.ADMIN_CONFIG, 'setup'));
    if (configDoc.exists()) {
      return {
        isSetup: configDoc.data().isSetup || false,
        adminCount: configDoc.data().adminCount || 0,
      };
    }
    return { isSetup: false, adminCount: 0 };
  } catch (error) {
    console.error('Error checking admin setup status:', error);
    return { isSetup: false, adminCount: 0 };
  }
}

/**
 * Create the first super admin (one-time setup)
 */
export async function setupFirstAdmin(
  email: string,
  displayName: string,
  password: string
): Promise<{ success: boolean; admin?: PlatformAdmin; error?: string }> {
  if (!isFirebaseConfigured() || !db) {
    return { success: false, error: 'Firebase not configured' };
  }

  try {
    // Check if already set up
    const status = await checkAdminSetupStatus();
    if (status.isSetup) {
      return { success: false, error: 'Platform admin already exists. Contact existing admin for access.' };
    }

    // Generate admin ID
    const adminId = `admin_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Hash password (in production, use proper hashing like bcrypt)
    const passwordHash = await hashPassword(password);

    const admin: PlatformAdmin = {
      id: adminId,
      email: email.toLowerCase(),
      displayName,
      role: 'super_admin',
      permissions: ROLE_PERMISSIONS.super_admin,
      isActive: true,
      isSuperAdmin: true,
      createdAt: Date.now(),
    };

    const batch = writeBatch(db);

    // Create admin document
    batch.set(doc(db, COLLECTIONS.ADMINS, adminId), {
      ...admin,
      passwordHash,
    });

    // Update setup config
    batch.set(doc(db, COLLECTIONS.ADMIN_CONFIG, 'setup'), {
      isSetup: true,
      adminCount: 1,
      setupAt: Date.now(),
      setupBy: adminId,
    });

    await batch.commit();

    return { success: true, admin };
  } catch (error: any) {
    console.error('Error setting up first admin:', error);
    return { success: false, error: error.message || 'Failed to setup admin' };
  }
}

/**
 * Authenticate admin login
 */
export async function authenticateAdmin(
  email: string,
  password: string
): Promise<{ success: boolean; admin?: PlatformAdmin; error?: string }> {
  if (!isFirebaseConfigured() || !db) {
    return { success: false, error: 'Firebase not configured' };
  }

  try {
    // Find admin by email
    const adminsQuery = query(
      collection(db, COLLECTIONS.ADMINS),
      where('email', '==', email.toLowerCase()),
      where('isActive', '==', true),
      limit(1)
    );

    const snapshot = await getDocs(adminsQuery);
    if (snapshot.empty) {
      return { success: false, error: 'Invalid email or password' };
    }

    const adminDoc = snapshot.docs[0];
    const adminData = adminDoc.data();

    // Verify password
    const isValid = await verifyPassword(password, adminData.passwordHash);
    if (!isValid) {
      return { success: false, error: 'Invalid email or password' };
    }

    // Update last login
    await updateDoc(doc(db, COLLECTIONS.ADMINS, adminDoc.id), {
      lastLoginAt: Date.now(),
    });

    // Return admin without password hash
    const { passwordHash, ...admin } = adminData;
    return { success: true, admin: admin as PlatformAdmin };
  } catch (error: any) {
    console.error('Error authenticating admin:', error);
    return { success: false, error: error.message || 'Authentication failed' };
  }
}

/**
 * Get admin by ID
 */
export async function getAdmin(adminId: string): Promise<PlatformAdmin | null> {
  if (!isFirebaseConfigured() || !db) return null;

  try {
    const adminDoc = await getDoc(doc(db, COLLECTIONS.ADMINS, adminId));
    if (!adminDoc.exists()) return null;

    const { passwordHash, ...admin } = adminDoc.data();
    return admin as PlatformAdmin;
  } catch (error) {
    console.error('Error getting admin:', error);
    return null;
  }
}

/**
 * Create a new admin (by super admin)
 */
export async function createAdmin(
  admin: Omit<PlatformAdmin, 'id' | 'createdAt' | 'permissions'>,
  password: string,
  createdBy: string
): Promise<{ success: boolean; admin?: PlatformAdmin; error?: string }> {
  if (!isFirebaseConfigured() || !db) {
    return { success: false, error: 'Firebase not configured' };
  }

  try {
    const adminId = `admin_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const passwordHash = await hashPassword(password);

    const newAdmin: PlatformAdmin = {
      ...admin,
      id: adminId,
      email: admin.email.toLowerCase(),
      permissions: ROLE_PERMISSIONS[admin.role],
      createdAt: Date.now(),
      createdBy,
    };

    await setDoc(doc(db, COLLECTIONS.ADMINS, adminId), {
      ...newAdmin,
      passwordHash,
    });

    // Update admin count
    await updateDoc(doc(db, COLLECTIONS.ADMIN_CONFIG, 'setup'), {
      adminCount: increment(1),
    });

    return { success: true, admin: newAdmin };
  } catch (error: any) {
    console.error('Error creating admin:', error);
    return { success: false, error: error.message || 'Failed to create admin' };
  }
}

/**
 * Get all admins
 */
export async function getAllAdmins(): Promise<PlatformAdmin[]> {
  if (!isFirebaseConfigured() || !db) return [];

  try {
    const snapshot = await getDocs(
      query(collection(db, COLLECTIONS.ADMINS), orderBy('createdAt', 'desc'))
    );

    return snapshot.docs.map((doc) => {
      const { passwordHash, ...admin } = doc.data();
      return admin as PlatformAdmin;
    });
  } catch (error) {
    console.error('Error getting admins:', error);
    return [];
  }
}

// ============================================
// User Management
// ============================================

/**
 * Get all platform users with pagination
 */
export async function getUsers(
  options: {
    limit?: number;
    offset?: number;
    status?: 'active' | 'suspended' | 'deleted';
    planId?: string;
    search?: string;
  } = {}
): Promise<{ users: PlatformUser[]; total: number }> {
  if (!isFirebaseConfigured() || !db) return { users: [], total: 0 };

  try {
    let q = query(collection(db, COLLECTIONS.USERS), orderBy('createdAt', 'desc'));

    if (options.status) {
      q = query(q, where('status', '==', options.status));
    }

    if (options.planId) {
      q = query(q, where('planId', '==', options.planId));
    }

    if (options.limit) {
      q = query(q, limit(options.limit));
    }

    const snapshot = await getDocs(q);
    const users = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as PlatformUser[];

    return { users, total: snapshot.size };
  } catch (error) {
    console.error('Error getting users:', error);
    return { users: [], total: 0 };
  }
}

/**
 * Get single user by ID
 */
export async function getUser(userId: string): Promise<PlatformUser | null> {
  if (!isFirebaseConfigured() || !db) return null;

  try {
    const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, userId));
    if (!userDoc.exists()) return null;
    return { id: userDoc.id, ...userDoc.data() } as PlatformUser;
  } catch (error) {
    console.error('Error getting user:', error);
    return null;
  }
}

/**
 * Update user status
 */
export async function updateUserStatus(
  userId: string,
  status: 'active' | 'suspended' | 'deleted'
): Promise<boolean> {
  if (!isFirebaseConfigured() || !db) return false;

  try {
    await updateDoc(doc(db, COLLECTIONS.USERS, userId), {
      status,
      updatedAt: Date.now(),
    });
    return true;
  } catch (error) {
    console.error('Error updating user status:', error);
    return false;
  }
}

/**
 * Add credits to user
 */
export async function addUserCredits(userId: string, amount: number): Promise<boolean> {
  if (!isFirebaseConfigured() || !db) return false;

  try {
    await updateDoc(doc(db, COLLECTIONS.USERS, userId), {
      credits: increment(amount),
      updatedAt: Date.now(),
    });
    return true;
  } catch (error) {
    console.error('Error adding credits:', error);
    return false;
  }
}

/**
 * Update admin notes for user
 */
export async function updateUserNotes(userId: string, notes: string): Promise<boolean> {
  if (!isFirebaseConfigured() || !db) return false;

  try {
    await updateDoc(doc(db, COLLECTIONS.USERS, userId), {
      adminNotes: notes,
      updatedAt: Date.now(),
    });
    return true;
  } catch (error) {
    console.error('Error updating notes:', error);
    return false;
  }
}

// ============================================
// Revenue & Transactions
// ============================================

/**
 * Get revenue metrics
 */
export async function getRevenueMetrics(dateRange?: { start: number; end: number }): Promise<RevenueMetrics> {
  const defaultMetrics: RevenueMetrics = {
    totalRevenue: 0,
    subscriptionRevenue: 0,
    creditRevenue: 0,
    hostingRevenue: 0,
    refunds: 0,
    mrr: 0,
    arr: 0,
    arpu: 0,
    churnRate: 0,
    revenueChange: 0,
    mrrChange: 0,
    churnChange: 0,
  };

  if (!isFirebaseConfigured() || !db) return defaultMetrics;

  try {
    const metricsDoc = await getDoc(doc(db, COLLECTIONS.REVENUE_METRICS, 'current'));
    if (metricsDoc.exists()) {
      return metricsDoc.data() as RevenueMetrics;
    }
    return defaultMetrics;
  } catch (error) {
    console.error('Error getting revenue metrics:', error);
    return defaultMetrics;
  }
}

/**
 * Get transactions with pagination
 */
export async function getTransactions(
  options: {
    limit?: number;
    type?: Transaction['type'];
    status?: Transaction['status'];
    userId?: string;
  } = {}
): Promise<Transaction[]> {
  if (!isFirebaseConfigured() || !db) return [];

  try {
    let q = query(collection(db, COLLECTIONS.TRANSACTIONS), orderBy('createdAt', 'desc'));

    if (options.type) {
      q = query(q, where('type', '==', options.type));
    }

    if (options.status) {
      q = query(q, where('status', '==', options.status));
    }

    if (options.userId) {
      q = query(q, where('userId', '==', options.userId));
    }

    if (options.limit) {
      q = query(q, limit(options.limit));
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Transaction[];
  } catch (error) {
    console.error('Error getting transactions:', error);
    return [];
  }
}

/**
 * Process refund
 */
export async function processRefund(
  transactionId: string,
  reason: string,
  adminId: string
): Promise<{ success: boolean; error?: string }> {
  if (!isFirebaseConfigured() || !db) {
    return { success: false, error: 'Firebase not configured' };
  }

  try {
    const txDoc = await getDoc(doc(db, COLLECTIONS.TRANSACTIONS, transactionId));
    if (!txDoc.exists()) {
      return { success: false, error: 'Transaction not found' };
    }

    const tx = txDoc.data();
    if (tx.status === 'refunded') {
      return { success: false, error: 'Transaction already refunded' };
    }

    // Create refund transaction
    const refundId = `refund_${Date.now()}`;
    await setDoc(doc(db, COLLECTIONS.TRANSACTIONS, refundId), {
      id: refundId,
      userId: tx.userId,
      userEmail: tx.userEmail,
      userName: tx.userName,
      type: 'refund',
      amount: -tx.amount,
      currency: tx.currency,
      status: 'succeeded',
      metadata: {
        originalTransactionId: transactionId,
        refundReason: reason,
        processedBy: adminId,
      },
      createdAt: Date.now(),
    });

    // Update original transaction
    await updateDoc(doc(db, COLLECTIONS.TRANSACTIONS, transactionId), {
      status: 'refunded',
      metadata: {
        ...tx.metadata,
        refundId,
        refundReason: reason,
        refundedBy: adminId,
        refundedAt: Date.now(),
      },
    });

    return { success: true };
  } catch (error: any) {
    console.error('Error processing refund:', error);
    return { success: false, error: error.message };
  }
}

// ============================================
// Website Hosting Management
// ============================================

/**
 * Get all hosted websites
 */
export async function getHostedWebsites(
  options: {
    limit?: number;
    status?: HostedWebsite['status'];
    userId?: string;
  } = {}
): Promise<HostedWebsite[]> {
  if (!isFirebaseConfigured() || !db) return [];

  try {
    let q = query(collection(db, COLLECTIONS.WEBSITES), orderBy('createdAt', 'desc'));

    if (options.status) {
      q = query(q, where('status', '==', options.status));
    }

    if (options.userId) {
      q = query(q, where('userId', '==', options.userId));
    }

    if (options.limit) {
      q = query(q, limit(options.limit));
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as HostedWebsite[];
  } catch (error) {
    console.error('Error getting websites:', error);
    return [];
  }
}

/**
 * Update website status
 */
export async function updateWebsiteStatus(
  websiteId: string,
  status: HostedWebsite['status']
): Promise<boolean> {
  if (!isFirebaseConfigured() || !db) return false;

  try {
    await updateDoc(doc(db, COLLECTIONS.WEBSITES, websiteId), {
      status,
      updatedAt: Date.now(),
    });
    return true;
  } catch (error) {
    console.error('Error updating website status:', error);
    return false;
  }
}

// ============================================
// Support Tickets
// ============================================

/**
 * Get support tickets
 */
export async function getSupportTickets(
  options: {
    limit?: number;
    status?: TicketStatus;
    priority?: TicketPriority;
    category?: TicketCategory;
    assignedTo?: string;
  } = {}
): Promise<SupportTicket[]> {
  if (!isFirebaseConfigured() || !db) return [];

  try {
    let q = query(collection(db, COLLECTIONS.SUPPORT_TICKETS), orderBy('createdAt', 'desc'));

    if (options.status) {
      q = query(q, where('status', '==', options.status));
    }

    if (options.priority) {
      q = query(q, where('priority', '==', options.priority));
    }

    if (options.limit) {
      q = query(q, limit(options.limit));
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as SupportTicket[];
  } catch (error) {
    console.error('Error getting tickets:', error);
    return [];
  }
}

/**
 * Get single ticket
 */
export async function getTicket(ticketId: string): Promise<SupportTicket | null> {
  if (!isFirebaseConfigured() || !db) return null;

  try {
    const ticketDoc = await getDoc(doc(db, COLLECTIONS.SUPPORT_TICKETS, ticketId));
    if (!ticketDoc.exists()) return null;
    return { id: ticketDoc.id, ...ticketDoc.data() } as SupportTicket;
  } catch (error) {
    console.error('Error getting ticket:', error);
    return null;
  }
}

/**
 * Update ticket status
 */
export async function updateTicketStatus(
  ticketId: string,
  status: TicketStatus
): Promise<boolean> {
  if (!isFirebaseConfigured() || !db) return false;

  try {
    const updates: any = { status, updatedAt: Date.now() };
    if (status === 'resolved') {
      updates.resolvedAt = Date.now();
    }

    await updateDoc(doc(db, COLLECTIONS.SUPPORT_TICKETS, ticketId), updates);
    return true;
  } catch (error) {
    console.error('Error updating ticket:', error);
    return false;
  }
}

/**
 * Add message to ticket
 */
export async function addTicketMessage(
  ticketId: string,
  message: Omit<TicketMessage, 'id' | 'createdAt'>
): Promise<boolean> {
  if (!isFirebaseConfigured() || !db) return false;

  try {
    const ticket = await getTicket(ticketId);
    if (!ticket) return false;

    const newMessage: TicketMessage = {
      ...message,
      id: `msg_${Date.now()}`,
      createdAt: Date.now(),
    };

    const updates: any = {
      messages: [...ticket.messages, newMessage],
      updatedAt: Date.now(),
    };

    // Set first response time if admin responding for first time
    if (message.senderType === 'admin' && !ticket.firstResponseAt) {
      updates.firstResponseAt = Date.now();
    }

    await updateDoc(doc(db, COLLECTIONS.SUPPORT_TICKETS, ticketId), updates);
    return true;
  } catch (error) {
    console.error('Error adding message:', error);
    return false;
  }
}

/**
 * Assign ticket to admin
 */
export async function assignTicket(
  ticketId: string,
  adminId: string,
  adminName: string
): Promise<boolean> {
  if (!isFirebaseConfigured() || !db) return false;

  try {
    await updateDoc(doc(db, COLLECTIONS.SUPPORT_TICKETS, ticketId), {
      assignedTo: adminId,
      assignedToName: adminName,
      updatedAt: Date.now(),
    });
    return true;
  } catch (error) {
    console.error('Error assigning ticket:', error);
    return false;
  }
}

// ============================================
// Analytics
// ============================================

/**
 * Get platform analytics
 */
export async function getPlatformAnalytics(): Promise<PlatformAnalytics> {
  const defaultAnalytics: PlatformAnalytics = {
    totalUsers: 0,
    activeUsers: 0,
    newUsersToday: 0,
    newUsersThisMonth: 0,
    userGrowthRate: 0,
    dau: 0,
    wau: 0,
    mau: 0,
    avgSessionDuration: 0,
    actionsPerSession: 0,
    featureUsage: [],
    visitors: 0,
    signups: 0,
    trials: 0,
    paidUsers: 0,
    aiGenerations: [],
    totalApiCost: 0,
  };

  if (!isFirebaseConfigured() || !db) return defaultAnalytics;

  try {
    const analyticsDoc = await getDoc(doc(db, COLLECTIONS.ANALYTICS, 'current'));
    if (analyticsDoc.exists()) {
      return analyticsDoc.data() as PlatformAnalytics;
    }
    return defaultAnalytics;
  } catch (error) {
    console.error('Error getting analytics:', error);
    return defaultAnalytics;
  }
}

// ============================================
// Helper Functions
// ============================================

/**
 * Simple password hashing (use bcrypt in production)
 */
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + 'renova8_salt_2024');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Verify password
 */
async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const passwordHash = await hashPassword(password);
  return passwordHash === hash;
}

/**
 * Generate secure session token
 */
export function generateSessionToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// ============================================
// Additional Admin Functions
// ============================================

/**
 * Get all admins (alias for getAllAdmins)
 */
export async function getAdmins(): Promise<PlatformAdmin[]> {
  return getAllAdmins();
}

/**
 * Update admin
 */
export async function updateAdmin(
  adminId: string,
  updates: Partial<Omit<PlatformAdmin, 'id' | 'email' | 'createdAt' | 'createdBy'>>
): Promise<boolean> {
  if (!isFirebaseConfigured() || !db) return false;

  try {
    await updateDoc(doc(db, COLLECTIONS.ADMINS, adminId), {
      ...updates,
      updatedAt: Date.now(),
    });
    return true;
  } catch (error) {
    console.error('Error updating admin:', error);
    return false;
  }
}

/**
 * Delete admin
 */
export async function deleteAdmin(adminId: string): Promise<boolean> {
  if (!isFirebaseConfigured() || !db) return false;

  try {
    await deleteDoc(doc(db, COLLECTIONS.ADMINS, adminId));

    // Update admin count
    await updateDoc(doc(db, COLLECTIONS.ADMIN_CONFIG, 'setup'), {
      adminCount: increment(-1),
    });

    return true;
  } catch (error) {
    console.error('Error deleting admin:', error);
    return false;
  }
}

/**
 * Update user credits
 */
export async function updateUserCredits(userId: string, amount: number): Promise<boolean> {
  return addUserCredits(userId, amount);
}

/**
 * Get websites with pagination
 */
export async function getWebsites(
  options: {
    search?: string;
    status?: 'active' | 'suspended' | 'deleted';
    page?: number;
    limit?: number;
  } = {}
): Promise<{ websites: HostedWebsite[]; total: number }> {
  if (!isFirebaseConfigured() || !db) return { websites: [], total: 0 };

  try {
    let q = query(collection(db, COLLECTIONS.WEBSITES), orderBy('createdAt', 'desc'));

    if (options.status) {
      q = query(q, where('status', '==', options.status));
    }

    if (options.limit) {
      q = query(q, limit(options.limit));
    }

    const snapshot = await getDocs(q);
    const websites = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as HostedWebsite[];

    return { websites, total: snapshot.size };
  } catch (error) {
    console.error('Error getting websites:', error);
    return { websites: [], total: 0 };
  }
}

/**
 * Get analytics (alias for getPlatformAnalytics)
 */
export async function getAnalytics(): Promise<PlatformAnalytics> {
  return getPlatformAnalytics();
}

/**
 * Get subscription plans
 */
export async function getSubscriptionPlans(): Promise<{
  id: string;
  name: string;
  price: number;
  interval: 'month' | 'year';
  credits: number;
  websitesLimit: number;
  features: string[];
  activeSubscriptions: number;
}[]> {
  if (!isFirebaseConfigured() || !db) {
    // Return demo plans when Firebase is not configured
    return [
      { id: 'free', name: 'Free', price: 0, interval: 'month', credits: 50, websitesLimit: 1, features: ['Basic features'], activeSubscriptions: 0 },
      { id: 'starter', name: 'Starter', price: 29, interval: 'month', credits: 200, websitesLimit: 3, features: ['All basic features', 'Email support'], activeSubscriptions: 0 },
      { id: 'pro', name: 'Pro', price: 79, interval: 'month', credits: 500, websitesLimit: 10, features: ['All starter features', 'Priority support'], activeSubscriptions: 0 },
      { id: 'enterprise', name: 'Enterprise', price: 199, interval: 'month', credits: 2000, websitesLimit: 50, features: ['Unlimited features', 'Dedicated support'], activeSubscriptions: 0 },
    ];
  }

  try {
    const snapshot = await getDocs(collection(db, COLLECTIONS.SUBSCRIPTIONS));
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as any[];
  } catch (error) {
    console.error('Error getting subscription plans:', error);
    return [];
  }
}

/**
 * Get system health metrics
 */
export async function getSystemHealth(): Promise<SystemHealth> {
  const defaultHealth: SystemHealth = {
    services: [
      { name: 'Firebase', status: 'online', latency: 45, uptime: 99.9, requests: 15420 },
      { name: 'Stripe API', status: 'online', latency: 120, uptime: 99.8, requests: 3240 },
      { name: 'Gemini AI', status: 'online', latency: 450, uptime: 99.5, requests: 8920 },
      { name: 'Hosting CDN', status: 'online', latency: 25, uptime: 99.99, requests: 125000 },
    ],
    webVitals: {
      lcp: 1200,
      fid: 50,
      cls: 0.05,
      ttfb: 180,
    },
    errors: {
      total: 24,
      critical: 0,
      warnings: 8,
      info: 16,
      recentErrors: [],
    },
    resourceUsage: {
      firebase: [
        { service: 'Firestore Reads', usage: 45000, limit: 50000, cost: 0.36 },
        { service: 'Firestore Writes', usage: 12000, limit: 20000, cost: 0.18 },
        { service: 'Storage', usage: 2500000000, limit: 5000000000, cost: 0.13 },
        { service: 'Functions', usage: 125000, limit: 200000, cost: 0.40 },
      ],
      externalApis: [
        { api: 'Gemini AI', requests: 8920, quota: 10000, cost: 178.40 },
        { api: 'Stripe', requests: 3240, quota: 10000, cost: 32.40 },
        { api: 'SendGrid', requests: 1560, quota: 10000, cost: 15.60 },
      ],
      projectedCost: 227.47,
      budget: 500,
    },
  };

  if (!isFirebaseConfigured() || !db) return defaultHealth;

  try {
    const healthDoc = await getDoc(doc(db, COLLECTIONS.ANALYTICS, 'health'));
    if (healthDoc.exists()) {
      return healthDoc.data() as SystemHealth;
    }
    return defaultHealth;
  } catch (error) {
    console.error('Error getting system health:', error);
    return defaultHealth;
  }
}

/**
 * Process refund (updated signature)
 */
export async function processRefundSimple(
  transactionId: string,
  reason: string
): Promise<{ success: boolean; error?: string }> {
  return processRefund(transactionId, reason, 'system');
}

/**
 * Get transactions with pagination (updated)
 */
export async function getTransactionsPaginated(
  options: {
    type?: Transaction['type'];
    startDate?: number;
    page?: number;
    limit?: number;
  } = {}
): Promise<{ transactions: Transaction[]; total: number }> {
  const transactions = await getTransactions({
    type: options.type,
    limit: options.limit,
  });
  return { transactions, total: transactions.length };
}

// ============================================
// Platform API Settings
// ============================================

/**
 * Get platform API settings (calls Cloud Function)
 */
export async function getPlatformAPISettings(): Promise<{
  settings: PlatformAPISettings;
  stats: {
    totalKeys: number;
    activeKeys: number;
    totalUsageToday: number;
    totalUsageAllTime: number;
  };
}> {
  // Return demo data if Firebase not configured
  if (!isFirebaseConfigured() || !firebaseFunctions) {
    return {
      settings: {
        ...DEFAULT_PLATFORM_API_SETTINGS,
        updatedAt: Date.now(),
        updatedBy: 'demo',
      },
      stats: {
        totalKeys: 0,
        activeKeys: 0,
        totalUsageToday: 0,
        totalUsageAllTime: 0,
      },
    };
  }

  try {
    const getPlatformSettingsFn = httpsCallable<void, {
      success: boolean;
      settings: PlatformAPISettings;
      stats: any;
    }>(firebaseFunctions, 'getPlatformSettings');

    const result = await getPlatformSettingsFn();
    return {
      settings: result.data.settings,
      stats: result.data.stats,
    };
  } catch (error) {
    console.error('Error getting platform settings:', error);
    throw error;
  }
}

/**
 * Add a new API key
 */
export async function addPlatformApiKey(
  key: string,
  name: string
): Promise<{ success: boolean; keyId?: string; error?: string }> {
  if (!isFirebaseConfigured() || !firebaseFunctions) {
    return { success: false, error: 'Firebase not configured' };
  }

  try {
    const addApiKeyFn = httpsCallable<
      { key: string; name: string },
      { success: boolean; keyId: string; message: string }
    >(firebaseFunctions, 'addPlatformApiKey');

    const result = await addApiKeyFn({ key, name });
    return { success: result.data.success, keyId: result.data.keyId };
  } catch (error: any) {
    console.error('Error adding API key:', error);
    return { success: false, error: error.message || 'Failed to add API key' };
  }
}

/**
 * Remove an API key
 */
export async function removePlatformApiKey(
  keyId: string
): Promise<{ success: boolean; error?: string }> {
  if (!isFirebaseConfigured() || !firebaseFunctions) {
    return { success: false, error: 'Firebase not configured' };
  }

  try {
    const removeApiKeyFn = httpsCallable<
      { keyId: string },
      { success: boolean; message: string }
    >(firebaseFunctions, 'removePlatformApiKey');

    const result = await removeApiKeyFn({ keyId });
    return { success: result.data.success };
  } catch (error: any) {
    console.error('Error removing API key:', error);
    return { success: false, error: error.message || 'Failed to remove API key' };
  }
}

/**
 * Update an API key
 */
export async function updatePlatformApiKey(
  keyId: string,
  updates: { name?: string; isActive?: boolean; dailyLimit?: number }
): Promise<{ success: boolean; error?: string }> {
  if (!isFirebaseConfigured() || !firebaseFunctions) {
    return { success: false, error: 'Firebase not configured' };
  }

  try {
    const updateApiKeyFn = httpsCallable<
      { keyId: string; updates: typeof updates },
      { success: boolean; message: string }
    >(firebaseFunctions, 'updatePlatformApiKey');

    const result = await updateApiKeyFn({ keyId, updates });
    return { success: result.data.success };
  } catch (error: any) {
    console.error('Error updating API key:', error);
    return { success: false, error: error.message || 'Failed to update API key' };
  }
}

/**
 * Update API key rotation strategy
 */
export async function updateRotationStrategy(
  strategy: ApiKeyRotationStrategy
): Promise<{ success: boolean; error?: string }> {
  if (!isFirebaseConfigured() || !firebaseFunctions) {
    return { success: false, error: 'Firebase not configured' };
  }

  try {
    const updateStrategyFn = httpsCallable<
      { strategy: ApiKeyRotationStrategy },
      { success: boolean; message: string }
    >(firebaseFunctions, 'updateApiKeyRotationStrategy');

    const result = await updateStrategyFn({ strategy });
    return { success: result.data.success };
  } catch (error: any) {
    console.error('Error updating rotation strategy:', error);
    return { success: false, error: error.message || 'Failed to update strategy' };
  }
}

/**
 * Update rate limits
 */
export async function updatePlatformRateLimits(
  rateLimits: Partial<RateLimitConfig>
): Promise<{ success: boolean; error?: string }> {
  if (!isFirebaseConfigured() || !firebaseFunctions) {
    return { success: false, error: 'Firebase not configured' };
  }

  try {
    const updateRateLimitsFn = httpsCallable<
      { rateLimits: Partial<RateLimitConfig> },
      { success: boolean; message: string }
    >(firebaseFunctions, 'updatePlatformRateLimits');

    const result = await updateRateLimitsFn({ rateLimits });
    return { success: result.data.success };
  } catch (error: any) {
    console.error('Error updating rate limits:', error);
    return { success: false, error: error.message || 'Failed to update rate limits' };
  }
}

/**
 * Update token limits
 */
export async function updatePlatformTokenLimits(
  tokenLimits: Partial<TokenLimitConfig>
): Promise<{ success: boolean; error?: string }> {
  if (!isFirebaseConfigured() || !firebaseFunctions) {
    return { success: false, error: 'Firebase not configured' };
  }

  try {
    const updateTokenLimitsFn = httpsCallable<
      { tokenLimits: Partial<TokenLimitConfig> },
      { success: boolean; message: string }
    >(firebaseFunctions, 'updatePlatformTokenLimits');

    const result = await updateTokenLimitsFn({ tokenLimits });
    return { success: result.data.success };
  } catch (error: any) {
    console.error('Error updating token limits:', error);
    return { success: false, error: error.message || 'Failed to update token limits' };
  }
}
