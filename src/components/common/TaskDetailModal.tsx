import React, { useState } from 'react';
import {
  AlertTriangle,
  Calendar,
  CheckCircle,
  CheckSquare,
  Clock,
  Edit2,
  ExternalLink,
  FileCheck,
  FileText,
  Flame,
  Folder,
  Globe,
  Link2,
  MessageSquare,
  Paperclip,
  Phone,
  Plus,
  Save,
  Send,
  Trash2,
  Upload,
  User,
  X
} from 'lucide-react';
import { STEP_6_DEFINITIONS, WORK_GROUP_CONFIG } from '../../mock/initialData';
import { appStorage } from '../../services/storage';
import { EvidenceItem, Priority, Task, TaskStatus, WorkGroup } from '../../types';
import { PriorityBadge, TaskStatusBadge } from './StatusBadge';

interface TaskDetailModalProps {
  task: Task;
  onClose: () => void;
  onUpdated: () => void;
}

export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
  task: initialTask,
  onClose,
  onUpdated
}) => {
  const [task, setTask] = useState<Task>(initialTask);

  // Quick inputs
  const [newChecklistText, setNewChecklistText] = useState('');
  const [editingChecklistId, setEditingChecklistId] = useState<string | null>(null);
  const [editingChecklistText, setEditingChecklistText] = useState('');

  const [actualResultInput, setActualResultInput] = useState(task.actualResult || '');
  const [newEvidenceTitle, setNewEvidenceTitle] = useState('');
  const [newEvidenceUrl, setNewEvidenceUrl] = useState('');

  // Quick reminder log
  const [showUrgeInput, setShowUrgeInput] = useState(false);
  const [urgeContent, setUrgeContent] = useState('');
  const [urgeMethod, setUrgeMethod] = useState<'DIEN_THOAI' | 'TRUC_TIEP' | 'ZALO_SMS'>('DIEN_THOAI');

  const members = appStorage.getMembers();
  const currentUser = appStorage.getCurrentUser();

  // 1-Click Advance or Toggle Step
  const handleToggleStep = (stepNumber: 1 | 2 | 3 | 4 | 5 | 6) => {
    const updatedSteps = task.steps.map(s => {
      if (s.stepNumber === stepNumber) {
        const isDone = !s.isCompleted;
        return {
          ...s,
          isCompleted: isDone,
          completedAt: isDone ? new Date().toISOString() : undefined,
          completedBy: isDone ? currentUser.name : undefined
        };
      }
      return s;
    });

    const completedCount = updatedSteps.filter(s => s.isCompleted).length;
    const nextStepNum = Math.min(completedCount + 1, 6);

    let nextStatus = task.status;
    if (completedCount === 6) {
      nextStatus = 'HOAN_THANH';
    } else if (completedCount >= 1 && (task.status === 'MOI_TAO' || task.status === 'DA_GIAO')) {
      nextStatus = 'DANG_THUC_HIEN';
    }

    const updated: Task = {
      ...task,
      steps: updatedSteps,
      currentStep: nextStepNum,
      status: nextStatus
    };
    appStorage.updateTask(updated);
    setTask(updated);
    onUpdated();
  };

  // Change Status
  const handleStatusChange = (newStatus: TaskStatus) => {
    const updated: Task = {
      ...task,
      status: newStatus,
      completedDate: newStatus === 'HOAN_THANH' ? new Date().toISOString() : task.completedDate
    };
    appStorage.updateTask(updated);
    setTask(updated);
    onUpdated();
  };

  // Change Priority
  const handlePriorityChange = (newPriority: Priority) => {
    const updated: Task = { ...task, priority: newPriority };
    appStorage.updateTask(updated);
    setTask(updated);
    onUpdated();
  };

  // Toggle Checklist item
  const handleToggleChecklist = (id: string) => {
    const updatedChecklist = task.checklist.map(c => {
      if (c.id === id) {
        const isDone = !c.completed;
        return {
          ...c,
          completed: isDone,
          completedAt: isDone ? new Date().toISOString().split('T')[0] : undefined
        };
      }
      return c;
    });
    const updated: Task = { ...task, checklist: updatedChecklist };
    appStorage.updateTask(updated);
    setTask(updated);
    onUpdated();
  };

  // Add Checklist item
  const handleAddChecklist = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChecklistText.trim()) return;
    const newItem = {
      id: `chk-${Date.now()}`,
      title: newChecklistText.trim(),
      completed: false
    };
    const updated: Task = { ...task, checklist: [...task.checklist, newItem] };
    appStorage.updateTask(updated);
    setTask(updated);
    setNewChecklistText('');
    onUpdated();
  };

  // Edit Checklist item
  const handleSaveChecklistEdit = (id: string) => {
    if (!editingChecklistText.trim()) return;
    const updatedChecklist = task.checklist.map(c =>
      c.id === id ? { ...c, title: editingChecklistText.trim() } : c
    );
    const updated: Task = { ...task, checklist: updatedChecklist };
    appStorage.updateTask(updated);
    setTask(updated);
    setEditingChecklistId(null);
    setEditingChecklistText('');
    onUpdated();
  };

  // Delete Checklist item
  const handleDeleteChecklist = (id: string) => {
    const updatedChecklist = task.checklist.filter(c => c.id !== id);
    const updated: Task = { ...task, checklist: updatedChecklist };
    appStorage.updateTask(updated);
    setTask(updated);
    onUpdated();
  };

  // Save Actual Result / Complete Task
  const handleSaveResultAndComplete = () => {
    if (!actualResultInput.trim()) {
      alert('Vui lòng nhập ghi chú kết quả đạt được trước khi hoàn thành.');
      return;
    }

    const updatedSteps = task.steps.map(s => {
      if (s.stepNumber === 6) {
        return {
          ...s,
          isCompleted: true,
          completedAt: new Date().toISOString(),
          completedBy: currentUser.name,
          notes: actualResultInput.trim()
        };
      }
      return s;
    });

    const updated: Task = {
      ...task,
      status: 'HOAN_THANH',
      actualResult: actualResultInput.trim(),
      completedDate: new Date().toISOString(),
      currentStep: 6,
      steps: updatedSteps
    };

    appStorage.updateTask(updated);
    setTask(updated);
    onUpdated();
  };

  // Quick Urge Log
  const handleSaveUrgeLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!urgeContent.trim()) return;

    appStorage.addUrgeLog({
      taskId: task.id,
      targetId: task.targetId,
      targetName: task.targetName || 'Đối tượng',
      method: urgeMethod,
      content: urgeContent.trim(),
      performedBy: currentUser.name,
      citizenFeedback: 'Đã nhận thông tin đôn đốc',
      result: 'TIEP_TUC_THEO_DOI'
    });

    const updated: Task = {
      ...task,
      status: task.status === 'QUA_HAN' ? 'QUA_HAN' : 'DANG_DON_DOC'
    };
    appStorage.updateTask(updated);
    setTask(updated);
    setUrgeContent('');
    setShowUrgeInput(false);
    onUpdated();
  };

  // Add Evidence Link (Google Drive, file link, photo link...)
  const handleAddEvidence = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEvidenceTitle.trim()) {
      alert('Vui lòng nhập tên hoặc mô tả minh chứng.');
      return;
    }
    if (!newEvidenceUrl.trim()) {
      alert('Vui lòng nhập đường link lưu trữ (Link Google Drive, file hoặc ảnh minh chứng).');
      return;
    }

    let url = newEvidenceUrl.trim();
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }

    const isImage = /\.(jpg|jpeg|png|webp|gif|svg)($|\?)/i.test(url);
    const newEvidence: EvidenceItem = {
      id: `ev-${Date.now()}`,
      type: isImage ? 'IMAGE' : 'FILE',
      title: newEvidenceTitle.trim(),
      url: url,
      description: 'Đường link lưu trữ minh chứng nhiệm vụ',
      createdBy: currentUser.name,
      createdAt: new Date().toISOString()
    };

    const updated: Task = {
      ...task,
      evidences: [...(task.evidences || []), newEvidence]
    };
    appStorage.updateTask(updated);
    setTask(updated);
    setNewEvidenceTitle('');
    setNewEvidenceUrl('');
    onUpdated();
  };

  // Delete Evidence
  const handleDeleteEvidence = (id: string) => {
    const updatedEvidences = (task.evidences || []).filter(e => e.id !== id);
    const updated: Task = { ...task, evidences: updatedEvidences };
    appStorage.updateTask(updated);
    setTask(updated);
    onUpdated();
  };

  const isOverdue = task.status === 'QUA_HAN';
  const isAtStep6OrCompleted = task.currentStep === 6 || task.status === 'HOAN_THANH';
  const currentStepDef = STEP_6_DEFINITIONS.find(d => d.stepNumber === (task.currentStep || 1));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">
        {/* Beautiful Blue Header (Matching Phiếu Đăng Ký Yêu Cầu Chuyển Đổi Số) */}
        <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-900 text-white p-5 sm:p-6 flex items-start justify-between gap-4">
          <div className="space-y-1.5 flex-1">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="font-mono font-bold bg-white/20 text-white px-2.5 py-0.5 rounded-lg border border-white/30">
                {task.code}
              </span>
              <TaskStatusBadge status={task.status} />
              <PriorityBadge priority={task.priority} size="sm" />
              {task.targetName && (
                <span className="text-blue-100 font-medium">· Đối tượng: {task.targetName}</span>
              )}
            </div>

            <h2 className="text-lg sm:text-xl font-black leading-snug">
              {task.title}
            </h2>

            <div className="text-xs text-blue-200 flex flex-wrap items-center gap-x-4 gap-y-1 pt-0.5">
              <span>Phụ trách: <strong className="text-white">{task.primaryAssigneeName}</strong></span>
              <span>Hạn xử lý: <strong className={isOverdue ? 'text-amber-300 font-bold' : 'text-white'}>{task.dueDate}</strong></span>
              <span>Địa bàn: <strong className="text-white">{task.ward}</strong></span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Close Modal Button */}
            <button
              onClick={onClose}
              className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors cursor-pointer"
              aria-label="Đóng"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-6 text-xs sm:text-sm">
          {/* 6-Step Visual Progress Stepper (Non-fixed, scrolls with body so content below is never covered) */}
          <div className="bg-blue-50/70 border border-blue-200 rounded-2xl p-4 shadow-2xs space-y-2.5">
            <div className="flex items-center justify-between text-xs font-bold text-slate-800">
              <span className="flex items-center gap-1.5 text-blue-900">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse"></span>
                <span>Tiến độ thực hiện 6 bước chuẩn quy trình</span>
              </span>
              <span className="text-blue-700 bg-white px-2.5 py-0.5 rounded-full border border-blue-200 shadow-2xs font-extrabold text-[11px]">
                Đang ở Bước {task.currentStep || 1}/6 · Đã hoàn thành {task.steps.filter(s => s.isCompleted).length}/6 bước
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
              {task.steps.map(step => {
                const def = STEP_6_DEFINITIONS.find(d => d.stepNumber === step.stepNumber);
                const isCurrent = task.currentStep === step.stepNumber;
                const isStepDone = step.isCompleted;

                return (
                  <button
                    key={step.stepNumber}
                    onClick={() => handleToggleStep(step.stepNumber as 1 | 2 | 3 | 4 | 5 | 6)}
                    className={`p-2.5 rounded-xl text-left transition-all border text-xs cursor-pointer ${
                      isStepDone
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-900 shadow-2xs'
                        : isCurrent
                        ? 'bg-blue-600 border-blue-700 text-white shadow-xs ring-2 ring-blue-300'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-blue-300 hover:bg-blue-50/30'
                    }`}
                    title={`Bấm để chuyển trạng thái bước: ${def?.title}`}
                  >
                    <div className="flex items-center justify-between font-bold">
                      <span>Bước {step.stepNumber}</span>
                      {isStepDone ? (
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      ) : (
                        <div className={`w-2 h-2 rounded-full ${isCurrent ? 'bg-white' : 'bg-slate-300'}`} />
                      )}
                    </div>
                    <div className={`text-[11px] font-semibold truncate mt-0.5 ${isCurrent ? 'text-blue-100' : 'text-slate-600'}`}>
                      {def?.title.split('. ')[1] || step.stepName}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2-Column Content Grid */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
            {/* Left Column: Work, Checklist, Results (7 cols) */}
            <div className="md:col-span-7 space-y-4">
              {/* Description Box */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                <div className="font-bold text-slate-800 text-xs flex items-center gap-1.5 text-blue-900">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                  <span>Mô tả công việc:</span>
                </div>
                <p className="text-slate-700 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap">
                  {task.description || 'Không có mô tả chi tiết.'}
                </p>
              </div>

              {/* Checklist with Edit & Delete on each item */}
              <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between font-bold text-slate-900 text-xs">
                  <span className="flex items-center gap-1.5 text-blue-900">
                    <CheckSquare className="w-4 h-4 text-blue-600" />
                    <span>Danh sách công việc con (Checklist)</span>
                  </span>
                  <span className="text-slate-500 font-normal">
                    {task.checklist.filter(c => c.completed).length}/{task.checklist.length} việc hoàn thành
                  </span>
                </div>

                <div className="space-y-2">
                  {task.checklist.map(item => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between gap-2 p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors"
                    >
                      {editingChecklistId === item.id ? (
                        <div className="flex items-center gap-1.5 flex-1">
                          <input
                            type="text"
                            value={editingChecklistText}
                            onChange={e => setEditingChecklistText(e.target.value)}
                            className="flex-1 p-1.5 bg-white border border-blue-400 rounded-lg text-xs"
                            autoFocus
                          />
                          <button
                            onClick={() => handleSaveChecklistEdit(item.id)}
                            className="p-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold"
                          >
                            Lưu
                          </button>
                          <button
                            onClick={() => setEditingChecklistId(null)}
                            className="p-1.5 bg-slate-200 text-slate-700 rounded-lg text-xs"
                          >
                            Hủy
                          </button>
                        </div>
                      ) : (
                        <>
                          <label className="flex items-center gap-2.5 flex-1 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={item.completed}
                              onChange={() => handleToggleChecklist(item.id)}
                              className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                            />
                            <span className={`text-xs ${item.completed ? 'line-through text-slate-400 font-normal' : 'text-slate-800 font-medium'}`}>
                              {item.title}
                            </span>
                          </label>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => {
                                setEditingChecklistId(item.id);
                                setEditingChecklistText(item.title);
                              }}
                              className="p-1 text-slate-400 hover:text-blue-600 rounded"
                              title="Sửa đầu việc"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteChecklist(item.id)}
                              className="p-1 text-slate-400 hover:text-red-600 rounded"
                              title="Xóa đầu việc này"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}

                  {/* Add checklist input */}
                  <form onSubmit={handleAddChecklist} className="flex gap-2 pt-1">
                    <input
                      type="text"
                      value={newChecklistText}
                      onChange={e => setNewChecklistText(e.target.value)}
                      placeholder="+ Thêm đầu việc mới..."
                      className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="submit"
                      className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-xs cursor-pointer"
                    >
                      Thêm việc
                    </button>
                  </form>
                </div>
              </div>

              {/* Step 6 Specific: Result confirmation and Evidence only show at Step 6 or when Completed */}
              {isAtStep6OrCompleted ? (
                <>
                  {/* Actual Result & Complete */}
                  <div className="p-4 bg-emerald-50/80 rounded-2xl border border-emerald-300 shadow-xs space-y-3 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-emerald-950 text-xs flex items-center gap-1.5">
                        <CheckCircle className="w-4 h-4 text-emerald-600" />
                        <span>Bước 6: Ghi nhận kết quả thực tế & Nghiệm thu</span>
                      </span>
                      {task.completedDate && (
                        <span className="text-[11px] text-emerald-800 font-semibold bg-white/80 px-2 py-0.5 rounded-lg border border-emerald-200">
                          ✓ Đã hoàn thành ngày {task.completedDate.split('T')[0]}
                        </span>
                      )}
                    </div>

                    {task.actualResult ? (
                      <div className="p-3 bg-white rounded-xl border border-emerald-200 text-slate-800 text-xs font-medium leading-relaxed">
                        <div className="text-[11px] text-emerald-800 font-bold mb-1">Kết quả đã ghi nhận:</div>
                        {task.actualResult}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <textarea
                          rows={3}
                          value={actualResultInput}
                          onChange={e => setActualResultInput(e.target.value)}
                          placeholder="Mô tả kết quả đạt được của 6 bước (VD: Đã kích hoạt VNeID mức 2 thành công cho công dân, tích hợp BHYT và hướng dẫn thanh toán hóa đơn điện tử không dùng tiền mặt)..."
                          className="w-full p-2.5 bg-white border border-emerald-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
                        />
                        <button
                          onClick={handleSaveResultAndComplete}
                          className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <CheckCircle className="w-4 h-4" />
                          <span>Xác nhận kết quả & Đánh dấu Hoàn thành toàn diện 6 bước</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Evidences / Attachments with Links only (Google Drive, file link, photo link) */}
                  <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3 animate-in fade-in duration-200">
                    <div className="font-bold text-slate-900 text-xs flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-blue-900">
                        <Paperclip className="w-4 h-4 text-blue-600" />
                        <span>Link lưu trữ tài liệu & Bằng chứng nghiệm thu ({task.evidences?.length || 0})</span>
                      </span>
                    </div>

                    {task.evidences && task.evidences.length > 0 ? (
                      <div className="space-y-2">
                        {task.evidences.map(ev => {
                          const isGdrive = ev.url?.includes('drive.google.com');
                          return (
                            <div
                              key={ev.id}
                              className="p-2.5 border border-slate-200 rounded-xl bg-slate-50 flex items-center justify-between gap-3 group hover:border-blue-300 transition-colors"
                            >
                              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                <div className="p-2 bg-blue-100 text-blue-700 rounded-lg shrink-0">
                                  {isGdrive ? <Folder className="w-4 h-4 text-emerald-600" /> : <Link2 className="w-4 h-4 text-indigo-600" />}
                                </div>
                                <div className="truncate flex-1 min-w-0">
                                  <div className="font-bold text-slate-800 text-xs truncate flex items-center gap-1.5">
                                    <span>{ev.title}</span>
                                    {isGdrive && (
                                      <span className="text-[10px] bg-emerald-100 text-emerald-800 font-semibold px-1.5 py-0.2 rounded shrink-0">
                                        Google Drive
                                      </span>
                                    )}
                                  </div>
                                  {ev.url && (
                                    <a
                                      href={ev.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-[11px] text-blue-600 hover:text-blue-800 underline truncate block font-mono mt-0.5"
                                      title={ev.url}
                                    >
                                      {ev.url}
                                    </a>
                                  )}
                                  <div className="text-[10px] text-slate-400 mt-0.5">
                                    {ev.createdBy} · {ev.createdAt?.split('T')[0]}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-1 shrink-0">
                                {ev.url && (
                                  <a
                                    href={ev.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                                    title="Mở link trong tab mới"
                                  >
                                    <ExternalLink className="w-3.5 h-3.5" />
                                  </a>
                                )}
                                <button
                                  onClick={() => handleDeleteEvidence(ev.id)}
                                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                  title="Xóa link minh chứng này"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-4 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-400 text-xs">
                        Chưa có link minh chứng nào. Dán đường link Google Drive, OneDrive hoặc link file/ảnh bên dưới.
                      </div>
                    )}

                    {/* Add evidence link form */}
                    <form onSubmit={handleAddEvidence} className="space-y-2 pt-2 border-t border-slate-100">
                      <div className="text-[11px] font-bold text-slate-700">Dán link minh chứng nghiệm thu mới:</div>
                      <input
                        type="text"
                        value={newEvidenceTitle}
                        onChange={e => setNewEvidenceTitle(e.target.value)}
                        placeholder="Tên / Mô tả minh chứng (VD: Biên bản nghiệm thu đã ký / Thư mục ảnh Google Drive...)"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500"
                      />
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Link2 className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                          <input
                            type="text"
                            value={newEvidenceUrl}
                            onChange={e => setNewEvidenceUrl(e.target.value)}
                            placeholder="Dán đường link lưu trữ (VD: https://drive.google.com/... hoặc link file, link ảnh)"
                            className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <button
                          type="submit"
                          className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors shrink-0 shadow-xs cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Lưu link</span>
                        </button>
                      </div>
                      <div className="text-[10px] text-slate-500 italic">
                        * Hệ thống chỉ nhận đường link lưu trữ (link Google Drive, file lưu trữ hoặc ảnh trực tuyến), không tải trực tiếp tệp nặng lên hệ thống để tối ưu hiệu năng.
                      </div>
                    </form>
                  </div>
                </>
              ) : (
                /* Step 1 to 5 Notice */
                <div className="p-4 bg-amber-50/90 rounded-2xl border border-amber-200 space-y-3 text-xs animate-in fade-in duration-200">
                  <div className="flex items-center gap-2 font-bold text-amber-950">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Nhiệm vụ đang ở Bước {task.currentStep || 1}/6: {currentStepDef?.title || 'Đang xử lý'}</span>
                  </div>
                  <p className="text-amber-900 text-[11px] leading-relaxed">
                    Để đảm bảo tuân thủ nghiêm ngặt quy trình 6 bước và tránh nhầm lẫn chỉ mới đang ở bước 1-5 mà bấm xác nhận hoàn thành công việc, phần <strong>"Ghi nhận kết quả thực tế & Nghiệm thu"</strong> cùng <strong>"Gửi link minh chứng"</strong> sẽ chỉ hiển thị ở <strong>Bước 6</strong> sau khi đã hoàn tất các bước trước.
                  </p>
                  <div className="pt-1 flex flex-wrap items-center justify-between gap-2 border-t border-amber-200/60">
                    <span className="text-[11px] text-amber-800 font-medium">
                      Bấm vào các nút Bước 1-6 phía trên hoặc bấm nút bên để chuyển tiếp:
                    </span>
                    {task.currentStep < 6 && (
                      <button
                        onClick={() => handleToggleStep(task.currentStep as 1 | 2 | 3 | 4 | 5 | 6)}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-xs transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <span>Hoàn thành Bước {task.currentStep} → Sang Bước {task.currentStep + 1}</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Beneficiary & Controls (5 cols) */}
            <div className="md:col-span-5 space-y-4">
              {/* Beneficiary Card (Styled like Phiếu Đăng Ký Yêu Cầu Dân) */}
              <div className="p-4 rounded-2xl border border-blue-200 bg-blue-50/40 space-y-3">
                <div className="font-bold text-blue-900 text-xs flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <User className="w-4 h-4 text-blue-600" />
                    <span>Thông tin đối tượng thụ hưởng</span>
                  </span>
                </div>

                <div className="space-y-1.5 bg-white p-3 rounded-xl border border-blue-100">
                  <div className="font-bold text-slate-900 text-sm">
                    {task.targetName || 'Chưa liên kết đối tượng'}
                  </div>
                  {task.targetPhone && (
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-slate-700 font-mono text-xs font-semibold">{task.targetPhone}</span>
                      <a
                        href={`tel:${task.targetPhone}`}
                        className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-2xs"
                      >
                        <Phone className="w-3 h-3" />
                        <span>Gọi điện</span>
                      </a>
                    </div>
                  )}
                  {task.targetAddress && (
                    <div className="text-slate-500 text-[11px] pt-1 border-t border-slate-100">
                      📍 {task.targetAddress}
                    </div>
                  )}
                </div>
              </div>

              {/* Status & Priority Control */}
              <div className="p-4 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-3">
                <div className="font-bold text-slate-900 text-xs text-blue-900">Điều chỉnh nhanh</div>

                <div className="space-y-1">
                  <label className="text-slate-600 text-xs font-medium">Trạng thái công việc:</label>
                  <select
                    value={task.status}
                    onChange={e => handleStatusChange(e.target.value as TaskStatus)}
                    className="w-full py-2 px-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="MOI_TAO">Mới tạo</option>
                    <option value="DA_GIAO">Đã giao</option>
                    <option value="DANG_THUC_HIEN">Đang thực hiện</option>
                    <option value="DANG_DON_DOC">Đang đôn đốc</option>
                    <option value="QUA_HAN">Quá hạn</option>
                    <option value="HOAN_THANH">Hoàn thành</option>
                    <option value="DONG">Đã đóng</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-600 text-xs font-medium">Mức độ ưu tiên:</label>
                  <select
                    value={task.priority}
                    onChange={e => handlePriorityChange(e.target.value as Priority)}
                    className="w-full py-2 px-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="KHAN">🔴 Khẩn cấp (Xử lý ngay)</option>
                    <option value="CAO">🟠 Ưu tiên cao</option>
                    <option value="THUONG">🔵 Bình thường</option>
                    <option value="THAP">⚪ Thấp</option>
                  </select>
                </div>
              </div>

              {/* Urge / Reminder Box */}
              <div className="p-4 rounded-2xl border border-amber-200 bg-amber-50/50 space-y-2.5">
                <div className="flex items-center justify-between font-bold text-amber-950 text-xs">
                  <span>Lịch sử đôn đốc ({appStorage.getUrgeLogs().filter(u => u.taskId === task.id).length})</span>
                  <button
                    onClick={() => setShowUrgeInput(!showUrgeInput)}
                    className="text-amber-800 hover:text-amber-900 font-bold underline"
                  >
                    {showUrgeInput ? 'Đóng' : '+ Ghi nhận đôn đốc'}
                  </button>
                </div>

                {/* Urge Logs list */}
                <div className="space-y-1.5 max-h-36 overflow-y-auto">
                  {appStorage.getUrgeLogs().filter(u => u.taskId === task.id).map(log => (
                    <div key={log.id} className="p-2 bg-white rounded-lg border border-amber-200 text-[11px] flex items-start justify-between gap-2">
                      <div>
                        <div className="font-bold text-slate-800">{log.content}</div>
                        <div className="text-slate-400 text-[10px] mt-0.5">
                          {log.performedBy} · {log.method === 'DIEN_THOAI' ? 'Gọi điện' : log.method === 'ZALO_SMS' ? 'Zalo/SMS' : 'Trực tiếp'}
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          appStorage.deleteUrgeLog(log.id);
                          onUpdated();
                        }}
                        className="text-slate-400 hover:text-red-600 p-0.5"
                        title="Xóa nhật ký đôn đốc này"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>

                {showUrgeInput && (
                  <form onSubmit={handleSaveUrgeLog} className="space-y-2 pt-1 border-t border-amber-200">
                    <select
                      value={urgeMethod}
                      onChange={e => setUrgeMethod(e.target.value as any)}
                      className="w-full py-1.5 px-2 bg-white border border-amber-300 rounded-lg text-xs"
                    >
                      <option value="DIEN_THOAI">Gọi điện thoại</option>
                      <option value="ZALO_SMS">Nhắn Zalo / SMS</option>
                      <option value="TRUC_TIEP">Gặp trực tiếp</option>
                    </select>
                    <input
                      type="text"
                      value={urgeContent}
                      onChange={e => setUrgeContent(e.target.value)}
                      placeholder="Nội dung đã nhắc nhở..."
                      className="w-full p-2 bg-white border border-amber-300 rounded-lg text-xs"
                    />
                    <button
                      type="submit"
                      className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-xs shadow-xs"
                    >
                      Lưu lịch sử nhắc việc
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs">
          <div className="text-slate-500">
            Tạo bởi: <strong>{task.createdBy}</strong>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition-colors shadow-xs"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
