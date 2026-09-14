import React, { useState, useEffect, useCallback } from "react";
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
  Layers,
  Palette,
  X,
  Upload,
  UploadCloud,
  Star,
  Loader2,
  Link as LinkIcon,
} from "lucide-react";
import { productApi } from "@/entities/product/api/productApi";
import { categoryApi } from "@/entities/category/api/categoryApi";
import { uploadApi } from "@/shared/api/uploadApi";
import { getImageUrl } from "@/shared/lib/imageHelper";
import { Product, Category, ProductSize } from "@/shared/types";
import { formatCurrency } from "@/shared/lib/formatters";
import { Button } from "@/shared/ui/Button";
import { Input } from "@/shared/ui/Input";
import { Modal } from "@/shared/ui/Modal";
import { LoadingSpinner } from "@/shared/ui/LoadingSpinner";

export const AdminProductsPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  // Filter & Search
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedSubcategory, setSelectedSubcategory] = useState("");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [currentId, setCurrentId] = useState<string | null>(null);

  // Form Fields
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [subcategory, setSubcategory] = useState("");
  const [price, setPrice] = useState<number | "">("");
  const [salePrice, setSalePrice] = useState<number | "">("");
  const [stock, setStock] = useState<number | "">("");
  const [imagesList, setImagesList] = useState<string[]>([]);
  const [imagesText, setImagesText] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("active");

  // Form Sizes / Variants
  const [sizesList, setSizesList] = useState<ProductSize[]>([]);
  const [newSizeName, setNewSizeName] = useState("");
  const [newSizePrice, setNewSizePrice] = useState<number | "">("");
  const [newSizeSalePrice, setNewSizeSalePrice] = useState<number | "">("");
  const [newSizeStock, setNewSizeStock] = useState<number | "">("");

  // Form Colors
  const [colorsList, setColorsList] = useState<string[]>([]);
  const [newColorName, setNewColorName] = useState("");

  // Image Upload State
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await productApi.getAll({
        allStatus: true,
        search: search || undefined,
        category: selectedCategory || undefined,
        subcategory: selectedSubcategory || undefined,
        limit: 50,
      });
      setProducts(res.items);
      setTotal(res.total);
    } catch (err) {
      console.error("Fetch admin products error:", err);
    } finally {
      setLoading(false);
    }
  }, [search, selectedCategory, selectedSubcategory]);

  useEffect(() => {
    categoryApi.getAll().then(setCategories).catch(console.error);
    fetchProducts();
  }, [fetchProducts]);

  const openCreateModal = () => {
    setModalMode("create");
    setCurrentId(null);
    setName("");
    setCode(`SP${Math.floor(1000 + Math.random() * 9000)}`);
    const defaultCat = categories[0]?._id || "";
    setCategoryId(defaultCat);
    setSubcategory("");
    setPrice("");
    setSalePrice("");
    setStock(10);
    setSizesList([]);
    setNewSizeName("");
    setNewSizePrice("");
    setNewSizeSalePrice("");
    setNewSizeStock("");
    setColorsList([]);
    setNewColorName("");
    setImagesList([]);
    setImagesText("");
    setDescription("");
    setStatus("active");
    setFormError("");
    setUploadError("");
    setIsModalOpen(true);
  };

  const openEditModal = (p: Product) => {
    setModalMode("edit");
    setCurrentId(p._id);
    setName(p.name);
    setCode(p.code);
    setCategoryId(typeof p.category === "object" ? p.category._id : p.category);
    setSubcategory(p.subcategory || "");
    setPrice(p.price);
    setSalePrice(p.salePrice || "");
    setStock(p.stock);
    setSizesList(Array.isArray(p.sizes) ? p.sizes : []);
    setNewSizeName("");
    setNewSizePrice("");
    setNewSizeSalePrice("");
    setNewSizeStock("");
    setColorsList(Array.isArray(p.colors) ? p.colors : []);
    setNewColorName("");
    const initialImgs = Array.isArray(p.images) ? p.images.filter(Boolean) : [];
    setImagesList(initialImgs);
    setImagesText(initialImgs.join("\n"));
    setDescription(p.description || "");
    setStatus(p.status || "active");
    setFormError("");
    setUploadError("");
    setIsModalOpen(true);
  };

  const handleImagesTextChange = (text: string) => {
    setImagesText(text);
    const parsed = text
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
    setImagesList(parsed);
  };

  const handleFilesSelect = async (files: FileList | File[]) => {
    if (!files || files.length === 0) return;
    const fileArray = Array.from(files);

    const validFiles: File[] = [];
    for (const f of fileArray) {
      if (!f.type.startsWith("image/")) {
        setUploadError(`Tệp "${f.name}" không phải là định dạng hình ảnh hợp lệ.`);
        return;
      }
      if (f.size > 10 * 1024 * 1024) {
        setUploadError(`Tệp "${f.name}" vượt quá dung lượng tối đa 10MB.`);
        return;
      }
      validFiles.push(f);
    }

    if (validFiles.length === 0) return;

    setIsUploading(true);
    setUploadError("");

    try {
      let newUrls: string[] = [];
      if (validFiles.length === 1) {
        const res = await uploadApi.uploadSingle(validFiles[0]);
        if (res?.url) {
          newUrls = [res.url];
        }
      } else {
        const res = await uploadApi.uploadMultiple(validFiles);
        if (res?.urls && res.urls.length > 0) {
          newUrls = res.urls;
        }
      }

      if (newUrls.length > 0) {
        const updated = [...imagesList, ...newUrls];
        setImagesList(updated);
        setImagesText(updated.join("\n"));
      }
    } catch (err: any) {
      setUploadError(err.message || "Tải ảnh lên thất bại, vui lòng thử lại");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSetPrimaryImage = (indexToPrimary: number) => {
    if (indexToPrimary === 0 || indexToPrimary >= imagesList.length) return;
    const updated = [...imagesList];
    const [selected] = updated.splice(indexToPrimary, 1);
    updated.unshift(selected);
    setImagesList(updated);
    setImagesText(updated.join("\n"));
  };

  const handleRemoveImage = (indexToRemove: number) => {
    const updated = imagesList.filter((_, idx) => idx !== indexToRemove);
    setImagesList(updated);
    setImagesText(updated.join("\n"));
  };

  const handleAddSize = () => {
    if (!newSizeName.trim() || newSizePrice === "") {
      alert("Vui lòng nhập ít nhất Tên size và Giá gốc cho size");
      return;
    }
    const newSize: ProductSize = {
      name: newSizeName.trim(),
      price: Number(newSizePrice),
      salePrice: newSizeSalePrice !== "" ? Number(newSizeSalePrice) : 0,
      stock: newSizeStock !== "" ? Number(newSizeStock) : 0,
    };
    setSizesList([...sizesList, newSize]);
    setNewSizeName("");
    setNewSizePrice("");
    setNewSizeSalePrice("");
    setNewSizeStock("");
  };

  const handleRemoveSize = (indexToRemove: number) => {
    setSizesList(sizesList.filter((_, idx) => idx !== indexToRemove));
  };

  const handleAddColor = (customColor?: string) => {
    const colorToAdd = (customColor !== undefined ? customColor : newColorName).trim();
    if (!colorToAdd) return;
    if (!colorsList.includes(colorToAdd)) {
      setColorsList([...colorsList, colorToAdd]);
    }
    if (customColor === undefined) {
      setNewColorName("");
    }
  };

  const handleRemoveColor = (indexToRemove: number) => {
    setColorsList(colorsList.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !code.trim() || !categoryId || price === "") {
      setFormError(
        "Vui lòng nhập đầy đủ các trường bắt buộc (Tên, Mã, Thể loại, Giá)",
      );
      return;
    }

    setFormLoading(true);
    setFormError("");

    try {
      // Gom tất cả ảnh hợp lệ
      const finalImages = imagesList.map((img) => img.trim()).filter(Boolean);

      const payload: any = {
        name,
        code: code.toUpperCase(),
        category: categoryId,
        subcategory: subcategory.trim() || undefined,
        price: Number(price),
        salePrice: salePrice !== "" ? Number(salePrice) : 0,
        stock: stock !== "" ? Number(stock) : 0,
        sizes: sizesList,
        colors: colorsList,
        images:
          finalImages.length > 0
            ? finalImages
            : [
                "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80",
              ],
        description,
        status,
      };

      if (modalMode === "create") {
        await productApi.create(payload);
        setActionSuccess("Thêm sản phẩm mới thành công!");
      } else if (currentId) {
        await productApi.update(currentId, payload);
        setActionSuccess("Cập nhật sản phẩm thành công!");
      }

      setIsModalOpen(false);
      fetchProducts();
      setTimeout(() => setActionSuccess(""), 3000);
    } catch (err: any) {
      setFormError(err.message || "Thao tác thất bại");
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
      setActionSuccess("Đã xóa sản phẩm!");
      fetchProducts();
      setTimeout(() => setActionSuccess(""), 3000);
    } catch (err: any) {
      alert(err.message || "Xóa sản phẩm thất bại");
    }
  };

  const selectedCategoryObj = categories.find((c) => c._id === categoryId);
  const modalSubcategories = selectedCategoryObj?.subcategories || [];

  const filterCategoryObj = categories.find((c) => c._id === selectedCategory);
  const filterSubcategories = filterCategoryObj?.subcategories || [];

  return (
    <div className="space-y-4 text-gray-900 dark:text-white">
      {/* Alert message */}
      {actionSuccess && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 rounded-xl border border-emerald-200 dark:border-emerald-800 text-xs font-semibold flex items-center gap-2 animate-fade-in">
          <CheckCircle2 size={15} />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Action Header & Search Controls */}
      <div className="bg-white dark:bg-slate-800 p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border border-gray-100 dark:border-slate-700 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 transition-colors">
        {/* Search & Category Filter */}
        <div className="flex flex-col sm:flex-row flex-1 items-stretch sm:items-center gap-2 sm:gap-2.5">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Tìm theo tên hoặc mã SP..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-7 pr-3 py-1.5 text-xs border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-white rounded-lg focus:border-blue-500 focus:outline-none placeholder-gray-400 dark:placeholder-slate-400 shadow-2xs"
            />
            <Search size={13} className="absolute left-2 top-2 text-gray-400" />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setSelectedSubcategory("");
            }}
            className="py-1.5 px-2.5 text-xs border border-gray-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none shadow-2xs"
          >
            <option value="">Tất cả thể loại</option>
            {categories.map((cat) => (
              <option key={cat._id} value={cat._id}>
                {cat.name}
              </option>
            ))}
          </select>

          {filterSubcategories.length > 0 && (
            <select
              value={selectedSubcategory}
              onChange={(e) => setSelectedSubcategory(e.target.value)}
              className="py-1.5 px-2.5 text-xs border border-gray-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none shadow-2xs"
            >
              <option value="">Tất cả nhóm con</option>
              {filterSubcategories.map((sub, idx) => (
                <option key={idx} value={sub}>
                  {sub}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Add Product Button */}
        <Button
          variant="primary"
          size="sm"
          icon={<Plus size={13} />}
          onClick={openCreateModal}
          className="font-bold shadow-xs whitespace-nowrap text-xs py-1.5 px-3"
        >
          THÊM SẢN PHẨM
        </Button>
      </div>

      {/* Table Container */}
      <div className="bg-white dark:bg-slate-800 rounded-xl sm:rounded-2xl border border-gray-100 dark:border-slate-700 shadow-xs overflow-hidden transition-colors">
        {loading ? (
          <LoadingSpinner text="Đang tải danh sách sản phẩm..." />
        ) : products.length === 0 ? (
          <div className="p-8 text-center text-gray-400 dark:text-slate-400 text-xs">
            Không tìm thấy sản phẩm nào.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[650px]">
              <thead>
                <tr className="bg-slate-100/70 dark:bg-slate-900/80 text-gray-600 dark:text-slate-300 border-b border-gray-200 dark:border-slate-700 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-2.5 px-3">Sản phẩm</th>
                  <th className="py-2.5 px-3">Mã SP</th>
                  <th className="py-2.5 px-3">Thể loại</th>
                  <th className="py-2.5 px-3">Giá bán</th>
                  <th className="py-2.5 px-3 text-center">Tồn kho</th>
                  <th className="py-2.5 px-3 text-center">Đã bán</th>
                  <th className="py-2.5 px-3 text-center">Trạng thái</th>
                  <th className="py-2.5 px-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                {products.map((p) => {
                  const catName =
                    typeof p.category === "object"
                      ? p.category?.name
                      : "Chưa phân loại";
                  const hasSizes = Array.isArray(p.sizes) && p.sizes.length > 0;
                  const hasColors = Array.isArray(p.colors) && p.colors.length > 0;

                  return (
                    <tr
                      key={p._id}
                      className="hover:bg-gray-50/50 dark:hover:bg-slate-700/30 transition-colors"
                    >
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-2">
                          <div className="relative flex-shrink-0">
                            <img
                              src={getImageUrl(
                                p.images?.[0],
                                "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100&q=80"
                              )}
                              alt={p.name}
                              className="w-8 h-8 rounded-lg object-cover border border-gray-100 dark:border-slate-700"
                            />
                            {hasSizes && (
                              <span
                                className="absolute -top-1 -right-1 bg-indigo-600 text-white text-[8px] font-bold px-1 rounded-full shadow-2xs"
                                title={`${p.sizes?.length} Size`}
                              >
                                {p.sizes?.length}S
                              </span>
                            )}
                          </div>
                          <div className="min-w-0">
                            <span
                              className="font-bold text-gray-900 dark:text-white max-w-[150px] sm:max-w-xs truncate block text-xs"
                              title={p.name}
                            >
                              {p.name}
                            </span>
                            <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                              {hasSizes && (
                                <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold">
                                  {p.sizes?.map((s) => s.name).join(", ")}
                                </span>
                              )}
                              {hasSizes && hasColors && (
                                <span className="text-gray-300 dark:text-slate-600 text-[10px]">
                                  •
                                </span>
                              )}
                              {hasColors && (
                                <span className="text-[10px] text-violet-600 dark:text-violet-400 font-semibold flex items-center gap-1">
                                  <span>🎨 {p.colors?.join(", ")}</span>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-gray-700 dark:text-gray-300 text-xs">
                        {p.code}
                      </td>
                      <td className="py-2.5 px-3 text-gray-600 dark:text-slate-300 text-xs">
                        <div>
                          <span className="font-semibold text-gray-800 dark:text-slate-200 block">
                            {catName}
                          </span>
                          {p.subcategory ? (
                            <span className="inline-flex items-center gap-1 mt-0.5 px-1.5 py-0.5 bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded text-[10px] font-bold border border-blue-100 dark:border-blue-800/50">
                              <span>↳</span>
                              <span>{p.subcategory}</span>
                            </span>
                          ) : (
                            <span className="text-[10px] text-gray-400 dark:text-slate-500 italic block">
                              Chưa phân nhóm
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 font-bold text-rose-600 dark:text-rose-400 whitespace-nowrap text-xs">
                        {formatCurrency(
                          p.salePrice && p.salePrice > 0
                            ? p.salePrice
                            : p.price,
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span
                          className="font-bold px-1.5 py-0.5 rounded text-[10px] bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300"
                        >
                          {p.stock}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center font-bold text-gray-700 dark:text-gray-300 text-xs">
                        {p.soldCount || 0}
                      </td>
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                            p.status === "active"
                              ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                              : "bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 border border-gray-200 dark:border-slate-600"
                          }`}
                        >
                          {p.status === "active" ? "Đang bán" : "Ẩn"}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right space-x-1 whitespace-nowrap">
                        <button
                          onClick={() => openEditModal(p)}
                          className="p-1 text-gray-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 rounded"
                          title="Sửa"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          onClick={() => handleDelete(p)}
                          className="p-1 text-gray-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 rounded"
                          title="Xóa"
                        >
                          <Trash2 size={13} />
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
        title={
          modalMode === "create" ? "Thêm Sản Phẩm Mới" : "Cập Nhật Sản Phẩm"
        }
        maxWidth="xl"
      >
        <form
          onSubmit={handleSubmit}
          className="space-y-3 text-xs max-h-[75vh] overflow-y-auto pr-1"
        >
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

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Thể loại *
              </label>
              <select
                value={categoryId}
                onChange={(e) => {
                  setCategoryId(e.target.value);
                  setSubcategory("");
                }}
                className="w-full rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white p-2 text-xs focus:outline-none focus:border-blue-500"
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
                Thể loại con / Nhóm
              </label>
              <select
                value={subcategory}
                onChange={(e) => setSubcategory(e.target.value)}
                disabled={!modalSubcategories || modalSubcategories.length === 0}
                className="w-full rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white p-2 text-xs focus:outline-none focus:border-blue-500 disabled:opacity-60 disabled:bg-gray-100 dark:disabled:bg-slate-900 cursor-pointer disabled:cursor-not-allowed"
              >
                {modalSubcategories && modalSubcategories.length > 0 ? (
                  <>
                    <option value="">-- Chọn thể loại con --</option>
                    {modalSubcategories.map((sub, idx) => (
                      <option key={idx} value={sub}>
                        {sub}
                      </option>
                    ))}
                    {/* Giữ lại subcategory hiện tại nếu đang edit mà không nằm trong danh sách chuẩn */}
                    {subcategory && !modalSubcategories.includes(subcategory) && (
                      <option value={subcategory}>{subcategory}</option>
                    )}
                  </>
                ) : (
                  <option value="">-- Thể loại này chưa có nhóm con --</option>
                )}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Trạng thái
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white p-2 text-xs focus:outline-none focus:border-blue-500"
              >
                <option value="active">Đang bán (Active)</option>
                <option value="inactive">Tạm ẩn (Inactive)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input
              label="Giá mặc định (VNĐ) *"
              type="number"
              value={price}
              onChange={(e) =>
                setPrice(e.target.value === "" ? "" : Number(e.target.value))
              }
              placeholder="34990000"
              required
            />
            <Input
              label="Giá KM mặc định (VNĐ)"
              type="number"
              value={salePrice}
              onChange={(e) =>
                setSalePrice(
                  e.target.value === "" ? "" : Number(e.target.value),
                )
              }
              placeholder="32490000"
            />
            <Input
              label="Tổng tồn kho *"
              type="number"
              value={stock}
              onChange={(e) =>
                setStock(e.target.value === "" ? "" : Number(e.target.value))
              }
              placeholder="50"
              required
            />
          </div>

          {/* QUẢN LÝ DANH SÁCH SIZE / PHIÊN BẢN (SIZES / VARIANTS) */}
          <div className="p-3 bg-indigo-50/50 dark:bg-indigo-950/20 rounded-xl border border-indigo-100 dark:border-indigo-900/40 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-indigo-950 dark:text-indigo-200 flex items-center gap-1.5">
                <Layers
                  size={14}
                  className="text-indigo-600 dark:text-indigo-400"
                />
                <span>
                  Các kích thước / Phiên bản & Mức giá riêng ({sizesList.length}{" "}
                  size)
                </span>
              </label>
              <span className="text-[10px] text-gray-500 dark:text-gray-400">
                (Ví dụ: 128GB, 256GB, 512GB hoặc Size S, M, L)
              </span>
            </div>

            {/* Danh sách các size đã thêm */}
            {sizesList.length > 0 && (
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {sizesList.map((s, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between gap-2 p-2 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 text-xs"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-extrabold text-blue-600 dark:text-blue-400">
                        {s.name}
                      </span>
                      <span className="text-gray-300 dark:text-slate-600">
                        |
                      </span>
                      <span className="font-bold text-rose-600 dark:text-rose-400">
                        {formatCurrency(
                          s.salePrice && s.salePrice > 0
                            ? s.salePrice
                            : s.price,
                        )}
                      </span>
                      {s.salePrice && s.salePrice > 0 && (
                        <span className="text-[10px] text-gray-400 line-through">
                          {formatCurrency(s.price)}
                        </span>
                      )}
                      {s.stock !== undefined && (
                        <span className="text-[10px] text-gray-500 dark:text-gray-400">
                          (Kho: {s.stock})
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveSize(idx)}
                      className="p-1 text-gray-400 hover:text-rose-500 transition-colors"
                      title="Xóa size này"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Thêm size mới */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 pt-1">
              <input
                type="text"
                value={newSizeName}
                onChange={(e) => setNewSizeName(e.target.value)}
                placeholder="Tên size (VD: 256GB, M)"
                className="text-xs px-2 py-1.5 rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
              />
              <input
                type="number"
                value={newSizePrice}
                onChange={(e) =>
                  setNewSizePrice(
                    e.target.value === "" ? "" : Number(e.target.value),
                  )
                }
                placeholder="Giá gốc"
                className="text-xs px-2 py-1.5 rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
              />
              <input
                type="number"
                value={newSizeSalePrice}
                onChange={(e) =>
                  setNewSizeSalePrice(
                    e.target.value === "" ? "" : Number(e.target.value),
                  )
                }
                placeholder="Giá KM"
                className="text-xs px-2 py-1.5 rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
              />
              <input
                type="number"
                value={newSizeStock}
                onChange={(e) =>
                  setNewSizeStock(
                    e.target.value === "" ? "" : Number(e.target.value),
                  )
                }
                placeholder="Tồn kho"
                className="text-xs px-2 py-1.5 rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
              />
              <Button
                type="button"
                variant="secondary"
                size="sm"
                icon={<Plus size={13} />}
                onClick={handleAddSize}
                className="text-xs col-span-2 sm:col-span-1 py-1.5"
              >
                Thêm
              </Button>
            </div>
          </div>

          {/* QUẢN LÝ DANH SÁCH MÀU SẮC (COLORS) */}
          <div className="p-3 bg-purple-50/50 dark:bg-purple-950/20 rounded-xl border border-purple-100 dark:border-purple-900/40 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-purple-950 dark:text-purple-200 flex items-center gap-1.5">
                <Palette
                  size={14}
                  className="text-purple-600 dark:text-purple-400"
                />
                <span>
                  Danh sách Màu sắc ({colorsList.length} màu)
                </span>
              </label>
              <span className="text-[10px] text-gray-500 dark:text-gray-400">
                (VD: Titan Tự Nhiên, Space Black, Xanh Lưu Ly...)
              </span>
            </div>

            {/* Danh sách các màu đã thêm */}
            {colorsList.length > 0 && (
              <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
                {colorsList.map((color, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-purple-200 dark:border-purple-800/60 text-xs font-bold text-purple-700 dark:text-purple-300 shadow-2xs group"
                  >
                    <span>{color}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveColor(idx)}
                      className="text-gray-400 hover:text-rose-500 transition-colors p-0.5"
                      title="Xóa màu này"
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Thêm màu mới */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newColorName}
                onChange={(e) => setNewColorName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddColor();
                  }
                }}
                placeholder="Nhập tên màu (VD: Xám Titan, Hồng Pastel, Trắng)..."
                className="flex-1 text-xs px-2.5 py-1.5 rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:border-purple-500"
              />
              <Button
                type="button"
                variant="secondary"
                size="sm"
                icon={<Plus size={13} />}
                onClick={() => handleAddColor()}
                className="text-xs py-1.5 whitespace-nowrap bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-200 hover:bg-purple-200 border-purple-200 dark:border-purple-800"
              >
                Thêm màu
              </Button>
            </div>

            {/* Gợi ý nhanh các màu thịnh hành */}
            <div className="pt-1">
              <div className="text-[10px] text-gray-500 dark:text-gray-400 mb-1 font-medium">
                Gợi ý nhanh màu phổ biến:
              </div>
              <div className="flex flex-wrap gap-1">
                {[
                  "Đen",
                  "Trắng",
                  "Xám Titan",
                  "Xanh Dương",
                  "Vàng Gold",
                  "Bạc",
                  "Hồng",
                  "Tím",
                  "Xanh Rêu",
                  "Đỏ",
                ].map((presetColor) => {
                  const isAdded = colorsList.includes(presetColor);
                  return (
                    <button
                      key={presetColor}
                      type="button"
                      disabled={isAdded}
                      onClick={() => handleAddColor(presetColor)}
                      className={`text-[10px] px-2 py-0.5 rounded-md border transition-all ${
                        isAdded
                          ? "bg-gray-100 dark:bg-slate-800 text-gray-400 dark:text-slate-500 border-transparent cursor-default"
                          : "bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-slate-700 hover:border-purple-400 hover:text-purple-600 dark:hover:text-purple-400"
                      }`}
                    >
                      {isAdded ? `✓ ${presetColor}` : `+ ${presetColor}`}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Quản lý danh sách hình ảnh */}
          <div className="p-3 bg-gray-50 dark:bg-slate-900/50 rounded-xl border border-gray-200 dark:border-slate-700 space-y-2.5">
            {/* Header: Tiêu đề bên trái, Nút '+ Thêm ảnh' chuyển sang bên phải */}
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
                <ImageIcon size={14} className="text-blue-500" />
                <span>
                  Hình ảnh sản phẩm ({imagesList.length} ảnh)
                </span>
              </label>

              {/* Nút bấm '+ Thêm ảnh' nằm bên phải */}
              <div>
                <input
                  id="product-file-upload"
                  type="file"
                  multiple
                  accept="image/png, image/jpeg, image/jpg, image/webp, image/gif, image/svg+xml"
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      handleFilesSelect(e.target.files);
                      e.target.value = "";
                    }
                  }}
                  className="hidden"
                />
                <label
                  htmlFor="product-file-upload"
                  className={`inline-flex items-center gap-1.5 text-xs font-bold py-1.5 px-3 rounded-lg cursor-pointer transition-all shadow-xs ${
                    isUploading
                      ? "bg-blue-100 dark:bg-blue-950 text-blue-500 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white"
                  }`}
                >
                  {isUploading ? (
                    <>
                      <Loader2 size={13} className="animate-spin" />
                      <span>Đang tải...</span>
                    </>
                  ) : (
                    <>
                      <Plus size={13} />
                      <span>Thêm ảnh</span>
                    </>
                  )}
                </label>
              </div>
            </div>

            {/* Error Message nếu có lỗi upload */}
            {uploadError && (
              <div className="flex items-center gap-2 p-2 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs rounded-lg animate-fade-in">
                <AlertCircle size={14} className="flex-shrink-0 text-rose-500" />
                <span className="flex-1">{uploadError}</span>
                <button
                  type="button"
                  onClick={() => setUploadError("")}
                  className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                >
                  <X size={13} />
                </button>
              </div>
            )}

            {/* Ô textarea nhập link ảnh (xuống dòng mỗi dòng là 1 link khác nhau) */}
            <div>
              <textarea
                rows={2}
                value={imagesText}
                onChange={(e) => handleImagesTextChange(e.target.value)}
                placeholder="Dán link ảnh tại đây (xuống dòng để nhập mỗi link ảnh khác nhau)..."
                className="w-full text-xs p-2.5 rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-blue-500 font-mono resize-y"
              />
              <div className="flex items-center justify-between text-[10px] text-gray-400 dark:text-gray-500 mt-1 px-0.5">
                <span>Xuống dòng (Enter) là mỗi link khác nhau</span>
                <span>{imagesList.length > 0 ? "Ảnh đầu tiên là ảnh đại diện" : ""}</span>
              </div>
            </div>

            {/* Danh sách ảnh đã thêm (Thumbnail gallery) */}
            {imagesList.length > 0 && (
              <div className="pt-1">
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 max-h-48 overflow-y-auto p-1">
                  {imagesList.map((url, idx) => {
                    const isPrimary = idx === 0;
                    return (
                      <div
                        key={idx}
                        className={`group relative rounded-lg overflow-hidden border bg-white dark:bg-slate-800 shadow-xs transition-all aspect-square ${
                          isPrimary
                            ? "border-blue-500 ring-2 ring-blue-500/40"
                            : "border-gray-200 dark:border-slate-700"
                        }`}
                      >
                        <img
                          src={getImageUrl(url)}
                          alt={`preview-${idx}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100&q=80";
                          }}
                        />

                        {isPrimary && (
                          <span className="absolute top-1 left-1 bg-blue-600 text-white text-[8px] font-black px-1 py-0.5 rounded shadow-xs">
                            Chính
                          </span>
                        )}

                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1 p-0.5">
                          {!isPrimary && (
                            <button
                              type="button"
                              onClick={() => handleSetPrimaryImage(idx)}
                              className="p-1 bg-white/90 text-gray-800 hover:bg-blue-600 hover:text-white rounded text-[9px] font-bold shadow"
                              title="Đặt làm ảnh chính"
                            >
                              <Star size={11} />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(idx)}
                            className="p-1 bg-rose-600 text-white hover:bg-rose-700 rounded shadow"
                            title="Xóa ảnh"
                          >
                            <Trash2 size={11} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Mô tả sản phẩm
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Nhập thông tin chi tiết về sản phẩm..."
              className="w-full rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white p-2 text-xs focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2.5 border-t border-gray-100 dark:border-slate-700">
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
              className="font-bold shadow-xs"
            >
              {modalMode === "create" ? "THÊM SẢN PHẨM" : "LƯU THAY ĐỔI"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
