import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalItems: number;
  pageSize?: number;
  onPageChange: (page: number) => void;
  itemName?: string;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalItems,
  pageSize = 15,
  onPageChange,
  itemName = 'mục'
}) => {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  if (totalItems <= pageSize) {
    return (
      <div className="flex items-center justify-between px-3 py-2 text-xs text-slate-500 bg-slate-50 border-t border-slate-200 rounded-b-xl">
        <span>Hiển thị tất cả <strong>{totalItems}</strong> {itemName} (tối đa 15 mục/trang)</span>
        <span className="text-slate-400 font-medium">Trang 1 / 1</span>
      </div>
    );
  }

  const startIdx = (currentPage - 1) * pageSize + 1;
  const endIdx = Math.min(currentPage * pageSize, totalItems);

  // Generate page numbers
  const pages: number[] = [];
  for (let i = 1; i <= totalPages; i++) {
    if (
      i === 1 ||
      i === totalPages ||
      (i >= currentPage - 1 && i <= currentPage + 1)
    ) {
      pages.push(i);
    }
  }

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-3.5 py-2.5 bg-slate-50 border-t border-slate-200 rounded-b-xl text-xs">
      <div className="text-slate-600 font-medium">
        Hiển thị <strong className="text-slate-900">{startIdx}</strong> - <strong className="text-slate-900">{endIdx}</strong> trong số <strong className="text-blue-700">{totalItems}</strong> {itemName}
        <span className="text-slate-400 ml-1">(tối đa 15/trang)</span>
      </div>

      <div className="flex items-center gap-1 self-center sm:self-auto">
        <button
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none transition-colors"
          title="Trang trước"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {pages.map((p, idx) => {
          const prevP = pages[idx - 1];
          const hasEllipsis = prevP && p - prevP > 1;

          return (
            <React.Fragment key={p}>
              {hasEllipsis && <span className="px-1.5 text-slate-400">...</span>}
              <button
                onClick={() => onPageChange(p)}
                className={`min-w-[28px] h-7 px-2 rounded-lg font-bold transition-colors ${
                  currentPage === p
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                {p}
              </button>
            </React.Fragment>
          );
        })}

        <button
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none transition-colors"
          title="Trang sau"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
