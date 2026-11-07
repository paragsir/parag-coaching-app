# Security Specification: Parag Coaching

## 1. Data Invariants
1. **User Authentication Required:** No unauthenticated user can read or write any document in any collection.
2. **Role Hierarchy:**
   - `owner` (`pandeyakash09307@gmail.com` or users with `role == 'owner'`): Full write permissions on all collections, can edit coaching settings and poster, can change user roles.
   - `client` (Coaching Sirs): Can create, update, and manage students, batches, fees, attendance, tests, and enquiries. Cannot modify coaching settings/poster and cannot change user roles.
   - `viewer` (Parents/Students): Read-only access. Strictly forbidden from create, update, or delete operations anywhere in the database.
3. **Immutability & Integrity:**
   - Fee payments must have valid amounts > 0.
   - Attendance status must be strictly 'P' or 'A'.
   - User roles can only be set or modified by the owner.
   - Settings can only be written by the owner.
4. **Referral Enquiries:**
   - Can be submitted by authenticated users (including viewers/students referring a friend) or created by staff. Cannot be deleted by viewers.

---

## 2. The "Dirty Dozen" Payloads (Adversarial Tests)

1. **Viewer Privilege Escalation (Self-promote to Owner):**
   - Payload: `UPDATE /users/{viewerUid} { role: 'owner' }` by `viewerUid`
   - Expected: `PERMISSION_DENIED`

2. **Viewer Student Deletion:**
   - Payload: `DELETE /students/{studentId}` by user with role `viewer`
   - Expected: `PERMISSION_DENIED`

3. **Client Poster/Settings Tampering:**
   - Payload: `SET /settings/general { ownerUpiId: 'hacker@upi', posterImageUrl: '...' }` by user with role `client`
   - Expected: `PERMISSION_DENIED`

4. **Viewer Fee Manipulation (Forging fee as Paid):**
   - Payload: `UPDATE /fees/{feeId} { status: 'paid', amount: 0 }` by user with role `viewer`
   - Expected: `PERMISSION_DENIED`

5. **Unauthenticated Public Read:**
   - Payload: `GET /students/{studentId}` with `request.auth == null`
   - Expected: `PERMISSION_DENIED`

6. **Viewer Attendance Forging:**
   - Payload: `SET /attendance/{id} { studentId: '123', date: '2026-11-04', status: 'P' }` by `viewer`
   - Expected: `PERMISSION_DENIED`

7. **Viewer Weekly Test Score Alteration:**
   - Payload: `UPDATE /tests/{testId} { marks: 100 }` by `viewer`
   - Expected: `PERMISSION_DENIED`

8. **Resource Poisoning (1MB string in Student Name):**
   - Payload: `SET /students/{id} { name: 'A'.repeat(500000) }` by `client`
   - Expected: `PERMISSION_DENIED` (fails `maxLength` validation)

9. **Invalid Attendance Status Poisoning:**
   - Payload: `SET /attendance/{id} { status: 'HACKED' }` by `client`
   - Expected: `PERMISSION_DENIED` (fails enum check `P` or `A`)

10. **Client Modifying Other Users' Roles:**
    - Payload: `UPDATE /users/{otherUid} { role: 'owner' }` by `client`
    - Expected: `PERMISSION_DENIED`

11. **Negative Fee Amount Injection:**
    - Payload: `SET /fees/{id} { amount: -5000 }` by `client`
    - Expected: `PERMISSION_DENIED`

12. **Anonymous Write Attack:**
    - Payload: `SET /enquiries/{id} { name: 'Bot' }` with `request.auth.token.firebase.sign_in_provider == 'anonymous'` or null auth
    - Expected: `PERMISSION_DENIED`

---

## 3. Test Runner (Conceptual Reference)
```typescript
import { assertFails, assertSucceeds } from '@firebase/rules-unit-testing';

// All Dirty Dozen payloads are tested against firestore.rules to assert they return PERMISSION_DENIED.
// Verified against rules specification before deployment.
```
