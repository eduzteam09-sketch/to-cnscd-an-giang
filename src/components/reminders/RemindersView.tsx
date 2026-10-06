import React, { useState } from 'react';
import {
  AlertTriangle,
  Calendar,
  CheckCircle,
  Clock,
  History,
  MessageSquare,
  Phone,
  PhoneCall,
  Plus,
  Send,
  UserCheck
} from 'lucide-react';
import { appStorage } from '../../services/storage';
import { Task, UrgeLog } from '../../types';
import { PriorityBadge, TargetGroupBadge, TaskStatusBadge } from '../common/StatusBadge';
import { Pagination } from '../common/Pagination';

interface RemindersViewProps {
  onSelectTask: (task: Task) => void;
}

export const RemindersView: React.FC<RemindersViewProps> = ({ onSelectTask }) => {
  const tasks = appStorage.getTasks();
  const urgeLogs = appStorage.getUrgeLogs();
  const currentUser = appStorage.getCurrentUser();

  const todayStr = new Date().toISOString().split('T')[0];

  // Tasks that need urgent follow-up:
  // 1. Quá hạn
  // 2. Trạng thái DANG_DON_DOC
  // 3. Có mốc nhắc việc hôm nay hoặc quá hạn
  const overdueTasks = tasks.filter(t => t.status === 'QUA_HAN');
  const activeUrgeTasks = tasks.filter(
    t => (t.status === 'DANG_DON_DOC' || t.status === 'CHO_PHAN_HOI' || t.dueDate <= todayStr) &&
      t.status !== 'HOAN_THANH' && t.status !== 'DONG'
  );

  const [taskPage, setTaskPage] = useState(1);
  const [logPage, setLogPage] = useState(1);
  const pageSize = 15;

  // Form for quick urge logging
  const [selectedTaskForUrge, setSelectedTaskForUrge] = useState<Task | null>(activeUrgeTasks[0] || tasks[0] || null);
  const [method, setMethod] = useState<'DIEN_THOAI' | 'TRUC_TIEP' | 'ZALO_SMS' | 'KHAC'>('DIEN_THOAI');
  const [content, setContent] = useState('');
  const [citizenFeedback, setCitizenFeedback] = useState('');
  const [nextFollowUpDate, setNextFollowUpDate] = useState('');
  const [result, setResult] = useState<'TIEP_TUC_THEO_DOI' | 'DA_HOAN_THANH' | 'CAN_HO_TRO_LAI' | 'KHONG_LIEN_LAC_DUOC'>('TIEP_TUC_THEO_DOI');

  const handleSubmitUrge = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTaskForUrge || !content.trim()) return;

    appStorage.addUrgeLog({
      taskId: selectedTaskForUrge.id,
      targetId: selectedTaskForUrge.targetId,
      targetName: selectedTaskForUrge.targetName || selectedTaskForUrge.title,
      method,
      performedBy: currentUser.name,
      content: content.trim(),
      citizenFeedback: citizenFeedback.trim() || 'Chưa ghi nhận phản hồi',
      nextFollowUpDate: nextFollowUpDate || undefined,
      result
    });

    setContent('');
    setCitizenFeedback('');
    setNextFollowUpDate('');
    alert('Đã lưu nhật ký đôn đốc thành công!');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
            <PhoneCall className="w-5 h-5 text-amber-600" />
            <span>Trung Tâm Đôn Đốc, Nhắc Việc & Cảnh Báo Quá Hạn</span>
          </h2>
          <p className="text-xs text-slate-500">
            Nguyên tắc nghiệp vụ: Mỗi lần đôn đốc phải để lại nhật ký (kèm người thực hiện, thời điểm và kết quả)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-red-100 text-red-700 font-bold rounded-lg text-xs">
            {overdueTasks.length} việc quá hạn
          </span>
          <span className="px-3 py-1 bg-amber-100 text-amber-800 font-bold rounded-lg text-xs">
            {activeUrgeTasks.length} việc cần đôn đốc
          </span>
        </div>
      </div>

      {/* Main Grid: Left = Danh sách việc cần đôn đốc, Right = Ghi nhận đôn đốc & Lịch sử */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column (5 cols): Danh sách việc cần đôn đốc ngay */}
        <div className="lg:col-span-5 space-y-3">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 space-y-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center justify-between">
              <span>Danh Sách Việc Cần Đôn Đốc</span>
              <span className="text-xs text-slate-400 font-normal">Hạn xử lý</span>
            </h3>

            <div className="space-y-2 max-h-[65vh] overflow-y-auto pr-1">
              {activeUrgeTasks
                .slice((taskPage - 1) * pageSize, taskPage * pageSize)
                .map(task => {
                  const isSelected = selectedTaskForUrge?.id === task.id;
                  const isOverdue = task.status === 'QUA_HAN' || task.dueDate < todayStr;

                  return (
                    <div
                      key={task.id}
                      onClick={() => setSelectedTaskForUrge(task)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer text-xs space-y-1.5 ${
                        isSelected
                          ? 'bg-amber-50/80 border-amber-500 ring-2 ring-amber-100 shadow-xs'
                          : isOverdue
                          ? 'bg-red-50/40 border-red-200 hover:border-red-300'
                          : 'bg-white border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-blue-700">{task.code}</span>
                        <TaskStatusBadge status={task.status} />
                      </div>

                      <h4 className="font-bold text-slate-900 line-clamp-1">{task.title}</h4>

                      <div className="flex items-center justify-between text-slate-500 text-[11px]">
                        <span>Đối tượng: <strong className="text-slate-700">{task.targetName || 'Nội bộ'}</strong></span>
                        <span className={isOverdue ? 'text-red-600 font-bold' : 'text-slate-600'}>
                          Hạn: {task.dueDate}
                        </span>
                      </div>

                      <div className="pt-1 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                        <span>Phụ trách: {task.primaryAssigneeName}</span>
                        <span className="text-blue-600 font-medium">Bước {task.currentStep}/6</span>
                      </div>
                    </div>
                  );
                })}

              {activeUrgeTasks.length === 0 && (
                <div className="p-8 text-center text-slate-400 text-xs">
                  Hiện không có công việc nào rơi vào diện phải đôn đốc khẩn cấp!
                </div>
              )}
            </div>

            {activeUrgeTasks.length > 0 && (
              <Pagination
                currentPage={taskPage}
                totalItems={activeUrgeTasks.length}
                pageSize={pageSize}
                onPageChange={setTaskPage}
                itemName="việc đôn đốc"
              />
            )}
          </div>
        </div>

        {/* Right Column (7 cols): Ghi nhận đôn đốc & Lịch sử audit đôn đốc */}
        <div className="lg:col-span-7 space-y-4">
          {/* Quick Record Form */}
          {selectedTaskForUrge && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4 text-xs">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div>
                  <div className="font-mono font-bold text-blue-700 text-xs">{selectedTaskForUrge.code}</div>
                  <h3 className="text-base font-bold text-slate-900 leading-snug">
                    {selectedTaskForUrge.title}
                  </h3>
                  <div className="text-slate-500 text-xs mt-0.5">
                    Đối tượng: <strong>{selectedTaskForUrge.targetName}</strong> ({selectedTaskForUrge.targetPhone || 'Chưa có SĐT'})
                  </div>
                </div>

                <button
                  onClick={() => onSelectTask(selectedTaskForUrge)}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-blue-600 hover:text-white rounded-lg text-slate-700 font-bold text-xs transition-colors"
                >
                  Xem chi tiết 6 bước &rarr;
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmitUrge} className="space-y-3 bg-amber-50/60 p-4 rounded-xl border border-amber-200">
                <h4 className="font-bold text-amber-900 flex items-center gap-1.5">
                  <Phone className="w-4 h-4 text-amber-700" />
                  <span>Ghi nhận lần đôn đốc này ({currentUser.name})</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Phương thức liên hệ:</label>
                    <select
                      value={method}
                      onChange={e => setMethod(e.target.value as any)}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2"
                    >
                      <option value="DIEN_THOAI">Gọi điện thoại trực tiếp</option>
                      <option value="TRUC_TIEP">Đến gặp trực tiếp tại địa bàn</option>
                      <option value="ZALO_SMS">Nhắn tin Zalo / SMS</option>
                      <option value="KHAC">Phương thức khác</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Kết quả lần đôn đốc:</label>
                    <select
                      value={result}
                      onChange={e => setResult(e.target.value as any)}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2"
                    >
                      <option value="TIEP_TUC_THEO_DOI">Tiếp tục theo dõi</option>
                      <option value="DA_HOAN_THANH">Đối tượng đã hoàn thành tốt</option>
                      <option value="CAN_HO_TRO_LAI">Cần cử cán bộ qua hỗ trợ lại</option>
                      <option value="KHONG_LIEN_LAC_DUOC">Không liên lạc được (sẽ thử lại sau)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Nội dung đôn đốc / Hướng dẫn thêm <span className="text-red-500">*</span>:
                  </label>
                  <textarea
                    rows={2}
                    required
                    placeholder="Mô tả nội dung đã đôn đốc, giải thích hoặc nhắc nhở..."
                    value={content}
                    onChange={e => setContent(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Phản hồi của đối tượng / Khó khăn phát sinh:</label>
                  <input
                    type="text"
                    placeholder="VD: Đối tượng bận việc gia đình hẹn thứ 6 quay lại..."
                    value={citizenFeedback}
                    onChange={e => setCitizenFeedback(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2"
                  />
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                  <div>
                    <label className="font-semibold text-slate-700 inline-block mr-2">Hẹn lịch theo dõi kế tiếp:</label>
                    <input
                      type="date"
                      value={nextFollowUpDate}
                      onChange={e => setNextFollowUpDate(e.target.value)}
                      className="bg-white border border-slate-300 rounded-lg p-1.5"
                    />
                  </div>

                  <button
                    type="submit"
                    className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-4 py-2 rounded-lg flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Lưu nhật ký đôn đốc</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Lịch sử nhật ký đôn đốc toàn hệ thống */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <History className="w-4 h-4 text-blue-600" />
              <span>Nhật Ký Đôn Đốc Gần Đây ({urgeLogs.length} lượt)</span>
            </h3>

            <div className="divide-y divide-slate-100 text-xs">
              {urgeLogs
                .slice((logPage - 1) * pageSize, logPage * pageSize)
                .map(log => (
                  <div key={log.id} className="py-3 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800">{log.targetName}</span>
                      <span className="text-[11px] text-slate-400">
                        {log.date.replace('T', ' ').substring(0, 16)}
                      </span>
                    </div>
                    <div className="text-slate-600 italic">
                      "{log.content}"
                    </div>
                    {log.citizenFeedback && (
                      <div className="text-[11px] text-emerald-800 bg-emerald-50 p-2 rounded-lg">
                        Phản hồi: {log.citizenFeedback}
                      </div>
                    )}
                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                      <span>Thực hiện: <strong>{log.performedBy}</strong> ({log.method})</span>
                      {log.nextFollowUpDate && (
                        <span className="text-blue-600 font-semibold">
                          Lịch tới: {log.nextFollowUpDate}
                        </span>
                      )}
                    </div>
                  </div>
                ))}

              {urgeLogs.length === 0 && (
                <div className="py-6 text-center text-slate-400">
                  Chưa có lần đôn đốc nào được ghi nhận.
                </div>
              )}
            </div>

            {urgeLogs.length > 0 && (
              <Pagination
                currentPage={logPage}
                totalItems={urgeLogs.length}
                pageSize={pageSize}
                onPageChange={setLogPage}
                itemName="nhật ký đôn đốc"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
