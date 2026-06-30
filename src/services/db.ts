import { auth, firestore } from './firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  collection, 
  getDocs, 
  query, 
  where, 
  addDoc, 
  runTransaction 
} from 'firebase/firestore';
import { User, Item, RequestItem, AssignedItem, Complaint, UserRole } from '../types';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export const isFirebaseConfigured = true;
export const isSupabaseConfigured = false; // Backward compatibility alias

let resolveAuthInitialized: () => void;
const authInitializedPromise = new Promise<void>((resolve) => {
  resolveAuthInitialized = resolve;
});

onAuthStateChanged(auth, () => {
  resolveAuthInitialized();
});

function shouldUseFirebaseSync(): boolean {
  if (!isFirebaseConfigured) return false;
  try {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEYS.CURRENT_USER);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed.id?.startsWith('demo-') || parsed.id?.startsWith('local-')) {
        return false;
      }
    }
  } catch {
    return false;
  }
  return true;
}

// ==========================================
// HIGH-FIDELITY LOCAL STORAGE DATABASE SIMULATOR
// ==========================================

const LOCAL_STORAGE_KEYS = {
  USERS: 'ims_users',
  ITEMS: 'ims_items',
  REQUESTS: 'ims_requests',
  ASSIGNED_ITEMS: 'ims_assigned_items',
  COMPLAINTS: 'ims_complaints',
  CURRENT_USER: 'ims_current_user',
};

const DEFAULT_USERS: User[] = [
  {
    id: 'user-admin-1',
    name: 'Sarah Jenkins',
    email: 'admin@company.com',
    role: 'admin',
    created_at: new Date().toISOString(),
  },
  {
    id: 'user-manager-1',
    name: 'David Miller',
    email: 'manager@company.com',
    role: 'store',
    created_at: new Date().toISOString(),
  },
  {
    id: 'user-employee-1',
    name: 'Alex Rivera',
    email: 'employee@company.com',
    role: 'user',
    created_at: new Date().toISOString(),
  },
];

const DEFAULT_ITEMS: Item[] = [
  { id: 'item-1', name: 'MacBook Pro 16" M3', category: 'Hardware', quantity: 12 },
  { id: 'item-2', name: 'Dell UltraSharp 27" Monitor', category: 'Hardware', quantity: 8 },
  { id: 'item-3', name: 'Keychron K2 Keyboard', category: 'Accessories', quantity: 20 },
  { id: 'item-4', name: 'Logitech MX Master 3S Mouse', category: 'Accessories', quantity: 25 },
  { id: 'item-5', name: 'USB-C Charger (96W)', category: 'Cables & Power', quantity: 45 },
  { id: 'item-6', name: 'Standing Desk (Smart)', category: 'Furniture', quantity: 4 },
];

const DEFAULT_REQUESTS: RequestItem[] = [
  { id: 'req-1', user_id: 'user-employee-1', item_id: 'item-1', status: 'approved', created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 'req-2', user_id: 'user-employee-1', item_id: 'item-3', status: 'pending', created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() },
];

const DEFAULT_ASSIGNED_ITEMS: AssignedItem[] = [
  { id: 'assign-1', user_id: 'user-employee-1', item_id: 'item-1', assigned_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() },
];

const DEFAULT_COMPLAINTS: Complaint[] = [
  { id: 'comp-1', user_id: 'user-employee-1', item_id: 'item-1', message: 'The screen keeps flickering when connecting to external display.', status: 'pending', created_at: new Date().toISOString() },
];

// Initialize local database
function initializeLocalDb() {
  if (!localStorage.getItem(LOCAL_STORAGE_KEYS.USERS)) {
    localStorage.setItem(LOCAL_STORAGE_KEYS.USERS, JSON.stringify(DEFAULT_USERS));
  }
  if (!localStorage.getItem(LOCAL_STORAGE_KEYS.ITEMS)) {
    localStorage.setItem(LOCAL_STORAGE_KEYS.ITEMS, JSON.stringify(DEFAULT_ITEMS));
  }
  if (!localStorage.getItem(LOCAL_STORAGE_KEYS.REQUESTS)) {
    localStorage.setItem(LOCAL_STORAGE_KEYS.REQUESTS, JSON.stringify(DEFAULT_REQUESTS));
  }
  if (!localStorage.getItem(LOCAL_STORAGE_KEYS.ASSIGNED_ITEMS)) {
    localStorage.setItem(LOCAL_STORAGE_KEYS.ASSIGNED_ITEMS, JSON.stringify(DEFAULT_ASSIGNED_ITEMS));
  }
  if (!localStorage.getItem(LOCAL_STORAGE_KEYS.COMPLAINTS)) {
    localStorage.setItem(LOCAL_STORAGE_KEYS.COMPLAINTS, JSON.stringify(DEFAULT_COMPLAINTS));
  }
}

// Helper fetchers
function getLocalData<T>(key: string): T[] {
  initializeLocalDb();
  const raw = localStorage.getItem(key);
  return raw ? JSON.parse(raw) : [];
}

function setLocalData<T>(key: string, data: T[]): void {
  localStorage.setItem(key, JSON.stringify(data));
}

// Simple simulated delay
const delay = (ms = 150) => new Promise((resolve) => setTimeout(resolve, ms));

// ==========================================
// UNIFIED DATABASE & AUTHENTICATION SERVICE
// ==========================================

export const dbService = {
  // ----------------------------------------
  // AUTHENTICATION
  // ----------------------------------------

  async getCurrentUser(): Promise<User | null> {
    if (isFirebaseConfigured) {
      await authInitializedPromise;
    }
    await delay(100);
    // Try to get cached user first for instant load
    const stored = localStorage.getItem(LOCAL_STORAGE_KEYS.CURRENT_USER);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Verify with firebase current user if online and not a demo/local user
      if (isFirebaseConfigured && auth.currentUser && !parsed.id?.startsWith('demo-') && !parsed.id?.startsWith('local-')) {
        const userDoc = await getDoc(doc(firestore, 'users', auth.currentUser.uid));
        if (userDoc.exists()) {
          const freshUser = userDoc.data() as User;
          localStorage.setItem(LOCAL_STORAGE_KEYS.CURRENT_USER, JSON.stringify(freshUser));
          return freshUser;
        }
      }
      return parsed;
    }

    if (isFirebaseConfigured && auth.currentUser) {
      const userDoc = await getDoc(doc(firestore, 'users', auth.currentUser.uid));
      if (userDoc.exists()) {
        const freshUser = userDoc.data() as User;
        localStorage.setItem(LOCAL_STORAGE_KEYS.CURRENT_USER, JSON.stringify(freshUser));
        return freshUser;
      }
      return {
        id: auth.currentUser.uid,
        name: auth.currentUser.displayName || 'Employee',
        email: auth.currentUser.email || '',
        role: 'user',
      };
    }
    return null;
  },

  async login(email: string, password_raw: string): Promise<User> {
    await delay(200);
    const lowerEmail = email.toLowerCase();
    const isDemoEmail = ['admin@company.com', 'manager@company.com', 'employee@company.com'].includes(lowerEmail);

    if (isFirebaseConfigured) {
      try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password_raw);
        const authUser = userCredential.user;

        const userDoc = await getDoc(doc(firestore, 'users', authUser.uid));
        let loggedInUser: User;

        if (!userDoc.exists()) {
          let role: UserRole = 'user';
          let name = 'Alex Rivera';
          if (lowerEmail === 'admin@company.com') {
            role = 'admin';
            name = 'Sarah Jenkins';
          } else if (lowerEmail === 'manager@company.com') {
            role = 'store';
            name = 'David Miller';
          }

          loggedInUser = {
            id: authUser.uid,
            name,
            email,
            role,
            created_at: new Date().toISOString(),
          };
          await setDoc(doc(firestore, 'users', authUser.uid), loggedInUser);
        } else {
          loggedInUser = userDoc.data() as User;
        }

        localStorage.setItem(LOCAL_STORAGE_KEYS.CURRENT_USER, JSON.stringify(loggedInUser));
        return loggedInUser;
      } catch (err: any) {
        // If credentials not found and is a demo account, auto-register on the fly
        if (isDemoEmail && (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential' || err.code === 'auth/invalid-email' || err.message?.includes('INVALID_LOGIN_CREDENTIALS') || err.message?.includes('not found'))) {
          let demoName = 'Alex Rivera';
          let demoRole: UserRole = 'user';
          if (lowerEmail === 'admin@company.com') {
            demoName = 'Sarah Jenkins';
            demoRole = 'admin';
          } else if (lowerEmail === 'manager@company.com') {
            demoName = 'David Miller';
            demoRole = 'store';
          }

          try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password_raw);
            const authUser = userCredential.user;

            const newUser: User = {
              id: authUser.uid,
              name: demoName,
              email: email,
              role: demoRole,
              created_at: new Date().toISOString(),
            };

            await setDoc(doc(firestore, 'users', authUser.uid), newUser);
            localStorage.setItem(LOCAL_STORAGE_KEYS.CURRENT_USER, JSON.stringify(newUser));
            return newUser;
          } catch (autoRegErr: any) {
            console.warn('Auto-registration of sandbox user failed, falling back to local simulation:', autoRegErr);
            const localUser: User = {
              id: `demo-${lowerEmail.split('@')[0]}`,
              name: demoName,
              email: email,
              role: demoRole,
              created_at: new Date().toISOString(),
            };
            localStorage.setItem(LOCAL_STORAGE_KEYS.CURRENT_USER, JSON.stringify(localUser));
            return localUser;
          }
        }

        // Fallback to local matching
        const users = getLocalData<User>(LOCAL_STORAGE_KEYS.USERS);
        const localMatch = users.find((u) => u.email.toLowerCase() === lowerEmail);
        if (localMatch) {
          localStorage.setItem(LOCAL_STORAGE_KEYS.CURRENT_USER, JSON.stringify(localMatch));
          return localMatch;
        }

        throw err;
      }
    } else {
      const users = getLocalData<User>(LOCAL_STORAGE_KEYS.USERS);
      const match = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
      if (!match) {
        throw new Error('Invalid email or password. Try registering a standard Employee account.');
      }
      localStorage.setItem(LOCAL_STORAGE_KEYS.CURRENT_USER, JSON.stringify(match));
      return match;
    }
  },

  async signUp(email: string, password_raw: string, name: string): Promise<User> {
    await delay(300);
    if (isFirebaseConfigured) {
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password_raw);
        const authUser = userCredential.user;

        const newUser: User = {
          id: authUser.uid,
          name,
          email,
          role: 'user', // Default role
          created_at: new Date().toISOString(),
        };

        await setDoc(doc(firestore, 'users', authUser.uid), newUser);
        localStorage.setItem(LOCAL_STORAGE_KEYS.CURRENT_USER, JSON.stringify(newUser));
        return newUser;
      } catch (err: any) {
        console.warn('Firebase registration failed, falling back to local registration:', err);
        
        const users = getLocalData<User>(LOCAL_STORAGE_KEYS.USERS);
        if (users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
          throw new Error('A user with this email already exists');
        }

        const newUser: User = {
          id: `local-${Date.now()}`,
          name,
          email,
          role: 'user',
          created_at: new Date().toISOString(),
        };

        users.push(newUser);
        setLocalData(LOCAL_STORAGE_KEYS.USERS, users);
        localStorage.setItem(LOCAL_STORAGE_KEYS.CURRENT_USER, JSON.stringify(newUser));
        return newUser;
      }
    } else {
      const users = getLocalData<User>(LOCAL_STORAGE_KEYS.USERS);
      if (users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
        throw new Error('A user with this email already exists');
      }

      const newUser: User = {
        id: `user-${Date.now()}`,
        name,
        email,
        role: 'user',
        created_at: new Date().toISOString(),
      };

      users.push(newUser);
      setLocalData(LOCAL_STORAGE_KEYS.USERS, users);
      localStorage.setItem(LOCAL_STORAGE_KEYS.CURRENT_USER, JSON.stringify(newUser));
      return newUser;
    }
  },

  async logout(): Promise<void> {
    await delay(100);
    if (isFirebaseConfigured) {
      try {
        await signOut(auth);
      } catch (err) {
        console.error('Firebase signout error:', err);
      }
    }
    localStorage.removeItem(LOCAL_STORAGE_KEYS.CURRENT_USER);
  },

  // ----------------------------------------
  // USERS MANAGEMENT
  // ----------------------------------------

  async getAllUsers(): Promise<User[]> {
    await delay(150);
    if (shouldUseFirebaseSync()) {
      try {
        const usersCol = collection(firestore, 'users');
        const qSnap = await getDocs(usersCol);
        
        // If Firestore users collection is empty, sync default users
        if (qSnap.empty) {
          const batchPromises = DEFAULT_USERS.map(u => 
            setDoc(doc(firestore, 'users', u.id), u)
          );
          await Promise.all(batchPromises);
          const reSnap = await getDocs(usersCol);
          return reSnap.docs.map(doc => doc.data() as User);
        }
        
        return qSnap.docs.map(doc => doc.data() as User);
      } catch (err) {
        console.error('Error fetching users from Firestore:', err);
        return getLocalData<User>(LOCAL_STORAGE_KEYS.USERS);
      }
    } else {
      return getLocalData<User>(LOCAL_STORAGE_KEYS.USERS);
    }
  },

  async updateUserRole(userId: string, role: UserRole): Promise<User> {
    await delay(150);
    if (shouldUseFirebaseSync()) {
      const userRef = doc(firestore, 'users', userId);
      await updateDoc(userRef, { role });
      const updatedDoc = await getDoc(userRef);
      const updatedUser = updatedDoc.data() as User;

      // Sync active user role if updating self
      const currentUser = localStorage.getItem(LOCAL_STORAGE_KEYS.CURRENT_USER);
      if (currentUser) {
        const parsed: User = JSON.parse(currentUser);
        if (parsed.id === userId) {
          parsed.role = role;
          localStorage.setItem(LOCAL_STORAGE_KEYS.CURRENT_USER, JSON.stringify(parsed));
        }
      }

      return updatedUser;
    } else {
      const users = getLocalData<User>(LOCAL_STORAGE_KEYS.USERS);
      const index = users.findIndex((u) => u.id === userId);
      if (index === -1) throw new Error('User not found');
      users[index].role = role;
      setLocalData(LOCAL_STORAGE_KEYS.USERS, users);

      const currentUser = localStorage.getItem(LOCAL_STORAGE_KEYS.CURRENT_USER);
      if (currentUser) {
        const parsed: User = JSON.parse(currentUser);
        if (parsed.id === userId) {
          parsed.role = role;
          localStorage.setItem(LOCAL_STORAGE_KEYS.CURRENT_USER, JSON.stringify(parsed));
        }
      }

      return users[index];
    }
  },

  // ----------------------------------------
  // ITEMS (INVENTORY)
  // ----------------------------------------

  async getItems(): Promise<Item[]> {
    await delay(150);
    if (shouldUseFirebaseSync()) {
      try {
        const itemsCol = collection(firestore, 'items');
        const qSnap = await getDocs(itemsCol);
        if (qSnap.empty) {
          const batchPromises = DEFAULT_ITEMS.map(item => {
            const { id, ...itemData } = item;
            return setDoc(doc(firestore, 'items', id), {
              ...itemData,
              created_at: new Date().toISOString()
            });
          });
          await Promise.all(batchPromises);
          const reSnap = await getDocs(itemsCol);
          return reSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Item));
        }
        return qSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Item));
      } catch (err) {
        console.error('Error fetching items from Firestore:', err);
        return getLocalData<Item>(LOCAL_STORAGE_KEYS.ITEMS);
      }
    } else {
      return getLocalData<Item>(LOCAL_STORAGE_KEYS.ITEMS);
    }
  },

  async addItem(name: string, category: string, quantity: number): Promise<Item> {
    await delay(150);
    if (quantity < 0) throw new Error('Quantity cannot be negative');
    if (shouldUseFirebaseSync()) {
      const docRef = await addDoc(collection(firestore, 'items'), {
        name,
        category,
        quantity,
        created_at: new Date().toISOString()
      });
      return { id: docRef.id, name, category, quantity };
    } else {
      const items = getLocalData<Item>(LOCAL_STORAGE_KEYS.ITEMS);
      const newItem: Item = {
        id: `item-${Date.now()}`,
        name,
        category,
        quantity,
      };
      items.push(newItem);
      setLocalData(LOCAL_STORAGE_KEYS.ITEMS, items);
      return newItem;
    }
  },

  async updateItemStock(itemId: string, quantity: number): Promise<Item> {
    await delay(150);
    if (quantity < 0) throw new Error('Quantity cannot be negative');
    if (shouldUseFirebaseSync()) {
      const itemRef = doc(firestore, 'items', itemId);
      await updateDoc(itemRef, { quantity });
      const updatedDoc = await getDoc(itemRef);
      return { id: itemId, ...updatedDoc.data() } as Item;
    } else {
      const items = getLocalData<Item>(LOCAL_STORAGE_KEYS.ITEMS);
      const index = items.findIndex((i) => i.id === itemId);
      if (index === -1) throw new Error('Item not found');
      items[index].quantity = quantity;
      setLocalData(LOCAL_STORAGE_KEYS.ITEMS, items);
      return items[index];
    }
  },

  async deleteItem(itemId: string): Promise<void> {
    await delay(150);
    if (shouldUseFirebaseSync()) {
      await deleteDoc(doc(firestore, 'items', itemId));
    } else {
      const items = getLocalData<Item>(LOCAL_STORAGE_KEYS.ITEMS);
      const filtered = items.filter((i) => i.id !== itemId);
      setLocalData(LOCAL_STORAGE_KEYS.ITEMS, filtered);
    }
  },

  // ----------------------------------------
  // REQUESTS (RESERVATIONS & REQUISITIONS)
  // ----------------------------------------

  async getRequests(): Promise<RequestItem[]> {
    await delay(150);
    if (shouldUseFirebaseSync()) {
      try {
        const qSnap = await getDocs(collection(firestore, 'requests'));
        const [users, items] = await Promise.all([
          dbService.getAllUsers(),
          dbService.getItems()
        ]);
        const reqList = qSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
        return reqList.map(req => ({
          ...req,
          user: users.find(u => u.id === req.user_id),
          item: items.find(i => i.id === req.item_id)
        })).sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
      } catch (err) {
        console.error('Error fetching requests from Firestore:', err);
        return [];
      }
    } else {
      const requests = getLocalData<RequestItem>(LOCAL_STORAGE_KEYS.REQUESTS);
      const users = getLocalData<User>(LOCAL_STORAGE_KEYS.USERS);
      const items = getLocalData<Item>(LOCAL_STORAGE_KEYS.ITEMS);

      return requests.map((req) => ({
        ...req,
        user: users.find((u) => u.id === req.user_id),
        item: items.find((i) => i.id === req.item_id),
      })).reverse();
    }
  },

  async getMyRequests(userId: string): Promise<RequestItem[]> {
    await delay(150);
    if (shouldUseFirebaseSync()) {
      try {
        const q = query(collection(firestore, 'requests'), where('user_id', '==', userId));
        const qSnap = await getDocs(q);
        const items = await dbService.getItems();
        
        const reqList = qSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
        return reqList.map(req => ({
          ...req,
          item: items.find(i => i.id === req.item_id)
        })).sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
      } catch (err) {
        console.error('Error fetching my requests from Firestore:', err);
        return [];
      }
    } else {
      const requests = getLocalData<RequestItem>(LOCAL_STORAGE_KEYS.REQUESTS);
      const items = getLocalData<Item>(LOCAL_STORAGE_KEYS.ITEMS);

      return requests
        .filter((req) => req.user_id === userId)
        .map((req) => ({
          ...req,
          item: items.find((i) => i.id === req.item_id),
        })).reverse();
    }
  },

  async createRequest(userId: string, itemId: string): Promise<RequestItem> {
    await delay(150);
    if (shouldUseFirebaseSync()) {
      const docRef = await addDoc(collection(firestore, 'requests'), {
        user_id: userId,
        item_id: itemId,
        status: 'pending',
        created_at: new Date().toISOString()
      });
      return { id: docRef.id, user_id: userId, item_id: itemId, status: 'pending', created_at: new Date().toISOString() };
    } else {
      const requests = getLocalData<RequestItem>(LOCAL_STORAGE_KEYS.REQUESTS);
      const newReq: RequestItem = {
        id: `req-${Date.now()}`,
        user_id: userId,
        item_id: itemId,
        status: 'pending',
        created_at: new Date().toISOString(),
      };
      requests.push(newReq);
      setLocalData(LOCAL_STORAGE_KEYS.REQUESTS, requests);
      return newReq;
    }
  },

  async handleRequest(requestId: string, status: 'approved' | 'rejected'): Promise<RequestItem> {
    await delay(150);
    if (shouldUseFirebaseSync()) {
      await runTransaction(firestore, async (transaction) => {
        const reqRef = doc(firestore, 'requests', requestId);
        const reqDoc = await transaction.get(reqRef);
        if (!reqDoc.exists()) throw new Error('Request not found');
        const reqData = reqDoc.data();
        
        if (status === 'approved') {
          const itemRef = doc(firestore, 'items', reqData.item_id);
          const itemDoc = await transaction.get(itemRef);
          if (!itemDoc.exists()) throw new Error('Inventory item not found');
          const itemData = itemDoc.data();
          if (itemData.quantity <= 0) throw new Error('Insufficient item stock to approve');
          
          transaction.update(itemRef, { quantity: itemData.quantity - 1 });
          
          const assignRef = doc(collection(firestore, 'assigned_items'));
          transaction.set(assignRef, {
            user_id: reqData.user_id,
            item_id: reqData.item_id,
            assigned_date: new Date().toISOString()
          });
        }
        
        transaction.update(reqRef, { status });
      });

      const updatedDoc = await getDoc(doc(firestore, 'requests', requestId));
      return { id: requestId, ...updatedDoc.data() } as RequestItem;
    } else {
      const requests = getLocalData<RequestItem>(LOCAL_STORAGE_KEYS.REQUESTS);
      const items = getLocalData<Item>(LOCAL_STORAGE_KEYS.ITEMS);
      const assigned = getLocalData<AssignedItem>(LOCAL_STORAGE_KEYS.ASSIGNED_ITEMS);

      const reqIndex = requests.findIndex((r) => r.id === requestId);
      if (reqIndex === -1) throw new Error('Request not found');

      const req = requests[reqIndex];
      const itemIndex = items.findIndex((i) => i.id === req.item_id);

      if (status === 'approved') {
        if (itemIndex === -1) throw new Error('Item no longer exists in inventory');
        const item = items[itemIndex];
        if (item.quantity <= 0) throw new Error('No physical stock remaining to approve');

        items[itemIndex].quantity -= 1;
        setLocalData(LOCAL_STORAGE_KEYS.ITEMS, items);

        const newAssign: AssignedItem = {
          id: `assign-${Date.now()}`,
          user_id: req.user_id,
          item_id: req.item_id,
          assigned_date: new Date().toISOString(),
        };
        assigned.push(newAssign);
        setLocalData(LOCAL_STORAGE_KEYS.ASSIGNED_ITEMS, assigned);
      }

      requests[reqIndex].status = status;
      setLocalData(LOCAL_STORAGE_KEYS.REQUESTS, requests);

      return requests[reqIndex];
    }
  },

  // ----------------------------------------
  // ASSIGNED ITEMS
  // ----------------------------------------

  async getAssignedItems(): Promise<AssignedItem[]> {
    await delay(150);
    if (shouldUseFirebaseSync()) {
      try {
        const qSnap = await getDocs(collection(firestore, 'assigned_items'));
        const [users, items] = await Promise.all([
          dbService.getAllUsers(),
          dbService.getItems()
        ]);
        const list = qSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
        return list.map(as => ({
          ...as,
          user: users.find(u => u.id === as.user_id),
          item: items.find(i => i.id === as.item_id)
        }));
      } catch (err) {
        console.error('Error fetching assigned items from Firestore:', err);
        return [];
      }
    } else {
      const assigned = getLocalData<AssignedItem>(LOCAL_STORAGE_KEYS.ASSIGNED_ITEMS);
      const users = getLocalData<User>(LOCAL_STORAGE_KEYS.USERS);
      const items = getLocalData<Item>(LOCAL_STORAGE_KEYS.ITEMS);

      return assigned.map((as) => ({
        ...as,
        user: users.find((u) => u.id === as.user_id),
        item: items.find((i) => i.id === as.item_id),
      }));
    }
  },

  async getMyAssignedItems(userId: string): Promise<AssignedItem[]> {
    await delay(150);
    if (shouldUseFirebaseSync()) {
      try {
        const q = query(collection(firestore, 'assigned_items'), where('user_id', '==', userId));
        const qSnap = await getDocs(q);
        const items = await dbService.getItems();
        const list = qSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
        return list.map(as => ({
          ...as,
          item: items.find(i => i.id === as.item_id)
        }));
      } catch (err) {
        console.error('Error fetching my assigned items:', err);
        return [];
      }
    } else {
      const assigned = getLocalData<AssignedItem>(LOCAL_STORAGE_KEYS.ASSIGNED_ITEMS);
      const items = getLocalData<Item>(LOCAL_STORAGE_KEYS.ITEMS);

      return assigned
        .filter((as) => as.user_id === userId)
        .map((as) => ({
          ...as,
          item: items.find((i) => i.id === as.item_id),
        }));
    }
  },

  async unassignItem(assignmentId: string): Promise<void> {
    await delay(150);
    if (shouldUseFirebaseSync()) {
      await runTransaction(firestore, async (transaction) => {
        const assignRef = doc(firestore, 'assigned_items', assignmentId);
        const assignDoc = await transaction.get(assignRef);
        if (!assignDoc.exists()) throw new Error('Assignment record not found');
        const assignData = assignDoc.data();
        
        const itemRef = doc(firestore, 'items', assignData.item_id);
        const itemDoc = await transaction.get(itemRef);
        if (itemDoc.exists()) {
          const itemData = itemDoc.data();
          transaction.update(itemRef, { quantity: itemData.quantity + 1 });
        }
        
        transaction.delete(assignRef);
      });
    } else {
      const assigned = getLocalData<AssignedItem>(LOCAL_STORAGE_KEYS.ASSIGNED_ITEMS);
      const items = getLocalData<Item>(LOCAL_STORAGE_KEYS.ITEMS);

      const assignIndex = assigned.findIndex((a) => a.id === assignmentId);
      if (assignIndex === -1) throw new Error('Assignment record not found');

      const item_id = assigned[assignIndex].item_id;
      const itemIndex = items.findIndex((i) => i.id === item_id);

      if (itemIndex !== -1) {
        items[itemIndex].quantity += 1;
        setLocalData(LOCAL_STORAGE_KEYS.ITEMS, items);
      }

      const filtered = assigned.filter((a) => a.id !== assignmentId);
      setLocalData(LOCAL_STORAGE_KEYS.ASSIGNED_ITEMS, filtered);
    }
  },

  // ----------------------------------------
  // COMPLAINTS
  // ----------------------------------------

  async getComplaints(): Promise<Complaint[]> {
    await delay(150);
    if (shouldUseFirebaseSync()) {
      try {
        const qSnap = await getDocs(collection(firestore, 'complaints'));
        const [users, items] = await Promise.all([
          dbService.getAllUsers(),
          dbService.getItems()
        ]);
        const list = qSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
        return list.map(cp => ({
          ...cp,
          user: users.find(u => u.id === cp.user_id),
          item: items.find(i => i.id === cp.item_id)
        })).sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
      } catch (err) {
        console.error('Error fetching complaints from Firestore:', err);
        return [];
      }
    } else {
      const complaints = getLocalData<Complaint>(LOCAL_STORAGE_KEYS.COMPLAINTS);
      const users = getLocalData<User>(LOCAL_STORAGE_KEYS.USERS);
      const items = getLocalData<Item>(LOCAL_STORAGE_KEYS.ITEMS);

      return complaints.map((cp) => ({
        ...cp,
        user: users.find((u) => u.id === cp.user_id),
        item: items.find((i) => i.id === cp.item_id),
      })).reverse();
    }
  },

  async getMyComplaints(userId: string): Promise<Complaint[]> {
    await delay(150);
    if (shouldUseFirebaseSync()) {
      try {
        const q = query(collection(firestore, 'complaints'), where('user_id', '==', userId));
        const qSnap = await getDocs(q);
        const items = await dbService.getItems();
        const list = qSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
        return list.map(cp => ({
          ...cp,
          item: items.find(i => i.id === cp.item_id)
        })).sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
      } catch (err) {
        console.error('Error fetching my complaints:', err);
        return [];
      }
    } else {
      const complaints = getLocalData<Complaint>(LOCAL_STORAGE_KEYS.COMPLAINTS);
      const items = getLocalData<Item>(LOCAL_STORAGE_KEYS.ITEMS);

      return complaints
        .filter((cp) => cp.user_id === userId)
        .map((cp) => ({
          ...cp,
          item: items.find((i) => i.id === cp.item_id),
        })).reverse();
    }
  },

  async submitComplaint(userId: string, itemId: string, message: string): Promise<Complaint> {
    await delay(150);
    if (shouldUseFirebaseSync()) {
      const docRef = await addDoc(collection(firestore, 'complaints'), {
        user_id: userId,
        item_id: itemId,
        message,
        status: 'pending',
        created_at: new Date().toISOString()
      });
      return { id: docRef.id, user_id: userId, item_id: itemId, message, status: 'pending', created_at: new Date().toISOString() };
    } else {
      const complaints = getLocalData<Complaint>(LOCAL_STORAGE_KEYS.COMPLAINTS);
      const newComp: Complaint = {
        id: `comp-${Date.now()}`,
        user_id: userId,
        item_id: itemId,
        message,
        status: 'pending',
        created_at: new Date().toISOString(),
      };
      complaints.push(newComp);
      setLocalData(LOCAL_STORAGE_KEYS.COMPLAINTS, complaints);
      return newComp;
    }
  },

  async updateComplaintStatus(complaintId: string, status: 'pending' | 'resolved'): Promise<Complaint> {
    await delay(150);
    if (shouldUseFirebaseSync()) {
      const compRef = doc(firestore, 'complaints', complaintId);
      await updateDoc(compRef, { status });
      const updatedDoc = await getDoc(compRef);
      return { id: complaintId, ...updatedDoc.data() } as Complaint;
    } else {
      const complaints = getLocalData<Complaint>(LOCAL_STORAGE_KEYS.COMPLAINTS);
      const index = complaints.findIndex((c) => c.id === complaintId);
      if (index === -1) throw new Error('Complaint not found');
      complaints[index].status = status;
      setLocalData(LOCAL_STORAGE_KEYS.COMPLAINTS, complaints);
      return complaints[index];
    }
  },
};
