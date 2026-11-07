import React, { useState, useEffect } from 'react';
import { 
  X, 
  ShieldCheck, 
  UserCheck, 
  UserPlus, 
  Check, 
  Trash2, 
  ShieldAlert 
} from 'lucide-react';
import { collection, getDocs, doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { UserProfile, UserRole } from '../types';

interface UserManagementModalProps {
  onClose: () => void;
}

export const UserManagementModal: React.FC<UserManagementModalProps> = ({ onClose }) => {
  const { isOwner } = useAuth();
  const { students } = useData();

  const updateUserRoleInDb = async (userId: string, newRole: UserRole, studentId?: string) => {
    try {
      const ref = doc(db, 'users', userId);
      await setDoc(ref, { role: newRole, ...(studentId ? { studentId } : {}) }, { merge: true });
    } catch (err) {
      console.warn('Update user role in firestore:', err);
    }
  };

  const [usersList, setUsersList] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  // New Sir registration state
  const [newClientEmail, setNewClientEmail] = useState('');
  const [newClientName, setNewClientName] = useState('');
  const [newClientRole, setNewClientRole] = useState<UserRole>('client');
  const [newClientStudentId, setNewClientStudentId] = useState<string>('');
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const querySnap = await getDocs(collection(db, 'users'));
        const list: UserProfile[] = [];
        querySnap.forEach((d) => {
          list.push({ ...d.data(), id: d.id } as UserProfile);
        });

        // Ensure default accounts are represented
        if (!list.some((u) => u.email === 'pandeyakash09307@gmail.com')) {
          list.unshift({
            id: 'owner-doc',
            email: 'pandeyakash09307@gmail.com',
            role: 'owner',
            name: 'Akash Pandey',
          });
        }
        if (!list.some((u) => u.email === 'sir.verma@paragcoaching.com')) {
          list.push({
            id: 'sir-verma-doc',
            email: 'sir.verma@paragcoaching.com',
            role: 'client',
            name: 'Verma Sir (Faculty)',
          });
        }
        if (!list.some((u) => u.email === 'parent.aarav@gmail.com')) {
          list.push({
            id: 'parent-aarav-doc',
            email: 'parent.aarav@gmail.com',
            role: 'viewer',
            name: 'Rajesh Sharma (Parent)',
            studentId: 'std-1',
          });
        }

        setUsersList(list);
      } catch (err) {
        console.warn('Error fetching users from DB:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    try {
      await updateUserRoleInDb(userId, newRole);
      setUsersList((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
      );
    } catch (err) {
      console.error(err);
      alert('Only Akash Pandey (Owner) can modify security roles.');
    }
  };

  const handleAddStaffOrViewer = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAdding(true);
    try {
      const mockId = `usr-${Date.now()}`;
      await updateUserRoleInDb(mockId, newClientRole, newClientStudentId || undefined);
      setUsersList((prev) => [
        ...prev,
        {
          id: mockId,
          email: newClientEmail,
          name: newClientName,
          role: newClientRole,
          studentId: newClientStudentId || undefined,
        },
      ]);
      setNewClientEmail('');
      setNewClientName('');
    } catch (err) {
      console.error(err);
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-2xl p-5 sm:p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="font-bold text-white text-base">
                User Role & Permission Control (RBAC)
              </h3>
              <p className="text-[11px] text-slate-400">
                Owner: Akash Pandey (Full Permissions) • Client: Coaching Sirs • Viewer: Parents
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Add New Staff / Client Form */}
        <div className="my-4 p-4 rounded-2xl bg-slate-800/80 border border-slate-700">
          <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <UserPlus className="w-4 h-4 text-indigo-400" />
            <span>Add Coaching Sir or Authorize Parent Account</span>
          </h4>

          <form onSubmit={handleAddStaffOrViewer} className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <input
              type="text"
              required
              placeholder="Full Name (e.g. Verma Sir)"
              value={newClientName}
              onChange={(e) => setNewClientName(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
            />
            <input
              type="email"
              required
              placeholder="Email address"
              value={newClientEmail}
              onChange={(e) => setNewClientEmail(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
            />
            <select
              value={newClientRole}
              onChange={(e) => setNewClientRole(e.target.value as UserRole)}
              className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
            >
              <option value="client">Client (Coaching Sir)</option>
              <option value="viewer">Viewer (Parent / Student)</option>
              <option value="owner">Owner (Administrator)</option>
            </select>

            {newClientRole === 'viewer' && (
              <div className="col-span-1 sm:col-span-2">
                <select
                  value={newClientStudentId}
                  onChange={(e) => setNewClientStudentId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                >
                  <option value="">Link to Student (Select child)</option>
                  {students.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.name} ({st.class})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="sm:col-span-1 flex items-end">
              <button
                type="submit"
                disabled={isAdding}
                className="w-full py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow transition"
              >
                {isAdding ? 'Adding...' : '+ Authorize User'}
              </button>
            </div>
          </form>
        </div>

        {/* Existing Users Table */}
        <div className="space-y-2 mt-4">
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
            Active Accounts & Role Hierarchy
          </h4>

          {usersList.map((user) => {
            const isAkashOwner = user.email.toLowerCase() === 'pandeyakash09307@gmail.com';

            return (
              <div
                key={user.id || user.email}
                className="p-3 rounded-2xl bg-slate-800/60 border border-slate-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
              >
                <div>
                  <div className="flex items-center space-x-2">
                    <p className="font-bold text-white text-xs">{user.name || 'User'}</p>
                    {isAkashOwner && (
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                        Primary Owner
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400">{user.email}</p>
                  {user.studentId && (
                    <p className="text-[10px] text-indigo-400">
                      Child: {students.find((s) => s.id === user.studentId)?.name || user.studentId}
                    </p>
                  )}
                </div>

                {/* Role Switch Dropdown */}
                <div className="flex items-center space-x-2">
                  <select
                    disabled={isAkashOwner || !isOwner}
                    value={user.role}
                    onChange={(e) => user.id && handleRoleChange(user.id, e.target.value as UserRole)}
                    className="bg-slate-900 border border-slate-700 text-xs text-white rounded-xl px-2.5 py-1.5 font-semibold focus:outline-none disabled:opacity-50"
                  >
                    <option value="owner">Role: Owner</option>
                    <option value="client">Role: Client (Coaching Sir)</option>
                    <option value="viewer">Role: Viewer (Parent)</option>
                  </select>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-5 pt-3 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-xl"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
