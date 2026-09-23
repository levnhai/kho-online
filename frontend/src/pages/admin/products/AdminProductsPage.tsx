import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
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
  Boxes,
  Shirt,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  FileText,
  DollarSign,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Check,
  Copy,
  RotateCcw,
  Pin,
} from "lucide-react";
import { productApi } from "@/entities/product/api/productApi";
import { categoryApi } from "@/entities/category/api/categoryApi";
import { colorApi } from "@/entities/color/api/colorApi";
import { setOptionApi } from "@/entities/set-option/api/setOptionApi";
import { sizeApi } from "@/entities/size/api/sizeApi";
import { uploadApi } from "@/shared/api/uploadApi";
import { getImageUrl, handleImageError } from "@/shared/lib/imageHelper";
import {
  Product,
  Category,
  ProductSize,
  ProductSellingOption,
  ColorItem,
  SetOptionItem,
  SizeItem,
} from "@/shared/types";
import { formatCurrency } from "@/shared/lib/formatters";
import { Button } from "@/shared/ui/Button";
import { Input } from "@/shared/ui/Input";
import { Modal } from "@/shared/ui/Modal";
import { LoadingSpinner } from "@/shared/ui/LoadingSpinner";
import { Pagination } from "@/shared/ui/Pagination";

export const AdminProductsPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [dbColors, setDbColors] = useState<ColorItem[]>([]);
  const [dbSetOptions, setDbSetOptions] = useState<SetOptionItem[]>([]);
  const [dbSizes, setDbSizes] = useState<SizeItem[]>([]);
  const [isCreatingSetOption, setIsCreatingSetOption] = useState(false);
  const [newCustomOptionName, setNewCustomOptionName] = useState("");
  const [isCreatingSize, setIsCreatingSize] = useState(false);
  const [newCustomSizeName, setNewCustomSizeName] = useState("");
  const [isAddSizeModalOpen, setIsAddSizeModalOpen] = useState(false);
  const [selectedModalSizes, setSelectedModalSizes] = useState<string[]>([]);
  const [customModalSizeName, setCustomModalSizeName] = useState("");
  const [modalSizePrice, setModalSizePrice] = useState<number | "">("");
  const [modalSizeError, setModalSizeError] = useState("");
  const [isCreateColorModalOpen, setIsCreateColorModalOpen] = useState(false);
  const [newCustomColorName, setNewCustomColorName] = useState("");
  const [newCustomColorCode, setNewCustomColorCode] = useState("");
  const [newCustomColorHex, setNewCustomColorHex] = useState("#3B82F6");
  const [colorModalAutoAssign, setColorModalAutoAssign] = useState(true);
  const [colorModalLoading, setColorModalLoading] = useState(false);
  const [colorModalError, setColorModalError] = useState("");
  const [selectedColorSelect, setSelectedColorSelect] = useState("");
  const [isColorDropdownOpen, setIsColorDropdownOpen] = useState(false);
  const colorDropdownRef = useRef<HTMLDivElement>(null);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // Filter & Search
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedSubcategory, setSelectedSubcategory] = useState("");
  const [selectedType, setSelectedType] = useState<string>("");

  // Modal State
  const [isTypeModalOpen, setIsTypeModalOpen] = useState(false);
  const [productType, setProductType] = useState<"set" | "single">("single");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [formTab, setFormTab] = useState<
    "general" | "pricing" | "variants" | "images"
  >("general");

  // Detail Modal State
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [activePreviewImage, setActivePreviewImage] = useState<string>("");

  const handleOpenDetailModal = (p: Product) => {
    setViewingProduct(p);
    setActivePreviewImage(p.images?.[0] || "");
    setIsDetailModalOpen(true);
  };

  // Form Fields
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [subcategory, setSubcategory] = useState("");
  const [price, setPrice] = useState<number | "">("");
  const [imagesList, setImagesList] = useState<string[]>([]);
  const [imagesText, setImagesText] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("active");
  const [isPinned, setIsPinned] = useState(false);

  // Form Selling Options (Hình thức bán theo Set / Bán lẻ)
  const [sellingOptionsList, setSellingOptionsList] = useState<
    ProductSellingOption[]
  >([]);
  const [newOptionName, setNewOptionName] = useState("");
  const [newOptionPrice, setNewOptionPrice] = useState<number | "">("");

  // Form Sizes / Variants
  const [sizesList, setSizesList] = useState<ProductSize[]>([]);
  const [newSizeName, setNewSizeName] = useState("");
  const [newSizePrice, setNewSizePrice] = useState<number | "">("");

  // Form Colors
  const [colorsList, setColorsList] = useState<string[]>([]);
  const [newColorName, setNewColorName] = useState("");
  const [colorSearch, setColorSearch] = useState("");

  // Image Upload State
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");
  const [actionError, setActionError] = useState("");

  const fetchColors = useCallback(async () => {
    try {
      const colors = await colorApi.getAll({ skipCache: true });
      setDbColors(colors || []);
    } catch (err) {
      console.error("Fetch colors error:", err);
    }
  }, []);

  const fetchSetOptions = useCallback(async () => {
    try {
      const opts = await setOptionApi.getAll({ skipCache: true });
      setDbSetOptions(opts || []);
    } catch (err) {
      console.error("Fetch set options error:", err);
    }
  }, []);

  const fetchSizes = useCallback(async () => {
    try {
      const sizes = await sizeApi.getAll({ skipCache: true });
      setDbSizes(sizes || []);
    } catch (err) {
      console.error("Fetch sizes error:", err);
    }
  }, []);

  const fetchProducts = useCallback(
    async (targetPage?: number, targetLimit?: number) => {
      const p = targetPage !== undefined ? targetPage : page;
      const l = targetLimit !== undefined ? targetLimit : limit;
      setLoading(true);
      try {
        const res = await productApi.getAll({
          allStatus: true,
          search: search || undefined,
          category: selectedCategory || undefined,
          subcategory: selectedSubcategory || undefined,
          type: selectedType || undefined,
          page: p,
          limit: l,
        });
        setProducts(res.items || []);
        setTotal(res.total || 0);
        setTotalPages(
          res.totalPages || Math.ceil((res.total || 0) / l) || 1,
        );
        if (targetPage !== undefined) setPage(targetPage);
        if (targetLimit !== undefined) setLimit(targetLimit);
      } catch (err) {
        console.error("Fetch admin products error:", err);
      } finally {
        setLoading(false);
      }
    },
    [search, selectedCategory, selectedSubcategory, selectedType, page, limit],
  );

  const loadMoreMobile = useCallback(async () => {
    if (loading || loadingMore || products.length >= total) return;
    const nextPage = page + 1;
    if (nextPage > totalPages) return;

    setLoadingMore(true);
    try {
      const res = await productApi.getAll({
        allStatus: true,
        search: search || undefined,
        category: selectedCategory || undefined,
        subcategory: selectedSubcategory || undefined,
        type: selectedType || undefined,
        page: nextPage,
        limit,
      });

      setProducts((prev) => {
        const existingIds = new Set(prev.map((p) => p._id));
        const uniqueItems = (res.items || []).filter(
          (p) => !existingIds.has(p._id),
        );
        return [...prev, ...uniqueItems];
      });
      setPage(nextPage);
      setTotal(res.total || 0);
      setTotalPages(
        res.totalPages || Math.ceil((res.total || 0) / limit) || 1,
      );
    } catch (err) {
      console.error("Load more mobile products error:", err);
    } finally {
      setLoadingMore(false);
    }
  }, [
    loading,
    loadingMore,
    products.length,
    total,
    page,
    totalPages,
    search,
    selectedCategory,
    selectedSubcategory,
    selectedType,
    limit,
  ]);

  useEffect(() => {
    categoryApi.getAll().then(setCategories).catch(console.error);
    fetchColors();
    fetchSetOptions();
    fetchSizes();
  }, [fetchColors, fetchSetOptions, fetchSizes]);

  // Khi thay đổi bộ lọc tìm kiếm / danh mục / nhóm con / loại hình -> quay lại trang 1
  useEffect(() => {
    fetchProducts(1, limit);
  }, [search, selectedCategory, selectedSubcategory, selectedType]);

  // Mobile Infinite Scroll Observer (chỉ kích hoạt trên màn hình di động/tablet nhỏ < 1024px)
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (
          first.isIntersecting &&
          !loading &&
          !loadingMore &&
          products.length < total
        ) {
          if (window.innerWidth < 1024) {
            loadMoreMobile();
          }
        }
      },
      { threshold: 0.1, rootMargin: "300px" },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadMoreMobile, loading, loadingMore, products.length, total]);

  // Click outside listener for color dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        colorDropdownRef.current &&
        !colorDropdownRef.current.contains(event.target as Node)
      ) {
        setIsColorDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const normalizeVietnamese = (str: string) => {
    return (str || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/Đ/g, "d")
      .toLowerCase()
      .trim();
  };

  const filteredDbColors = useMemo(() => {
    if (!colorSearch.trim()) return dbColors;
    const query = normalizeVietnamese(colorSearch);
    return dbColors.filter((item) => {
      const normName = normalizeVietnamese(item.name);
      const normCode = normalizeVietnamese(item.code || "");
      return normName.includes(query) || normCode.includes(query);
    });
  }, [dbColors, colorSearch]);

  const openTypeSelectModal = () => {
    setIsTypeModalOpen(true);
  };

  const handleSelectProductType = (type: "set" | "single") => {
    setIsTypeModalOpen(false);
    setProductType(type);
    openCreateModal(type);
  };

  const openCreateModal = (type: "set" | "single" = "single") => {
    fetchColors();
    fetchSetOptions();
    fetchSizes();
    setModalMode("create");
    setProductType(type);
    setFormTab("general");
    setCurrentId(null);
    setName("");
    setCode(`SP${Math.floor(1000 + Math.random() * 9000)}`);
    const defaultCat = categories[0]?._id || "";
    setCategoryId(defaultCat);
    setSubcategory("");
    setPrice("");
    if (type === "set") {
      setSellingOptionsList([
        { name: "Cả Set", price: 0 },
        { name: "Lẻ Áo", price: 0 },
        { name: "Lẻ Quần", price: 0 },
      ]);
    } else {
      setSellingOptionsList([]);
    }
    setNewOptionName("");
    setNewOptionPrice("");
    setIsCreatingSetOption(false);
    setNewCustomOptionName("");
    setIsCreatingSize(false);
    setNewCustomSizeName("");
    setIsAddSizeModalOpen(false);
    setSelectedModalSizes([]);
    setCustomModalSizeName("");
    setModalSizePrice("");
    setModalSizeError("");
    setIsCreateColorModalOpen(false);
    setNewCustomColorName("");
    setSelectedColorSelect("");
    setSizesList([]);
    setNewSizeName("");
    setNewSizePrice("");
    setColorsList([]);
    setNewColorName("");
    setColorSearch("");
    setImagesList([]);
    setImagesText("");
    setDescription("");
    setStatus("active");
    setIsPinned(false);
    setFormError("");
    setUploadError("");
    setIsModalOpen(true);
  };

  const openEditModal = (p: Product) => {
    fetchColors();
    fetchSetOptions();
    fetchSizes();
    const isSet =
      Array.isArray(p.sellingOptions) && p.sellingOptions.length > 0;
    setProductType(isSet ? "set" : "single");
    setModalMode("edit");
    setFormTab("general");
    setCurrentId(p._id);
    setName(p.name);
    setCode(p.code);
    setCategoryId(typeof p.category === "object" ? p.category._id : p.category);
    setSubcategory(p.subcategory || "");
    setPrice(p.price);
    setSellingOptionsList(
      Array.isArray(p.sellingOptions) ? p.sellingOptions : [],
    );
    setNewOptionName("");
    setNewOptionPrice("");
    setIsCreatingSetOption(false);
    setNewCustomOptionName("");
    setIsCreatingSize(false);
    setNewCustomSizeName("");
    setIsAddSizeModalOpen(false);
    setSelectedModalSizes([]);
    setCustomModalSizeName("");
    setModalSizePrice("");
    setModalSizeError("");
    setIsCreateColorModalOpen(false);
    setNewCustomColorName("");
    setSelectedColorSelect("");
    setSizesList(Array.isArray(p.sizes) ? p.sizes : []);
    setNewSizeName("");
    setNewSizePrice("");
    setColorsList(Array.isArray(p.colors) ? p.colors : []);
    setNewColorName("");
    setColorSearch("");
    const isUnsplashDummy = (url: string) =>
      typeof url === "string" &&
      (url.includes("1523275335684") || url.includes("images.unsplash.com"));

    const initialImgs = Array.isArray(p.images)
      ? p.images.filter((img) => Boolean(img) && !isUnsplashDummy(img))
      : [];
    setImagesList(initialImgs);
    setImagesText(initialImgs.join("\n"));
    setDescription(p.description || "");
    setStatus(p.status || "active");
    setIsPinned(Boolean(p.isPinned));
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
        setUploadError(
          `Tệp "${f.name}" không phải là định dạng hình ảnh hợp lệ.`,
        );
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

  const handleUpdateSellingOption = (
    index: number,
    field: "name" | "price",
    value: string | number,
  ) => {
    const updated = [...sellingOptionsList];
    if (field === "name") {
      if (value === "__NEW__") {
        setIsCreatingSetOption(true);
        return;
      }
      updated[index] = { ...updated[index], name: String(value) };
    } else {
      updated[index] = {
        ...updated[index],
        price: value === "" ? 0 : Number(value),
      };
    }
    setSellingOptionsList(updated);
  };

  const handleAddNewOptionRow = () => {
    const chosenNames = sellingOptionsList.map((o) => o.name);
    const available = dbSetOptions.find((o) => !chosenNames.includes(o.name));
    const nextName = available
      ? available.name
      : dbSetOptions[0]?.name || "Món mới";
    setSellingOptionsList([
      ...sellingOptionsList,
      { name: nextName, price: 0 },
    ]);
  };

  const handleCreateNewSetOption = async () => {
    if (!newCustomOptionName.trim()) {
      alert("Vui lòng nhập tên món mới");
      return;
    }
    try {
      const created = await setOptionApi.create({
        name: newCustomOptionName.trim(),
      });
      setDbSetOptions((prev) => [...prev, created]);
      setSellingOptionsList((prev) => [
        ...prev,
        { name: created.name, price: 0 },
      ]);
      setNewCustomOptionName("");
      setIsCreatingSetOption(false);
    } catch (err: any) {
      alert(err.message || "Tạo tên món mới thất bại");
    }
  };

  const handleRemoveSellingOption = (indexToRemove: number) => {
    setSellingOptionsList(
      sellingOptionsList.filter((_, idx) => idx !== indexToRemove),
    );
  };

  const handleUpdateSize = (
    index: number,
    field: "name" | "price",
    value: string | number,
  ) => {
    const updated = [...sizesList];
    if (field === "name") {
      if (value === "__NEW__") {
        setIsCreatingSize(true);
        return;
      }
      updated[index] = { ...updated[index], name: String(value) };
    } else {
      updated[index] = {
        ...updated[index],
        price: value === "" ? 0 : Number(value),
      };
    }
    setSizesList(updated);
  };

  const handleOpenAddSizeModal = () => {
    setSelectedModalSizes([]);
    setCustomModalSizeName("");
    setModalSizeError("");
    const defaultPrice =
      typeof price === "number" && price > 0
        ? price
        : sizesList.length > 0 && sizesList[0].price > 0
          ? sizesList[0].price
          : "";
    setModalSizePrice(defaultPrice);
    setIsAddSizeModalOpen(true);
  };

  const handleToggleModalSize = (sizeName: string) => {
    if (sizesList.some((s) => s.name === sizeName)) return;
    setSelectedModalSizes((prev) =>
      prev.includes(sizeName)
        ? prev.filter((s) => s !== sizeName)
        : [...prev, sizeName],
    );
  };

  const handleSelectAllAvailableSizes = () => {
    const available = dbSizes
      .map((s) => s.name)
      .filter((name) => !sizesList.some((s) => s.name === name));
    setSelectedModalSizes(available);
  };

  const handleUpdateSizeOptionPrice = (
    sizeIndex: number,
    optionName: string,
    value: string | number,
  ) => {
    const updated = [...sizesList];
    const targetSize = { ...updated[sizeIndex] };
    const numVal = value === "" ? 0 : Number(value);
    targetSize.optionPrices = {
      ...(targetSize.optionPrices || {}),
      [optionName]: numVal,
    };
    updated[sizeIndex] = targetSize;
    setSizesList(updated);
  };

  const handleCopySizePricesToAll = (sourceIndex: number) => {
    const sourceSize = sizesList[sourceIndex];
    if (!sourceSize) return;

    const sourcePrices = sourceSize.optionPrices || {};
    const updated = sizesList.map((s, idx) => {
      if (idx === sourceIndex) return s;
      return {
        ...s,
        optionPrices: { ...sourcePrices },
      };
    });
    setSizesList(updated);
  };

  const handleSyncBasePricesToSizes = () => {
    const baseMap: Record<string, number> = {};
    sellingOptionsList.forEach((opt) => {
      if (opt.name) {
        baseMap[opt.name] = Number(opt.price) || 0;
      }
    });

    const updated = sizesList.map((s) => ({
      ...s,
      optionPrices: { ...baseMap },
    }));
    setSizesList(updated);
  };

  const handleConfirmAddSizes = async () => {
    setModalSizeError("");
    const sizesToAdd: string[] = [...selectedModalSizes];

    const customTrimmed = customModalSizeName.trim();
    if (customTrimmed) {
      if (
        sizesList.some(
          (s) => s.name.toLowerCase() === customTrimmed.toLowerCase(),
        )
      ) {
        setModalSizeError(
          `Kích cỡ "${customTrimmed}" đã có trong danh sách sản phẩm!`,
        );
        return;
      }

      const existsInDb = dbSizes.some(
        (s) => s.name.toLowerCase() === customTrimmed.toLowerCase(),
      );
      if (!existsInDb) {
        try {
          const created = await sizeApi.create({ name: customTrimmed });
          setDbSizes((prev) => [...prev, created]);
        } catch (err: any) {
          console.error("Lỗi tạo size mới:", err);
        }
      }

      if (!sizesToAdd.includes(customTrimmed)) {
        sizesToAdd.push(customTrimmed);
      }
    }

    if (sizesToAdd.length === 0) {
      setModalSizeError(
        "Vui lòng chọn ít nhất một kích cỡ hoặc nhập kích cỡ mới!",
      );
      return;
    }

    const finalPrice =
      typeof modalSizePrice === "number"
        ? modalSizePrice
        : typeof price === "number"
          ? price
          : 0;

    // Chuẩn bị default optionPrices nếu là sản phẩm Set
    const initialOptionPrices: Record<string, number> = {};
    if (productType === "set") {
      sellingOptionsList.forEach((opt) => {
        if (opt.name) {
          initialOptionPrices[opt.name] = Number(opt.price) || 0;
        }
      });
    }

    const newItems: ProductSize[] = sizesToAdd.map((sz) => ({
      name: sz,
      price: productType === "set" ? 0 : finalPrice,
      salePrice: 0,
      stock: 0,
      optionPrices:
        productType === "set" ? { ...initialOptionPrices } : undefined,
    }));

    setSizesList((prev) => [...prev, ...newItems]);
    setIsAddSizeModalOpen(false);
    setSelectedModalSizes([]);
    setCustomModalSizeName("");
    setModalSizeError("");
  };

  const handleAddNewSizeRow = (presetName?: string) => {
    const defaultPrice =
      typeof price === "number" ? price : sellingOptionsList[0]?.price || 0;
    const chosenNames = sizesList.map((s) => s.name);
    const available = dbSizes.find((s) => !chosenNames.includes(s.name));
    const nextName =
      presetName || (available ? available.name : dbSizes[0]?.name || "M");

    const initialOptionPrices: Record<string, number> = {};
    if (productType === "set") {
      sellingOptionsList.forEach((opt) => {
        if (opt.name) {
          initialOptionPrices[opt.name] = Number(opt.price) || 0;
        }
      });
    }

    setSizesList([
      ...sizesList,
      {
        name: nextName,
        price: defaultPrice,
        salePrice: 0,
        stock: 0,
        optionPrices:
          productType === "set" ? { ...initialOptionPrices } : undefined,
      },
    ]);
  };

  const handleCreateNewSize = async () => {
    if (!newCustomSizeName.trim()) {
      alert("Vui lòng nhập tên kích cỡ (Size) mới");
      return;
    }
    try {
      const created = await sizeApi.create({
        name: newCustomSizeName.trim(),
      });
      setDbSizes((prev) => [...prev, created]);
      const defaultPrice =
        typeof price === "number" ? price : sellingOptionsList[0]?.price || 0;
      setSizesList((prev) => [
        ...prev,
        { name: created.name, price: defaultPrice, salePrice: 0, stock: 0 },
      ]);
      setNewCustomSizeName("");
      setIsCreatingSize(false);
    } catch (err: any) {
      alert(err.message || "Tạo size mới thất bại");
    }
  };

  const handleRemoveSize = (indexToRemove: number) => {
    setSizesList(sizesList.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSelectColorDropdown = (colorValue: string) => {
    if (!colorValue) return;
    if (colorValue === "__NEW__") {
      handleOpenCreateColorModal();
      setSelectedColorSelect("");
      return;
    }
    if (!colorsList.includes(colorValue)) {
      setColorsList([...colorsList, colorValue]);
    }
    setSelectedColorSelect("");
  };

  const handleOpenCreateColorModal = (initialName?: string) => {
    setNewCustomColorName(typeof initialName === "string" ? initialName.trim() : "");
    setNewCustomColorCode(`M${dbColors.length + 1}`);
    setNewCustomColorHex("#3B82F6");
    setColorModalAutoAssign(true);
    setColorModalError("");
    setIsCreateColorModalOpen(true);
  };

  const handleAddAllFilteredColors = () => {
    const unselectedNames = filteredDbColors
      .map((c) => c.name)
      .filter((name) => !colorsList.includes(name));
    if (unselectedNames.length > 0) {
      setColorsList([...colorsList, ...unselectedNames]);
    }
  };

  const handleCreateNewColor = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmedName = newCustomColorName.trim();
    if (!trimmedName) {
      setColorModalError("Vui lòng nhập tên màu sắc");
      return;
    }

    const codeToUse = (
      newCustomColorCode.trim() || `M${dbColors.length + 1}`
    ).toUpperCase();

    setColorModalLoading(true);
    setColorModalError("");

    try {
      const created = await colorApi.create({
        name: trimmedName,
        code: codeToUse,
        hexCode: newCustomColorHex
          ? newCustomColorHex.toUpperCase()
          : "#000000",
        isActive: true,
      });

      setDbColors((prev) => [...prev, created]);
      if (colorModalAutoAssign && !colorsList.includes(created.name)) {
        setColorsList((prev) => [...prev, created.name]);
      }
      setIsCreateColorModalOpen(false);
      setNewCustomColorName("");
      setNewCustomColorCode("");
    } catch (err: any) {
      setColorModalError(err.message || "Tạo màu mới thất bại");
    } finally {
      setColorModalLoading(false);
    }
  };

  const handleAddColor = (customColor?: string) => {
    const colorToAdd = (
      customColor !== undefined ? customColor : newColorName
    ).trim();
    if (!colorToAdd) return;
    if (!colorsList.includes(colorToAdd)) {
      setColorsList([...colorsList, colorToAdd]);
    }
    if (customColor === undefined) {
      setNewColorName("");
    }
  };

  const handleToggleColor = (colorName: string) => {
    const trimmed = colorName.trim();
    if (!trimmed) return;
    if (colorsList.includes(trimmed)) {
      setColorsList(colorsList.filter((c) => c !== trimmed));
    } else {
      setColorsList([...colorsList, trimmed]);
    }
  };

  const handleSelectAllColors = () => {
    const allNames = dbColors.map((c) => c.name);
    const combined = Array.from(new Set([...colorsList, ...allNames]));
    setColorsList(combined);
  };

  const handleDeselectAllColors = () => {
    setColorsList([]);
  };

  const handleRemoveColor = (indexToRemove: number) => {
    setColorsList(colorsList.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !code.trim() || !categoryId) {
      setFormError(
        "Vui lòng nhập đầy đủ Tên sản phẩm, Mã sản phẩm và Thể loại",
      );
      return;
    }

    if (productType === "single" && price === "") {
      setFormError("Vui lòng nhập Giá bán cho sản phẩm");
      return;
    }

    if (productType === "set") {
      if (sellingOptionsList.length === 0) {
        setFormError(
          "Vui lòng thêm ít nhất 1 hình thức bán (ví dụ: Cả Set, Lẻ Áo, Lẻ Quần)",
        );
        return;
      }
      const invalidOption = sellingOptionsList.find(
        (o) => !o.name.trim() || o.price <= 0,
      );
      if (invalidOption) {
        setFormError(
          `Vui lòng nhập mức giá hợp lệ (> 0) cho hình thức: "${invalidOption.name}"`,
        );
        return;
      }
    }

    setFormLoading(true);
    setFormError("");

    try {
      // Gom tất cả ảnh hợp lệ
      const finalImages = imagesList.map((img) => img.trim()).filter(Boolean);

      const computedPrice =
        productType === "set"
          ? sellingOptionsList[0]?.price || Number(price) || 0
          : Number(price);

      const payload: any = {
        name,
        code: code.toUpperCase(),
        category: categoryId,
        subcategory: subcategory.trim() || undefined,
        price: computedPrice,
        salePrice: 0,
        stock: 0,
        sellingOptions: productType === "set" ? sellingOptionsList : [],
        sizes: sizesList,
        colors: colorsList,
        images: finalImages,
        description,
        isPinned,
        status,
      };

      if (modalMode === "create") {
        await productApi.create(payload);
        setActionSuccess("Thêm sản phẩm mới thành công!");
        setIsModalOpen(false);
        fetchProducts(1, limit);
      } else if (currentId) {
        await productApi.update(currentId, payload);
        setActionSuccess("Cập nhật sản phẩm thành công!");
        setIsModalOpen(false);
        fetchProducts(page, limit);
      }
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
      fetchProducts(page, limit);
      setTimeout(() => setActionSuccess(""), 3000);
    } catch (err: any) {
      alert(err.message || "Xóa sản phẩm thất bại");
    }
  };

  const handleTogglePin = async (p: Product) => {
    const nextPinned = !p.isPinned;

    if (nextPinned) {
      const currentPinnedCount = products.filter((item) => item.isPinned).length;
      if (currentPinnedCount >= 5) {
        setActionError(
          "Chỉ được phép ghim tối đa 5 sản phẩm. Vui lòng bỏ ghim sản phẩm khác trước khi ghim thêm!",
        );
        setTimeout(() => setActionError(""), 3500);
        return;
      }
    }

    // Cập nhật giao diện tức thì
    setProducts((prev) => {
      const updated = prev.map((item) =>
        item._id === p._id ? { ...item, isPinned: nextPinned } : item,
      );
      return updated.sort((a, b) => {
        if (Boolean(a.isPinned) === Boolean(b.isPinned)) return 0;
        return a.isPinned ? -1 : 1;
      });
    });

    try {
      await productApi.togglePin(p._id);
      setActionSuccess(
        nextPinned
          ? `Đã ghim "${p.name}" lên đầu tab sản phẩm!`
          : `Đã bỏ ghim "${p.name}"!`,
      );
      setTimeout(() => setActionSuccess(""), 2500);
    } catch (err: any) {
      console.error("Toggle pin error:", err);
      setActionError(err.message || "Thao tác ghim thất bại");
      setTimeout(() => setActionError(""), 3500);
      fetchProducts();
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

      {actionError && (
        <div className="p-3 bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 rounded-xl border border-rose-200 dark:border-rose-800 text-xs font-semibold flex items-center gap-2 animate-shake">
          <AlertCircle size={15} />
          <span>{actionError}</span>
        </div>
      )}

      {/* Action Header & Search Controls */}
      <div className="bg-white dark:bg-slate-800 p-2.5 sm:p-4 rounded-xl sm:rounded-2xl border border-gray-100 dark:border-slate-700 shadow-xs space-y-2 sm:space-y-0 sm:flex sm:items-center sm:justify-between sm:gap-2.5 transition-colors">
        {/* Hàng 1: Ô Search + Nút Thêm trên Mobile */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="relative flex-1 min-w-0">
            <input
              type="text"
              placeholder="Tìm theo tên hoặc mã SP..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-7 pr-7 py-1.5 text-xs border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-white rounded-lg focus:border-blue-500 focus:outline-none placeholder-gray-400 dark:placeholder-slate-400 shadow-2xs"
            />
            <Search size={13} className="absolute left-2 top-2 text-gray-400" />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-2 top-1.5 p-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer"
                title="Xóa tìm kiếm"
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* Nút Thêm SP trên Mobile (nằm cùng hàng với ô tìm kiếm) */}
          <Button
            variant="primary"
            size="sm"
            icon={<Plus size={13} />}
            onClick={openTypeSelectModal}
            className="sm:hidden font-bold shadow-xs whitespace-nowrap text-xs py-1.5 px-2.5 shrink-0"
          >
            Thêm
          </Button>
        </div>

        {/* Hàng 2 trên Mobile (hoặc cùng hàng trên Desktop): Các dropdown lọc chia lưới gọn gàng */}
        <div className="grid grid-cols-2 sm:flex sm:items-center gap-1.5 sm:gap-2.5">
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setSelectedSubcategory("");
            }}
            className="w-full sm:w-auto py-1.5 px-2 text-xs border border-gray-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none shadow-2xs font-medium truncate cursor-pointer"
          >
            <option value="">Tất cả thể loại</option>
            {categories.map((cat) => (
              <option key={cat._id} value={cat._id}>
                {cat.name}
              </option>
            ))}
          </select>

          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="w-full sm:w-auto py-1.5 px-2 text-xs border border-gray-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none shadow-2xs font-semibold cursor-pointer truncate"
          >
            <option value="">Tất cả loại hình</option>
            <option value="set">📦 Bán Set</option>
            <option value="single">👕 Bán lẻ</option>
          </select>

          {filterSubcategories.length > 0 && (
            <select
              value={selectedSubcategory}
              onChange={(e) => setSelectedSubcategory(e.target.value)}
              className="col-span-2 sm:col-span-1 w-full sm:w-auto py-1.5 px-2 text-xs border border-blue-200 dark:border-blue-900/60 rounded-lg bg-blue-50/50 dark:bg-slate-900 text-blue-800 dark:text-blue-300 font-semibold focus:border-blue-500 focus:outline-none shadow-2xs truncate cursor-pointer"
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

        {/* Nút Thêm SP trên Desktop */}
        <Button
          variant="primary"
          size="sm"
          icon={<Plus size={13} />}
          onClick={openTypeSelectModal}
          className="hidden sm:inline-flex font-bold shadow-xs whitespace-nowrap text-xs py-1.5 px-3 shrink-0"
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
                  <th className="py-2.5 px-3">Thể loại</th>
                  <th className="py-2.5 px-3">Giá bán</th>
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
                  const isSet =
                    Array.isArray(p.sellingOptions) &&
                    p.sellingOptions.length > 0;

                  return (
                    <tr
                      key={p._id}
                      className="hover:bg-gray-50/50 dark:hover:bg-slate-700/30 transition-colors"
                    >
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={getImageUrl(p.images?.[0])}
                            alt={p.name}
                            onError={handleImageError}
                            className="w-10 h-10 rounded-lg object-cover border border-gray-100 dark:border-slate-700 shadow-2xs flex-shrink-0"
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span
                                className="font-bold text-gray-900 dark:text-white max-w-[180px] sm:max-w-xs truncate block text-xs"
                                title={p.name}
                              >
                                {p.name}
                              </span>
                              {p.isPinned && (
                                <span className="inline-flex items-center gap-0.5 text-[9px] font-extrabold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/60 px-1 py-0.2 rounded border border-amber-300 dark:border-amber-700 flex-shrink-0 shadow-2xs">
                                  <Pin size={8} className="fill-amber-500 text-amber-600" />
                                  <span>Ghim</span>
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="font-mono font-bold text-gray-500 dark:text-slate-400 text-[11px]">
                                {p.code}
                              </span>
                              {isSet && (
                                <span className="inline-block text-[9px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.2 rounded border border-amber-200/60 dark:border-amber-900/60">
                                  Set
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-xs">
                        <div className="flex flex-col items-start gap-1">
                          <span
                            className="font-semibold text-gray-800 dark:text-slate-200 truncate max-w-[160px] block"
                            title={catName}
                          >
                            {catName}
                          </span>
                          {p.subcategory && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60 text-[10px] font-semibold">
                              <span className="text-[9px] opacity-70">↳</span>
                              <span className="truncate max-w-[140px]">
                                {p.subcategory}
                              </span>
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
                          onClick={() => handleTogglePin(p)}
                          className={`p-1 rounded transition-colors cursor-pointer ${
                            p.isPinned
                              ? "text-amber-500 hover:text-amber-600 bg-amber-50 dark:bg-amber-950/60"
                              : "text-gray-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/40"
                          }`}
                          title={p.isPinned ? "Bỏ ghim sản phẩm" : "Ghim sản phẩm lên đầu"}
                        >
                          <Pin size={13} className={p.isPinned ? "fill-amber-500" : ""} />
                        </button>
                        <button
                          onClick={() => handleOpenDetailModal(p)}
                          className="p-1 text-gray-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded transition-colors cursor-pointer"
                          title="Xem chi tiết"
                        >
                          <Eye size={13} />
                        </button>
                        <button
                          onClick={() => openEditModal(p)}
                          className="p-1 text-gray-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded transition-colors cursor-pointer"
                          title="Sửa"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          onClick={() => handleDelete(p)}
                          className="p-1 text-gray-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded transition-colors cursor-pointer"
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

        {/* Mobile: Infinite Scroll Sentinel */}
        <div ref={sentinelRef} className="h-4 w-full" />

        {/* Mobile: Indicator đang tải thêm sản phẩm khi cuộn */}
        {loadingMore && (
          <div className="lg:hidden p-3 flex items-center justify-center gap-2 text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50/40 dark:bg-blue-950/20 border-t border-gray-100 dark:border-slate-800">
            <Loader2 size={15} className="animate-spin" />
            <span>Đang tải thêm sản phẩm...</span>
          </div>
        )}

        {/* Mobile: Thông báo khi đã cuộn xem hết toàn bộ sản phẩm */}
        {!loading && !loadingMore && products.length >= total && total > 0 && (
          <div className="lg:hidden p-3 text-center text-xs font-semibold text-gray-400 dark:text-slate-500 bg-slate-50/50 dark:bg-slate-900/40 border-t border-gray-100 dark:border-slate-800">
            ✓ Đã hiển thị tất cả {total} sản phẩm
          </div>
        )}

        {/* Desktop: Phân trang Pagination (Chỉ hiển thị trên màn hình lớn lg:) */}
        {!loading && total > 0 && (
          <div className="hidden lg:flex p-3 sm:p-4 border-t border-gray-100 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-900/30 items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-wrap text-xs text-gray-500 dark:text-slate-400 font-medium">
              <div>
                Hiển thị{" "}
                <strong className="text-gray-900 dark:text-white">
                  {Math.min((page - 1) * limit + 1, total)}
                </strong>
                -
                <strong className="text-gray-900 dark:text-white">
                  {Math.min(page * limit, total)}
                </strong>{" "}
                trên tổng số{" "}
                <strong className="text-blue-600 dark:text-blue-400">
                  {total}
                </strong>{" "}
                sản phẩm
              </div>

              <div className="flex items-center gap-1.5">
                <span>Số dòng:</span>
                <select
                  value={limit}
                  onChange={(e) => {
                    const newLimit = Number(e.target.value);
                    setLimit(newLimit);
                    fetchProducts(1, newLimit);
                  }}
                  className="py-1 px-2 text-xs border border-gray-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 font-semibold cursor-pointer shadow-2xs"
                >
                  <option value={20}>20 / trang</option>
                  <option value={50}>50 / trang</option>
                  <option value={100}>100 / trang</option>
                  <option value={200}>200 / trang</option>
                </select>
              </div>
            </div>

            {totalPages > 1 && (
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={(p) => fetchProducts(p, limit)}
              />
            )}
          </div>
        )}
      </div>

      {/* MODAL BƯỚC 1: CHỌN LOẠI HÌNH SẢN PHẨM (BÁN THEO SET VS BÁN ĐƠN LẺ) */}
      <Modal
        isOpen={isTypeModalOpen}
        onClose={() => setIsTypeModalOpen(false)}
        title="Chọn loại hình sản phẩm"
        size="xl"
      >
        <div className="space-y-3 py-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-0.5">
            {/* 1. BÁN THEO SET / BỘ */}
            <div
              onClick={() => handleSelectProductType("set")}
              className="group cursor-pointer p-3.5 rounded-2xl border-2 border-teal-200 dark:border-teal-900/60 bg-gradient-to-b from-teal-50/40 to-white dark:from-teal-950/30 dark:to-slate-800 hover:border-teal-500 dark:hover:border-teal-400 hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="w-10 h-10 rounded-xl bg-teal-500/10 dark:bg-teal-500/20 text-teal-600 dark:text-teal-400 flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform">
                  <Boxes size={22} />
                </div>
                <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-1">
                  Sản phẩm Set / Combo
                </h4>
                <p className="text-[11px] text-gray-500 dark:text-slate-400 leading-relaxed">
                  Bán trọn bộ hoặc tách lẻ từng món (Áo, Quần...) với giá riêng.
                </p>
              </div>

              <div className="mt-3 pt-2.5 border-t border-teal-100 dark:border-teal-900/40 flex items-center justify-between text-xs font-bold text-teal-700 dark:text-teal-300">
                <span>Tạo sản phẩm Set</span>
                <ArrowRight
                  size={13}
                  className="group-hover:translate-x-1 transition-transform"
                />
              </div>
            </div>

            {/* 2. BÁN ĐƠN LẺ */}
            <div
              onClick={() => handleSelectProductType("single")}
              className="group cursor-pointer p-3.5 rounded-2xl border-2 border-indigo-200 dark:border-indigo-900/60 bg-gradient-to-b from-indigo-50/40 to-white dark:from-indigo-950/30 dark:to-slate-800 hover:border-indigo-500 dark:hover:border-indigo-400 hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform">
                  <Shirt size={22} />
                </div>
                <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-1">
                  Sản phẩm Đơn lẻ
                </h4>
                <p className="text-[11px] text-gray-500 dark:text-slate-400 leading-relaxed">
                  Bán 1 món độc lập (Áo thun, Quần jean...) với 1 mức giá cố
                  định.
                </p>
              </div>

              <div className="mt-3 pt-2.5 border-t border-indigo-100 dark:border-indigo-900/40 flex items-center justify-between text-xs font-bold text-indigo-700 dark:text-indigo-300">
                <span>Tạo sản phẩm Đơn</span>
                <ArrowRight
                  size={13}
                  className="group-hover:translate-x-1 transition-transform"
                />
              </div>
            </div>
          </div>
        </div>
      </Modal>

      {/* MODAL BƯỚC 2: FORM THÊM / SỬA CHI TIẾT SẢN PHẨM */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={
          modalMode === "create"
            ? productType === "set"
              ? "Thêm Sản Phẩm (Set / Combo)"
              : "Thêm Sản Phẩm (Đơn Lẻ)"
            : productType === "set"
              ? "Chỉnh Sửa (Set / Combo)"
              : "Chỉnh Sửa (Đơn Lẻ)"
        }
        size="4xl"
      >
        <form
          onSubmit={handleSubmit}
          className="space-y-3.5 text-xs max-h-[75vh] overflow-y-auto pr-1"
        >
          {/* Header Type Switcher */}
          <div className="flex items-center justify-between p-2.5 bg-slate-100/80 dark:bg-slate-800/60 rounded-xl border border-gray-200/80 dark:border-slate-700/80 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-600 dark:text-slate-300">
                Loại hình sản phẩm:
              </span>
              <span
                className={`px-2 py-0.5 rounded-md font-extrabold text-[10px] ${
                  productType === "set"
                    ? "bg-teal-100 dark:bg-teal-900/60 text-teal-800 dark:text-teal-300 border border-teal-300 dark:border-teal-700"
                    : "bg-indigo-100 dark:bg-indigo-900/60 text-indigo-800 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-700"
                }`}
              >
                {productType === "set" ? "Bán theo Set / Bộ" : "Bán đơn lẻ"}
              </span>
            </div>

            <button
              type="button"
              onClick={() =>
                setProductType(productType === "set" ? "single" : "set")
              }
              className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
            >
              {productType === "set"
                ? "Đổi sang: Bán đơn lẻ"
                : "Đổi sang: Bán theo Set"}
            </button>
          </div>

          {/* TAB NAVIGATION BAR */}
          <div className="flex items-center gap-1.5 p-1 bg-gray-100 dark:bg-slate-800/90 rounded-xl border border-gray-200 dark:border-slate-700/80 overflow-x-auto no-scrollbar">
            <button
              type="button"
              onClick={() => setFormTab("general")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                formTab === "general"
                  ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs"
                  : "text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              <FileText size={14} />
              <span>1. Thông tin chung</span>
            </button>

            <button
              type="button"
              onClick={() => setFormTab("pricing")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                formTab === "pricing"
                  ? "bg-white dark:bg-slate-700 text-teal-600 dark:text-teal-400 shadow-xs"
                  : "text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              {productType === "set" ? (
                <Boxes size={14} />
              ) : (
                <DollarSign size={14} />
              )}
              <span>
                2. {productType === "set" ? "Món trong Set" : "Giá bán"}
              </span>
              {productType === "set" && sellingOptionsList.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-teal-100 dark:bg-teal-900/60 text-teal-700 dark:text-teal-300 font-extrabold">
                  {sellingOptionsList.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setFormTab("variants")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                formTab === "variants"
                  ? "bg-white dark:bg-slate-700 text-purple-600 dark:text-purple-400 shadow-xs"
                  : "text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              <Palette size={14} />
              <span>3. Size & Màu sắc</span>
              {(sizesList.length > 0 || colorsList.length > 0) && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 font-extrabold">
                  {sizesList.length + colorsList.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setFormTab("images")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                formTab === "images"
                  ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs"
                  : "text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              <ImageIcon size={14} />
              <span>4. Hình ảnh</span>
              {imagesList.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-extrabold">
                  {imagesList.length}
                </span>
              )}
            </button>
          </div>

          {formError && (
            <div className="p-2.5 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 rounded-lg text-xs flex items-center gap-2 animate-shake">
              <AlertCircle size={15} className="flex-shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 1: THÔNG TIN CHUNG */}
          {/* ======================================================== */}
          {formTab === "general" && (
            <div className="space-y-3 animate-fade-in">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Tên sản phẩm *"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="VD: SET BỘ DÀI TAY CHO BÉ"
                  required
                />
                <Input
                  label="Mã SP *"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="VD: SP1001"
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
                    <option value="">-- Chọn thể loại --</option>
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
                    disabled={
                      !modalSubcategories || modalSubcategories.length === 0
                    }
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
                        {subcategory &&
                          !modalSubcategories.includes(subcategory) && (
                            <option value={subcategory}>{subcategory}</option>
                          )}
                      </>
                    ) : (
                      <option value="">
                        -- Thể loại này chưa có nhóm con --
                      </option>
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

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Mô tả sản phẩm
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Nhập thông tin chi tiết về sản phẩm, chất liệu, hướng dẫn sử dụng..."
                  className="w-full rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white p-2.5 text-xs focus:outline-none focus:border-blue-500 resize-y"
                />
              </div>

              {/* Ghim sản phẩm lên đầu */}
              <div className="pt-1">
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isPinned}
                    onChange={(e) => {
                      if (e.target.checked) {
                        const currentPinnedCount = products.filter(
                          (item) => item.isPinned && item._id !== currentId,
                        ).length;
                        if (currentPinnedCount >= 5) {
                          setFormError(
                            "Chỉ được phép ghim tối đa 5 sản phẩm. Vui lòng bỏ ghim bớt sản phẩm khác trước!",
                          );
                          return;
                        }
                      }
                      setFormError("");
                      setIsPinned(e.target.checked);
                    }}
                    className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 border-gray-300"
                  />
                  <div className="flex items-center gap-1.5">
                    <Pin size={13} className={isPinned ? "text-amber-500 fill-amber-500" : "text-gray-400"} />
                    <span className="text-xs font-semibold text-gray-800 dark:text-gray-200">
                      Ghim sản phẩm này lên đầu danh sách{" "}
                      <span className="text-[11px] font-normal text-amber-600 dark:text-amber-400">
                        (Tối đa 5 sản phẩm)
                      </span>
                    </span>
                  </div>
                </label>
              </div>

              <div className="flex justify-end pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setFormTab("pricing")}
                  className="font-semibold text-xs text-blue-600 dark:text-blue-400 gap-1.5"
                >
                  <span>
                    Tiếp tục:{" "}
                    {productType === "set"
                      ? "Cấu hình món trong Set"
                      : "Cấu hình giá bán"}
                  </span>
                  <ChevronRight size={14} />
                </Button>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 2: GIÁ & HÌNH THỨC BÁN */}
          {/* ======================================================== */}
          {formTab === "pricing" && (
            <div className="space-y-3 animate-fade-in">
              {productType === "single" ? (
                <div className="p-4 bg-indigo-50/50 dark:bg-indigo-950/20 rounded-2xl border border-indigo-100 dark:border-indigo-900/40 space-y-3">
                  <div className="flex items-center gap-2 text-indigo-900 dark:text-indigo-200">
                    <DollarSign
                      size={18}
                      className="text-indigo-600 dark:text-indigo-400"
                    />
                    <span className="font-bold text-sm">
                      Giá bán sản phẩm đơn lẻ
                    </span>
                  </div>
                  <Input
                    label="Giá bán chuẩn (VNĐ) *"
                    type="number"
                    value={price}
                    onChange={(e) =>
                      setPrice(
                        e.target.value === "" ? "" : Number(e.target.value),
                      )
                    }
                    placeholder="VD: 150000"
                    required
                  />
                  <p className="text-[11px] text-gray-500 dark:text-slate-400">
                    * Mức giá này áp dụng mặc định cho sản phẩm khi khách hàng
                    đặt mua. (Nếu sản phẩm có nhiều size với giá khác nhau, bạn
                    có thể cấu hình ở tab <b>Size & Màu sắc</b>).
                  </p>
                </div>
              ) : (
                <div className="p-4 bg-teal-50/50 dark:bg-teal-950/20 rounded-2xl border border-teal-200/80 dark:border-teal-900/60 space-y-4">
                  {/* Header Tab 2 */}
                  <div className="flex items-center justify-between gap-2 pb-2 border-b border-teal-200/60 dark:border-teal-900/40">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2 text-teal-950 dark:text-teal-200 font-bold text-sm">
                        <Boxes
                          size={18}
                          className="text-teal-600 dark:text-teal-400"
                        />
                        <span>
                          Cấu hình món trong Set đồ ({sellingOptionsList.length}{" "}
                          món)
                        </span>
                      </div>
                      <p className="text-[11px] text-teal-700/80 dark:text-teal-400/80">
                        * Món đầu tiên sẽ là <b>Giá niêm yết</b> của toàn bộ
                        Set. Bạn có thể chọn tên món và nhập giá trực tiếp cho
                        từng dòng bên dưới.
                      </p>
                    </div>

                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      icon={<Plus size={14} />}
                      onClick={handleAddNewOptionRow}
                      className="text-xs py-1.5 px-3 bg-white dark:bg-slate-800 border-teal-300 dark:border-teal-700 text-teal-700 dark:text-teal-300 font-bold hover:bg-teal-50 dark:hover:bg-teal-900/40 shrink-0 shadow-2xs"
                    >
                      Thêm món
                    </Button>
                  </div>

                  {/* Form inline tạo tên món mới vào API nếu được kích hoạt */}
                  {isCreatingSetOption && (
                    <div className="p-3 bg-blue-50/90 dark:bg-blue-950/50 rounded-xl border border-blue-200 dark:border-blue-800 space-y-2 animate-fade-in shadow-xs">
                      <div className="flex items-center justify-between text-xs font-bold text-blue-900 dark:text-blue-200">
                        <span className="flex items-center gap-1.5">
                          <Plus
                            size={14}
                            className="text-blue-600 dark:text-blue-400"
                          />
                          Tạo tên món mới vào danh mục hệ thống:
                        </span>
                        <button
                          type="button"
                          onClick={() => setIsCreatingSetOption(false)}
                          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-0.5 cursor-pointer"
                        >
                          <X size={14} />
                        </button>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={newCustomOptionName}
                          onChange={(e) =>
                            setNewCustomOptionName(e.target.value)
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleCreateNewSetOption();
                            }
                          }}
                          placeholder="VD: Lẻ Nón, Lẻ Vớ, Lẻ Khăn Choàng..."
                          className="flex-1 text-xs px-3 py-2 rounded-lg border border-blue-300 dark:border-blue-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                          autoFocus
                        />
                        <Button
                          type="button"
                          variant="primary"
                          size="sm"
                          onClick={handleCreateNewSetOption}
                          className="text-xs py-2 px-3 whitespace-nowrap bg-blue-600 hover:bg-blue-700 text-white font-bold"
                        >
                          Lưu
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Danh sách các dòng món trong Set */}
                  {sellingOptionsList.length > 0 ? (
                    <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                      {sellingOptionsList.map((opt, idx) => (
                        <div
                          key={idx}
                          className={`p-2.5 sm:p-3 rounded-xl border transition-all duration-200 shadow-2xs space-y-2 sm:space-y-0 sm:flex sm:items-center sm:gap-2.5 ${
                            idx === 0
                              ? "bg-amber-50/40 dark:bg-amber-950/20 border-amber-300/80 dark:border-amber-800/60"
                              : "bg-white dark:bg-slate-800/90 border-teal-200/80 dark:border-teal-900/60"
                          }`}
                        >
                          {/* Header dòng trên mobile / bên trái trên PC */}
                          <div className="flex items-center justify-between sm:justify-start gap-1.5 min-w-[95px]">
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full font-bold flex items-center justify-center text-[11px] sm:text-xs flex-shrink-0 ${
                                  idx === 0
                                    ? "bg-amber-500 text-white shadow-2xs"
                                    : "bg-teal-100 dark:bg-teal-900/60 text-teal-700 dark:text-teal-300"
                                }`}
                              >
                                {idx + 1}
                              </span>
                              {idx === 0 ? (
                                <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-amber-500 text-white font-bold tracking-tight shadow-2xs whitespace-nowrap">
                                  ★ Giá niêm yết
                                </span>
                              ) : (
                                <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-teal-100 dark:bg-teal-900/50 text-teal-700 dark:text-teal-300 font-semibold whitespace-nowrap">
                                  Món lẻ {idx}
                                </span>
                              )}
                            </div>

                            {/* Nút Xóa món trên mobile (từ món 2 trở đi) */}
                            {idx > 0 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveSellingOption(idx)}
                                className="sm:hidden p-1 text-gray-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                                title="Xóa món này khỏi Set"
                              >
                                <Trash2 size={15} />
                              </button>
                            )}
                          </div>

                          {/* 2 thẻ input nằm trên 1 hàng (trên cả mobile lẫn desktop) */}
                          <div className="flex-1 flex items-center gap-2">
                            {/* Thẻ 1: Chọn Tên món từ API */}
                            <div className="flex-1 min-w-0">
                              <select
                                value={opt.name}
                                onChange={(e) =>
                                  handleUpdateSellingOption(
                                    idx,
                                    "name",
                                    e.target.value,
                                  )
                                }
                                className="w-full text-xs font-bold px-2.5 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer shadow-2xs truncate"
                              >
                                {dbSetOptions.map((item) => (
                                  <option key={item._id} value={item.name}>
                                    {item.name}{" "}
                                    {item.code ? `(${item.code})` : ""}
                                  </option>
                                ))}
                                {opt.name &&
                                  !dbSetOptions.some(
                                    (item) => item.name === opt.name,
                                  ) && (
                                    <option value={opt.name}>{opt.name}</option>
                                  )}
                                <option
                                  value="__NEW__"
                                  className="text-blue-600 font-bold"
                                >
                                  + Tạo tên món mới vào API...
                                </option>
                              </select>
                            </div>

                            {/* Thẻ 2: Nhập giá bán */}
                            <div className="w-28 sm:w-40 relative flex-shrink-0">
                              <input
                                type="number"
                                value={opt.price === 0 ? "" : opt.price}
                                onChange={(e) =>
                                  handleUpdateSellingOption(
                                    idx,
                                    "price",
                                    e.target.value === ""
                                      ? 0
                                      : Number(e.target.value),
                                  )
                                }
                                placeholder="0"
                                className="w-full text-xs font-bold pr-8 sm:pr-10 pl-2.5 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 focus:outline-none focus:ring-2 focus:ring-teal-500 shadow-2xs"
                              />
                              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] sm:text-[10px] font-bold text-gray-400 dark:text-slate-500 pointer-events-none">
                                VNĐ
                              </span>
                            </div>

                            {/* Nút Xóa món trên desktop */}
                            {idx > 0 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveSellingOption(idx)}
                                className="hidden sm:inline-flex p-2 text-gray-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer flex-shrink-0"
                                title="Xóa món này khỏi Set"
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-6 bg-white/70 dark:bg-slate-900/60 rounded-xl text-center space-y-2 border border-dashed border-teal-300 dark:border-teal-800">
                      <p className="text-xs text-gray-500 dark:text-slate-400 font-medium">
                        Chưa có món nào trong Set đồ này.
                      </p>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        icon={<Plus size={14} />}
                        onClick={handleAddNewOptionRow}
                        className="text-xs font-bold text-teal-700 dark:text-teal-300 border-teal-300 dark:border-teal-700"
                      >
                        Thêm món đầu tiên (Giá niêm yết)
                      </Button>
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-between pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setFormTab("general")}
                  className="font-semibold text-xs gap-1.5"
                >
                  <ChevronLeft size={14} />
                  <span>Quay lại</span>
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setFormTab("variants")}
                  className="font-semibold text-xs text-blue-600 dark:text-blue-400 gap-1.5"
                >
                  <span>Tiếp tục: Size & Màu sắc</span>
                  <ChevronRight size={14} />
                </Button>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 3: SIZE & MÀU SẮC */}
          {/* ======================================================== */}
          {formTab === "variants" && (
            <div className="space-y-3 animate-fade-in">
              {/* QUẢN LÝ DANH SÁCH SIZE / PHIÊN BẢN (SIZES / VARIANTS) */}
              <div className="p-4 bg-indigo-50/50 dark:bg-indigo-950/20 rounded-2xl border border-indigo-200/80 dark:border-indigo-900/60 space-y-3.5">
                {/* Header Bảng Size */}
                <div className="flex items-center justify-between gap-2 pb-2 border-b border-indigo-200/60 dark:border-indigo-900/40">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2 text-indigo-950 dark:text-indigo-200 font-bold text-sm">
                      <Layers
                        size={18}
                        className="text-indigo-600 dark:text-indigo-400"
                      />
                      <span>
                        Bảng Size / Phiên bản ({sizesList.length} size)
                      </span>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    icon={<Plus size={14} />}
                    onClick={handleOpenAddSizeModal}
                    className="text-xs py-1.5 px-3 bg-white dark:bg-slate-800 border-indigo-300 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300 font-bold hover:bg-indigo-50 dark:hover:bg-indigo-900/40 shrink-0 shadow-2xs cursor-pointer"
                  >
                    Thêm size
                  </Button>
                </div>

                {/* Form inline tạo Size mới vào API */}
                {isCreatingSize && (
                  <div className="p-3 bg-blue-50/90 dark:bg-blue-950/50 rounded-xl border border-blue-200 dark:border-blue-800 space-y-2 animate-fade-in shadow-xs">
                    <div className="flex items-center justify-between text-xs font-bold text-blue-900 dark:text-blue-200">
                      <span className="flex items-center gap-1.5">
                        <Plus
                          size={14}
                          className="text-blue-600 dark:text-blue-400"
                        />
                        Tạo kích cỡ (Size) mới vào danh mục hệ thống:
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsCreatingSize(false)}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-0.5 cursor-pointer"
                      >
                        <X size={14} />
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={newCustomSizeName}
                        onChange={(e) => setNewCustomSizeName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleCreateNewSize();
                          }
                        }}
                        placeholder="VD: 3XL, 4XL, 128GB, 512GB, 33, 34..."
                        className="flex-1 text-xs px-3 py-2 rounded-lg border border-blue-300 dark:border-blue-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                        autoFocus
                      />
                      <Button
                        type="button"
                        variant="primary"
                        size="sm"
                        onClick={handleCreateNewSize}
                        className="text-xs py-2 px-3 whitespace-nowrap bg-blue-600 hover:bg-blue-700 text-white font-bold"
                      >
                        Lưu vào API
                      </Button>
                    </div>
                  </div>
                )}

                {/* Danh sách các dòng Size */}
                {productType === "set" ? (
                  // =================== GIAO DIỆN MA TRẬN GIÁ CHO SẢN PHẨM SET ===================
                  sellingOptionsList.length === 0 ? (
                    <div className="p-5 bg-amber-50 dark:bg-amber-950/30 rounded-xl text-center space-y-2 border border-amber-200 dark:border-amber-900/50">
                      <p className="text-xs text-amber-800 dark:text-amber-300 font-semibold">
                        Chưa có món nào trong Set đồ. Vui lòng quay lại{" "}
                        <b>Tab 2 (Món trong Set)</b> để cấu hình các món trước.
                      </p>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => setFormTab("pricing")}
                        className="text-xs font-bold text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700"
                      >
                        Quay lại Tab 2: Cấu hình món
                      </Button>
                    </div>
                  ) : sizesList.length > 0 ? (
                    <div className="space-y-3">
                      {/* Tiện ích thao tác nhanh cho Ma trận giá */}
                      <div className="flex items-center justify-between gap-2 px-1 text-xs">
                        <span className="text-[11px] text-gray-500 dark:text-slate-400 font-medium">
                          * Nhập giá bán riêng cho từng món theo từng kích cỡ
                        </span>
                        <button
                          type="button"
                          onClick={handleSyncBasePricesToSizes}
                          className="flex items-center gap-1 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors cursor-pointer"
                          title="Điền lại giá niêm yết từ Tab 2 vào tất cả size"
                        >
                          <RotateCcw size={12} />
                          <span>Đồng bộ</span>
                        </button>
                      </div>

                      {/* Bảng Ma Trận Giá Món x Size */}
                      <div className="overflow-x-auto rounded-xl border border-indigo-200/80 dark:border-indigo-900/60 shadow-2xs max-h-80 overflow-y-auto">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead className="bg-indigo-100/70 dark:bg-slate-800 text-gray-700 dark:text-slate-200 text-[11px] font-bold sticky top-0 z-10">
                            <tr>
                              <th className="p-2.5 min-w-[130px] border-b border-indigo-200 dark:border-indigo-900/60">
                                Kích cỡ (Size)
                              </th>
                              {sellingOptionsList.map((opt, optIdx) => (
                                <th
                                  key={optIdx}
                                  className="p-2.5 min-w-[145px] border-b border-indigo-200 dark:border-indigo-900/60"
                                >
                                  <div className="flex items-center gap-1.5">
                                    <span className="truncate">
                                      {opt.name || `Món ${optIdx + 1}`}
                                    </span>
                                    {optIdx === 0 && (
                                      <span className="text-[9px] px-1 py-0.2 bg-amber-500 text-white rounded font-extrabold flex-shrink-0">
                                        ★ Set
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[10px] text-gray-500 dark:text-slate-400 font-normal">
                                    Chuẩn: {formatCurrency(opt.price || 0)}
                                  </div>
                                </th>
                              ))}
                              <th className="p-2.5 w-20 text-center border-b border-indigo-200 dark:border-indigo-900/60">
                                Thao tác
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100 dark:divide-slate-800 bg-white dark:bg-slate-900/90">
                            {sizesList.map((s, sIdx) => (
                              <tr
                                key={sIdx}
                                className="hover:bg-indigo-50/30 dark:hover:bg-slate-800/50 transition-colors"
                              >
                                {/* Cột 1: Chọn Size */}
                                <td className="p-2.5 align-middle">
                                  <select
                                    value={s.name}
                                    onChange={(e) =>
                                      handleUpdateSize(
                                        sIdx,
                                        "name",
                                        e.target.value,
                                      )
                                    }
                                    className="w-full text-xs font-bold px-2 py-1.5 rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                                  >
                                    <option value="">-- Chọn size --</option>
                                    {dbSizes.map((item) => (
                                      <option key={item._id} value={item.name}>
                                        {item.name}
                                      </option>
                                    ))}
                                    {s.name &&
                                      !dbSizes.some(
                                        (item) => item.name === s.name,
                                      ) && (
                                        <option value={s.name}>{s.name}</option>
                                      )}
                                    <option
                                      value="__NEW__"
                                      className="text-blue-600 font-bold"
                                    >
                                      + Tạo size mới...
                                    </option>
                                  </select>
                                </td>

                                {/* Các cột giá cho từng món trong Set */}
                                {sellingOptionsList.map((opt, optIdx) => {
                                  const currentOptPrice =
                                    s.optionPrices &&
                                    s.optionPrices[opt.name] !== undefined
                                      ? s.optionPrices[opt.name]
                                      : opt.price || 0;

                                  return (
                                    <td
                                      key={optIdx}
                                      className="p-2.5 align-middle"
                                    >
                                      <div className="relative">
                                        <input
                                          type="number"
                                          value={
                                            currentOptPrice === 0
                                              ? ""
                                              : currentOptPrice
                                          }
                                          onChange={(e) =>
                                            handleUpdateSizeOptionPrice(
                                              sIdx,
                                              opt.name,
                                              e.target.value,
                                            )
                                          }
                                          placeholder={String(opt.price || 0)}
                                          className="w-full text-xs font-bold pr-8 pl-2 py-1.5 rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-teal-600 dark:text-teal-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs"
                                        />
                                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-bold text-gray-400 dark:text-slate-500 pointer-events-none">
                                          đ
                                        </span>
                                      </div>
                                    </td>
                                  );
                                })}

                                {/* Cột thao tác */}
                                <td className="p-2.5 text-center align-middle">
                                  <div className="flex items-center justify-center gap-1">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleCopySizePricesToAll(sIdx)
                                      }
                                      className="p-1.5 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded-lg transition-colors cursor-pointer"
                                      title="Sao chép giá của size này cho tất cả size khác"
                                    >
                                      <Copy size={14} />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveSize(sIdx)}
                                      className="p-1.5 text-gray-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                                      title="Xóa size này"
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <div className="p-5 bg-white/70 dark:bg-slate-900/60 rounded-xl text-center space-y-2 border border-dashed border-indigo-300 dark:border-indigo-800">
                      <p className="text-xs text-gray-500 dark:text-slate-400 font-medium">
                        Sản phẩm này chưa được tạo size riêng (sẽ áp dụng giá
                        niêm yết chuẩn ở Tab 2).
                      </p>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        icon={<Plus size={14} />}
                        onClick={() => handleAddNewSizeRow()}
                        className="text-xs font-bold text-indigo-700 dark:text-indigo-300 border-indigo-300 dark:border-indigo-700"
                      >
                        Thêm size đầu tiên
                      </Button>
                    </div>
                  )
                ) : // =================== GIAO DIỆN SIZE SẢN PHẨM ĐƠN LẺ ===================
                sizesList.length > 0 ? (
                  <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                    {sizesList.map((s, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 sm:p-3 rounded-xl border bg-white dark:bg-slate-800/90 border-indigo-200/80 dark:border-indigo-900/60 transition-all duration-200 shadow-2xs space-y-2 sm:space-y-0 sm:flex sm:items-center sm:gap-2.5"
                      >
                        {/* Header dòng trên mobile / bên trái trên PC */}
                        <div className="flex items-center justify-between sm:justify-start gap-1.5 min-w-[85px]">
                          <div className="flex items-center gap-1.5">
                            <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-full font-bold flex items-center justify-center text-[11px] sm:text-xs flex-shrink-0 bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300">
                              {idx + 1}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-indigo-100/70 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 font-semibold whitespace-nowrap">
                              Size {idx + 1}
                            </span>
                          </div>

                          {/* Nút Xóa Size trên mobile */}
                          <button
                            type="button"
                            onClick={() => handleRemoveSize(idx)}
                            className="sm:hidden p-1 text-gray-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                            title="Xóa size này"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>

                        {/* 2 thẻ input nằm trên 1 hàng (trên cả mobile lẫn desktop) */}
                        <div className="flex-1 flex items-center gap-2">
                          {/* Thẻ 1: SELECT chọn Size từ API */}
                          <div className="flex-1 min-w-0">
                            <select
                              value={s.name}
                              onChange={(e) =>
                                handleUpdateSize(idx, "name", e.target.value)
                              }
                              className="w-full text-xs font-bold px-2.5 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer shadow-2xs truncate"
                            >
                              <option value="">-- Chọn kích cỡ --</option>
                              {dbSizes.map((item) => (
                                <option key={item._id} value={item.name}>
                                  {item.name}{" "}
                                  {item.code && item.code !== item.name
                                    ? `(${item.code})`
                                    : ""}
                                </option>
                              ))}
                              {s.name &&
                                !dbSizes.some(
                                  (item) => item.name === s.name,
                                ) && <option value={s.name}>{s.name}</option>}
                              <option
                                value="__NEW__"
                                className="text-blue-600 font-bold"
                              >
                                + Tạo size mới vào API...
                              </option>
                            </select>
                          </div>

                          {/* Thẻ 2: Ô nhập Giá cho Size */}
                          <div className="w-28 sm:w-40 relative flex-shrink-0">
                            <input
                              type="number"
                              value={s.price === 0 ? "" : s.price}
                              onChange={(e) =>
                                handleUpdateSize(
                                  idx,
                                  "price",
                                  e.target.value === ""
                                    ? 0
                                    : Number(e.target.value),
                                )
                              }
                              placeholder="0"
                              className="w-full text-xs font-bold pr-8 sm:pr-10 pl-2.5 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs"
                            />
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] sm:text-[10px] font-bold text-gray-400 dark:text-slate-500 pointer-events-none">
                              VNĐ
                            </span>
                          </div>

                          {/* Nút Xóa Size trên desktop */}
                          <button
                            type="button"
                            onClick={() => handleRemoveSize(idx)}
                            className="hidden sm:inline-flex p-2 text-gray-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer flex-shrink-0"
                            title="Xóa size này"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-5 bg-white/70 dark:bg-slate-900/60 rounded-xl text-center space-y-2 border border-dashed border-indigo-300 dark:border-indigo-800">
                    <p className="text-xs text-gray-500 dark:text-slate-400 font-medium">
                      Sản phẩm này chưa được tạo size riêng (sẽ áp dụng giá niêm
                      yết chuẩn).
                    </p>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      icon={<Plus size={14} />}
                      onClick={() => handleAddNewSizeRow()}
                      className="text-xs font-bold text-indigo-700 dark:text-indigo-300 border-indigo-300 dark:border-indigo-700"
                    >
                      Thêm size
                    </Button>
                  </div>
                )}
              </div>

              {/* QUẢN LÝ DANH SÁCH MÀU SẮC (COLORS) */}
              <div className="p-4 bg-purple-50/50 dark:bg-purple-950/20 rounded-2xl border border-purple-200/80 dark:border-purple-900/60 space-y-3.5">
                {/* Header Màu sắc */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-purple-200/60 dark:border-purple-900/40">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2 text-purple-950 dark:text-purple-200 font-bold text-sm">
                      <Palette
                        size={18}
                        className="text-purple-600 dark:text-purple-400"
                      />
                      <span>Màu sắc ({colorsList.length})</span>
                    </div>
                    <p className="text-[11px] text-purple-700/80 dark:text-purple-400/80">
                      * Nhập tìm kiếm theo tên hoặc mã màu (VD: M92, đen, nâu...) để gắn màu cho sản phẩm.
                    </p>
                  </div>
                  {colorsList.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setColorsList([])}
                      className="text-[11px] text-rose-600 hover:text-rose-700 font-semibold transition-colors self-start sm:self-auto cursor-pointer"
                    >
                      Bỏ chọn tất cả ({colorsList.length})
                    </button>
                  )}
                </div>

                {/* Ô TÌM KIẾM & CHỌN MÀU SẮC */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <div className="flex-1 relative" ref={colorDropdownRef}>
                    <div className="relative flex items-center">
                      <Search
                        size={15}
                        className="absolute left-3 text-purple-500 pointer-events-none"
                      />
                      <input
                        type="text"
                        value={colorSearch}
                        onChange={(e) => {
                          setColorSearch(e.target.value);
                          setIsColorDropdownOpen(true);
                        }}
                        onFocus={() => setIsColorDropdownOpen(true)}
                        placeholder="Tìm kiếm theo tên màu hoặc mã (VD: M92, đen, nâu)..."
                        className="w-full text-xs font-semibold pl-9 pr-16 py-2.5 rounded-xl border border-purple-300 dark:border-purple-800 bg-white dark:bg-slate-900 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-2xs transition-all"
                      />
                      <div className="absolute right-2 flex items-center gap-1">
                        {colorSearch && (
                          <button
                            type="button"
                            onClick={() => setColorSearch("")}
                            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors rounded-md cursor-pointer"
                            title="Xóa tìm kiếm"
                          >
                            <X size={13} />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setIsColorDropdownOpen((prev) => !prev)}
                          className="p-1 text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/40 rounded-md transition-colors cursor-pointer"
                          title="Mở danh sách màu"
                        >
                          <ChevronDown
                            size={15}
                            className={`transition-transform duration-200 ${
                              isColorDropdownOpen ? "rotate-180" : ""
                            }`}
                          />
                        </button>
                      </div>
                    </div>

                    {/* DROPDOWN MENU KẾT QUẢ TÌM KIẾM */}
                    {isColorDropdownOpen && (
                      <div className="absolute left-0 right-0 top-full mt-1.5 z-40 bg-white dark:bg-slate-900 rounded-xl border border-purple-200 dark:border-purple-800 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                        {/* Danh sách các màu */}
                        <div className="max-h-60 overflow-y-auto divide-y divide-gray-100 dark:divide-slate-800 p-1">
                          {filteredDbColors.length > 0 ? (
                            filteredDbColors.map((item) => {
                              const isChosen = colorsList.includes(item.name);
                              return (
                                <div
                                  key={item._id}
                                  onClick={() => handleToggleColor(item.name)}
                                  className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-colors text-xs font-semibold group ${
                                    isChosen
                                      ? "bg-purple-100/70 dark:bg-purple-950/70 text-purple-950 dark:text-purple-200"
                                      : "hover:bg-purple-50 dark:hover:bg-slate-800 text-gray-800 dark:text-gray-200"
                                  }`}
                                >
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    <span
                                      className="w-4 h-4 rounded-full border border-black/20 shrink-0 shadow-2xs"
                                      style={{
                                        backgroundColor: item.hexCode || "#000000",
                                      }}
                                    />
                                    <span className="truncate">{item.name}</span>
                                    {item.code && (
                                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-purple-200/60 dark:bg-purple-900/60 text-purple-800 dark:text-purple-300">
                                        {item.code}
                                      </span>
                                    )}
                                  </div>

                                  <div className="shrink-0 ml-2">
                                    {isChosen ? (
                                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-700 dark:text-purple-300 bg-purple-200/80 dark:bg-purple-900/80 px-2 py-0.5 rounded-full">
                                        <Check size={12} /> Đã chọn
                                      </span>
                                    ) : (
                                      <span className="text-[11px] text-gray-400 group-hover:text-purple-600 font-medium">
                                        + Thêm
                                      </span>
                                    )}
                                  </div>
                                </div>
                              );
                            })
                          ) : (
                            <div className="p-4 text-center space-y-2">
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                Không tìm thấy màu nào khớp với <span className="font-bold">"{colorSearch}"</span>
                              </p>
                              <Button
                                type="button"
                                variant="secondary"
                                size="sm"
                                icon={<Plus size={13} />}
                                onClick={() => {
                                  setIsColorDropdownOpen(false);
                                  handleOpenCreateColorModal(colorSearch);
                                }}
                                className="text-xs py-1.5 px-3 mx-auto text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-700"
                              >
                                Tạo màu "{colorSearch}" mới
                              </Button>
                            </div>
                          )}
                        </div>

                        {/* Footer tạo màu mới */}
                        <div className="p-2 bg-gray-50 dark:bg-slate-900/90 border-t border-gray-100 dark:border-slate-800 text-center">
                          <button
                            type="button"
                            onClick={() => {
                              setIsColorDropdownOpen(false);
                              handleOpenCreateColorModal(colorSearch);
                            }}
                            className="text-xs font-bold text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300 transition-colors inline-flex items-center gap-1.5 py-1 px-2 cursor-pointer"
                          >
                            <Plus size={14} />
                            <span>Tạo thêm màu sắc mới vào hệ thống...</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    icon={<Plus size={14} />}
                    onClick={() => handleOpenCreateColorModal(colorSearch)}
                    className="text-xs py-2.5 px-3 bg-white dark:bg-slate-800 border-purple-300 dark:border-purple-700 text-purple-700 dark:text-purple-300 font-bold hover:bg-purple-50 shrink-0"
                  >
                    Tạo màu mới
                  </Button>
                </div>

                {/* Danh sách các màu đã chọn (Tags preview) */}
                {colorsList.length > 0 ? (
                  <div className="p-3.5 bg-white dark:bg-slate-800/90 rounded-xl border border-purple-200/80 dark:border-purple-900/60 space-y-2.5 shadow-2xs">
                    <span className="text-[10px] font-bold text-purple-700 dark:text-purple-300 uppercase tracking-wider">
                      Màu đã gắn cho sản phẩm ({colorsList.length}):
                    </span>
                    <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto pr-1">
                      {colorsList.map((color, idx) => {
                        const matchedDb = dbColors.find(
                          (c) =>
                            c.name.toLowerCase() === color.toLowerCase() ||
                            c.code.toLowerCase() === color.toLowerCase(),
                        );
                        return (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-purple-100 dark:bg-purple-950/80 border border-purple-300 dark:border-purple-800 text-xs font-bold text-purple-900 dark:text-purple-100 shadow-2xs"
                          >
                            {matchedDb && (
                              <span
                                className="w-3.5 h-3.5 rounded-full border border-black/20 flex-shrink-0 shadow-2xs"
                                style={{
                                  backgroundColor:
                                    matchedDb.hexCode || "#000000",
                                }}
                              />
                            )}
                            <span>{color}</span>
                            {matchedDb?.code && (
                              <span className="text-[9px] font-mono text-purple-600 dark:text-purple-400">
                                ({matchedDb.code})
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={() => handleRemoveColor(idx)}
                              className="text-purple-400 hover:text-rose-500 transition-colors p-0.5 cursor-pointer ml-1"
                              title="Bỏ màu này"
                            >
                              <X size={13} />
                            </button>
                          </span>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-white/60 dark:bg-slate-800/60 rounded-xl text-center text-xs text-gray-400 border border-dashed border-purple-200 dark:border-purple-900">
                    Chưa có màu nào
                  </div>
                )}
              </div>

              <div className="flex justify-between pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setFormTab("pricing")}
                  className="font-semibold text-xs gap-1.5"
                >
                  <ChevronLeft size={14} />
                  <span>Quay lại</span>
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setFormTab("images")}
                  className="font-semibold text-xs text-blue-600 dark:text-blue-400 gap-1.5"
                >
                  <span>Tiếp tục: Hình ảnh</span>
                  <ChevronRight size={14} />
                </Button>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 4: HÌNH ẢNH */}
          {/* ======================================================== */}
          {formTab === "images" && (
            <div className="space-y-3 animate-fade-in">
              <div className="p-3.5 bg-gray-50 dark:bg-slate-900/50 rounded-xl border border-gray-200 dark:border-slate-700 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
                    <ImageIcon size={15} className="text-blue-500" />
                    <span>Hình ảnh sản phẩm ({imagesList.length} ảnh)</span>
                  </label>

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

                {uploadError && (
                  <div className="flex items-center gap-2 p-2 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs rounded-lg animate-fade-in">
                    <AlertCircle
                      size={14}
                      className="flex-shrink-0 text-rose-500"
                    />
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
                    <span>
                      {imagesList.length > 0
                        ? "Ảnh đầu tiên là ảnh đại diện"
                        : ""}
                    </span>
                  </div>
                </div>

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
                              onError={handleImageError}
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
                                  className="p-1 bg-white/90 text-gray-800 hover:bg-blue-600 hover:text-white rounded text-[9px] font-bold shadow cursor-pointer"
                                  title="Đặt làm ảnh chính"
                                >
                                  <Star size={11} />
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => handleRemoveImage(idx)}
                                className="p-1 bg-rose-600 text-white hover:bg-rose-700 rounded shadow cursor-pointer"
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

              <div className="flex justify-between pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setFormTab("variants")}
                  className="font-semibold text-xs gap-1.5"
                >
                  <ChevronLeft size={14} />
                  <span>Quay lại</span>
                </Button>
              </div>
            </div>
          )}

          {/* CỐ ĐỊNH NÚT SUBMIT FOOTER */}
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
              className="font-bold shadow-xs px-4"
            >
              {modalMode === "create" ? "THÊM SẢN PHẨM" : "LƯU THAY ĐỔI"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ======================================================== */}
      {/* MODAL THÊM KÍCH CỠ (SIZE) VÀO SẢN PHẨM */}
      {/* ======================================================== */}
      <Modal
        isOpen={isAddSizeModalOpen}
        onClose={() => setIsAddSizeModalOpen(false)}
        title="Thêm Kích Cỡ (Size)"
        size="md"
      >
        <div className="space-y-4">
          {/* Chọn size từ hệ thống */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                <Layers
                  size={15}
                  className="text-indigo-600 dark:text-indigo-400"
                />
                <span>Chọn kích cỡ có sẵn từ hệ thống:</span>
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSelectAllAvailableSizes}
                  className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline font-bold cursor-pointer"
                >
                  Chọn tất cả
                </button>
                <span className="text-gray-300 dark:text-slate-600">|</span>
                <button
                  type="button"
                  onClick={() => setSelectedModalSizes([])}
                  className="text-[11px] text-gray-500 hover:underline font-semibold cursor-pointer"
                >
                  Bỏ chọn
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 p-3 bg-gray-50 dark:bg-slate-800/60 rounded-xl border border-gray-200 dark:border-slate-700 max-h-48 overflow-y-auto">
              {dbSizes.length === 0 ? (
                <p className="text-xs text-gray-400 italic">
                  Chưa có danh mục kích cỡ nào trong hệ thống.
                </p>
              ) : (
                dbSizes.map((sz) => {
                  const alreadyInProduct = sizesList.some(
                    (s) => s.name === sz.name,
                  );
                  const isSelected = selectedModalSizes.includes(sz.name);

                  return (
                    <button
                      key={sz._id}
                      type="button"
                      disabled={alreadyInProduct}
                      onClick={() => handleToggleModalSize(sz.name)}
                      className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-all flex items-center gap-1.5 cursor-pointer ${
                        alreadyInProduct
                          ? "bg-gray-100 dark:bg-slate-800/80 text-gray-400 dark:text-slate-500 border-gray-200 dark:border-slate-700 cursor-not-allowed opacity-75"
                          : isSelected
                            ? "bg-indigo-600 text-white border-indigo-600 shadow-xs ring-2 ring-indigo-500/40"
                            : "bg-white dark:bg-slate-900 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-slate-600 hover:border-indigo-400 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30"
                      }`}
                    >
                      {alreadyInProduct ? (
                        <Check size={13} className="text-gray-400" />
                      ) : isSelected ? (
                        <Check size={13} className="text-white" />
                      ) : null}
                      <span>{sz.name}</span>
                      {alreadyInProduct && (
                        <span className="text-[10px] font-normal text-gray-400 dark:text-slate-500">
                          (Đã có)
                        </span>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Nhập kích cỡ tùy chỉnh / mới */}
          <div className="p-3 bg-blue-50/80 dark:bg-blue-950/30 rounded-xl border border-blue-200/80 dark:border-blue-900/50 space-y-2">
            <label className="text-xs font-bold text-blue-900 dark:text-blue-300 flex items-center gap-1.5">
              <Plus size={14} className="text-blue-600 dark:text-blue-400" />
              <span>Kích thước mới: </span>
            </label>
            <input
              type="text"
              value={customModalSizeName}
              onChange={(e) => setCustomModalSizeName(e.target.value)}
              placeholder="VD: 3XL, 4XL, 128GB, 512GB, Size 34..."
              className="w-full text-xs px-3 py-2 rounded-lg border border-blue-300 dark:border-blue-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            />
          </div>

          {/* Giá bán cho size (chỉ áp dụng cho bán lẻ) */}
          {productType === "single" && (
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                Giá bán áp dụng cho các size thêm mới (VNĐ):
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={modalSizePrice === "" ? "" : modalSizePrice}
                  onChange={(e) =>
                    setModalSizePrice(
                      e.target.value === "" ? "" : Number(e.target.value),
                    )
                  }
                  placeholder="0"
                  className="w-full text-xs font-bold pr-10 pl-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400 dark:text-slate-500 pointer-events-none">
                  VNĐ
                </span>
              </div>
            </div>
          )}

          {modalSizeError && (
            <div className="p-2.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs rounded-lg flex items-center gap-1.5 animate-fade-in">
              <AlertCircle size={14} className="flex-shrink-0 text-rose-500" />
              <span className="font-medium">{modalSizeError}</span>
            </div>
          )}

          {/* Footer modal buttons */}
          <div className="flex justify-end gap-2 pt-2 border-t border-gray-100 dark:border-slate-800">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setIsAddSizeModalOpen(false)}
            >
              Hủy
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handleConfirmAddSizes}
              className="font-bold shadow-xs px-4 bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {selectedModalSizes.length +
                (customModalSizeName.trim() ? 1 : 0) >
              0
                ? `Thêm (${selectedModalSizes.length + (customModalSizeName.trim() ? 1 : 0)}) size`
                : "Thêm vào sản phẩm"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ======================================================== */}
      {/* MODAL TẠO MÀU SẮC MỚI VÀO HỆ THỐNG */}
      {/* ======================================================== */}
      <Modal
        isOpen={isCreateColorModalOpen}
        onClose={() => setIsCreateColorModalOpen(false)}
        title="Tạo Màu Sắc Mới"
        size="md"
      >
        <form onSubmit={handleCreateNewColor} className="space-y-4">
          {/* Preview trực quan màu sắc */}
          <div className="flex items-center gap-3.5 p-3.5 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/30 dark:to-indigo-950/30 rounded-2xl border border-purple-200/80 dark:border-purple-800/50">
            <div
              className="w-14 h-14 rounded-2xl border-2 border-white dark:border-slate-800 shadow-md flex-shrink-0 flex items-center justify-center transition-all duration-300"
              style={{ backgroundColor: newCustomColorHex || "#000000" }}
            >
              <Palette
                size={22}
                className={
                  ["#FFFFFF", "#FFFF00", "#F5F5DC"].includes(
                    newCustomColorHex.toUpperCase(),
                  )
                    ? "text-gray-800"
                    : "text-white drop-shadow-sm"
                }
              />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-[11px] font-mono font-extrabold px-2 py-0.5 rounded-md bg-purple-100 dark:bg-purple-900/60 text-purple-800 dark:text-purple-300">
                  {newCustomColorCode || `M${dbColors.length + 1}`}
                </span>
                <span className="text-xs font-mono font-bold text-gray-500 dark:text-slate-400">
                  {newCustomColorHex || "#000000"}
                </span>
              </div>
              <div className="font-extrabold text-sm text-gray-900 dark:text-white truncate">
                {newCustomColorName.trim() || "Tên màu hiển thị"}
              </div>
            </div>
          </div>

          {/* Nhập Tên màu & Mã ký hiệu */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-700 dark:text-slate-300">
                Tên màu <span className="text-rose-500">*</span>
              </label>
              <Input
                type="text"
                placeholder="VD: Xám Titan, Hồng Pastel, Voi..."
                value={newCustomColorName}
                onChange={(e) => setNewCustomColorName(e.target.value)}
                autoFocus
                required
                className="rounded-xl text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-700 dark:text-slate-300">
                Mã ký hiệu (Code)
              </label>
              <Input
                type="text"
                placeholder={`VD: M${dbColors.length + 1}, TITAN, HONG...`}
                value={newCustomColorCode}
                onChange={(e) =>
                  setNewCustomColorCode(e.target.value.toUpperCase())
                }
                className="rounded-xl text-xs uppercase font-mono font-bold"
              />
            </div>
          </div>

          {/* Chọn mã màu HEX & Native Color Picker */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-gray-700 dark:text-slate-300">
              Mã màu HEX & Bảng chọn màu
            </label>
            <div className="flex items-center gap-2.5">
              <div className="relative w-10 h-10 rounded-xl overflow-hidden border border-gray-300 dark:border-slate-600 shadow-2xs flex-shrink-0 cursor-pointer">
                <input
                  type="color"
                  value={
                    newCustomColorHex.startsWith("#")
                      ? newCustomColorHex
                      : "#000000"
                  }
                  onChange={(e) =>
                    setNewCustomColorHex(e.target.value.toUpperCase())
                  }
                  className="absolute -top-2 -left-2 w-14 h-14 cursor-pointer opacity-100"
                  title="Chọn màu trực quan"
                />
              </div>

              <Input
                type="text"
                placeholder="#000000"
                value={newCustomColorHex}
                onChange={(e) =>
                  setNewCustomColorHex(e.target.value.toUpperCase())
                }
                className="flex-1 font-mono font-bold uppercase rounded-xl text-xs"
                maxLength={7}
              />
            </div>
          </div>

          {/* Bảng màu mẫu chọn nhanh */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold text-gray-500 dark:text-slate-400">
              Gợi ý màu thông dụng:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {[
                { name: "Đen", hex: "#000000" },
                { name: "Trắng", hex: "#FFFFFF" },
                { name: "Đỏ", hex: "#EF4444" },
                { name: "Xanh dương", hex: "#3B82F6" },
                { name: "Xanh Navy", hex: "#1E3A8A" },
                { name: "Xanh lá", hex: "#10B981" },
                { name: "Vàng", hex: "#F59E0B" },
                { name: "Cam", hex: "#F97316" },
                { name: "Tím", hex: "#8B5CF6" },
                { name: "Hồng", hex: "#EC4899" },
                { name: "Xám", hex: "#6B7280" },
                { name: "Nâu", hex: "#78350F" },
                { name: "Be / Kem", hex: "#F5F5DC" },
              ].map((c) => (
                <button
                  key={c.name}
                  type="button"
                  onClick={() => {
                    setNewCustomColorHex(c.hex);
                    if (!newCustomColorName.trim()) {
                      setNewCustomColorName(c.name);
                    }
                  }}
                  className="px-2 py-1 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-purple-400 dark:hover:border-purple-600 flex items-center gap-1.5 text-[11px] font-medium transition-colors cursor-pointer"
                >
                  <span
                    className="w-3 h-3 rounded-full border border-black/10 shrink-0"
                    style={{ backgroundColor: c.hex }}
                  />
                  <span>{c.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Checkbox tự động gán vào sản phẩm */}
          <div className="pt-1">
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={colorModalAutoAssign}
                onChange={(e) => setColorModalAutoAssign(e.target.checked)}
                className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 border-gray-300"
              />
              <span className="text-xs font-semibold text-gray-800 dark:text-gray-200">
                Tự động gắn màu này vào sản phẩm ngay sau khi tạo
              </span>
            </label>
          </div>

          {/* Lỗi nếu có */}
          {colorModalError && (
            <div className="p-2.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs rounded-lg flex items-center gap-1.5 animate-fade-in">
              <AlertCircle size={14} className="flex-shrink-0 text-rose-500" />
              <span className="font-medium">{colorModalError}</span>
            </div>
          )}

          {/* Modal Footer Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100 dark:border-slate-800">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setIsCreateColorModalOpen(false)}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={colorModalLoading || !newCustomColorName.trim()}
              isLoading={colorModalLoading}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              Tạo & Lưu Màu
            </Button>
          </div>
        </form>
      </Modal>

      {/* ======================================================== */}
      {/* MODAL XEM CHI TIẾT SẢN PHẨM */}
      {/* ======================================================== */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title="Chi Tiết Sản Phẩm"
        size="3xl"
      >
        {viewingProduct && (
          <div className="space-y-4 text-xs max-h-[80vh] overflow-y-auto pr-1">
            {/* Header: Tên SP + Mã + Trạng thái + Loại hình */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/70 rounded-2xl border border-gray-100 dark:border-slate-700/80 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded-md font-extrabold text-[10px] ${
                      Array.isArray(viewingProduct.sellingOptions) &&
                      viewingProduct.sellingOptions.length > 0
                        ? "bg-teal-100 dark:bg-teal-900/60 text-teal-800 dark:text-teal-300 border border-teal-300 dark:border-teal-700"
                        : "bg-indigo-100 dark:bg-indigo-900/60 text-indigo-800 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-700"
                    }`}
                  >
                    {Array.isArray(viewingProduct.sellingOptions) &&
                    viewingProduct.sellingOptions.length > 0
                      ? "📦 Bán theo Set / Combo"
                      : "👕 Bán đơn lẻ"}
                  </span>

                  <span
                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                      viewingProduct.status === "active"
                        ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800"
                        : "bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300 border border-gray-300 dark:border-slate-600"
                    }`}
                  >
                    {viewingProduct.status === "active" ? "● Đang bán" : "○ Tạm ẩn"}
                  </span>

                  {viewingProduct.isPinned && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700 shadow-2xs">
                      <Pin size={10} className="fill-amber-500 text-amber-600" />
                      <span>Đang ghim đầu</span>
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5 text-gray-500 dark:text-slate-400 text-[11px] font-mono font-bold bg-white dark:bg-slate-900 px-2 py-1 rounded-lg border border-gray-200 dark:border-slate-700">
                  <span>Mã:</span>
                  <span className="text-blue-600 dark:text-blue-400">{viewingProduct.code}</span>
                </div>
              </div>

              <h3 className="text-base sm:text-lg font-black text-gray-900 dark:text-white leading-snug">
                {viewingProduct.name}
              </h3>
            </div>

            {/* Layout thông tin chính: Hình ảnh & Thuộc tính cơ bản */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-start">
              {/* Cột trái (5 cols): Thư viện hình ảnh */}
              <div className="sm:col-span-5 space-y-2">
                <div className="aspect-square w-full rounded-2xl overflow-hidden border border-gray-200 dark:border-slate-700 bg-gray-100 dark:bg-slate-900 flex items-center justify-center relative shadow-xs">
                  {activePreviewImage || viewingProduct.images?.[0] ? (
                    <img
                      src={getImageUrl(activePreviewImage || viewingProduct.images?.[0])}
                      alt={viewingProduct.name}
                      onError={handleImageError}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-gray-400 text-center space-y-1">
                      <ImageIcon size={32} className="mx-auto text-gray-300" />
                      <p className="text-[11px]">Chưa có hình ảnh</p>
                    </div>
                  )}
                </div>

                {/* Danh sách ảnh thumbnails */}
                {Array.isArray(viewingProduct.images) && viewingProduct.images.length > 1 && (
                  <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
                    {viewingProduct.images.map((imgUrl, imgIdx) => {
                      const isCurrent = (activePreviewImage || viewingProduct.images[0]) === imgUrl;
                      return (
                        <button
                          key={imgIdx}
                          type="button"
                          onClick={() => setActivePreviewImage(imgUrl)}
                          className={`w-12 h-12 rounded-lg overflow-hidden border-2 flex-shrink-0 transition-all cursor-pointer ${
                            isCurrent
                              ? "border-blue-500 ring-2 ring-blue-500/20 shadow-xs"
                              : "border-gray-200 dark:border-slate-700 opacity-70 hover:opacity-100"
                          }`}
                        >
                          <img
                            src={getImageUrl(imgUrl)}
                            alt={`Thumbnail ${imgIdx + 1}`}
                            onError={handleImageError}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Cột phải (7 cols): Bảng thông tin giá & phân loại */}
              <div className="sm:col-span-7 space-y-3">
                {/* Giá bán & Đã bán */}
                <div className="p-3 bg-rose-50/50 dark:bg-rose-950/20 rounded-xl border border-rose-100 dark:border-rose-900/40 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-gray-500 dark:text-slate-400 block font-semibold">
                      Giá niêm yết chuẩn
                    </span>
                    <span className="text-lg sm:text-xl font-black text-rose-600 dark:text-rose-400">
                      {formatCurrency(viewingProduct.price || 0)}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-gray-500 dark:text-slate-400 block font-semibold">
                      Đã bán
                    </span>
                    <span className="text-sm font-extrabold text-gray-800 dark:text-slate-200">
                      {viewingProduct.soldCount || 0} sản phẩm
                    </span>
                  </div>
                </div>

                {/* Phân loại danh mục */}
                <div className="grid grid-cols-2 gap-2 p-3 bg-gray-50/70 dark:bg-slate-800/50 rounded-xl border border-gray-100 dark:border-slate-700">
                  <div>
                    <span className="text-[10px] text-gray-400 dark:text-slate-400 block font-medium">
                      Thể loại chính
                    </span>
                    <span className="font-bold text-gray-900 dark:text-white">
                      {typeof viewingProduct.category === "object"
                        ? viewingProduct.category?.name
                        : "Chưa phân loại"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 dark:text-slate-400 block font-medium">
                      Thể loại con / Nhóm
                    </span>
                    <span className="font-bold text-gray-900 dark:text-white">
                      {viewingProduct.subcategory || "—"}
                    </span>
                  </div>
                </div>

                {/* Danh sách Màu sắc */}
                {Array.isArray(viewingProduct.colors) && viewingProduct.colors.length > 0 && (
                  <div className="p-3 bg-purple-50/40 dark:bg-purple-950/20 rounded-xl border border-purple-100 dark:border-purple-900/40 space-y-1.5">
                    <span className="text-[11px] font-bold text-purple-900 dark:text-purple-300 flex items-center gap-1">
                      <Palette size={13} />
                      <span>Màu sắc ({viewingProduct.colors.length} màu):</span>
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {viewingProduct.colors.map((c, cIdx) => (
                        <span
                          key={cIdx}
                          className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 font-bold text-[11px] shadow-2xs"
                        >
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Cấu hình món trong Set (nếu có) */}
            {Array.isArray(viewingProduct.sellingOptions) && viewingProduct.sellingOptions.length > 0 && (
              <div className="p-3.5 bg-teal-50/50 dark:bg-teal-950/20 rounded-2xl border border-teal-200/80 dark:border-teal-900/60 space-y-2.5">
                <div className="flex items-center gap-1.5 text-teal-900 dark:text-teal-300 font-bold text-xs">
                  <Boxes size={15} />
                  <span>Các món cấu thành trong Set ({viewingProduct.sellingOptions.length} món):</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {viewingProduct.sellingOptions.map((opt, optIdx) => (
                    <div
                      key={optIdx}
                      className="p-2 bg-white dark:bg-slate-800/90 rounded-xl border border-teal-200 dark:border-teal-800/60 shadow-2xs space-y-0.5"
                    >
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-gray-900 dark:text-white truncate">
                          {opt.name}
                        </span>
                        {optIdx === 0 && (
                          <span className="text-[9px] px-1 py-0.2 bg-amber-500 text-white rounded font-extrabold flex-shrink-0">
                            ★ Set
                          </span>
                        )}
                      </div>
                      <span className="text-rose-600 dark:text-rose-400 font-black text-xs block">
                        {formatCurrency(opt.price || 0)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Bảng Kích cỡ & Ma trận giá theo Size */}
            {Array.isArray(viewingProduct.sizes) && viewingProduct.sizes.length > 0 && (
              <div className="p-3.5 bg-indigo-50/50 dark:bg-indigo-950/20 rounded-2xl border border-indigo-200/80 dark:border-indigo-900/60 space-y-2">
                <div className="flex items-center gap-1.5 text-indigo-900 dark:text-indigo-300 font-bold text-xs">
                  <Layers size={15} />
                  <span>Bảng Size & Ma trận giá ({viewingProduct.sizes.length} size):</span>
                </div>

                <div className="overflow-x-auto rounded-xl border border-indigo-200/80 dark:border-indigo-900/60">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-indigo-100/70 dark:bg-slate-800 text-gray-700 dark:text-slate-200 text-[11px] font-bold">
                      <tr>
                        <th className="p-2 border-b border-indigo-200 dark:border-indigo-900/60">Size</th>
                        {Array.isArray(viewingProduct.sellingOptions) &&
                        viewingProduct.sellingOptions.length > 0 ? (
                          viewingProduct.sellingOptions.map((opt, oIdx) => (
                            <th
                              key={oIdx}
                              className="p-2 border-b border-indigo-200 dark:border-indigo-900/60 text-right"
                            >
                              {opt.name}
                            </th>
                          ))
                        ) : (
                          <th className="p-2 border-b border-indigo-200 dark:border-indigo-900/60 text-right">
                            Giá bán
                          </th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-slate-800 bg-white dark:bg-slate-900/90">
                      {viewingProduct.sizes.map((s, sIdx) => (
                        <tr key={sIdx} className="hover:bg-indigo-50/30 dark:hover:bg-slate-800/50">
                          <td className="p-2 font-bold text-gray-900 dark:text-white">
                            {s.name}
                          </td>
                          {Array.isArray(viewingProduct.sellingOptions) &&
                          viewingProduct.sellingOptions.length > 0 ? (
                            viewingProduct.sellingOptions.map((opt, oIdx) => {
                              const pVal =
                                s.optionPrices && s.optionPrices[opt.name] !== undefined
                                  ? s.optionPrices[opt.name]
                                  : opt.price || 0;
                              return (
                                <td
                                  key={oIdx}
                                  className="p-2 font-bold text-teal-600 dark:text-teal-400 text-right"
                                >
                                  {formatCurrency(pVal)}
                                </td>
                              );
                            })
                          ) : (
                            <td className="p-2 font-bold text-blue-600 dark:text-blue-400 text-right">
                              {formatCurrency(s.price > 0 ? s.price : viewingProduct.price || 0)}
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Mô tả sản phẩm */}
            {viewingProduct.description && (
              <div className="p-3 bg-gray-50/70 dark:bg-slate-800/50 rounded-xl border border-gray-100 dark:border-slate-700 space-y-1">
                <span className="text-[11px] font-bold text-gray-700 dark:text-slate-300">
                  Mô tả sản phẩm:
                </span>
                <p className="text-gray-600 dark:text-slate-400 leading-relaxed whitespace-pre-line text-[11px]">
                  {viewingProduct.description}
                </p>
              </div>
            )}

            {/* Footer Modal Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-slate-800">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setIsDetailModalOpen(false)}
                className="font-semibold text-xs px-4"
              >
                Đóng
              </Button>

              <Button
                type="button"
                variant="primary"
                size="sm"
                icon={<Edit2 size={13} />}
                onClick={() => {
                  setIsDetailModalOpen(false);
                  openEditModal(viewingProduct);
                }}
                className="font-bold shadow-xs px-4 text-xs"
              >
                Chỉnh sửa sản phẩm
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
