import React, { useState } from 'react';
import {
  Calendar,
  CheckCircle,
  FileText,
  MapPin,
  Phone,
  Search,
  Send,
  Sparkles,
  Upload,
  User,
  X
} from 'lucide-react';
import { SERVICE_CATEGORIES } from '../../mock/initialData';
import { appStorage } from '../../services/storage';
import { SupportFormat, SupportRequest, TargetGroup } from '../../types';
import { TargetGroupBadge } from '../common/StatusBadge';
import { Pagination } from '../common/Pagination';

interface CitizenPortalModalProps {
  onClose: () => void;
  onSuccessSubmit: (req: SupportRequest) => void;
}

export const CitizenPortalModal: React.FC<CitizenPortalModalProps> = ({ onClose, onSuccessSubmit }) => {
  const currentWard = appStorage.getSelectedWard();
  const [activeTab, setActiveTab] = useState<'FORM' | 'LOOKUP'>('FORM');

  // Form states
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [targetGroup, setTargetGroup] = useState<TargetGroup>('NGUOI_DAN');
  const [ward, setWard] = useState(`${currentWard.name}, ${currentWard.districtName}`);
  const [neighborhood, setNeighborhood] = useState('Tổ 1');
  const [address, setAddress] = useState('');
  const [needCategory, setNeedCategory] = useState(SERVICE_CATEGORIES[0]);
  const [content, setContent] = useState('');
  const [format, setFormat] = useState<SupportFormat>('TRUC_TIEP');
  const [preferredTime, setPreferredTime] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(true);

  // Success state
  const [submittedReq, setSubmittedReq] = useState<SupportRequest | null>(null);

  // Lookup state
  const [lookupQuery, setLookupQuery] = useState('');
  const [lookupResults, setLookupResults] = useState<SupportRequest[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [lookupPage, setLookupPage] = useState(1);
  const pageSize = 15;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !phone.trim() || !content.trim()) {
      alert('Vui lòng điền đủ Họ tên, Số điện thoại và Nội dung cần hỗ trợ!');
      return;
    }
    if (!termsAccepted) {
      alert('Vui lòng đồng ý cung cấp thông tin để Tổ CNSCĐ liên hệ hỗ trợ!');
      return;
    }

    const created = appStorage.createRequest({
      fullName: fullName.trim(),
      phone: phone.trim(),
      targetGroup,
      ward,
      neighborhood,
      address: address.trim(),
      needCategory,
      content: content.trim(),
      format,
      preferredTime: preferredTime.trim() || undefined,
      termsAccepted,
      assignedTeamId: 'TEAM-01'
    });

    setSubmittedReq(created);
    onSuccessSubmit(created);
  };

  const handleLookup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!lookupQuery.trim()) return;
    const all = appStorage.getRequests();
    const q = lookupQuery.trim().toLowerCase();
    const res = all.filter(r => r.code.toLowerCase().includes(q) || r.phone.includes(q));
    setLookupResults(res);
    setHasSearched(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-gradient-to-r from-blue-700 to-indigo-800 text-white flex items-start justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-xs text-amber-300 font-semibold mb-1">
              <Sparkles className="w-4 h-4" />
              <span>Cổng Dịch Vụ Công Dân & Tổ Chức</span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold">
              Gửi Yêu Cầu Hỗ Trợ Chuyển Đổi Số
            </h2>
            <p className="text-xs text-blue-100 mt-0.5">
              Tổ Công nghệ số cộng đồng sẽ tiếp nhận và liên hệ đồng hành trực tiếp miễn phí
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 text-blue-200 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-slate-200 bg-slate-50 text-xs font-bold">
          <button
            onClick={() => { setActiveTab('FORM'); setSubmittedReq(null); }}
            className={`flex-1 py-3 text-center border-b-2 flex items-center justify-center gap-2 ${
              activeTab === 'FORM' ? 'border-blue-600 text-blue-600 bg-white' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Gửi Yêu Cầu Mới</span>
          </button>

          <button
            onClick={() => setActiveTab('LOOKUP')}
            className={`flex-1 py-3 text-center border-b-2 flex items-center justify-center gap-2 ${
              activeTab === 'LOOKUP' ? 'border-blue-600 text-blue-600 bg-white' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Search className="w-4 h-4" />
            <span>Tra Cứu Tiến Độ Xử Lý</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 text-xs">
          {activeTab === 'FORM' ? (
            submittedReq ? (
              <div className="p-6 text-center space-y-4">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-md">
                  <CheckCircle className="w-10 h-10" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">
                  Gửi Yêu Cầu Hỗ Trợ Thành Công!
                </h3>
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl max-w-md mx-auto text-left space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Mã yêu cầu của bạn:</span>
                    <strong className="text-sm font-mono text-blue-700 bg-white px-2 py-0.5 rounded border border-blue-200">
                      {submittedReq.code}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500">Đối tượng: </span>
                    <strong className="text-slate-800">{submittedReq.fullName} ({submittedReq.phone})</strong>
                  </div>
                  <div>
                    <span className="text-slate-500">Nội dung: </span>
                    <span className="text-slate-800">{submittedReq.needCategory}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Đơn vị tiếp nhận: </span>
                    <strong className="text-blue-800">Tổ CNSCĐ {currentWard.name}, {currentWard.districtName}</strong>
                  </div>
                </div>

                <p className="text-slate-500 text-xs max-w-md mx-auto">
                  Bạn có thể lưu lại <strong>Mã yêu cầu</strong> hoặc dùng <strong>Số điện thoại</strong> để tra cứu tình trạng xử lý bất cứ lúc nào.
                </p>

                <div className="flex justify-center gap-3 pt-2">
                  <button
                    onClick={() => setSubmittedReq(null)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg"
                  >
                    Gửi yêu cầu khác
                  </button>
                  <button
                    onClick={onClose}
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-xs"
                  >
                    Đóng cửa sổ
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* 5 Nhóm đối tượng */}
                <div>
                  <label className="font-bold text-slate-800 block mb-1.5">
                    1. Bạn thuộc nhóm đối tượng nào? <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {[
                      { id: 'NGUOI_DAN', label: '1. Người dân' },
                      { id: 'HO_KINH_DOANH', label: '2. Hộ kinh doanh' },
                      { id: 'TIEU_THUONG', label: '3. Tiểu thương' },
                      { id: 'DOANH_NGHIEP', label: '4. Doanh nghiệp' },
                      { id: 'CAN_BO_CO_SO', label: '5. Cán bộ cơ sở' }
                    ].map(g => (
                      <button
                        type="button"
                        key={g.id}
                        onClick={() => setTargetGroup(g.id as TargetGroup)}
                        className={`p-2 rounded-lg border text-left font-medium transition-all ${
                          targetGroup === g.id
                            ? 'bg-blue-50 border-blue-600 text-blue-700 ring-2 ring-blue-100 font-bold'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {g.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Personal Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-800 block mb-1">
                      Họ và tên / Đơn vị <span className="text-red-500">*</span>:
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
                      <input
                        type="text"
                        required
                        placeholder="Nguyễn Văn A / Quầy tạp hóa..."
                        value={fullName}
                        onChange={e => setFullName(e.target.value)}
                        className="w-full pl-8 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-slate-800 block mb-1">
                      Số điện thoại liên hệ <span className="text-red-500">*</span>:
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
                      <input
                        type="tel"
                        required
                        placeholder="0901234567"
                        value={phone}
                        onChange={e => setPhone(e.target.value)}
                        className="w-full pl-8 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Location */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-800 block mb-1">
                      Phường/Xã:
                    </label>
                    <input
                      type="text"
                      value={ward}
                      onChange={e => setWard(e.target.value)}
                      className="w-full p-2 border border-slate-300 rounded-lg bg-slate-50 font-medium"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-800 block mb-1">
                      Khu phố / Thôn / Tổ dân phố:
                    </label>
                    <input
                      type="text"
                      value={neighborhood}
                      onChange={e => setNeighborhood(e.target.value)}
                      placeholder="VD: Tổ 1 - Khu phố 1"
                      className="w-full p-2 border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-800 block mb-1">
                    Địa chỉ chi tiết (Số nhà, đường / Số kiot chợ):
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
                    <input
                      type="text"
                      placeholder="VD: 123 Nguyễn Huệ / Kiot 20 Chợ Bến Nghé"
                      value={address}
                      onChange={e => setAddress(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>

                {/* Need Category & Format */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-800 block mb-1">
                      2. Nhóm nhu cầu dịch vụ số cần hỗ trợ:
                    </label>
                    <select
                      value={needCategory}
                      onChange={e => setNeedCategory(e.target.value)}
                      className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                    >
                      {SERVICE_CATEGORIES.map((cat, i) => (
                        <option key={i} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-slate-800 block mb-1">
                      Hình thức mong muốn:
                    </label>
                    <select
                      value={format}
                      onChange={e => setFormat(e.target.value as SupportFormat)}
                      className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                    >
                      <option value="TRUC_TIEP">Cán bộ đến hỗ trợ trực tiếp</option>
                      <option value="TRUC_TUYEN">Hướng dẫn trực tuyến (Zalo / Gọi video)</option>
                      <option value="DIEN_THOAI">Tư vấn qua điện thoại</option>
                      <option value="KHAC">Hình thức khác</option>
                    </select>
                  </div>
                </div>

                {/* Content */}
                <div>
                  <label className="font-bold text-slate-800 block mb-1">
                    3. Mô tả chi tiết nội dung cần hỗ trợ <span className="text-red-500">*</span>:
                  </label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Mô tả cụ thể khó khăn hoặc vướng mắc bạn đang gặp phải (ví dụ: máy báo lỗi gì, chưa biết tải ứng dụng nào...)"
                    value={content}
                    onChange={e => setContent(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Preferred time */}
                <div>
                  <label className="font-bold text-slate-800 block mb-1">
                    Khung thời gian thuận tiện nhất:
                  </label>
                  <input
                    type="text"
                    placeholder="VD: Buổi sáng từ 8h30 - 10h, hoặc cuối tuần..."
                    value={preferredTime}
                    onChange={e => setPreferredTime(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg"
                  />
                </div>

                {/* Agreement */}
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <label className="flex items-start gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={termsAccepted}
                      onChange={e => setTermsAccepted(e.target.checked)}
                      className="mt-0.5 w-4 h-4 text-blue-600 rounded"
                      required
                    />
                    <span className="text-[11px] text-slate-700 leading-normal">
                      Tôi đồng ý cung cấp thông tin liên hệ và địa chỉ trên để Tổ Công nghệ số cộng đồng phường xác minh và cử thành viên hỗ trợ theo đúng quy định.
                    </span>
                  </label>
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100 font-semibold"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg flex items-center gap-1.5 shadow-md"
                  >
                    <Send className="w-4 h-4" />
                    <span>Gửi Yêu Cầu Hỗ Trợ Ngay</span>
                  </button>
                </div>
              </form>
            )
          ) : (
            /* Tab 2: Tra cứu tiến độ */
            <div className="space-y-4">
              <form onSubmit={handleLookup} className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    placeholder="Nhập Mã yêu cầu (VD: YC-2026-0042) hoặc Số điện thoại..."
                    value={lookupQuery}
                    onChange={e => setLookupQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-medium"
                  />
                </div>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2.5 rounded-lg flex items-center gap-1"
                >
                  <Search className="w-4 h-4" />
                  <span>Tra cứu</span>
                </button>
              </form>

              {hasSearched && (
                <div className="space-y-3 pt-2">
                  <div className="text-xs font-semibold text-slate-500">
                    Tìm thấy {lookupResults.length} yêu cầu tương ứng:
                  </div>

                  {lookupResults
                    .slice((lookupPage - 1) * pageSize, lookupPage * pageSize)
                    .map(req => (
                    <div key={req.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-blue-700 bg-white px-2 py-0.5 rounded border border-blue-200">
                            {req.code}
                          </span>
                          <TargetGroupBadge group={req.targetGroup} compact />
                        </div>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          req.status === 'HOAN_THANH'
                            ? 'bg-emerald-100 text-emerald-800'
                            : req.status === 'DANG_XU_LY'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {req.status === 'CHO_TIEP_NHAN' && 'Chờ tiếp nhận'}
                          {req.status === 'DA_TIEP_NHAN' && 'Đã tiếp nhận'}
                          {req.status === 'DANG_XU_LY' && 'Đang xử lý hỗ trợ'}
                          {req.status === 'HOAN_THANH' && 'Hoàn thành'}
                          {req.status === 'CHO_BO_SUNG' && 'Cần bổ sung thông tin'}
                        </span>
                      </div>

                      <div className="font-bold text-slate-800">{req.needCategory}</div>
                      <p className="text-slate-600 line-clamp-2">{req.content}</p>

                      <div className="pt-2 border-t border-slate-200 text-[11px] text-slate-500 flex flex-wrap justify-between gap-2">
                        <span>Người yêu cầu: <strong>{req.fullName}</strong> ({req.phone})</span>
                        {req.assignedMemberName && (
                          <span className="text-blue-700 font-semibold">
                            Cán bộ phụ trách: {req.assignedMemberName}
                          </span>
                        )}
                        {req.convertedTaskCode && (
                          <span className="text-emerald-700 font-medium">
                            Mã nhiệm vụ: {req.convertedTaskCode}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}

                  {lookupResults.length > 0 && (
                    <Pagination
                      currentPage={lookupPage}
                      totalItems={lookupResults.length}
                      pageSize={pageSize}
                      onPageChange={setLookupPage}
                      itemName="yêu cầu"
                    />
                  )}

                  {lookupResults.length === 0 && (
                    <div className="p-8 text-center text-slate-400">
                      Không tìm thấy yêu cầu nào phù hợp với từ khóa "{lookupQuery}".
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
