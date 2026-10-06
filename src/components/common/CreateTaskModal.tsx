import React, { useState } from 'react';
import { AlertTriangle, Calendar, CheckSquare, Flame, Plus, Trash2, User, UserCheck, X } from 'lucide-react';
import { STEP_6_DEFINITIONS } from '../../mock/initialData';
import { appStorage } from '../../services/storage';
import { Priority, TargetGroup, Task, WorkGroup, WorkSource } from '../../types';
import { ConfirmDialog } from './ConfirmDialog';

interface CreateTaskModalProps {
  onClose: () => void;
  onCreated: (task: Task) => void;
  initialTask?: Task; // If provided, modal is in EDIT mode!
  initialTargetId?: string;
  initialRequestId?: string;
  onDeleted?: (taskId: string) => void;
}

export const CreateTaskModal: React.FC<CreateTaskModalProps> = ({
  onClose,
  onCreated,
  initialTask,
  initialTargetId,
  initialRequestId,
  onDeleted
}) => {
  const isEditMode = !!initialTask;
  const members = appStorage.getMembers();
  const targets = appStorage.getTargets();
  const requests = appStorage.getRequests();
  const currentUser = appStorage.getCurrentUser();
  const currentRole = appStorage.getCurrentRole();
  const isSuperAdmin = appStorage.isCurrentUserSuperAdmin();
  const isLeader = currentRole === 'LEADER' || isSuperAdmin;

  const selectedTarget = targets.find(t => t.id === (initialTask?.targetId || initialTargetId));
  const selectedReq = requests.find(r => r.id === (initialTask?.requestId || initialRequestId));

  // Form State
  const [title, setTitle] = useState(
    initialTask?.title ||
    (selectedReq ? `Hỗ trợ ${selectedReq.fullName} về ${selectedReq.needCategory}` : '')
  );
  const [description, setDescription] = useState(initialTask?.description || (selectedReq ? selectedReq.content : ''));
  const [source, setSource] = useState<WorkSource>(initialTask?.source || (selectedReq ? 'NGUOI_DAN_GUI' : 'TO_TU_TAO'));
  const [workGroup, setWorkGroup] = useState<WorkGroup>(initialTask?.workGroup || 'HO_TRO');
  const [priority, setPriority] = useState<Priority>(initialTask?.priority || 'THUONG');

  const [targetId, setTargetId] = useState(initialTask?.targetId || initialTargetId || '');
  // Leaders can assign to anyone; members can only assign to themselves
  const defaultAssigneeId = isLeader
    ? (initialTask?.primaryAssigneeId || members[0]?.id || '')
    : currentUser.id;
  const [primaryAssigneeId, setPrimaryAssigneeId] = useState(defaultAssigneeId);
  const [collaboratorIds, setCollaboratorIds] = useState<string[]>(initialTask?.collaboratorIds || []);

  const todayStr = new Date().toISOString().split('T')[0];
  const nextWeekStr = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const [startDate, setStartDate] = useState(initialTask?.startDate || todayStr);
  const [dueDate, setDueDate] = useState(initialTask?.dueDate || nextWeekStr);

  const [checklistItems, setChecklistItems] = useState<string[]>(
    initialTask?.checklist?.map(c => c.title) || [
      'Liên hệ và xác minh nhu cầu',
      'Thực hiện hỗ trợ và hướng dẫn thao tác',
      'Kiểm tra đối tượng tự thực hành',
      'Chụp ảnh bằng chứng & nghiệm thu kết quả'
    ]
  );
  const [newChecklistText, setNewChecklistText] = useState('');

  // Delete Confirmation Dialog
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleAddChecklist = (e: React.FormEvent) => {
    e.preventDefault();
    if (newChecklistText.trim()) {
      setChecklistItems([...checklistItems, newChecklistText.trim()]);
      setNewChecklistText('');
    }
  };

  const handleRemoveChecklist = (idx: number) => {
    setChecklistItems(checklistItems.filter((_, i) => i !== idx));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('Vui lòng nhập tên công việc!');
      return;
    }

    const targetObj = targets.find(t => t.id === targetId);
    const assigneeObj = members.find(m => m.id === primaryAssigneeId);
    const collabObjs = members.filter(m => collaboratorIds.includes(m.id));

    if (isEditMode && initialTask) {
      // EDIT MODE
      const updated: Task = {
        ...initialTask,
        title: title.trim(),
        description: description.trim(),
        source,
        workGroup,
        priority,
        targetId: targetObj?.id,
        targetName: targetObj?.name,
        targetPhone: targetObj?.phone,
        targetAddress: targetObj?.address,
        targetGroup: targetObj?.group,
        primaryAssigneeId: assigneeObj?.id || members[0]?.id || '',
        primaryAssigneeName: assigneeObj?.name || members[0]?.name || '',
        collaboratorIds,
        collaboratorNames: collabObjs.map(c => c.name),
        startDate,
        dueDate,
        checklist: checklistItems.map((itemText, i) => {
          const existing = initialTask.checklist?.find(c => c.title === itemText);
          return existing || {
            id: `chk-${Date.now()}-${i}`,
            title: itemText,
            completed: false
          };
        }),
        updatedAt: new Date().toISOString()
      };

      appStorage.updateTask(updated);
      onCreated(updated);
      return;
    }

    // CREATE MODE
    const steps = STEP_6_DEFINITIONS.map(def => ({
      stepNumber: def.stepNumber as 1 | 2 | 3 | 4 | 5 | 6,
      stepName: def.title,
      isCompleted: def.stepNumber === 1,
      completedAt: def.stepNumber === 1 ? new Date().toISOString() : undefined,
      completedBy: def.stepNumber === 1 ? currentUser.name : undefined,
      evaluation: def.stepNumber === 1 ? ('DAT' as const) : undefined
    }));

    const selectedWard = appStorage.getSelectedWard();
    const newTask = appStorage.createTask({
      title: title.trim(),
      description: description.trim(),
      source,
      workGroup,
      status: 'DA_GIAO',
      priority,
      targetId: targetObj?.id,
      targetName: targetObj?.name,
      targetPhone: targetObj?.phone,
      targetAddress: targetObj?.address,
      targetGroup: targetObj?.group,
      requestId: selectedReq?.id,
      requestCode: selectedReq?.code,
      ward: targetObj?.ward || selectedWard.name,
      teamId: `TEAM-${selectedWard.id}`,
      teamName: `Tổ CNSCĐ ${selectedWard.name}`,
      createdBy: currentUser.name,
      assignerName: currentUser.name,
      primaryAssigneeId: assigneeObj?.id || members[0]?.id || '',
      primaryAssigneeName: assigneeObj?.name || members[0]?.name || '',
      collaboratorIds,
      collaboratorNames: collabObjs.map(c => c.name),
      startDate,
      dueDate,
      currentStep: 2,
      steps,
      checklist: checklistItems.map((c, i) => ({
        id: `chk-${Date.now()}-${i}`,
        title: c,
        completed: false
      })),
      reminders: [
        {
          id: `rem-${Date.now()}`,
          date: dueDate,
          title: `Hạn chót hoàn thành: ${title.trim()}`,
          isTriggered: false,
          isDone: false
        }
      ],
      evidences: []
    });

    if (selectedReq) {
      selectedReq.status = 'DANG_XU_LY';
      selectedReq.convertedTaskId = newTask.id;
      selectedReq.convertedTaskCode = newTask.code;
      selectedReq.assignedMemberId = assigneeObj?.id;
      selectedReq.assignedMemberName = assigneeObj?.name;
      appStorage.updateRequest(selectedReq);
    }

    onCreated(newTask);
  };

  const handleConfirmDelete = () => {
    if (!initialTask) return;
    appStorage.deleteTask(initialTask.id);
    if (onDeleted) {
      onDeleted(initialTask.id);
    }
    setShowDeleteConfirm(false);
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
        <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-blue-100 animate-in zoom-in-95 duration-150">
          {/* Header Banner - Royal Blue Theme */}
          <div className="p-5 sm:p-6 bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-900 text-white flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/15 text-[11px] font-bold text-blue-100">
                <span>{isEditMode ? `MÃ CÔNG VIỆC: ${initialTask?.code}` : 'QUY TRÌNH 6 BƯỚC SỐ HÓA'}</span>
              </div>
              <h3 className="text-base sm:text-xl font-black tracking-tight">
                {isEditMode ? 'Chỉnh Sửa Thông Tin Công Việc' : 'Phiếu Giao / Tạo Công Việc Chuyển Đổi Số'}
              </h3>
              <p className="text-xs text-blue-100 font-normal">
                {isEditMode
                  ? 'Cập nhật nội dung nhiệm vụ, phân công người phụ trách và điều chỉnh tiến độ'
                  : 'Phân công nhiệm vụ theo quy trình 6 bước có hạn xử lý và danh mục việc con'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-5 text-xs">
            {/* Mục 1: Tiêu đề công việc */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-800 block text-xs">
                Tên công việc <span className="text-red-500">*</span>:
              </label>
              <input
                type="text"
                required
                placeholder="VD: Hướng dẫn Hộ kinh doanh A cài đặt hóa đơn điện tử máy tính tiền..."
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full text-xs sm:text-sm border border-slate-300 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 font-medium"
              />
            </div>

            {/* Mục 2: Nguồn & 5 Nhóm công việc */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="font-bold text-slate-800 block mb-1">Nguồn phát sinh:</label>
                <select
                  value={source}
                  onChange={e => setSource(e.target.value as WorkSource)}
                  className="w-full border border-slate-300 rounded-xl p-2.5 bg-white text-slate-700 font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                >
                  <option value="TO_TU_TAO">Tổ CNSCĐ chủ động khảo sát</option>
                  <option value="NGUOI_DAN_GUI">Người dân gửi từ Cổng Dân</option>
                  <option value="CAP_TREN_GIAO">UBND / Cấp trên giao</option>
                  <option value="DINH_KY">Nhiệm vụ định kỳ</option>
                  <option value="PHAT_SINH">Phát sinh trong quá trình hỗ trợ</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1">5 Nhóm công việc:</label>
                <select
                  value={workGroup}
                  onChange={e => setWorkGroup(e.target.value as WorkGroup)}
                  className="w-full border border-slate-300 rounded-xl p-2.5 bg-white text-slate-700 font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                >
                  <option value="PHAT_HIEN">1. Phát hiện nhu cầu</option>
                  <option value="HUONG_DAN">2. Hướng dẫn kỹ năng</option>
                  <option value="HO_TRO">3. Hỗ trợ trực tiếp (cầm tay chỉ việc)</option>
                  <option value="DON_DOC">4. Đôn đốc thực hiện</option>
                  <option value="THEO_DOI_KET_QUA">5. Theo dõi kết quả & nghiệm thu</option>
                </select>
              </div>
            </div>

            {/* Mục 3: Hồ sơ Đối tượng */}
            <div>
              <label className="font-bold text-slate-800 block mb-1">Gắn kết Hồ sơ Đối tượng:</label>
              <select
                value={targetId}
                onChange={e => setTargetId(e.target.value)}
                className="w-full border border-slate-300 rounded-xl p-2.5 bg-white text-slate-700 font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              >
                <option value="">-- Công việc chung / Chưa liên kết đối tượng cụ thể --</option>
                {targets.map(t => (
                  <option key={t.id} value={t.id}>
                    [{t.group}] {t.name} ({t.phone} - {t.neighborhood})
                  </option>
                ))}
              </select>
            </div>

            {/* Mục 4: Phân công Cán bộ & Mức ưu tiên */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="font-bold text-slate-800 block mb-1">
                  Người phụ trách chính <span className="text-red-500">*</span>:
                  {!isLeader && (
                    <span className="text-[11px] text-blue-600 font-normal ml-1">
                      (Thành viên chỉ giao việc cho chính mình)
                    </span>
                  )}
                </label>
                <select
                  value={primaryAssigneeId}
                  onChange={e => isLeader && setPrimaryAssigneeId(e.target.value)}
                  disabled={!isLeader}
                  className={`w-full border border-slate-300 rounded-xl p-2.5 font-medium ${
                    !isLeader
                      ? 'bg-slate-100 text-slate-700 cursor-not-allowed'
                      : 'bg-white text-slate-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600'
                  }`}
                  required
                >
                  {isLeader ? (
                    members.map(m => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.title} - Đang làm {m.activeTasksCount} việc)
                      </option>
                    ))
                  ) : (
                    <option value={currentUser.id}>
                      {currentUser.name} ({currentUser.title} - Chính mình)
                    </option>
                  )}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1">Mức độ ưu tiên:</label>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setPriority('KHAN')}
                    className={`p-2 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      priority === 'KHAN'
                        ? 'bg-red-600 text-white border-red-600 shadow-xs'
                        : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                    }`}
                  >
                    <Flame className="w-3.5 h-3.5" />
                    <span>Khẩn cấp</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPriority('CAO')}
                    className={`p-2 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      priority === 'CAO'
                        ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                        : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                    }`}
                  >
                    <span>Ưu tiên cao</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPriority('THUONG')}
                    className={`p-2 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      priority === 'THUONG'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
                    }`}
                  >
                    <span>Bình thường</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPriority('THAP')}
                    className={`p-2 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      priority === 'THAP'
                        ? 'bg-slate-700 text-white border-slate-700 shadow-xs'
                        : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                    }`}
                  >
                    <span>Thấp</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Mục 5: Thời hạn xử lý */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="font-bold text-slate-800 block mb-1">Ngày bắt đầu:</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl p-2.5 bg-white text-slate-700 font-medium"
                />
              </div>
              <div>
                <label className="font-bold text-slate-800 block mb-1">
                  Thời hạn hoàn thành <span className="text-red-500">*</span>:
                </label>
                <input
                  type="date"
                  required
                  value={dueDate}
                  onChange={e => setDueDate(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl p-2.5 bg-white text-slate-700 font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
              </div>
            </div>

            {/* Mục 6: Mô tả chi tiết */}
            <div>
              <label className="font-bold text-slate-800 block mb-1">Nội dung chi tiết & Hướng dẫn:</label>
              <textarea
                rows={2}
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Ghi rõ yêu cầu cụ thể, mục tiêu số hóa, địa điểm hỗ trợ..."
                className="w-full border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-xs sm:text-sm"
              />
            </div>

            {/* Mục 7: Danh sách việc con (Checklist) */}
            <div className="space-y-2">
              <label className="font-bold text-slate-800 block text-xs">
                Danh sách các bước kiểm tra (Checklist):
              </label>
              <div className="space-y-1.5">
                {checklistItems.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2.5 bg-blue-50/50 border border-blue-100 rounded-xl">
                    <span className="font-medium text-slate-800 text-xs">{idx + 1}. {item}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveChecklist(idx)}
                      className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded-lg transition-colors"
                      title="Xóa mục này"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex gap-2 pt-1">
                <input
                  type="text"
                  value={newChecklistText}
                  onChange={e => setNewChecklistText(e.target.value)}
                  placeholder="Thêm mục việc con..."
                  className="flex-1 border border-slate-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={handleAddChecklist}
                  className="bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold px-3.5 py-2 rounded-xl text-xs transition-colors border border-blue-200"
                >
                  + Thêm việc
                </button>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="pt-4 border-t border-slate-200 flex items-center justify-between gap-3">
              {isEditMode && (isLeader || initialTask?.createdBy === currentUser.name) ? (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-4 py-2.5 rounded-xl border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 font-bold text-xs flex items-center gap-1.5 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Xóa công việc</span>
                </button>
              ) : <div />}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-100 text-xs transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md text-xs flex items-center gap-1.5 transition-all active:scale-95"
                >
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                  <span>{isEditMode ? 'Lưu cập nhật' : 'Giao việc ngay'}</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Xóa công việc chuyển đổi số"
        message={`Bạn có chắc chắn muốn xóa vĩnh viễn công việc "${title}" (${initialTask?.code})? Tất cả dữ liệu đôn đốc và tiến trình liên quan sẽ bị xóa.`}
        confirmLabel="Xác nhận xóa công việc"
        cancelLabel="Giữ lại"
        isDestructive={true}
        onConfirm={handleConfirmDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </>
  );
};
