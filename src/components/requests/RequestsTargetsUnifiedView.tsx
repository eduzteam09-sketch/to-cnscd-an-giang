import React, { useState, useEffect } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileCheck,
  Filter,
  Flame,
  HelpCircle,
  Inbox,
  Layers,
  MapPin,
  MessageSquare,
  Phone,
  Plus,
  Search,
  Sparkles,
  User,
  UserCheck,
  UserPlus,
  Users,
  X
} from 'lucide-react';
import { appStorage } from '../../services/storage';
import { RequestStatus, SupportRequest, TargetGroup, TargetProfile, Task } from '../../types';
import { PriorityBadge, TargetGroupBadge, TaskStatusBadge } from '../common/StatusBadge';
import { Pagination } from '../common/Pagination';

interface RequestsTargetsUnifiedViewProps {
  initialSubTab?: 'requests' | 'targets';
  onOpenCitizenPortal: () => void;
  onOpenCreateTaskFromRequest: (reqId: string) => void;
  onOpenCreateTaskForTarget: (targetId: string) => void;
  onSelectTask?: (task: Task) => void;
}

export const RequestsTargetsUnifiedView: React.FC<RequestsTargetsUnifiedViewProps> = ({
  initialSubTab = 'requests',
  onOpenCitizenPortal,
  onOpenCreateTaskFromRequest,
  onOpenCreateTaskForTarget,
  onSelectTask
}) => {
  // Primary sub-view toggle: 'requests' | 'targets' | 'flow'
  const [activeSubTab, setActiveSubTab] = useState<'requests' | 'targets' | 'flow'>(initialSubTab);

  // Sync initialSubTab when parent changes it
  useEffect(() => {
    if (initialSubTab) {
      setActiveSubTab(initialSubTab);
    }
  }, [initialSubTab]);

  // Data sources
  const requests = appStorage.getRequests();
  const targets = appStorage.getTargets();
  const allTasks = appStorage.getTasks();
  const members = appStorage.getMembers();

  // ----------------------------------------------------
  // REQUESTS STATE & LOGIC
  // ----------------------------------------------------
  const [searchRequestQuery, setSearchRequestQuery] = useState('');
  const [filterRequestStatus, setFilterRequestStatus] = useState<string>('ALL');
  const [filterRequestGroup, setFilterRequestGroup] = useState<string>('ALL');
  const [requestCurrentPage, setRequestCurrentPage] = useState(1);
  const requestPageSize = 10;
  const [selectedReq, setSelectedReq] = useState<SupportRequest | null>(null);

  const filteredRequests = requests.filter(r => {
    if (searchRequestQuery.trim()) {
      const q = searchRequestQuery.toLowerCase();
      const match =
        r.code.toLowerCase().includes(q) ||
        r.fullName.toLowerCase().includes(q) ||
        r.phone.includes(q) ||
        r.needCategory.toLowerCase().includes(q) ||
        r.content.toLowerCase().includes(q);
      if (!match) return false;
    }
    if (filterRequestStatus !== 'ALL' && r.status !== filterRequestStatus) return false;
    if (filterRequestGroup !== 'ALL' && r.targetGroup !== filterRequestGroup) return false;
    return true;
  });

  const handleUpdateStatus = (req: SupportRequest, newStatus: RequestStatus, notes?: string) => {
    const updated: SupportRequest = {
      ...req,
      status: newStatus,
      responseNotes: notes !== undefined ? notes : req.responseNotes
    };
    appStorage.updateRequest(updated);
    if (selectedReq?.id === req.id) {
      setSelectedReq(updated);
    }
  };

  const handleQuickAssign = (req: SupportRequest, memberId: string) => {
    const member = members.find(m => m.id === memberId);
    const updated: SupportRequest = {
      ...req,
      assignedMemberId: memberId,
      assignedMemberName: member?.name,
      status: req.status === 'CHO_TIEP_NHAN' ? 'DA_TIEP_NHAN' : req.status
    };
    appStorage.updateRequest(updated);
    if (selectedReq?.id === req.id) {
      setSelectedReq(updated);
    }
  };

  // ----------------------------------------------------
  // TARGETS STATE & LOGIC
  // ----------------------------------------------------
  const [selectedTarget, setSelectedTarget] = useState<TargetProfile | null>(targets[0] || null);
  const [searchTargetQuery, setSearchTargetQuery] = useState('');
  const [filterTargetGroup, setFilterTargetGroup] = useState<string>('ALL');
  const [targetCurrentPage, setTargetCurrentPage] = useState(1);
  const targetPageSize = 10;

  // New Target Modal state
  const [showCreateTargetModal, setShowCreateTargetModal] = useState(false);
  const [newTargetName, setNewTargetName] = useState('');
  const [newTargetGroup, setNewTargetGroup] = useState<TargetGroup>('NGUOI_DAN');
  const [newTargetPhone, setNewTargetPhone] = useState('');
  const [newTargetAddress, setNewTargetAddress] = useState('');
  const [newTargetNotes, setNewTargetNotes] = useState('');

  const filteredTargets = targets.filter(t => {
    if (searchTargetQuery.trim()) {
      const q = searchTargetQuery.toLowerCase();
      const match =
        t.name.toLowerCase().includes(q) ||
        t.phone.includes(q) ||
        t.code.toLowerCase().includes(q) ||
        t.address.toLowerCase().includes(q) ||
        (t.representativeName && t.representativeName.toLowerCase().includes(q));
      if (!match) return false;
    }
    if (filterTargetGroup !== 'ALL' && t.group !== filterTargetGroup) return false;
    return true;
  });

  const handleCreateTarget = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTargetName.trim() || !newTargetPhone.trim()) return;

    const currentWard = appStorage.getSelectedWard();
    const created = appStorage.createTarget({
      name: newTargetName.trim(),
      group: newTargetGroup,
      phone: newTargetPhone.trim(),
      ward: currentWard.name,
      neighborhood: `${currentWard.unitType === 'PHUONG' ? 'Khóm' : currentWard.unitType === 'DAC_KHU' ? 'Khu vực' : 'Ấp'} 1, ${currentWard.name}`,
      address: newTargetAddress.trim() || `Trung tâm ${currentWard.name}`,
      digitalReadinessLevel: 'CO_BAN',
      needsFollowUp: true,
      notes: newTargetNotes.trim()
    });

    setSelectedTarget(created);
    setShowCreateTargetModal(false);
    setNewTargetName('');
    setNewTargetPhone('');
    setNewTargetAddress('');
    setNewTargetNotes('');
  };

  // Jump from Request -> Target Profile
  const handleJumpToTargetFromRequest = (phone: string, fallbackName?: string, fallbackGroup?: TargetGroup) => {
    let found = targets.find(t => t.phone === phone);
    if (!found && fallbackName) {
      found = targets.find(t => t.name.toLowerCase() === fallbackName.toLowerCase());
    }

    if (found) {
      setSelectedTarget(found);
      setActiveSubTab('targets');
    } else {
      // Prompt quick create with pre-filled details
      setNewTargetName(fallbackName || '');
      setNewTargetPhone(phone);
      if (fallbackGroup) setNewTargetGroup(fallbackGroup);
      setShowCreateTargetModal(true);
    }
  };

  // Tasks & Requests of currently selected Target
  const targetTasks = selectedTarget
    ? allTasks.filter(t => t.targetId === selectedTarget.id || (t.targetPhone && t.targetPhone === selectedTarget.phone))
    : [];
  const targetRequests = selectedTarget
    ? requests.filter(r => r.phone === selectedTarget.phone || r.fullName.toLowerCase() === selectedTarget.name.toLowerCase())
    : [];

  // KPI Calculations
  const pendingRequestsCount = requests.filter(r => r.status === 'CHO_TIEP_NHAN').length;
  const inProgressRequestsCount = requests.filter(r => r.status === 'DA_TIEP_NHAN' || r.status === 'DANG_XU_LY').length;
  const totalTargetsCount = targets.length;
  const followUpTargetsCount = targets.filter(t => t.needsFollowUp).length;

  return (
    <div className="space-y-4">
      {/* 1. Header Banner & Quick Actions */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-blue-100 text-blue-700 rounded-lg">
              <Users className="w-5 h-5" />
            </span>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900">
              Yêu Cầu Từ Dân & Hồ Sơ 5 Nhóm Đối Tượng
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Trung tâm tiếp nhận, điều phối yêu cầu hỗ trợ và quản lý hồ sơ số 360° của 5 nhóm đối tượng chuyển đổi số trên địa bàn
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowCreateTargetModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-colors"
          >
            <UserPlus className="w-4 h-4 text-blue-600" />
            <span>Thêm hồ sơ mới</span>
          </button>
          <button
            onClick={onOpenCitizenPortal}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
          >
            <Sparkles className="w-4 h-4 text-blue-200" />
            <span>Mở Cổng Dịch Vụ Dân</span>
          </button>
        </div>
      </div>

      {/* 2. Interactive KPI Stats Strip (Bấm trực tiếp để lọc dữ liệu) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          onClick={() => {
            setActiveSubTab('requests');
            setFilterRequestStatus('CHO_TIEP_NHAN');
          }}
          className={`p-3.5 rounded-xl border text-left transition-all hover:shadow-xs ${
            activeSubTab === 'requests' && filterRequestStatus === 'CHO_TIEP_NHAN'
              ? 'bg-amber-50/80 border-amber-300 ring-2 ring-amber-100'
              : 'bg-white border-slate-200 hover:border-amber-200'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold text-amber-700 flex items-center gap-1">
              <Inbox className="w-3.5 h-3.5" /> Yêu cầu mới
            </span>
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 mt-1 tabular-nums">
            {pendingRequestsCount}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Chờ tiếp nhận & phân công</div>
        </button>

        <button
          onClick={() => {
            setActiveSubTab('requests');
            setFilterRequestStatus('ALL');
          }}
          className={`p-3.5 rounded-xl border text-left transition-all hover:shadow-xs ${
            activeSubTab === 'requests' && filterRequestStatus === 'ALL'
              ? 'bg-blue-50/80 border-blue-300 ring-2 ring-blue-100'
              : 'bg-white border-slate-200 hover:border-blue-200'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold text-blue-700 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> Đang xử lý
            </span>
            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 mt-1 tabular-nums">
            {inProgressRequestsCount}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Đã phân công / làm việc</div>
        </button>

        <button
          onClick={() => {
            setActiveSubTab('targets');
            setFilterTargetGroup('ALL');
          }}
          className={`p-3.5 rounded-xl border text-left transition-all hover:shadow-xs ${
            activeSubTab === 'targets' && filterTargetGroup === 'ALL'
              ? 'bg-emerald-50/80 border-emerald-300 ring-2 ring-emerald-100'
              : 'bg-white border-slate-200 hover:border-emerald-200'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold text-emerald-700 flex items-center gap-1">
              <Users className="w-3.5 h-3.5" /> Hồ sơ 5 nhóm
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 mt-1 tabular-nums">
            {totalTargetsCount}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Đã lưu vết dữ liệu số</div>
        </button>

        <button
          onClick={() => {
            setActiveSubTab('targets');
          }}
          className={`p-3.5 rounded-xl border text-left transition-all hover:shadow-xs ${
            activeSubTab === 'targets'
              ? 'bg-purple-50/80 border-purple-300 ring-2 ring-purple-100'
              : 'bg-white border-slate-200 hover:border-purple-200'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold text-purple-700 flex items-center gap-1">
              <FileCheck className="w-3.5 h-3.5" /> Cần đôn đốc
            </span>
            <span className="w-2 h-2 rounded-full bg-purple-500"></span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 mt-1 tabular-nums">
            {followUpTargetsCount}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Đối tượng cần liên hệ lại</div>
        </button>
      </div>

      {/* 3. Sleek Segmented Switcher & Flow Guide */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
          <button
            onClick={() => setActiveSubTab('requests')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeSubTab === 'requests'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Inbox className="w-4 h-4" />
            <span>Hộp Thư Yêu Cầu Từ Dân</span>
            {pendingRequestsCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-white text-[10px] font-black">
                {pendingRequestsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveSubTab('targets')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeSubTab === 'targets'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Danh Bạ & Hồ Sơ 5 Nhóm ({totalTargetsCount})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('flow')}
            className={`hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeSubTab === 'flow'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Sơ Đồ Luồng Xử Lý</span>
          </button>
        </div>

        <div className="text-[11px] text-slate-500 px-2 font-medium hidden md:block">
          {activeSubTab === 'requests' && 'Xem và phân loại yêu cầu tiếp nhận từ nhân dân và cấp trên'}
          {activeSubTab === 'targets' && 'Quản lý hồ sơ đối tượng, lịch sử hỗ trợ và dòng thời gian 360°'}
          {activeSubTab === 'flow' && 'Mô hình chuẩn hóa 5 bước xử lý liên hoàn'}
        </div>
      </div>

      {/* 4. SUB-VIEW A: HỘP THƯ YÊU CẦU TỪ DÂN */}
      {activeSubTab === 'requests' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-2.5 text-xs">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Tìm theo Mã (YC-xxxx), Họ tên, Số điện thoại, Nhu cầu hỗ trợ..."
                value={searchRequestQuery}
                onChange={e => setSearchRequestQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>

            <select
              value={filterRequestStatus}
              onChange={e => setFilterRequestStatus(e.target.value)}
              className="border border-slate-300 rounded-xl p-2 bg-white font-medium text-slate-700"
            >
              <option value="ALL">Mọi trạng thái</option>
              <option value="CHO_TIEP_NHAN">Chờ tiếp nhận (Mới)</option>
              <option value="DA_TIEP_NHAN">Đã tiếp nhận</option>
              <option value="DANG_XU_LY">Đang xử lý (Đã giao việc)</option>
              <option value="CHO_BO_SUNG">Chờ bổ sung thông tin</option>
              <option value="HOAN_THANH">Đã hoàn thành</option>
              <option value="TU_CHOI">Đã từ chối</option>
            </select>

            <select
              value={filterRequestGroup}
              onChange={e => setFilterRequestGroup(e.target.value)}
              className="border border-slate-300 rounded-xl p-2 bg-white font-medium text-slate-700"
            >
              <option value="ALL">Tất cả 5 nhóm đối tượng</option>
              <option value="NGUOI_DAN">1. Người dân</option>
              <option value="HO_KINH_DOANH">2. Hộ kinh doanh</option>
              <option value="TIEU_THUONG">3. Tiểu thương</option>
              <option value="DOANH_NGHIEP">4. Doanh nghiệp</option>
              <option value="CAN_BO_CO_SO">5. Cán bộ cơ sở</option>
            </select>
          </div>

          {/* Request Cards Grid */}
          <div className="space-y-3">
            {filteredRequests
              .slice((requestCurrentPage - 1) * requestPageSize, requestCurrentPage * requestPageSize)
              .map(req => {
                // Check if target already has profile
                const matchedTarget = targets.find(t => t.phone === req.phone);

                return (
                  <div
                    key={req.id}
                    className="bg-white rounded-2xl border border-slate-200 hover:border-blue-300 p-4 transition-all shadow-xs space-y-3"
                  >
                    {/* Top Row: Code, Group, Status, Time */}
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono font-bold text-xs text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                          {req.code}
                        </span>
                        <TargetGroupBadge group={req.targetGroup} compact />
                        {req.status === 'CHO_TIEP_NHAN' && (
                          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200 animate-pulse">
                            Mới gửi (Chờ tiếp nhận)
                          </span>
                        )}
                        {req.status === 'DA_TIEP_NHAN' && (
                          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                            Đã tiếp nhận
                          </span>
                        )}
                        {req.status === 'DANG_XU_LY' && (
                          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
                            Đang xử lý (Đã giao việc)
                          </span>
                        )}
                        {req.status === 'HOAN_THANH' && (
                          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            Đã hoàn thành
                          </span>
                        )}
                        {req.status === 'CHO_BO_SUNG' && (
                          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-yellow-100 text-yellow-800 border border-yellow-200">
                            Chờ bổ sung thông tin
                          </span>
                        )}
                      </div>

                      <div className="text-[11px] text-slate-400 font-medium">
                        Gửi lúc: {new Date(req.createdAt).toLocaleDateString('vi-VN')}
                      </div>
                    </div>

                    {/* Middle Row: Content & Citizen Info */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-3 text-xs">
                      {/* Left: Citizen info */}
                      <div className="md:col-span-4 p-3 bg-slate-50 rounded-xl space-y-1.5 border border-slate-100">
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-slate-900 text-sm">{req.fullName}</h4>
                          {matchedTarget ? (
                            <button
                              onClick={() => handleJumpToTargetFromRequest(req.phone)}
                              className="text-[10px] font-bold text-blue-700 bg-white px-2 py-0.5 rounded border border-blue-200 hover:bg-blue-50 transition-colors flex items-center gap-1"
                              title="Nhấn để xem Hồ Sơ Số của người này"
                            >
                              <User className="w-3 h-3 text-blue-600" />
                              <span>{matchedTarget.code}</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => handleJumpToTargetFromRequest(req.phone, req.fullName, req.targetGroup)}
                              className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 hover:bg-emerald-100 transition-colors flex items-center gap-1"
                              title="Tạo nhanh hồ sơ lưu vết cho người này"
                            >
                              <Plus className="w-3 h-3" />
                              <span>Tạo hồ sơ</span>
                            </button>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 text-slate-600">
                          <Phone className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          <span className="font-semibold">{req.phone}</span>
                        </div>

                        <div className="flex items-start gap-1.5 text-slate-500">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                          <span className="line-clamp-2">{req.address}, {req.neighborhood}</span>
                        </div>
                      </div>

                      {/* Right: Request Details */}
                      <div className="md:col-span-8 flex flex-col justify-between space-y-2">
                        <div>
                          <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5 text-blue-900">
                            <span>Nhu cầu:</span>
                            <span className="text-blue-700">{req.needCategory}</span>
                          </div>
                          <p className="text-slate-600 mt-1 line-clamp-3 bg-slate-50/50 p-2 rounded-lg border border-slate-100 italic">
                            "{req.content}"
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                          <div className="flex items-center gap-2">
                            <span>Cán bộ phụ trách:</span>
                            <strong className="text-slate-800">
                              {req.assignedMemberName || 'Chưa phân công'}
                            </strong>
                          </div>

                          {req.preferredTime && (
                            <div>
                              <span>Thời gian hẹn: </span>
                              <strong className="text-slate-700">{req.preferredTime}</strong>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Bottom Actions Bar */}
                    <div className="pt-2 flex flex-wrap items-center justify-between gap-2 text-xs">
                      {/* Quick Assign / Status Dropdowns */}
                      <div className="flex flex-wrap items-center gap-2">
                        <select
                          value={req.assignedMemberId || ''}
                          onChange={e => handleQuickAssign(req, e.target.value)}
                          className="p-1.5 border border-slate-300 rounded-lg bg-white text-slate-700 text-xs"
                        >
                          <option value="">-- Phân công cán bộ --</option>
                          {members.map(m => (
                            <option key={m.id} value={m.id}>
                              {m.name} ({m.role === 'LEADER' ? 'Tổ trưởng' : 'Thành viên'})
                            </option>
                          ))}
                        </select>

                        <select
                          value={req.status}
                          onChange={e => handleUpdateStatus(req, e.target.value as RequestStatus)}
                          className="p-1.5 border border-slate-300 rounded-lg bg-white text-slate-700 text-xs font-semibold"
                        >
                          <option value="CHO_TIEP_NHAN">Chờ tiếp nhận</option>
                          <option value="DA_TIEP_NHAN">Đã tiếp nhận</option>
                          <option value="DANG_XU_LY">Đang xử lý</option>
                          <option value="CHO_BO_SUNG">Chờ bổ sung</option>
                          <option value="HOAN_THANH">Hoàn thành</option>
                          <option value="TU_CHOI">Từ chối</option>
                        </select>
                      </div>

                      {/* Main Action: Create Task or Jump to Task */}
                      <div className="flex items-center gap-2">
                        {req.convertedTaskId ? (
                          <button
                            onClick={() => {
                              const t = allTasks.find(item => item.id === req.convertedTaskId);
                              if (t && onSelectTask) onSelectTask(t);
                            }}
                            className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors border border-emerald-200"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Đã giao việc: {req.convertedTaskCode || 'Xem việc'}</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => onOpenCreateTaskFromRequest(req.id)}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 shadow-xs transition-all active:scale-95"
                          >
                            <FileCheck className="w-3.5 h-3.5" />
                            <span>Giao việc 6 bước từ yêu cầu này</span>
                          </button>
                        )}

                        <button
                          onClick={() => setSelectedReq(req)}
                          className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition-colors"
                        >
                          Chi tiết & Phản hồi
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}

            {filteredRequests.length === 0 && (
              <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-400 space-y-2">
                <Inbox className="w-10 h-10 mx-auto text-slate-300" />
                <p className="text-sm font-semibold text-slate-600">Không có yêu cầu nào phù hợp với bộ lọc</p>
                <p className="text-xs">Bạn có thể đổi từ khóa tìm kiếm hoặc bấm nút "Mở Cổng Dịch Vụ Dân" để gửi yêu cầu mới.</p>
              </div>
            )}
          </div>

          {filteredRequests.length > 0 && (
            <Pagination
              currentPage={requestCurrentPage}
              totalItems={filteredRequests.length}
              pageSize={requestPageSize}
              onPageChange={setRequestCurrentPage}
              itemName="yêu cầu"
            />
          )}
        </div>
      )}

      {/* 5. SUB-VIEW B: HỒ SƠ 5 NHÓM ĐỐI TƯỢNG */}
      {activeSubTab === 'targets' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Left Column (5 cols): Danh bạ & Bộ lọc đối tượng */}
          <div className="lg:col-span-5 space-y-3">
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs space-y-2.5 text-xs">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Tìm theo tên, SĐT, mã HS, địa chỉ..."
                  value={searchTargetQuery}
                  onChange={e => setSearchTargetQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <select
                value={filterTargetGroup}
                onChange={e => setFilterTargetGroup(e.target.value)}
                className="w-full border border-slate-300 rounded-xl p-2 bg-white font-medium text-slate-700"
              >
                <option value="ALL">Tất cả 5 nhóm đối tượng ({targets.length})</option>
                <option value="NGUOI_DAN">1. Người dân</option>
                <option value="HO_KINH_DOANH">2. Hộ kinh doanh</option>
                <option value="TIEU_THUONG">3. Tiểu thương</option>
                <option value="DOANH_NGHIEP">4. Doanh nghiệp</option>
                <option value="CAN_BO_CO_SO">5. Cán bộ cơ sở</option>
              </select>
            </div>

            {/* Target List */}
            <div className="space-y-2 max-h-[68vh] overflow-y-auto pr-1">
              {filteredTargets
                .slice((targetCurrentPage - 1) * targetPageSize, targetCurrentPage * targetPageSize)
                .map(tar => {
                  const isSelected = selectedTarget?.id === tar.id;
                  const activeCount = allTasks.filter(
                    t => t.targetId === tar.id && t.status !== 'HOAN_THANH' && t.status !== 'DONG'
                  ).length;
                  const completedCount = allTasks.filter(
                    t => t.targetId === tar.id && (t.status === 'HOAN_THANH' || t.status === 'DONG')
                  ).length;
                  const tarRequestsCount = requests.filter(r => r.phone === tar.phone).length;

                  return (
                    <div
                      key={tar.id}
                      onClick={() => setSelectedTarget(tar)}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer text-xs space-y-1.5 ${
                        isSelected
                          ? 'bg-blue-50/70 border-blue-600 ring-2 ring-blue-100 shadow-xs'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-blue-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                          {tar.code}
                        </span>
                        <TargetGroupBadge group={tar.group} compact />
                      </div>

                      <h3 className="font-bold text-slate-900 text-sm leading-snug">{tar.name}</h3>

                      <div className="flex items-center gap-2 text-slate-500 text-[11px]">
                        <Phone className="w-3 h-3 text-blue-600" />
                        <span className="font-semibold">{tar.phone}</span>
                        <span>·</span>
                        <span className="truncate">{tar.address}</span>
                      </div>

                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-600">
                        <span>
                          Yêu cầu: <strong className="text-slate-800">{tarRequestsCount}</strong> | Đang làm:{' '}
                          <strong className="text-blue-700">{activeCount}</strong> | Xong:{' '}
                          <strong className="text-emerald-700">{completedCount}</strong>
                        </span>
                        {tar.needsFollowUp && (
                          <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                            Cần đôn đốc
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}

              {filteredTargets.length === 0 && (
                <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-slate-400 text-xs">
                  Không tìm thấy hồ sơ đối tượng nào phù hợp.
                </div>
              )}
            </div>

            {filteredTargets.length > 0 && (
              <Pagination
                currentPage={targetCurrentPage}
                totalItems={filteredTargets.length}
                pageSize={targetPageSize}
                onPageChange={setTargetCurrentPage}
                itemName="đối tượng"
              />
            )}
          </div>

          {/* Right Column (7 cols): Hồ sơ số 360° & Lịch sử hỗ trợ của đối tượng */}
          <div className="lg:col-span-7 space-y-4">
            {selectedTarget ? (
              <div className="space-y-4">
                {/* Profile Card Summary */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
                  <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded text-xs">
                          {selectedTarget.code}
                        </span>
                        <TargetGroupBadge group={selectedTarget.group} />
                      </div>
                      <h3 className="text-lg font-bold text-slate-900">{selectedTarget.name}</h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {selectedTarget.representativeName ? `Đại diện: ${selectedTarget.representativeName} · ` : ''}
                        {selectedTarget.address}, {selectedTarget.neighborhood}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onOpenCreateTaskForTarget(selectedTarget.id)}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1 shadow-xs transition-transform active:scale-95"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Tạo việc mới cho đối tượng</span>
                      </button>
                    </div>
                  </div>

                  {/* Contact & Status Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-slate-400 text-[10px] block">Số điện thoại</span>
                      <strong className="text-slate-800 text-xs font-mono">{selectedTarget.phone}</strong>
                    </div>

                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-slate-400 text-[10px] block">Sẵn sàng số</span>
                      <strong className="text-blue-700 text-xs">
                        {selectedTarget.digitalReadinessLevel === 'TOT' && '🟢 Tốt (Tự chủ số)'}
                        {selectedTarget.digitalReadinessLevel === 'KHA' && '🔵 Khá (Đã biết dùng cơ bản)'}
                        {selectedTarget.digitalReadinessLevel === 'CO_BAN' && '🟠 Cơ bản (Cần hướng dẫn)'}
                        {selectedTarget.digitalReadinessLevel === 'CHUA_CO_GI' && '🔴 Chưa có kỹ năng'}
                      </strong>
                    </div>

                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-slate-400 text-[10px] block">Tổng số yêu cầu gửi</span>
                      <strong className="text-slate-800 text-xs tabular-nums">{targetRequests.length} yêu cầu</strong>
                    </div>

                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-slate-400 text-[10px] block">Công việc đã hoàn thành</span>
                      <strong className="text-emerald-700 text-xs tabular-nums">
                        {targetTasks.filter(t => t.status === 'HOAN_THANH' || t.status === 'DONG').length} / {targetTasks.length} việc
                      </strong>
                    </div>
                  </div>

                  {selectedTarget.notes && (
                    <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-xs text-amber-900">
                      <span className="font-bold block text-[11px] text-amber-800">Ghi chú theo dõi & đặc điểm đối tượng:</span>
                      <p className="mt-0.5">{selectedTarget.notes}</p>
                    </div>
                  )}
                </div>

                {/* Sub-Tabs Inside Profile: Yêu cầu & Công việc */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                      <Clock className="w-4 h-4 text-blue-600" />
                      <span>Lịch Sử Yêu Cầu & Việc Hỗ Trợ 6 Bước Của Đối Tượng</span>
                    </h4>
                    <span className="text-xs text-slate-400 font-medium">
                      {targetRequests.length} yêu cầu · {targetTasks.length} công việc
                    </span>
                  </div>

                  {/* Section 1: Requests by this citizen */}
                  <div className="space-y-2">
                    <h5 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <Inbox className="w-3.5 h-3.5 text-blue-600" />
                      <span>Yêu cầu đối tượng đã gửi ({targetRequests.length})</span>
                    </h5>

                    {targetRequests.length > 0 ? (
                      <div className="divide-y divide-slate-100 border border-slate-100 rounded-xl">
                        {targetRequests.map(req => (
                          <div key={req.id} className="p-3 hover:bg-slate-50 transition-colors flex items-center justify-between gap-3 text-xs">
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-blue-700">{req.code}</span>
                                <span className="font-semibold text-slate-800">{req.needCategory}</span>
                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
                                  {req.status === 'CHO_TIEP_NHAN' ? 'Chờ tiếp nhận' : req.status === 'DANG_XU_LY' ? 'Đang xử lý' : req.status}
                                </span>
                              </div>
                              <p className="text-slate-500 text-[11px] line-clamp-1">{req.content}</p>
                            </div>

                            <button
                              onClick={() => {
                                setSelectedReq(req);
                                setActiveSubTab('requests');
                              }}
                              className="text-blue-600 hover:underline font-semibold text-[11px] shrink-0"
                            >
                              Xem &rarr;
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 bg-slate-50 rounded-xl text-center text-slate-400 text-xs">
                        Đối tượng này chưa có yêu cầu gửi qua Cổng Dân.
                      </div>
                    )}
                  </div>

                  {/* Section 2: Tasks supporting this citizen */}
                  <div className="space-y-2 pt-3 border-t border-slate-100">
                    <h5 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <FileCheck className="w-3.5 h-3.5 text-blue-600" />
                      <span>Công việc hỗ trợ theo 6 bước ({targetTasks.length})</span>
                    </h5>

                    {targetTasks.length > 0 ? (
                      <div className="space-y-2">
                        {targetTasks.map(t => (
                          <div
                            key={t.id}
                            onClick={() => onSelectTask && onSelectTask(t)}
                            className="p-3 rounded-xl border border-slate-100 hover:border-blue-300 hover:bg-blue-50/30 transition-all cursor-pointer text-xs space-y-1"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-blue-700">{t.code}</span>
                                <TaskStatusBadge status={t.status} />
                                <PriorityBadge priority={t.priority} />
                              </div>
                              <span className="text-[11px] text-blue-700 font-bold">Bước {t.currentStep}/6</span>
                            </div>

                            <div className="font-bold text-slate-900">{t.title}</div>

                            <div className="text-[11px] text-slate-500 flex items-center justify-between pt-1">
                              <span>Phụ trách: <strong>{t.primaryAssigneeName}</strong></span>
                              <span>Hạn chót: <strong>{t.dueDate}</strong></span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 bg-slate-50 rounded-xl text-center text-slate-400 text-xs">
                        Chưa có công việc nào được gán cho đối tượng này. Bấm nút "Tạo việc mới cho đối tượng" ở trên để bắt đầu!
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-400">
                Chọn một hồ sơ đối tượng từ danh sách bên trái để xem thông tin chi tiết và lịch sử.
              </div>
            )}
          </div>
        </div>
      )}

      {/* 6. SUB-VIEW C: SƠ ĐỒ LUỒNG XỬ LÝ KHÉP KÍN (VISUAL PIPELINE) */}
      {activeSubTab === 'flow' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-5 h-5 text-blue-600" />
              <span>Mô Hình Luồng Xử Lý Chuẩn Hóa Của Tổ Công Nghệ Số Cộng Đồng</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Hệ thống kết nối trực tiếp từ lúc người dân gửi yêu cầu đến quản lý hồ sơ số và hoàn thành 6 bước hỗ trợ
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            {/* Step 1 */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
              <div className="w-8 h-8 rounded-lg bg-blue-600 text-white font-black flex items-center justify-center text-sm">
                1
              </div>
              <h4 className="font-bold text-slate-900 text-xs">Dân Gửi Yêu Cầu</h4>
              <p className="text-[11px] text-slate-600">
                Người dân hoặc doanh nghiệp gửi nhu cầu qua Cổng Dịch Vụ Dân hoặc gọi hotline cơ sở.
              </p>
              <button
                onClick={onOpenCitizenPortal}
                className="text-[11px] text-blue-600 font-bold hover:underline flex items-center gap-1"
              >
                <span>Mở Cổng Dân</span> &rarr;
              </button>
            </div>

            {/* Step 2 */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
              <div className="w-8 h-8 rounded-lg bg-amber-500 text-white font-black flex items-center justify-center text-sm">
                2
              </div>
              <h4 className="font-bold text-slate-900 text-xs">Tiếp Nhận & Lọc</h4>
              <p className="text-[11px] text-slate-600">
                Tổ trưởng kiểm tra hộp thư, xác minh nội dung và phân loại vào đúng 1 trong 5 nhóm đối tượng.
              </p>
              <button
                onClick={() => setActiveSubTab('requests')}
                className="text-[11px] text-amber-700 font-bold hover:underline flex items-center gap-1"
              >
                <span>Hộp thư yêu cầu</span> &rarr;
              </button>
            </div>

            {/* Step 3 */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
              <div className="w-8 h-8 rounded-lg bg-purple-600 text-white font-black flex items-center justify-center text-sm">
                3
              </div>
              <h4 className="font-bold text-slate-900 text-xs">Gắn Hồ Sơ Số 360°</h4>
              <p className="text-[11px] text-slate-600">
                Tự động đồng bộ vào Hồ Sơ Đối Tượng để lưu vết toàn bộ lịch sử các lần hỗ trợ xuyên suốt.
              </p>
              <button
                onClick={() => setActiveSubTab('targets')}
                className="text-[11px] text-purple-700 font-bold hover:underline flex items-center gap-1"
              >
                <span>Danh bạ hồ sơ</span> &rarr;
              </button>
            </div>

            {/* Step 4 */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white font-black flex items-center justify-center text-sm">
                4
              </div>
              <h4 className="font-bold text-slate-900 text-xs">Giao Việc 6 Bước</h4>
              <p className="text-[11px] text-slate-600">
                Chuyển thành công việc cụ thể cho thành viên Tổ: Chuẩn bị ➔ Tiếp cận ➔ Hướng dẫn ➔ Bằng chứng ➔ Đánh giá.
              </p>
              <div className="text-[11px] text-indigo-700 font-bold">Quy chuẩn 6 bước</div>
            </div>

            {/* Step 5 */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white font-black flex items-center justify-center text-sm">
                5
              </div>
              <h4 className="font-bold text-slate-900 text-xs">Đóng & Lưu Vết</h4>
              <p className="text-[11px] text-slate-600">
                Ghi nhận kết quả thực tế, cập nhật mức độ tự chủ số của đối tượng và phục vụ báo cáo định kỳ.
              </p>
              <div className="text-[11px] text-emerald-700 font-bold">Báo cáo & Giám sát</div>
            </div>
          </div>
        </div>
      )}

      {/* 7. MODAL: XEM CHI TIẾT & PHẢN HỒI YÊU CẦU */}
      {selectedReq && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-5 sm:p-6 space-y-4 shadow-xl border border-slate-200 max-h-[90vh] overflow-y-auto text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded text-xs">
                  {selectedReq.code}
                </span>
                <TargetGroupBadge group={selectedReq.targetGroup} />
              </div>
              <button
                onClick={() => setSelectedReq(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">{selectedReq.fullName}</h3>
                <div className="flex items-center gap-3 text-slate-500 mt-1">
                  <span>SĐT: <strong className="text-slate-700">{selectedReq.phone}</strong></span>
                  <span>·</span>
                  <span>{selectedReq.address}, {selectedReq.neighborhood}</span>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                <span className="font-bold text-slate-700">Nội dung yêu cầu ({selectedReq.needCategory}):</span>
                <p className="text-slate-600 italic">"{selectedReq.content}"</p>
                {selectedReq.preferredTime && (
                  <div className="text-[11px] text-slate-500 pt-1">
                    Thời gian hẹn: <strong className="text-slate-700">{selectedReq.preferredTime}</strong>
                  </div>
                )}
              </div>

              {/* Status and Assignee Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Trạng thái xử lý:</label>
                  <select
                    value={selectedReq.status}
                    onChange={e => handleUpdateStatus(selectedReq, e.target.value as RequestStatus)}
                    className="w-full p-2 border border-slate-300 rounded-xl bg-white text-xs font-semibold"
                  >
                    <option value="CHO_TIEP_NHAN">Mới gửi (Chờ tiếp nhận)</option>
                    <option value="DA_TIEP_NHAN">Đã tiếp nhận</option>
                    <option value="DANG_XU_LY">Đang xử lý</option>
                    <option value="CHO_BO_SUNG">Chờ bổ sung thông tin</option>
                    <option value="HOAN_THANH">Đã hoàn thành</option>
                    <option value="TU_CHOI">Từ chối hỗ trợ</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Cán bộ phụ trách:</label>
                  <select
                    value={selectedReq.assignedMemberId || ''}
                    onChange={e => handleQuickAssign(selectedReq, e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-xl bg-white text-xs"
                  >
                    <option value="">-- Chọn cán bộ --</option>
                    {members.map(m => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.title})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Response Note textarea */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">Ghi chú phản hồi cho người dân / nội bộ:</label>
                <textarea
                  rows={3}
                  defaultValue={selectedReq.responseNotes || ''}
                  onBlur={e => handleUpdateStatus(selectedReq, selectedReq.status, e.target.value)}
                  placeholder="Nhập ghi chú hướng dẫn, kết quả liên hệ hoặc lý do từ chối..."
                  className="w-full p-2.5 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                ></textarea>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
              <button
                onClick={() => {
                  handleJumpToTargetFromRequest(selectedReq.phone, selectedReq.fullName, selectedReq.targetGroup);
                  setSelectedReq(null);
                }}
                className="text-blue-600 hover:underline font-bold text-xs flex items-center gap-1"
              >
                <User className="w-3.5 h-3.5" />
                <span>Xem/Mở Hồ Sơ Số của người này</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedReq(null)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl"
                >
                  Đóng
                </button>
                {!selectedReq.convertedTaskId && (
                  <button
                    onClick={() => {
                      const id = selectedReq.id;
                      setSelectedReq(null);
                      onOpenCreateTaskFromRequest(id);
                    }}
                    className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs"
                  >
                    Giao việc 6 bước ngay
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 8. MODAL: TẠO HỒ SƠ ĐỐI TƯỢNG MỚI */}
      {showCreateTargetModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 sm:p-6 space-y-4 shadow-xl border border-slate-200 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-blue-600" />
                <span>Thêm Hồ Sơ Đối Tượng Mới</span>
              </h3>
              <button
                onClick={() => setShowCreateTargetModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTarget} className="space-y-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Tên đối tượng / Tổ chức / Hộ KD <span className="text-red-500">*</span>:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Bác Nguyễn Văn A hoặc Hộ KD Tạp Hóa..."
                  value={newTargetName}
                  onChange={e => setNewTargetName(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Nhóm đối tượng <span className="text-red-500">*</span>:
                  </label>
                  <select
                    value={newTargetGroup}
                    onChange={e => setNewTargetGroup(e.target.value as TargetGroup)}
                    className="w-full p-2 border border-slate-300 rounded-xl bg-white font-medium"
                  >
                    <option value="NGUOI_DAN">1. Người dân</option>
                    <option value="HO_KINH_DOANH">2. Hộ kinh doanh</option>
                    <option value="TIEU_THUONG">3. Tiểu thương</option>
                    <option value="DOANH_NGHIEP">4. Doanh nghiệp</option>
                    <option value="CAN_BO_CO_SO">5. Cán bộ cơ sở</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Số điện thoại liên hệ <span className="text-red-500">*</span>:
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="09xx..."
                    value={newTargetPhone}
                    onChange={e => setNewTargetPhone(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Địa chỉ chi tiết:</label>
                <input
                  type="text"
                  placeholder="Số nhà, đường, khóm/ấp..."
                  value={newTargetAddress}
                  onChange={e => setNewTargetAddress(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Ghi chú & Đặc điểm chuyển đổi số:</label>
                <textarea
                  rows={2}
                  placeholder="Nhu cầu thường gặp, đặc điểm thiết bị, tình trạng đôn đốc..."
                  value={newTargetNotes}
                  onChange={e => setNewTargetNotes(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                ></textarea>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateTargetModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs"
                >
                  Lưu hồ sơ đối tượng
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
