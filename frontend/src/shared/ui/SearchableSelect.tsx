import React, { useState, useEffect, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import { Search, ChevronDown, Check, X, Plus } from "lucide-react";

export interface SearchableSelectOption {
  value: string;
  label: string;
  subLabel?: string;
}

interface SearchableSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SearchableSelectOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  className?: string;
  buttonClassName?: string;
  disabled?: boolean;
  onCreateNew?: (name?: string) => void;
  createNewText?: string;
}

function removeVietnameseTones(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .trim();
}

export const SearchableSelect: React.FC<SearchableSelectProps> = ({
  value,
  onChange,
  options,
  placeholder = "-- Chọn --",
  searchPlaceholder = "Tìm kiếm...",
  className = "",
  buttonClassName = "",
  disabled = false,
  onCreateNew,
  createNewText = "Thêm",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  const [coords, setCoords] = useState<{
    top: number;
    left: number;
    width: number;
    openUpward: boolean;
  }>({
    top: 0,
    left: 0,
    width: 0,
    openUpward: false,
  });

  // Tìm option hiện đang chọn
  const selectedOption = useMemo(() => {
    return options.find((opt) => opt.value === value);
  }, [options, value]);

  // Cập nhật vị trí dropdown menu
  const updatePosition = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const dropdownHeight = 280;
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const openUpward = spaceBelow < dropdownHeight && spaceAbove > spaceBelow;

    setCoords({
      top: openUpward ? rect.top - 4 : rect.bottom + 4,
      left: Math.max(8, Math.min(rect.left, window.innerWidth - rect.width - 8)),
      width: Math.max(rect.width, 240),
      openUpward,
    });
  };

  // Mở dropdown
  const handleOpen = () => {
    if (disabled) return;
    updatePosition();
    setIsOpen(true);
    setSearchQuery("");
    setHighlightedIndex(0);
  };

  // Đóng dropdown
  const handleClose = () => {
    setIsOpen(false);
    setSearchQuery("");
  };

  // Lắng nghe sự kiện scroll và resize khi mở dropdown
  useEffect(() => {
    if (!isOpen) return;

    const handleScrollOrResize = (e: Event) => {
      // Nếu scroll xảy ra bên trong dropdown list thì bỏ qua không update
      if (dropdownRef.current && dropdownRef.current.contains(e.target as Node)) {
        return;
      }
      updatePosition();
    };

    window.addEventListener("scroll", handleScrollOrResize, true);
    window.addEventListener("resize", handleScrollOrResize);

    return () => {
      window.removeEventListener("scroll", handleScrollOrResize, true);
      window.removeEventListener("resize", handleScrollOrResize);
    };
  }, [isOpen]);

  // Click outside listener
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        triggerRef.current &&
        !triggerRef.current.contains(target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(target)
      ) {
        handleClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Tự động focus vào ô tìm kiếm khi mở
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Filter options theo từ khóa
  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return options;
    const queryClean = removeVietnameseTones(searchQuery);
    return options.filter((opt) => {
      const labelClean = removeVietnameseTones(opt.label || "");
      const subLabelClean = removeVietnameseTones(opt.subLabel || "");
      const valueClean = removeVietnameseTones(opt.value || "");
      return (
        labelClean.includes(queryClean) ||
        subLabelClean.includes(queryClean) ||
        valueClean.includes(queryClean)
      );
    });
  }, [options, searchQuery]);

  // Reset highlight index khi filtered options thay đổi
  useEffect(() => {
    setHighlightedIndex(0);
  }, [filteredOptions]);

  // Tự động cuộn đến phần tử đang highlight
  useEffect(() => {
    if (!isOpen || !listRef.current) return;
    const activeEl = listRef.current.children[highlightedIndex] as HTMLElement;
    if (activeEl) {
      activeEl.scrollIntoView({ block: "nearest" });
    }
  }, [highlightedIndex, isOpen]);

  // Xử lý phím điều hướng
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
        e.preventDefault();
        handleOpen();
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev < filteredOptions.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev > 0 ? prev - 1 : Math.max(0, filteredOptions.length - 1)
      );
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filteredOptions.length > 0 && filteredOptions[highlightedIndex]) {
        onChange(filteredOptions[highlightedIndex].value);
        handleClose();
      } else if (onCreateNew && searchQuery.trim()) {
        onCreateNew(searchQuery.trim());
        handleClose();
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      handleClose();
    }
  };

  const displayText = selectedOption
    ? `${selectedOption.label}${selectedOption.subLabel ? ` (${selectedOption.subLabel})` : ""}`
    : value || placeholder;

  return (
    <div className={`relative w-full ${className}`}>
      {/* Trigger Button */}
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={() => (isOpen ? handleClose() : handleOpen())}
        onKeyDown={handleKeyDown}
        className={`w-full text-xs font-bold px-2.5 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer shadow-2xs flex items-center justify-between gap-1.5 transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${
          isOpen ? "ring-2 ring-teal-500 border-teal-500" : ""
        } ${buttonClassName}`}
      >
        <span className="truncate text-left flex-1">
          {displayText}
        </span>
        <ChevronDown
          size={14}
          className={`text-gray-400 dark:text-slate-500 transition-transform duration-200 flex-shrink-0 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Popover Dropdown (Portal) */}
      {isOpen &&
        createPortal(
          <div
            ref={dropdownRef}
            style={{
              position: "fixed",
              top: coords.openUpward ? "auto" : `${coords.top}px`,
              bottom: coords.openUpward
                ? `${window.innerHeight - coords.top}px`
                : "auto",
              left: `${coords.left}px`,
              width: `${coords.width}px`,
              zIndex: 99999,
            }}
            className="bg-white dark:bg-slate-900 border border-teal-200 dark:border-teal-900/80 rounded-xl shadow-xl overflow-hidden animate-fade-in flex flex-col text-xs"
          >
            {/* Thanh tìm kiếm */}
            <div className="p-2 border-b border-gray-100 dark:border-slate-800 bg-gray-50/80 dark:bg-slate-800/50 flex items-center gap-1.5">
              <Search size={14} className="text-gray-400 dark:text-slate-400 flex-shrink-0 ml-1" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={searchPlaceholder}
                className="w-full bg-transparent text-xs text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-400 focus:outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-md"
                  title="Xóa tìm kiếm"
                >
                  <X size={12} />
                </button>
              )}
            </div>

            {/* Thông tin số lượng nếu đang lọc */}
            {searchQuery.trim() && (
              <div className="px-3 py-1 bg-teal-50/50 dark:bg-teal-950/20 text-[10px] text-teal-700 dark:text-teal-400 font-semibold border-b border-teal-100 dark:border-teal-900/30">
                Tìm thấy {filteredOptions.length} món
              </div>
            )}

            {/* Danh sách items */}
            <div
              ref={listRef}
              className="max-h-60 overflow-y-auto p-1 divide-y divide-gray-50 dark:divide-slate-800/40"
            >
              {filteredOptions.length > 0 ? (
                filteredOptions.map((opt, idx) => {
                  const isSelected = opt.value === value;
                  const isHighlighted = idx === highlightedIndex;

                  return (
                    <button
                      key={opt.value + idx}
                      type="button"
                      onClick={() => {
                        onChange(opt.value);
                        handleClose();
                      }}
                      onMouseEnter={() => setHighlightedIndex(idx)}
                      className={`w-full text-left px-2.5 py-2 rounded-lg flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                        isSelected
                          ? "bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 font-bold"
                          : isHighlighted
                          ? "bg-gray-100 dark:bg-slate-800 text-gray-900 dark:text-white"
                          : "text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800/70"
                      }`}
                    >
                      <div className="truncate flex-1">
                        <span className="font-semibold">{opt.label}</span>
                        {opt.subLabel && (
                          <span className="text-[11px] text-gray-400 dark:text-slate-400 ml-1.5 font-normal">
                            ({opt.subLabel})
                          </span>
                        )}
                      </div>
                      {isSelected && (
                        <Check size={14} className="text-teal-600 dark:text-teal-400 flex-shrink-0" />
                      )}
                    </button>
                  );
                })
              ) : (
                <div className="py-4 px-3 text-center text-gray-400 dark:text-slate-500 text-xs">
                  Không tìm thấy "{searchQuery}"
                </div>
              )}
            </div>

            {/* Footer: Thao tác tạo mới */}
            {onCreateNew && (
              <div className="p-1.5 border-t border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/30">
                {searchQuery.trim() && !options.some((o) => removeVietnameseTones(o.label) === removeVietnameseTones(searchQuery.trim())) ? (
                  <button
                    type="button"
                    onClick={() => {
                      onCreateNew(searchQuery.trim());
                      handleClose();
                    }}
                    className="w-full px-2.5 py-1.5 text-left text-xs font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Plus size={14} />
                    <span className="truncate">Thêm "{searchQuery.trim()}"</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      onCreateNew();
                      handleClose();
                    }}
                    className="w-full px-2.5 py-1.5 text-left text-xs font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Plus size={14} />
                    <span>{createNewText}</span>
                  </button>
                )}
              </div>
            )}
          </div>,
          document.body
        )}
    </div>
  );
};
