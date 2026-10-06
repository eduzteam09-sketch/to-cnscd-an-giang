import React, { useState } from 'react';
import {
  Calendar,
  CheckCircle,
  Clock,
  Edit2,
  MapPin,
  Phone,
  Plus,
  Save,
  Search,
  Trash2,
  User,
  Users,
  X
} from 'lucide-react';
import { TARGET_GROUP_CONFIG } from '../../mock/initialData';
import { appStorage } from '../../services/storage';
import { TargetGroup, TargetProfile, Task } from '../../types';
import { PriorityBadge, TargetGroupBadge, TaskStatusBadge } from '../common/StatusBadge';
import { Pagination } from '../common/Pagination';
import { ConfirmDialog } from '../common/ConfirmDialog';

interface TargetsViewProps {
  onSelectTask: (task: Task) => void;
  onOpenCreateTaskForTarget: (targetId: string) => void;
  initialFilterGroup?: string;
}

export const TargetsView: React.FC<TargetsViewProps> = ({
  onSelectTask,
  onOpenCreateTaskForTarget,
  initialFilterGroup = 'ALL'
}) => {
  const targets = appStorage.getTargets();
  const allTasks = appStorage.getTasks();
  const allRequests = appStorage.getRequests();
  const currentRole = appStorage.getCurrentRole();
  const authAccount = appStorage.getCurrentAuthAccount();
  const isLeader = currentRole === 'LEADER' || authAccount?.role === 'LEADER' || authAccount?.role === 'ADMIN';

  const [selectedTarget, setSelectedTarget] = useState<TargetProfile | null>(targets[0] || null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterGroup, setFilterGroup] = useState<string>(initialFilterGroup || 'ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  React.useEffect(() => {
    if (initialFilterGroup) {
      setFilterGroup(initialFilterGroup);
      setCurrentPage(1);
    }
  }, [initialFilterGroup]);

  // Delete Target Dialog
  const [targetToDelete, setTargetToDelete] = useState<TargetProfile | null>(null);

  // Create Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newGroup, setNewGroup] = useState<TargetGroup>('NGUOI_DAN');
  const [newPhone, setNewPhone] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [newNotes, setNewNotes] = useState('');

  // Edit Modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTarget, setEditingTarget] = useState<TargetProfile | null>(null);
  const [editName, setEditName] = useState('');
  const [editGroup, setEditGroup] = useState<TargetGroup>('NGUOI_DAN');
  const [editPhone, setEditPhone] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editReadiness, setEditReadiness] = useState<'CHUA_CO_GI' | 'CO_BAN' | 'KHA' | 'TOT'>('CO_BAN');

  const filteredTargets = targets.filter(t => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match = t.name.toLowerCase().includes(q) ||
        t.phone.includes(q) ||
        t.code.toLowerCase().includes(q) ||
        t.address.toLowerCase().includes(q);
      if (!match) return false;
    }
    if (filterGroup !== 'ALL' && t.group !== filterGroup) return false;
    return true;
  });

  const handleCreateTarget = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newPhone.trim()) {
      alert('Vui lòng nhập họ tên và số điện thoại đối tượng.');
      return;
    }

    const currentWard = appStorage.getSelectedWard();
    const created = appStorage.createTarget({
      name: newName.trim(),
      group: newGroup,
      phone: newPhone.trim(),
      ward: currentWard.name,
      neighborhood: `${currentWard.unitType === 'PHUONG' ? 'Khóm' : currentWard.unitType === 'DAC_KHU' ? 'Khu vực' : 'Ấp'} 1, ${currentWard.name}`,
      address: newAddress.trim() || `Trung tâm ${currentWard.name}`,
      digitalReadinessLevel: 'CO_BAN',
      needsFollowUp: true,
      notes: newNotes.trim()
    });

    setSelectedTarget(created);
    setShowCreateModal(false);
    setNewName('');
    setNewPhone('');
    setNewAddress('');
    setNewNotes('');
  };

  const handleOpenEditModal = (target: TargetProfile) => {
    setEditingTarget(target);
    setEditName(target.name);
    setEditGroup(target.group);
    setEditPhone(target.phone);
    setEditAddress(target.address);
    setEditNotes(target.notes || '');
    setEditReadiness(target.digitalReadinessLevel);
    setShowEditModal(true);
  };

  const handleSaveEditTarget = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTarget) return;
    if (!editName.trim() || !editPhone.trim()) {
      alert('Vui lòng nhập họ tên và số điện thoại đối tượng.');
      return;
    }

    const updated: TargetProfile = {
      ...editingTarget,
      name: editName.trim(),
      group: editGroup,
      phone: editPhone.trim(),
      address: editAddress.trim(),
      notes: editNotes.trim(),
      digitalReadinessLevel: editReadiness,
      updatedAt: new Date().toISOString()
    };

    appStorage.updateTarget(updated);
    if (selectedTarget?.id === updated.id) {
      setSelectedTarget(updated);
    }
    setShowEditModal(false);
  };

  const handleDeleteTarget = (target: TargetProfile) => {
    setTargetToDelete(target);
  };

  const handleConfirmDelete = () => {
    if (!targetToDelete) return;
    appStorage.deleteTarget(targetToDelete.id);
    if (selectedTarget?.id === targetToDelete.id) {
      const remaining = appStorage.getTargets();
      setSelectedTarget(remaining[0] || null);
    }
    setTargetToDelete(null);
  };

  const targetTasks = selectedTarget ? allTasks.filter(t => t.targetId === selectedTarget.id) : [];

  return (
    <div className="space-y-4">
      {/* Header Banner - Matching Citizen Portal Blue Theme */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-900 text-white p-5 sm:p-6 rounded-3xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-blue-200">
            HỒ SƠ SỐ ĐIỆN TỬ CƠ SỞ
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight leading-tight mt-0.5">
            5 Nhóm Đối Tượng Phục Vụ Chuyển Đổi Số
          </h2>
          <div className="text-xs text-blue-100 mt-1">
            Tổng số <strong>{targets.length}</strong> hồ sơ đã lưu vết · Hỗ trợ trọn đời theo dòng thời gian (Timeline)
          </div>
        </div>
      </div>

      {/* 2-Column Main Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Target Directory List (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs space-y-2.5 text-xs">
            <div className="relative">
              <Search className="w-4 h-4 text-blue-600 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Tìm theo tên đối tượng, SĐT, địa chỉ..."
                value={searchQuery}
                onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <select
              value={filterGroup}
              onChange={e => { setFilterGroup(e.target.value); setCurrentPage(1); }}
              className="w-full border border-slate-200 rounded-xl p-2 bg-slate-50 font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">Mọi nhóm đối tượng (5 nhóm)</option>
              <option value="NGUOI_DAN">1. Người dân</option>
              <option value="HO_KINH_DOANH">2. Hộ kinh doanh</option>
              <option value="TIEU_THUONG">3. Tiểu thương</option>
              <option value="DOANH_NGHIEP">4. Doanh nghiệp</option>
              <option value="CAN_BO_CO_SO">5. Cán bộ cơ sở</option>
            </select>
          </div>

          {/* List Cards */}
          <div className="space-y-2">
            {filteredTargets
              .slice((currentPage - 1) * pageSize, currentPage * pageSize)
              .map(target => {
                const isSelected = selectedTarget?.id === target.id;
                return (
                  <div
                    key={target.id}
                    onClick={() => setSelectedTarget(target)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-2 text-xs ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/70 ring-2 ring-blue-500/20 shadow-xs'
                        : 'border-slate-200 bg-white hover:border-blue-300 hover:bg-slate-50/60'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-0.5 flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-blue-700 bg-white px-2 py-0.5 rounded border border-blue-200 text-[11px]">
                            {target.code}
                          </span>
                          <TargetGroupBadge group={target.group} compact />
                        </div>
                        <div className="font-bold text-slate-900 text-sm truncate mt-1">
                          {target.name}
                        </div>
                        <div className="text-slate-500 text-[11px]">
                          📞 {target.phone} · 📍 {target.address}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

            {filteredTargets.length === 0 && (
              <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-slate-400 text-xs">
                Không tìm thấy hồ sơ đối tượng nào.
              </div>
            )}
          </div>

          {filteredTargets.length > pageSize && (
            <Pagination
              currentPage={currentPage}
              totalItems={filteredTargets.length}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              itemName="đối tượng"
            />
          )}
        </div>

        {/* Right Column: Target Details & Timeline (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {selectedTarget ? (
            <div className="space-y-4">
              {/* Profile Card */}
              <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-lg border border-blue-100 text-xs">
                        {selectedTarget.code}
                      </span>
                      <TargetGroupBadge group={selectedTarget.group} />
                    </div>
                    <h2 className="text-xl font-black text-slate-900 leading-tight">
                      {selectedTarget.name}
                    </h2>
                    <p className="text-xs text-slate-500">
                      📍 {selectedTarget.address}, {selectedTarget.neighborhood}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {isLeader && (
                      <>
                        <button
                          onClick={() => handleOpenEditModal(selectedTarget)}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 font-bold rounded-xl text-xs flex items-center gap-1 border border-slate-200 transition-colors"
                          title="Chỉnh sửa thông tin hồ sơ (Dành cho Tổ trưởng)"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>Sửa hồ sơ</span>
                        </button>
                        <button
                          onClick={() => handleDeleteTarget(selectedTarget)}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 font-bold rounded-xl text-xs flex items-center gap-1 border border-slate-200 transition-colors"
                          title="Xóa hồ sơ đối tượng (Dành cho Tổ trưởng)"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Xóa hồ sơ</span>
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => onOpenCreateTaskForTarget(selectedTarget.id)}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-3.5 py-1.5 rounded-xl text-xs flex items-center gap-1 shadow-xs transition-colors"
                    >
                      <Plus className="w-4 h-4 stroke-[2.5]" />
                      <span>Giao việc mới</span>
                    </button>
                  </div>
                </div>

                {/* Quick Info Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-slate-400 text-[10px] block">Số điện thoại</span>
                    <strong className="text-slate-800 text-xs font-mono">{selectedTarget.phone}</strong>
                  </div>
                  <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100">
                    <span className="text-blue-800 text-[10px] block">Mức sẵn sàng số</span>
                    <strong className="text-blue-900 text-xs font-bold">{selectedTarget.digitalReadinessLevel}</strong>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-slate-400 text-[10px] block">Địa bàn trực thuộc</span>
                    <strong className="text-slate-800 text-xs truncate block">{selectedTarget.ward}</strong>
                  </div>
                  <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                    <span className="text-emerald-800 text-[10px] block">Tổng công việc</span>
                    <strong className="text-emerald-900 text-xs font-bold">{targetTasks.length} nhiệm vụ</strong>
                  </div>
                </div>

                {selectedTarget.notes && (
                  <div className="p-3 bg-blue-50/40 border border-blue-100 rounded-xl text-xs text-blue-950 leading-relaxed">
                    <strong>Ghi chú nghiệp vụ: </strong>
                    {selectedTarget.notes}
                  </div>
                )}
              </div>

              {/* Timeline History */}
              <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-5 space-y-4">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  <span>Dòng Thời Gian Hỗ Trợ (Timeline)</span>
                </h3>

                <div className="space-y-3">
                  {targetTasks.map(task => (
                    <div
                      key={task.id}
                      onClick={() => onSelectTask(task)}
                      className="p-3.5 bg-slate-50 hover:bg-blue-50/60 rounded-2xl border border-slate-200 cursor-pointer transition-all space-y-1 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-blue-700">{task.code}</span>
                        <TaskStatusBadge status={task.status} />
                      </div>
                      <div className="font-bold text-slate-900 text-sm">{task.title}</div>
                      <p className="text-slate-500 line-clamp-2">{task.description}</p>
                      {task.actualResult && (
                        <div className="p-2 bg-emerald-50 rounded-lg border border-emerald-200 text-emerald-900 font-semibold text-[11px]">
                          ✓ Kết quả: {task.actualResult}
                        </div>
                      )}
                      <div className="pt-1 text-[11px] text-slate-400 flex items-center justify-between">
                        <span>Phụ trách: {task.primaryAssigneeName}</span>
                        <span>Hạn: {task.dueDate}</span>
                      </div>
                    </div>
                  ))}

                  {targetTasks.length === 0 && (
                    <div className="py-8 text-center text-slate-400 text-xs">
                      Chưa có công việc nào liên kết với đối tượng này.
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center text-slate-400 text-xs">
              Chọn một đối tượng từ danh sách bên trái để xem hồ sơ.
            </div>
          )}
        </div>
      </div>

      {/* CREATE TARGET MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-xl max-w-lg w-full p-6 space-y-4 border border-slate-200 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                Tạo Mới Hồ Sơ Đối Tượng Phục Vụ
              </h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTarget} className="space-y-3">
              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Họ tên / Tên hộ KD / Doanh nghiệp <span className="text-red-500">*</span>:
                </label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  placeholder="VD: Chị Nguyễn Thị Lan (Hộ kinh doanh tạp hóa)"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    Số điện thoại <span className="text-red-500">*</span>:
                  </label>
                  <input
                    type="tel"
                    required
                    value={newPhone}
                    onChange={e => setNewPhone(e.target.value)}
                    placeholder="VD: 0912345678"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">Nhóm đối tượng:</label>
                  <select
                    value={newGroup}
                    onChange={e => setNewGroup(e.target.value as TargetGroup)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  >
                    <option value="NGUOI_DAN">1. Người dân</option>
                    <option value="HO_KINH_DOANH">2. Hộ kinh doanh</option>
                    <option value="TIEU_THUONG">3. Tiểu thương</option>
                    <option value="DOANH_NGHIEP">4. Doanh nghiệp</option>
                    <option value="CAN_BO_CO_SO">5. Cán bộ cơ sở</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">Địa chỉ chi tiết:</label>
                <input
                  type="text"
                  value={newAddress}
                  onChange={e => setNewAddress(e.target.value)}
                  placeholder="Số nhà, đường, khóm/ấp..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">Ghi chú đặc điểm:</label>
                <textarea
                  rows={2}
                  value={newNotes}
                  onChange={e => setNewNotes(e.target.value)}
                  placeholder="Nhu cầu thường gặp, đặc điểm thiết bị, tình trạng công nghệ..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs"
                >
                  Lưu hồ sơ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT TARGET MODAL */}
      {showEditModal && editingTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-xl max-w-lg w-full p-6 space-y-4 border border-slate-200 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-1.5 text-blue-900">
                <Edit2 className="w-4 h-4 text-blue-600" />
                <span>Chỉnh Sửa Hồ Sơ Đối Tượng ({editingTarget.code})</span>
              </h3>
              <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditTarget} className="space-y-3">
              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Họ tên / Tên hộ KD / Doanh nghiệp <span className="text-red-500">*</span>:
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    Số điện thoại <span className="text-red-500">*</span>:
                  </label>
                  <input
                    type="tel"
                    required
                    value={editPhone}
                    onChange={e => setEditPhone(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">Nhóm đối tượng:</label>
                  <select
                    value={editGroup}
                    onChange={e => setEditGroup(e.target.value as TargetGroup)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  >
                    <option value="NGUOI_DAN">1. Người dân</option>
                    <option value="HO_KINH_DOANH">2. Hộ kinh doanh</option>
                    <option value="TIEU_THUONG">3. Tiểu thương</option>
                    <option value="DOANH_NGHIEP">4. Doanh nghiệp</option>
                    <option value="CAN_BO_CO_SO">5. Cán bộ cơ sở</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">Địa chỉ:</label>
                  <input
                    type="text"
                    value={editAddress}
                    onChange={e => setEditAddress(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">Mức sẵn sàng số:</label>
                  <select
                    value={editReadiness}
                    onChange={e => setEditReadiness(e.target.value as any)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                  >
                    <option value="CHUA_CO_GI">Chưa có kỹ năng số</option>
                    <option value="CO_BAN">Cơ bản (Zalo, Đọc báo)</option>
                    <option value="KHA">Khá (Thanh toán QR, VNeID)</option>
                    <option value="TOT">Tốt (Dịch vụ công, Thuế số)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">Ghi chú đặc điểm:</label>
                <textarea
                  rows={2}
                  value={editNotes}
                  onChange={e => setEditNotes(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>Cập nhật hồ sơ</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!targetToDelete}
        title="Xóa hồ sơ đối tượng"
        message={`Bạn có chắc chắn muốn xóa vĩnh viễn hồ sơ đối tượng "${targetToDelete?.name}" (${targetToDelete?.code})? Tất cả lịch sử tương tác liên quan sẽ bị xóa.`}
        confirmLabel="Xóa hồ sơ"
        cancelLabel="Hủy"
        isDestructive={true}
        onConfirm={handleConfirmDelete}
        onCancel={() => setTargetToDelete(null)}
      />
    </div>
  );
};
