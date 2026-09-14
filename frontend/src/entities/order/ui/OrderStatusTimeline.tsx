import React from 'react';
import { Clock, ClipboardCheck, Plane, Building2, Truck, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { OrderStatus } from '@/shared/types';
import { getOrderStatusText, getOrderStatusColor } from '@/shared/lib/formatters';

interface OrderStatusTimelineProps {
  status: OrderStatus;
}

export const OrderStatusTimeline: React.FC<OrderStatusTimelineProps> = ({ status }) => {
  if (status === 'CANCELLED') {
    return (
      <div className="flex items-center gap-3 p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-2xl text-rose-700 dark:text-rose-300 shadow-2xs animate-fade-in">
        <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-900/60 flex items-center justify-center flex-shrink-0 text-rose-600 dark:text-rose-400">
          <XCircle size={22} />
        </div>
        <div>
          <h4 className="font-bold text-sm text-rose-900 dark:text-rose-200">Đơn hàng đã bị huỷ</h4>
          <p className="text-xs text-rose-600 dark:text-rose-400 mt-0.5">Đơn hàng này đã kết thúc và không tiếp tục giao nhận.</p>
        </div>
      </div>
    );
  }

  if (status === 'FAILED') {
    return (
      <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-slate-800/80 border border-gray-200 dark:border-slate-700 rounded-2xl text-gray-700 dark:text-gray-300 shadow-2xs animate-fade-in">
        <div className="w-10 h-10 rounded-xl bg-gray-200 dark:bg-slate-700 flex items-center justify-center flex-shrink-0 text-gray-500 dark:text-gray-400">
          <AlertCircle size={22} />
        </div>
        <div>
          <h4 className="font-bold text-sm text-gray-900 dark:text-white">Giao hàng không thành công</h4>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Đơn vị vận chuyển chưa thể giao kiện hàng tới bạn.</p>
        </div>
      </div>
    );
  }

  const steps = [
    { key: 'PENDING', label: 'Chờ xử lý', icon: Clock },
    { key: 'CONFIRMED', label: 'Đã xác nhận', icon: ClipboardCheck },
    { key: 'SHIPPING_TO_VN', label: 'Hàng về VN', icon: Plane },
    { key: 'IN_VN_WAREHOUSE', label: 'Về kho VN', icon: Building2 },
    { key: 'SHIPPING', label: 'Vận chuyển', icon: Truck },
    { key: 'COMPLETED', label: 'Hoàn thành', icon: CheckCircle2 },
  ];

  const statusOrder = ['PENDING', 'CONFIRMED', 'SHIPPING_TO_VN', 'IN_VN_WAREHOUSE', 'SHIPPING', 'COMPLETED'];
  let currentIndex = statusOrder.indexOf(status);
  if (currentIndex === -1) {
    if (status === 'DELIVERED') currentIndex = 5;
    else currentIndex = 0;
  }

  const currentStepInfo = steps[currentIndex] || steps[0];
  const CurrentIcon = currentStepInfo.icon;
  const badgeColor = getOrderStatusColor(status);

  return (
    <div className="w-full bg-gradient-to-b from-blue-50/60 to-indigo-50/40 dark:from-slate-800/90 dark:to-slate-900/90 p-4 sm:p-5 rounded-2xl border border-blue-100/80 dark:border-slate-700/80 shadow-xs">
      {/* Header trạng thái hiện tại */}
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-blue-100/60 dark:border-slate-700/60">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
            <CurrentIcon size={16} />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-gray-400 dark:text-slate-400 block tracking-wider">Tiến trình đơn hàng</span>
            <span className="text-xs sm:text-sm font-extrabold text-gray-900 dark:text-white">
              Bước {currentIndex + 1}/{steps.length}: <span className="text-blue-600 dark:text-blue-400">{getOrderStatusText(status)}</span>
            </span>
          </div>
        </div>
        <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${badgeColor.bg} ${badgeColor.text} ${badgeColor.border}`}>
          {getOrderStatusText(status)}
        </span>
      </div>

      {/* Stepper nodes */}
      <div className="relative px-2 sm:px-4">
        {/* Progress Line Background */}
        <div className="absolute top-[15px] left-4 right-4 h-1 bg-gray-200 dark:bg-slate-700 rounded-full z-0" />
        
        {/* Active Line Fill */}
        <div
          className="absolute top-[15px] left-4 h-1 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full z-0 transition-all duration-500 ease-out"
          style={{
            width: `${(Math.max(0, currentIndex) / (steps.length - 1)) * 92}%`,
          }}
        />

        {/* Steps Grid */}
        <div className="flex items-start justify-between relative z-10">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            const isPassed = idx <= currentIndex;
            const isCurrent = idx === currentIndex;

            return (
              <div key={step.key} className="flex flex-col items-center group">
                <div
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                    isCurrent
                      ? 'bg-blue-600 text-white ring-4 ring-blue-500/25 shadow-md scale-110'
                      : isPassed
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'bg-white dark:bg-slate-800 text-gray-400 dark:text-slate-500 border-2 border-gray-200 dark:border-slate-700'
                  }`}
                >
                  <Icon size={14} className="sm:size-4" />
                </div>
                <span
                  className={`mt-2 text-[9px] sm:text-[11px] text-center font-bold max-w-[50px] sm:max-w-[70px] leading-tight break-words transition-colors ${
                    isCurrent
                      ? 'text-blue-600 dark:text-blue-400 font-extrabold'
                      : isPassed
                      ? 'text-gray-800 dark:text-slate-200 font-semibold'
                      : 'text-gray-400 dark:text-slate-500 font-medium'
                  }`}
                >
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
