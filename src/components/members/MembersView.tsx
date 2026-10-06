import React, { useState } from 'react';
import {
  Award,
  CheckCircle,
  Clock,
  Edit2,
  Filter,
  Mail,
  Phone,
  Plus,
  Save,
  Search,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  User,
  UserCheck,
  UserX,
  Users,
  X
} from 'lucide-react';
import { appStorage } from '../../services/storage';
import { Member, Task, UserAccount, UserRole } from '../../types';
import { Pagination } from '../common/Pagination';
import { ConfirmDialog } from '../common/ConfirmDialog';

interface MembersViewProps {
  onSelectTask: (task: Task) => void;
}

export const MembersView: React.FC<MembersViewProps> = ({ onSelectTask }) => {
  const members = appStorage.getMembers();
  const allTasks = appStorage.getTasks();
  const selectedWard = appStorage.getSelectedWard();
  const currentRole = appStorage.getCurrentRole();
  const currentUser = appStorage.getCurrentUser();
  const authAccount = appStorage.getCurrentAuthAccount();
  const isSuperAdmin = appStorage.isCurrentUserSuperAdmin();
  const isLeader = currentRole === 'LEADER' || isSuperAdmin;

  const isMyProfile = (mem: Member): boolean => {
    if (isSuperAdmin || currentUser.role === 'ADMIN') return false; // Quản trị viên tỉnh giám sát, không phải thành viên cơ sở
    if (mem.id === currentUser.id) return true;
    if (authAccount && (
      mem.email.toLowerCase() === authAccount.email.toLowerCase() ||
      mem.name.toLowerCase().trim() === authAccount.fullName.toLowerCase().trim()
    )) return true;
    return false;
  };

  const [activeSubTab, setActiveSubTab] = useState<'roster' | 'pending'>('roster');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMember, setSelectedMember] = useState<Member | null>(members[0] || null);

  // Delete / Remove Member state (Leader only)
  const [memberToDelete, setMemberToDelete] = useState<Member | null>(null);

  // Pagination for members: Tối đa 5 tài khoản rồi chuyển trang
  const [memberPage, setMemberPage] = useState(1);
  const pageSize = 5;

  // Pagination for member tasks: Mỗi tài khoản hiển thị tối đa 5 công việc rồi chuyển trang
  const [taskPage, setTaskPage] = useState(1);
  const taskPageSize = 5;

  // Pending accounts (Only Leader sees this)
  const pendingAccounts = appStorage.getPendingAccountsForWard(selectedWard.id);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Change Role Modal (Leader only: only change role, no editing other personal info)
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [roleMember, setRoleMember] = useState<Member | null>(null);
  const [newRoleForMember, setNewRoleForMember] = useState<UserRole>('MEMBER');

  // Edit Personal Info Modal (Only member themselves)
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [editName, setEditName] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editSkills, setEditSkills] = useState('');

  // Hàm tính toán con số Đang làm, đã xong, quá hạn chuẩn xác 100% theo dữ liệu thực tế
  const todayStr = new Date().toISOString().split('T')[0];
  const getMemberStats = (mem: Member) => {
    const tasks = allTasks.filter(
      t => t.primaryAssigneeId === mem.id ||
           (t.collaboratorIds && t.collaboratorIds.includes(mem.id)) ||
           (t.primaryAssigneeName && (
             t.primaryAssigneeName.toLowerCase().trim() === mem.name.toLowerCase().trim() ||
             t.primaryAssigneeName.toLowerCase().includes(mem.name.toLowerCase())
           ))
    );
    const completed = tasks.filter(t => t.status === 'HOAN_THANH' || t.status === 'DONG').length;
    const overdue = tasks.filter(t => t.status === 'QUA_HAN' || (t.dueDate && t.dueDate < todayStr && t.status !== 'HOAN_THANH' && t.status !== 'DONG')).length;
    const active = Math.max(0, tasks.length - completed - overdue);
    return { active, completed, overdue, total: tasks.length };
  };

  // Filter members
  const filteredMembers = members.filter(m => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return true;
    return (
      m.name.toLowerCase().includes(term) ||
      m.phone.includes(term) ||
      m.email.toLowerCase().includes(term) ||
      m.title.toLowerCase().includes(term) ||
      m.skills.some(s => s.toLowerCase().includes(term))
    );
  });

  const paginatedMembers = filteredMembers.slice((memberPage - 1) * pageSize, memberPage * pageSize);

  const memberTasks = selectedMember
    ? allTasks.filter(
        t => t.primaryAssigneeId === selectedMember.id ||
             (t.collaboratorIds && t.collaboratorIds.includes(selectedMember.id)) ||
             (t.primaryAssigneeName && (
               t.primaryAssigneeName.toLowerCase().trim() === selectedMember.name.toLowerCase().trim() ||
               t.primaryAssigneeName.toLowerCase().includes(selectedMember.name.toLowerCase())
             ))
      )
    : [];

  const paginatedMemberTasks = memberTasks.slice((taskPage - 1) * taskPageSize, taskPage * taskPageSize);

  const handleOpenRoleModal = (member: Member) => {
    setRoleMember(member);
    setNewRoleForMember(member.role);
    setShowRoleModal(true);
  };

  const handleSaveRole = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleMember) return;
    const updated: Member = {
      ...roleMember,
      role: newRoleForMember
    };
    appStorage.updateMember(updated);
    if (selectedMember?.id === updated.id) {
      setSelectedMember(updated);
    }
    const accounts = appStorage.getUserAccounts();
    const acc = accounts.find(a => a.email.toLowerCase() === roleMember.email.toLowerCase() || a.id === roleMember.id);
    if (acc) {
      acc.role = newRoleForMember;
      appStorage.saveUserAccounts(accounts);
    }
    setShowRoleModal(false);
    setActionMessage({
      type: 'success',
      text: `Đã thay đổi vai trò của cán bộ ${roleMember.name} thành "${newRoleForMember === 'LEADER' ? 'Tổ trưởng' : newRoleForMember === 'MANAGER' ? 'Cán bộ UBND Phường' : 'Thành viên'}".`
    });
    setTimeout(() => setActionMessage(null), 4000);
  };

  const handleOpenEditModal = (member: Member) => {
    setEditingMember(member);
    setEditName(member.name);
    setEditTitle(member.title);
    setEditPhone(member.phone);
    setEditEmail(member.email);
    setEditSkills(member.skills.join(', '));
    setShowEditModal(true);
  };

  const handleSaveEditMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember) return;
    if (!editName.trim() || !editPhone.trim()) {
      alert('Vui lòng nhập họ tên và số điện thoại cán bộ.');
      return;
    }

    const updated: Member = {
      ...editingMember,
      name: editName.trim(),
      title: editTitle.trim(),
      phone: editPhone.trim(),
      email: editEmail.trim(),
      skills: editSkills.split(',').map(s => s.trim()).filter(Boolean)
    };

    appStorage.updateMember(updated);
    if (selectedMember?.id === updated.id) {
      setSelectedMember(updated);
    }
    setShowEditModal(false);
    setActionMessage({
      type: 'success',
      text: 'Đã cập nhật thành công thông tin cá nhân của bạn.'
    });
    setTimeout(() => setActionMessage(null), 4000);
  };

  const handleDeleteMember = (member: Member) => {
    setMemberToDelete(member);
  };

  const handleConfirmDelete = () => {
    if (!memberToDelete) return;
    appStorage.deleteMember(memberToDelete.id);
    if (selectedMember?.id === memberToDelete.id) {
      const remaining = appStorage.getMembers();
      setSelectedMember(remaining[0] || null);
    }
    setMemberToDelete(null);
    setActionMessage({
      type: 'success',
      text: `Đã loại bỏ thành viên khỏi hệ thống Tổ CNSCĐ.`
    });
    setTimeout(() => setActionMessage(null), 4000);
  };

  const handleApprove = (account: UserAccount) => {
    const res = appStorage.approveAccount(account.id, 'MEMBER');
    if (res.success) {
      setActionMessage({ type: 'success', text: res.message });
      setTimeout(() => setActionMessage(null), 4000);
    } else {
      setActionMessage({ type: 'error', text: res.message });
      setTimeout(() => setActionMessage(null), 4000);
    }
  };

  const handleReject = (account: UserAccount) => {
    const reason = prompt(`Nhập lý do từ chối tài khoản của ${account.fullName}:`);
    if (reason === null) return;
    const res = appStorage.rejectAccount(account.id, reason);
    if (res.success) {
      setActionMessage({ type: 'success', text: res.message });
      setTimeout(() => setActionMessage(null), 4000);
    } else {
      setActionMessage({ type: 'error', text: res.message });
      setTimeout(() => setActionMessage(null), 4000);
    }
  };

  return (
    <div className="space-y-4">
      {/* Blue Header Banner matching Citizen Portal */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-900 text-white p-5 sm:p-6 rounded-3xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-blue-200">
            ĐỘI NGŨ NHÂN SỰ TỔ CÔNG NGHỆ SỐ CỘNG ĐỒNG
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight leading-tight mt-0.5">
            Quản Lý Thành Viên & Khối Lượng Công Việc
          </h2>
          <div className="text-xs text-blue-100 mt-1">
            Địa bàn: <strong>{selectedWard.name}</strong> · {members.length} cán bộ trực thuộc
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Sub-tab switcher: Only Leader sees pending tab */}
          <div className="bg-white/15 backdrop-blur-xs p-1 rounded-xl flex items-center gap-1 border border-white/20">
            <button
              onClick={() => setActiveSubTab('roster')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeSubTab === 'roster'
                  ? 'bg-white text-blue-900 shadow-sm'
                  : 'text-white hover:bg-white/10'
              }`}
            >
              Chính thức ({members.length})
            </button>
            {isLeader && (
              <button
                onClick={() => setActiveSubTab('pending')}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeSubTab === 'pending'
                    ? 'bg-white text-blue-900 shadow-sm'
                    : 'text-white hover:bg-white/10'
                }`}
              >
                <span>Chờ duyệt</span>
                {pendingAccounts.length > 0 && (
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {actionMessage && (
        <div className={`p-3 rounded-2xl text-xs font-semibold ${
          actionMessage.type === 'success' ? 'bg-emerald-50 text-emerald-900 border border-emerald-200' : 'bg-red-50 text-red-900 border border-red-200'
        }`}>
          {actionMessage.text}
        </div>
      )}

      {/* Main Roster Content */}
      {activeSubTab === 'roster' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left Column: Member List (5 cols) */}
          <div className="lg:col-span-5 space-y-3">
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs text-xs">
              <div className="relative">
                <Search className="w-4 h-4 text-blue-600 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Tìm theo tên cán bộ, SĐT, chức danh, kỹ năng..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="space-y-2">
              {paginatedMembers.map(mem => {
                const isSelected = selectedMember?.id === mem.id;
                return (
                  <div
                    key={mem.id}
                    onClick={() => { setSelectedMember(mem); setTaskPage(1); }}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer text-xs space-y-2.5 ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/70 ring-2 ring-blue-500/20 shadow-xs'
                        : 'border-slate-200 bg-white hover:border-blue-300 hover:bg-slate-50/60'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-blue-600 text-white font-bold flex items-center justify-center text-xs shadow-2xs">
                          {mem.name.split(' ').slice(-1)[0][0]}
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-900 text-xs leading-tight">{mem.name}</h3>
                          <div className="text-[11px] text-slate-500 mt-0.5">{mem.title}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          mem.role === 'LEADER'
                            ? 'bg-purple-100 text-purple-800'
                            : mem.role === 'MANAGER'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {mem.role === 'LEADER' && 'Tổ trưởng'}
                          {mem.role === 'MEMBER' && 'Thành viên'}
                          {mem.role === 'MANAGER' && 'UBND Phường'}
                        </span>
                        {isMyProfile(mem) && (
                          <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                            Tôi
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1">
                      {mem.skills.slice(0, 3).map((skill, i) => (
                        <span key={i} className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px]">
                          {skill}
                        </span>
                      ))}
                    </div>

                    {/* Con số Đang làm, đã xong, quá hạn theo đúng thực tế */}
                    {(() => {
                      const stats = getMemberStats(mem);
                      return (
                        <div className="pt-2 border-t border-slate-100 grid grid-cols-3 gap-1 text-center text-[11px]">
                          <div>
                            <span className="text-slate-400 block text-[10px]">Đang làm</span>
                            <strong className="text-blue-700 font-bold">{stats.active}</strong>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[10px]">Đã xong</span>
                            <strong className="text-emerald-700 font-bold">{stats.completed}</strong>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[10px]">Quá hạn</span>
                            <strong className={stats.overdue > 0 ? 'text-red-600 font-bold' : 'text-slate-600'}>
                              {stats.overdue}
                            </strong>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                );
              })}

              {filteredMembers.length === 0 && (
                <div className="p-8 text-center text-slate-400 text-xs">
                  Không tìm thấy thành viên nào.
                </div>
              )}
            </div>

            {filteredMembers.length > pageSize && (
              <Pagination
                currentPage={memberPage}
                totalItems={filteredMembers.length}
                pageSize={pageSize}
                onPageChange={setMemberPage}
                itemName="thành viên"
              />
            )}
          </div>

          {/* Right Column: Member 360 Details (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            {selectedMember ? (
              <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-4 text-xs">
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-4">
                  <div>
                    <h3 className="text-xl font-black text-slate-900 leading-tight">{selectedMember.name}</h3>
                    <p className="text-slate-500 mt-0.5">{selectedMember.title} · {selectedMember.teamName}</p>
                    <div className="flex items-center gap-3 mt-2 text-slate-700">
                      <span className="flex items-center gap-1 font-mono">
                        <Phone className="w-3.5 h-3.5 text-blue-600" />
                        <strong>{selectedMember.phone}</strong>
                      </span>
                      <span>·</span>
                      <span className="text-slate-500">{selectedMember.email}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* If it's my own profile: can edit personal info */}
                    {isMyProfile(selectedMember) && (
                      <button
                        onClick={() => handleOpenEditModal(selectedMember)}
                        className="px-3.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-xl text-xs border border-blue-200 flex items-center gap-1.5 transition-colors cursor-pointer"
                        title="Chỉnh sửa thông tin cá nhân của bạn"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Sửa thông tin cá nhân</span>
                      </button>
                    )}

                    {/* If NOT my profile: Only Leader can change role or remove member */}
                    {!isMyProfile(selectedMember) && isLeader && (
                      <>
                        <button
                          onClick={() => handleOpenRoleModal(selectedMember)}
                          className="px-3.5 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold rounded-xl text-xs border border-purple-200 flex items-center gap-1.5 transition-colors cursor-pointer"
                          title="Tổ trưởng thay đổi vai trò của thành viên"
                        >
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>Đổi vai trò</span>
                        </button>

                        <button
                          onClick={() => handleDeleteMember(selectedMember)}
                          className="px-3.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-xl text-xs border border-red-200 flex items-center gap-1.5 transition-colors cursor-pointer"
                          title="Loại bỏ thành viên khỏi hệ thống nếu sai phạm hoặc không tham gia nữa"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Loại bỏ khỏi tổ</span>
                        </button>
                      </>
                    )}

                    {!isMyProfile(selectedMember) && !isLeader && (
                      <span className="text-[11px] text-slate-400 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
                        Chỉ xem thông tin
                      </span>
                    )}
                  </div>
                </div>

                {/* Khối thống kê khối lượng công việc thực tế của cán bộ đang chọn */}
                {(() => {
                  const selStats = getMemberStats(selectedMember);
                  return (
                    <div className="grid grid-cols-4 gap-2 text-center p-3 bg-slate-50 rounded-2xl border border-slate-100">
                      <div>
                        <span className="text-slate-400 block text-[10px] font-semibold">Đang làm</span>
                        <strong className="text-blue-700 font-black text-sm">{selStats.active}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] font-semibold">Đã xong</span>
                        <strong className="text-emerald-700 font-black text-sm">{selStats.completed}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] font-semibold">Quá hạn</span>
                        <strong className={selStats.overdue > 0 ? 'text-red-600 font-black text-sm' : 'text-slate-600 font-black text-sm'}>{selStats.overdue}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] font-semibold">Tổng giao</span>
                        <strong className="text-slate-900 font-black text-sm">{selStats.total}</strong>
                      </div>
                    </div>
                  );
                })()}

                {/* Assigned Tasks: Tối đa 5 công việc rồi chuyển trang */}
                <div className="space-y-3">
                  <div className="font-bold text-slate-900 text-sm flex items-center justify-between">
                    <span>Công việc đang phân công ({memberTasks.length})</span>
                    {memberTasks.length > taskPageSize && (
                      <span className="text-xs text-slate-400 font-normal">
                        Trang {taskPage}/{Math.ceil(memberTasks.length / taskPageSize)}
                      </span>
                    )}
                  </div>

                  <div className="space-y-2">
                    {paginatedMemberTasks.map(task => (
                      <div
                        key={task.id}
                        onClick={() => onSelectTask(task)}
                        className="p-3 bg-slate-50 hover:bg-blue-50/50 rounded-xl border border-slate-200 cursor-pointer transition-colors space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold text-blue-700">{task.code}</span>
                          <span className="text-[11px] text-slate-500">{task.dueDate}</span>
                        </div>
                        <div className="font-bold text-slate-900">{task.title}</div>
                        <div className="text-[11px] text-blue-700 font-semibold">Bước {task.currentStep || 1}/6</div>
                      </div>
                    ))}

                    {memberTasks.length === 0 && (
                      <div className="py-6 text-center text-slate-400">
                        Cán bộ chưa được phân công công việc nào.
                      </div>
                    )}

                    {memberTasks.length > taskPageSize && (
                      <div className="pt-2">
                        <Pagination
                          currentPage={taskPage}
                          totalItems={memberTasks.length}
                          pageSize={taskPageSize}
                          onPageChange={setTaskPage}
                          itemName="công việc"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* Pending Accounts SubTab */}
      {activeSubTab === 'pending' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-5 space-y-3">
          <div className="font-bold text-slate-900 text-sm">Danh sách đăng ký chờ duyệt ({pendingAccounts.length})</div>
          {pendingAccounts.map(acc => (
            <div key={acc.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
              <div>
                <div className="font-bold text-slate-900">{acc.fullName} ({acc.phone})</div>
                <div className="text-slate-500 text-xs">{acc.email} · {acc.requestedRole}</div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleApprove(acc)}
                  className="px-3 py-1.5 bg-blue-600 text-white font-bold rounded-lg text-xs"
                >
                  Phê duyệt
                </button>
                <button
                  onClick={() => handleReject(acc)}
                  className="px-3 py-1.5 bg-slate-200 text-slate-700 font-bold rounded-lg text-xs"
                >
                  Từ chối
                </button>
              </div>
            </div>
          ))}
          {pendingAccounts.length === 0 && (
            <div className="py-8 text-center text-slate-400 text-xs">Không có tài khoản nào chờ duyệt.</div>
          )}
        </div>
      )}

      {/* EDIT PERSONAL INFO MODAL (OWN PROFILE ONLY) */}
      {showEditModal && editingMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-xl max-w-md w-full p-6 space-y-4 border border-slate-200 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-blue-900">Cập Nhật Thông Tin Cá Nhân</h3>
                <p className="text-[11px] text-slate-500">Chỉnh sửa hồ sơ tài khoản của chính bạn</p>
              </div>
              <button onClick={() => setShowEditModal(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <form onSubmit={handleSaveEditMember} className="space-y-3">
              <div>
                <label className="block font-bold text-slate-800 mb-1">Họ và tên *:</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-800 mb-1">Chức danh / Vị trí phụ trách:</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={e => setEditTitle(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">Số điện thoại *:</label>
                  <input
                    type="tel"
                    required
                    value={editPhone}
                    onChange={e => setEditPhone(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-800 mb-1">Email liên hệ:</label>
                  <input
                    type="email"
                    value={editEmail}
                    onChange={e => setEditEmail(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>
              <div>
                <label className="block font-bold text-slate-800 mb-1">Kỹ năng phụ trách (cách nhau dấu phẩy):</label>
                <input
                  type="text"
                  value={editSkills}
                  onChange={e => setEditSkills(e.target.value)}
                  placeholder="VNeID, SmartCA, Dịch vụ công trực tuyến..."
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button type="button" onClick={() => setShowEditModal(false)} className="px-4 py-2 bg-slate-100 rounded-xl font-bold">Hủy</button>
                <button type="submit" className="px-5 py-2 bg-blue-600 text-white rounded-xl font-bold shadow-xs">Lưu thay đổi</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CHANGE ROLE MODAL (LEADER ONLY) */}
      {showRoleModal && roleMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-xl max-w-sm w-full p-6 space-y-4 border border-slate-200 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-purple-900">Thay Đổi Vai Trò Thành Viên</h3>
                <p className="text-[11px] text-slate-500">Cán bộ: <strong>{roleMember.name}</strong></p>
              </div>
              <button onClick={() => setShowRoleModal(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <form onSubmit={handleSaveRole} className="space-y-3.5">
              <div>
                <label className="block font-bold text-slate-800 mb-1.5">Chọn vai trò mới trong tổ:</label>
                <select
                  value={newRoleForMember}
                  onChange={e => setNewRoleForMember(e.target.value as UserRole)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-800 focus:ring-2 focus:ring-purple-500"
                >
                  <option value="MEMBER">Thành viên Tổ CNSCĐ</option>
                  <option value="LEADER">Tổ trưởng Tổ CNSCĐ</option>
                  <option value="MANAGER">Cán bộ phụ trách UBND Xã/Phường</option>
                </select>
                <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">
                  * Theo quy định, Tổ trưởng chỉ có quyền thay đổi vai trò của thành viên và loại bỏ thành viên nếu vi phạm, không được chỉnh sửa thông tin cá nhân của người khác.
                </p>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowRoleModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold text-slate-700"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold shadow-xs"
                >
                  Lưu thay đổi vai trò
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete / Remove Member Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!memberToDelete}
        title="Loại bỏ thành viên khỏi hệ thống"
        message={`Bạn có chắc chắn muốn loại bỏ thành viên "${memberToDelete?.name}" (${memberToDelete?.title}) khỏi hệ thống Tổ CNSCĐ do sai phạm hoặc không tham gia nữa?`}
        confirmLabel="Xác nhận loại bỏ"
        cancelLabel="Hủy"
        isDestructive={true}
        onConfirm={handleConfirmDelete}
        onCancel={() => setMemberToDelete(null)}
      />
    </div>
  );
};
