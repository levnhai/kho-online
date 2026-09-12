import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  Search,
  ShoppingCart,
  User as UserIcon,
  LogOut,
  LayoutDashboard,
  Package,
  ChevronDown,
  ShoppingBag,
  Menu,
  X,
  Layers,
  Palette,
  Sun,
  Moon,
} from "lucide-react";
import { useAuth } from "@/app/providers/AuthContext";
import { useCart } from "@/entities/cart/CartContext";
import { useTheme } from "@/app/providers/ThemeContext";
import { categoryApi } from "@/entities/category/api/categoryApi";
import { Category } from "@/shared/types";
import { ThemeToggle } from "@/shared/ui/ThemeToggle";
import { getSubcategories } from "@/entities/category/lib/subcategories";

export const Header: React.FC = () => {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const { totalCount } = useCart();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const [categories, setCategories] = useState<Category[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(true);
  const [themeMenuOpen, setThemeMenuOpen] = useState(true);
  const [expandedCategories, setExpandedCategories] = useState<
    Record<string, boolean>
  >({});

  const toggleCategoryExpand = (catId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setExpandedCategories((prev) => ({
      ...prev,
      [catId]: !prev[catId],
    }));
  };

  useEffect(() => {
    categoryApi
      .getAll()
      .then((data) => setCategories(data))
      .catch(() => {});
  }, []);

  // Khóa scroll khi mở Mobile Drawer
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  // Đóng mobile menu khi chuyển trang
  useEffect(() => {
    setMobileMenuOpen(false);
    setMobileSearchOpen(false);
  }, [location.pathname, location.search]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchTerm.trim())}`);
      setMobileSearchOpen(false);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-gray-200/80 dark:border-slate-800 shadow-xs transition-colors pt-[env(safe-area-inset-top,0px)]">
      {/* Main Top Header */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-2 sm:gap-6">
          {/* Logo CHANG */}
          <Link to="/" className="flex items-center gap-2.5 group flex-shrink-0">
            <div className="relative">
              {/* Subtle ambient glow on hover */}
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-400 rounded-2xl blur-xs opacity-40 group-hover:opacity-100 group-hover:blur-sm transition-all duration-300" />
              <div className="relative w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 flex items-center justify-center text-white font-extrabold shadow-md shadow-blue-500/30 ring-2 ring-white/20 dark:ring-white/10 group-hover:scale-105 transition-all duration-300">
                <ShoppingBag size={22} className="drop-shadow-sm group-hover:rotate-6 transition-transform duration-300" />
              </div>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-xl sm:text-2xl font-black tracking-wider bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 dark:from-blue-400 dark:via-indigo-300 dark:to-cyan-300 bg-clip-text text-transparent">
                  CHANG
                </span>
                <span className="hidden sm:inline-block px-1.5 py-0.2 rounded-md text-[9px] font-black uppercase tracking-wider bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                  STORE
                </span>
              </div>
              <span className="hidden sm:inline text-[10px] font-bold text-gray-400 dark:text-slate-400 -mt-0.5 tracking-widest uppercase">
                Online Store
              </span>
            </div>
          </Link>

          {/* Search Box - Desktop */}
          <form
            onSubmit={handleSearch}
            className="hidden md:flex flex-1 max-w-xl lg:max-w-2xl relative"
          >
            <div className="relative flex items-center w-full">
              <input
                type="text"
                placeholder="Tìm sản phẩm theo tên, mã SP (iPhone, Laptop...)"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-24 py-2 bg-gray-50 dark:bg-slate-800 hover:bg-gray-100/80 dark:hover:bg-slate-700/60 focus:bg-white dark:focus:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-full text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-400 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 shadow-inner"
              />
              <Search
                size={18}
                className="absolute left-4 text-gray-400 dark:text-slate-400 pointer-events-none"
              />
              <button
                type="submit"
                className="absolute right-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-full transition-all shadow-sm active:scale-95"
              >
                Tìm kiếm
              </button>
            </div>
          </form>

          {/* Right Actions: Mobile (Search -> Cart -> Icon bar) | Desktop (Theme -> Cart -> Auth) */}
          <div className="flex items-center gap-1 sm:gap-3 flex-shrink-0">
            {/* 1. Mobile Search Toggle Icon */}
            <button
              onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
              className="md:hidden p-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-xl transition-colors"
              title="Tìm kiếm"
            >
              <Search size={20} />
            </button>

            {/* Dark Mode Toggle Button (Desktop) */}
            <div className="hidden md:flex items-center">
              <ThemeToggle />
            </div>

            {/* 2. Cart Button */}
            <Link
              to="/cart"
              className="relative p-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-xl transition-all flex items-center gap-1.5 group"
              title="Giỏ hàng"
            >
              <div className="relative">
                <ShoppingCart
                  size={22}
                  className="group-hover:scale-110 transition-transform"
                />
                {totalCount > 0 && (
                  <span className="absolute -top-2 -right-2.5 bg-rose-500 text-white text-[10px] font-bold h-4.5 w-4.5 rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900 shadow-sm animate-pulse">
                    {totalCount > 99 ? "99+" : totalCount}
                  </span>
                )}
              </div>
              <span className="hidden sm:inline text-xs font-semibold text-gray-700 dark:text-gray-300">
                Giỏ hàng
              </span>
            </Link>

            {/* Auth Dropdown (Desktop only) */}
            <div className="hidden md:block relative">
              {isAuthenticated ? (
                <div>
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-1.5 py-1 px-2 sm:px-2.5 rounded-xl border border-gray-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-slate-600 hover:bg-blue-50/50 dark:hover:bg-slate-800 transition-all"
                  >
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold text-xs sm:text-sm">
                      {user?.name ? user.name[0].toUpperCase() : "U"}
                    </div>
                    <div className="hidden lg:flex flex-col text-left">
                      <span className="text-xs font-bold text-gray-900 dark:text-gray-100 line-clamp-1 max-w-[90px]">
                        {user?.name}
                      </span>
                    </div>
                    <ChevronDown size={14} className="text-gray-400" />
                  </button>

                  {/* Dropdown Menu */}
                  {showUserMenu && (
                    <div
                      className="absolute right-0 mt-2 w-52 sm:w-56 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-gray-100 dark:border-slate-700 py-2 z-50 animate-scale-up"
                      onMouseLeave={() => setShowUserMenu(false)}
                    >
                      <div className="px-4 py-2 border-b border-gray-100 dark:border-slate-700">
                        <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                          {user?.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-slate-400 truncate">
                          {user?.email}
                        </p>
                      </div>

                      {isAdmin && (
                        <Link
                          to="/admin"
                          onClick={() => setShowUserMenu(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-xs sm:text-sm text-blue-600 dark:text-blue-400 font-semibold hover:bg-blue-50 dark:hover:bg-slate-700/60 transition-colors"
                        >
                          <LayoutDashboard size={16} />
                          Trang Quản trị (Admin)
                        </Link>
                      )}

                      <Link
                        to="/account"
                        onClick={() => setShowUserMenu(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-xs sm:text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700/60 transition-colors"
                      >
                        <UserIcon size={16} />
                        Tài khoản của tôi
                      </Link>

                      <Link
                        to="/account?tab=orders"
                        onClick={() => setShowUserMenu(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-xs sm:text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700/60 transition-colors"
                      >
                        <Package size={16} />
                        Đơn hàng của tôi
                      </Link>

                      <div className="border-t border-gray-100 dark:border-slate-700 my-1" />

                      <button
                        onClick={() => {
                          logout();
                          setShowUserMenu(false);
                          navigate("/");
                        }}
                        className="w-full flex items-center gap-2.5 px-4 py-2 text-xs sm:text-sm text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors text-left"
                      >
                        <LogOut size={16} />
                        Đăng xuất
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-1 sm:gap-2">
                  <Link
                    to="/login"
                    className="px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  >
                    Đăng nhập
                  </Link>
                  <Link
                    to="/register"
                    className="px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-sm"
                  >
                    Đăng ký
                  </Link>
                </div>
              )}
            </div>

            {/* 3. Mobile Menu Hamburger Button (Icon bar) */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-xl transition-colors"
              aria-label="Menu"
              title="Menu"
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile Search Bar Dropdown */}
        {mobileSearchOpen && (
          <form
            onSubmit={handleSearch}
            className="md:hidden pb-3 pt-1 animate-fade-in"
          >
            <div className="relative flex items-center">
              <input
                type="text"
                placeholder="Tìm sản phẩm, mã SP..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                autoFocus
                className="w-full pl-10 pr-20 py-2 bg-gray-100 dark:bg-slate-800 text-gray-900 dark:text-white rounded-full text-xs border border-gray-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Search size={16} className="absolute left-3.5 text-gray-400" />
              <button
                type="submit"
                className="absolute right-1 px-3 py-1 bg-blue-600 text-white text-[11px] font-bold rounded-full"
              >
                Tìm
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Secondary Navigation Menu Bar (Trang chủ | Sản phẩm) - Căn giữa & Tăng chiều cao */}
      <nav className="border-t border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-900 transition-colors">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 relative">
          <div className="flex items-center justify-center h-12 sm:h-14 text-sm sm:text-base font-semibold">
            {/* Main Links - Căn giữa trung tâm */}
            <div className="flex items-center gap-8 sm:gap-12 whitespace-nowrap">
              <Link
                to="/"
                className={`py-3 transition-colors relative ${
                  location.pathname === "/"
                    ? "text-blue-600 dark:text-blue-400 font-bold"
                    : "text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium"
                }`}
              >
                <span>Trang chủ</span>
                {location.pathname === "/" && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400 rounded-full" />
                )}
              </Link>

              <Link
                to="/products"
                className={`py-3 transition-colors relative ${
                  location.pathname === "/products"
                    ? "text-blue-600 dark:text-blue-400 font-bold"
                    : "text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium"
                }`}
              >
                <span>Sản phẩm</span>
                {location.pathname === "/products" && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400 rounded-full" />
                )}
              </Link>
            </div>

            {/* Right Tagline Hotline (nằm góc phải, không ảnh hưởng căn giữa) */}
            <div className="hidden lg:flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 absolute right-4 sm:right-6 lg:right-8">
              <span>
                Hotline:{" "}
                <strong className="text-blue-600 dark:text-blue-400">
                  0865854741
                </strong>
              </span>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Drawer Navigation Menu - Dùng createPortal gắn vào document.body tránh bị đè bởi backdrop-filter hoặc stacking context */}
      {mobileMenuOpen &&
        createPortal(
          <div className="fixed inset-0 z-[99999] md:hidden flex justify-end">
            {/* Backdrop mờ phủ kín toàn bộ trang web */}
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity animate-fade-in"
              onClick={() => setMobileMenuOpen(false)}
            />

            {/* Drawer Content - Cố định 100% height, ẩn thanh scroll */}
            <div className="relative w-4/5 max-w-xs bg-white dark:bg-slate-900 text-gray-900 dark:text-white h-[100dvh] max-h-[100dvh] shadow-[0_0_50px_rgba(0,0,0,0.5)] dark:shadow-[0_0_60px_rgba(0,0,0,0.9)] flex flex-col z-10 overflow-hidden animate-slide-left border-l border-gray-200 dark:border-slate-800 pt-[env(safe-area-inset-top,0px)] pb-[env(safe-area-inset-bottom,0px)]">
              {/* Drawer Header */}
              <div className="p-4 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="relative w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 flex items-center justify-center text-white font-bold shadow-md shadow-blue-500/30 ring-2 ring-white/20">
                    <ShoppingBag size={18} />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-black text-lg bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 dark:from-blue-400 dark:via-indigo-300 dark:to-cyan-300 bg-clip-text text-transparent">
                      CHANG ONLINE
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Vùng nội dung cuộn bên trong - ẩn thanh scroll hoàn toàn */}
              <div className="flex-1 overflow-y-auto no-scrollbar flex flex-col">
                <nav className="p-4 space-y-3 flex-1">
                  {/* 1. Card TÀI KHOẢN / USER - Bố cục đồng nhất dạng card rounded-2xl */}
                  <div className="rounded-2xl border border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/30 overflow-hidden">
                    {isAuthenticated ? (
                      <div>
                        {/* User Header */}
                        <div className="p-3.5 flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-sm flex-shrink-0">
                            {user?.name ? user.name[0].toUpperCase() : "U"}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-gray-900 dark:text-white truncate">
                              {user?.name}
                            </p>
                            <p className="text-[11px] text-gray-500 dark:text-slate-400 truncate">
                              {user?.email}
                            </p>
                          </div>
                        </div>

                        {/* User Navigation Links */}
                        <div className="border-t border-gray-100 dark:border-slate-800/80 px-2 py-1.5 space-y-0.5">
                          {isAdmin && (
                            <Link
                              to="/admin"
                              onClick={() => setMobileMenuOpen(false)}
                              className="flex items-center gap-2.5 px-3 py-2 text-xs text-blue-600 dark:text-blue-400 font-semibold rounded-xl hover:bg-white dark:hover:bg-slate-800 hover:shadow-xs transition-all"
                            >
                              <LayoutDashboard size={15} />
                              <span>Trang Quản trị (Admin)</span>
                            </Link>
                          )}
                          <Link
                            to="/account"
                            onClick={() => setMobileMenuOpen(false)}
                            className="flex items-center gap-2.5 px-3 py-2 text-xs text-gray-700 dark:text-gray-300 font-medium rounded-xl hover:bg-white dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-blue-400 hover:shadow-xs transition-all"
                          >
                            <UserIcon size={15} />
                            <span>Tài khoản của tôi</span>
                          </Link>
                          <Link
                            to="/account?tab=orders"
                            onClick={() => setMobileMenuOpen(false)}
                            className="flex items-center gap-2.5 px-3 py-2 text-xs text-gray-700 dark:text-gray-300 font-medium rounded-xl hover:bg-white dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-blue-400 hover:shadow-xs transition-all"
                          >
                            <Package size={15} />
                            <span>Đơn hàng của tôi</span>
                          </Link>
                        </div>
                      </div>
                    ) : (
                      <div className="p-3.5">
                        <div className="flex items-center gap-2 mb-2.5 px-1 text-xs font-bold text-gray-700 dark:text-slate-200 uppercase tracking-wider">
                          <UserIcon
                            size={16}
                            className="text-blue-600 dark:text-blue-400"
                          />
                          <span>TÀI KHOẢN</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <Link
                            to="/login"
                            onClick={() => setMobileMenuOpen(false)}
                            className="text-center py-2 px-3 text-xs font-semibold text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-slate-700 rounded-xl hover:bg-white dark:hover:bg-slate-800 transition-colors"
                          >
                            Đăng nhập
                          </Link>
                          <Link
                            to="/register"
                            onClick={() => setMobileMenuOpen(false)}
                            className="text-center py-2 px-3 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-sm"
                          >
                            Đăng ký
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 2. DANH MỤC SẢN PHẨM - Có thể đóng mở */}
                  <div className="rounded-2xl border border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/30 overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setCategoriesOpen(!categoriesOpen)}
                      className="w-full flex items-center justify-between p-3 text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <Layers
                          size={16}
                          className="text-blue-600 dark:text-blue-400"
                        />
                        <span>Danh mục sản phẩm</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-normal text-gray-400">
                          ({categories.length})
                        </span>
                        <ChevronDown
                          size={16}
                          className={`text-gray-400 transition-transform duration-200 ${
                            categoriesOpen ? "rotate-180" : ""
                          }`}
                        />
                      </div>
                    </button>

                    {categoriesOpen && (
                      <div className="border-t border-gray-100 dark:border-slate-800/80 px-2 py-1.5 space-y-1 animate-fade-in">
                        {categories.map((cat) => {
                          const subs = getSubcategories(cat);
                          const isExpanded = !!expandedCategories[cat._id];
                          const hasSubs = subs && subs.length > 0;

                          return (
                            <div
                              key={cat._id}
                              className="rounded-xl overflow-hidden"
                            >
                              {/* Dòng thể loại cha */}
                              <div className="flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-white dark:hover:bg-slate-800 transition-colors group">
                                <Link
                                  to={`/products?category=${cat._id}`}
                                  onClick={() => setMobileMenuOpen(false)}
                                  className="flex-1 flex items-center justify-between pr-1 hover:text-blue-600 dark:hover:text-blue-400 truncate"
                                >
                                  <span className="truncate">{cat.name}</span>
                                  {cat.productCount !== undefined && (
                                    <span className="text-[10px] text-gray-400 dark:text-slate-400 font-normal ml-1">
                                      ({cat.productCount})
                                    </span>
                                  )}
                                </Link>

                                {/* Nút mũi tên đóng mở thể loại con */}
                                {hasSubs && (
                                  <button
                                    type="button"
                                    onClick={(e) =>
                                      toggleCategoryExpand(cat._id, e)
                                    }
                                    className="p-1 rounded-lg text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-700/60 transition-all ml-1"
                                    title={
                                      isExpanded
                                        ? "Thu gọn"
                                        : "Xem thể loại con"
                                    }
                                  >
                                    <ChevronDown
                                      size={14}
                                      className={`transition-transform duration-200 ${
                                        isExpanded
                                          ? "rotate-180 text-blue-600 dark:text-blue-400"
                                          : ""
                                      }`}
                                    />
                                  </button>
                                )}
                              </div>

                              {/* Danh sách thể loại con */}
                              {hasSubs && isExpanded && (
                                <div className="ml-3 pl-2.5 my-1 border-l-2 border-blue-500/40 space-y-0.5 animate-fade-in">
                                  {subs.map((sub) => (
                                    <Link
                                      key={sub.id}
                                      to={`/products?category=${cat._id}&search=${encodeURIComponent(sub.keyword || sub.name)}`}
                                      onClick={() => setMobileMenuOpen(false)}
                                      className="flex items-center gap-1.5 py-1.5 px-2 rounded-lg text-[11px] font-medium text-gray-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-white/80 dark:hover:bg-slate-800/80 transition-colors"
                                    >
                                      <span className="w-1 h-1 rounded-full bg-blue-500/70" />
                                      <span className="truncate">
                                        {sub.name}
                                      </span>
                                    </Link>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Menu GIAO DIỆN > Sáng, Tối */}
                  <div className="rounded-2xl border border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/30 overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setThemeMenuOpen(!themeMenuOpen)}
                      className="w-full flex items-center justify-between p-3 text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <Palette
                          size={16}
                          className="text-blue-600 dark:text-blue-400"
                        />
                        <span>Giao diện</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-medium text-gray-500 dark:text-slate-400">
                          {theme === "dark" ? "Tối" : "Sáng"}
                        </span>
                        <ChevronDown
                          size={16}
                          className={`text-gray-400 transition-transform duration-200 ${
                            themeMenuOpen ? "rotate-180" : ""
                          }`}
                        />
                      </div>
                    </button>

                    {themeMenuOpen && (
                      <div className="border-t border-gray-100 dark:border-slate-800/80 p-2 grid grid-cols-2 gap-2 animate-fade-in">
                        <button
                          type="button"
                          onClick={() => setTheme("light")}
                          className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                            theme === "light"
                              ? "bg-amber-500 text-white shadow-sm ring-2 ring-amber-400/40"
                              : "bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 border border-gray-200 dark:border-slate-700"
                          }`}
                        >
                          <Sun size={15} />
                          <span>Sáng</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setTheme("dark")}
                          className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                            theme === "dark"
                              ? "bg-blue-600 text-white shadow-sm ring-2 ring-blue-500/40"
                              : "bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 border border-gray-200 dark:border-slate-700"
                          }`}
                        >
                          <Moon size={15} />
                          <span>Tối</span>
                        </button>
                      </div>
                    )}
                  </div>
                </nav>
              </div>

              {/* Bottom Drawer Footer - Ghim cố định ở đáy, trọn vẹn trong 100% height */}
              {isAuthenticated && (
                <div className="p-4 border-t border-gray-100 dark:border-slate-800/80 bg-white dark:bg-slate-900 flex-shrink-0 mt-auto">
                  <button
                    onClick={() => {
                      logout();
                      setMobileMenuOpen(false);
                      navigate("/");
                    }}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 text-xs font-bold text-white bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 active:from-rose-800 active:to-red-800 rounded-xl transition-all shadow-md shadow-rose-600/20 active:scale-[0.98]"
                  >
                    <LogOut size={16} />
                    <span>Đăng xuất</span>
                  </button>
                </div>
              )}
            </div>
          </div>,
          document.body,
        )}
    </header>
  );
};
