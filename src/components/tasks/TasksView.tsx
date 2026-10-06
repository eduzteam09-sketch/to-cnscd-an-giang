import React, { useState } from 'react';
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
  Edit2,
  Filter,
  Flame,
  Kanban,
  List,
  Plus,
  Search,
  Trash2,
  User,
  UserCheck,
  X
} from 'lucide-react';
import { appStorage } from '../../services/storage';
import { Priority, Task, TaskStatus } from '../../types';
import { PriorityBadge, TaskStatusBadge } from '../common/StatusBadge';
import { Pagination } from '../common/Pagination';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { CreateTaskModal } from '../common/CreateTaskModal';

interface TasksViewProps {
  onSelectTask: (task: Task) => void;
  onOpenCreateTask: () => void;
  initialFilter?: 'ALL' | 'MINE' | 'URGENT' | 'COMPLETED' | 'DELEGATED';
}

export const TasksView: React.FC<TasksViewProps> = ({
  onSelectTask,
  onOpenCreateTask,
  initialFilter = 'ALL'
}) => {
  const allTasks = appStorage.getTasks();
  const currentUser = appStorage.getCurrentUser();
  const currentRole = appStorage.getCurrentRole();
  const authAccount = appStorage.getCurrentAuthAccount();
  const isLeader = currentRole === 'LEADER' || appStorage.isCurrentUserSuperAdmin();
  const members = appStorage.getMembers();

  // If member, default initial view to MINE if not specified
  const effectiveInitialFilter = initialFilter === 'ALL' && currentRole === 'MEMBER' ? 'MINE' : initialFilter;
  const [activeTab, setActiveTab] = useState<'ALL' | 'MINE' | 'DELEGATED' | 'URGENT' | 'COMPLETED'>(effectiveInitialFilter);
  const [filterPriority, setFilterPriority] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterAssignee, setFilterAssignee] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'LIST' | 'KANBAN'>('LIST');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  // Edit Task State
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Delete Task State
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);

  // Check if a task belongs to current user (Việc cá nhân của người dùng)
  const isTaskMine = (t: Task): boolean => {
    // 1. Khớp theo ID người phụ trách chính
    if (currentUser.id && t.primaryAssigneeId === currentUser.id) return true;
    if (authAccount?.id && t.primaryAssigneeId === authAccount.id) return true;

    // 2. Khớp theo họ tên chính xác (đã loại bỏ phần trong ngoặc như chức danh/tên xã)
    if (t.primaryAssigneeName) {
      const cleanTName = t.primaryAssigneeName.replace(/\(.*?\)/g, '').trim().toLowerCase();
      if (currentUser.name) {
        const cleanMName = currentUser.name.replace(/\(.*?\)/g, '').trim().toLowerCase();
        if (cleanTName && cleanMName && cleanTName === cleanMName) return true;
      }
      if (authAccount?.fullName) {
        const cleanAName = authAccount.fullName.replace(/\(.*?\)/g, '').trim().toLowerCase();
        if (cleanTName && cleanAName && cleanTName === cleanAName) return true;
      }
    }

    // 3. Nếu là Tổ trưởng và công việc ghi đích danh cho Tổ trưởng
    const isUserLeader = currentRole === 'LEADER' || currentUser.role === 'LEADER' || authAccount?.role === 'LEADER';
    const isUserMember = currentRole === 'MEMBER' || authAccount?.role === 'MEMBER';
    if (isUserLeader && !isUserMember && t.primaryAssigneeName?.includes('Tổ trưởng')) {
      return true;
    }

    return false;
  };

  // Role permissions
  const canDeleteTask = (t: Task): boolean => {
    if (isLeader) return true;
    // Members/Ward staff can ONLY delete if they created it
    return t.createdBy === currentUser.name || (authAccount && t.createdBy === authAccount.fullName) || false;
  };

  const canEditTask = (t: Task): boolean => {
    if (isLeader) return true;
    // Members can only edit if assigned to them or created by them
    return isTaskMine(t) || t.createdBy === currentUser.name;
  };

  // Consistent predicate for Urgent tasks (Khẩn, Cao, Quá hạn)
  const isTaskUrgent = (t: Task): boolean => {
    if (t.status === 'HOAN_THANH' || t.status === 'DONG') return false;
    return t.priority === 'KHAN' || t.priority === 'CAO' || t.status === 'QUA_HAN';
  };

  // Accurate counts
  const myTasksCount = allTasks.filter(t => isTaskMine(t)).length;
  const urgentCount = allTasks.filter(t => isTaskUrgent(t)).length;
  const delegatedCount = allTasks.filter(t => !isTaskMine(t)).length;
  const completedCount = allTasks.filter(t => t.status === 'HOAN_THANH' || t.status === 'DONG').length;

  const handleDeleteClick = (e: React.MouseEvent, task: Task) => {
    e.stopPropagation();
    setTaskToDelete(task);
  };

  const handleConfirmDelete = () => {
    if (!taskToDelete) return;
    appStorage.deleteTask(taskToDelete.id);
    setTaskToDelete(null);
  };

  const handleEditClick = (e: React.MouseEvent, task: Task) => {
    e.stopPropagation();
    setEditingTask(task);
  };

  // Filter tasks
  const filteredTasks = allTasks.filter(t => {
    if (activeTab === 'MINE') {
      if (!isTaskMine(t)) return false;
    } else if (activeTab === 'DELEGATED') {
      if (isTaskMine(t)) return false;
    } else if (activeTab === 'URGENT') {
      if (!isTaskUrgent(t)) return false;
    } else if (activeTab === 'COMPLETED') {
      if (t.status !== 'HOAN_THANH' && t.status !== 'DONG') return false;
    }

    if (filterAssignee !== 'ALL') {
      if (filterAssignee === 'MINE') {
        if (!isTaskMine(t)) return false;
      } else {
        const matchMem = members.find(m => m.id === filterAssignee);
        const matchId = t.primaryAssigneeId === filterAssignee || (t.collaboratorIds && t.collaboratorIds.includes(filterAssignee));
        const matchName = matchMem && t.primaryAssigneeName && (
          t.primaryAssigneeName === matchMem.name ||
          t.primaryAssigneeName.includes(matchMem.name) ||
          matchMem.name.includes(t.primaryAssigneeName)
        );
        if (!matchId && !matchName) return false;
      }
    }

    if (filterStatus !== 'ALL' && t.status !== filterStatus) return false;
    if (filterPriority !== 'ALL' && t.priority !== filterPriority) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match = t.title.toLowerCase().includes(q) ||
        t.code.toLowerCase().includes(q) ||
        (t.targetName && t.targetName.toLowerCase().includes(q)) ||
        t.primaryAssigneeName.toLowerCase().includes(q);
      if (!match) return false;
    }

    return true;
  });

  return (
    <div className="space-y-4">
      {/* Header Banner - Matching Citizen Portal Blue Theme */}
      <div className="bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-900 text-white p-5 sm:p-6 rounded-3xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-blue-200">
            HỆ THỐNG QUẢN LÝ TIẾN ĐỘ 6 BƯỚC
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight leading-tight mt-0.5">
            Quản Lý & Phân Công Nhiệm Vụ Số Hóa
          </h2>
          <div className="text-xs text-blue-100 mt-1">
            Tổng cộng <strong>{allTasks.length}</strong> công việc · {urgentCount > 0 ? <span className="text-amber-300 font-bold">{urgentCount} việc khẩn cấp / quá hạn</span> : 'Tiến độ bình thường'}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="bg-white/15 backdrop-blur-xs p-1 rounded-xl flex items-center gap-1 border border-white/20">
            <button
              onClick={() => setViewMode('LIST')}
              className={`p-1.5 px-3 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'LIST' ? 'bg-white text-blue-900 shadow-sm' : 'text-white hover:bg-white/10'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>Danh sách</span>
            </button>
            <button
              onClick={() => setViewMode('KANBAN')}
              className={`p-1.5 px-3 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'KANBAN' ? 'bg-white text-blue-900 shadow-sm' : 'text-white hover:bg-white/10'
              }`}
            >
              <Kanban className="w-3.5 h-3.5" />
              <span>Tiến trình</span>
            </button>
          </div>

          {/* Nút Giao việc mới: Không bị lặp icon */}
          <button
            onClick={onOpenCreateTask}
            className="flex items-center gap-1.5 bg-white text-blue-900 hover:bg-blue-50 font-bold px-4 py-2 rounded-xl text-xs sm:text-sm transition-all shadow-md active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Giao việc mới</span>
          </button>
        </div>
      </div>

      {/* Unified Filter Toolbar with Blue Accent */}
      <div className="bg-white p-4 rounded-2xl border border-blue-100/80 shadow-xs space-y-3">
        {/* Quick Segmented Tabs - Hỗ trợ quản lý việc cá nhân đối với thành viên, quản lý việc thành viên và cá nhân đối với Tổ trưởng */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
            {/* Phân hệ tab theo vai trò: Thành viên vs Tổ trưởng/Cán bộ */}
            {currentRole === 'MEMBER' ? (
              <>
                <button
                  onClick={() => { setActiveTab('MINE'); setCurrentPage(1); }}
                  className={`px-3.5 py-1.5 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                    activeTab === 'MINE'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-blue-50 hover:text-blue-700'
                  }`}
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Việc cá nhân của tôi ({myTasksCount})</span>
                </button>

                <button
                  onClick={() => { setActiveTab('ALL'); setCurrentPage(1); }}
                  className={`px-3.5 py-1.5 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap ${
                    activeTab === 'ALL'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-blue-50 hover:text-blue-700'
                  }`}
                >
                  Tất cả việc của tổ ({allTasks.length})
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => { setActiveTab('ALL'); setCurrentPage(1); }}
                  className={`px-3.5 py-1.5 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap ${
                    activeTab === 'ALL'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-blue-50 hover:text-blue-700'
                  }`}
                >
                  Tất cả việc của tổ ({allTasks.length})
                </button>

                <button
                  onClick={() => { setActiveTab('MINE'); setCurrentPage(1); }}
                  className={`px-3.5 py-1.5 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                    activeTab === 'MINE'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-blue-50 hover:text-blue-700'
                  }`}
                  title="Công việc trực tiếp phân công cho Tổ trưởng/Cá nhân"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Việc của tôi ({myTasksCount})</span>
                </button>

                <button
                  onClick={() => { setActiveTab('DELEGATED'); setCurrentPage(1); }}
                  className={`px-3.5 py-1.5 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                    activeTab === 'DELEGATED'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-blue-50 hover:text-blue-700'
                  }`}
                  title="Các công việc giao cho các thành viên trong tổ thực hiện"
                >
                  <User className="w-3.5 h-3.5" />
                  <span>Việc thành viên ({delegatedCount})</span>
                </button>
              </>
            )}

            <button
              onClick={() => { setActiveTab('URGENT'); setCurrentPage(1); }}
              className={`px-3.5 py-1.5 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'URGENT'
                  ? 'bg-red-600 text-white shadow-xs'
                  : 'text-red-700 bg-red-50 hover:bg-red-100'
              }`}
            >
              <Flame className="w-3.5 h-3.5" />
              <span>Cần xử lý gấp ({urgentCount})</span>
            </button>

            <button
              onClick={() => { setActiveTab('COMPLETED'); setCurrentPage(1); }}
              className={`px-3.5 py-1.5 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'COMPLETED'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-emerald-50 hover:text-emerald-700'
              }`}
            >
              Đã hoàn thành ({completedCount})
            </button>
          </div>

          <div className="text-xs text-slate-500 font-medium">
            Có <strong>{filteredTasks.length}</strong> công việc phù hợp
          </div>
        </div>

        {/* Search & Dropdown Filters (Hỗ trợ lọc theo thành viên phụ trách) */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 text-xs">
          <div className="sm:col-span-4 relative">
            <Search className="w-4 h-4 text-blue-600 absolute left-3.5 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              placeholder="Tìm theo tên việc, mã CV, người phụ trách..."
              className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Lọc theo cán bộ/thành viên phụ trách */}
          <div className="sm:col-span-3">
            <select
              value={filterAssignee}
              onChange={e => { setFilterAssignee(e.target.value); setCurrentPage(1); }}
              className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 text-xs font-semibold focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">Tất cả người phụ trách</option>
              <option value="MINE">⭐️ Việc của tôi ({currentUser.name})</option>
              {members.map(m => (
                <option key={m.id} value={m.id}>
                  👤 {m.name} ({m.title})
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2 sm:col-span-3 lg:col-span-2">
            <select
              value={filterPriority}
              onChange={e => { setFilterPriority(e.target.value); setCurrentPage(1); }}
              className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 text-xs font-semibold focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">Mọi mức độ ưu tiên</option>
              <option value="KHAN">🔴 Khẩn cấp</option>
              <option value="CAO">🟠 Ưu tiên cao</option>
              <option value="THUONG">🔵 Bình thường</option>
              <option value="THAP">⚪ Thấp</option>
            </select>
          </div>

          <div className="sm:col-span-3">
            <select
              value={filterStatus}
              onChange={e => { setFilterStatus(e.target.value); setCurrentPage(1); }}
              className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 text-xs font-semibold focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">Mọi trạng thái tiến độ</option>
              <option value="DANG_THUC_HIEN">Đang thực hiện</option>
              <option value="DANG_DON_DOC">Đang đôn đốc</option>
              <option value="QUA_HAN">Quá hạn</option>
              <option value="HOAN_THANH">Đã hoàn thành</option>
              <option value="MOI_TAO">Mới tạo / Đã giao</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Task List */}
      {viewMode === 'LIST' && (
        <div className="space-y-3">
          {filteredTasks.length > 0 ? (
            <>
              {filteredTasks
                .slice((currentPage - 1) * pageSize, currentPage * pageSize)
                .map(task => {
                  const isUrgent = task.priority === 'KHAN';
                  const isHigh = task.priority === 'CAO';
                  const isOverdue = task.status === 'QUA_HAN';

                  const accentBorder = isUrgent
                    ? 'border-l-4 border-l-red-600'
                    : isHigh
                    ? 'border-l-4 border-l-amber-500'
                    : isOverdue
                    ? 'border-l-4 border-l-red-500'
                    : 'border-l-4 border-l-blue-600';

                  return (
                    <div
                      key={task.id}
                      onClick={() => onSelectTask(task)}
                      className={`bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all cursor-pointer ${accentBorder} group`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        {/* Title & Metadata */}
                        <div className="space-y-1.5 flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 text-xs">
                            <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-lg border border-blue-100">
                              {task.code}
                            </span>
                            <TaskStatusBadge status={task.status} />
                            <PriorityBadge priority={task.priority} size="sm" />
                            {task.targetName && (
                              <span className="text-slate-600 font-medium">· Đối tượng: <strong className="text-slate-900">{task.targetName}</strong></span>
                            )}
                          </div>

                          <h3 className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-blue-600 leading-snug">
                            {task.title}
                          </h3>

                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 pt-0.5">
                            <span>Phụ trách: <strong className="text-slate-800">{task.primaryAssigneeName}</strong></span>
                            <span>Hạn: <strong className={isOverdue ? 'text-red-600 font-bold' : 'text-slate-700'}>{task.dueDate}</strong></span>
                            <span className="text-blue-700 font-bold bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                              Bước {task.currentStep || 1}/6
                            </span>
                          </div>
                        </div>

                        {/* Quick Action Buttons (Xem, Sửa & Xóa) */}
                        <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                          <button
                            onClick={e => {
                              e.stopPropagation();
                              onSelectTask(task);
                            }}
                            className="px-3 py-1.5 text-xs font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors"
                            title="Xem chi tiết 6 bước"
                          >
                            Chi tiết
                          </button>

                          {canEditTask(task) && (
                            <button
                              onClick={e => handleEditClick(e, task)}
                              className="px-3 py-1.5 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-600 hover:text-white rounded-xl border border-blue-200 transition-all flex items-center gap-1 shadow-2xs"
                              title="Chỉnh sửa công việc này"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                              <span>Sửa</span>
                            </button>
                          )}

                          {canDeleteTask(task) && (
                            <button
                              onClick={e => handleDeleteClick(e, task)}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl border border-slate-200 transition-colors"
                              title="Xóa công việc này"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}

              <Pagination
                currentPage={currentPage}
                totalItems={filteredTasks.length}
                pageSize={pageSize}
                onPageChange={setCurrentPage}
                itemName="công việc"
              />
            </>
          ) : (
            <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center text-slate-400 space-y-2 text-xs">
              <Clock className="w-10 h-10 mx-auto text-blue-300" />
              <div className="font-bold text-slate-700 text-sm">Không tìm thấy công việc nào phù hợp</div>
              <div>Thử chọn bộ lọc khác hoặc tìm kiếm từ khóa khác</div>
            </div>
          )}
        </div>
      )}

      {/* Kanban View with Blue Aesthetic */}
      {viewMode === 'KANBAN' && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {[
            { id: 'NEW', label: 'Mới tạo & Nhận', statuses: ['MOI_TAO', 'DA_GIAO', 'DA_NHAN'], headerBg: 'bg-slate-100 text-slate-800' },
            { id: 'IN_PROGRESS', label: 'Đang hỗ trợ (6 bước)', statuses: ['DANG_THUC_HIEN', 'CHO_PHOI_HOP', 'CHO_PHAN_HOI', 'CHO_KIEM_TRA'], headerBg: 'bg-blue-50 text-blue-800 border-blue-200' },
            { id: 'ATTENTION', label: 'Đôn đốc / Quá hạn', statuses: ['DANG_DON_DOC', 'QUA_HAN'], headerBg: 'bg-amber-50 text-amber-900 border-amber-200' },
            { id: 'DONE', label: 'Hoàn thành', statuses: ['HOAN_THANH', 'DONG'], headerBg: 'bg-emerald-50 text-emerald-800 border-emerald-200' }
          ].map(col => {
            const colTasks = filteredTasks.filter(t => col.statuses.includes(t.status));
            return (
              <div key={col.id} className="bg-slate-50/80 rounded-2xl border border-slate-200 p-3 flex flex-col max-h-[75vh]">
                <div className={`flex items-center justify-between p-2.5 rounded-xl font-bold text-xs mb-2.5 border ${col.headerBg}`}>
                  <span>{col.label}</span>
                  <span className="bg-white px-2 py-0.5 rounded-full text-xs font-bold shadow-2xs">
                    {colTasks.length}
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
                  {colTasks.map(t => (
                    <div
                      key={t.id}
                      onClick={() => onSelectTask(t)}
                      className={`bg-white p-3 rounded-xl border border-slate-200 hover:border-blue-400 hover:shadow-xs cursor-pointer text-xs space-y-2 group ${
                        t.priority === 'KHAN' ? 'border-l-4 border-l-red-600' : 'border-l-4 border-l-blue-600'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-mono font-bold text-blue-700">{t.code}</span>
                        <PriorityBadge priority={t.priority} compact />
                      </div>
                      <div className="font-bold text-slate-800 line-clamp-2 leading-snug group-hover:text-blue-600">
                        {t.title}
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1.5 border-t border-slate-100">
                        <span className="truncate max-w-[100px]">{t.primaryAssigneeName}</span>
                        <div className="flex items-center gap-1.5">
                          {canEditTask(t) && (
                            <button
                              onClick={e => handleEditClick(e, t)}
                              className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                              title="Sửa"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                          )}
                          {canDeleteTask(t) && (
                            <button
                              onClick={e => handleDeleteClick(e, t)}
                              className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"
                              title="Xóa"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  {colTasks.length === 0 && (
                    <div className="text-center py-8 text-slate-400 text-xs italic">Trống</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Task Modal */}
      {editingTask && (
        <CreateTaskModal
          initialTask={editingTask}
          onClose={() => setEditingTask(null)}
          onCreated={updated => {
            setEditingTask(null);
          }}
          onDeleted={() => {
            setEditingTask(null);
          }}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!taskToDelete}
        title="Xóa công việc"
        message={`Bạn có chắc chắn muốn xóa vĩnh viễn công việc "${taskToDelete?.title}" (${taskToDelete?.code})? Hành động này không thể hoàn tác.`}
        confirmLabel="Xóa công việc"
        cancelLabel="Hủy"
        isDestructive={true}
        onConfirm={handleConfirmDelete}
        onCancel={() => setTaskToDelete(null)}
      />
    </div>
  );
};
