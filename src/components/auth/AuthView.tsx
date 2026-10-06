import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  Building,
  Check,
  CheckCircle2,
  ChevronDown,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  LogIn,
  Mail,
  MapPin,
  Phone,
  Search,
  Shield,
  ShieldCheck,
  User,
  UserCheck,
  UserPlus,
  X
} from 'lucide-react';
import { AN_GIANG_WARDS_102 } from '../../mock/anGiangData';
import { appStorage } from '../../services/storage';
import { UserRole, WardInfo } from '../../types';

interface AuthViewProps {
  onSuccessLogin: () => void;
  onBackToCitizenPortal: () => void;
  targetWard?: WardInfo;
  isAdminPortal?: boolean;
}

/**
 * Component ô nhập tìm kiếm và chọn 1 trong 102 Phường/Xã mới nhất tỉnh An Giang
 */
interface WardSearchSelectProps {
  label: string;
  selectedWardId: string;
  onSelectWard: (ward: WardInfo) => void;
  required?: boolean;
}

const WardSearchSelect: React.FC<WardSearchSelectProps> = ({
  label,
  selectedWardId,
  onSelectWard,
  required = true
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);

  const selectedWard = useMemo(
    () => AN_GIANG_WARDS_102.find(w => w.id === selectedWardId) || AN_GIANG_WARDS_102[0],
    [selectedWardId]
  );

  const filteredWards = useMemo(() => {
    if (!query.trim()) return AN_GIANG_WARDS_102;
    const q = query.toLowerCase().trim();
    return AN_GIANG_WARDS_102.filter(
      w =>
        w.name.toLowerCase().includes(q) ||
        w.unitType.toLowerCase().includes(q) ||
        (w.unitType === 'PHUONG' && 'phường'.includes(q)) ||
        (w.unitType === 'XA' && 'xã'.includes(q)) ||
        (w.unitType === 'DAC_KHU' && 'đặc khu'.includes(q))
    );
  }, [query]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={wrapperRef}>
      <label className="block font-bold text-slate-700 mb-1.5 text-xs sm:text-sm">
        {label} {required && <span className="text-red-500">*</span>}
      </label>

      {/* Trigger Button / Display */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-2.5 sm:p-3 bg-slate-50 hover:bg-slate-100/80 border border-slate-300 rounded-xl text-left transition-colors focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-xs sm:text-sm cursor-pointer"
      >
        <div className="flex items-center gap-2 min-w-0 flex-1 mr-2">
          <MapPin className="w-4 h-4 text-blue-600 shrink-0" />
          <div className="truncate">
            <span className="font-bold text-slate-900">{selectedWard?.name}</span>
            <span className="text-[11px] text-slate-500 ml-2 font-normal">
              ({selectedWard?.unitType === 'PHUONG' ? 'Phường' : selectedWard?.unitType === 'DAC_KHU' ? 'Đặc khu' : 'Xã'} · Tỉnh An Giang)
            </span>
          </div>
        </div>
        <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu with Search */}
      {isOpen && (
        <div className="absolute left-0 right-0 mt-1.5 bg-white rounded-2xl shadow-2xl border border-slate-200 p-2.5 z-50 text-xs animate-in fade-in zoom-in-95 duration-100 max-h-72 flex flex-col">
          {/* Search Input Box */}
          <div className="relative mb-2 shrink-0">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              autoFocus
              placeholder="Gõ để tìm kiếm 1 trong 102 phường/xã..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 font-medium text-slate-800 placeholder:text-slate-400"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider px-2 py-1 flex items-center justify-between shrink-0">
            <span>Danh sách 102 đơn vị cấp xã An Giang</span>
            <span>{filteredWards.length} kết quả</span>
          </div>

          {/* Scrollable list */}
          <div className="overflow-y-auto divide-y divide-slate-100 flex-1 pr-1 space-y-0.5">
            {filteredWards.map(w => {
              const isSelected = w.id === selectedWardId;
              return (
                <div
                  key={w.id}
                  onClick={() => {
                    onSelectWard(w);
                    setIsOpen(false);
                    setQuery('');
                  }}
                  className={`p-2.5 rounded-xl cursor-pointer flex items-center justify-between transition-colors ${
                    isSelected
                      ? 'bg-blue-50 text-blue-900 font-bold border border-blue-200'
                      : 'hover:bg-slate-50 text-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        w.unitType === 'PHUONG'
                          ? 'bg-blue-100 text-blue-800'
                          : w.unitType === 'DAC_KHU'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {w.unitType === 'PHUONG' ? 'Phường' : w.unitType === 'DAC_KHU' ? 'Đặc khu' : 'Xã'}
                    </span>
                    <span className="truncate">{w.name}</span>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-blue-600 shrink-0 ml-2" />}
                </div>
              );
            })}

            {filteredWards.length === 0 && (
              <div className="p-4 text-center text-slate-400">
                Không tìm thấy phường/xã nào khớp với &ldquo;{query}&rdquo;
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export const AuthView: React.FC<AuthViewProps> = ({
  onSuccessLogin,
  onBackToCitizenPortal,
  targetWard,
  isAdminPortal = false
}) => {
  const [mode, setMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');

  // Login form state - Tự động điền cho admin nếu vào /admin
  const [loginEmail, setLoginEmail] = useState(isAdminPortal ? 'admin@hotro.vn' : '');
  const [loginPassword, setLoginPassword] = useState(isAdminPortal ? '123456' : '');
  const [showPassword, setShowPassword] = useState(false);
  const [loginWardId, setLoginWardId] = useState(
    targetWard ? targetWard.id : 'ag-phuong-long-xuyen-080'
  );
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Register form state
  const [regFullName, setRegFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [regWardId, setRegWardId] = useState(
    targetWard ? targetWard.id : 'ag-xa-an-phu-001'
  );
  const [regRole, setRegRole] = useState<UserRole>('LEADER');
  const [regNotes, setRegNotes] = useState('');
  const [regSubmittedModal, setRegSubmittedModal] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!loginEmail.trim() || !loginPassword.trim()) {
      setErrorMsg('Vui lòng nhập đầy đủ Email/SĐT và Mật khẩu!');
      return;
    }

    setIsLoading(true);

    // Thực hiện đăng nhập kèm kiểm tra phường/xã đã chọn
    const effectiveWardId = targetWard ? targetWard.id : loginWardId;
    const result = appStorage.loginUser(loginEmail, loginPassword, effectiveWardId);
    setIsLoading(false);

    if (result.success) {
      // Nếu đang ở cổng /admin, chỉ chấp nhận tài khoản có quyền ADMIN
      if (isAdminPortal && result.account && result.account.role !== 'ADMIN') {
        setErrorMsg(`Tài khoản của bạn thuộc "${result.account.wardName}" (Vai trò: ${result.account.role}). Cổng /admin chỉ dành riêng cho Quản trị viên cấp Tỉnh. Vui lòng đăng nhập bằng tài khoản Super Admin.`);
        return;
      }

      setSuccessMsg(result.message);
      setTimeout(() => {
        onSuccessLogin();
      }, 500);
    } else {
      setErrorMsg(result.message);
    }
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!regFullName.trim() || !regEmail.trim() || !regPhone.trim()) {
      setErrorMsg('Vui lòng điền đầy đủ Họ tên, Email và Số điện thoại!');
      return;
    }

    if (!regPassword || regPassword.length < 6) {
      setErrorMsg('Vui lòng nhập mật khẩu khởi tạo ít nhất 6 ký tự!');
      return;
    }

    const selectedWard = AN_GIANG_WARDS_102.find(w => w.id === regWardId) || AN_GIANG_WARDS_102[0];

    const result = appStorage.registerAccount({
      fullName: regFullName,
      email: regEmail,
      phone: regPhone,
      password: regPassword,
      requestedRole: regRole,
      districtId: selectedWard.districtId,
      districtName: selectedWard.districtName,
      wardId: selectedWard.id,
      wardName: selectedWard.name,
      notes: regNotes
    });

    if (result.success) {
      setRegSubmittedModal(true);
      // Reset form
      setRegFullName('');
      setRegEmail('');
      setRegPhone('');
      setRegPassword('');
      setRegNotes('');
    } else {
      setErrorMsg(result.message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex flex-col justify-between text-slate-100 selection:bg-blue-500 selection:text-white relative overflow-hidden">
      {/* Subtle Background Glows */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Bar Navigation */}
      <header className="max-w-7xl w-full mx-auto px-4 py-4 flex items-center justify-between relative z-10">
        <button
          onClick={onBackToCitizenPortal}
          className="flex items-center gap-2 text-xs font-bold text-slate-300 hover:text-white bg-white/10 hover:bg-white/15 px-3 py-2 rounded-xl backdrop-blur-md transition-all border border-white/10 active:scale-95 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Về Cổng Dịch Vụ Người Dân</span>
        </button>

        <div className="flex items-center gap-2 text-[11px] font-semibold text-blue-200/80 bg-blue-950/60 px-3 py-1.5 rounded-full border border-blue-500/30">
          <Building className="w-3.5 h-3.5 text-blue-400" />
          <span>Hệ Thống Quản Lý 102 Phường/Xã Tỉnh An Giang</span>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 relative z-10">
        <div className="w-full max-w-lg bg-white rounded-3xl text-slate-800 shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          {/* Card Header Banner */}
          <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-900 p-6 text-white text-center relative overflow-hidden">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center mb-3 shadow-inner border border-white/20">
              {isAdminPortal ? (
                <span className="text-3xl">👑</span>
              ) : (
                <ShieldCheck className="w-8 h-8 text-amber-300" />
              )}
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight leading-snug">
              {isAdminPortal
                ? 'QUẢN TRỊ VIÊN CẤP TỈNH AN GIANG'
                : targetWard
                ? `TỔ CNSCĐ ${targetWard.name.toUpperCase()}`
                : 'TỔ CÔNG NGHỆ SỐ CỘNG ĐỒNG'}
            </h2>
            <div className="text-xs text-blue-200 font-medium mt-1">
              {isAdminPortal
                ? 'Cổng đăng nhập Quản trị viên cấp Tỉnh (Giám sát 102 Phường/Xã)'
                : targetWard
                ? `Địa bàn: ${targetWard.name} (${targetWard.districtName})`
                : 'Hệ thống Điều hành & Quản trị Chuyển đổi số 102 Phường/Xã Tỉnh An Giang'}
            </div>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="grid grid-cols-2 p-1.5 bg-slate-100 border-b border-slate-200 text-xs font-bold">
            <button
              onClick={() => {
                setMode('LOGIN');
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className={`py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
                mode === 'LOGIN'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <LogIn className="w-4 h-4" />
              <span>Đăng nhập cán bộ</span>
            </button>
            <button
              onClick={() => {
                setMode('REGISTER');
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className={`py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
                mode === 'REGISTER'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              <span>Đăng ký cấp quyền mới</span>
            </button>
          </div>

          {/* Messages */}
          <div className="px-6 pt-4">
            {errorMsg && (
              <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-xs flex items-start gap-2.5 animate-in fade-in duration-150">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <span className="leading-relaxed font-medium">{errorMsg}</span>
              </div>
            )}
            {successMsg && (
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs flex items-start gap-2.5 animate-in fade-in duration-150">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span className="leading-relaxed font-medium">{successMsg}</span>
              </div>
            )}
          </div>

          {/* TAB 1: LOGIN FORM */}
          {mode === 'LOGIN' && (
            <div className="p-6 space-y-4">
              {/* Province Admin Guidance */}
              {isAdminPortal && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 space-y-2">
                  <div className="font-bold flex items-center gap-1.5">
                    <span>👑</span>
                    <span>Cổng dành riêng cho Quản trị viên cấp Tỉnh</span>
                  </div>
                  <p className="text-[11px] text-amber-800 leading-relaxed">
                    Khu vực chỉ dành cho tài khoản Super Admin toàn tỉnh giám sát và chỉ đạo 102 phường/xã.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setLoginEmail('admin@hotro.vn');
                      setLoginPassword('123456');
                    }}
                    className="w-full py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-xl text-xs shadow-2xs cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <span>🔑 Điền nhanh Super Admin (admin@hotro.vn / 123456)</span>
                  </button>
                </div>
              )}

              {/* Ward Staff Guidance */}
              {targetWard && !isAdminPortal && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-2xl text-xs text-blue-900 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold">Địa bàn: {targetWard.name}</span>
                    <span className="text-[10px] bg-blue-200/60 text-blue-900 px-2 py-0.5 rounded font-bold">
                      {targetWard.unitType === 'PHUONG' ? 'Phường' : targetWard.unitType === 'DAC_KHU' ? 'Đặc khu' : 'Xã'}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-0.5">
                    <button
                      type="button"
                      onClick={() => {
                        const accs = appStorage.getUserAccounts();
                        const leaderAcc = accs.find(a => a.wardId === targetWard.id && a.role === 'LEADER') ||
                          accs.find(a => a.wardId === targetWard.id);
                        if (leaderAcc) {
                          setLoginEmail(leaderAcc.email);
                          setLoginPassword('123456');
                        } else {
                          setLoginEmail('admin@hotro.vn');
                          setLoginPassword('123456');
                        }
                      }}
                      className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 font-semibold rounded-lg text-[11px] border border-slate-300 shadow-2xs cursor-pointer"
                    >
                      🔑 Mẫu Tổ trưởng {targetWard.name}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setLoginEmail('admin@hotro.vn');
                        setLoginPassword('123456');
                      }}
                      className="px-2.5 py-1 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-lg text-[11px] shadow-2xs cursor-pointer"
                    >
                      👑 Admin tỉnh vào {targetWard.name}
                    </button>
                  </div>
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-4 text-xs sm:text-sm">
                {/* Chọn Phường/Xã công tác (Ẩn nếu là cổng admin tỉnh) */}
                {!isAdminPortal && !targetWard && (
                  <WardSearchSelect
                    label="Phường/xã công tác:"
                    selectedWardId={loginWardId}
                    onSelectWard={ward => setLoginWardId(ward.id)}
                    required
                  />
                )}

                {/* Email / SĐT */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">
                    Email công vụ hoặc Số điện thoại: <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      required
                      value={loginEmail}
                      onChange={e => setLoginEmail(e.target.value)}
                      placeholder="Nhập email công vụ hoặc số điện thoại..."
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-slate-800 font-medium text-xs sm:text-sm placeholder:text-slate-400 bg-slate-50 focus:bg-white transition-colors"
                    />
                  </div>
                </div>

                {/* Mật khẩu */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block font-bold text-slate-700">
                      Mật khẩu: <span className="text-red-500">*</span>
                    </label>
                    <span className="text-[11px] text-blue-600 hover:underline cursor-pointer">
                      Quên mật khẩu?
                    </span>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={loginPassword}
                      onChange={e => setLoginPassword(e.target.value)}
                      placeholder="Nhập mật khẩu..."
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-slate-800 text-xs sm:text-sm placeholder:text-slate-400 bg-slate-50 focus:bg-white transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="p-3 bg-blue-50/70 border border-blue-200/70 rounded-xl text-[11px] text-blue-900 leading-relaxed">
                  <strong>Lưu ý bảo mật:</strong> Hệ thống sẽ tự động kiểm tra tài khoản có thuộc Tổ CNSCĐ của phường/xã đã chọn hay không để đăng nhập đúng vào trang điều hành của đơn vị đó.
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold rounded-xl text-sm shadow-md shadow-blue-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  <LogIn className="w-4 h-4" />
                  <span>{isLoading ? 'Đang kiểm tra tài khoản...' : 'Đăng Nhập Vào Hệ Thống'}</span>
                </button>
              </form>
            </div>
          )}

          {/* TAB 2: REGISTER FORM */}
          {mode === 'REGISTER' && (
            <div className="p-6 space-y-4 text-xs sm:text-sm max-h-[72vh] overflow-y-auto">
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-3.5 text-blue-900 text-[11px] leading-relaxed flex items-start gap-2">
                <Shield className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <strong>Quy định cấp quyền:</strong> Tài khoản đăng ký mới sẽ được xét duyệt bởi <strong>Quản trị viên tỉnh (admin@hotro.vn)</strong> hoặc <strong>Tổ trưởng Tổ CNSCĐ</strong> phụ trách phường/xã trước khi có thể đăng nhập.
                </div>
              </div>

              <form onSubmit={handleRegister} className="space-y-3.5">
                {/* Họ tên */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Họ và tên cán bộ: <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      required
                      value={regFullName}
                      onChange={e => setRegFullName(e.target.value)}
                      placeholder="VD: Lê Thị Hồng Mai"
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-xs sm:text-sm bg-slate-50 focus:bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Email */}
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Email công vụ / cá nhân: <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="email"
                        required
                        value={regEmail}
                        onChange={e => setRegEmail(e.target.value)}
                        placeholder="VD: lemai@angiang.gov.vn"
                        className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-xs sm:text-sm bg-slate-50 focus:bg-white"
                      />
                    </div>
                  </div>

                  {/* SĐT */}
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Số điện thoại liên hệ: <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="tel"
                        required
                        value={regPhone}
                        onChange={e => setRegPhone(e.target.value)}
                        placeholder="VD: 0918xxxxxx"
                        className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-xs sm:text-sm bg-slate-50 focus:bg-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Địa bàn: Bỏ trường quận/huyện, chỉ giữ trường Phường/xã với ô tìm kiếm cho chọn 1 trong 102 phường/xã mới nhất */}
                <WardSearchSelect
                  label="Phường/xã:"
                  selectedWardId={regWardId}
                  onSelectWard={ward => setRegWardId(ward.id)}
                  required
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Vai trò đề xuất */}
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Vai trò đề xuất: <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={regRole}
                      onChange={e => setRegRole(e.target.value as UserRole)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white font-medium text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                    >
                      <option value="LEADER">Tổ trưởng Tổ CNSCĐ</option>
                      <option value="MEMBER">Thành viên Tổ CNSCĐ</option>
                      <option value="OFFICER">Cán bộ phường/xã</option>
                      <option value="MANAGER">Lãnh đạo UBND</option>
                    </select>
                  </div>

                  {/* Mật khẩu khởi tạo: Không điền sẵn, placeholder mờ, có nút ẩn/hiện mật khẩu */}
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Mật khẩu khởi tạo: <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type={showRegPassword ? 'text' : 'password'}
                        required
                        value={regPassword}
                        onChange={e => setRegPassword(e.target.value)}
                        placeholder="Nhập mật khẩu (ít nhất 6 ký tự)..."
                        className="w-full pl-9 pr-9 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-xs bg-slate-50 focus:bg-white placeholder:text-slate-400"
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegPassword(!showRegPassword)}
                        className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                        title={showRegPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                      >
                        {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Ghi chú */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Ghi chú / Chức vụ kiêm nhiệm (nếu có):
                  </label>
                  <input
                    type="text"
                    value={regNotes}
                    onChange={e => setRegNotes(e.target.value)}
                    placeholder="VD: Bí thư Chi đoàn khóm, Trưởng ban công tác Mặt trận, Công an viên..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-xs bg-slate-50 focus:bg-white"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-bold rounded-xl text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <UserCheck className="w-4 h-4" />
                  <span>Gửi Yêu Cầu Cấp Quyền Lên Hệ Thống</span>
                </button>
              </form>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-7xl w-full mx-auto px-4 py-4 text-center text-xs text-slate-400 relative z-10 border-t border-white/5">
        Ủy ban nhân dân Tỉnh An Giang · Sở Thông tin và Truyền thông · Đề án Chuyển đổi số Quốc gia 06
      </footer>

      {/* Registration Submitted Modal Alert */}
      {regSubmittedModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 text-slate-800 shadow-2xl text-center space-y-4 animate-in fade-in zoom-in-95">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h3 className="text-lg font-black text-slate-900">
              Gửi Đăng Ký Cấp Quyền Thành Công!
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed text-left bg-slate-50 p-4 rounded-2xl border border-slate-200">
              Hồ sơ đăng ký của bạn đã được lưu vào hệ thống và gửi đến <strong>Quản trị viên tỉnh (admin@hotro.vn)</strong> cùng <strong>Tổ trưởng Tổ CNSCĐ</strong> phụ trách địa bàn.
              <br /><br />
              Tài khoản sẽ được kích hoạt ngay sau khi được phê duyệt trên hệ thống quản lý.
            </p>
            <button
              onClick={() => {
                setRegSubmittedModal(false);
                setMode('LOGIN');
              }}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs cursor-pointer"
            >
              Tôi đã hiểu, quay lại màn hình Đăng nhập
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
