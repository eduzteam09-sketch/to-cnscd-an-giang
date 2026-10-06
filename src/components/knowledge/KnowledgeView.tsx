import React, { useState } from 'react';
import {
  BookOpen,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  FileText,
  Search,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Zap
} from 'lucide-react';
import { TargetGroup } from '../../types';

interface GuideItem {
  id: string;
  title: string;
  category: string;
  targetGroup: TargetGroup;
  summary: string;
  steps: string[];
  tips: string;
  officialLink?: string;
}

const GUIDES: GuideItem[] = [
  {
    id: 'g-vneid',
    title: 'Kích hoạt & Định danh điện tử VNeID Mức 2',
    category: 'Định danh số',
    targetGroup: 'NGUOI_DAN',
    summary: 'Hướng dẫn công dân kích hoạt VNeID mức 2 sau khi đã làm thủ tục tại Công an.',
    steps: [
      'Bước 1: Tải ứng dụng VNeID từ App Store hoặc Google Play (chọn đúng app do Bộ Công an phát hành).',
      'Bước 2: Chọn "Kích hoạt tài khoản định danh điện tử", nhập Số định danh cá nhân (CCCD 12 số) và Số điện thoại.',
      'Bước 3: Nhập mã OTP gồm 6 số gửi về tin nhắn SMS.',
      'Bước 4: Thiết lập mật khẩu mới (tối thiểu 8 ký tự, có chữ hoa, thường, số và ký tự đặc biệt).',
      'Bước 5: Thiết lập passcode 6 số bảo mật để xác thực khi dùng dịch vụ.',
      'Bước 6: Thiết lập 2 câu hỏi bảo mật để khôi phục khi quên mật khẩu.'
    ],
    tips: 'Lưu ý: Nhắc người dân ghi nhớ passcode và tuyệt đối không chia sẻ mã OTP cho bất kỳ ai qua điện thoại.',
    officialLink: 'https://vneid.gov.vn'
  },
  {
    id: 'g-dvc-gplx',
    title: 'Đổi Giấy phép lái xe trực tuyến toàn trình',
    category: 'Dịch vụ công',
    targetGroup: 'NGUOI_DAN',
    summary: 'Thực hiện nộp hồ sơ đổi GPLX do ngành Giao thông vận tải cấp trực tiếp trên Cổng DVC Quốc gia.',
    steps: [
      'Bước 1: Khám sức khỏe lái xe tại cơ sở y tế có liên thông dữ liệu điện tử (hoặc chụp giấy khám SK chứng thực).',
      'Bước 2: Đăng nhập Cổng Dịch vụ công Quốc gia (dichvucong.gov.vn) bằng tài khoản VNeID.',
      'Bước 3: Tìm dịch vụ "Đổi giấy phép lái xe do ngành Giao thông vận tải cấp".',
      'Bước 4: Nhập số GPLX hiện tại, hệ thống tự tra cứu thông tin; kiểm tra và đính kèm ảnh chân dung nền trắng 3x4.',
      'Bước 5: Chọn hình thức nhận kết quả tại nhà qua bưu chính công ích, thanh toán lệ phí 115.000đ trực tuyến.',
      'Bước 6: Bưu điện sẽ phát GPLX mới tận nhà và thu hồi GPLX cũ.'
    ],
    tips: 'Cán bộ hỗ trợ chụp ảnh chân dung rõ nét, không đeo kính, vén tóc lộ trán và tai.',
    officialLink: 'https://dichvucong.gov.vn'
  },
  {
    id: 'g-etax-mobile',
    title: 'Cài đặt eTax Mobile & Nộp thuế cho Hộ kinh doanh',
    category: 'Thuế điện tử',
    targetGroup: 'HO_KINH_DOANH',
    summary: 'Tra cứu nghĩa vụ thuế, thông báo thuế khoán và nộp thuế qua tài khoản ngân hàng liên kết.',
    steps: [
      'Bước 1: Cài đặt ứng dụng "eTax Mobile" từ Tổng cục Thuế.',
      'Bước 2: Đăng nhập bằng tài khoản VNeID hoặc Mã số thuế cá nhân đã đăng ký với Chi cục Thuế.',
      'Bước 3: Vào mục "Tra cứu nghĩa vụ thuế" để xem các khoản thuế môn bài, thuế GTGT, TNCN cần nộp.',
      'Bước 4: Chọn khoản nộp và chọn ngân hàng thanh toán (hệ thống liên kết với hầu hết các ngân hàng lớn).',
      'Bước 5: Xác thực thanh toán trên app ngân hàng, nhận biên lai điện tử có mã tham chiếu.'
    ],
    tips: 'Khuyên hộ kinh doanh cài đặt để tránh bị tính tiền phạt chậm nộp thuế hàng quý.',
    officialLink: 'https://thuedientu.gdt.gov.vn'
  },
  {
    id: 'g-qr-pay',
    title: 'Tạo mã QR VietQR chuẩn cho Tiểu thương chợ truyền thống',
    category: 'Thanh toán số',
    targetGroup: 'TIEU_THUONG',
    summary: 'Tạo mã QR thanh toán tĩnh/động không dùng tiền mặt, in dán tại sạp hàng.',
    steps: [
      'Bước 1: Xác định tài khoản ngân hàng chính chủ của tiểu thương.',
      'Bước 2: Mở ứng dụng ngân hàng, vào mục "Nhận tiền bằng QR" hoặc dùng dịch vụ VietQR.',
      'Bước 3: Tạo mã QR tài khoản, lưu ảnh về máy.',
      'Bước 4: Tổ CNSCĐ hỗ trợ in ép plastic hoặc làm bảng mica để bàn cho tiểu thương.',
      'Bước 5: Hướng dẫn tiểu thương cách kiểm tra thông báo biến động số dư hoặc nghe chuông báo loa thanh toán.'
    ],
    tips: 'Cảnh báo tiểu thương kiểm tra định kỳ bề mặt mã QR để chống kẻ gian dán đè mã QR giả mạo!',
    officialLink: 'https://vietqr.net'
  },
  {
    id: 'g-chu-ky-so',
    title: 'Kích hoạt Chữ ký số từ xa (SmartCA) cho Doanh nghiệp & Cá nhân',
    category: 'Chữ ký số',
    targetGroup: 'DOANH_NGHIEP',
    summary: 'Ký số văn bản điện tử, ký hóa đơn và thủ tục hành chính không cần token USB vật lý.',
    steps: [
      'Bước 1: Tải ứng dụng Chữ ký số (VNPT SmartCA, Viettel-CA, FPT-CA...).',
      'Bước 2: Thực hiện eKYC (chụp CCCD và quét khuôn mặt sinh trắc học).',
      'Bước 3: Kích hoạt chứng thư số miễn phí cho công dân theo chương trình hỗ trợ của Bộ TT&TT.',
      'Bước 4: Hướng dẫn ký thử nghiệm trên Cổng DVC hoặc file PDF hợp đồng.'
    ],
    tips: 'Chữ ký số SmartCA hiện được cấp miễn phí khi ký các dịch vụ hành chính công.',
    officialLink: 'https://neac.gov.vn'
  }
];

export const KnowledgeView: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string>('ALL');
  const [expandedId, setExpandedId] = useState<string>('g-vneid');

  const filteredGuides = GUIDES.filter(g => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match = g.title.toLowerCase().includes(q) ||
        g.category.toLowerCase().includes(q) ||
        g.summary.toLowerCase().includes(q);
      if (!match) return false;
    }
    if (selectedGroup !== 'ALL' && g.targetGroup !== selectedGroup) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs text-blue-600 font-bold mb-1">
            <BookOpen className="w-4 h-4" />
            <span>Tài liệu bỏ túi cán bộ hiện trường</span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900">
            Cẩm Nang Số & Thư Viện Hướng Dẫn Nhanh
          </h2>
          <p className="text-xs text-slate-500">
            Tổng hợp quy trình thao tác chuẩn, tài liệu nghiệp vụ giúp thành viên tự tin hướng dẫn tại địa bàn
          </p>
        </div>

        <span className="px-3 py-1 bg-blue-50 text-blue-700 font-bold rounded-xl text-xs border border-blue-200">
          5 Nhóm kỹ năng số cốt lõi
        </span>
      </div>

      {/* Filter and Search */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-2 text-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Tìm cẩm nang theo từ khóa: VNeID, dịch vụ công, thuế, mã QR..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl"
          />
        </div>

        <select
          value={selectedGroup}
          onChange={e => setSelectedGroup(e.target.value)}
          className="border border-slate-300 rounded-xl p-2 bg-white"
        >
          <option value="ALL">Mọi đối tượng</option>
          <option value="NGUOI_DAN">Người dân</option>
          <option value="HO_KINH_DOANH">Hộ kinh doanh</option>
          <option value="TIEU_THUONG">Tiểu thương</option>
          <option value="DOANH_NGHIEP">Doanh nghiệp</option>
        </select>
      </div>

      {/* Guides List */}
      <div className="space-y-3">
        {filteredGuides.map(guide => {
          const isExpanded = expandedId === guide.id;
          return (
            <div
              key={guide.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden transition-all text-xs"
            >
              <div
                onClick={() => setExpandedId(isExpanded ? '' : guide.id)}
                className="p-4 sm:p-5 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors select-none"
              >
                <div className="space-y-1 flex-1 pr-4">
                  <div className="flex items-center gap-2">
                    <span className="bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded text-[10px]">
                      {guide.category}
                    </span>
                    <span className="text-slate-400 text-[11px]">• Phục vụ {guide.targetGroup}</span>
                  </div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
                    {guide.title}
                  </h3>
                  <p className="text-slate-500 text-xs line-clamp-1">{guide.summary}</p>
                </div>

                <div className="shrink-0 text-slate-400">
                  {isExpanded ? <ChevronDown className="w-5 h-5 text-blue-600" /> : <ChevronRight className="w-5 h-5" />}
                </div>
              </div>

              {isExpanded && (
                <div className="p-4 sm:p-6 bg-slate-50/70 border-t border-slate-100 space-y-4">
                  <div>
                    <h4 className="font-bold text-slate-800 mb-2 flex items-center gap-1.5">
                      <Zap className="w-4 h-4 text-amber-500" />
                      <span>Các bước thao tác cầm tay chỉ việc:</span>
                    </h4>
                    <div className="space-y-2 bg-white p-4 rounded-xl border border-slate-200">
                      {guide.steps.map((st, i) => (
                        <div key={i} className="flex items-start gap-2.5">
                          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                          <span className="text-slate-700 leading-relaxed font-medium">{st}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 leading-relaxed flex items-start gap-2">
                    <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <strong>Mẹo & Lưu ý an toàn cho cán bộ: </strong>
                      {guide.tips}
                    </div>
                  </div>

                  {guide.officialLink && (
                    <div className="pt-2 flex justify-end">
                      <a
                        href={guide.officialLink}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 text-xs"
                      >
                        <span>Truy cập Cổng chính thức</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
