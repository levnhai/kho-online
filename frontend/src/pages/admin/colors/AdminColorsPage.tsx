import React, { useState, useEffect, useCallback } from 'react';
import {
  Palette,
  Plus,
  Search,
  Edit2,
  Trash2,
  Copy,
  Check,
  Package,
  AlertCircle,
  CheckCircle2,
  LayoutGrid,
  List,
  RefreshCw,
} from 'lucide-react';
import { colorApi } from '@/entities/color/api/colorApi';
import { ColorItem } from '@/shared/types';
import { Button } from '@/shared/ui/Button';
import { Input } from '@/shared/ui/Input';
import { Modal } from '@/shared/ui/Modal';
import { LoadingSpinner } from '@/shared/ui/LoadingSpinner';

export const AdminColorsPage: React.FC = () => {
  const [colors, setColors] = useState<ColorItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [currentId, setCurrentId] = useState<string | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [hexCode, setHexCode] = useState('#000000');
  const [isActive, setIsActive] = useState(true);

  // Delete Confirm Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [colorToDelete, setColorToDelete] = useState<ColorItem | null>(null);

  // Status & Notification feedback
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');
  const [copiedHex, setCopiedHex] = useState<string | null>(null);

  // Fetch Colors
  const fetchColors = useCallback(async (skipCache = true) => {
    setLoading(true);
    try {
      const data = await colorApi.getAll({ skipCache });
      setColors(data);
    } catch (err: any) {
      console.error('Lỗi tải danh sách màu sắc:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchColors(true);
  }, [fetchColors]);

  // Copy HEX Code to Clipboard
  const handleCopyHex = (hex: string) => {
    navigator.clipboard.writeText(hex);
    setCopiedHex(hex);
    setTimeout(() => setCopiedHex(null), 2000);
  };

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setModalMode('create');
    setCurrentId(null);
    // Tự động gợi ý mã màu tiếp theo dạng M1, M2, M3...
    const nextIndex = colors.length + 1;
    setName('');
    setCode(`M${nextIndex}`);
    setHexCode('#000000');
    setIsActive(true);
    setFormError('');
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (color: ColorItem) => {
    setModalMode('edit');
    setCurrentId(color._id);
    setName(color.name);
    setCode(color.code);
    setHexCode(color.hexCode || '#000000');
    setIsActive(color.isActive !== false);
    setFormError('');
    setIsModalOpen(true);
  };

  // Submit Form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError('Vui lòng nhập tên màu sắc');
      return;
    }
    if (!code.trim()) {
      setFormError('Vui lòng nhập mã ký hiệu (ví dụ: M1, M2, DEN, TRANG)');
      return;
    }
    if (!hexCode.trim()) {
      setFormError('Vui lòng chọn hoặc nhập mã màu HEX');
      return;
    }

    setFormLoading(true);
    setFormError('');

    try {
      const payload = {
        name: name.trim(),
        code: code.trim().toUpperCase(),
        hexCode: hexCode.trim().toUpperCase(),
        isActive,
      };

      if (modalMode === 'create') {
        const createdColor = await colorApi.create(payload);
        setColors((prev) => [createdColor, ...prev.filter((c) => c._id !== createdColor._id)]);
        setActionSuccess(`Đã thêm màu "${name}" (${code}) thành công!`);
      } else if (currentId) {
        const updatedColor = await colorApi.update(currentId, payload);
        setColors((prev) =>
          prev.map((c) => (c._id === currentId ? { ...c, ...updatedColor } : c))
        );
        setActionSuccess(`Đã cập nhật màu "${name}" thành công!`);
      }

      setIsModalOpen(false);
      fetchColors(true);
      setTimeout(() => setActionSuccess(''), 4000);
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Có lỗi xảy ra khi lưu thông tin màu sắc.');
    } finally {
      setFormLoading(false);
    }
  };

  // Confirm Delete
  const handleOpenDeleteConfirm = (color: ColorItem) => {
    setColorToDelete(color);
    setIsDeleteModalOpen(true);
  };

  const handleExecuteDelete = async () => {
    if (!colorToDelete) return;
    setFormLoading(true);
    try {
      await colorApi.delete(colorToDelete._id);
      setColors((prev) => prev.filter((c) => c._id !== colorToDelete._id));
      setIsDeleteModalOpen(false);
      setActionSuccess(`Đã xóa màu "${colorToDelete.name}" thành công.`);
      fetchColors(true);
      setTimeout(() => setActionSuccess(''), 4000);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Không thể xóa màu sắc này.');
    } finally {
      setFormLoading(false);
      setColorToDelete(null);
    }
  };

  // Filtered Colors
  const filteredColors = colors.filter((c) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      c.name.toLowerCase().includes(q) ||
      c.code.toLowerCase().includes(q) ||
      c.hexCode.toLowerCase().includes(q)
    );
  });

  // Calculate Contrast Color for badge or text
  const isLightColor = (hex: string) => {
    const cleanHex = hex.replace('#', '');
    if (cleanHex.length !== 6) return false;
    const r = parseInt(cleanHex.substring(0, 2), 16);
    const g = parseInt(cleanHex.substring(2, 4), 16);
    const b = parseInt(cleanHex.substring(4, 6), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.65;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Alert Success */}
      {actionSuccess && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl flex items-center gap-3 text-emerald-800 dark:text-emerald-300 shadow-sm animate-fade-in">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-600 dark:text-emerald-400" />
          <span className="font-semibold text-sm">{actionSuccess}</span>
        </div>
      )}

      {/* Main Controls & Search Bar */}
      <div className="bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-3xl border border-gray-100 dark:border-slate-700 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            type="text"
            placeholder="Tìm theo tên màu, mã (M1), mã HEX (#000000)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-11 rounded-2xl bg-gray-50 dark:bg-slate-900 border-gray-200 dark:border-slate-700 focus:bg-white text-sm"
          />
        </div>

        {/* View Switcher & Actions */}
        <div className="flex items-center gap-2.5 self-end md:self-auto">
          <div className="flex items-center bg-gray-100 dark:bg-slate-900 p-1 rounded-2xl border border-gray-200 dark:border-slate-700">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-gray-500 hover:text-gray-800 dark:text-slate-400'
              }`}
              title="Xem dạng lưới (Swatches)"
            >
              <LayoutGrid size={16} />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-gray-500 hover:text-gray-800 dark:text-slate-400'
              }`}
              title="Xem dạng danh sách (Table)"
            >
              <List size={16} />
            </button>
          </div>

          <Button
            variant="outline"
            onClick={fetchColors}
            className="rounded-2xl h-11 px-3.5 border-gray-200 dark:border-slate-700"
            title="Tải lại danh sách"
          >
            <RefreshCw size={16} />
          </Button>

          <Button
            onClick={handleOpenCreateModal}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl h-11 px-5 shadow-lg shadow-blue-500/25 flex items-center gap-2 cursor-pointer"
          >
            <Plus size={18} />
            <span>Thêm Màu Mới</span>
          </Button>
        </div>
      </div>

      {/* Content: List or Grid */}
      {loading ? (
        <div className="p-16 flex items-center justify-center">
          <LoadingSpinner text="Đang tải bảng màu sắc..." />
        </div>
      ) : filteredColors.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-12 text-center border border-gray-100 dark:border-slate-700 shadow-sm space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-blue-50 dark:bg-slate-700 flex items-center justify-center mx-auto text-blue-500">
            <Palette className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-gray-800 dark:text-white">
              {search ? 'Không tìm thấy màu sắc phù hợp' : 'Chưa có màu sắc nào'}
            </h3>
            <p className="text-sm text-gray-500 dark:text-slate-400 max-w-md mx-auto">
              {search
                ? `Không có kết quả nào khớp với "${search}". Vui lòng thử từ khóa khác.`
                : 'Hãy bắt đầu thêm các màu sắc chuẩn (như M1 - Màu đen, M2 - Màu trắng...) để áp dụng cho sản phẩm.'}
            </p>
          </div>
          {!search && (
            <Button
              onClick={handleOpenCreateModal}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-2xl px-6 font-bold shadow-md shadow-blue-500/20"
            >
              <Plus size={18} className="mr-2" /> Thêm màu đầu tiên
            </Button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        /* GRID VIEW (Thẻ màu Swatch) */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredColors.map((color) => {
            const isLight = isLightColor(color.hexCode || '#000000');
            return (
              <div
                key={color._id}
                className="bg-white dark:bg-slate-800 rounded-3xl p-5 border border-gray-100 dark:border-slate-700 shadow-sm hover:shadow-md hover:border-blue-300 dark:hover:border-blue-600/50 transition-all group flex flex-col justify-between space-y-4"
              >
                {/* Top: Color Preview Circle & Badges */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3.5">
                    {/* Color Swatch Circle */}
                    <div
                      className="w-14 h-14 rounded-2xl shadow-md border-2 border-black/10 dark:border-white/20 flex items-center justify-center transition-transform group-hover:scale-105 flex-shrink-0"
                      style={{ backgroundColor: color.hexCode }}
                      title={`Mã HEX: ${color.hexCode}`}
                    >
                      {isLight ? (
                        <div className="w-2.5 h-2.5 rounded-full bg-black/30" />
                      ) : (
                        <div className="w-2.5 h-2.5 rounded-full bg-white/40" />
                      )}
                    </div>

                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 uppercase">
                          {color.code}
                        </span>
                        {color.isActive === false && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-gray-100 dark:bg-slate-700 text-gray-500">
                            Tạm ẩn
                          </span>
                        )}
                      </div>
                      <h4 className="font-extrabold text-base text-gray-900 dark:text-white leading-tight">
                        {color.name}
                      </h4>
                    </div>
                  </div>
                </div>

                {/* Middle: Hex Code */}
                <div className="pt-1 border-t border-gray-100 dark:border-slate-700/60">
                  <div className="flex items-center justify-between bg-gray-50 dark:bg-slate-900/80 px-3 py-2 rounded-xl border border-gray-100 dark:border-slate-800">
                    <span className="text-xs font-mono font-bold text-gray-700 dark:text-gray-300">
                      {color.hexCode}
                    </span>
                    <button
                      onClick={() => handleCopyHex(color.hexCode)}
                      className="text-xs text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-1 cursor-pointer"
                      title="Sao chép mã màu HEX"
                    >
                      {copiedHex === color.hexCode ? (
                        <>
                          <Check size={14} className="text-emerald-500" />
                          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
                            Đã chép
                          </span>
                        </>
                      ) : (
                        <>
                          <Copy size={14} />
                          <span className="text-[11px] font-medium">Chép mã</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Bottom: Action Buttons */}
                <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-slate-700/60">
                  <div className="flex items-center gap-1 text-[11px] text-gray-500 dark:text-slate-400">
                    <Package size={13} className="text-gray-400" />
                    <span>
                      {color.productCount || 0} sản phẩm
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEditModal(color)}
                      className="p-2 rounded-xl text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                      title="Chỉnh sửa màu"
                    >
                      <Edit2 size={15} />
                    </button>
                    <button
                      onClick={() => handleOpenDeleteConfirm(color)}
                      className="p-2 rounded-xl text-gray-600 dark:text-gray-300 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                      title="Xóa màu"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600 dark:text-slate-300">
              <thead className="bg-gray-50/80 dark:bg-slate-900/80 text-[11px] uppercase tracking-wider font-extrabold text-gray-500 dark:text-slate-400 border-b border-gray-100 dark:border-slate-700">
                <tr>
                  <th className="py-4 px-6">Mẫu màu</th>
                  <th className="py-4 px-6">Mã màu (Code)</th>
                  <th className="py-4 px-6">Tên màu sắc</th>
                  <th className="py-4 px-6">Mã HEX</th>
                  <th className="py-4 px-6 text-center">Trạng thái</th>
                  <th className="py-4 px-6 text-center">Sản phẩm</th>
                  <th className="py-4 px-6 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-700/60">
                {filteredColors.map((color) => (
                  <tr
                    key={color._id}
                    className="hover:bg-gray-50/50 dark:hover:bg-slate-700/30 transition-colors"
                  >
                    <td className="py-3.5 px-6">
                      <div
                        className="w-8 h-8 rounded-xl shadow-xs border border-black/15 dark:border-white/20"
                        style={{ backgroundColor: color.hexCode }}
                      />
                    </td>
                    <td className="py-3.5 px-6 font-mono font-black text-blue-600 dark:text-blue-400">
                      {color.code}
                    </td>
                    <td className="py-3.5 px-6 font-bold text-gray-900 dark:text-white">
                      {color.name}
                    </td>
                    <td className="py-3.5 px-6 font-mono text-xs">
                      <span className="px-2 py-1 bg-gray-100 dark:bg-slate-900 rounded-md font-semibold">
                        {color.hexCode}
                      </span>
                    </td>
                    <td className="py-3.5 px-6 text-center">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold ${
                          color.isActive !== false
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : 'bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-gray-400'
                        }`}
                      >
                        {color.isActive !== false ? 'Kích hoạt' : 'Tạm ẩn'}
                      </span>
                    </td>
                    <td className="py-3.5 px-6 text-center font-bold text-gray-700 dark:text-gray-300">
                      {color.productCount || 0}
                    </td>
                    <td className="py-3.5 px-6 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenEditModal(color)}
                          className="p-1.5 rounded-lg text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-700 transition-colors"
                          title="Chỉnh sửa"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleOpenDeleteConfirm(color)}
                          className="p-1.5 rounded-lg text-gray-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                          title="Xóa"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CREATE / EDIT MODAL */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === 'create' ? 'Thêm Màu Sắc Mới' : 'Cập Nhật Màu Sắc'}
        maxWidth="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          {formError && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-2xl flex items-center gap-2 text-rose-700 dark:text-rose-300 text-xs font-semibold">
              <AlertCircle size={16} className="flex-shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* Live Preview Box */}
          <div className="p-4 rounded-2xl bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 flex items-center gap-4">
            <div
              className="w-14 h-14 rounded-2xl shadow-md border-2 border-black/15 dark:border-white/20 flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: hexCode || '#000000' }}
            />
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300">
                  {code || 'M...'}
                </span>
                <span className="text-xs font-mono font-bold text-gray-500">
                  {hexCode || '#000000'}
                </span>
              </div>
              <div className="font-extrabold text-base text-gray-900 dark:text-white truncate">
                {name || 'Tên màu hiển thị'}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Tên màu */}
            <div className="space-y-1.5">
              <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-700 dark:text-slate-300">
                Tên màu <span className="text-rose-500">*</span>
              </label>
              <Input
                type="text"
                placeholder="Ví dụ: Màu đen, Xanh navy, Be..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="rounded-2xl"
              />
            </div>

            {/* Mã màu ký hiệu */}
            <div className="space-y-1.5">
              <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-700 dark:text-slate-300">
                Mã ký hiệu (Code) <span className="text-rose-500">*</span>
              </label>
              <Input
                type="text"
                placeholder="Ví dụ: M1, M2, DEN, TRANG..."
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                required
                className="rounded-2xl uppercase font-mono font-bold"
              />
            </div>
          </div>

          {/* Color Picker & Hex Code */}
          <div className="space-y-1.5">
            <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-700 dark:text-slate-300">
              Mã màu HEX & Bảng chọn màu <span className="text-rose-500">*</span>
            </label>
            <div className="flex items-center gap-3">
              {/* Native Color Picker input */}
              <div className="relative w-12 h-11 rounded-2xl overflow-hidden border border-gray-300 dark:border-slate-600 shadow-xs flex-shrink-0 cursor-pointer">
                <input
                  type="color"
                  value={hexCode.startsWith('#') ? hexCode : '#000000'}
                  onChange={(e) => setHexCode(e.target.value.toUpperCase())}
                  className="absolute -top-2 -left-2 w-16 h-16 cursor-pointer opacity-100"
                  title="Bấm để chọn màu trực quan"
                />
              </div>

              {/* Text Hex input */}
              <Input
                type="text"
                placeholder="#000000"
                value={hexCode}
                onChange={(e) => setHexCode(e.target.value.toUpperCase())}
                className="flex-1 font-mono font-bold uppercase rounded-2xl"
                maxLength={7}
              />
            </div>
          </div>

          {/* Active Status Checkbox */}
          <div className="pt-2">
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-gray-300"
              />
              <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                Kích hoạt màu này (Cho phép chọn khi tạo/sửa sản phẩm)
              </span>
            </label>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-slate-700">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
              className="rounded-2xl px-5"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={formLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl px-6 shadow-md shadow-blue-500/25"
            >
              {formLoading ? 'Đang lưu...' : modalMode === 'create' ? 'Tạo Màu' : 'Cập Nhật'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* DELETE CONFIRMATION MODAL */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Xác Nhận Xóa Màu Sắc"
      >
        <div className="space-y-4 pt-2">
          <div className="p-4 bg-rose-50 dark:bg-rose-950/30 rounded-2xl border border-rose-200 dark:border-rose-900 flex items-start gap-3 text-rose-800 dark:text-rose-300 text-sm">
            <AlertCircle size={20} className="flex-shrink-0 text-rose-600" />
            <div>
              Bạn có chắc chắn muốn xóa màu{' '}
              <strong className="font-bold">
                {colorToDelete?.name} ({colorToDelete?.code})
              </strong>
              ?
              {colorToDelete && colorToDelete.productCount && colorToDelete.productCount > 0 ? (
                <p className="mt-1 text-xs text-rose-600 dark:text-rose-400 font-semibold">
                  Màu này hiện đang được sử dụng trong {colorToDelete.productCount} sản phẩm. Hệ thống sẽ từ chối xóa để đảm bảo toàn vẹn dữ liệu.
                </p>
              ) : (
                <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">
                  Hành động này không thể hoàn tác sau khi đã thực hiện.
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDeleteModalOpen(false)}
              className="rounded-2xl px-5"
            >
              Đóng
            </Button>
            <Button
              type="button"
              onClick={handleExecuteDelete}
              disabled={formLoading}
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-2xl px-6 shadow-md shadow-rose-600/20"
            >
              {formLoading ? 'Đang xóa...' : 'Xóa Màu'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
