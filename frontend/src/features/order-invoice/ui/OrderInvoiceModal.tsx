import React, { useState, useRef } from "react";
import { Download, X, Edit3, Loader2 } from "lucide-react";
import jsPDF from "jspdf";
import { toJpeg } from "html-to-image";
import { Order } from "@/shared/types";
import { formatCurrency, formatDate, cleanProductName } from "@/shared/lib/formatters";
import { getImageUrl } from "@/shared/lib/imageHelper";

interface OrderInvoiceModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
}

const getOrderItemCode = (item: any): string => {
  if (item.productCode) return item.productCode;
  if (typeof item.product === "object" && item.product?.code) return item.product.code;
  return "";
};

export const OrderInvoiceModal: React.FC<OrderInvoiceModalProps> = ({
  order,
  isOpen,
  onClose,
}) => {
  if (!isOpen || !order) return null;

  const totalQuantity = order.items
    ? order.items.reduce((sum, it) => sum + (it.quantity || 1), 0)
    : 0;

  // Trạng thái cho phép chỉnh sửa nhanh khi in (tiền đã thanh toán/cọc, người lập phiếu)
  const defaultPaid =
    order.paidAmount !== undefined
      ? order.paidAmount
      : order.paymentMethod === "BANK_TRANSFER" || order.status === "COMPLETED"
      ? order.totalAmount
      : 0;

  const [paidAmount, setPaidAmount] = useState<number>(defaultPaid);
  const [creatorName, setCreatorName] = useState<string>("Quản trị viên KHO");
  const [storeTitle, setStoreTitle] = useState<string>("C.H.A.NG STORE");
  const [customNote, setCustomNote] = useState<string>("");
  const [isEditingSettings, setIsEditingSettings] = useState<boolean>(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState<boolean>(false);

  const printAreaRef = useRef<HTMLDivElement>(null);
  const pdfTemplateRef = useRef<HTMLDivElement>(null);

  // Tính số tiền còn nợ / thu khi nhận
  const remainingAmount = Math.max(0, order.totalAmount - (paidAmount || 0));

  const customerName =
    order.customerInfo?.name ||
    (typeof order.customer === "object" ? (order.customer as any)?.name : "") ||
    "Khách hàng";
  const customerPhone =
    order.customerInfo?.phone ||
    (typeof order.customer === "object" ? (order.customer as any)?.phone : "") ||
    "Chưa cập nhật";
  const customerAddress = order.customerInfo?.address || "Chưa cập nhật";

  // Hàm xuất và tải trực tiếp file PDF về máy (chuẩn A4 sắc nét, trọn vẹn 1 trang, không bị cắt xén)
  const handleDownloadPdf = async () => {
    const element = pdfTemplateRef.current;
    if (!element) {
      console.error("Không tìm thấy template mẫu in PDF (pdfTemplateRef is null)");
      alert("Không tìm thấy mẫu in hóa đơn, vui lòng thử lại!");
      return;
    }
    if (isDownloadingPdf) return;

    setIsDownloadingPdf(true);

    try {
      // 1. Chụp template chuẩn A4 (width 760px) thành ảnh JPEG sắc nét
      const imgData = await toJpeg(element, {
        quality: 0.98,
        backgroundColor: "#ffffff",
        pixelRatio: 2,
        cacheBust: true,
      });

      // 2. Đo kích thước thực tế của ảnh
      const img = new Image();
      img.src = imgData;
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("Không thể load dữ liệu ảnh hóa đơn"));
      });

      // 3. Tạo file PDF chuẩn A4 cân đối lề trang (10mm margin)
      const PDFClass = (jsPDF as any).default || jsPDF;
      const pdf = new PDFClass("p", "mm", "a4");
      const pageWidth = 210;
      const pageHeight = 297;
      const margin = 10;
      const printableWidth = pageWidth - margin * 2; // 190mm
      const printableHeight = pageHeight - margin * 2; // 277mm

      const imgHeight = (img.naturalHeight * printableWidth) / img.naturalWidth;

      if (imgHeight <= printableHeight) {
        // Hóa đơn nằm trọn vẹn, vuông vắn và đẹp mắt trong 1 trang A4 duy nhất!
        pdf.addImage(imgData, "JPEG", margin, margin, printableWidth, imgHeight);
      } else {
        // Trường hợp đơn hàng rất nhiều sản phẩm mới chia trang
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

      const cleanCode = (order.orderCode || "don_hang").replace(/[^a-zA-Z0-9_-]/g, "");
      pdf.save(`Hoa_Don_${cleanCode}.pdf`);
    } catch (error: any) {
      console.error("Lỗi xuất PDF:", error);
      alert(`Có lỗi khi tạo file PDF: ${error?.message || error || "Không xác định"}`);
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-0 sm:p-4 overflow-y-auto bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="relative bg-slate-900 border-0 sm:border sm:border-slate-700/80 rounded-none sm:rounded-3xl shadow-2xl w-full max-w-4xl h-full sm:h-auto sm:max-h-[96vh] flex flex-col overflow-hidden text-white my-auto">
        {/* Top Control Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 px-3 sm:px-6 py-2.5 sm:py-3.5 bg-slate-800/95 border-b border-slate-700/80 flex-shrink-0">
          <div className="flex items-center justify-between gap-2.5 min-w-0">
            <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold shrink-0">
                <Download size={17} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                  <h3 className="text-sm sm:text-base font-extrabold text-white whitespace-nowrap">
                    Hóa đơn &amp; Phiếu giao hàng
                  </h3>
                  <span className="text-[11px] sm:text-xs px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-300 font-mono font-bold">
                    {order.orderCode.startsWith("#")
                      ? order.orderCode
                      : `#${order.orderCode}`}
                  </span>
                </div>
                <p className="text-[10px] sm:text-[11px] text-slate-400 truncate">
                  Tải file PDF chuẩn A4 • Bảng kê đơn hàng
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="sm:hidden p-1.5 text-slate-400 hover:text-white hover:bg-slate-700/60 rounded-xl transition-colors cursor-pointer shrink-0"
              title="Đóng (Esc)"
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setIsEditingSettings(!isEditingSettings)}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                isEditingSettings
                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                  : "bg-slate-700 hover:bg-slate-600 text-slate-200"
              }`}
              title="Tùy chỉnh thông tin phiếu in"
            >
              <Edit3 size={14} />
              <span className="whitespace-nowrap">
                {isEditingSettings ? "Đóng cài đặt" : "Tùy chỉnh"}
              </span>
            </button>

            <button
              type="button"
              disabled={isDownloadingPdf}
              onClick={handleDownloadPdf}
              className="flex-1 sm:flex-none justify-center px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white font-extrabold text-xs flex items-center gap-2 shadow-lg shadow-emerald-900/30 cursor-pointer active:scale-95 transition-transform shrink-0 whitespace-nowrap"
            >
              {isDownloadingPdf ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Đang tạo PDF...</span>
                </>
              ) : (
                <>
                  <Download size={16} />
                  <span>Tải file PDF</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="hidden sm:flex p-2 text-slate-400 hover:text-white hover:bg-slate-700/60 rounded-xl transition-colors cursor-pointer shrink-0"
              title="Đóng (Esc)"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Cài đặt nhanh thông tin in (nếu bấm Tùy chỉnh) */}
        {isEditingSettings && (
          <div className="p-3 sm:p-4 bg-slate-800/95 border-b border-slate-700 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs animate-fade-in flex-shrink-0">
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
                Đã thanh toán (VNĐ):
              </label>
              <input
                type="number"
                min={0}
                max={order.totalAmount}
                value={paidAmount}
                onChange={(e) => setPaidAmount(Number(e.target.value))}
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

        {/* Khung Xem Trước Bản In (Khổ giấy màu trắng tinh tế, thiết kế 100% khớp mẫu) */}
        <div className="flex-1 overflow-y-auto p-2 sm:p-6 bg-slate-950 flex flex-col items-center custom-scrollbar">
          <div className="w-full max-w-[760px] bg-white text-slate-900 shadow-2xl rounded-xl sm:rounded-2xl p-3.5 sm:p-8 border border-slate-200 selection:bg-emerald-100 shrink-0 my-0 sm:my-auto">
            <div ref={printAreaRef} className="bg-white">
              {/* ════════ HEADER ════════ */}
              <div className="header flex flex-col sm:flex-row justify-between items-start gap-2 pb-3 border-b-2 border-slate-900 mb-4">
                <div>
                  <div className="brand-title text-emerald-700 text-xs sm:text-[13px] font-bold tracking-wide uppercase mb-1">
                    {storeTitle}
                  </div>
                  <h1 className="main-title text-slate-900 text-base sm:text-2xl font-black uppercase tracking-tight">
                    PHIẾU GIAO HÀNG / BẢNG KÊ ĐƠN HÀNG
                  </h1>
                </div>

                <div className="meta-right sm:text-right text-[11px] sm:text-xs text-slate-600 leading-snug w-full sm:w-auto flex flex-wrap sm:flex-col justify-between gap-1 sm:gap-0 pt-1 sm:pt-0 border-t border-slate-100 sm:border-0">
                  <div>
                    Ngày in: <strong>{formatDate(new Date())}</strong>
                  </div>
                  <div>
                    Mã đơn:{" "}
                    <strong className="text-slate-900">
                      {order.orderCode.startsWith("#")
                        ? order.orderCode
                        : `#${order.orderCode}`}
                    </strong>
                  </div>
                  <div>
                    Số lượng đơn: <strong>1 đơn</strong>
                  </div>
                </div>
              </div>

              {/* ════════ THÔNG TIN KHÁCH HÀNG ════════ */}
              <div className="customer-card bg-slate-50 border border-slate-200 rounded-xl p-3 sm:p-3.5 mb-4">
                <div className="card-title text-emerald-700 text-[11px] font-extrabold uppercase tracking-wider mb-2">
                  THÔNG TIN KHÁCH HÀNG
                </div>

                <div className="customer-grid grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="customer-row flex flex-wrap sm:flex-nowrap gap-1 sm:gap-1.5">
                    <span className="label text-slate-500 font-medium min-w-[80px]">
                      Khách hàng:
                    </span>
                    <span className="val text-slate-900 font-bold">
                      {customerName}
                    </span>
                  </div>

                  <div className="customer-row flex flex-wrap sm:flex-nowrap gap-1 sm:gap-1.5">
                    <span className="label text-slate-500 font-medium min-w-[80px]">
                      Số điện thoại:
                    </span>
                    <span className="val text-slate-900 font-bold font-mono">
                      {customerPhone}
                    </span>
                  </div>

                  <div className="customer-row flex flex-wrap sm:flex-nowrap gap-1 sm:gap-1.5 sm:col-span-2">
                    <span className="label text-slate-500 font-medium min-w-[80px]">
                      Địa chỉ:
                    </span>
                    <span className="val text-slate-900 font-medium leading-relaxed">
                      {customerAddress}
                    </span>
                  </div>

                  {order.customerInfo?.note && (
                    <div className="customer-row flex flex-wrap sm:flex-nowrap gap-1 sm:gap-1.5 sm:col-span-2 text-amber-800 italic">
                      <span className="label text-slate-500 font-medium min-w-[80px]">
                        Ghi chú:
                      </span>
                      <span className="val font-medium">
                        {order.customerInfo.note}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* ════════ BẢNG SẢN PHẨM ════════ */}
              <div className="overflow-x-auto -mx-1 sm:mx-0 mb-4 pb-1">
                <table className="w-full border-collapse text-xs min-w-[500px] sm:min-w-0">
                  <thead>
                    <tr className="bg-slate-900 text-white font-bold text-[11px] uppercase tracking-wider">
                      <th className="py-2.5 px-2 text-center rounded-tl-lg w-10">
                        STT
                      </th>
                      <th className="py-2.5 px-2 text-center w-24">
                        MÃ SP
                      </th>
                      <th className="py-2.5 px-3 text-left">
                        TÊN HÀNG / SẢN PHẨM
                      </th>
                      <th className="py-2.5 px-2 text-center w-14 sm:w-16">ẢNH</th>
                      <th className="py-2.5 px-2 text-center w-12">SL</th>
                      <th className="py-2.5 px-3 text-right w-24 sm:w-28">ĐƠN GIÁ</th>
                      <th className="py-2.5 px-3 text-right rounded-tr-lg w-24 sm:w-28">
                        THÀNH TIỀN
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {order.items.map((item, idx) => {
                      const pCode = getOrderItemCode(item);
                      const itemTotal = item.total || item.price * item.quantity;

                      return (
                        <tr key={idx} className="hover:bg-slate-50/70">
                          <td className="py-2.5 px-2 text-center font-bold text-slate-500 text-xs">
                            {idx + 1}
                          </td>
                          <td className="py-2.5 px-2 text-center font-mono font-bold text-emerald-700 text-xs">
                            {pCode || "-"}
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="product-title font-bold text-slate-900 text-xs">
                              {cleanProductName(item.name)}
                            </div>
                            {(item.size || item.color || item.sellingOption) && (
                              <div className="product-variant text-[10.5px] text-slate-500 flex items-center gap-1.5 flex-wrap mt-0.5">
                                {item.sellingOption && (
                                  <span>Phân loại: {item.sellingOption}</span>
                                )}
                                {item.size && <span>• Size: {item.size}</span>}
                                {item.color && <span>• Màu: {item.color}</span>}
                              </div>
                            )}
                          </td>
                          <td className="py-2.5 px-2 text-center">
                            <img
                              src={getImageUrl(item.image)}
                              alt={item.name}
                              className="product-img w-10 h-10 sm:w-11 sm:h-11 rounded-lg object-cover border border-slate-200 mx-auto"
                              crossOrigin="anonymous"
                            />
                          </td>
                          <td className="py-2.5 px-2 text-center font-bold text-slate-900 text-xs">
                            {item.quantity}
                          </td>
                          <td className="py-2.5 px-3 text-right text-slate-700 font-medium">
                            {formatCurrency(item.price)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                            {formatCurrency(itemTotal)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* ════════ THỐNG KÊ TỔNG QUAN ════════ */}
              <div className="summary-section flex justify-end mb-6">
                <div className="summary-box w-full sm:w-80 border border-emerald-300 bg-emerald-50/50 rounded-xl p-3 sm:p-3.5 space-y-1.5">
                  <div className="summary-title text-emerald-700 text-[11px] font-black uppercase tracking-wider mb-2">
                    THỐNG KÊ TỔNG QUAN
                  </div>

                  <div className="summary-row flex justify-between text-xs text-slate-700">
                    <span>Tổng số lượng sản phẩm:</span>
                    <strong className="text-slate-900">{totalQuantity} món</strong>
                  </div>

                  <div className="summary-row flex justify-between text-xs text-slate-700">
                    <span>Tổng tiền hàng:</span>
                    <strong className="text-slate-900">
                      {formatCurrency(order.totalAmount)}
                    </strong>
                  </div>

                  <div className="summary-row flex justify-between text-xs text-slate-700">
                    <span>Đã thanh toán:</span>
                    <strong className="text-emerald-700 font-bold">
                      {formatCurrency(paidAmount)}
                    </strong>
                  </div>

                  <div className="summary-divider border-t border-dashed border-slate-300 my-1" />

                  <div className="summary-row debt flex justify-between text-xs sm:text-sm font-black text-rose-600">
                    <span>Còn nợ / Thu khi nhận:</span>
                    <span className="text-base sm:text-lg">
                      {formatCurrency(remainingAmount)}
                    </span>
                  </div>
                </div>
              </div>

              {/* ════════ CHỮ KÝ ════════ */}
              <div className="signatures grid grid-cols-2 text-center mt-6 mb-8 sm:mb-12 bg-white">
                <div>
                  <div className="sig-title text-xs font-bold uppercase text-slate-900">
                    KHÁCH HÀNG NHẬN
                  </div>
                  <div className="sig-subtitle text-[11px] text-slate-500 italic mt-0.5 mb-10 sm:mb-14">
                    (Ký và ghi rõ họ tên)
                  </div>
                  <div className="sig-name font-semibold text-slate-700 text-xs">
                    {customerName}
                  </div>
                </div>

                <div>
                  <div className="sig-title text-xs font-bold uppercase text-slate-900">
                    NGƯỜI LẬP PHIẾU
                  </div>
                  <div className="sig-subtitle text-[11px] text-slate-500 italic mt-0.5 mb-10 sm:mb-14">
                    (Ký và ghi rõ họ tên)
                  </div>
                  <div className="sig-name font-semibold text-slate-700 text-xs">
                    {creatorName}
                  </div>
                </div>
              </div>

              {/* ════════ FOOTER ════════ */}
              <div className="footer-note text-center text-[10px] sm:text-[11px] italic text-slate-500 border-t border-dashed border-slate-200 pt-3">
                Cảm ơn quý khách đã tin tưởng và ủng hộ chúng tôi!
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ════════ TEMPLATE CHUYÊN DỤNG XUẤT PDF CHUẨN A4 (760px) ════════ */}
      <div
        style={{
          position: "fixed",
          left: "-9999px",
          top: "0px",
          width: "760px",
          zIndex: -9999,
          pointerEvents: "none",
        }}
      >
        <div
          ref={pdfTemplateRef}
          style={{
            width: "760px",
            backgroundColor: "#ffffff",
            padding: "24px 28px",
            boxSizing: "border-box",
            fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
            color: "#0f172a",
          }}
        >
          {/* 1. Header Hóa Đơn */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "2px solid #0f172a", paddingBottom: "12px", marginBottom: "14px" }}>
            <div>
              <div style={{ color: "#047857", fontSize: "12px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "3px" }}>
                {storeTitle}
              </div>
              <h1 style={{ color: "#0f172a", fontSize: "20px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.5px", margin: 0 }}>
                PHIẾU GIAO HÀNG / BẢNG KÊ ĐƠN HÀNG
              </h1>
            </div>
            <div style={{ textAlign: "right", fontSize: "11px", color: "#475569", lineHeight: 1.5 }}>
              <div>Ngày in: <strong style={{ color: "#0f172a" }}>{formatDate(new Date())}</strong></div>
              <div>Mã đơn: <strong style={{ color: "#0f172a", fontFamily: "monospace", fontSize: "12px" }}>{order.orderCode.startsWith("#") ? order.orderCode : `#${order.orderCode}`}</strong></div>
              <div>Số lượng đơn: <strong style={{ color: "#0f172a" }}>1 đơn</strong></div>
            </div>
          </div>

          {/* 2. Thông Tin Khách Hàng */}
          <div style={{ backgroundColor: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "12px 16px", marginBottom: "14px" }}>
            <div style={{ color: "#047857", fontSize: "11px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px" }}>
              THÔNG TIN KHÁCH HÀNG
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: "6px 16px", fontSize: "11.5px" }}>
              <div style={{ display: "flex", gap: "6px" }}>
                <span style={{ color: "#64748b", minWidth: "80px", fontWeight: 500 }}>Khách hàng:</span>
                <span style={{ color: "#0f172a", fontWeight: 700 }}>{customerName}</span>
              </div>
              <div style={{ display: "flex", gap: "6px" }}>
                <span style={{ color: "#64748b", minWidth: "80px", fontWeight: 500 }}>Số điện thoại:</span>
                <span style={{ color: "#0f172a", fontWeight: 700, fontFamily: "monospace" }}>{customerPhone}</span>
              </div>
              <div style={{ display: "flex", gap: "6px", gridColumn: "span 2" }}>
                <span style={{ color: "#64748b", minWidth: "80px", fontWeight: 500 }}>Địa chỉ:</span>
                <span style={{ color: "#0f172a", fontWeight: 500, lineHeight: 1.4 }}>{customerAddress}</span>
              </div>
              {order.customerInfo?.note && (
                <div style={{ display: "flex", gap: "6px", gridColumn: "span 2", color: "#92400e", fontStyle: "italic" }}>
                  <span style={{ color: "#64748b", minWidth: "80px", fontWeight: 500 }}>Ghi chú:</span>
                  <span style={{ fontWeight: 500 }}>{order.customerInfo.note}</span>
                </div>
              )}
            </div>
          </div>

          {/* 3. Bảng Sản Phẩm Đầy Đủ Cột Kèm MÃ SP */}
          <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "14px", fontSize: "11px" }}>
            <thead>
              <tr style={{ backgroundColor: "#0f172a", color: "#ffffff", fontWeight: 700, textTransform: "uppercase", fontSize: "10px", letterSpacing: "0.3px" }}>
                <th style={{ padding: "8px 6px", textAlign: "center", width: "34px", borderTopLeftRadius: "6px" }}>STT</th>
                <th style={{ padding: "8px 6px", textAlign: "center", width: "78px" }}>MÃ SP</th>
                <th style={{ padding: "8px 10px", textAlign: "left" }}>TÊN HÀNG / SẢN PHẨM</th>
                <th style={{ padding: "8px 6px", textAlign: "center", width: "52px" }}>ẢNH</th>
                <th style={{ padding: "8px 6px", textAlign: "center", width: "38px" }}>SL</th>
                <th style={{ padding: "8px 10px", textAlign: "right", width: "95px" }}>ĐƠN GIÁ</th>
                <th style={{ padding: "8px 10px", textAlign: "right", width: "100px", borderTopRightRadius: "6px" }}>THÀNH TIỀN</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item, idx) => {
                const pCode = getOrderItemCode(item);
                const itemTotal = item.total || item.price * item.quantity;
                return (
                  <tr key={idx} style={{ borderBottom: "1px solid #e2e8f0" }}>
                    <td style={{ padding: "8px 6px", textAlign: "center", fontWeight: 700, color: "#64748b" }}>{idx + 1}</td>
                    <td style={{ padding: "8px 6px", textAlign: "center", fontFamily: "monospace", fontWeight: 700, color: "#047857", fontSize: "11px" }}>
                      {pCode || "-"}
                    </td>
                    <td style={{ padding: "8px 10px" }}>
                      <div style={{ fontWeight: 700, color: "#0f172a", fontSize: "11.5px" }}>{cleanProductName(item.name)}</div>
                      {(item.size || item.color || item.sellingOption) && (
                        <div style={{ fontSize: "10px", color: "#64748b", marginTop: "2px", display: "flex", gap: "6px" }}>
                          {item.sellingOption && <span>Phân loại: {item.sellingOption}</span>}
                          {item.size && <span>• Size: {item.size}</span>}
                          {item.color && <span>• Màu: {item.color}</span>}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: "8px 6px", textAlign: "center" }}>
                      <img
                        src={getImageUrl(item.image)}
                        alt={item.name}
                        style={{ width: "38px", height: "38px", borderRadius: "6px", objectFit: "cover", border: "1px solid #cbd5e1", display: "block", margin: "0 auto" }}
                        crossOrigin="anonymous"
                      />
                    </td>
                    <td style={{ padding: "8px 6px", textAlign: "center", fontWeight: 700, color: "#0f172a" }}>{item.quantity}</td>
                    <td style={{ padding: "8px 10px", textAlign: "right", color: "#334155", fontWeight: 500 }}>{formatCurrency(item.price)}</td>
                    <td style={{ padding: "8px 10px", textAlign: "right", fontWeight: 700, color: "#0f172a" }}>{formatCurrency(itemTotal)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* 4. Thống Kê Tổng Quan */}
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "18px" }}>
            <div style={{ width: "290px", border: "1px solid #a7f3d0", backgroundColor: "#f0fdf4", borderRadius: "8px", padding: "10px 14px" }}>
              <div style={{ color: "#047857", fontSize: "10px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "6px" }}>
                THỐNG KÊ TỔNG QUAN
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#334155", padding: "3px 0" }}>
                <span>Tổng số lượng sản phẩm:</span>
                <strong style={{ color: "#0f172a" }}>{totalQuantity} món</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#334155", padding: "3px 0" }}>
                <span>Tổng tiền hàng:</span>
                <strong style={{ color: "#0f172a" }}>{formatCurrency(order.totalAmount)}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#334155", padding: "3px 0" }}>
                <span>Đã thanh toán:</span>
                <strong style={{ color: "#047857" }}>{formatCurrency(paidAmount)}</strong>
              </div>
              <div style={{ borderTop: "1px dashed #cbd5e1", margin: "5px 0" }} />
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12.5px", fontWeight: 900, color: "#e11d48", padding: "2px 0" }}>
                <span>Còn nợ / Thu khi nhận:</span>
                <span style={{ fontSize: "14px" }}>{formatCurrency(remainingAmount)}</span>
              </div>
            </div>
          </div>

          {/* 5. Chữ Ký Cân Đối */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", textAlign: "center", marginTop: "16px", marginBottom: "20px" }}>
            <div>
              <div style={{ fontSize: "11px", fontWeight: 800, textTransform: "uppercase", color: "#0f172a" }}>KHÁCH HÀNG NHẬN</div>
              <div style={{ fontSize: "10px", color: "#64748b", fontStyle: "italic", marginTop: "2px", marginBottom: "36px" }}>(Ký và ghi rõ họ tên)</div>
              <div style={{ fontSize: "11px", fontWeight: 700, color: "#334155" }}>{customerName}</div>
            </div>
            <div>
              <div style={{ fontSize: "11px", fontWeight: 800, textTransform: "uppercase", color: "#0f172a" }}>NGƯỜI LẬP PHIẾU</div>
              <div style={{ fontSize: "10px", color: "#64748b", fontStyle: "italic", marginTop: "2px", marginBottom: "36px" }}>(Ký và ghi rõ họ tên)</div>
              <div style={{ fontSize: "11px", fontWeight: 700, color: "#334155" }}>{creatorName}</div>
            </div>
          </div>

          {/* 6. Footer Note */}
          <div style={{ textAlign: "center", fontSize: "10px", fontStyle: "italic", color: "#64748b", borderTop: "1px dashed #e2e8f0", paddingTop: "10px" }}>
            Cảm ơn quý khách đã tin tưởng và ủng hộ chúng tôi!
          </div>
        </div>
      </div>
    </div>
  );
};
