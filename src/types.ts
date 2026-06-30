export type UserRole = 'admin' | 'store' | 'user';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  created_at?: string;
}

export interface Item {
  id: string;
  name: string;
  category: string;
  quantity: number;
}

export interface RequestItem {
  id: string;
  user_id: string;
  item_id: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at?: string;
  // Joined fields for UI convenience
  user?: User;
  item?: Item;
}

export interface AssignedItem {
  id: string;
  user_id: string;
  item_id: string;
  assigned_date: string;
  // Joined fields for UI convenience
  user?: User;
  item?: Item;
}

export interface Complaint {
  id: string;
  user_id: string;
  item_id: string;
  message: string;
  status: 'pending' | 'resolved';
  created_at?: string;
  // Joined fields for UI convenience
  user?: User;
  item?: Item;
}
