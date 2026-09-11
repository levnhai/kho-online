import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Eye,
  Package,
  AlertCircle,
  CheckCircle2,
  Image as ImageIcon,
} from 'lucide-react';
import { productApi } from '@/entities/product/api/productApi';
import { categoryApi } from '@/entities/category/api/categoryApi';
import { Product, Category } from '@/shared/types';
import { formatCurrency } from '@/shared/lib/formatters';
import { Button } from '@/shared/ui/Button';
import { Input } from '@/shared/ui/Input';
import { Modal } from '@/shared/ui/Modal';
import { LoadingSpinner } from '@/shared/ui/LoadingSpinner';

export const AdminProductsPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  // Filter & Search
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [currentId, setCurrentId] = useState<string | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [price, setPrice] = useState<number | ''>('');
  const [salePrice, setSalePrice] = useState<number | ''>('');
  const [stock, setStock] = useState<number | ''>('');
  const [imagesList, setImagesList] = useState<string[]>([]);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('active');

  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await productApi.getAll({
        allStatus: true,
        search: search || undefined,
        category: selectedCategory || undefined,
        limit: 50,
      });
      setProducts(res.items);
      setTotal(res.total);
    } catch (err) {
      console.error('Fetch admin products error:', err);
    } finally {
      setLoading(false);
    }
  }, [search, selectedCategory]);

  useEffect(() => {
    categoryApi.getAll().then(setCategories).catch(console.error);
    fetchProducts();
  }, [fetchProducts]);

  const openCreateModal = () => {
    setModalMode('create');
    setCurrentId(null);
    setName('');
    setCode(`SP${Math.floor(1000 + Math.random() * 9000)}`);
    setCategoryId(categories[0]?._id || '');
    setPrice('');
    setSalePrice('');
    setStock(10);
    setImagesList([]);
    setNewImageUrl('');
    setDescription('');
    setStatus('active');
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (p: Product) => {
    setModalMode('edit');
    setCurrentId(p._id);
    setName(p.name);
    setCode(p.code);
    setCategoryId(typeof p.category === 'object' ? p.category._id : p.category);
    setPrice(p.price);
    setSalePrice(p.salePrice || '');
    setStock(p.stock);
    setImagesList(Array.isArray(p.images) ? p.images.filter(Boolean) : []);
    setNewImageUrl('');
    setDescription(p.description || '');
    setStatus(p.status || 'active');
    setFormError('');
    setIsModalOpen(true);
  };

  const handleAddImage = () => {
    const trimmed = newImageUrl.trim();
    if (!trimmed) return;
    if (!imagesList.includes(trimmed)) {
      setImagesList([...imagesList, trimmed]);
    }
    setNewImageUrl('');
  };

  const handleRemoveImage = (indexToRemove: number) => {
    setImagesList(imagesList.filter((_, idx) => idx !== indexToRemove));
  };

  const handleUpdateImage = (indexToUpdate: number, value: string) => {
    const updated = [...imagesList];
    updated[indexToUpdate] = value;
    setImagesList(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !code.trim() || !categoryId || price === '') {
      setFormError('Vui lòng nhập đầy đủ các trường bắt buộc (Tên, Mã, Thể loại, Giá)');
      return;
    }

    setFormLoading(true);
    setFormError('');

    try {
      // Gom tất cả ảnh hợp lệ
      const finalImages = imagesList.map((img) => img.trim()).filter(Boolean);
      if (newImageUrl.trim() && !finalImages.includes(newImageUrl.trim())) {
        finalImages.push(newImageUrl.trim());
      }

      const payload: any = {
        name,
        code: code.toUpperCase(),
        category: categoryId,
        price: Number(price),
        salePrice: salePrice !== '' ? Number(salePrice) : 0,
        stock: stock !== '' ? Number(stock) : 0,
        images: finalImages.length > 0 ? finalImages : ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80'],
        description,
        status,
      };

      if (modalMode === 'create') {
        await productApi.create(payload);
        setActionSuccess('Thêm sản phẩm mới thành công!');
      } else if (currentId) {
        await productApi.update(currentId, payload);
        setActionSuccess('Cập nhật sản phẩm thành công!');
      }

      setIsModalOpen(false);
      fetchProducts();
      setTimeout(() => setActionSuccess(''), 3000);
    } catch (err: any) {
      setFormError(err.message || 'Thao tác thất bại');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (p: Product) => {
    if (!window.confirm(`Bạn có chắc muốn xóa "${p.name}"?`)) {
      return;
    }
    try {
      await productApi.delete(p._id);
      setActionSuccess('Đã xóa sản phẩm!');
      fetchProducts();
      setTimeout(() => setActionSuccess(''), 3000);
    } catch (err: any) {
      alert(err.message || 'Xóa sản phẩm thất bại');
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 text-gray-900 dark:text-white">
      {/* Alert message */}
      {actionSuccess && (
        <div className="p-3 sm:p-4 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 rounded-2xl border border-emerald-200 dark:border-emerald-800 text-xs font-semibold flex items-center gap-2 animate-fade-in">
          <CheckCircle2 size={16} />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Action Header & Search Controls */}
      <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-gray-100 dark:border-slate-700 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 transition-colors">
        {/* Search & Category Filter */}
        <div className="flex flex-col sm:flex-row flex-1 items-stretch sm:items-center gap-2 sm:gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Tìm theo tên hoặc mã SP..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-2 text-xs border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-white rounded-xl focus:border-blue-500 focus:outline-none placeholder-gray-400 dark:placeholder-slate-400 shadow-2xs"
            />
            <Search size={14} className="absolute left-2.5 top-2.5 text-gray-400" />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="py-2 px-3 text-xs border border-gray-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none shadow-2xs"
          >
            <option value="">Tất cả thể loại</option>
            {categories.map((cat) => (
              <option key={cat._id} value={cat._id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        {/* Add Product Button */}
        <Button
          variant="primary"
          size="md"
          icon={<Plus size={15} />}
          onClick={openCreateModal}
          className="font-bold shadow-md shadow-blue-600/25 whitespace-nowrap text-xs py-2"
        >
          + THÊM SẢN PHẨM
        </Button>
      </div>

      {/* Table Container */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl sm:rounded-3xl border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden transition-colors">
        {loading ? (
          <LoadingSpinner text="Đang tải danh sách sản phẩm..." />
        ) : products.length === 0 ? (
          <div className="p-8 text-center text-gray-400 dark:text-slate-400 text-xs sm:text-sm">
            Không tìm thấy sản phẩm nào.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[650px]">
              <thead>
                <tr className="bg-slate-100/80 dark:bg-slate-900/90 text-gray-600 dark:text-slate-300 border-b border-gray-200 dark:border-slate-700/80 font-bold uppercase tracking-wider">
                  <th className="py-3 px-4">Sản phẩm</th>
                  <th className="py-3 px-3">Mã SP</th>
                  <th className="py-3 px-3">Thể loại</th>
                  <th className="py-3 px-3">Giá bán</th>
                  <th className="py-3 px-3 text-center">Tồn kho</th>
                  <th className="py-3 px-3 text-center">Đã bán</th>
                  <th className="py-3 px-3 text-center">Trạng thái</th>
                  <th className="py-3 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                {products.map((p) => {
                  const catName = typeof p.category === 'object' ? p.category?.name : 'Chưa phân loại';
                  return (
                    <tr key={p._id} className="hover:bg-gray-50/60 dark:hover:bg-slate-700/40 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="relative flex-shrink-0">
                            <img
                              src={p.images?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100&q=80'}
                              alt={p.name}
                              className="w-9 h-9 rounded-lg object-cover border border-gray-100 dark:border-slate-700"
                            />
                            {p.images && p.images.length > 1 && (
                              <span className="absolute -bottom-1 -right-1 bg-blue-600 text-white text-[9px] font-bold px-1 rounded-full shadow-xs" title={`${p.images.length} hình ảnh`}>
                                {p.images.length}
                              </span>
                            )}
                          </div>
                          <span className="font-bold text-gray-900 dark:text-white max-w-[150px] sm:max-w-xs truncate" title={p.name}>
                            {p.name}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-gray-700 dark:text-gray-300">{p.code}</td>
                      <td className="py-3 px-3 text-gray-600 dark:text-slate-300">{catName}</td>
                      <td className="py-3 px-3 font-bold text-rose-600 dark:text-rose-400 whitespace-nowrap">
                        {formatCurrency(p.salePrice && p.salePrice > 0 ? p.salePrice : p.price)}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                            p.stock <= 5
                              ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
                              : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                          }`}
                        >
                          {p.stock}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center font-bold text-gray-700 dark:text-gray-300">
                        {p.soldCount || 0}
                      </td>
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            p.status === 'active'
                              ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                              : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 border border-gray-200 dark:border-slate-600'
                          }`}
                        >
                          {p.status === 'active' ? 'Đang bán' : 'Ẩn'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right space-x-1 whitespace-nowrap">
                        <button
                          onClick={() => openEditModal(p)}
                          className="p-1 text-gray-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 rounded"
                          title="Sửa"
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          onClick={() => handleDelete(p)}
                          className="p-1 text-gray-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 rounded"
                          title="Xóa"
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Thêm / Sửa Sản Phẩm */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === 'create' ? 'Thêm Sản Phẩm Mới' : 'Cập Nhật Sản Phẩm'}
        maxWidth="xl"
      >
        <form onSubmit={handleSubmit} className="space-y-3 text-xs max-h-[75vh] overflow-y-auto pr-1">
          {formError && (
            <div className="p-2.5 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 rounded-xl text-rose-700 dark:text-rose-300 text-[11px] font-semibold flex items-center gap-1.5">
              <AlertCircle size={14} />
              <span>{formError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Tên sản phẩm *"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="iPhone 16 Pro Max..."
              required
            />
            <Input
              label="Mã SP *"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="IP16PM-256..."
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Thể loại *
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white p-2 text-xs focus:outline-none"
                required
              >
                {categories.map((cat) => (
                  <option key={cat._id} value={cat._id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Trạng thái
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white p-2 text-xs focus:outline-none"
              >
                <option value="active">Đang bán (Active)</option>
                <option value="inactive">Tạm ẩn (Inactive)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input
              label="Giá gốc (VNĐ) *"
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder="34990000"
              required
            />
            <Input
              label="Giá khuyến mãi (VNĐ)"
              type="number"
              value={salePrice}
              onChange={(e) => setSalePrice(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder="32490000"
            />
            <Input
              label="Số lượng tồn kho *"
              type="number"
              value={stock}
              onChange={(e) => setStock(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder="50"
              required
            />
          </div>

          {/* Quản lý danh sách hình ảnh (Nhiều hình ảnh) */}
          <div className="p-3 bg-gray-50 dark:bg-slate-900/50 rounded-xl border border-gray-200 dark:border-slate-700 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
                <ImageIcon size={14} className="text-blue-500" />
                <span>Danh sách hình ảnh sản phẩm ({imagesList.length} ảnh)</span>
              </label>
              <span className="text-[10px] text-gray-500 dark:text-gray-400">
                Hỗ trợ xem nhiều góc chụp & phóng to
              </span>
            </div>

            {/* Danh sách các ảnh đã thêm */}
            {imagesList.length > 0 && (
              <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                {imagesList.map((url, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 p-1.5 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700"
                  >
                    <img
                      src={url}
                      alt={`preview-${idx}`}
                      className="w-9 h-9 rounded object-cover flex-shrink-0 bg-gray-100 dark:bg-slate-900 border border-gray-200 dark:border-slate-700"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                    <input
                      type="text"
                      value={url}
                      onChange={(e) => handleUpdateImage(idx, e.target.value)}
                      placeholder="URL hình ảnh..."
                      className="flex-1 text-[11px] bg-transparent text-gray-900 dark:text-white border-none focus:outline-none"
                    />
                    {idx === 0 && (
                      <span className="text-[9px] bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-bold px-1.5 py-0.5 rounded">
                        Ảnh chính
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(idx)}
                      className="p-1 text-gray-400 hover:text-rose-500 transition-colors"
                      title="Xóa ảnh này"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Thêm link ảnh mới */}
            <div className="flex gap-2">
              <input
                type="text"
                value={newImageUrl}
                onChange={(e) => setNewImageUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddImage();
                  }
                }}
                placeholder="Dán URL hình ảnh (ví dụ: https://images.unsplash.com/...)"
                className="flex-1 text-xs px-2.5 py-1.5 rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
              />
              <Button
                type="button"
                variant="secondary"
                size="sm"
                icon={<Plus size={13} />}
                onClick={handleAddImage}
                className="text-xs whitespace-nowrap py-1.5"
              >
                Thêm ảnh
              </Button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Mô tả sản phẩm
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Nhập thông tin chi tiết về sản phẩm..."
              className="w-full rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white p-2 text-xs focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-gray-100 dark:border-slate-700">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setIsModalOpen(false)}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              loading={formLoading}
              className="font-bold shadow-md shadow-blue-600/25"
            >
              {modalMode === 'create' ? 'THÊM SẢN PHẨM' : 'LƯU THAY ĐỔI'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
