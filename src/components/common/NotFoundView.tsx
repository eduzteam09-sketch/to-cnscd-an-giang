import React, { useState, useMemo } from 'react';
import { Search, MapPin, ArrowRight, Home, Shield, ExternalLink } from 'lucide-react';
import { AN_GIANG_WARDS_102 } from '../../mock/anGiangData';
import { toWardSlug } from '../../utils/slug';

interface NotFoundViewProps {
  slug: string;
  onNavigate: (path: string) => void;
}

export const NotFoundView: React.FC<NotFoundViewProps> = ({ slug, onNavigate }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredWards = useMemo(() => {
    if (!searchQuery.trim()) return AN_GIANG_WARDS_102;
    const q = searchQuery.toLowerCase().trim();
    return AN_GIANG_WARDS_102.filter(
      w =>
        w.name.toLowerCase().includes(q) ||
        w.districtName.toLowerCase().includes(q) ||
        toWardSlug(w.name).includes(q)
    );
  }, [searchQuery]);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between selection:bg-blue-600 selection:text-white">
      {/* Header Bar */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md px-4 py-3 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center font-black text-white shadow-lg">
              AG
            </div>
            <div>
              <div className="font-extrabold text-sm sm:text-base text-white tracking-tight">
                HỆ THỐNG ĐIỀU HÀNH CHUYỂN ĐỔI SỐ TỈNH AN GIANG
              </div>
              <div className="text-[11px] text-slate-400">
                102 Phường / Xã / Đặc Khu · Điều hướng truy cập
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigate('/')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors cursor-pointer border border-slate-700"
            >
              <Home className="w-3.5 h-3.5 text-blue-400" />
              <span>Cổng Dân (/)</span>
            </button>
            <button
              onClick={() => onNavigate('/admin')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black transition-colors cursor-pointer shadow-md"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Quản Lý Tỉnh (/admin)</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl w-full mx-auto px-4 py-10 flex-1">
        <div className="text-center max-w-2xl mx-auto mb-8 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold">
            <span>⚠️ Không tìm thấy địa chỉ:</span>
            <code className="bg-rose-950/60 px-2 py-0.5 rounded font-mono text-rose-300">/{slug}</code>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Chọn Phường / Xã / Đặc Khu Cần Truy Cập
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
            Hệ thống quản lý Tổ CNSCĐ tỉnh An Giang được phân chia thành 102 trang riêng biệt theo từng xã/phường/đặc khu.
            Vui lòng tìm kiếm hoặc chọn địa bàn của bạn dưới đây:
          </p>

          {/* Quick Search */}
          <div className="relative max-w-md mx-auto pt-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-5.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Gõ tên xã, phường, thị trấn (vd: An Phú, Long Xuyên, Tri Tôn)..."
              className="w-full pl-10 pr-4 py-3 bg-slate-800/90 border border-slate-700 rounded-2xl text-xs sm:text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>
        </div>

        {/* List of Wards */}
        <div className="bg-slate-850 border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-2xl">
          <div className="flex items-center justify-between text-xs text-slate-400 font-bold uppercase tracking-wider pb-3 border-b border-slate-800 mb-4">
            <span>Danh sách 102 Đơn vị cấp xã ({filteredWards.length})</span>
            <span className="text-[11px] text-blue-400 font-normal">Nhấp để mở trang Tổ CNSCĐ tương ứng</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-[500px] overflow-y-auto pr-1">
            {filteredWards.map(w => {
              const wardSlug = toWardSlug(w.name);
              return (
                <button
                  key={w.id}
                  onClick={() => onNavigate(`/${wardSlug}`)}
                  className="flex items-center justify-between p-3 rounded-2xl bg-slate-800/60 hover:bg-blue-600/20 border border-slate-750 hover:border-blue-500/40 text-left transition-all group cursor-pointer"
                >
                  <div className="min-w-0 pr-2">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span
                        className={`text-[9px] font-black px-1.5 py-0.2 rounded ${
                          w.unitType === 'PHUONG'
                            ? 'bg-blue-900/60 text-blue-300'
                            : w.unitType === 'DAC_KHU'
                            ? 'bg-purple-900/60 text-purple-300'
                            : 'bg-emerald-900/60 text-emerald-300'
                        }`}
                      >
                        {w.unitType === 'PHUONG' ? 'Phường' : w.unitType === 'DAC_KHU' ? 'Đặc khu' : 'Xã'}
                      </span>
                      <span className="font-bold text-white text-xs truncate group-hover:text-blue-300 transition-colors">
                        {w.name}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                      <span className="truncate">{w.districtName}</span>
                    </div>
                    <div className="text-[10px] font-mono text-slate-500 group-hover:text-blue-400 transition-colors mt-0.5">
                      /{wardSlug}
                    </div>
                  </div>

                  <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all shrink-0" />
                </button>
              );
            })}

            {filteredWards.length === 0 && (
              <div className="col-span-full py-12 text-center text-slate-500 text-xs">
                Không tìm thấy phường/xã nào khớp với &ldquo;{searchQuery}&rdquo;.
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-4 text-center text-xs text-slate-500">
        ỦY BAN NHÂN DÂN TỈNH AN GIANG · HỆ THỐNG ĐIỀU HÀNH 102 PHƯỜNG / XÃ / ĐẶC KHU
      </footer>
    </div>
  );
};
