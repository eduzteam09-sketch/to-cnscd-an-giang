import React, { useState } from 'react';
import {
  AlertTriangle,
  Award,
  Building,
  CheckCircle,
  FileCheck,
  MapPin,
  Plus,
  Send,
  ShieldCheck,
  TrendingUp,
  Users
} from 'lucide-react';
import { INITIAL_TEAMS } from '../../mock/initialData';
import { appStorage } from '../../services/storage';
import { Priority, Task, WorkGroup } from '../../types';

interface SuperiorViewProps {
  onSelectTask: (task: Task) => void;
}

export const SuperiorView: React.FC<SuperiorViewProps> = ({ onSelectTask }) => {
  const tasks = appStorage.getTasks();
  const members = appStorage.getMembers();
  const requests = appStorage.getRequests();

  const [selectedWard, setSelectedWard] = useState('ALL');
  const [showAssignModal, setShowAssignModal] = useState(false);

  // New directive from superior form
  const [directiveTitle, setDirectiveTitle] = useState('');
  const [directiveTargetTeam, setDirectiveTargetTeam] = useState('TEAM-01');
  const [directiveDueDate, setDirectiveDueDate] = useState(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [directiveWorkGroup, setDirectiveWorkGroup] = useState<WorkGroup>('HUONG_DAN');
  const [directivePriority, setDirectivePriority] = useState<Priority>('CAO');
  const [directiveDesc, setDirectiveDesc] = useState('');

  // Teams with live calculations
  const teamsData = INITIAL_TEAMS.map(team => {
    const teamTasks = tasks.filter(t => t.teamId === team.id);
    const completed = teamTasks.filter(t => t.status === 'HOAN_THANH' || t.status === 'DONG').length;
    const overdue = teamTasks.filter(t => t.status === 'QUA_HAN').length;
    const rate = teamTasks.length > 0 ? Math.round((completed / teamTasks.length) * 100) : 85;

    return {
      ...team,
      currentTasks: teamTasks.length,
      completedTasks: completed,
      overdueTasks: overdue,
      currentRate: rate
    };
  });

  const handleSuperiorAssign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!directiveTitle.trim()) return;

    const targetTeam = INITIAL_TEAMS.find(t => t.id === directiveTargetTeam);
    const leader = members.find(m => m.teamId === directiveTargetTeam && m.role === 'LEADER') || members[0];

    const newTask = appStorage.createTask({
      title: `[CẤP TRÊN GIAO] ${directiveTitle.trim()}`,
      description: directiveDesc.trim() || 'Chỉ đạo trực tiếp từ UBND Phường yêu cầu Tổ trưởng phân công triển khai ngay.',
      source: 'CAP_TREN_GIAO',
      workGroup: directiveWorkGroup,
      status: 'DA_GIAO',
      priority: directivePriority,
      ward: targetTeam?.ward || 'Phường Bến Nghé, Quận 1',
      teamId: directiveTargetTeam,
      teamName: targetTeam?.name || 'Tổ CNSCĐ',
      createdBy: 'Chủ tịch UBND Phường',
      assignerName: 'UBND Phường Bến Nghé',
      primaryAssigneeId: leader.id,
      primaryAssigneeName: leader.name,
      collaboratorIds: [],
      collaboratorNames: [],
      startDate: new Date().toISOString().split('T')[0],
      dueDate: directiveDueDate,
      currentStep: 2,
      steps: [
        { stepNumber: 1, stepName: 'Tiếp nhận chỉ đạo', isCompleted: true, completedAt: new Date().toISOString(), completedBy: 'UBND Phường' },
        { stepNumber: 2, stepName: 'Khảo sát & Phân công', isCompleted: false },
        { stepNumber: 3, stepName: 'Triển khai diện rộng', isCompleted: false },
        { stepNumber: 4, stepName: 'Kiểm tra & Nghiệm thu', isCompleted: false },
        { stepNumber: 5, stepName: 'Báo cáo cấp trên', isCompleted: false },
        { stepNumber: 6, stepName: 'Lưu trữ hồ sơ số', isCompleted: false }
      ],
      checklist: [
        { id: `c-${Date.now()}-1`, title: 'Họp Tổ phân công chỉ tiêu cụ thể', completed: false },
        { id: `c-${Date.now()}-2`, title: 'Triển khai hỗ trợ trực tiếp đến từng hộ/tiểu thương', completed: false },
        { id: `c-${Date.now()}-3`, title: 'Tổng hợp số liệu & báo cáo kết quả về UBND', completed: false }
      ],
      reminders: [],
      evidences: []
    });

    setShowAssignModal(false);
    setDirectiveTitle('');
    setDirectiveDesc('');
    alert(`Đã ban hành nhiệm vụ chỉ đạo [${newTask.code}] xuống ${targetTeam?.name}!`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 to-blue-950 p-6 rounded-2xl text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-amber-300 font-bold mb-1">
            <Building className="w-4 h-4" />
            <span>UBND Phường Bến Nghé - Ban Chỉ Đạo Chuyển Đổi Số</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black">
            Bảng Điều Hành & Chỉ Đạo Cấp Xã / Phường
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            Giám sát đồng thời các Tổ CNSCĐ địa bàn, giao việc chỉ đạo và đánh giá thi đua theo thời gian thực
          </p>
        </div>

        <button
          onClick={() => setShowAssignModal(true)}
          className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-lg transition-transform active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Ban hành chỉ đạo xuống Tổ</span>
        </button>
      </div>

      {/* Ward KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-slate-500">Quy mô mạng lưới:</span>
          <div className="text-2xl font-black text-slate-900 mt-1">4 Tổ CNSCĐ</div>
          <span className="text-[11px] text-blue-600 font-medium">32 thành viên nòng cốt</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-slate-500">Tổng công việc toàn phường:</span>
          <div className="text-2xl font-black text-blue-700 mt-1">{tasks.length}</div>
          <span className="text-[11px] text-slate-500">{requests.length} yêu cầu dân</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-slate-500">Tỷ lệ hoàn thành trung bình:</span>
          <div className="text-2xl font-black text-emerald-700 mt-1">87%</div>
          <span className="text-[11px] text-emerald-600 font-medium">Đạt mục tiêu quý 3</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-slate-500">Tổng việc chậm trễ / quá hạn:</span>
          <div className="text-2xl font-black text-red-600 mt-1">
            {tasks.filter(t => t.status === 'QUA_HAN').length}
          </div>
          <span className="text-[11px] text-red-600 font-medium">Cần đôn đốc Tổ trưởng</span>
        </div>
      </div>

      {/* Table: So sánh tiến độ các Tổ trên địa bàn (Mục 19) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500" />
              <span>Bảng Đánh Giá Thi Đua & Tiến Độ Giữa Các Tổ CNSCĐ</span>
            </h3>
            <p className="text-xs text-slate-500">
              Chỉ số tỷ lệ hoàn thành, số việc quá hạn và số lượng thành viên thực chiến
            </p>
          </div>
        </div>

        <div className="overflow-x-auto text-xs">
          <table className="w-full text-left divide-y divide-slate-200">
            <thead className="bg-slate-50 font-bold text-slate-700 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Tên Tổ CNSCĐ</th>
                <th className="py-3 px-4">Tổ trưởng</th>
                <th className="py-3 px-4">Địa bàn phụ trách</th>
                <th className="py-3 px-4 text-center">Quân số</th>
                <th className="py-3 px-4 text-center">Việc đang làm</th>
                <th className="py-3 px-4 text-center">Quá hạn</th>
                <th className="py-3 px-4">Tiến độ hoàn thành</th>
                <th className="py-3 px-4 text-center">Xếp loại thi đua</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {teamsData.map((team, idx) => (
                <tr key={team.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-slate-900 whitespace-nowrap">
                    {team.name}
                  </td>
                  <td className="py-3.5 px-4 text-slate-700 font-semibold whitespace-nowrap">
                    {team.leaderName}
                  </td>
                  <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                    {(team.coveredNeighborhoods || []).join(', ') || 'Toàn bộ địa bàn'}
                  </td>
                  <td className="py-3.5 px-4 text-center font-bold text-slate-700">
                    {team.memberCount || team.totalMembers || 3} đ/c
                  </td>
                  <td className="py-3.5 px-4 text-center font-bold text-blue-700">
                    {team.currentTasks}
                  </td>
                  <td className="py-3.5 px-4 text-center font-bold">
                    <span className={team.overdueTasks > 0 ? 'text-red-600' : 'text-slate-400'}>
                      {team.overdueTasks}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-slate-200 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-emerald-600 h-full rounded-full"
                          style={{ width: `${team.currentRate}%` }}
                        />
                      </div>
                      <span className="font-bold text-emerald-700">{team.currentRate}%</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-center whitespace-nowrap">
                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                      idx === 0
                        ? 'bg-amber-100 text-amber-900 border border-amber-300'
                        : team.overdueTasks > 0
                        ? 'bg-red-100 text-red-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {idx === 0 ? '★ Dẫn đầu' : team.overdueTasks > 0 ? 'Cần cải thiện' : 'Hoàn thành tốt'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Cấp trên ban hành chỉ đạo */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-5 space-y-4 border border-slate-200 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-base font-bold text-slate-900">
                Ban Hành Chỉ Đạo Từ Cấp Xã / Phường Xuống Tổ
              </h3>
              <button onClick={() => setShowAssignModal(false)} className="text-slate-400 hover:text-slate-700">
                ✕
              </button>
            </div>

            <form onSubmit={handleSuperiorAssign} className="space-y-3">
              <div>
                <label className="font-bold text-slate-800 block mb-1">
                  Đơn vị tiếp nhận chỉ đạo <span className="text-red-500">*</span>:
                </label>
                <select
                  value={directiveTargetTeam}
                  onChange={e => setDirectiveTargetTeam(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2 bg-white"
                >
                  {INITIAL_TEAMS.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.name} (Tổ trưởng: {t.leaderName})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1">
                  Nội dung chỉ đạo nhiệm vụ <span className="text-red-500">*</span>:
                </label>
                <input
                  type="text"
                  required
                  placeholder="VD: Cao điểm kích hoạt chữ ký số cá nhân cho toàn bộ hộ kinh doanh..."
                  value={directiveTitle}
                  onChange={e => setDirectiveTitle(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-800 block mb-1">Nhóm công việc:</label>
                  <select
                    value={directiveWorkGroup}
                    onChange={e => setDirectiveWorkGroup(e.target.value as any)}
                    className="w-full border border-slate-300 rounded-lg p-2 bg-white"
                  >
                    <option value="HUONG_DAN">2. Hướng dẫn</option>
                    <option value="HO_TRO">3. Hỗ trợ</option>
                    <option value="DON_DOC">4. Đôn đốc</option>
                    <option value="THEO_DOI_KET_QUA">5. Theo dõi kết quả</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-800 block mb-1">Mức độ ưu tiên:</label>
                  <select
                    value={directivePriority}
                    onChange={e => setDirectivePriority(e.target.value as any)}
                    className="w-full border border-slate-300 rounded-lg p-2 bg-white"
                  >
                    <option value="KHAN">Khẩn cấp</option>
                    <option value="CAO">Ưu tiên cao</option>
                    <option value="THUONG">Bình thường</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1">
                  Thời hạn hoàn thành & Báo cáo <span className="text-red-500">*</span>:
                </label>
                <input
                  type="date"
                  required
                  value={directiveDueDate}
                  onChange={e => setDirectiveDueDate(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2"
                />
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1">Chỉ đạo chi tiết / Yêu cầu kết quả:</label>
                <textarea
                  rows={2}
                  placeholder="Ghi rõ chỉ tiêu số lượng (ví dụ: đạt ít nhất 80% hộ kinh doanh trên tuyến phố...)"
                  value={directiveDesc}
                  onChange={e => setDirectiveDesc(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="px-3 py-1.5 border border-slate-300 rounded-lg text-slate-700"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-lg shadow-xs"
                >
                  Ban hành ngay
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
