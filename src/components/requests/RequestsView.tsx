import React, { useState } from 'react';
import {
  ArrowRight,
  CheckCircle,
  Edit2,
  FileCheck,
  Globe,
  Inbox,
  MapPin,
  MessageSquare,
  Phone,
  Plus,
  Save,
  Search,
  Trash2,
  User,
  UserCheck,
  X
} from 'lucide-react';
import { SERVICE_CATEGORIES } from '../../mock/initialData';
import { appStorage } from '../../services/storage';
import { RequestStatus, SupportRequest, TargetGroup } from '../../types';
import { TargetGroupBadge } from '../common/StatusBadge';
import { Pagination } from '../common/Pagination';
import { ConfirmDialog } from '../common/ConfirmDialog';

interface RequestsViewProps {
  onOpenCitizenPortal: () => void;
  onOpenCreateTaskFromRequest: (reqId: string) => void;
}

export const RequestsView: React.FC<RequestsViewProps> = ({
  onOpenCitizenPortal,
  onOpenCreateTaskFromRequest
}) => {
  const requests = appStorage.getRequests();
  const members = appStorage.getMembers();
  const currentUser = appStorage.getCurrentUser();
  const currentRole = appStorage.getCurrentRole();
  const authAccount = appStorage.getCurrentAuthAccount();
  const isLeader = currentRole === 'LEADER' || authAccount?.role === 'LEADER' || appStorage.isCurrentUserSuperAdmin();
  const isOfficer = currentRole === 'OFFICER' || authAccount?.role === 'OFFICER';
  const isMember = !isLeader && !isOfficer;

  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterGroup, setFilterGroup] = useState<string>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Selected request for detail modal
  const [selectedReq, setSelectedReq] = useState<SupportRequest | null>(null);

  // Direct Create Modal (For staff recording a request at office/desk)
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newFullName, setNewFullName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newTargetGroup, setNewTargetGroup] = useState<TargetGroup>('NGUOI_DAN');
  const [newNeedCategory, setNewNeedCategory] = useState(SERVICE_CATEGORIES[0]);
  const [newAddress, setNewAddress] = useState('');
  const [newContent, setNewContent] = useState('');

  // Edit Request Modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingReq, setEditingReq] = useState<SupportRequest | null>(null);
  const [editFullName, setEditFullName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editNeedCategory, setEditNeedCategory] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editStatus, setEditStatus] = useState<RequestStatus>('CHO_TIEP_NHAN');
  const [editAssigneeId, setEditAssigneeId] = useState('');

  // Delete Request State
  const [reqToDelete, setReqToDelete] = useState<SupportRequest | null>(null);

  // Kiểm tra yêu cầu có được phân công cho cán bộ/thành viên hiện tại không
  const isAssignedToCurrentMember = (req: SupportRequest): boolean => {
    // 1. Phân công theo ID
    if (req.assignedMemberId && (req.assignedMemberId === currentUser.id || req.assignedMemberId === authAccount?.id)) {
      return true;
    }
    // 2. Phân công theo Tên cán bộ
    if (req.assignedMemberName) {
      const cleanReqName = req.assignedMemberName.replace(/\(.*?\)/g, '').trim().toLowerCase();
      const cleanMyName = currentUser.name.replace(/\(.*?\)/g, '').trim().toLowerCase();
      const cleanAuthName = authAccount?.fullName ? authAccount.fullName.replace(/\(.*?\)/g, '').trim().toLowerCase() : '';
      if (cleanReqName && (cleanReqName === cleanMyName || (cleanAuthName && cleanReqName === cleanAuthName))) {
        return true;
      }
    }
    // 3. Công việc chuyển đổi (converted task) đã được phân công cho thành viên
    if (req.convertedTaskId) {
      const allTasks = appStorage.getTasks();
      const linkedTask = allTasks.find(t => t.id === req.convertedTaskId || t.requestId === req.id);
      if (linkedTask) {
        if (linkedTask.primaryAssigneeId === currentUser.id || linkedTask.primaryAssigneeId === authAccount?.id) {
          return true;
        }
        const cleanTaskAssignee = linkedTask.primaryAssigneeName?.replace(/\(.*?\)/g, '').trim().toLowerCase();
        const cleanMyName = currentUser.name.replace(/\(.*?\)/g, '').trim().toLowerCase();
        if (cleanTaskAssignee && cleanMyName && cleanTaskAssignee === cleanMyName) {
          return true;
        }
      }
    }
    return false;
  };

  // Với tài khoản thành viên: chỉ hiển thị những yêu cầu nào được phân công cho thành viên đó
  const baseRequests = isMember ? requests.filter(isAssignedToCurrentMember) : requests;

  const filteredRequests = baseRequests.filter(r => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match = r.code.toLowerCase().includes(q) ||
        r.fullName.toLowerCase().includes(q) ||
        r.phone.includes(q) ||
        r.needCategory.toLowerCase().includes(q);
      if (!match) return false;
    }
    if (filterStatus !== 'ALL' && r.status !== filterStatus) return false;
    if (filterGroup !== 'ALL' && r.targetGroup !== filterGroup) return false;
    return true;
  });

  const handleCreateDirectRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFullName.trim() || !newPhone.trim() || !newContent.trim()) {
      alert('Vui lòng điền đầy đủ Họ tên, Số điện thoại và Nội dung yêu cầu.');
      return;
    }

    const currentWard = appStorage.getSelectedWard();
    const created = appStorage.createRequest({
      fullName: newFullName.trim(),
      phone: newPhone.trim(),
      targetGroup: newTargetGroup,
      ward: currentWard.name,
      neighborhood: `${currentWard.unitType === 'PHUONG' ? 'Khóm' : currentWard.unitType === 'DAC_KHU' ? 'Khu vực' : 'Ấp'} 1, ${currentWard.name}`,
      address: newAddress.trim() || `Địa bàn ${currentWard.name}`,
      needCategory: newNeedCategory,
      content: newContent.trim(),
      format: 'TRUC_TIEP',
      preferredTime: 'Giờ hành chính',
      termsAccepted: true
    });

    setShowCreateModal(false);
    setNewFullName('');
    setNewPhone('');
    setNewAddress('');
    setNewContent('');
  };

  const handleOpenEditModal = (req: SupportRequest) => {
    setEditingReq(req);
    setEditFullName(req.fullName);
    setEditPhone(req.phone);
    setEditNeedCategory(req.needCategory);
    setEditContent(req.content);
    setEditAddress(req.address);
    setEditStatus(req.status);

    // Sync from linked task if request missing assignment info
    const allTasks = appStorage.getTasks();
    const linkedTask = allTasks.find(t => t.requestId === req.id || (req.convertedTaskId && t.id === req.convertedTaskId));
    const effectiveAssigneeName = req.assignedMemberName || linkedTask?.primaryAssigneeName;
    const effectiveAssigneeId = req.assignedMemberId || linkedTask?.primaryAssigneeId;

    let assigneeId = '';
    if (effectiveAssigneeId && members.some(m => m.id === effectiveAssigneeId)) {
      assigneeId = effectiveAssigneeId;
    } else if (effectiveAssigneeName) {
      const match = members.find(m =>
        m.name.toLowerCase().trim() === effectiveAssigneeName.toLowerCase().trim() ||
        effectiveAssigneeName.toLowerCase().includes(m.name.toLowerCase().trim()) ||
        m.name.toLowerCase().trim().includes(effectiveAssigneeName.toLowerCase().trim())
      );
      if (match) {
        assigneeId = match.id;
      } else {
        assigneeId = effectiveAssigneeId || 'assigned';
      }
    }
    setEditAssigneeId(assigneeId);
    setShowEditModal(true);
  };

  const handleSaveEditRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingReq) return;
    if (!editFullName.trim() || !editPhone.trim()) {
      alert('Vui lòng nhập họ tên và số điện thoại người gửi.');
      return;
    }

    const assignedMember = members.find(m => m.id === editAssigneeId);

    const updated: SupportRequest = {
      ...editingReq,
      fullName: editFullName.trim(),
      phone: editPhone.trim(),
      needCategory: editNeedCategory,
      content: editContent.trim(),
      address: editAddress.trim(),
      status: editStatus,
      assignedMemberId: editAssigneeId && editAssigneeId !== 'assigned' ? editAssigneeId : editingReq.assignedMemberId,
      assignedMemberName: assignedMember ? assignedMember.name : (editAssigneeId ? editingReq.assignedMemberName : undefined),
      updatedAt: new Date().toISOString()
    };

    appStorage.updateRequest(updated);
    if (selectedReq?.id === updated.id) {
      setSelectedReq(updated);
    }
    setShowEditModal(false);
  };

  const handleConfirmDelete = () => {
    if (!reqToDelete) return;
    appStorage.deleteRequest(reqToDelete.id);
    if (selectedReq?.id === reqToDelete.id) {
      setSelectedReq(null);
    }
    setReqToDelete(null);
  };

  return (
    <div className="space-y-4">
      {/* Header Banner - Royal Blue Theme */}
      <div className="bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-900 text-white p-5 sm:p-6 rounded-3xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-blue-200">
            CỔNG TIẾP NHẬN YÊU CẦU TRỰC TUYẾN & TẠI CHỖ
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight leading-tight mt-0.5">
            Tiếp Nhận & Điều Phối Yêu Cầu Hỗ Trợ
          </h2>
          <div className="text-xs text-blue-100 mt-1">
            {isMember ? (
              <>Danh sách <strong>{baseRequests.length}</strong> yêu cầu được phân công cho bạn · Quản lý và xử lý đúng quy trình</>
            ) : (
              <>Tổng số <strong>{requests.length}</strong> yêu cầu đã tiếp nhận · Dữ liệu đồng bộ trực tiếp từ Cổng Dịch Vụ Người Dân</>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 bg-white text-blue-900 hover:bg-blue-50 font-bold px-4 py-2 rounded-xl text-xs sm:text-sm shadow-md transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Tiếp nhận phiếu mới</span>
          </button>

          <button
            onClick={onOpenCitizenPortal}
            className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white font-bold px-3.5 py-2 rounded-xl text-xs sm:text-sm border border-white/20 transition-colors"
            title="Mở giao diện Cổng Dân để người dân tự gửi yêu cầu"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Xem Cổng Dân</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar with Blue Focus */}
      <div className="bg-white p-4 rounded-2xl border border-blue-100/80 shadow-xs flex flex-col sm:flex-row gap-2.5 text-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-blue-600 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Tìm theo Mã (YC-xxxx), Họ tên, Số điện thoại, Nhu cầu..."
            value={searchQuery}
            onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 text-xs"
          />
        </div>

        <select
          value={filterStatus}
          onChange={e => { setFilterStatus(e.target.value); setCurrentPage(1); }}
          className="border border-slate-200 rounded-xl p-2 bg-slate-50 font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500 text-xs"
        >
          <option value="ALL">Mọi trạng thái</option>
          <option value="CHO_TIEP_NHAN">Mới gửi (Chờ tiếp nhận)</option>
          <option value="DA_TIEP_NHAN">Đã tiếp nhận</option>
          <option value="DANG_XU_LY">Đang xử lý (Đã giao việc)</option>
          <option value="CHO_BO_SUNG">Chờ bổ sung thông tin</option>
          <option value="HOAN_THANH">Đã giải quyết xong</option>
        </select>

        <select
          value={filterGroup}
          onChange={e => { setFilterGroup(e.target.value); setCurrentPage(1); }}
          className="border border-slate-200 rounded-xl p-2 bg-slate-50 font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500 text-xs"
        >
          <option value="ALL">Mọi nhóm đối tượng</option>
          <option value="NGUOI_DAN">Người dân</option>
          <option value="HO_KINH_DOANH">Hộ kinh doanh</option>
          <option value="TIEU_THUONG">Tiểu thương</option>
          <option value="DOANH_NGHIEP">Doanh nghiệp</option>
          <option value="CAN_BO_CO_SO">Cán bộ cơ sở</option>
        </select>
      </div>

      {/* Requests List */}
      <div className="space-y-3">
        {filteredRequests
          .slice((currentPage - 1) * pageSize, currentPage * pageSize)
          .map(req => {
            const isPending = req.status === 'CHO_TIEP_NHAN';
            return (
              <div
                key={req.id}
                className={`p-4 sm:p-5 rounded-2xl border transition-all bg-white hover:border-blue-400 hover:shadow-md ${
                  isPending ? 'border-l-4 border-l-amber-500 bg-amber-50/20' : 'border-slate-200'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-lg border border-blue-100">
                        {req.code}
                      </span>
                      <TargetGroupBadge group={req.targetGroup} compact />
                      <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                        req.status === 'CHO_TIEP_NHAN'
                          ? 'bg-amber-100 text-amber-800 animate-pulse'
                          : req.status === 'DANG_XU_LY'
                          ? 'bg-blue-100 text-blue-800'
                          : req.status === 'HOAN_THANH'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}>
                        {req.status === 'CHO_TIEP_NHAN' && 'MỚI GỬI (CHỜ TIẾP NHẬN)'}
                        {req.status === 'DA_TIEP_NHAN' && 'ĐÃ TIẾP NHẬN'}
                        {req.status === 'DANG_XU_LY' && (req.assignedMemberName ? 'ĐANG XỬ LÝ (ĐÃ PHÂN CÔNG)' : 'ĐANG XỬ LÝ (CHƯA PHÂN CÔNG)')}
                        {req.status === 'HOAN_THANH' && 'ĐÃ GIẢI QUYẾT XONG'}
                        {req.status === 'CHO_BO_SUNG' && 'CHỜ BỔ SUNG'}
                        {req.status === 'TU_CHOI' && 'TỪ CHỐI'}
                      </span>
                      <span className="text-slate-400 text-[11px]">
                        {req.createdAt.split('T')[0]}
                      </span>
                    </div>

                    <div className="font-bold text-slate-900 text-base">
                      {req.fullName} <span className="font-normal text-slate-500 text-xs font-mono">({req.phone})</span>
                    </div>

                    <div className="text-xs text-blue-900 font-semibold bg-blue-50/80 p-2.5 rounded-xl border border-blue-100">
                      Nhu cầu: <strong>{req.needCategory}</strong>
                      <div className="font-normal text-slate-700 mt-0.5 line-clamp-2">{req.content}</div>
                    </div>

                    <div className="text-[11px] text-slate-500 flex flex-wrap items-center gap-x-4 gap-y-1">
                      <span>📍 {req.address}</span>
                      {req.assignedMemberName ? (
                        <span>· Cán bộ phụ trách: <strong className="text-slate-800">{req.assignedMemberName}</strong></span>
                      ) : (
                        <span className="text-amber-600 font-semibold">· ⏳ Chưa phân công cán bộ</span>
                      )}
                    </div>
                  </div>

                  {/* Actions Area */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0 self-end md:self-center">
                    {/* Create Task Button */}
                    {req.status !== 'DANG_XU_LY' && req.status !== 'HOAN_THANH' && (
                      <button
                        onClick={() => onOpenCreateTaskFromRequest(req.id)}
                        className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-xs transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                        <span>Tạo việc xử lý</span>
                      </button>
                    )}

                    {/* Detail Request Button - Đổi Sửa thành Chi tiết */}
                    <button
                      onClick={() => handleOpenEditModal(req)}
                      className="px-3.5 py-1.5 bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white font-bold rounded-xl text-xs border border-blue-200 flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
                      title="Xem chi tiết & xử lý yêu cầu"
                    >
                      <FileCheck className="w-3.5 h-3.5" />
                      <span>Chi tiết</span>
                    </button>

                    {/* Delete Request Button (Chỉ Tổ trưởng mới có quyền xóa) */}
                    {isLeader && (
                      <button
                        onClick={() => setReqToDelete(req)}
                        className="p-2 bg-slate-50 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-xl border border-slate-200 transition-colors cursor-pointer"
                        title="Xóa yêu cầu này (Chỉ Tổ trưởng)"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

        {filteredRequests.length === 0 && (
          <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center text-slate-400 space-y-2 text-xs">
            <Inbox className="w-10 h-10 mx-auto text-blue-300" />
            <div className="font-bold text-slate-700 text-sm">
              {isMember ? 'Không có yêu cầu nào được phân công' : 'Không có yêu cầu nào phù hợp'}
            </div>
            <div>
              {isMember
                ? 'Bạn chưa có yêu cầu hỗ trợ nào được phân công. Khi Tổ trưởng giao việc hoặc phân công xử lý yêu cầu của người dân, phiếu sẽ xuất hiện tại đây.'
                : 'Chưa có người dân nào gửi yêu cầu theo điều kiện lọc này.'}
            </div>
          </div>
        )}
      </div>

      {filteredRequests.length > pageSize && (
        <Pagination
          currentPage={currentPage}
          totalItems={filteredRequests.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          itemName="yêu cầu"
        />
      )}

      {/* CREATE DIRECT REQUEST MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-blue-100 text-xs animate-in zoom-in-95 duration-150">
            <div className="p-5 bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-900 text-white flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold">Tiếp Nhận Phiếu Yêu Cầu Hỗ Trợ Mới</h3>
                <p className="text-xs text-blue-100">Ghi nhận thông tin người dân đến trực tiếp hoặc liên hệ qua điện thoại</p>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="p-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateDirectRequest} className="p-5 space-y-3.5 max-h-[80vh] overflow-y-auto">
              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Họ và tên người dân / Tên cơ sở <span className="text-red-500">*</span>:
                </label>
                <input
                  type="text"
                  required
                  placeholder="VD: Nguyễn Văn An"
                  value={newFullName}
                  onChange={e => setNewFullName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-blue-500"
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
                    placeholder="VD: 0912345678"
                    value={newPhone}
                    onChange={e => setNewPhone(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">Nhóm đối tượng:</label>
                  <select
                    value={newTargetGroup}
                    onChange={e => setNewTargetGroup(e.target.value as TargetGroup)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="NGUOI_DAN">Người dân</option>
                    <option value="HO_KINH_DOANH">Hộ kinh doanh</option>
                    <option value="TIEU_THUONG">Tiểu thương</option>
                    <option value="DOANH_NGHIEP">Doanh nghiệp</option>
                    <option value="CAN_BO_CO_SO">Cán bộ cơ sở</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">Nhóm nhu cầu chuyển đổi số:</label>
                <select
                  value={newNeedCategory}
                  onChange={e => setNewNeedCategory(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-blue-500"
                >
                  {SERVICE_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Nội dung yêu cầu chi tiết <span className="text-red-500">*</span>:
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Ghi rõ nội dung bà con cần hỗ trợ..."
                  value={newContent}
                  onChange={e => setNewContent(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">Địa chỉ người dân:</label>
                <input
                  type="text"
                  placeholder="Số nhà, đường, khóm/ấp..."
                  value={newAddress}
                  onChange={e => setNewAddress(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                  <span>Lưu & Tiếp nhận</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT REQUEST MODAL */}
      {showEditModal && editingReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-blue-100 text-xs animate-in zoom-in-95 duration-150">
            <div className="p-5 bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-900 text-white flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold">Chi Tiết Phiếu Yêu Cầu Hỗ Trợ ({editingReq.code})</h3>
                <p className="text-xs text-blue-100">Xem thông tin chi tiết của người dân và điều phối cán bộ phụ trách</p>
              </div>
              <button onClick={() => setShowEditModal(false)} className="p-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditRequest} className="p-5 space-y-3.5 max-h-[80vh] overflow-y-auto">
              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Họ và tên người dân <span className="text-red-500">*</span>:
                </label>
                <input
                  type="text"
                  required
                  value={editFullName}
                  onChange={e => setEditFullName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-blue-500"
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
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">Trạng thái xử lý:</label>
                  <select
                    value={editStatus}
                    onChange={e => setEditStatus(e.target.value as RequestStatus)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-semibold focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="CHO_TIEP_NHAN">Mới gửi (Chờ tiếp nhận)</option>
                    <option value="DA_TIEP_NHAN">Đã tiếp nhận</option>
                    <option value="DANG_XU_LY">Đang xử lý</option>
                    <option value="HOAN_THANH">Đã giải quyết xong</option>
                    <option value="TU_CHOI">Từ chối</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">Nhóm nhu cầu:</label>
                <select
                  value={editNeedCategory}
                  onChange={e => setEditNeedCategory(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-semibold focus:ring-2 focus:ring-blue-500"
                >
                  {SERVICE_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">Nội dung chi tiết yêu cầu:</label>
                <textarea
                  rows={3}
                  value={editContent}
                  onChange={e => setEditContent(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">Địa chỉ người dân:</label>
                <input
                  type="text"
                  value={editAddress}
                  onChange={e => setEditAddress(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Phân công cán bộ phụ trách:
                  {!isLeader && (
                    <span className="text-[11px] text-blue-600 font-normal ml-1">
                      (Chỉ Tổ trưởng mới có quyền phân công lại)
                    </span>
                  )}
                </label>
                <select
                  value={editAssigneeId}
                  onChange={e => isLeader && setEditAssigneeId(e.target.value)}
                  disabled={!isLeader}
                  className={`w-full p-2.5 border rounded-xl font-semibold ${
                    !isLeader
                      ? 'bg-slate-100 text-slate-600 border-slate-200 cursor-not-allowed'
                      : 'bg-slate-50 border-slate-300 focus:ring-2 focus:ring-blue-500'
                  }`}
                >
                  <option value="">-- Chưa phân công --</option>
                  {/* Nếu yêu cầu đã có cán bộ phụ trách từ trước nhưng ID khác danh sách phường hiện tại thì vẫn hiển thị đúng tên */}
                  {editingReq.assignedMemberName && !members.some(m => m.id === editAssigneeId) && (
                    <option value={editAssigneeId || 'assigned'}>
                      👤 {editingReq.assignedMemberName} (Đã phân công)
                    </option>
                  )}
                  {members.map(m => (
                    <option key={m.id} value={m.id}>👤 {m.name} ({m.title})</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
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
                  <span>Cập nhật yêu cầu</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRM DIALOG */}
      <ConfirmDialog
        isOpen={!!reqToDelete}
        title="Xóa yêu cầu hỗ trợ"
        message={`Bạn có chắc chắn muốn xóa vĩnh viễn yêu cầu "${reqToDelete?.code}" từ người dân "${reqToDelete?.fullName}"? Hành động này không thể hoàn tác.`}
        confirmLabel="Xác nhận xóa"
        cancelLabel="Hủy"
        isDestructive={true}
        onConfirm={handleConfirmDelete}
        onCancel={() => setReqToDelete(null)}
      />
    </div>
  );
};
