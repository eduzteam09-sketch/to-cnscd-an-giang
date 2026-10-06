import React, { useState } from 'react';
import {
  AlertTriangle,
  Calendar,
  CheckCircle,
  Clock,
  Filter,
  MapPin,
  Phone,
  PhoneCall,
  Search,
  Sparkles,
  Upload,
  UserCheck
} from 'lucide-react';
import { appStorage } from '../../services/storage';
import { Task, TaskStatus } from '../../types';
import { PriorityBadge, TargetGroupBadge, TaskStatusBadge, WorkGroupBadge } from '../common/StatusBadge';
import { Pagination } from '../common/Pagination';

interface MyTasksViewProps {
  onSelectTask: (task: Task) => void;
}

export const MyTasksView: React.FC<MyTasksViewProps> = ({ onSelectTask }) => {
  const currentUser = appStorage.getCurrentUser();
  const allTasks = appStorage.getTasks();
  const todayStr = new Date().toISOString().split('T')[0];

  // Filter tasks assigned to current user (as primary or collaborator)
  const myTasks = allTasks.filter(
    t => t.primaryAssigneeId === currentUser.id || t.collaboratorIds.includes(currentUser.id)
  );

  const [filterTab, setFilterTab] = useState<'ALL' | 'OVERDUE' | 'TODAY' | 'UPCOMING' | 'IN_PROGRESS' | 'WAITING' | 'DONE' | 'FOLLOW_UP'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  // Subsets based on Section 16 requirements:
  const overdueTasks = myTasks.filter(t => t.status === 'QUA_HAN');
  const todayTasks = myTasks.filter(t => t.dueDate === todayStr && t.status !== 'HOAN_THANH' && t.status !== 'DONG');
  const upcomingTasks = myTasks.filter(t => t.dueDate > todayStr && t.status !== 'HOAN_THANH' && t.status !== 'DONG');
  const inProgressTasks = myTasks.filter(t => t.status === 'DANG_THUC_HIEN' || t.status === 'DA_NHAN');
  const waitingTasks = myTasks.filter(t => t.status === 'CHO_PHAN_HOI' || t.status === 'CHO_PHOI_HOP' || t.status === 'CHO_KIEM_TRA');
  const doneTasks = myTasks.filter(t => t.status === 'HOAN_THANH' || t.status === 'DONG');
  const followUpTasks = myTasks.filter(t => t.status === 'DANG_DON_DOC' || t.reminders.some(r => !r.isDone));

  let displayed = myTasks;
  if (filterTab === 'OVERDUE') displayed = overdueTasks;
  else if (filterTab === 'TODAY') displayed = todayTasks;
  else if (filterTab === 'UPCOMING') displayed = upcomingTasks;
  else if (filterTab === 'IN_PROGRESS') displayed = inProgressTasks;
  else if (filterTab === 'WAITING') displayed = waitingTasks;
  else if (filterTab === 'DONE') displayed = doneTasks;
  else if (filterTab === 'FOLLOW_UP') displayed = followUpTasks;

  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    displayed = displayed.filter(
      t =>
        t.title.toLowerCase().includes(q) ||
        t.code.toLowerCase().includes(q) ||
        (t.targetName && t.targetName.toLowerCase().includes(q))
    );
  }

  return (
    <div className="space-y-5">
      {/* Top Banner for Field Officer */}
      <div className="bg-gradient-to-r from-blue-700 to-indigo-800 rounded-2xl p-5 text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-blue-200">
            <UserCheck className="w-4 h-4 text-emerald-300" />
            <span>Màn hình cá nhân hóa cán bộ hiện trường</span>
          </div>
          <h2 className="text-xl font-bold mt-1">{currentUser.name}</h2>
          <p className="text-xs text-blue-100">{currentUser.title} • {currentUser.teamName}</p>
        </div>

        <div className="flex items-center gap-2">
          <div className="bg-white/10 backdrop-blur-xs px-3 py-2 rounded-xl text-center border border-white/20">
            <div className="text-[10px] text-blue-200 uppercase font-semibold">Đang xử lý</div>
            <div className="text-lg font-bold text-white">{inProgressTasks.length + todayTasks.length}</div>
          </div>
          <div className="bg-red-500/20 backdrop-blur-xs px-3 py-2 rounded-xl text-center border border-red-400/30">
            <div className="text-[10px] text-red-200 uppercase font-semibold">Quá hạn</div>
            <div className="text-lg font-bold text-red-200">{overdueTasks.length}</div>
          </div>
          <div className="bg-emerald-500/20 backdrop-blur-xs px-3 py-2 rounded-xl text-center border border-emerald-400/30">
            <div className="text-[10px] text-emerald-200 uppercase font-semibold">Đã xong</div>
            <div className="text-lg font-bold text-emerald-200">{doneTasks.length}</div>
          </div>
        </div>
      </div>

      {/* Section 16 Tabs: Quá hạn, Đến hạn hôm nay, Sắp đến hạn, Đang xử lý, Chờ phản hồi, Hoàn thành, Đối tượng cần liên hệ lại */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 text-xs font-semibold">
        <button
          onClick={() => setFilterTab('ALL')}
          className={`px-3 py-2 rounded-xl whitespace-nowrap transition-all ${
            filterTab === 'ALL' ? 'bg-slate-900 text-white' : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          Tất cả ({myTasks.length})
        </button>

        <button
          onClick={() => setFilterTab('OVERDUE')}
          className={`px-3 py-2 rounded-xl whitespace-nowrap transition-all flex items-center gap-1.5 ${
            filterTab === 'OVERDUE'
              ? 'bg-red-600 text-white font-bold'
              : 'bg-white text-red-600 border border-red-200 hover:bg-red-50'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Việc quá hạn ({overdueTasks.length})</span>
        </button>

        <button
          onClick={() => setFilterTab('TODAY')}
          className={`px-3 py-2 rounded-xl whitespace-nowrap transition-all flex items-center gap-1.5 ${
            filterTab === 'TODAY'
              ? 'bg-blue-600 text-white font-bold'
              : 'bg-white text-blue-700 border border-blue-200 hover:bg-blue-50'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Hạn hôm nay ({todayTasks.length})</span>
        </button>

        <button
          onClick={() => setFilterTab('UPCOMING')}
          className={`px-3 py-2 rounded-xl whitespace-nowrap transition-all ${
            filterTab === 'UPCOMING' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          Sắp đến hạn ({upcomingTasks.length})
        </button>

        <button
          onClick={() => setFilterTab('IN_PROGRESS')}
          className={`px-3 py-2 rounded-xl whitespace-nowrap transition-all ${
            filterTab === 'IN_PROGRESS' ? 'bg-blue-700 text-white' : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          Đang xử lý ({inProgressTasks.length})
        </button>

        <button
          onClick={() => setFilterTab('WAITING')}
          className={`px-3 py-2 rounded-xl whitespace-nowrap transition-all ${
            filterTab === 'WAITING' ? 'bg-amber-600 text-white' : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          Chờ phản hồi / phối hợp ({waitingTasks.length})
        </button>

        <button
          onClick={() => setFilterTab('FOLLOW_UP')}
          className={`px-3 py-2 rounded-xl whitespace-nowrap transition-all flex items-center gap-1 ${
            filterTab === 'FOLLOW_UP' ? 'bg-purple-600 text-white' : 'bg-white text-purple-700 border border-purple-200 hover:bg-purple-50'
          }`}
        >
          <PhoneCall className="w-3.5 h-3.5" />
          <span>Cần liên hệ lại ({followUpTasks.length})</span>
        </button>

        <button
          onClick={() => setFilterTab('DONE')}
          className={`px-3 py-2 rounded-xl whitespace-nowrap transition-all ${
            filterTab === 'DONE' ? 'bg-emerald-600 text-white' : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          Đã hoàn thành ({doneTasks.length})
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
        <input
          type="text"
          placeholder="Tìm việc theo tên, mã hoặc tên đối tượng..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 shadow-xs"
        />
      </div>

      {/* Tasks List */}
      <div className="space-y-3">
        {displayed
          .slice((currentPage - 1) * pageSize, currentPage * pageSize)
          .map(task => {
          const isOverdue = task.status === 'QUA_HAN';
          const completedStepsCount = task.steps.filter(s => s.isCompleted).length;

          return (
            <div
              key={task.id}
              onClick={() => onSelectTask(task)}
              className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer shadow-xs hover:shadow-md ${
                isOverdue
                  ? 'bg-red-50/40 border-red-300 ring-1 ring-red-200'
                  : 'bg-white border-slate-200 hover:border-blue-400'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded text-xs">
                      {task.code}
                    </span>
                    <TaskStatusBadge status={task.status} />
                    <PriorityBadge priority={task.priority} />
                    <WorkGroupBadge group={task.workGroup} compact />
                    {task.targetGroup && <TargetGroupBadge group={task.targetGroup} compact />}
                  </div>

                  <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
                    {task.title}
                  </h3>

                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {task.description || 'Chưa có mô tả chi tiết'}
                  </p>

                  {/* Target Details */}
                  {task.targetName && (
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 pt-1">
                      <span className="font-semibold text-slate-800">
                        Đối tượng: {task.targetName}
                      </span>
                      {task.targetPhone && (
                        <span className="flex items-center gap-1 text-blue-600">
                          <Phone className="w-3.5 h-3.5" />
                          <span>{task.targetPhone}</span>
                        </span>
                      )}
                      {task.targetAddress && (
                        <span className="flex items-center gap-1 text-slate-500">
                          <MapPin className="w-3.5 h-3.5" />
                          <span>{task.targetAddress}</span>
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Right side: Progress Bar & Actions */}
                <div className="sm:text-right shrink-0 flex flex-col justify-between self-stretch sm:items-end">
                  <div className="text-xs">
                    <span className="text-slate-500">Thời hạn: </span>
                    <strong className={isOverdue ? 'text-red-600 font-bold' : 'text-slate-800'}>
                      {task.dueDate}
                    </strong>
                  </div>

                  <div className="my-2">
                    <div className="text-[11px] font-bold text-blue-700 mb-1">
                      Quy trình 6 bước: {completedStepsCount}/6 bước
                    </div>
                    <div className="w-32 bg-slate-200 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-blue-600 h-full rounded-full transition-all"
                        style={{ width: `${(completedStepsCount / 6) * 100}%` }}
                      />
                    </div>
                  </div>

                  <button className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white rounded-lg text-xs font-bold transition-colors">
                    Mở xử lý &rarr;
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {displayed.length === 0 && (
          <div className="p-12 text-center text-slate-400 bg-white rounded-2xl border border-dashed border-slate-200 text-xs">
            Không có công việc nào trong danh mục này.
          </div>
        )}

        {displayed.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalItems={displayed.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            itemName="công việc"
          />
        )}
      </div>
    </div>
  );
};
