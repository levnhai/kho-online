import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Plus,
  Eye,
  Pencil,
  Trash2,
  Boxes,
  Truck,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Image as ImageIcon,
  Sparkles,
} from 'lucide-react';
import { importApi } from '@/entities/import/api/importApi';
import { ImportReceipt, ImportStatus } from '@/shared/types';
import { formatCurrency, formatDate } from '@/shared/lib/formatters';
import { Button } from '@/shared/ui/Button';
import { Modal } from '@/shared/ui/Modal';
import { LoadingSpinner } from '@/shared/ui/LoadingSpinner';
import { getImageUrl, handleImageError, DEFAULT_PRODUCT_FALLBACK_IMAGE } from '@/shared/lib/imageHelper';

export const IMPORT_STATUS_CONFIG: Record<
  string,
  { label: string; text: string; bg: string; border: string; dot: string }
> = {
  ORDERED: {
    label: 'Đã đặt',
    text: 'text-sky-700 dark:text-sky-300',
    bg: 'bg-sky-50 dark:bg-sky-950/50',
    border: 'border-sky-200 dark:border-sky-800',
    dot: 'bg-sky-500',
  },
  KHO_TRUNG: {
    label: 'Kho Trung',
    text: 'text-amber-700 dark:text-amber-300',
    bg: 'bg-amber-50 dark:bg-amber-950/50',
    border: 'border-amber-200 dark:border-amber-800',
    dot: 'bg-amber-500',
  },
  KHO_VIET: {
    label: 'Kho Việt',
    text: 'text-purple-700 dark:text-purple-300',
    bg: 'bg-purple-50 dark:bg-purple-950/50',
    border: 'border-purple-200 dark:border-purple-800',
    dot: 'bg-purple-500',
  },
  SHIPPING: {
    label: 'Vận chuyển',
    text: 'text-blue-700 dark:text-blue-300',
    bg: 'bg-blue-50 dark:bg-blue-950/50',
    border: 'border-blue-200 dark:border-blue-800',
    dot: 'bg-blue-500',
  },
  COMPLETED: {
    label: 'Thành công',
    text: 'text-emerald-700 dark:text-emerald-300',
    bg: 'bg-emerald-50 dark:bg-emerald-950/50',
    border: 'border-emerald-200 dark:border-emerald-800',
    dot: 'bg-emerald-500',
  },
  SUCCESS: {
    label: 'Thành công',
    text: 'text-emerald-700 dark:text-emerald-300',
    bg: 'bg-emerald-50 dark:bg-emerald-950/50',
    border: 'border-emerald-200 dark:border-emerald-800',
    dot: 'bg-emerald-500',
  },
  CANCELLED: {
    label: 'Đã hủy',
    text: 'text-rose-700 dark:text-rose-300',
    bg: 'bg-rose-50 dark:bg-rose-950/50',
    border: 'border-rose-200 dark:border-rose-800',
    dot: 'bg-rose-500',
  },
};

export const getImportStatusConfig = (status?: string) => {
  const key = (status || 'ORDERED').toUpperCase();
  return (
    IMPORT_STATUS_CONFIG[key] || {
      label: status || 'Đã đặt',
      text: 'text-gray-700 dark:text-gray-300',
      bg: 'bg-gray-100 dark:bg-slate-700',
      border: 'border-gray-200 dark:border-slate-600',
      dot: 'bg-gray-400',
    }
  );
};

export const AdminImportsPage: React.FC = () => {
  const [imports, setImports] = useState<ImportReceipt[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedImport, setSelectedImport] = useState<ImportReceipt | null>(null);

  // Form State for creating/editing import order
  const [supplier, setSupplier] = useState('');
  const [productCode, setProductCode] = useState('');
  const [orderName, setOrderName] = useState('');
  const [image, setImage] = useState('');
  const [quantity, setQuantity] = useState<number>(1);
  const [totalAmount, setTotalAmount] = useState<number | ''>('');
  const [status, setStatus] = useState<ImportStatus>('ORDERED');
  const [note, setNote] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [actionSuccess, setActionSuccess] = useState('');
  const [actionError, setActionError] = useState('');

  const fetchImports = useCallback(async () => {
    setLoading(true);
    try {
      const res = await importApi.getAll({
        search: search || undefined,
        status: statusFilter || undefined,
        limit: 50,
      });
      setImports(res.items || []);
      setTotal(res.total || 0);
    } catch (err) {
      console.error('Fetch imports error:', err);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    fetchImports();
  }, [fetchImports]);

  // Stats calculation
  const totalAmountSum = imports.reduce((sum, item) => sum + (item.totalAmount || 0), 0);
  const totalQuantitySum = imports.reduce((sum, item) => sum + (item.totalQuantity || 0), 0);

  // Sinh mã sản phẩm ngẫu nhiên
  const generateRandomProductCode = () => {
    const randomCode = `SP${Math.floor(1000 + Math.random() * 9000)}`;
    setProductCode(randomCode);
  };

  const handleOpenCreateModal = () => {
    setModalMode('create');
    setEditingId(null);
    setSupplier('');
    setProductCode(`SP${Math.floor(1000 + Math.random() * 9000)}`);
    setOrderName('');
    setImage('');
    setQuantity(1);
    setTotalAmount('');
    setStatus('ORDERED');
    setNote('');
    setActionError('');
    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = (item: ImportReceipt) => {
    setModalMode('edit');
    setEditingId(item._id);
    setSupplier(item.supplier || '');
    setProductCode(item.productCode || item.items?.[0]?.productCode || '');
    setOrderName(item.orderName || item.items?.[0]?.productName || '');
    setImage(item.image || item.items?.[0]?.productImage || '');
    setQuantity(item.totalQuantity || 1);
    setTotalAmount(item.totalAmount || 0);
    setStatus(item.status || 'ORDERED');
    setNote(item.note || '');
    setActionError('');
    setIsFormModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!orderName.trim()) {
      setActionError('Vui lòng nhập tên đơn hàng');
      return;
    }

    if (Number(quantity) <= 0) {
      setActionError('Số lượng nhập phải lớn hơn 0');
      return;
    }

    if (totalAmount === '' || Number(totalAmount) < 0) {
      setActionError('Tổng tiền nhập không hợp lệ');
      return;
    }

    const finalProductCode =
      productCode.trim().toUpperCase() || `SP${Math.floor(1000 + Math.random() * 9000)}`;

    setSubmitting(true);
    setActionError('');
    try {
      if (modalMode === 'create') {
        const created = await importApi.create({
          supplier: supplier.trim() || 'Nhà cung cấp',
          productCode: finalProductCode,
          orderName: orderName.trim(),
          image: image.trim() || undefined,
          quantity: Number(quantity),
          totalAmount: Number(totalAmount),
          status: status,
          note: note.trim() || undefined,
        });

        setImports((prev) => [created, ...prev]);
        setTotal((prev) => prev + 1);
        setActionSuccess(`Đã tạo phiếu nhập ${created.importCode} thành công!`);
      } else if (modalMode === 'edit' && editingId) {
        const updated = await importApi.update(editingId, {
          supplier: supplier.trim() || 'Nhà cung cấp',
          productCode: finalProductCode,
          orderName: orderName.trim(),
          image: image.trim() || undefined,
          quantity: Number(quantity),
          totalAmount: Number(totalAmount),
          status: status,
          note: note.trim() || undefined,
        });

        setImports((prev) => prev.map((item) => (item._id === editingId ? updated : item)));
        if (selectedImport?._id === editingId) {
          setSelectedImport(updated);
        }
        setActionSuccess(`Đã cập nhật phiếu nhập ${updated.importCode} thành công!`);
      }

      setIsFormModalOpen(false);
      setTimeout(() => setActionSuccess(''), 4000);
    } catch (err: any) {
      setActionError(err.message || 'Thao tác phiếu nhập hàng thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  // Cập nhật trạng thái trực tiếp từ bảng
  const handleQuickStatusChange = async (id: string, newStatus: string) => {
    try {
      const updated = await importApi.updateStatus(id, newStatus);
      setImports((prev) => prev.map((item) => (item._id === id ? updated : item)));
      if (selectedImport?._id === id) {
        setSelectedImport(updated);
      }
      const stConfig = getImportStatusConfig(newStatus);
      setActionSuccess(`Đã chuyển trạng thái sang "${stConfig.label}"`);
      setTimeout(() => setActionSuccess(''), 3000);
    } catch (err: any) {
      alert(err.message || 'Cập nhật trạng thái thất bại');
    }
  };

  const handleDeleteImport = async (id: string, importCode: string) => {
    if (
      !window.confirm(
        `Bạn có chắc muốn xóa phiếu nhập ${importCode}? Số lượng tồn kho đã nhập sẽ được hoàn tác trừ lại.`
      )
    ) {
      return;
    }

    try {
      await importApi.delete(id);
      setImports((prev) => prev.filter((item) => item._id !== id));
      setTotal((prev) => Math.max(0, prev - 1));
      setActionSuccess(`Đã xóa phiếu nhập ${importCode} thành công`);
      setTimeout(() => setActionSuccess(''), 3000);
    } catch (err: any) {
      alert(err.message || 'Xóa phiếu nhập thất bại');
    }
  };

  // Helper lấy ảnh đại diện sản phẩm của phiếu nhập
  const getImportImage = (item: ImportReceipt) => {
    if (item.image) return item.image;
    if (item.items && item.items.length > 0) {
      const firstItem = item.items[0];
      if (firstItem.productImage) return firstItem.productImage;
      if (typeof firstItem.product === 'object' && (firstItem.product as any)?.images?.[0]) {
        return (firstItem.product as any).images[0];
      }
    }
    return DEFAULT_PRODUCT_FALLBACK_IMAGE;
  };

  // Helper lấy tên đơn hàng
  const getImportName = (item: ImportReceipt) => {
    if (item.orderName) return item.orderName;
    if (item.items && item.items.length > 0) {
      const firstItem = item.items[0];
      return `${firstItem.productName}${item.items.length > 1 ? ` (+${item.items.length - 1} SP)` : ''}`;
    }
    return 'Đơn nhập hàng';
  };

  // Helper lấy mã sản phẩm
  const getImportProductCode = (item: ImportReceipt) => {
    if (item.productCode) return item.productCode;
    if (item.items && item.items.length > 0) {
      return item.items[0].productCode || '';
    }
    return '';
  };

  return (
    <div className="space-y-4 sm:space-y-6 text-gray-900 dark:text-white">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-gray-100 dark:border-slate-700 shadow-sm flex items-center gap-3.5 transition-colors">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center flex-shrink-0">
            <Truck size={20} />
          </div>
          <div>
            <p className="text-[11px] sm:text-xs text-gray-400 dark:text-gray-400 font-bold uppercase tracking-wider">
              Tổng phiếu nhập
            </p>
            <h3 className="text-lg sm:text-2xl font-black text-gray-900 dark:text-white">{total}</h3>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-gray-100 dark:border-slate-700 shadow-sm flex items-center gap-3.5 transition-colors">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-emerald-50 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
            <Boxes size={20} />
          </div>
          <div>
            <p className="text-[11px] sm:text-xs text-gray-400 dark:text-gray-400 font-bold uppercase tracking-wider">
              Số lượng đã nhập
            </p>
            <h3 className="text-lg sm:text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {totalQuantitySum.toLocaleString()} SP
            </h3>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-gray-100 dark:border-slate-700 shadow-sm flex items-center gap-3.5 transition-colors">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center flex-shrink-0">
            <DollarSign size={20} />
          </div>
          <div>
            <p className="text-[11px] sm:text-xs text-gray-400 dark:text-gray-400 font-bold uppercase tracking-wider">
              Tổng chi phí nhập
            </p>
            <h3 className="text-lg sm:text-2xl font-black text-indigo-600 dark:text-indigo-400">
              {formatCurrency(totalAmountSum)}
            </h3>
          </div>
        </div>
      </div>

      {/* Control bar: Search + Status Filter + Create Button */}
      <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-gray-100 dark:border-slate-700 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 transition-colors">
        <div className="flex flex-col sm:flex-row flex-1 items-stretch sm:items-center gap-2 sm:gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Tìm theo Mã đơn hàng, Mã SP, Tên đơn hàng, Ghi chú, Nhà cung cấp..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-2 text-xs border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-white rounded-xl focus:border-blue-500 focus:outline-none placeholder-gray-400 dark:placeholder-slate-400 shadow-2xs"
            />
            <Search size={14} className="absolute left-2.5 top-2.5 text-gray-400" />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="py-2 px-3 text-xs border border-gray-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none shadow-2xs font-semibold"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="ORDERED">Đã đặt</option>
            <option value="KHO_TRUNG">Kho Trung</option>
            <option value="KHO_VIET">Kho Việt</option>
            <option value="SHIPPING">Vận chuyển</option>
            <option value="COMPLETED">Thành công</option>
            <option value="CANCELLED">Đã hủy</option>
          </select>
        </div>

        <Button
          variant="primary"
          size="sm"
          icon={<Plus size={14} />}
          onClick={handleOpenCreateModal}
          className="text-xs py-2 px-4 font-bold shadow-xs whitespace-nowrap"
        >
          Tạo phiếu nhập hàng
        </Button>
      </div>

      {/* Imports Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl sm:rounded-3xl border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden transition-colors">
        {loading ? (
          <div className="p-12 flex justify-center">
            <LoadingSpinner size="lg" />
          </div>
        ) : imports.length === 0 ? (
          <div className="p-12 text-center">
            <Boxes className="w-12 h-12 mx-auto text-gray-300 dark:text-slate-600 mb-3" />
            <p className="text-sm font-semibold text-gray-500 dark:text-slate-400">
              Chưa có phiếu nhập hàng nào được tạo
            </p>
            <Button
              variant="outline"
              size="sm"
              icon={<Plus size={14} />}
              onClick={handleOpenCreateModal}
              className="mt-4 text-xs"
            >
              Tạo phiếu nhập đầu tiên
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50/80 dark:bg-slate-900/50 text-gray-500 dark:text-slate-400 border-b border-gray-100 dark:border-slate-700">
                <tr>
                  <th className="py-3.5 px-4 font-bold">Mã đơn hàng</th>
                  <th className="py-3.5 px-4 font-bold text-center">Ảnh sản phẩm</th>
                  <th className="py-3.5 px-4 font-bold">Tên đơn hàng</th>
                  <th className="py-3.5 px-4 font-bold text-center">Số lượng</th>
                  <th className="py-3.5 px-4 font-bold text-right">Tiền nhập</th>
                  <th className="py-3.5 px-4 font-bold">Ghi chú đơn hàng</th>
                  <th className="py-3.5 px-4 font-bold text-center">Trạng thái đơn hàng</th>
                  <th className="py-3.5 px-4 font-bold text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                {imports.map((item) => {
                  const imgUrl = getImportImage(item);
                  const title = getImportName(item);
                  const pCode = getImportProductCode(item);
                  const stConfig = getImportStatusConfig(item.status);
                  return (
                    <tr
                      key={item._id}
                      className="hover:bg-gray-50/50 dark:hover:bg-slate-700/30 transition-colors"
                    >
                      {/* 1. Mã đơn hàng */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="font-black text-blue-600 dark:text-blue-400">
                          {item.importCode}
                        </span>
                        <div className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">
                          <Calendar size={11} className="inline mr-1 -mt-0.5" />
                          {formatDate(item.createdAt)}
                        </div>
                      </td>

                      {/* 2. Ảnh sản phẩm */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-100 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 mx-auto flex items-center justify-center flex-shrink-0">
                          <img
                            src={getImageUrl(imgUrl)}
                            alt={title}
                            className="w-full h-full object-cover"
                            onError={handleImageError}
                          />
                        </div>
                      </td>

                      {/* 3. Tên đơn hàng */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <p className="font-bold text-gray-900 dark:text-white text-xs sm:text-sm line-clamp-1">
                            {title}
                          </p>
                          {pCode && (
                            <span className="px-1.5 py-0.2 rounded bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 font-bold text-[10px]">
                              {pCode}
                            </span>
                          )}
                        </div>
                        {item.supplier && (
                          <p className="text-[11px] text-gray-400 dark:text-gray-500 truncate max-w-xs mt-0.5">
                            NCC: {item.supplier}
                          </p>
                        )}
                      </td>

                      {/* 4. Số lượng */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span className="px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-bold text-xs">
                          {item.totalQuantity || 0} SP
                        </span>
                      </td>

                      {/* 5. Tiền nhập */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <span className="font-black text-emerald-600 dark:text-emerald-400 text-xs sm:text-sm">
                          {formatCurrency(item.totalAmount)}
                        </span>
                      </td>

                      {/* 6. Ghi chú đơn hàng */}
                      <td className="py-3.5 px-4 max-w-xs">
                        {item.note ? (
                          <p className="text-xs text-gray-700 dark:text-gray-300 line-clamp-2">
                            {item.note}
                          </p>
                        ) : (
                          <span className="text-gray-400 italic text-[11px]">Không có ghi chú</span>
                        )}
                        <p className="text-[10px] text-gray-400 mt-0.5">
                          Tạo bởi: {item.createdBy?.name || 'Admin'}
                        </p>
                      </td>

                      {/* 7. Trạng thái đơn hàng: Cho phép chọn & cập nhật trực tiếp */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <div className="relative inline-block">
                          <select
                            value={item.status || 'ORDERED'}
                            onChange={(e) => handleQuickStatusChange(item._id, e.target.value)}
                            className={`py-1 px-2.5 pr-6 rounded-full text-[11px] font-extrabold border appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all ${stConfig.bg} ${stConfig.text} ${stConfig.border}`}
                          >
                            <option value="ORDERED" className="bg-white dark:bg-slate-800 text-gray-900 dark:text-white">
                              🔵 Đã đặt
                            </option>
                            <option value="KHO_TRUNG" className="bg-white dark:bg-slate-800 text-gray-900 dark:text-white">
                              🟠 Kho Trung
                            </option>
                            <option value="KHO_VIET" className="bg-white dark:bg-slate-800 text-gray-900 dark:text-white">
                              🟣 Kho Việt
                            </option>
                            <option value="SHIPPING" className="bg-white dark:bg-slate-800 text-gray-900 dark:text-white">
                              🚚 Vận chuyển
                            </option>
                            <option value="COMPLETED" className="bg-white dark:bg-slate-800 text-gray-900 dark:text-white">
                              🟢 Thành công
                            </option>
                            <option value="CANCELLED" className="bg-white dark:bg-slate-800 text-gray-900 dark:text-white">
                              🔴 Đã hủy
                            </option>
                          </select>
                          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-1.5 text-current opacity-70">
                            <svg className="fill-current h-3 w-3" viewBox="0 0 20 20">
                              <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                            </svg>
                          </div>
                        </div>
                      </td>

                      {/* 8. Thao tác: Xem chi tiết, Chỉnh sửa, Xóa */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => setSelectedImport(item)}
                            className="p-1.5 text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                            title="Xem chi tiết"
                          >
                            <Eye size={15} />
                          </button>
                          <button
                            onClick={() => handleOpenEditModal(item)}
                            className="p-1.5 text-gray-500 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/30 rounded-lg transition-colors"
                            title="Chỉnh sửa phiếu nhập"
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            onClick={() => handleDeleteImport(item._id, item.importCode)}
                            className="p-1.5 text-gray-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition-colors"
                            title="Hủy & Xóa phiếu"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL: TẠO HOẶC CHỈNH SỬA PHIẾU NHẬP HÀNG */}
      {isFormModalOpen && (
        <Modal
          isOpen={isFormModalOpen}
          onClose={() => setIsFormModalOpen(false)}
          title={modalMode === 'create' ? 'Tạo phiếu nhập hàng mới' : 'Chỉnh sửa phiếu nhập hàng'}
          maxWidth="lg"
        >
          <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
            {actionError && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 rounded-xl border border-rose-200 dark:border-rose-800 flex items-center gap-2">
                <AlertCircle size={15} />
                <span>{actionError}</span>
              </div>
            )}

            {/* 1. HÀNG ĐẦU: Nhà cung cấp & Mã sản phẩm */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-gray-700 dark:text-gray-300 font-bold mb-1">
                  Nhà cung cấp / Nguồn hàng <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="VD: Tổng kho Apple VN, Synnex FPT..."
                  value={supplier}
                  onChange={(e) => setSupplier(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none font-medium"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-gray-700 dark:text-gray-300 font-bold">
                    Mã sản phẩm
                  </label>
                  <button
                    type="button"
                    onClick={generateRandomProductCode}
                    className="text-[11px] text-blue-600 dark:text-blue-400 font-bold inline-flex items-center gap-1 hover:underline"
                  >
                    <Sparkles size={12} />
                    <span>Sinh mã</span>
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="VD: SP1024 (Tự sinh mã nếu để trống)"
                  value={productCode}
                  onChange={(e) => setProductCode(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none uppercase font-mono font-bold"
                />
              </div>
            </div>

            {/* 2. Tên đơn hàng nhập */}
            <div>
              <label className="block text-gray-700 dark:text-gray-300 font-bold mb-1">
                Tên đơn hàng <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="VD: Đơn nhập iPhone 16 Pro Max 256GB đợt 1"
                value={orderName}
                onChange={(e) => setOrderName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none font-semibold"
              />
            </div>

            {/* 3. Hình ảnh sản phẩm (Link ảnh + Preview trực quan) */}
            <div>
              <label className="block text-gray-700 dark:text-gray-300 font-bold mb-1">
                Hình ảnh sản phẩm (URL)
              </label>
              <div className="flex gap-2.5 items-center">
                <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {image ? (
                    <img
                      src={getImageUrl(image)}
                      alt="Preview"
                      className="w-full h-full object-cover"
                      onError={handleImageError}
                    />
                  ) : (
                    <ImageIcon size={18} className="text-gray-400" />
                  )}
                </div>
                <input
                  type="text"
                  placeholder="https://... hoặc /uploads/..."
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>

            {/* 4. Số lượng, Tổng tiền nhập & Trạng thái */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-gray-50/70 dark:bg-slate-900/50 p-3.5 rounded-2xl border border-gray-100 dark:border-slate-700">
              <div>
                <label className="block text-gray-700 dark:text-gray-300 font-bold mb-1">
                  Số lượng nhập <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  placeholder="VD: 10"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none font-bold text-sm"
                />
              </div>

              <div>
                <label className="block text-gray-700 dark:text-gray-300 font-bold mb-1">
                  Tổng tiền nhập (VNĐ) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  required
                  placeholder="VD: 25000000"
                  value={totalAmount}
                  onChange={(e) =>
                    setTotalAmount(e.target.value === '' ? '' : Math.max(0, Number(e.target.value)))
                  }
                  className="w-full px-3 py-2 border border-gray-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 focus:border-blue-500 focus:outline-none font-black text-sm"
                />
              </div>

              <div>
                <label className="block text-gray-700 dark:text-gray-300 font-bold mb-1">
                  Trạng thái đơn hàng
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as ImportStatus)}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none font-bold text-xs"
                >
                  <option value="ORDERED">Đã đặt</option>
                  <option value="KHO_TRUNG">Kho Trung</option>
                  <option value="KHO_VIET">Kho Việt</option>
                  <option value="SHIPPING">Vận chuyển</option>
                  <option value="COMPLETED">Thành công</option>
                  <option value="CANCELLED">Đã hủy</option>
                </select>
              </div>
            </div>

            {/* 5. Ghi chú đơn hàng */}
            <div>
              <label className="block text-gray-700 dark:text-gray-300 font-bold mb-1">
                Ghi chú đơn hàng
              </label>
              <input
                type="text"
                placeholder="VD: Hàng mới 100% nguyên seal, bảo hành 12 tháng..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none"
              />
            </div>

            {/* Actions */}
            <div className="pt-2 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsFormModalOpen(false)}
                disabled={submitting}
              >
                Hủy bỏ
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                loading={submitting}
                className="font-bold"
              >
                {modalMode === 'create' ? 'Lưu phiếu nhập' : 'Cập nhật phiếu nhập'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* MODAL 2: CHI TIẾT PHIẾU NHẬP HÀNG */}
      {selectedImport && (
        <Modal
          isOpen={!!selectedImport}
          onClose={() => setSelectedImport(null)}
          title={`Chi tiết đơn nhập: ${selectedImport.importCode}`}
          maxWidth="lg"
        >
          <div className="space-y-4 text-xs">
            {/* Header info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-gray-50 dark:bg-slate-900/60 p-3.5 rounded-2xl border border-gray-100 dark:border-slate-700">
              <div className="flex gap-3 items-start">
                <div className="w-16 h-16 rounded-xl overflow-hidden bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 flex-shrink-0">
                  <img
                    src={getImportImage(selectedImport)}
                    alt={getImportName(selectedImport)}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-gray-900 dark:text-white text-sm">
                    {getImportName(selectedImport)}
                  </p>
                  {getImportProductCode(selectedImport) && (
                    <p className="text-gray-500 dark:text-gray-400 text-[11px] mt-0.5">
                      Mã SP:{' '}
                      <span className="font-mono font-bold text-blue-600">
                        {getImportProductCode(selectedImport)}
                      </span>
                    </p>
                  )}
                  <p className="text-gray-500 dark:text-gray-400 mt-0.5">
                    NCC: <strong>{selectedImport.supplier}</strong>
                  </p>
                  {selectedImport.note && (
                    <p className="text-gray-500 dark:text-gray-400 mt-0.5">
                      Ghi chú: {selectedImport.note}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <p className="font-bold text-gray-400 uppercase tracking-wider mb-0.5">
                  Thông tin đơn:
                </p>
                <p className="text-gray-700 dark:text-gray-300">
                  Mã đơn: <strong className="text-blue-600">{selectedImport.importCode}</strong>
                </p>
                <p className="text-gray-700 dark:text-gray-300">
                  Người tạo: <strong>{selectedImport.createdBy?.name || 'Admin'}</strong>
                </p>
                <p className="text-gray-500 dark:text-gray-400">
                  Ngày nhập: {formatDate(selectedImport.createdAt)}
                </p>
                <div className="mt-2">
                  <label className="block text-gray-400 font-bold mb-1">
                    Cập nhật trạng thái:
                  </label>
                  <select
                    value={selectedImport.status || 'ORDERED'}
                    onChange={(e) => handleQuickStatusChange(selectedImport._id, e.target.value)}
                    className="py-1 px-3 rounded-lg text-xs font-bold border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="ORDERED">🔵 Đã đặt</option>
                    <option value="KHO_TRUNG">🟠 Kho Trung</option>
                    <option value="KHO_VIET">🟣 Kho Việt</option>
                    <option value="SHIPPING">🚚 Vận chuyển</option>
                    <option value="COMPLETED">🟢 Thành công</option>
                    <option value="CANCELLED">🔴 Đã hủy</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Chi tiết số lượng & tổng tiền */}
            <div className="p-3 bg-gray-50/70 dark:bg-slate-900/40 rounded-xl border border-gray-100 dark:border-slate-700 flex justify-between items-center text-sm">
              <div>
                <span className="text-gray-500 dark:text-gray-400 font-medium">Số lượng nhập:</span>{' '}
                <strong className="text-blue-600 dark:text-blue-400 font-bold">
                  {selectedImport.totalQuantity} sản phẩm
                </strong>
              </div>
              <div className="text-right">
                <span className="text-gray-500 dark:text-gray-400 font-medium">Tổng tiền nhập:</span>{' '}
                <strong className="text-emerald-600 dark:text-emerald-400 text-base font-black">
                  {formatCurrency(selectedImport.totalAmount)}
                </strong>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
