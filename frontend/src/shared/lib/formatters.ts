export function formatCurrency(amount: number): string {
  if (amount === undefined || amount === null) return '0đ';
  return new Intl.NumberFormat('vi-VN').format(amount) + 'đ';
}

export function formatDate(dateString: string | Date): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function getOrderStatusText(status: string): string {
  switch (status) {
    case 'PENDING':
      return 'Chờ xử lý';
    case 'SHIPPING_TO_VN':
      return 'Hàng đang về Việt Nam';
    case 'IN_VN_WAREHOUSE':
      return 'Đã về kho Việt Nam';
    case 'SHIPPING':
      return 'Vận chuyển';
    case 'COMPLETED':
      return 'Hoàn thành';
    case 'CANCELLED':
      return 'Đã huỷ';
    case 'CONFIRMED':
      return 'Đã xác nhận';
    case 'DELIVERED':
      return 'Đã giao';
    case 'FAILED':
      return 'Giao hàng thất bại';
    default:
      return status;
  }
}

export function getOrderStatusColor(status: string): { bg: string; text: string; border: string } {
  switch (status) {
    case 'PENDING':
      return { 
        bg: 'bg-amber-50 dark:bg-amber-950/50', 
        text: 'text-amber-700 dark:text-amber-300', 
        border: 'border-amber-200 dark:border-amber-700/60' 
      };
    case 'SHIPPING_TO_VN':
      return { 
        bg: 'bg-sky-50 dark:bg-sky-950/50', 
        text: 'text-sky-700 dark:text-sky-300', 
        border: 'border-sky-200 dark:border-sky-700/60' 
      };
    case 'IN_VN_WAREHOUSE':
      return { 
        bg: 'bg-purple-50 dark:bg-purple-950/50', 
        text: 'text-purple-700 dark:text-purple-300', 
        border: 'border-purple-200 dark:border-purple-700/60' 
      };
    case 'SHIPPING':
      return { 
        bg: 'bg-blue-50 dark:bg-blue-950/50', 
        text: 'text-blue-700 dark:text-blue-300', 
        border: 'border-blue-200 dark:border-blue-700/60' 
      };
    case 'COMPLETED':
      return { 
        bg: 'bg-emerald-50 dark:bg-emerald-950/50', 
        text: 'text-emerald-700 dark:text-emerald-300', 
        border: 'border-emerald-200 dark:border-emerald-700/60' 
      };
    case 'CANCELLED':
      return { 
        bg: 'bg-rose-50 dark:bg-rose-950/50', 
        text: 'text-rose-700 dark:text-rose-300', 
        border: 'border-rose-200 dark:border-rose-700/60' 
      };
    case 'CONFIRMED':
      return { 
        bg: 'bg-indigo-50 dark:bg-indigo-950/50', 
        text: 'text-indigo-700 dark:text-indigo-300', 
        border: 'border-indigo-200 dark:border-indigo-700/60' 
      };
    case 'DELIVERED':
      return { 
        bg: 'bg-emerald-50 dark:bg-emerald-950/50', 
        text: 'text-emerald-700 dark:text-emerald-300', 
        border: 'border-emerald-200 dark:border-emerald-700/60' 
      };
    case 'FAILED':
      return { 
        bg: 'bg-gray-100 dark:bg-slate-800', 
        text: 'text-gray-700 dark:text-slate-300', 
        border: 'border-gray-300 dark:border-slate-700' 
      };
    default:
      return { 
        bg: 'bg-gray-50 dark:bg-slate-800', 
        text: 'text-gray-700 dark:text-slate-300', 
        border: 'border-gray-200 dark:border-slate-700' 
      };
  }
}

export function getPaymentMethodText(method: string): string {
  switch (method) {
    case 'COD':
      return 'Thanh toán COD';
    case 'BANK_TRANSFER':
      return 'Chuyển khoản QR';
    case 'ONLINE':
      return 'Thanh toán Online';
    default:
      return method || 'COD';
  }
}

/**
 * Trả về tên thuần của sản phẩm, loại bỏ triệt để phần variant nối thêm nếu có
 * Ví dụ: "Laptop ASUS ROG Zephyrus G16 RTX 4070 (32GB RAM / 1TB SSD - Eclipse Gray (Xám Nhật Thực))" -> "Laptop ASUS ROG Zephyrus G16 RTX 4070"
 */
export function cleanProductName(name?: string): string {
  if (!name) return '';
  if (name.includes(' (')) {
    return name.split(' (')[0].trim();
  }
  return name.trim();
}



