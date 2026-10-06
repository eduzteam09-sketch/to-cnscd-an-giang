import React, { useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Building,
  CheckCircle2,
  Clock,
  Compass,
  FileCheck,
  Package,
  Phone,
  PhoneCall,
  Plus,
  QrCode,
  Shield,
  Smartphone,
  Sparkles,
  Store,
  TrendingUp,
  User,
  Users
} from 'lucide-react';
import { TARGET_GROUP_CONFIG } from '../../mock/initialData';
import { appStorage } from '../../services/storage';
import { TargetGroup, Task } from '../../types';
import { PriorityBadge, TaskStatusBadge } from '../common/StatusBadge';
import { Pagination } from '../common/Pagination';

interface DashboardViewProps {
  onSelectTab: (tab: string, filter?: string) => void;
  onOpenCreateTask: () => void;
  onSelectTask: (task: Task) => void;
  onSelectTargetGroup?: (group: TargetGroup) => void;
  onSelectMembers?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onSelectTab,
  onOpenCreateTask,
  onSelectTask,
  onSelectTargetGroup,
  onSelectMembers
}) => {
  const selectedWard = appStorage.getSelectedWard();
  const tasks = appStorage.getTasks();
  const requests = appStorage.getRequests();
  const targets = appStorage.getTargets();
  const members = appStorage.getMembers();

  const todayStr = new Date().toISOString().split('T')[0];

  // Stats
  const totalTasks = tasks.length;
  const inProgressTasks = tasks.filter(t => t.status === 'DANG_THUC_HIEN' || t.status === 'DA_NHAN').length;
  const urgingTasks = tasks.filter(t => t.status === 'DANG_DON_DOC').length;
  const overdueTasks = tasks.filter(t => t.status === 'QUA_HAN');
  const completedTasks = tasks.filter(t => t.status === 'HOAN_THANH' || t.status === 'DONG').length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const pendingRequests = requests.filter(r => r.status === 'CHO_TIEP_NHAN');

  // Tasks requiring attention today
  const tasksToday = tasks.filter(t => {
    return (t.dueDate === todayStr || t.status === 'QUA_HAN' || t.status === 'DANG_DON_DOC' || t.priority === 'KHAN') &&
      t.status !== 'HOAN_THANH' && t.status !== 'DONG';
  });

  // Target counts
  const targetCounts: Record<TargetGroup, number> = {
    NGUOI_DAN: targets.filter(t => t.group === 'NGUOI_DAN').length,
    HO_KINH_DOANH: targets.filter(t => t.group === 'HO_KINH_DOANH').length,
    TIEU_THUONG: targets.filter(t => t.group === 'TIEU_THUONG').length,
    DOANH_NGHIEP: targets.filter(t => t.group === 'DOANH_NGHIEP').length,
    CAN_BO_CO_SO: targets.filter(t => t.group === 'CAN_BO_CO_SO').length
  };

  const handleTargetGroupClick = (group: TargetGroup) => {
    if (onSelectTargetGroup) {
      onSelectTargetGroup(group);
    } else {
      onSelectTab('directory', `GROUP_${group}`);
    }
  };

  const handleMembersClick = () => {
    if (onSelectMembers) {
      onSelectMembers();
    } else {
      onSelectTab('directory', 'MEMBERS');
    }
  };

  return (
    <div className="space-y-5">
      {/* Hero Banner - Matching Phiếu Đăng Ký Yêu Cầu Chuyển Đổi Số Blue Gradient (Bỏ 2 nút theo yêu cầu) */}
      <div className="bg-gradient-to-br from-blue-700 via-indigo-700 to-blue-900 text-white p-6 sm:p-8 rounded-3xl shadow-sm space-y-3">
        <div className="inline-flex items-center gap-2 bg-white/15 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-xs">
          <Sparkles className="w-4 h-4 text-amber-300" />
          <span>Tổ CNSCĐ {selectedWard.name} · Tỉnh An Giang</span>
        </div>

        <div className="space-y-1">
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
            Trung Tâm Điều Hành & Giám Sát Chuyển Đổi Số
          </h2>
          <p className="text-sm text-blue-100 font-normal leading-relaxed">
            Theo dõi tiến độ hỗ trợ người dân, phân công nhiệm vụ 6 bước, quản lý 5 nhóm đối tượng và tiếp nhận yêu cầu trực tuyến.
          </p>
        </div>
      </div>

      {/* Overdue alert banner if any */}
      {overdueTasks.length > 0 && (
        <div className="bg-red-50 border border-red-200 p-3.5 rounded-2xl flex items-center justify-between gap-3 text-xs shadow-2xs">
          <div className="flex items-center gap-2.5 text-red-900 font-bold">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
            <span>Có <strong>{overdueTasks.length}</strong> công việc quá hạn cần đôn đốc và xử lý gấp</span>
          </div>
          <button
            onClick={() => onSelectTab('tasks', 'URGENT')}
            className="text-red-700 hover:text-red-900 font-bold hover:underline shrink-0"
          >
            Xem danh sách quá hạn →
          </button>
        </div>
      )}

      {/* Primary KPI Strip - Styled with Blue theme accents */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Total Tasks */}
        <div
          onClick={() => onSelectTab('tasks', 'ALL')}
          className="bg-white p-4 rounded-2xl border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span className="group-hover:text-blue-700">Tổng công việc</span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <BarChart3 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 group-hover:text-blue-700 mt-2">{totalTasks}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Toàn địa bàn</div>
        </div>

        {/* In Progress */}
        <div
          onClick={() => onSelectTab('tasks', 'ALL')}
          className="bg-white p-4 rounded-2xl border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span className="group-hover:text-blue-700">Đang thực hiện</span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-blue-700 mt-2">{inProgressTasks}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Tiến trình 6 bước</div>
        </div>

        {/* Urging */}
        <div
          onClick={() => onSelectTab('tasks', 'URGENT')}
          className="bg-white p-4 rounded-2xl border border-amber-200 hover:border-amber-400 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-amber-900 text-xs font-semibold">
            <span className="group-hover:text-amber-800">Đang đôn đốc</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <PhoneCall className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-700 mt-2">{urgingTasks}</div>
          <div className="text-[11px] text-amber-700 mt-0.5">Cần nhắc việc</div>
        </div>

        {/* Overdue */}
        <div
          onClick={() => onSelectTab('tasks', 'URGENT')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer group ${
            overdueTasks.length > 0
              ? 'bg-red-50/60 border-red-300 hover:border-red-400 hover:shadow-md'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className={overdueTasks.length > 0 ? 'text-red-800 font-bold' : 'text-slate-500'}>Quá hạn</span>
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold ${
              overdueTasks.length > 0 ? 'bg-red-600 text-white' : 'bg-slate-100 text-slate-500'
            }`}>
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className={`text-2xl font-black mt-2 ${overdueTasks.length > 0 ? 'text-red-600' : 'text-slate-900'}`}>
            {overdueTasks.length}
          </div>
          <div className={`text-[11px] mt-0.5 ${overdueTasks.length > 0 ? 'text-red-700 font-bold' : 'text-slate-500'}`}>
            {overdueTasks.length > 0 ? 'Xử lý ngay →' : 'Đúng tiến độ'}
          </div>
        </div>

        {/* Done */}
        <div
          onClick={() => onSelectTab('tasks', 'COMPLETED')}
          className="bg-white p-4 rounded-2xl border border-slate-200 hover:border-emerald-400 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span className="group-hover:text-emerald-700">Đã hoàn thành</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-700 mt-2">
            {completedTasks}
          </div>
          <div className="text-[11px] text-emerald-700 font-medium mt-0.5">Tỷ lệ {completionRate}%</div>
        </div>

        {/* Citizen Requests */}
        <div
          onClick={() => onSelectTab('requests')}
          className="bg-white p-4 rounded-2xl border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span className="group-hover:text-blue-700">Yêu cầu từ dân</span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-blue-700 mt-2">
            {pendingRequests.length} <span className="text-xs font-semibold text-slate-500">mới</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Tổng {requests.length} yêu cầu</div>
        </div>
      </div>

      {/* Main Grid: Urgent Tasks (Left) & 5 Groups & Team (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Urgent / Attention Tasks (8 cols) - Làm nổi bật riêng biệt theo yêu cầu */}
        <div className="lg:col-span-8 bg-white rounded-3xl border-2 border-blue-200/90 shadow-md overflow-hidden">
          {/* Header Nổi Bật - Phân biệt rõ ràng với danh sách */}
          <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-blue-950 text-white p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-inner">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-500/30 border border-blue-400/40 flex items-center justify-center text-white shrink-0 shadow-xs">
                <Clock className="w-5 h-5 text-amber-300" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base sm:text-lg font-black text-white tracking-tight uppercase">
                    Việc Cần Ưu Tiên Xử Lý Hôm Nay
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-400 text-blue-950 shadow-xs">
                    {tasksToday.length}
                  </span>
                </div>
                <p className="text-xs text-blue-200 mt-0.5 font-normal">
                  Các nhiệm vụ đến hạn, đang đôn đốc dở dang hoặc quá hạn xử lý
                </p>
              </div>
            </div>

            {/* Nút Giao việc mới: Ẩn trên mobile vì đã có nút cố định ở góc dưới bên phải */}
            <button
              onClick={onOpenCreateTask}
              className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 bg-white text-blue-950 hover:bg-blue-50 font-bold rounded-xl text-xs sm:text-sm shadow-md transition-all active:scale-95 shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Giao việc mới</span>
            </button>
          </div>

          {/* Danh Sách - Tối đa 10 việc & nút 'Chi tiết' */}
          <div className="p-4 sm:p-5 space-y-2.5 bg-slate-50/50">
            {tasksToday.slice(0, 10).map(task => (
              <div
                key={task.id}
                onClick={() => onSelectTask(task)}
                className="p-3.5 bg-white hover:bg-blue-50/70 border border-slate-200 hover:border-blue-400 rounded-2xl cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs transition-all shadow-2xs group"
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                      {task.code}
                    </span>
                    <TaskStatusBadge status={task.status} />
                    <PriorityBadge priority={task.priority} size="sm" />
                    {task.targetName && (
                      <span className="text-slate-600 font-medium truncate">· {task.targetName}</span>
                    )}
                  </div>
                  <div className="font-bold text-slate-900 group-hover:text-blue-700 text-sm truncate">
                    {task.title}
                  </div>
                  <div className="text-[11px] text-slate-500 flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span>Phụ trách: <strong className="text-slate-700">{task.primaryAssigneeName}</strong></span>
                    <span>·</span>
                    <span className={task.status === 'QUA_HAN' ? 'text-red-600 font-bold' : ''}>Hạn: {task.dueDate}</span>
                    <span>·</span>
                    <span className="text-blue-700 font-semibold">Bước {task.currentStep || 1}/6</span>
                  </div>
                </div>

                <div className="self-end sm:self-center shrink-0">
                  {/* Đổi từ 'Chi tiết & Sửa' thành 'Chi tiết' theo yêu cầu */}
                  <span className="px-3.5 py-1.5 bg-blue-50 group-hover:bg-blue-600 text-blue-700 group-hover:text-white font-bold rounded-xl transition-colors inline-block text-xs border border-blue-200 group-hover:border-blue-600">
                    Chi tiết →
                  </span>
                </div>
              </div>
            ))}

            {tasksToday.length === 0 && (
              <div className="py-12 text-center text-slate-400 text-xs space-y-1 bg-white rounded-2xl border border-slate-200 p-6">
                <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500" />
                <div className="font-bold text-slate-700 text-sm">Không có nhiệm vụ nào cấp bách</div>
                <div>Toàn bộ công việc trong ngày đang được thực hiện đúng tiến độ.</div>
              </div>
            )}

            {/* Nếu nhiều hơn 10 việc thì hiển thị liên kết xem thêm */}
            {tasksToday.length > 10 && (
              <div className="pt-2 text-center">
                <button
                  onClick={() => onSelectTab('tasks', 'URGENT')}
                  className="w-full py-2.5 px-4 bg-white hover:bg-blue-50 text-blue-700 font-bold rounded-xl border border-blue-200 hover:border-blue-300 text-xs transition-colors flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                >
                  <span>Xem thêm {tasksToday.length - 10} việc cần ưu tiên khác (Chuyển sang Quản lý công việc)</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right: 5 Groups & Team Members (4 cols) */}
        <div className="lg:col-span-4 space-y-5">
          {/* 5 Nhóm Đối tượng - Khi nhấn vào link tới đúng bộ lọc tương ứng */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <span className="font-bold text-slate-900 text-xs sm:text-sm flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600" />
                <span>5 Nhóm Đối Tượng Phục Vụ</span>
              </span>
              <button
                onClick={() => onSelectTab('directory', 'ALL')}
                className="text-xs text-blue-600 hover:underline font-bold cursor-pointer"
              >
                Hồ sơ →
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div
                onClick={() => handleTargetGroupClick('NGUOI_DAN')}
                className="flex items-center justify-between p-2.5 rounded-xl border border-blue-100 bg-blue-50/50 hover:bg-blue-100/70 cursor-pointer transition-colors"
                title="Lọc hồ sơ nhóm Người dân"
              >
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold">
                    <Smartphone className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-bold text-blue-950">1. Người dân</span>
                </div>
                <span className="font-black text-blue-700 bg-white px-2 py-0.5 rounded-lg border border-blue-200">
                  {targetCounts.NGUOI_DAN} hồ sơ
                </span>
              </div>

              <div
                onClick={() => handleTargetGroupClick('HO_KINH_DOANH')}
                className="flex items-center justify-between p-2.5 rounded-xl border border-emerald-100 bg-emerald-50/50 hover:bg-emerald-100/70 cursor-pointer transition-colors"
                title="Lọc hồ sơ nhóm Hộ kinh doanh"
              >
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold">
                    <Store className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-bold text-emerald-950">2. Hộ kinh doanh</span>
                </div>
                <span className="font-black text-emerald-700 bg-white px-2 py-0.5 rounded-lg border border-emerald-200">
                  {targetCounts.HO_KINH_DOANH} hồ sơ
                </span>
              </div>

              <div
                onClick={() => handleTargetGroupClick('TIEU_THUONG')}
                className="flex items-center justify-between p-2.5 rounded-xl border border-amber-100 bg-amber-50/50 hover:bg-amber-100/70 cursor-pointer transition-colors"
                title="Lọc hồ sơ nhóm Tiểu thương"
              >
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-amber-600 text-white flex items-center justify-center font-bold">
                    <QrCode className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-bold text-amber-950">3. Tiểu thương</span>
                </div>
                <span className="font-black text-amber-700 bg-white px-2 py-0.5 rounded-lg border border-amber-200">
                  {targetCounts.TIEU_THUONG} hồ sơ
                </span>
              </div>

              <div
                onClick={() => handleTargetGroupClick('DOANH_NGHIEP')}
                className="flex items-center justify-between p-2.5 rounded-xl border border-purple-100 bg-purple-50/50 hover:bg-purple-100/70 cursor-pointer transition-colors"
                title="Lọc hồ sơ nhóm Doanh nghiệp"
              >
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-purple-600 text-white flex items-center justify-center font-bold">
                    <Building className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-bold text-purple-950">4. Doanh nghiệp</span>
                </div>
                <span className="font-black text-purple-700 bg-white px-2 py-0.5 rounded-lg border border-purple-200">
                  {targetCounts.DOANH_NGHIEP} hồ sơ
                </span>
              </div>

              <div
                onClick={() => handleTargetGroupClick('CAN_BO_CO_SO')}
                className="flex items-center justify-between p-2.5 rounded-xl border border-rose-100 bg-rose-50/50 hover:bg-rose-100/70 cursor-pointer transition-colors"
                title="Lọc hồ sơ nhóm Cán bộ cơ sở"
              >
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-rose-600 text-white flex items-center justify-center font-bold">
                    <Shield className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-bold text-rose-950">5. Cán bộ cơ sở</span>
                </div>
                <span className="font-black text-rose-700 bg-white px-2 py-0.5 rounded-lg border border-rose-200">
                  {targetCounts.CAN_BO_CO_SO} hồ sơ
                </span>
              </div>
            </div>
          </div>

          {/* Thành viên trực ban & phụ trách - Làm nổi bật riêng biệt & hiển thị 2-3 thành viên quan trọng */}
          <div className="bg-white rounded-3xl border-2 border-indigo-200/90 shadow-md overflow-hidden">
            {/* Header Nổi Bật */}
            <div className="bg-gradient-to-r from-indigo-950 via-blue-900 to-indigo-900 text-white p-4 flex items-center justify-between gap-2 shadow-inner">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <div className="w-8 h-8 rounded-xl bg-indigo-500/30 border border-indigo-400/40 flex items-center justify-center text-white shrink-0">
                  <FileCheck className="w-4 h-4 text-emerald-300" />
                </div>
                <span className="font-black text-white text-xs sm:text-sm uppercase tracking-tight truncate">
                  Thành Viên Trực Ban & Phụ Trách
                </span>
              </div>
              <button
                onClick={handleMembersClick}
                className="shrink-0 whitespace-nowrap text-xs bg-white/15 hover:bg-white/25 text-white font-bold px-3 py-1.5 rounded-xl border border-white/20 transition-colors inline-flex items-center gap-1 cursor-pointer"
                title="Xem danh sách Đội ngũ cán bộ Tổ"
              >
                <span className="whitespace-nowrap">Đội ngũ →</span>
              </button>
            </div>

            {/* Danh sách chỉ hiển thị 2-3 thành viên quan trọng để không bị bể cấu trúc */}
            <div className="p-3.5 space-y-2.5 bg-slate-50/50 text-xs">
              {members
                .filter(m => m.role === 'LEADER' || m.role === 'MEMBER')
                .slice(0, 3)
                .map(mem => (
                  <div
                    key={mem.id}
                    onClick={handleMembersClick}
                    className="flex items-center justify-between gap-3 p-2.5 sm:p-3 bg-white rounded-2xl border border-slate-200/90 hover:border-indigo-300 hover:bg-indigo-50/40 cursor-pointer transition-all shadow-2xs group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-blue-100 text-blue-800 font-black text-xs flex items-center justify-center shrink-0 border border-blue-200">
                        {mem.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-slate-900 text-xs sm:text-sm truncate group-hover:text-blue-700 transition-colors">
                          {mem.name}
                        </div>
                        <div className="text-[11px] text-slate-500 truncate" title={mem.title}>
                          {mem.title}
                        </div>
                      </div>
                    </div>
                    {/* Cột hiển thị trạng thái cố định, đều nhau, không bao giờ rớt dòng */}
                    <div className="shrink-0 w-28 sm:w-32 text-right flex items-center justify-end">
                      <span className="w-full inline-block text-center font-black text-blue-700 bg-blue-50 px-2.5 py-1.5 rounded-xl border border-blue-200 text-xs whitespace-nowrap shadow-2xs">
                        {mem.activeTasksCount} đang làm
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
