import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  Building,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock,
  Compass,
  FileCheck,
  Globe,
  HelpCircle,
  LogIn,
  MapPin,
  Package,
  Phone,
  QrCode,
  Search,
  Send,
  Shield,
  Smartphone,
  Sparkles,
  Store,
  UserCheck,
  Users
} from 'lucide-react';
import { SERVICE_CATEGORIES } from '../../mock/initialData';
import { AN_GIANG_WARDS_102 } from '../../mock/anGiangData';
import { appStorage } from '../../services/storage';
import { SupportRequest, TargetGroup, WardInfo } from '../../types';

interface CitizenPortalViewProps {
  onSwitchToStaff?: () => void;
  hideStaffButton?: boolean;
}

export const CitizenPortalView: React.FC<CitizenPortalViewProps> = ({
  onSwitchToStaff,
  hideStaffButton = true
}) => {
  const [activeTab, setActiveTab] = useState<'SEND_REQUEST' | 'TRACK_REQUEST'>('SEND_REQUEST');

  // Form State
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [targetGroup, setTargetGroup] = useState<TargetGroup>('NGUOI_DAN');
  const [selectedWard, setSelectedWard] = useState<WardInfo>(AN_GIANG_WARDS_102[0]);
  const [wardSearchQuery, setWardSearchQuery] = useState('');
  const [isWardDropdownOpen, setIsWardDropdownOpen] = useState(false);
  const [address, setAddress] = useState('');
  const [needCategory, setNeedCategory] = useState(SERVICE_CATEGORIES[0]);
  const [content, setContent] = useState('');
  const [format, setFormat] = useState<'TRUC_TIEP' | 'TRUC_TUYEN' | 'DIEN_THOAI'>('TRUC_TIEP');
  const [preferredTime, setPreferredTime] = useState('Buổi sáng từ 8h30 - 10h30');
  const [termsAccepted, setTermsAccepted] = useState(true);

  // Filter 102 Wards of An Giang
  const filteredWards = useMemo(() => {
    if (!wardSearchQuery.trim()) return AN_GIANG_WARDS_102;
    const q = wardSearchQuery.toLowerCase().trim();
    return AN_GIANG_WARDS_102.filter(w =>
      w.name.toLowerCase().includes(q) ||
      (w.districtName && w.districtName.toLowerCase().includes(q))
    );
  }, [wardSearchQuery]);

  // Success State
  const [submittedRequest, setSubmittedRequest] = useState<SupportRequest | null>(null);

  // Tracking State
  const [trackQuery, setTrackQuery] = useState('');
  const [trackedRequests, setTrackedRequests] = useState<SupportRequest[] | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  // Quick categories with icons
  const CATEGORY_ITEMS = [
    { name: 'Số hóa doanh nghiệp', icon: Building, desc: 'Văn phòng số, quy trình nội bộ, chữ ký số' },
    { name: 'Số hóa sản phẩm', icon: Package, desc: 'Mã QR truy xuất nguồn gốc, OCOP, tem nhãn số' },
    { name: 'Tạo kênh cửa hàng số O2O', icon: Store, desc: 'Bán hàng đa kênh Online kết hợp Offline' },
    { name: 'Xây dựng nền tảng website', icon: Globe, desc: 'Website giới thiệu cơ sở, bán hàng trực tuyến' },
    { name: 'NetID dành cho cá nhân', icon: Shield, desc: 'Tài khoản định danh số cá nhân, xác thực sinh trắc' },
    { name: 'Chuyển đổi số doanh nghiệp', icon: Sparkles, desc: 'Tư vấn giải pháp quản trị & tự động hóa' },
    { name: 'Định danh điện tử VNeID & NetID', icon: Smartphone, desc: 'Kích hoạt VNeID mức 2, bảo hiểm, BHYT' },
    { name: 'Dịch vụ công trực tuyến & Hồ sơ số', icon: FileCheck, desc: 'Đổi bằng lái, khai sinh, thủ tục công' },
    { name: 'Thanh toán số & Hóa đơn điện tử', icon: QrCode, desc: 'Mã VietQR để bàn, hóa đơn máy tính tiền' },
    { name: 'Nhu cầu chuyển đổi số khác', icon: HelpCircle, desc: 'Các khó khăn công nghệ khác của bà con' }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !phone.trim() || !content.trim()) {
      alert('Vui lòng điền đầy đủ Họ tên, Số điện thoại và Nội dung yêu cầu.');
      return;
    }

    const newReq = appStorage.createRequest({
      fullName: fullName.trim(),
      phone: phone.trim(),
      targetGroup,
      ward: selectedWard.name,
      neighborhood: selectedWard.name,
      address: address.trim() || `Tại địa bàn ${selectedWard.name}`,
      needCategory,
      content: content.trim(),
      format,
      preferredTime,
      termsAccepted
    });

    setSubmittedRequest(newReq);
    // Reset form fields
    setContent('');
  };

  const handleSearchTracking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackQuery.trim()) return;

    const allRequests = appStorage.getRequests();
    const q = trackQuery.trim().toLowerCase();

    const results = allRequests.filter(r =>
      r.code.toLowerCase().includes(q) ||
      r.phone.includes(q) ||
      r.fullName.toLowerCase().includes(q)
    );

    setTrackedRequests(results);
    setHasSearched(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-800">
      {/* Top Banner / Header dành riêng cho người dân */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black shadow-sm">
              <Compass className="w-6 h-6" />
            </div>
            <div>
              <div className="text-[11px] font-bold tracking-wider uppercase text-blue-700">
                ỦY BAN NHÂN DÂN TỈNH AN GIANG · ĐIỀU HÀNH 102 PHƯỜNG/XÃ
              </div>
              <h1 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                Cổng Hỗ Trợ Chuyển Đổi Số Người Dân & Doanh Nghiệp Cơ Sở
              </h1>
            </div>
          </div>

          {/* Hotline & Nút dành cho cán bộ tổ CNSCĐ (Ẩn trên trang cổng công dân) */}
          <div className="flex items-center gap-2">
            <a
              href="tel:0905123456"
              className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-blue-700 font-medium px-3 py-1.5 rounded-lg border border-slate-200"
            >
              <Phone className="w-3.5 h-3.5 text-emerald-600" />
              <span>Hotline: 0905 123 456</span>
            </a>

            {!hideStaffButton && onSwitchToStaff && (
              <button
                onClick={onSwitchToStaff}
                className="flex items-center gap-1.5 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-3 py-1.5 rounded-lg transition-colors border border-slate-300"
                title="Dành riêng cho cán bộ quản lý và thành viên Tổ CNSCĐ"
              >
                <LogIn className="w-3.5 h-3.5 text-blue-600" />
                <span className="hidden sm:inline">Dành cho</span> Cán bộ Tổ
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* Hero Welcome Message */}
        <div className="bg-gradient-to-br from-blue-700 via-indigo-700 to-blue-900 text-white p-6 sm:p-8 rounded-3xl shadow-sm space-y-3">
          <div className="inline-flex items-center gap-2 bg-white/15 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-xs">
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>Phục vụ miễn phí tận tình · Cầm tay chỉ việc</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
            Bạn cần hỗ trợ gì về Công Nghệ & Chuyển Đổi Số?
          </h2>
          <p className="text-sm sm:text-base text-blue-100 max-w-2xl font-normal leading-relaxed">
            Tổ Công nghệ số cộng đồng sẵn sàng đến tận nhà, sạp chợ hoặc doanh nghiệp để hướng dẫn thực tế về số hóa sản phẩm, tạo kênh bán hàng O2O, NetID, hóa đơn số và dịch vụ công.
          </p>

          {/* Tab Selector Buttons */}
          <div className="pt-2 flex flex-wrap gap-2">
            <button
              onClick={() => {
                setActiveTab('SEND_REQUEST');
                setSubmittedRequest(null);
              }}
              className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 shadow-xs ${
                activeTab === 'SEND_REQUEST'
                  ? 'bg-white text-blue-900 shadow-md'
                  : 'bg-white/10 hover:bg-white/20 text-white'
              }`}
            >
              <Send className="w-4 h-4" />
              <span>1. Gửi Yêu Cầu Hỗ Trợ Mới</span>
            </button>

            <button
              onClick={() => setActiveTab('TRACK_REQUEST')}
              className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 shadow-xs ${
                activeTab === 'TRACK_REQUEST'
                  ? 'bg-white text-blue-900 shadow-md'
                  : 'bg-white/10 hover:bg-white/20 text-white'
              }`}
            >
              <Search className="w-4 h-4" />
              <span>2. Tra Cứu Tiến Độ Đã Gửi</span>
            </button>
          </div>
        </div>

        {/* TAB 1: FORM GỬI YÊU CẦU HỖ TRỢ */}
        {activeTab === 'SEND_REQUEST' && !submittedRequest && (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 sm:p-8 space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h3 className="text-lg font-bold text-slate-900">
                Phiếu Đăng Ký Yêu Cầu Hỗ Trợ Chuyển Đổi Số
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Vui lòng cung cấp thông tin để Tổ CNSCĐ phân công cán bộ liên hệ và đến hỗ trợ bạn nhanh nhất.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 text-xs sm:text-sm">
              {/* Bước 1: Chọn nhóm nhu cầu chuyển đổi số (Theo yêu cầu mới) */}
              <div className="space-y-3">
                <label className="block text-sm font-bold text-slate-900">
                  1. Chọn nhóm nhu cầu cần hỗ trợ <span className="text-red-500">*</span>:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {CATEGORY_ITEMS.map((item) => {
                    const isSelected = needCategory === item.name;
                    const IconComponent = item.icon;
                    return (
                      <button
                        type="button"
                        key={item.name}
                        onClick={() => setNeedCategory(item.name)}
                        className={`p-3.5 rounded-2xl border text-left flex items-start gap-3 transition-all ${
                          isSelected
                            ? 'border-blue-600 bg-blue-50/60 ring-2 ring-blue-500/20 shadow-xs'
                            : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 bg-white'
                        }`}
                      >
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                            isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          <IconComponent className="w-5 h-5" />
                        </div>
                        <div className="space-y-0.5">
                          <div
                            className={`font-bold text-xs sm:text-sm ${
                              isSelected ? 'text-blue-900' : 'text-slate-800'
                            }`}
                          >
                            {item.name}
                          </div>
                          <div className="text-[11px] text-slate-500 leading-tight">{item.desc}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Bước 2: Nhóm đối tượng */}
              <div className="space-y-2">
                <label className="block text-sm font-bold text-slate-900">
                  2. Bạn thuộc nhóm đối tượng nào?
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {[
                    { id: 'NGUOI_DAN', label: 'Người dân' },
                    { id: 'HO_KINH_DOANH', label: 'Hộ kinh doanh' },
                    { id: 'TIEU_THUONG', label: 'Tiểu thương' },
                    { id: 'DOANH_NGHIEP', label: 'Doanh nghiệp' },
                    { id: 'CAN_BO_CO_SO', label: 'Cán bộ cơ sở' }
                  ].map(t => (
                    <button
                      type="button"
                      key={t.id}
                      onClick={() => setTargetGroup(t.id as TargetGroup)}
                      className={`py-2.5 px-3 rounded-xl border text-center font-bold text-xs transition-colors ${
                        targetGroup === t.id
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Bước 3: Thông tin liên hệ */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block font-bold text-slate-800 text-xs">
                    Họ và tên người yêu cầu / Tên cơ sở <span className="text-red-500">*</span>:
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="VD: Nguyễn Văn An hoặc Cửa hàng An Khang"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-xs sm:text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block font-bold text-slate-800 text-xs">
                    Số điện thoại liên hệ <span className="text-red-500">*</span>:
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="VD: 0912 345 678 (Dùng tra cứu tiến độ)"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-xs sm:text-sm"
                  />
                </div>
              </div>

              {/* Địa bàn & Địa chỉ */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5 relative">
                  <label className="block font-bold text-slate-800 text-xs">
                    Phường / Xã <span className="text-red-500">*</span>:
                  </label>
                  
                  {/* Combobox Trigger Button */}
                  <div
                    onClick={() => setIsWardDropdownOpen(!isWardDropdownOpen)}
                    className={`w-full px-3.5 py-2.5 rounded-xl border bg-white text-xs sm:text-sm flex items-center justify-between cursor-pointer transition-all shadow-2xs ${
                      isWardDropdownOpen ? 'border-blue-600 ring-2 ring-blue-500/20' : 'border-slate-300 hover:border-blue-400'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <MapPin className="w-4 h-4 text-blue-600 shrink-0" />
                      <span className="font-bold text-slate-900 truncate">
                        {selectedWard.name}
                      </span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 shrink-0">
                        {selectedWard.unitType === 'PHUONG' ? 'Phường' : selectedWard.unitType === 'DAC_KHU' ? 'Đặc khu' : 'Xã'}
                      </span>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isWardDropdownOpen ? 'rotate-180 text-blue-600' : ''}`} />
                  </div>

                  {/* Dropdown Menu with Search Input */}
                  {isWardDropdownOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsWardDropdownOpen(false)}
                      />
                      <div className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-2xl shadow-2xl border border-blue-100 z-50 p-2.5 space-y-2 animate-in fade-in zoom-in-95 duration-100">
                        <div className="relative">
                          <Search className="w-4 h-4 text-blue-600 absolute left-3 top-2.5" />
                          <input
                            type="text"
                            autoFocus
                            value={wardSearchQuery}
                            onChange={e => setWardSearchQuery(e.target.value)}
                            placeholder="Nhập tên phường/xã để tìm kiếm..."
                            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                          />
                        </div>

                        <div className="text-[11px] text-slate-500 px-1 flex items-center justify-between font-medium">
                          <span>{filteredWards.length} / 102 phường, xã tỉnh An Giang</span>
                          {wardSearchQuery && (
                            <button
                              type="button"
                              onClick={() => setWardSearchQuery('')}
                              className="text-blue-600 hover:underline text-[11px] font-bold"
                            >
                              Xóa lọc
                            </button>
                          )}
                        </div>

                        <div className="max-h-56 overflow-y-auto space-y-1">
                          {filteredWards.map(w => {
                            const isSelected = selectedWard.id === w.id;
                            return (
                              <button
                                type="button"
                                key={w.id}
                                onClick={() => {
                                  setSelectedWard(w);
                                  setIsWardDropdownOpen(false);
                                  setWardSearchQuery('');
                                }}
                                className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition-colors ${
                                  isSelected
                                    ? 'bg-blue-600 text-white font-bold'
                                    : 'hover:bg-blue-50 text-slate-700'
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                    isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                                  }`}>
                                    {w.unitType === 'PHUONG' ? 'Phường' : w.unitType === 'DAC_KHU' ? 'Đặc khu' : 'Xã'}
                                  </span>
                                  <span>{w.name}</span>
                                </div>
                                {isSelected && <Check className="w-4 h-4 text-white" />}
                              </button>
                            );
                          })}
                          {filteredWards.length === 0 && (
                            <div className="py-6 text-center text-slate-400 text-xs">
                              Không tìm thấy phường/xã nào khớp với "{wardSearchQuery}"
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="block font-bold text-slate-800 text-xs">Địa chỉ cụ thể:</label>
                  <input
                    type="text"
                    placeholder="Số nhà, tên đường, số sạp chợ..."
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-xs sm:text-sm"
                  />
                </div>
              </div>

              {/* Nội dung chi tiết */}
              <div className="space-y-1.5">
                <label className="block font-bold text-slate-800 text-xs">
                  Mô tả cụ thể nội dung bạn cần hỗ trợ <span className="text-red-500">*</span>:
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Ví dụ: Tôi muốn tư vấn mở kênh bán hàng O2O, kết nối sản phẩm lên website và làm mã QR thanh toán để bàn..."
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-xs sm:text-sm"
                />
              </div>

              {/* Hình thức & Thời gian */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block font-bold text-slate-800 text-xs">Hình thức mong muốn:</label>
                  <div className="flex gap-2">
                    {[
                      { id: 'TRUC_TIEP', label: 'Cán bộ đến tận nơi' },
                      { id: 'TRUC_TUYEN', label: 'Qua Zalo / Video' },
                      { id: 'DIEN_THOAI', label: 'Gọi điện thoại' }
                    ].map(f => (
                      <button
                        type="button"
                        key={f.id}
                        onClick={() => setFormat(f.id as any)}
                        className={`flex-1 py-2 px-2 rounded-xl border text-center text-xs font-semibold ${
                          format === f.id
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block font-bold text-slate-800 text-xs">Khung giờ hẹn thuận tiện:</label>
                  <select
                    value={preferredTime}
                    onChange={e => setPreferredTime(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-xs sm:text-sm"
                  >
                    <option value="Buổi sáng từ 8h30 - 10h30">Buổi sáng từ 8h30 - 10h30</option>
                    <option value="Buổi chiều từ 14h00 - 16h30">Buổi chiều từ 14h00 - 16h30</option>
                    <option value="Buổi tối từ 19h00 - 20h30">Buổi tối từ 19h00 - 20h30</option>
                    <option value="Thứ Bảy / Chủ Nhật">Cuối tuần (Thứ 7 / Chủ Nhật)</option>
                    <option value="Bất kỳ lúc nào cán bộ rảnh">Bất kỳ lúc nào thuận tiện</option>
                  </select>
                </div>
              </div>

              {/* Cam kết */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-2">
                <input
                  type="checkbox"
                  id="citizen-terms"
                  checked={termsAccepted}
                  onChange={e => setTermsAccepted(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <label htmlFor="citizen-terms" className="text-xs text-slate-600 select-none">
                  Tôi xác nhận thông tin trên là chính xác và đồng ý để Tổ CNSCĐ liên hệ hỗ trợ.
                </label>
              </div>

              {/* Nút gửi */}
              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="w-full sm:w-auto px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm sm:text-base rounded-2xl shadow-md transition-all active:scale-98 flex items-center justify-center gap-2"
                >
                  <Send className="w-5 h-5" />
                  <span>Gửi Yêu Cầu Đến Tổ CNSCĐ</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* THÔNG BÁO GỬI THÀNH CÔNG VỚI MÃ TRA CỨU */}
        {submittedRequest && (
          <div className="bg-white rounded-3xl border border-emerald-200 shadow-sm p-6 sm:p-8 space-y-6 text-center">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-1">
              <h3 className="text-xl sm:text-2xl font-black text-slate-900">
                Gửi Yêu Cầu Hỗ Trợ Thành Công!
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
                Cảm ơn bạn. Yêu cầu của bạn đã được chuyển tới Tổ trưởng Tổ CNSCĐ để phân công cán bộ chuyên trách liên hệ hỗ trợ.
              </p>
            </div>

            {/* Thẻ mã tra cứu */}
            <div className="bg-slate-50 border-2 border-dashed border-blue-300 rounded-2xl p-5 max-w-md mx-auto space-y-2">
              <div className="text-xs text-slate-500 font-medium">MÃ TRA CỨU TIẾN ĐỘ CỦA BẠN:</div>
              <div className="text-2xl sm:text-3xl font-black text-blue-700 tracking-wider">
                {submittedRequest.code}
              </div>
              <div className="text-[11px] text-slate-500">
                Bạn có thể chụp lại màn hình hoặc dùng chính Số điện thoại ({submittedRequest.phone}) để kiểm tra tiến độ xử lý.
              </div>
            </div>

            <div className="flex flex-wrap justify-center gap-3 pt-2">
              <button
                onClick={() => {
                  setTrackQuery(submittedRequest.code);
                  setActiveTab('TRACK_REQUEST');
                  setTrackedRequests([submittedRequest]);
                  setHasSearched(true);
                  setSubmittedRequest(null);
                }}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs sm:text-sm transition-all"
              >
                Tra cứu tiến độ ngay
              </button>

              <button
                onClick={() => setSubmittedRequest(null)}
                className="px-6 py-2.5 border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold rounded-xl text-xs sm:text-sm"
              >
                Gửi thêm yêu cầu khác
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: TRA CỨU TIẾN ĐỘ XỬ LÝ (DÀNH CHO NGƯỜI DÂN) */}
        {activeTab === 'TRACK_REQUEST' && (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 sm:p-8 space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h3 className="text-lg font-bold text-slate-900">
                Tra Cứu Tiến Độ Xử Lý Yêu Cầu Hỗ Trợ
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Nhập Mã yêu cầu (VD: YC-2026-0042) hoặc Số điện thoại đã đăng ký để kiểm tra trạng thái và cán bộ phụ trách.
              </p>
            </div>

            {/* Form Tra cứu */}
            <form onSubmit={handleSearchTracking} className="flex gap-2 max-w-xl">
              <div className="relative flex-1">
                <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  placeholder="Nhập Mã yêu cầu hoặc Số điện thoại của bạn..."
                  value={trackQuery}
                  onChange={e => setTrackQuery(e.target.value)}
                  className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-xs sm:text-sm font-medium"
                />
              </div>
              <button
                type="submit"
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs sm:text-sm shadow-xs transition-colors"
              >
                Tra cứu
              </button>
            </form>

            {/* Kết quả Tra cứu */}
            {hasSearched && (
              <div className="space-y-4 pt-2">
                {trackedRequests && trackedRequests.length > 0 ? (
                  <div className="space-y-4">
                    <div className="text-xs font-bold text-slate-600">
                      Tìm thấy {trackedRequests.length} hồ sơ yêu cầu:
                    </div>

                    {trackedRequests.map(req => {
                      // Determine status stage
                      const isCompleted = req.status === 'HOAN_THANH';
                      const isInProgress = req.status === 'DANG_XU_LY' || req.status === 'DA_TIEP_NHAN';
                      const isPending = req.status === 'CHO_TIEP_NHAN';

                      return (
                        <div
                          key={req.id}
                          className="bg-slate-50 rounded-2xl border border-slate-200 p-5 space-y-4 text-xs sm:text-sm"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
                            <div>
                              <span className="font-mono font-black text-blue-700 text-sm sm:text-base">
                                {req.code}
                              </span>
                              <span className="text-slate-400 mx-2">·</span>
                              <span className="font-bold text-slate-800">{req.fullName}</span>
                              <span className="text-slate-400 mx-1">({req.phone})</span>
                            </div>

                            <span
                              className={`px-3 py-1 rounded-full text-xs font-bold ${
                                isCompleted
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : isInProgress
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {isCompleted
                                ? '✓ Đã hoàn thành hỗ trợ'
                                : isInProgress
                                ? '● Đang triển khai hỗ trợ'
                                : '⏳ Đang chờ phân công'}
                            </span>
                          </div>

                          {/* Progress Line */}
                          <div className="space-y-2">
                            <div className="text-[11px] font-bold text-slate-500 uppercase">
                              Tiến trình xử lý:
                            </div>
                            <div className="grid grid-cols-3 gap-2 text-center text-[11px] font-semibold">
                              <div
                                className={`p-2 rounded-xl ${
                                  !isPending
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-blue-100 text-blue-800'
                                }`}
                              >
                                1. Tiếp nhận hồ sơ
                              </div>
                              <div
                                className={`p-2 rounded-xl ${
                                  isInProgress || isCompleted
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-slate-200 text-slate-500'
                                }`}
                              >
                                2. Phân công cán bộ
                              </div>
                              <div
                                className={`p-2 rounded-xl ${
                                  isCompleted
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : isInProgress
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-slate-200 text-slate-500'
                                }`}
                              >
                                3. Hỗ trợ & Hoàn thành
                              </div>
                            </div>
                          </div>

                          {/* Detail info */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white p-3.5 rounded-xl border border-slate-200 text-xs">
                            <div>
                              <span className="text-slate-500 font-medium">Nội dung hỗ trợ:</span>
                              <div className="font-bold text-slate-900 mt-0.5">{req.needCategory}</div>
                              <p className="text-slate-600 mt-1 line-clamp-2">{req.content}</p>
                            </div>

                            <div className="space-y-1">
                              <div>
                                <span className="text-slate-500">Cán bộ phụ trách: </span>
                                <strong className="text-slate-900">
                                  {req.assignedMemberName || 'Đang cập nhật'}
                                </strong>
                              </div>
                              <div>
                                <span className="text-slate-500">Thời gian gửi: </span>
                                <span className="text-slate-700">
                                  {new Date(req.createdAt).toLocaleDateString('vi-VN')}
                                </span>
                              </div>
                              {req.responseNotes && (
                                <div className="text-blue-700 bg-blue-50 p-2 rounded-lg mt-1 font-medium text-[11px]">
                                  Ghi chú phản hồi: {req.responseNotes}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                    <AlertCircle className="w-8 h-8 text-slate-400 mx-auto" />
                    <div className="font-bold text-slate-700 text-sm">
                      Không tìm thấy yêu cầu nào phù hợp với từ khóa "{trackQuery}"
                    </div>
                    <div className="text-xs text-slate-500 max-w-sm mx-auto">
                      Vui lòng kiểm tra lại số điện thoại hoặc mã đơn (VD: YC-2026-0042). Nếu cần hỗ trợ gấp, vui lòng liên hệ Tổ CNSCĐ tại địa phương.
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500 space-y-1">
        <div className="font-bold text-slate-800 text-sm">
          BAN CHỈ ĐẠO CHUYỂN ĐỔI SỐ · TỔ CÔNG NGHỆ SỐ CỘNG ĐỒNG TỈNH AN GIANG
        </div>
        <div className="text-slate-500 text-xs">
          Hệ thống điều hành & tiếp nhận yêu cầu chuyển đổi số 102 xã, phường, thị trấn tỉnh An Giang
        </div>
      </footer>
    </div>
  );
};
