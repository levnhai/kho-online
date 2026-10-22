import React, { useState, useRef, useEffect } from "react";
import { Download, X, Edit3, Loader2, Printer, CheckCircle2, ArrowLeft } from "lucide-react";
import jsPDF from "jspdf";
import { toJpeg } from "html-to-image";
import { Order } from "@/shared/types";
import { formatCurrency, formatDate, cleanProductName } from "@/shared/lib/formatters";
import { getImageUrl, loadImageAsDataUrl } from "@/shared/lib/imageHelper";

interface BatchOrderInvoiceModalProps {
  orders: Order[];
  isOpen: boolean;
  onClose: () => void;
  onRemoveOrder?: (orderId: string) => void;
}

const getOrderItemCode = (item: any): string => {
  if (item.productCode) return item.productCode;
  if (typeof item.product === "object" && item.product?.code) return item.product.code;
  return "";
};

interface FlatOrderItem {
  itemIndex: number;
  orderId: string;
  orderCode: string;
  name: string;
  productCode?: string;
  size?: string;
  color?: string;
  sellingOption?: string;
  image: string;
  quantity: number;
  price: number;
  total: number;
}

export const BatchOrderInvoiceModal: React.FC<BatchOrderInvoiceModalProps> = ({
  orders,
  isOpen,
  onClose,
}) => {
  if (!isOpen || orders.length === 0) return null;

  // Dữ liệu cài đặt in
  const [storeTitle, setStoreTitle] = useState<string>("C.H.A.N.G STORE");
  const [creatorName, setCreatorName] = useState<string>("Quản trị viên KHO");
  const [isEditingSettings, setIsEditingSettings] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportProgress, setExportProgress] = useState<{
    text: string;
  } | null>(null);
  const [exportSuccess, setExportSuccess] = useState<boolean>(false);

  // Tính toán dữ liệu khách hàng gộp từ danh sách đơn
  const customerNames = Array.from(
    new Set(
      orders
        .map(
          (o) =>
            o.customerInfo?.name ||
            (typeof o.customer === "object" ? (o.customer as any)?.name : "") ||
            ""
        )
        .filter(Boolean)
    )
  );
  const customerPhones = Array.from(
    new Set(
      orders
        .map(
          (o) =>
            o.customerInfo?.phone ||
            (typeof o.customer === "object" ? (o.customer as any)?.phone : "") ||
            ""
        )
        .filter(Boolean)
    )
  );
  const customerAddresses = Array.from(
    new Set(orders.map((o) => o.customerInfo?.address || "").filter(Boolean))
  );

  const initialCustName =
    customerNames.length === 1
      ? customerNames[0]
      : customerNames.length > 1
      ? customerNames.join(", ")
      : "Khách hàng";
  const initialCustPhone =
    customerPhones.length === 1
      ? customerPhones[0]
      : customerPhones.length > 1
      ? customerPhones.join(", ")
      : "Chưa cập nhật";
  const initialCustAddress =
    customerAddresses.length === 1
      ? customerAddresses[0]
      : customerAddresses.length > 1
      ? customerAddresses[0]
      : "Tại cửa hàng / Chưa có địa chỉ";

  const [customerNameInput, setCustomerNameInput] = useState<string>(initialCustName);
  const [customerPhoneInput, setCustomerPhoneInput] = useState<string>(initialCustPhone);
  const [customerAddressInput, setCustomerAddressInput] = useState<string>(initialCustAddress);

  // Tổng tiền hàng và đã thanh toán của toàn bộ các đơn
  const totalAllOrdersAmount = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  const totalCalculatedPaid = orders.reduce((sum, o) => {
    const paid =
      o.paidAmount !== undefined
        ? o.paidAmount
        : o.paymentMethod === "BANK_TRANSFER" || o.status === "COMPLETED"
        ? o.totalAmount
        : 0;
    return sum + paid;
  }, 0);

  const [paidAmountInput, setPaidAmountInput] = useState<number>(totalCalculatedPaid);

  useEffect(() => {
    setCustomerNameInput(initialCustName);
    setCustomerPhoneInput(initialCustPhone);
    setCustomerAddressInput(initialCustAddress);
    setPaidAmountInput(totalCalculatedPaid);
  }, [orders.length]);

  // Danh sách phẳng tất cả sản phẩm từ các đơn hàng đã chọn
  const flatItems: FlatOrderItem[] = [];
  let itemCounter = 1;
  orders.forEach((ord) => {
    if (ord.items && ord.items.length > 0) {
      ord.items.forEach((it) => {
        flatItems.push({
          itemIndex: itemCounter++,
          orderId: ord._id,
          orderCode: ord.orderCode,
          name: it.name,
          productCode: getOrderItemCode(it),
          size: it.size,
          color: it.color,
          sellingOption: it.sellingOption,
          image: it.image,
          quantity: it.quantity || 1,
          price: it.price || 0,
          total: it.total || (it.price || 0) * (it.quantity || 1),
        });
      });
    }
  });

  const totalAllItemsCount = flatItems.reduce((sum, it) => sum + it.quantity, 0);
  const remainingAmount = Math.max(0, totalAllOrdersAmount - (paidAmountInput || 0));

  // Map lưu trữ ảnh dạng Base64 Data URL để in ấn chuẩn xác trên Safari/iOS
  const [imageBase64Map, setImageBase64Map] = useState<Record<string, string>>({});

  // Tự động preload chuyển đổi toàn bộ ảnh sản phẩm sang Base64 ngay khi mở modal
  useEffect(() => {
    let isMounted = true;
    const preloadImages = async () => {
      const rawUrls = Array.from(new Set(flatItems.map((it) => it.image).filter(Boolean)));
      for (const url of rawUrls) {
        if (!imageBase64Map[url]) {
          try {
            const b64 = await loadImageAsDataUrl(url);
            if (isMounted && b64) {
              setImageBase64Map((prev) => ({ ...prev, [url]: b64 }));
            }
          } catch (e) {
            // ignore
          }
        }
      }
    };

    if (isOpen && flatItems.length > 0) {
      preloadImages();
    }

    return () => {
      isMounted = false;
    };
  }, [isOpen, flatItems.length]);

  // Refs template
  const consolidatedTemplateRef = useRef<HTMLDivElement>(null);

  // Hàm xuất PDF bảng kê gộp
  const handleDownloadPdf = async () => {
    if (isExporting || orders.length === 0) return;

    setIsExporting(true);
    setExportSuccess(false);

    try {
      setExportProgress({
        text: `Đang chuẩn bị hình ảnh sản phẩm...`,
      });

      // 1. Đảm bảo toàn bộ ảnh đã được convert thành Base64 Data URL trước khi chụp
      const rawUrls = Array.from(new Set(flatItems.map((it) => it.image).filter(Boolean)));
      const convertedPairs = await Promise.all(
        rawUrls.map(async (url) => {
          if (imageBase64Map[url]) {
            return [url, imageBase64Map[url]] as const;
          }
          const b64 = await loadImageAsDataUrl(url);
          return [url, b64] as const;
        })
      );

      const updatedMap = { ...imageBase64Map };
      convertedPairs.forEach(([url, b64]) => {
        if (b64) updatedMap[url] = b64;
      });
      setImageBase64Map(updatedMap);

      const PDFClass = (jsPDF as any).default || jsPDF;
      const pdf = new PDFClass("p", "mm", "a4");
      const pageWidth = 210;
      const pageHeight = 297;
      const margin = 10;
      const printableWidth = pageWidth - margin * 2; // 190mm
      const printableHeight = pageHeight - margin * 2; // 277mm
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");

      setExportProgress({
        text: `Đang kết xuất bảng kê tổng hợp (${orders.length} đơn, ${flatItems.length} sản phẩm)...`,
      });

      const element = consolidatedTemplateRef.current;
      if (!element) {
        throw new Error("Không tìm thấy mẫu in bảng kê tổng hợp");
      }

      // 2. Chờ DOM cập nhật và gán trực tiếp Base64 vào các thẻ ảnh của template
      await new Promise((r) => setTimeout(r, 150));

      const imgElements = Array.from(element.querySelectorAll("img"));
      imgElements.forEach((img, idx) => {
        const item = flatItems[idx];
        if (item?.image && updatedMap[item.image]) {
          img.src = updatedMap[item.image];
        }
      });

      await Promise.all(
        imgElements.map(async (img) => {
          try {
            if (img.decode) {
              await img.decode();
            } else if (!img.complete) {
              await new Promise<void>((res) => {
                img.onload = () => res();
                img.onerror = () => res();
              });
            }
          } catch (e) {
            // decode fail ignore
          }
        })
      );

      // 3. Chụp thành ảnh JPEG với cacheBust: false (vì ảnh đã là Data URL)
      const imgData = await toJpeg(element, {
        quality: 0.98,
        backgroundColor: "#ffffff",
        pixelRatio: 2,
        cacheBust: false,
      });

      const img = new Image();
      img.src = imgData;
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("Lỗi nạp ảnh bảng kê"));
      });

      const imgHeight = (img.naturalHeight * printableWidth) / img.naturalWidth;

      if (imgHeight <= printableHeight) {
        pdf.addImage(imgData, "JPEG", margin, margin, printableWidth, imgHeight);
      } else {
        // Nhiều sản phẩm tự động phân trang chuẩn xác
        let heightLeft = imgHeight;
        let position = margin;

        pdf.addImage(imgData, "JPEG", margin, position, printableWidth, imgHeight);
        heightLeft -= printableHeight;

        while (heightLeft > 0) {
          position = heightLeft - imgHeight + margin;
          pdf.addPage();
          pdf.addImage(imgData, "JPEG", margin, position, printableWidth, imgHeight);
          heightLeft -= printableHeight;
        }
      }

      pdf.save(`Bang_Ke_Tong_Hop_${orders.length}_don_${dateStr}.pdf`);
      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 4000);
    } catch (error: any) {
      console.error("Lỗi xuất PDF:", error);
      alert(`Có lỗi khi tạo file PDF: ${error?.message || error || "Không xác định"}`);
    } finally {
      setIsExporting(false);
      setExportProgress(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-0 sm:p-4 overflow-y-auto bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative bg-slate-900 border-0 sm:border sm:border-slate-700/80 rounded-none sm:rounded-3xl shadow-2xl w-full max-w-5xl h-full sm:h-auto sm:max-h-[94vh] flex flex-col overflow-hidden text-white my-auto">
        {/* Top Control Bar (Hỗ trợ tai thỏ status bar 44px trên mobile và nút Quay lại to rõ) */}
        <div className="pt-[max(env(safe-area-inset-top),44px)] sm:pt-4 pb-2.5 sm:pb-3.5 px-3 sm:px-6 bg-slate-800/95 border-b border-slate-700/80 flex-shrink-0 flex flex-col gap-2.5 sm:gap-3">
          {/* Header Mobile: Nút Quay lại bên trái, Tiêu đề ở giữa, Nút X bên phải */}
          <div className="flex sm:hidden items-center justify-between gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isExporting}
              className="px-2.5 py-1.5 bg-slate-700/90 hover:bg-slate-700 active:bg-slate-600 active:scale-95 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm shrink-0 border border-slate-600/50"
              title="Quay lại"
            >
              <ArrowLeft size={16} />
              <span>Quay lại</span>
            </button>

            <div className="min-w-0 text-center flex-1">
              <div className="flex items-center justify-center gap-1.5">
                <h3 className="text-xs font-black text-white truncate">
                  Bảng Kê Đơn Hàng
                </h3>
                <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 font-mono font-bold shrink-0">
                  {orders.length} đơn
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              disabled={isExporting}
              className="w-8 h-8 flex items-center justify-center bg-slate-700/80 hover:bg-slate-700 active:bg-slate-600 active:scale-95 text-slate-200 hover:text-white rounded-xl transition cursor-pointer shrink-0 border border-slate-600/50"
              title="Đóng (Esc)"
            >
              <X size={17} />
            </button>
          </div>

          {/* Desktop Brand Info & Action Buttons */}
          <div className="flex items-center justify-between gap-2.5 sm:gap-3">
            {/* Desktop Brand Info */}
            <div className="hidden sm:flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold shrink-0">
                <Printer size={20} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base sm:text-lg font-black text-white whitespace-nowrap">
                    Bảng Kê Giao Hàng Tổng Hợp
                  </h3>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-extrabold border border-emerald-500/30">
                    {orders.length} đơn hàng • {totalAllItemsCount} sản phẩm
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5 truncate">
                  Gộp toàn bộ đơn hàng vào 1 bảng kê duy nhất, dưới mỗi tên hàng có mã đơn tương ứng
                </p>
              </div>
            </div>

            {/* Action Buttons: Tùy chỉnh & Tải đơn hàng (Trải đều vừa vặn trên Mobile) */}
            <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
              <button
                type="button"
                onClick={() => setIsEditingSettings(!isEditingSettings)}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0 ${
                  isEditingSettings
                    ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                    : "bg-slate-700 hover:bg-slate-600 text-slate-200"
                }`}
                title="Tùy chỉnh thông tin phiếu in"
              >
                <Edit3 size={14} />
                <span className="whitespace-nowrap">
                  {isEditingSettings ? "Đóng cài đặt" : "Cài đặt in"}
                </span>
              </button>

              <button
                type="button"
                disabled={isExporting}
                onClick={handleDownloadPdf}
                className="flex-1 sm:flex-none justify-center px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-60 text-white font-black text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-emerald-950/40 cursor-pointer active:scale-95 transition-all shrink-0 whitespace-nowrap"
              >
                {isExporting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Đang tạo PDF...</span>
                  </>
                ) : (
                  <>
                    <Download size={16} />
                    <span>Tải đơn hàng ({orders.length} đơn)</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={onClose}
                disabled={isExporting}
                className="hidden sm:flex p-2 text-slate-400 hover:text-white hover:bg-slate-700/60 rounded-xl transition cursor-pointer shrink-0"
                title="Đóng (Esc)"
              >
                <X size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* Cài đặt nhanh thông tin in */}
        {isEditingSettings && (
          <div className="p-4 bg-slate-800/95 border-b border-slate-700 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs animate-fade-in flex-shrink-0">
            <div>
              <label className="block text-[11px] font-bold text-slate-300 mb-1">
                Tiêu đề hệ thống / Thương hiệu:
              </label>
              <input
                type="text"
                value={storeTitle}
                onChange={(e) => setStoreTitle(e.target.value)}
                className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-medium focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-300 mb-1">
                Tên khách hàng hiển thị:
              </label>
              <input
                type="text"
                value={customerNameInput}
                onChange={(e) => setCustomerNameInput(e.target.value)}
                className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-medium focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-300 mb-1">
                Số điện thoại:
              </label>
              <input
                type="text"
                value={customerPhoneInput}
                onChange={(e) => setCustomerPhoneInput(e.target.value)}
                className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-medium focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-bold text-slate-300 mb-1">
                Địa chỉ giao hàng:
              </label>
              <input
                type="text"
                value={customerAddressInput}
                onChange={(e) => setCustomerAddressInput(e.target.value)}
                className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-medium focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-300 mb-1">
                Đã thanh toán (VNĐ):
              </label>
              <input
                type="number"
                min={0}
                max={totalAllOrdersAmount}
                value={paidAmountInput}
                onChange={(e) => setPaidAmountInput(Number(e.target.value))}
                className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-emerald-400 font-bold focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-300 mb-1">
                Người lập phiếu ký tên:
              </label>
              <input
                type="text"
                value={creatorName}
                onChange={(e) => setCreatorName(e.target.value)}
                className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-medium focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>
        )}

        {/* Thông báo tiến trình xuất PDF */}
        {isExporting && exportProgress && (
          <div className="p-3 bg-blue-950/80 border-b border-blue-800 text-blue-200 text-xs flex items-center justify-between gap-3 animate-pulse flex-shrink-0">
            <div className="flex items-center gap-2">
              <Loader2 size={15} className="animate-spin text-blue-400" />
              <span>{exportProgress.text}</span>
            </div>
          </div>
        )}

        {exportSuccess && (
          <div className="p-3 bg-emerald-950/80 border-b border-emerald-800 text-emerald-200 text-xs flex items-center gap-2 animate-fade-in flex-shrink-0">
            <CheckCircle2 size={16} className="text-emerald-400" />
            <span>Đã tạo file PDF và tải xuống thành công!</span>
          </div>
        )}

        {/* ════════ KHUNG XEM TRƯỚC BẢN IN (PREVIEW A4 TRẮNG TINH TẾ) ════════ */}
        <div className="flex-1 overflow-y-auto p-2 sm:p-6 bg-slate-950 flex flex-col items-center custom-scrollbar">
          <div className="w-full max-w-[760px] bg-white text-slate-900 shadow-2xl rounded-xl sm:rounded-2xl p-4 sm:p-8 border border-slate-200 selection:bg-emerald-100 shrink-0 my-0 sm:my-auto">
            {/* 1. Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start gap-2 pb-3 border-b-2 border-slate-900 mb-4">
              <div>
                <div className="text-emerald-700 text-xs sm:text-[13px] font-bold tracking-wide uppercase mb-1">
                  {storeTitle}
                </div>
                <h1 className="text-slate-900 text-base sm:text-2xl font-black uppercase tracking-tight">
                  PHIẾU GIAO HÀNG / BẢNG KÊ ĐƠN HÀNG
                </h1>
              </div>
              <div className="sm:text-right text-[11px] text-slate-500 leading-relaxed w-full sm:w-auto flex flex-wrap sm:flex-col justify-between gap-1 sm:gap-0 pt-1 sm:pt-0 border-t border-slate-100 sm:border-0 shrink-0">
                <div>
                  Ngày in:{" "}
                  <strong className="text-slate-900">
                    {formatDate(new Date())}
                  </strong>
                </div>
                <div className="text-emerald-700 font-bold">
                  Số lượng đơn: <strong>{orders.length} đơn</strong>
                </div>
              </div>
            </div>

            {/* 2. Thông tin khách hàng */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 sm:p-3.5 mb-4">
              <div className="text-emerald-700 text-[11px] font-black uppercase tracking-wider mb-2">
                THÔNG TIN KHÁCH HÀNG
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs">
                <div>
                  <span className="text-slate-500 mr-2">Khách hàng:</span>
                  <strong className="text-slate-900">
                    {customerNameInput}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-500 mr-2">Số điện thoại:</span>
                  <strong className="text-slate-900 font-mono">
                    {customerPhoneInput}
                  </strong>
                </div>
                <div className="sm:col-span-2">
                  <span className="text-slate-500 mr-2">Địa chỉ:</span>
                  <span className="text-slate-800 font-medium">
                    {customerAddressInput}
                  </span>
                </div>
              </div>
            </div>

            {/* 3. Bảng Sản Phẩm Gộp Toàn Bộ (Cuộn ngang êm ái trên mobile, không bị vỡ cột) */}
            <div className="overflow-x-auto -mx-1 sm:mx-0 mb-4 pb-1">
              <table className="w-full border-collapse mb-1 text-xs min-w-[500px] sm:min-w-0">
                <thead>
                  <tr className="bg-slate-900 text-white font-bold uppercase text-[10px] tracking-wider">
                    <th className="py-2 px-1.5 text-center w-9 rounded-tl-md">
                      STT
                    </th>
                    <th className="py-2 px-2.5 text-left">
                      TÊN HÀNG / SẢN PHẨM
                    </th>
                    <th className="py-2 px-1.5 text-center w-14">ẢNH</th>
                    <th className="py-2 px-1.5 text-center w-10">SL</th>
                    <th className="py-2 px-2.5 text-right w-24">ĐƠN GIÁ</th>
                    <th className="py-2 px-2.5 text-right w-28 rounded-tr-md">
                      THÀNH TIỀN
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {flatItems.map((item, idx) => (
                    <tr
                      key={idx}
                      className="border-b border-slate-200 hover:bg-slate-50/60"
                    >
                      <td className="py-2.5 px-1.5 text-center font-bold text-slate-500 text-xs">
                        {idx + 1}
                      </td>
                      <td className="py-2.5 px-2.5">
                        <div className="font-bold text-slate-900 text-[12px]">
                          {cleanProductName(item.name)}
                        </div>
                        {/* Mã đơn hiển thị màu xanh ngọc trong ngoặc vuông [DH-0025] y hệt ảnh mẫu */}
                        <div className="mt-0.5 flex items-center gap-2 flex-wrap">
                          <span className="font-mono font-bold text-emerald-700 text-[11px]">
                            [{item.orderCode.startsWith("#") ? item.orderCode.slice(1) : item.orderCode}]
                          </span>
                          {item.productCode && (
                            <span className="text-[10px] text-slate-400 font-mono">
                              • Mã: {item.productCode}
                            </span>
                          )}
                          {item.size && (
                            <span className="text-[10px] text-slate-500 font-medium">
                              • Size: {item.size}
                            </span>
                          )}
                          {item.color && (
                            <span className="text-[10px] text-slate-500 font-medium">
                              • Màu: {item.color}
                            </span>
                          )}
                          {item.sellingOption && (
                            <span className="text-[10px] text-slate-500 font-medium">
                              • {item.sellingOption}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-2.5 px-1.5 text-center">
                        <img
                          src={imageBase64Map[item.image] || getImageUrl(item.image)}
                          alt={item.name}
                          className="w-9 h-9 rounded-md object-cover border border-slate-300 mx-auto"
                          crossOrigin="anonymous"
                        />
                      </td>
                      <td className="py-2.5 px-1.5 text-center font-bold text-slate-900 text-xs">
                        {item.quantity}
                      </td>
                      <td className="py-2.5 px-2.5 text-right text-slate-600 font-medium text-xs">
                        {formatCurrency(item.price)}
                      </td>
                      <td className="py-2.5 px-2.5 text-right font-bold text-slate-900 text-xs">
                        {formatCurrency(item.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 4. Thống kê tổng quan */}
            <div className="flex justify-end mb-5">
              <div className="w-full sm:w-72 border border-emerald-300 bg-emerald-50/50 rounded-lg p-3">
                <div className="text-emerald-700 text-[11px] font-black uppercase tracking-wider mb-2">
                  THỐNG KÊ TỔNG QUAN
                </div>
                <div className="flex justify-between text-xs text-slate-700 py-0.5">
                  <span>Tổng số lượng sản phẩm:</span>
                  <strong className="text-slate-900">
                    {totalAllItemsCount} món
                  </strong>
                </div>
                <div className="flex justify-between text-xs text-slate-700 py-0.5">
                  <span>Tổng tiền hàng:</span>
                  <strong className="text-slate-900">
                    {formatCurrency(totalAllOrdersAmount)}
                  </strong>
                </div>
                <div className="flex justify-between text-xs text-slate-700 py-0.5">
                  <span>Đã thanh toán:</span>
                  <strong className="text-emerald-700 font-bold">
                    {formatCurrency(paidAmountInput)}
                  </strong>
                </div>
                <div className="border-t border-dashed border-slate-300 my-1.5" />
                <div className="flex justify-between text-xs font-black text-rose-600 py-0.5">
                  <span>Còn nợ / Thu khi nhận:</span>
                  <span className="text-sm">
                    {formatCurrency(remainingAmount)}
                  </span>
                </div>
              </div>
            </div>

            {/* 5. Chữ ký */}
            <div className="grid grid-cols-2 text-center my-6">
              <div>
                <div className="text-xs font-bold uppercase text-slate-900">
                  KHÁCH HÀNG NHẬN
                </div>
                <div className="text-[11px] text-slate-500 italic mt-0.5 mb-12">
                  (Ký và ghi rõ họ tên)
                </div>
                <div className="font-semibold text-slate-700 text-xs">
                  {customerNameInput}
                </div>
              </div>
              <div>
                <div className="text-xs font-bold uppercase text-slate-900">
                  NGƯỜI LẬP PHIẾU
                </div>
                <div className="text-[11px] text-slate-500 italic mt-0.5 mb-12">
                  (Ký và ghi rõ họ tên)
                </div>
                <div className="font-semibold text-slate-700 text-xs">
                  {creatorName}
                </div>
              </div>
            </div>

            {/* 6. Footer Note */}
            <div className="text-center text-[10px] italic text-slate-500 border-t border-dashed border-slate-200 pt-3">
              Cảm ơn quý khách đã tin tưởng và ủng hộ chúng tôi!
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          TEMPLATE ẨN DÙNG ĐỂ CHỤP VÀ XUẤT FILE PDF CHUẨN A4 (760px)
          ═══════════════════════════════════════════════════════════════════ */}
      <div
        style={{
          position: "fixed",
          left: "0px",
          top: "0px",
          width: "760px",
          zIndex: -9999,
          opacity: 0,
          pointerEvents: "none",
        }}
      >
        <div
          ref={consolidatedTemplateRef}
          style={{
            width: "760px",
            backgroundColor: "#ffffff",
            padding: "24px 28px",
            boxSizing: "border-box",
            fontFamily:
              "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
            color: "#0f172a",
          }}
        >
          {/* 1. Header */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              borderBottom: "2px solid #0f172a",
              paddingBottom: "12px",
              marginBottom: "14px",
            }}
          >
            <div>
              <div
                style={{
                  color: "#047857",
                  fontSize: "12px",
                  fontWeight: 800,
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  marginBottom: "3px",
                }}
              >
                {storeTitle}
              </div>
              <h1
                style={{
                  color: "#0f172a",
                  fontSize: "20px",
                  fontWeight: 900,
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  margin: 0,
                }}
              >
                PHIẾU GIAO HÀNG / BẢNG KÊ ĐƠN HÀNG
              </h1>
            </div>
            <div
              style={{
                textAlign: "right",
                fontSize: "11px",
                color: "#475569",
                lineHeight: 1.5,
              }}
            >
              <div>
                Ngày in:{" "}
                <strong style={{ color: "#0f172a" }}>
                  {formatDate(new Date())}
                </strong>
              </div>
              <div style={{ color: "#047857", fontWeight: 700 }}>
                Số lượng đơn: <strong>{orders.length} đơn</strong>
              </div>
            </div>
          </div>

          {/* 2. Thông tin khách hàng */}
          <div
            style={{
              backgroundColor: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: "8px",
              padding: "12px 16px",
              marginBottom: "14px",
            }}
          >
            <div
              style={{
                color: "#047857",
                fontSize: "11px",
                fontWeight: 800,
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                marginBottom: "8px",
              }}
            >
              THÔNG TIN KHÁCH HÀNG
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1.2fr 0.8fr",
                gap: "6px 16px",
                fontSize: "11.5px",
              }}
            >
              <div style={{ display: "flex", gap: "6px" }}>
                <span
                  style={{
                    color: "#64748b",
                    minWidth: "80px",
                    fontWeight: 500,
                  }}
                >
                  Khách hàng:
                </span>
                <span style={{ color: "#0f172a", fontWeight: 700 }}>
                  {customerNameInput}
                </span>
              </div>
              <div style={{ display: "flex", gap: "6px" }}>
                <span
                  style={{
                    color: "#64748b",
                    minWidth: "80px",
                    fontWeight: 500,
                  }}
                >
                  Số điện thoại:
                </span>
                <span
                  style={{
                    color: "#0f172a",
                    fontWeight: 700,
                    fontFamily: "monospace",
                  }}
                >
                  {customerPhoneInput}
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  gap: "6px",
                  gridColumn: "span 2",
                }}
              >
                <span
                  style={{
                    color: "#64748b",
                    minWidth: "80px",
                    fontWeight: 500,
                  }}
                >
                  Địa chỉ:
                </span>
                <span
                  style={{
                    color: "#0f172a",
                    fontWeight: 500,
                    lineHeight: 1.4,
                  }}
                >
                  {customerAddressInput}
                </span>
              </div>
            </div>
          </div>

          {/* 3. Bảng Sản phẩm Toàn bộ đơn */}
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              marginBottom: "14px",
              fontSize: "11px",
            }}
          >
            <thead>
              <tr
                style={{
                  backgroundColor: "#0f172a",
                  color: "#ffffff",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  fontSize: "10px",
                  letterSpacing: "0.3px",
                }}
              >
                <th
                  style={{
                    padding: "8px 6px",
                    textAlign: "center",
                    width: "34px",
                    borderTopLeftRadius: "6px",
                  }}
                >
                  STT
                </th>
                <th style={{ padding: "8px 10px", textAlign: "left" }}>
                  TÊN HÀNG / SẢN PHẨM
                </th>
                <th
                  style={{
                    padding: "8px 6px",
                    textAlign: "center",
                    width: "52px",
                  }}
                >
                  ẢNH
                </th>
                <th
                  style={{
                    padding: "8px 6px",
                    textAlign: "center",
                    width: "38px",
                  }}
                >
                  SL
                </th>
                <th
                  style={{
                    padding: "8px 10px",
                    textAlign: "right",
                    width: "95px",
                  }}
                >
                  ĐƠN GIÁ
                </th>
                <th
                  style={{
                    padding: "8px 10px",
                    textAlign: "right",
                    width: "100px",
                    borderTopRightRadius: "6px",
                  }}
                >
                  THÀNH TIỀN
                </th>
              </tr>
            </thead>
            <tbody>
              {flatItems.map((item, idx) => (
                <tr key={idx} style={{ borderBottom: "1px solid #e2e8f0" }}>
                  <td
                    style={{
                      padding: "8px 6px",
                      textAlign: "center",
                      fontWeight: 700,
                      color: "#64748b",
                    }}
                  >
                    {idx + 1}
                  </td>
                  <td style={{ padding: "8px 10px" }}>
                    <div
                      style={{
                        fontWeight: 700,
                        color: "#0f172a",
                        fontSize: "11.5px",
                      }}
                    >
                      {cleanProductName(item.name)}
                    </div>
                    {/* Dưới tên hàng hiển thị mã đơn [DH-0025] màu xanh ngọc chuẩn ảnh mẫu */}
                    <div
                      style={{
                        fontSize: "10.5px",
                        fontFamily: "monospace",
                        fontWeight: 700,
                        color: "#047857",
                        marginTop: "2px",
                      }}
                    >
                      [{item.orderCode.startsWith("#") ? item.orderCode.slice(1) : item.orderCode}]
                      {item.productCode ? ` • Mã: ${item.productCode}` : ""}
                      {item.size ? ` • Size: ${item.size}` : ""}
                      {item.color ? ` • Màu: ${item.color}` : ""}
                    </div>
                  </td>
                  <td style={{ padding: "8px 6px", textAlign: "center" }}>
                    <img
                      src={imageBase64Map[item.image] || getImageUrl(item.image)}
                      alt={item.name}
                      style={{
                        width: "38px",
                        height: "38px",
                        borderRadius: "6px",
                        objectFit: "cover",
                        border: "1px solid #cbd5e1",
                        display: "block",
                        margin: "0 auto",
                      }}
                      crossOrigin="anonymous"
                    />
                  </td>
                  <td
                    style={{
                      padding: "8px 6px",
                      textAlign: "center",
                      fontWeight: 700,
                      color: "#0f172a",
                    }}
                  >
                    {item.quantity}
                  </td>
                  <td
                    style={{
                      padding: "8px 10px",
                      textAlign: "right",
                      color: "#334155",
                      fontWeight: 500,
                    }}
                  >
                    {formatCurrency(item.price)}
                  </td>
                  <td
                    style={{
                      padding: "8px 10px",
                      textAlign: "right",
                      fontWeight: 700,
                      color: "#0f172a",
                    }}
                  >
                    {formatCurrency(item.total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* 4. Thống Kê Tổng Quan */}
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              marginBottom: "18px",
            }}
          >
            <div
              style={{
                width: "290px",
                border: "1px solid #a7f3d0",
                backgroundColor: "#f0fdf4",
                borderRadius: "8px",
                padding: "10px 14px",
              }}
            >
              <div
                style={{
                  color: "#047857",
                  fontSize: "10px",
                  fontWeight: 800,
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  marginBottom: "6px",
                }}
              >
                THỐNG KÊ TỔNG QUAN
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "11px",
                  color: "#334155",
                  padding: "3px 0",
                }}
              >
                <span>Tổng số lượng sản phẩm:</span>
                <strong style={{ color: "#0f172a" }}>
                  {totalAllItemsCount} món
                </strong>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "11px",
                  color: "#334155",
                  padding: "3px 0",
                }}
              >
                <span>Tổng tiền hàng:</span>
                <strong style={{ color: "#0f172a" }}>
                  {formatCurrency(totalAllOrdersAmount)}
                </strong>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "11px",
                  color: "#334155",
                  padding: "3px 0",
                }}
              >
                <span>Đã thanh toán:</span>
                <strong style={{ color: "#047857" }}>
                  {formatCurrency(paidAmountInput)}
                </strong>
              </div>
              <div style={{ borderTop: "1px dashed #cbd5e1", margin: "5px 0" }} />
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "12.5px",
                  fontWeight: 900,
                  color: "#e11d48",
                  padding: "2px 0",
                }}
              >
                <span>Còn nợ / Thu khi nhận:</span>
                <span style={{ fontSize: "14px" }}>
                  {formatCurrency(remainingAmount)}
                </span>
              </div>
            </div>
          </div>

          {/* 5. Chữ Ký */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              textAlign: "center",
              marginTop: "16px",
              marginBottom: "20px",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: "11px",
                  fontWeight: 800,
                  textTransform: "uppercase",
                  color: "#0f172a",
                }}
              >
                KHÁCH HÀNG NHẬN
              </div>
              <div
                style={{
                  fontSize: "10px",
                  color: "#64748b",
                  fontStyle: "italic",
                  marginTop: "2px",
                  marginBottom: "36px",
                }}
              >
                (Ký và ghi rõ họ tên)
              </div>
              <div
                style={{ fontSize: "11px", fontWeight: 700, color: "#334155" }}
              >
                {customerNameInput}
              </div>
            </div>
            <div>
              <div
                style={{
                  fontSize: "11px",
                  fontWeight: 800,
                  textTransform: "uppercase",
                  color: "#0f172a",
                }}
              >
                NGƯỜI LẬP PHIẾU
              </div>
              <div
                style={{
                  fontSize: "10px",
                  color: "#64748b",
                  fontStyle: "italic",
                  marginTop: "2px",
                  marginBottom: "36px",
                }}
              >
                (Ký và ghi rõ họ tên)
              </div>
              <div
                style={{ fontSize: "11px", fontWeight: 700, color: "#334155" }}
              >
                {creatorName}
              </div>
            </div>
          </div>

          {/* 6. Footer Note */}
          <div
            style={{
              textAlign: "center",
              fontSize: "10px",
              fontStyle: "italic",
              color: "#64748b",
              borderTop: "1px dashed #e2e8f0",
              paddingTop: "10px",
            }}
          >
            Cảm ơn quý khách đã tin tưởng và ủng hộ chúng tôi!
          </div>
        </div>
      </div>
    </div>
  );
};
