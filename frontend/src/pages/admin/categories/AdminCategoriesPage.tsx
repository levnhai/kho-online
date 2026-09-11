import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, FolderTree, AlertCircle, CheckCircle2 } from 'lucide-react';
import { categoryApi } from '@/entities/category/api/categoryApi';
import { Category } from '@/shared/types';
import { Button } from '@/shared/ui/Button';
import { Input } from '@/shared/ui/Input';
import { Modal } from '@/shared/ui/Modal';
import { LoadingSpinner } from '@/shared/ui/LoadingSpinner';

export const AdminCategoriesPage: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [currentId, setCurrentId] = useState<string | null>(null);

  // Form
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [subcategoriesText, setSubcategoriesText] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  // Hàm sinh slug chuẩn tiếng Việt không dấu
  const generateSlug = (text: string): string => {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[đĐ]/g, 'd')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleNameChange = (val: string) => {
    setName(val);
    setSlug(generateSlug(val));
  };

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const data = await categoryApi.getAll();
      setCategories(data);
    } catch (err) {
      console.error('Fetch categories error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const openCreateModal = () => {
    setModalMode('create');
    setCurrentId(null);
    setName('');
    setSlug('');
    setDescription('');
    setSubcategoriesText('');
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (cat: Category) => {
    setModalMode('edit');
    setCurrentId(cat._id);
    setName(cat.name);
    setSlug(cat.slug || generateSlug(cat.name));
    setDescription(cat.description || '');
    setSubcategoriesText(cat.subcategories?.join(', ') || '');
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError('Vui lòng nhập tên thể loại');
      return;
    }

    setFormLoading(true);
    setFormError('');

    try {
      const subcategories = subcategoriesText
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      const payload = {
        name,
        slug: slug.trim() || name.toLowerCase().replace(/\s+/g, '-'),
        description,
        subcategories,
      };

      if (modalMode === 'create') {
        await categoryApi.create(payload);
        setActionSuccess('Thêm thể loại thành công!');
      } else if (currentId) {
        await categoryApi.update(currentId, payload);
        setActionSuccess('Cập nhật thể loại thành công!');
      }

      setIsModalOpen(false);
      fetchCategories();
      setTimeout(() => setActionSuccess(''), 3000);
    } catch (err: any) {
      setFormError(err.message || 'Thao tác thất bại');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (cat: Category) => {
    if (!window.confirm(`Bạn có chắc muốn xóa thể loại "${cat.name}" không?`)) {
      return;
    }
    try {
      await categoryApi.delete(cat._id);
      setActionSuccess('Đã xóa thể loại!');
      fetchCategories();
      setTimeout(() => setActionSuccess(''), 3000);
    } catch (err: any) {
      alert(err.message || 'Không thể xóa thể loại này');
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

      {/* Header action */}
      <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-gray-100 dark:border-slate-700 shadow-sm flex items-center justify-between gap-2 transition-colors">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">DANH MỤC & THỂ LOẠI</h2>
          <p className="text-[11px] sm:text-xs text-gray-400 dark:text-slate-400">
            Quản lý các nhóm danh mục sản phẩm
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          icon={<Plus size={15} />}
          onClick={openCreateModal}
          className="font-bold shadow-md shadow-blue-600/25 whitespace-nowrap text-xs py-2"
        >
          + THÊM THỂ LOẠI
        </Button>
      </div>

      {/* Categories Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl sm:rounded-3xl border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden transition-colors">
        {loading ? (
          <LoadingSpinner text="Đang tải danh sách thể loại..." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[650px]">
              <thead>
                <tr className="bg-slate-100/80 dark:bg-slate-900/90 text-gray-600 dark:text-slate-300 border-b border-gray-200 dark:border-slate-700/80 font-bold uppercase tracking-wider">
                  <th className="py-3 px-4">STT</th>
                  <th className="py-3 px-4">Tên Thể Loại</th>
                  <th className="py-3 px-4">Slug / Định Danh</th>
                  <th className="py-3 px-4">Thể loại con</th>
                  <th className="py-3 px-4 text-center">Số SP</th>
                  <th className="py-3 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                {categories.map((cat, idx) => (
                  <tr key={cat._id} className="hover:bg-gray-50/60 dark:hover:bg-slate-700/40 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-gray-400 dark:text-slate-500 w-12">{idx + 1}</td>
                    <td className="py-3.5 px-4 font-bold text-gray-900 dark:text-white whitespace-nowrap">{cat.name}</td>
                    <td className="py-3.5 px-4 font-mono text-gray-500 dark:text-slate-400">{cat.slug}</td>
                    <td className="py-3.5 px-4 max-w-xs">
                      {cat.subcategories && cat.subcategories.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {cat.subcategories.map((sub, sIdx) => (
                            <span
                              key={sIdx}
                              className="px-1.5 py-0.5 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300 rounded text-[10px] font-medium"
                            >
                              {sub}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-400 dark:text-slate-500 italic text-[11px]">Chưa có</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-black rounded text-[11px]">
                        {cat.productCount || 0}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2 whitespace-nowrap">
                      <button
                        onClick={() => openEditModal(cat)}
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-semibold hover:underline"
                      >
                        Sửa
                      </button>
                      <span className="text-gray-300 dark:text-slate-600">|</span>
                      <button
                        onClick={() => handleDelete(cat)}
                        className="text-rose-600 dark:text-rose-400 hover:text-rose-800 dark:hover:text-rose-300 font-semibold hover:underline"
                      >
                        Xóa
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Thêm/Sửa Thể Loại */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === 'create' ? 'Thêm Thể Loại Mới' : 'Cập Nhật Thể Loại'}
        maxWidth="md"
      >
        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          {formError && (
            <div className="p-2.5 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 rounded-xl text-rose-700 dark:text-rose-300 text-[11px] font-semibold flex items-center gap-1.5">
              <AlertCircle size={14} />
              <span>{formError}</span>
            </div>
          )}

          <Input
            label="Tên thể loại *"
            placeholder="Ví dụ: Điện thoại, Laptop..."
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            required
          />

          <div>
            <Input
              label="Slug / Định danh (Tự động sinh)"
              placeholder="dien-thoai, laptop..."
              value={slug}
              disabled
              readOnly
              className="bg-gray-100 dark:bg-slate-900/90 font-mono text-gray-500 dark:text-slate-400 cursor-not-allowed select-none"
            />
            <p className="text-[10px] text-gray-400 dark:text-slate-400 mt-1">
              Được tự động sinh từ tên thể loại phục vụ đường dẫn URL chuẩn SEO.
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Thể loại con (cách nhau bằng dấu phẩy)
            </label>
            <input
              type="text"
              value={subcategoriesText}
              onChange={(e) => setSubcategoriesText(e.target.value)}
              placeholder="Ví dụ: iPhone, Samsung Galaxy, Xiaomi, Oppo"
              className="w-full rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white p-2 text-xs focus:outline-none focus:border-blue-500"
            />
            <p className="text-[10px] text-gray-400 dark:text-slate-400 mt-1">
              Nhập các thể loại con phân tách bằng dấu phẩy (,). Hệ thống sẽ tự động cập nhật lên Menu Drawer & Bộ lọc.
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Mô tả ngắn
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Nhập mô tả..."
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
              {modalMode === 'create' ? 'THÊM THỂ LOẠI' : 'LƯU THAY ĐỔI'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
