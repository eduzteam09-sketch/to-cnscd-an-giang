import {
  AuditLog,
  Member,
  SupportRequest,
  TargetGroup,
  TargetProfile,
  Task,
  TaskStatus,
  Team,
  UrgeLog,
  WorkGroup,
  WorkSource
} from '../types';

export const TARGET_GROUP_CONFIG: Record<TargetGroup, { label: string; shortLabel: string; bg: string; text: string; border: string; desc: string }> = {
  NGUOI_DAN: {
    label: '1. Người dân',
    shortLabel: 'Người dân',
    bg: 'bg-blue-50 text-blue-700',
    text: 'text-blue-700',
    border: 'border-blue-200',
    desc: 'Hỗ trợ cá nhân, hộ gia đình về VNeID, DV công, BHYT, thanh toán số'
  },
  HO_KINH_DOANH: {
    label: '2. Hộ kinh doanh',
    shortLabel: 'Hộ kinh doanh',
    bg: 'bg-emerald-50 text-emerald-700',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    desc: 'Hỗ trợ thanh toán QR, hoá đơn điện tử từ máy tính tiền, kê khai thuế số'
  },
  TIEU_THUONG: {
    label: '3. Tiểu thương',
    shortLabel: 'Tiểu thương',
    bg: 'bg-amber-50 text-amber-800',
    text: 'text-amber-800',
    border: 'border-amber-200',
    desc: 'Tiểu thương tại chợ truyền thống, tuyến phố không tiền mặt, phòng tránh lừa đảo số'
  },
  DOANH_NGHIEP: {
    label: '4. Doanh nghiệp',
    shortLabel: 'Doanh nghiệp',
    bg: 'bg-purple-50 text-purple-700',
    text: 'text-purple-700',
    border: 'border-purple-200',
    desc: 'Doanh nghiệp cơ sở, chữ ký số doanh nghiệp, nộp hồ sơ giấy phép trực tuyến'
  },
  CAN_BO_CO_SO: {
    label: '5. Cán bộ, đơn vị cơ sở',
    shortLabel: 'Cán bộ cơ sở',
    bg: 'bg-rose-50 text-rose-700',
    text: 'text-rose-700',
    border: 'border-rose-200',
    desc: 'Cán bộ tổ dân phố, chi hội phụ nữ, người cao tuổi sử dụng phần mềm quản lý'
  }
};

export const WORK_GROUP_CONFIG: Record<WorkGroup, { label: string; short: string; badge: string; color: string; desc: string }> = {
  PHAT_HIEN: {
    label: '1. Phát hiện nhu cầu',
    short: 'Phát hiện',
    badge: 'bg-cyan-100 text-cyan-800',
    color: '#0891b2',
    desc: 'Tìm/ghi nhận đối tượng và nhu cầu cần hỗ trợ (VD: hộ chưa có hồ sơ số)'
  },
  HUONG_DAN: {
    label: '2. Hướng dẫn',
    short: 'Hướng dẫn',
    badge: 'bg-indigo-100 text-indigo-800',
    color: '#4f46e5',
    desc: 'Giải thích cách làm và cung cấp tài liệu, công cụ hướng dẫn'
  },
  HO_TRO: {
    label: '3. Hỗ trợ',
    short: 'Hỗ trợ',
    badge: 'bg-blue-100 text-blue-800',
    color: '#2563eb',
    desc: 'Đồng hành xử lý vấn đề cụ thể, thao tác tài khoản, kỹ thuật'
  },
  DON_DOC: {
    label: '4. Đôn đốc',
    short: 'Đôn đốc',
    badge: 'bg-amber-100 text-amber-800',
    color: '#d97706',
    desc: 'Nhắc và thúc đẩy đối tượng/thành viên hoàn thành việc còn dở'
  },
  THEO_DOI_KET_QUA: {
    label: '5. Theo dõi kết quả',
    short: 'Theo dõi kết quả',
    badge: 'bg-emerald-100 text-emerald-800',
    color: '#059669',
    desc: 'Kiểm tra kết quả sau hỗ trợ và ghi nhận thay đổi thực tế'
  }
};

export const WORK_SOURCE_CONFIG: Record<WorkSource, { label: string; icon: string }> = {
  NGUOI_DAN_GUI: { label: 'Yêu cầu người dân gửi', icon: 'UserCheck' },
  CAP_TREN_GIAO: { label: 'Cấp trên giao', icon: 'ShieldAlert' },
  TO_TU_TAO: { label: 'Tổ CNSCĐ tự tạo', icon: 'Sparkles' },
  DINH_KY: { label: 'Công việc định kỳ', icon: 'CalendarClock' },
  PHAT_SINH: { label: 'Phát sinh trong quá trình hỗ trợ', icon: 'GitBranch' }
};

export const TASK_STATUS_CONFIG: Record<TaskStatus, { label: string; bg: string; text: string; dot: string }> = {
  MOI_TAO: { label: 'Mới tạo', bg: 'bg-slate-100', text: 'text-slate-700', dot: 'bg-slate-400' },
  DA_GIAO: { label: 'Đã giao', bg: 'bg-sky-100', text: 'text-sky-700', dot: 'bg-sky-500' },
  DA_NHAN: { label: 'Đã nhận', bg: 'bg-indigo-100', text: 'text-indigo-700', dot: 'bg-indigo-500' },
  DANG_THUC_HIEN: { label: 'Đang thực hiện', bg: 'bg-blue-100', text: 'text-blue-800', dot: 'bg-blue-600' },
  CHO_PHOI_HOP: { label: 'Chờ phối hợp', bg: 'bg-purple-100', text: 'text-purple-700', dot: 'bg-purple-500' },
  CHO_PHAN_HOI: { label: 'Chờ đối tượng phản hồi', bg: 'bg-orange-100', text: 'text-orange-800', dot: 'bg-orange-500' },
  CHO_KIEM_TRA: { label: 'Chờ kiểm tra', bg: 'bg-yellow-100', text: 'text-yellow-800', dot: 'bg-yellow-500' },
  DANG_DON_DOC: { label: 'Đang đôn đốc', bg: 'bg-amber-100', text: 'text-amber-800', dot: 'bg-amber-600' },
  QUA_HAN: { label: 'Quá hạn', bg: 'bg-red-100', text: 'text-red-700 font-semibold', dot: 'bg-red-600 animate-pulse' },
  HOAN_THANH: { label: 'Hoàn thành', bg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-600' },
  DONG: { label: 'Đã đóng', bg: 'bg-gray-100', text: 'text-gray-700', dot: 'bg-gray-500' }
};

export const STEP_6_DEFINITIONS = [
  { stepNumber: 1, title: '1. Phát hiện', desc: 'Ghi nhận đối tượng/vấn đề/nguồn phát hiện và tạo yêu cầu hoặc công việc' },
  { stepNumber: 2, title: '2. Xác định nhu cầu', desc: 'Làm rõ nhu cầu, mục tiêu, người phụ trách, cách thức và thời hạn xử lý' },
  { stepNumber: 3, title: '3. Hỗ trợ', desc: 'Ghi nhận nội dung đã hướng dẫn/hỗ trợ, tài liệu, công cụ và bằng chứng thực tế' },
  { stepNumber: 4, title: '4. Kiểm tra', desc: 'Kiểm tra đối tượng đã tự thực hiện được chưa; ghi nhận đạt/chưa đạt & phần cần bổ sung' },
  { stepNumber: 5, title: '5. Theo dõi & đôn đốc', desc: 'Tạo lịch nhắc, giao việc tiếp theo, theo dõi phản hồi và cảnh báo quá hạn' },
  { stepNumber: 6, title: '6. Ghi nhận kết quả', desc: 'Xác nhận kết quả thực tế, bằng chứng hình ảnh, người xác nhận và đóng hồ sơ/công việc' }
];

export const SERVICE_CATEGORIES = [
  'Số hóa doanh nghiệp',
  'Số hóa sản phẩm',
  'Tạo kênh cửa hàng số O2O',
  'Xây dựng nền tảng website',
  'NetID dành cho cá nhân',
  'Chuyển đổi số doanh nghiệp',
  'Định danh điện tử VNeID & NetID',
  'Dịch vụ công trực tuyến & Hồ sơ số',
  'Thanh toán số & Hóa đơn điện tử',
  'Nhu cầu chuyển đổi số khác'
];

import { INITIAL_USER_ACCOUNTS } from './anGiangData';

export const INITIAL_MEMBERS: Member[] = INITIAL_USER_ACCOUNTS
  .filter(a => a.role !== 'ADMIN' && a.status === 'APPROVED')
  .map(a => ({
    id: a.id,
    name: a.fullName,
    phone: a.phone,
    email: a.email,
    role: a.role,
    teamId: `TEAM-${a.wardId}`,
    teamName: `Tổ CNSCĐ ${a.wardName}`,
    ward: a.wardName,
    title: a.role === 'LEADER'
      ? `Tổ trưởng Tổ CNSCĐ ${a.wardName}`
      : a.role === 'OFFICER'
      ? `${a.fullName.includes('(') ? a.fullName.split('(')[1].replace(')', '') : 'Lãnh đạo UBND'} ${a.wardName}`
      : `Thành viên Tổ CNSCĐ ${a.wardName}`,
    skills: a.role === 'LEADER'
      ? ['VNeID Mức 2', 'Dịch vụ công trực tuyến', 'Chữ ký số SmartCA', 'Điều phối công việc']
      : a.role === 'OFFICER'
      ? ['Chỉ đạo chuyển đổi số', 'Giám sát điều hành', 'Dịch vụ công']
      : ['VNeID', 'Tạo mã VietQR', 'Cài đặt app VssID', 'Hướng dẫn người dân'],
    activeTasksCount: 0,
    completedTasksCount: 0,
    overdueTasksCount: 0
  }));

export const INITIAL_TEAMS: Team[] = [
  {
    id: 'TEAM-ag-xa-an-phu-001',
    name: 'Tổ CNSCĐ Xã An Phú',
    ward: 'Xã An Phú',
    leaderId: 'ACC-LEADER-01',
    leaderName: 'Lê Văn An',
    memberCount: 3,
    coveredNeighborhoods: ['Ấp 1', 'Ấp 2', 'Khu trung tâm hành chính']
  }
];

export const INITIAL_TARGETS: TargetProfile[] = [
  {
    id: 'TAR-001',
    code: 'HS-ND-001',
    name: 'Bác Nguyễn Văn Hùng',
    group: 'NGUOI_DAN',
    identityNumber: '079058012345',
    phone: '0903112233',
    email: 'hungnguyen1958@gmail.com',
    ward: 'Xã An Phú',
    neighborhood: 'Tổ 1 - Khóm 1',
    address: 'Số 42 Nguyễn Du, Xã An Phú',
    digitalReadinessLevel: 'CO_BAN',
    totalRequests: 2,
    totalTasks: 2,
    completedTasks: 1,
    needsFollowUp: true,
    nextScheduledContact: '2026-09-24',
    notes: 'Bác hưu trí, sử dụng điện thoại thông minh Android, mắt hơi kém cần hướng dẫn phông chữ lớn. Đã cài VNeID mức 2, đang cần hướng dẫn tra cứu BHYT điện tử.',
    createdAt: '2026-09-10T08:30:00Z',
    updatedAt: '2026-09-22T09:00:00Z'
  },
  {
    id: 'TAR-002',
    code: 'HS-HKD-002',
    name: 'Tiệm Bánh Mì Cô Mai (Hộ bà Lê Thị Mai)',
    group: 'HO_KINH_DOANH',
    identityNumber: '0301987654',
    phone: '0918765432',
    email: 'banhmicomai@gmail.com',
    ward: 'Xã An Phú',
    neighborhood: 'Tổ 2 - Khóm 1',
    address: 'Số 15 Thoại Ngọc Hầu, Xã An Phú',
    representativeName: 'Bà Lê Thị Mai',
    fieldOfBusiness: 'Kinh doanh ăn uống gia đình',
    digitalReadinessLevel: 'KHA',
    totalRequests: 1,
    totalTasks: 2,
    completedTasks: 1,
    needsFollowUp: true,
    nextScheduledContact: '2026-09-23',
    notes: 'Đã tạo mã VietQR dán quầy, cần hỗ trợ đăng ký sử dụng phần mềm hoá đơn điện tử khởi tạo từ máy tính tiền theo quy định ngành thuế.',
    createdAt: '2026-09-12T10:00:00Z',
    updatedAt: '2026-09-21T16:00:00Z'
  },
  {
    id: 'TAR-003',
    code: 'HS-TT-003',
    name: 'Quầy Trái Cây Chị Bích (Chợ An Phú)',
    group: 'TIEU_THUONG',
    identityNumber: '079178009988',
    phone: '0983114455',
    ward: 'Xã An Phú',
    neighborhood: 'Khu chợ Bến Nghé',
    address: 'Kiot 14, Chợ An Phú',
    representativeName: 'Trần Thị Bích',
    fieldOfBusiness: 'Tiểu thương hoa quả tươi',
    digitalReadinessLevel: 'CO_BAN',
    totalRequests: 1,
    totalTasks: 1,
    completedTasks: 0,
    needsFollowUp: true,
    nextScheduledContact: '2026-09-23',
    notes: 'Chị Bích muốn có biển bảng mã QR chuẩn kèm loa thông báo nhận tiền để tránh rủi ro khách giả vờ chuyển tiền qua ảnh màn hình.',
    createdAt: '2026-09-15T14:20:00Z',
    updatedAt: '2026-09-20T11:00:00Z'
  },
  {
    id: 'TAR-004',
    code: 'HS-DN-004',
    name: 'Công ty TNHH Giải Pháp Số Song Toàn',
    group: 'DOANH_NGHIEP',
    identityNumber: '0315678901',
    phone: '02838229988',
    email: 'contact@songtoan.com.vn',
    ward: 'Xã An Phú',
    neighborhood: 'Tổ 3 - Khóm 1',
    address: 'Tầng 4, Tòa nhà 88 Mạc Đĩnh Chi',
    representativeName: 'Võ Minh Toàn (GĐ)',
    fieldOfBusiness: 'Dịch vụ văn phòng & in ấn',
    digitalReadinessLevel: 'TOT',
    totalRequests: 1,
    totalTasks: 1,
    completedTasks: 1,
    needsFollowUp: false,
    notes: 'Doanh nghiệp đã tích hợp chữ ký số từ xa (SmartCA), đã được hướng dẫn nộp hồ sơ PCCC và vệ sinh ATTP trên Cổng DVC trực tuyến.',
    createdAt: '2026-09-05T09:00:00Z',
    updatedAt: '2026-09-18T15:00:00Z'
  },
  {
    id: 'TAR-005',
    code: 'HS-CB-005',
    name: 'Ban Điều Hành Khu Phố 1 (Chi hội Người cao tuổi & Phụ nữ)',
    group: 'CAN_BO_CO_SO',
    phone: '0908889900',
    ward: 'Xã An Phú',
    neighborhood: 'Tổ 1, 2, 3',
    address: 'Nhà sinh hoạt cộng đồng KP1, số 10 Lê Duẩn',
    representativeName: 'Ông Đặng Văn Sáu (Trưởng KP)',
    fieldOfBusiness: 'Ban cán sự cơ sở',
    digitalReadinessLevel: 'KHA',
    totalRequests: 2,
    totalTasks: 2,
    completedTasks: 2,
    needsFollowUp: false,
    notes: '100% cán bộ ban điều hành khu phố đã lập nhóm Zalo điều hành, biết gửi thông báo số và tra cứu tài liệu đại hội trực tuyến qua mã QR.',
    createdAt: '2026-09-01T08:00:00Z',
    updatedAt: '2026-09-19T10:30:00Z'
  }
];

export const INITIAL_REQUESTS: SupportRequest[] = [
  {
    id: 'REQ-01',
    code: 'YC-2026-0042',
    fullName: 'Bác Nguyễn Văn Hùng',
    phone: '0903112233',
    targetGroup: 'NGUOI_DAN',
    ward: 'Xã An Phú',
    neighborhood: 'Tổ 1 - Khóm 1',
    address: 'Số 42 Nguyễn Du, Xã An Phú',
    needCategory: 'NetID dành cho cá nhân',
    content: 'Tôi muốn kích hoạt NetID cá nhân và tích hợp căn cước công dân cùng thẻ y tế vào hệ thống tài khoản số. Nhờ các cháu Tổ CNSCĐ hướng dẫn giúp tôi cách tự thực hiện trên điện thoại.',
    format: 'TRUC_TIEP',
    preferredTime: 'Buổi sáng từ 8h30 - 10h30',
    termsAccepted: true,
    status: 'DANG_XU_LY',
    assignedTeamId: 'TEAM-ag-xa-an-phu-001',
    assignedMemberId: 'ACC-MEMBER-01',
    assignedMemberName: 'Huỳnh Thị Mai',
    convertedTaskId: 'TASK-002',
    convertedTaskCode: 'CV-2026-0002',
    createdAt: '2026-09-21T09:15:00Z',
    updatedAt: '2026-09-21T10:00:00Z',
    responseNotes: 'Đã phân công cán bộ đến tận nơi hỗ trợ sáng ngày 23/09.'
  },
  {
    id: 'REQ-02',
    code: 'YC-2026-0043',
    fullName: 'Chị Trần Thị Bích (Quầy Trái Cây)',
    phone: '0983114455',
    targetGroup: 'TIEU_THUONG',
    ward: 'Xã An Phú',
    neighborhood: 'Khu chợ Bến Nghé',
    address: 'Kiot 14, Chợ An Phú',
    needCategory: 'Tạo kênh cửa hàng số O2O',
    content: 'Quầy bán hoa quả của tôi muốn kết nối kênh bán hàng trực tiếp tại sạp sang gian hàng số online O2O để khách quen ở văn phòng gần đây có thể đặt hàng và thanh toán tiện lợi.',
    format: 'TRUC_TIEP',
    preferredTime: 'Buổi chiều từ 14h - 16h (lúc vắng khách)',
    termsAccepted: true,
    status: 'DANG_XU_LY',
    assignedTeamId: 'TEAM-ag-xa-an-phu-001',
    assignedMemberId: 'ACC-MEMBER-01',
    assignedMemberName: 'Huỳnh Thị Mai',
    convertedTaskId: 'TASK-003',
    convertedTaskCode: 'CV-2026-0003',
    createdAt: '2026-09-20T14:30:00Z',
    updatedAt: '2026-09-21T08:00:00Z'
  },
  {
    id: 'REQ-03',
    code: 'YC-2026-0044',
    fullName: 'Công ty TNHH Cơ Khí & Thương Mại Hoàng Phát',
    phone: '0919223344',
    targetGroup: 'DOANH_NGHIEP',
    ward: 'Xã An Phú',
    neighborhood: 'Tổ 2 - Khóm 1',
    address: 'Số 88 Hai Bà Trưng',
    needCategory: 'Số hóa doanh nghiệp',
    content: 'Doanh nghiệp chúng tôi muốn tư vấn lộ trình chuyển đổi số toàn diện: số hóa quy trình quản lý văn bản nội bộ, ứng dụng hóa đơn điện tử và chữ ký số cho nhân sự.',
    format: 'TRUC_TIEP',
    preferredTime: 'Giờ hành chính từ thứ 2 đến thứ 6',
    termsAccepted: true,
    status: 'CHO_TIEP_NHAN',
    createdAt: '2026-09-22T19:40:00Z',
    updatedAt: '2026-09-22T19:40:00Z'
  },
  {
    id: 'REQ-04',
    code: 'YC-2026-0045',
    fullName: 'Hợp tác xã Nông Sản Sạch Minh Tâm',
    phone: '0938556677',
    targetGroup: 'HO_KINH_DOANH',
    ward: 'Xã An Phú',
    neighborhood: 'Tổ 3 - Khóm 1',
    address: 'Số 102 Mạc Đĩnh Chi',
    needCategory: 'Số hóa sản phẩm',
    content: 'Cơ sở chúng tôi có 5 sản phẩm đạt chứng nhận OCOP địa phương, cần hỗ trợ tạo mã QR truy xuất nguồn gốc số hóa sản phẩm và đưa lên sàn thương mại điện tử.',
    format: 'TRUC_TIEP',
    preferredTime: 'Sáng thứ 7 tuần này',
    termsAccepted: true,
    status: 'CHO_TIEP_NHAN',
    createdAt: '2026-09-23T08:20:00Z',
    updatedAt: '2026-09-23T08:20:00Z'
  },
  {
    id: 'REQ-05',
    code: 'YC-2026-0046',
    fullName: 'Cửa Hàng Thời Trang May Đo Thanh Vân',
    phone: '0977889900',
    targetGroup: 'HO_KINH_DOANH',
    ward: 'Xã An Phú',
    neighborhood: 'Tổ 1 - Khóm 1',
    address: 'Số 24 Lê Thánh Tôn',
    needCategory: 'Xây dựng nền tảng website',
    content: 'Chúng tôi muốn xây dựng nền tảng website giới thiệu mẫu mã và nhận lịch may đo trực tuyến kết nối mạng xã hội, nhờ Tổ CNSCĐ tư vấn giải pháp chi phí tối ưu.',
    format: 'TRUC_TUYEN',
    preferredTime: 'Buổi tối từ 19h - 20h qua Zalo',
    termsAccepted: true,
    status: 'CHO_TIEP_NHAN',
    createdAt: '2026-09-23T14:10:00Z',
    updatedAt: '2026-09-23T14:10:00Z'
  }
];

export const INITIAL_TASKS: Task[] = [
  {
    id: 'TASK-001',
    code: 'CV-2026-0001',
    title: 'Hỗ trợ Hộ bà Lê Thị Mai triển khai hóa đơn điện tử khởi tạo từ máy tính tiền',
    description: 'Hướng dẫn quy trình lập tờ khai đăng ký sử dụng hóa đơn điện tử máy tính tiền theo Nghị định 123/2020/NĐ-CP và Thông tư 78; cài đặt phần mềm xuất hóa đơn trên điện thoại/máy POS.',
    source: 'TO_TU_TAO',
    workGroup: 'HO_TRO',
    status: 'DANG_DON_DOC',
    priority: 'CAO',
    targetId: 'TAR-002',
    targetName: 'Tiệm Bánh Mì Cô Mai (Hộ bà Lê Thị Mai)',
    targetPhone: '0918765432',
    targetAddress: 'Số 15 Thoại Ngọc Hầu, Xã An Phú',
    targetGroup: 'HO_KINH_DOANH',
    ward: 'Xã An Phú',
    teamId: 'TEAM-ag-xa-an-phu-001',
    teamName: 'Tổ CNSCĐ Xã An Phú',
    createdBy: 'Lê Văn An',
    assignerName: 'Lê Văn An (Tổ trưởng)',
    primaryAssigneeId: 'ACC-MEMBER-01',
    primaryAssigneeName: 'Huỳnh Thị Mai',
    collaboratorIds: ['ACC-LEADER-01'],
    collaboratorNames: ['Lê Văn An'],
    startDate: '2026-09-18',
    dueDate: '2026-10-15',
    currentStep: 5,
    steps: [
      {
        stepNumber: 1,
        stepName: '1. Phát hiện',
        isCompleted: true,
        completedAt: '2026-09-18T09:00:00Z',
        completedBy: 'Lê Văn An',
        notes: 'Phát hiện hộ kinh doanh bán ăn uống thuộc diện cần áp dụng máy tính tiền truyền dữ liệu đến cơ quan thuế đợt 3.',
        evaluation: 'DAT'
      },
      {
        stepNumber: 2,
        stepName: '2. Xác định nhu cầu',
        isCompleted: true,
        completedAt: '2026-09-18T14:00:00Z',
        completedBy: 'Huỳnh Thị Mai',
        notes: 'Hộ đã có smartphone và internet wifi, chưa có chữ ký số HSM/SmartCA và chưa chọn được nhà cung cấp hóa đơn giải pháp giá rẻ.',
        evaluation: 'DAT'
      },
      {
        stepNumber: 3,
        stepName: '3. Hỗ trợ',
        isCompleted: true,
        completedAt: '2026-09-20T11:00:00Z',
        completedBy: 'Huỳnh Thị Mai',
        notes: 'Đã cùng nhân viên VNPT cài đặt app SmartCA và kích hoạt tài khoản giải pháp hóa đơn máy tính tiền miễn phí 500 số đầu.',
        evidenceUrls: ['/assets/demo_evidence_pos.jpg'],
        evaluation: 'DAT'
      },
      {
        stepNumber: 4,
        stepName: '4. Kiểm tra',
        isCompleted: true,
        completedAt: '2026-09-21T15:30:00Z',
        completedBy: 'Huỳnh Thị Mai',
        notes: 'Kiểm tra chủ hộ thao tác xuất thử 01 hóa đơn mẫu. Kết quả: Chủ hộ đã biết chọn món, bấm in và truyền dữ liệu hóa đơn thành công.',
        evaluation: 'DAT'
      },
      {
        stepNumber: 5,
        stepName: '5. Theo dõi & đôn đốc',
        isCompleted: false,
        notes: 'Đang theo dõi xem hộ có xuất hóa đơn hàng ngày khi bán hàng hay không. Đã lên lịch gọi điện đôn đốc vào sáng mai 23/09.',
        evaluation: 'CAN_BO_SUNG'
      },
      {
        stepNumber: 6,
        stepName: '6. Ghi nhận kết quả',
        isCompleted: false
      }
    ],
    checklist: [
      { id: 'chk-1', title: 'Khảo sát thiết bị máy tính / điện thoại tại quán', completed: true, completedAt: '2026-09-18' },
      { id: 'chk-2', title: 'Hỗ trợ đăng ký chữ ký số SmartCA', completed: true, completedAt: '2026-09-19' },
      { id: 'chk-3', title: 'Nộp Mẫu 01/ĐKTĐ-HĐĐT lên Cổng thuế', completed: true, completedAt: '2026-09-20' },
      { id: 'chk-4', title: 'Hướng dẫn chủ quán tự lập và ký hóa đơn', completed: true, completedAt: '2026-09-21' },
      { id: 'chk-5', title: 'Kiểm tra thực tế sau 3 ngày bán hàng có phát sinh', completed: false }
    ],
    reminders: [
      { id: 'rem-1', date: '2026-09-20', title: 'Nhắc chủ quán chuẩn bị CCCD để đối soát SmartCA', isTriggered: true, isDone: true },
      { id: 'rem-2', date: '2026-09-23', title: 'Gọi điện đôn đốc hộ kiểm tra số lượng hóa đơn đã xuất trong ngày', isTriggered: false, isDone: false }
    ],
    evidences: [
      {
        id: 'ev-1',
        type: 'IMAGE',
        title: 'Ảnh quầy bánh mì dán mã QR và máy in mini',
        createdAt: '2026-09-20T11:20:00Z',
        createdBy: 'Huỳnh Thị Mai',
        description: 'Đã hoàn thành thiết lập phần mềm trên điện thoại Oppo của cô Mai.'
      }
    ],
    actualResult: '',
    createdAt: '2026-09-18T08:30:00Z',
    updatedAt: '2026-09-21T16:00:00Z'
  },
  {
    id: 'TASK-002',
    code: 'CV-2026-0002',
    title: 'Hướng dẫn Bác Nguyễn Văn Hùng tích hợp thẻ BHYT & Sổ sức khỏe điện tử trên VNeID',
    description: 'Hỗ trợ người cao tuổi tra cứu thông tin bảo hiểm y tế, tích hợp thẻ BHYT vào VNeID mức 2 để xuất trình thay thẻ giấy khi khám chữa bệnh tại các cơ sở y tế.',
    source: 'NGUOI_DAN_GUI',
    workGroup: 'HUONG_DAN',
    status: 'DANG_THUC_HIEN',
    priority: 'THUONG',
    targetId: 'TAR-001',
    targetName: 'Bác Nguyễn Văn Hùng',
    targetPhone: '0903112233',
    targetAddress: 'Số 42 Nguyễn Du, Xã An Phú',
    targetGroup: 'NGUOI_DAN',
    requestId: 'REQ-01',
    requestCode: 'YC-2026-0042',
    ward: 'Xã An Phú',
    teamId: 'TEAM-ag-xa-an-phu-001',
    teamName: 'Tổ CNSCĐ Xã An Phú',
    createdBy: 'Lê Văn An',
    assignerName: 'Lê Văn An (Tổ trưởng)',
    primaryAssigneeId: 'ACC-MEMBER-01',
    primaryAssigneeName: 'Huỳnh Thị Mai',
    collaboratorIds: [],
    collaboratorNames: [],
    startDate: '2026-09-21',
    dueDate: '2026-10-20',
    currentStep: 3,
    steps: [
      {
        stepNumber: 1,
        stepName: '1. Phát hiện',
        isCompleted: true,
        completedAt: '2026-09-21T10:00:00Z',
        completedBy: 'Lê Văn An',
        notes: 'Tiếp nhận từ cổng yêu cầu của người dân YC-2026-0042.',
        evaluation: 'DAT'
      },
      {
        stepNumber: 2,
        stepName: '2. Xác định nhu cầu',
        isCompleted: true,
        completedAt: '2026-09-21T14:00:00Z',
        completedBy: 'Huỳnh Thị Mai',
        notes: 'Bác Hùng cần hỗ trợ trực tiếp tại nhà do bác đi lại hơi khó khăn.',
        evaluation: 'DAT'
      },
      {
        stepNumber: 3,
        stepName: '3. Hỗ trợ',
        isCompleted: false,
        notes: 'Đã hẹn sáng 23/09 qua nhà bác thao tác trực tiếp trên máy điện thoại của bác.'
      },
      { stepNumber: 4, stepName: '4. Kiểm tra', isCompleted: false },
      { stepNumber: 5, stepName: '5. Theo dõi & đôn đốc', isCompleted: false },
      { stepNumber: 6, stepName: '6. Ghi nhận kết quả', isCompleted: false }
    ],
    checklist: [
      { id: 'chk-21', title: 'Kiểm tra tài khoản VNeID đã kích hoạt mức 2 chưa', completed: true, completedAt: '2026-09-21' },
      { id: 'chk-22', title: 'Nhập mã thẻ BHYT vào mục Ví giấy tờ trên VNeID', completed: false },
      { id: 'chk-23', title: 'Hướng dẫn bác xem mã QR thẻ BHYT điện tử offline', completed: false }
    ],
    reminders: [
      { id: 'rem-21', date: '2026-09-23', title: 'Đến nhà bác Hùng lúc 09:00 sáng', isTriggered: false, isDone: false }
    ],
    evidences: [],
    actualResult: '',
    createdAt: '2026-09-21T10:00:00Z',
    updatedAt: '2026-09-21T14:30:00Z'
  },
  {
    id: 'TASK-003',
    code: 'CV-2026-0003',
    title: 'Hỗ trợ Tiểu thương Chị Trần Thị Bích trang bị mã VietQR chuẩn & cảnh báo lừa đảo',
    description: 'In ấn bảng mica VietQR chống dán đè mã; hướng dẫn cài đặt âm báo biến động số dư qua ứng dụng ngân hàng số; tuyên truyền thủ đoạn tráo đổi mã QR và làm giả biên lai chuyển khoản.',
    source: 'NGUOI_DAN_GUI',
    workGroup: 'HO_TRO',
    status: 'HOAN_THANH',
    priority: 'THUONG',
    targetId: 'TAR-003',
    targetName: 'Quầy Trái Cây Chị Bích (Chợ An Phú)',
    targetPhone: '0983114455',
    targetAddress: 'Kiot 14, Chợ An Phú',
    targetGroup: 'TIEU_THUONG',
    requestId: 'REQ-02',
    requestCode: 'YC-2026-0043',
    ward: 'Xã An Phú',
    teamId: 'TEAM-ag-xa-an-phu-001',
    teamName: 'Tổ CNSCĐ Xã An Phú',
    createdBy: 'Lê Văn An',
    assignerName: 'Lê Văn An (Tổ trưởng)',
    primaryAssigneeId: 'ACC-MEMBER-01',
    primaryAssigneeName: 'Huỳnh Thị Mai',
    collaboratorIds: ['ACC-LEADER-01'],
    collaboratorNames: ['Lê Văn An'],
    startDate: '2026-09-21',
    dueDate: '2026-09-25',
    completedDate: '2026-09-24T16:00:00Z',
    currentStep: 6,
    steps: [
      {
        stepNumber: 1,
        stepName: '1. Phát hiện',
        isCompleted: true,
        completedAt: '2026-09-21T08:00:00Z',
        completedBy: 'Lê Văn An',
        notes: 'Yêu cầu từ tiểu thương chợ An Phú.',
        evaluation: 'DAT'
      },
      {
        stepNumber: 2,
        stepName: '2. Xác định nhu cầu',
        isCompleted: true,
        completedAt: '2026-09-21T16:00:00Z',
        completedBy: 'Huỳnh Thị Mai',
        notes: 'Chị Bích có tài khoản Agribank, cần in biển mica và hướng dẫn bật thông báo OTT.',
        evaluation: 'DAT'
      },
      { stepNumber: 3, stepName: '3. Hỗ trợ', isCompleted: true, completedAt: '2026-09-23T15:00:00Z', completedBy: 'Huỳnh Thị Mai', notes: 'Đã trao biển mica VietQR chống tráo mã.' },
      { stepNumber: 4, stepName: '4. Kiểm tra', isCompleted: true, completedAt: '2026-09-24T10:00:00Z', completedBy: 'Huỳnh Thị Mai', notes: 'Thử quét mã chuyển khoản thành công.' },
      { stepNumber: 5, stepName: '5. Theo dõi & đôn đốc', isCompleted: true, completedAt: '2026-09-24T14:00:00Z', completedBy: 'Huỳnh Thị Mai' },
      { stepNumber: 6, stepName: '6. Ghi nhận kết quả', isCompleted: true, completedAt: '2026-09-24T16:00:00Z', completedBy: 'Huỳnh Thị Mai', notes: 'Hoàn thành hỗ trợ thanh toán số cho tiểu thương.' }
    ],
    checklist: [
      { id: 'chk-31', title: 'Tạo mã QR chuẩn NAPAS 247 theo STK Agribank', completed: true, completedAt: '2026-09-22' },
      { id: 'chk-32', title: 'In bảng quét mã có phủ màng bảo vệ chống tráo mã', completed: true, completedAt: '2026-09-23' },
      { id: 'chk-33', title: 'Bàn giao và hướng dẫn nhận biết bill chuyển khoản giả', completed: true, completedAt: '2026-09-24' }
    ],
    reminders: [],
    evidences: [],
    actualResult: 'Tiểu thương đã sử dụng thành thạo thanh toán VietQR.',
    createdAt: '2026-09-21T08:00:00Z',
    updatedAt: '2026-09-24T16:00:00Z'
  },
  {
    id: 'TASK-004',
    code: 'CV-2026-0004',
    title: 'Chiến dịch rà soát & kích hoạt VNeID mức 2 cho 50 công dân cao tuổi Tổ 1',
    description: 'Chỉ đạo của UBND Phường về cao điểm làm sạch dữ liệu dân cư và kích hoạt định danh mức 2 trước ngày 30/09.',
    source: 'CAP_TREN_GIAO',
    workGroup: 'PHAT_HIEN',
    status: 'QUA_HAN',
    priority: 'KHAN',
    ward: 'Xã An Phú',
    teamId: 'TEAM-ag-xa-an-phu-001',
    teamName: 'Tổ CNSCĐ Xã An Phú',
    createdBy: 'Nguyễn Thành Trực (Phó Chủ tịch)',
    assignerName: 'Nguyễn Thành Trực',
    primaryAssigneeId: 'ACC-LEADER-01',
    primaryAssigneeName: 'Lê Văn An',
    collaboratorIds: ['ACC-MEMBER-01'],
    collaboratorNames: ['Huỳnh Thị Mai'],
    startDate: '2026-09-12',
    dueDate: '2026-09-20', // Quá hạn!
    currentStep: 4,
    steps: [
      {
        stepNumber: 1,
        stepName: '1. Phát hiện',
        isCompleted: true,
        completedAt: '2026-09-12T10:00:00Z',
        completedBy: 'Nguyễn Thành Trực',
        notes: 'Công an phường rà soát thấy còn 48 công dân trên 65 tuổi chưa kích hoạt VNeID mức 2.',
        evaluation: 'DAT'
      },
      {
        stepNumber: 2,
        stepName: '2. Xác định nhu cầu',
        isCompleted: true,
        completedAt: '2026-09-13T14:00:00Z',
        completedBy: 'Lê Văn An',
        notes: 'Phân nhóm: 20 người có máy smartphone đi lại được; 28 người già yếu cần tổ lưu động đến tận nhà.',
        evaluation: 'DAT'
      },
      {
        stepNumber: 3,
        stepName: '3. Hỗ trợ',
        isCompleted: true,
        completedAt: '2026-09-17T17:00:00Z',
        completedBy: 'Huỳnh Thị Mai',
        notes: 'Đã tổ chức điểm kích hoạt tại Nhà văn hóa KP1 (đạt 32 người), còn 16 người chưa tới.',
        evaluation: 'DAT'
      },
      {
        stepNumber: 4,
        stepName: '4. Kiểm tra',
        isCompleted: false,
        notes: 'Mới đạt 38/50 chỉ tiêu (76%), chưa kịp hoàn tất trước ngày 20/09 do nhiều bác đi khám bệnh hoặc đi vắng.',
        evaluation: 'CHUA_DAT'
      },
      { stepNumber: 5, stepName: '5. Theo dõi & đôn đốc', isCompleted: false },
      { stepNumber: 6, stepName: '6. Ghi nhận kết quả', isCompleted: false }
    ],
    checklist: [
      { id: 'chk-41', title: 'Lập danh sách 50 công dân kèm số điện thoại người thân', completed: true, completedAt: '2026-09-13' },
      { id: 'chk-42', title: 'Phát thông báo trên loa phát thanh và nhóm Zalo khu phố', completed: true, completedAt: '2026-09-14' },
      { id: 'chk-43', title: 'Tổ chức bàn hướng dẫn tại Nhà văn hóa KP1 thứ 7', completed: true, completedAt: '2026-09-16' },
      { id: 'chk-44', title: 'Đi từng ngõ gõ từng nhà 16 trường hợp còn lại', completed: false }
    ],
    reminders: [
      { id: 'rem-41', date: '2026-09-20', title: 'Hạn chót báo cáo UBND Phường', isTriggered: true, isDone: false }
    ],
    evidences: [
      {
        id: 'ev-41',
        type: 'MINUTES',
        title: 'Biên bản tổng hợp kích hoạt VNeID đợt 1',
        createdAt: '2026-09-17T17:30:00Z',
        createdBy: 'Lê Văn An',
        description: 'Đã hoàn thành 38 trường hợp, đối chiếu mã CCCD với Công an khu vực.'
      }
    ],
    actualResult: 'Đã kích hoạt 38/50 trường hợp, đang tiếp tục đôn đốc 12 trường hợp còn lại.',
    createdAt: '2026-09-12T08:00:00Z',
    updatedAt: '2026-09-21T09:00:00Z'
  },
  {
    id: 'TASK-005',
    code: 'CV-2026-0005',
    title: 'Tập huấn kỹ năng nộp hồ sơ Dịch vụ công trực tuyến cho Ban Điều Hành Khu Phố 1',
    description: 'Hướng dẫn 100% cán bộ chi hội cơ sở tự nộp hồ sơ trực tuyến các thủ tục: Đăng ký khai sinh, Chứng thực bản sao điện tử, Đăng ký kết hôn trên Cổng dịch vụ công TP.HCM.',
    source: 'DINH_KY',
    workGroup: 'THEO_DOI_KET_QUA',
    status: 'HOAN_THANH',
    priority: 'THUONG',
    targetId: 'TAR-005',
    targetName: 'Ban Điều Hành Khu Phố 1',
    targetPhone: '0908889900',
    targetAddress: 'Nhà sinh hoạt cộng đồng KP1, số 10 Lê Duẩn',
    targetGroup: 'CAN_BO_CO_SO',
    ward: 'Xã An Phú',
    teamId: 'TEAM-ag-xa-an-phu-001',
    teamName: 'Tổ CNSCĐ Xã An Phú',
    createdBy: 'Nguyễn Thành Trực (Phó Chủ tịch)',
    assignerName: 'Nguyễn Thành Trực',
    primaryAssigneeId: 'ACC-LEADER-01',
    primaryAssigneeName: 'Lê Văn An',
    collaboratorIds: ['ACC-MEMBER-01'],
    collaboratorNames: ['Huỳnh Thị Mai'],
    startDate: '2026-09-08',
    dueDate: '2026-09-15',
    completedDate: '2026-09-15T16:00:00Z',
    currentStep: 6,
    steps: [
      {
        stepNumber: 1,
        stepName: '1. Phát hiện',
        isCompleted: true,
        completedAt: '2026-09-08T08:00:00Z',
        completedBy: 'Nguyễn Thành Trực',
        notes: 'Kế hoạch định kỳ sinh hoạt chi bộ và ban điều hành tháng 9.',
        evaluation: 'DAT'
      },
      {
        stepNumber: 2,
        stepName: '2. Xác định nhu cầu',
        isCompleted: true,
        completedAt: '2026-09-09T09:00:00Z',
        completedBy: 'Lê Văn An',
        notes: 'Cán bộ khu phố cần nắm vững quy trình để tuyên truyền, giải thích lại cho nhân dân.',
        evaluation: 'DAT'
      },
      {
        stepNumber: 3,
        stepName: '3. Hỗ trợ',
        isCompleted: true,
        completedAt: '2026-09-12T11:00:00Z',
        completedBy: 'Huỳnh Thị Mai',
        notes: 'Trình chiếu slide hướng dẫn thực tế từng bước tải file, điền tờ khai và nộp phí lệ phí trực tuyến.',
        evaluation: 'DAT'
      },
      {
        stepNumber: 4,
        stepName: '4. Kiểm tra',
        isCompleted: true,
        completedAt: '2026-09-14T15:00:00Z',
        completedBy: 'Huỳnh Thị Mai',
        notes: '12/12 cán bộ tự thực hành thao tác trên máy tính/điện thoại cá nhân đạt yêu cầu.',
        evaluation: 'DAT'
      },
      {
        stepNumber: 5,
        stepName: '5. Theo dõi & đôn đốc',
        isCompleted: true,
        completedAt: '2026-09-15T10:00:00Z',
        completedBy: 'Lê Văn An',
        notes: 'Ban điều hành đã lập nhóm Zalo chuyên mục Hỗ trợ DVC để thành viên Tổ giải đáp ngay khi phát sinh vướng mắc.',
        evaluation: 'DAT'
      },
      {
        stepNumber: 6,
        stepName: '6. Ghi nhận kết quả',
        isCompleted: true,
        completedAt: '2026-09-15T16:00:00Z',
        completedBy: 'Lê Văn An',
        notes: 'Xác nhận 100% cán bộ khu phố thành thạo quy trình; đã nghiệm thu bằng biên bản và hình ảnh buổi tập huấn.',
        evaluation: 'DAT'
      }
    ],
    checklist: [
      { id: 'chk-51', title: 'Biên soạn cẩm nang tóm tắt 1 trang A4 dễ hiểu', completed: true, completedAt: '2026-09-10' },
      { id: 'chk-52', title: 'Tổ chức buổi hướng dẫn trực tiếp tại Hội trường', completed: true, completedAt: '2026-09-12' },
      { id: 'chk-53', title: 'Kiểm tra thực hành từng đồng chí', completed: true, completedAt: '2026-09-14' }
    ],
    reminders: [],
    evidences: [
      {
        id: 'ev-51',
        type: 'IMAGE',
        title: 'Ảnh toàn cảnh buổi tập huấn tại hội trường',
        createdAt: '2026-09-12T11:00:00Z',
        createdBy: 'Lê Văn An',
        description: '12 đồng chí cán bộ ban điều hành và chi hội trưởng dự đầy đủ.'
      }
    ],
    actualResult: '12/12 cán bộ thành thạo thao tác tra cứu và nộp DVC trực tuyến, đã ký biên bản bàn giao cẩm nang hướng dẫn.',
    createdAt: '2026-09-08T08:00:00Z',
    updatedAt: '2026-09-15T16:00:00Z'
  }
];

export const INITIAL_URGE_LOGS: UrgeLog[] = [
  {
    id: 'URGE-01',
    taskId: 'TASK-001',
    targetId: 'TAR-002',
    targetName: 'Tiệm Bánh Mì Cô Mai (Hộ bà Lê Thị Mai)',
    date: '2026-09-21T16:00:00Z',
    method: 'TRUC_TIEP',
    performedBy: 'Trần Thị Thu Trang',
    content: 'Ghé tiệm bánh mì kiểm tra tình hình xuất hóa đơn từ máy POS mini buổi chiều.',
    citizenFeedback: 'Cô Mai chia sẻ: Buổi sáng đông khách cô hơi vội nên có 2 đơn quên bấm xuất hóa đơn, chiều đã bấm bổ sung đầy đủ. Nhờ hướng dẫn cách in nhanh hơn.',
    nextFollowUpDate: '2026-09-23',
    result: 'TIEP_TUC_THEO_DOI'
  },
  {
    id: 'URGE-02',
    taskId: 'TASK-004',
    performedBy: 'Phạm Minh Đức',
    targetName: '12 công dân cao tuổi chưa kích hoạt VNeID',
    date: '2026-09-20T10:30:00Z',
    method: 'DIEN_THOAI',
    content: 'Gọi điện cho con cháu các cụ cao tuổi trong danh sách tồn đọng để hẹn lịch đến nhà vào tối thứ 4.',
    citizenFeedback: 'Gia đình các cụ đồng ý hẹn tối thứ 4 từ 19h30 để các cháu học sinh/đi làm về hỗ trợ cùng.',
    nextFollowUpDate: '2026-09-24',
    result: 'CAN_HO_TRO_LAI'
  }
];

export const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'LOG-01',
    timestamp: '2026-09-22T08:30:00Z',
    userId: 'MEM-01',
    userName: 'Nguyễn Văn Hoà',
    userRole: 'LEADER',
    entityType: 'TASK',
    entityId: 'TASK-003',
    entityCode: 'CV-2026-0003',
    action: 'TIẾP NHẬN & PHÂN CÔNG',
    details: 'Chuyển yêu cầu YC-2026-0043 thành công việc và phân công đồng chí Trần Thị Thu Trang phụ trách chính.',
    previousState: 'MOI_TAO',
    newState: 'DA_NHAN'
  },
  {
    id: 'LOG-02',
    timestamp: '2026-09-21T16:00:00Z',
    userId: 'MEM-02',
    userName: 'Trần Thị Thu Trang',
    userRole: 'MEMBER',
    entityType: 'URGE',
    entityId: 'URGE-01',
    entityCode: 'CV-2026-0001',
    action: 'ĐÔN ĐỐC & GHI NHẬT KÝ',
    details: 'Đến trực tiếp tiệm Bánh Mì Cô Mai đôn đốc kiểm tra việc xuất hóa đơn điện tử.',
    previousState: 'DANG_THUC_HIEN',
    newState: 'DANG_DON_DOC'
  },
  {
    id: 'LOG-03',
    timestamp: '2026-09-21T09:15:00Z',
    userId: 'CITIZEN',
    userName: 'Bác Nguyễn Văn Hùng',
    userRole: 'CITIZEN',
    entityType: 'REQUEST',
    entityId: 'REQ-01',
    entityCode: 'YC-2026-0042',
    action: 'GỬI YÊU CẦU HỖ TRỢ',
    details: 'Người dân gửi yêu cầu hỗ trợ tích hợp thẻ BHYT vào ứng dụng VNeID.',
    previousState: 'NONE',
    newState: 'CHO_TIEP_NHAN'
  },
  {
    id: 'LOG-04',
    timestamp: '2026-09-20T08:00:00Z',
    userId: 'SYSTEM',
    userName: 'Hệ thống tự động',
    userRole: 'ADMIN',
    entityType: 'TASK',
    entityId: 'TASK-004',
    entityCode: 'CV-2026-0004',
    action: 'CẢNH BÁO QUÁ HẠN',
    details: 'Công việc "Kích hoạt VNeID mức 2 cho 50 công dân cao tuổi" đã hết hạn (20/09) nhưng chưa hoàn thành bước 4.',
    previousState: 'DANG_THUC_HIEN',
    newState: 'QUA_HAN'
  }
];
