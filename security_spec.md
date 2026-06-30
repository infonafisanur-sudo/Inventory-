# Security Specification

This security specification defines data invariants, potential attack vectors (Dirty Dozen), and the corresponding validation rules required to secure the AssetFlow inventory system's Firestore database.

## 1. Data Invariants

- **Users**:
  - Every authenticated user must have a corresponding profile under `/users/{userId}` where `userId` matches the authenticated user's UID.
  - The `role` property must be one of `admin`, `store`, or `user`.
  - No user is allowed to self-promote their role during sign-up or updates. Only existing admins can change a user's role.
  - User profiles must contain an email, name, and role.

- **Inventory Items**:
  - Items are owned by the organization. Any authenticated user can read the inventory.
  - Only `admin` and `store` roles (Store Managers) can create, update, or delete items.
  - Quantity must be a non-negative integer.

- **Requests**:
  - A request represents a requisition or reservation.
  - Standard employees (`user` role) can only view their own requests and create requests with status set to `pending`. They cannot approve or reject their own requests.
  - Store managers/Admins can list all requests and approve/reject them.
  - Approved requests atomically reduce the item's inventory count (handled via client transaction or server logic, backed by constraints).

- **Assigned Items**:
  - Contains records of equipment assigned to employees.
  - Read access is restricted: employees can only read assignments where `user_id` matches their own UID. Store managers/Admins can read all assignments.
  - Only store managers and admins can create or delete assignment records.

- **Complaints**:
  - Standard employees can submit complaints about items assigned to them. They can read their own complaints.
  - Only store managers/Admins can list all complaints and resolve them (update status to `resolved`).

---

## 2. The "Dirty Dozen" Payloads (Vulnerability Scenarios)

1. **Privilege Escalation**: Regular user signs up and sets `role` to `admin`.
2. **Identity Spoofing on Create**: Regular user submits a request with `user_id` pointing to another employee.
3. **Ghost Fields on Profile**: User updates their profile with unvalidated fields (`shadow_verified_by_google: true`).
4. **Negative Stock Insertion**: Store manager adds an item with `quantity: -10`.
5. **Request Self-Approval**: Standard user updates their own request's status from `pending` to `approved`.
6. **Bypassing Read Controls (PII Leak)**: Standard user lists all users, revealing private emails and names.
7. **Orphaned Request Creation**: Creating a request referencing a non-existent item ID.
8. **Unauthorized Assignment Deletion**: Standard user deletes assignment records to untrack assigned equipment.
9. **Junk ID Poisoning**: Attackers sending requests with huge, malicious document IDs (`{requestId} = "junk%%%%%#$*#$*"`).
10. **Complaint State Bypass**: Normal user directly resolving their own complaint without a store manager review.
11. **Timestamp Spoofing**: User providing a backdated `created_at` timestamp.
12. **Denial of Wallet Query**: Insecure `allow list` forcing unindexed heavy database scans.

---

## 3. Firestore Rules Architecture Matrix

The security rules will be written to `firestore.rules`.
All write operations will be protected by validation helpers:
- `isValidUser(incoming)`
- `isValidItem(incoming)`
- `isValidRequest(incoming)`
- `isValidAssignedItem(incoming)`
- `isValidComplaint(incoming)`
