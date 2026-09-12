import React from 'react';
import { Clock, Plane, Building2, Truck, CheckCircle2, XCircle } from 'lucide-react';
import { OrderStatus } from '@/shared/types';

interface OrderStatusTimelineProps {
  status: OrderStatus;
}

export const OrderStatusTimeline: React.FC<OrderStatusTimelineProps> = ({ status }) => {
  if (status === 'CANCELLED') {
    return (
      <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700">
        <XCircle size={20} className="text-rose-500" />
        <span className="font-semibold text-sm">Đơn hàng này đã bị huỷ</span>
      </div>
    );
  }

  if (status === 'FAILED') {
    return (
      <div className="flex items-center gap-2 p-3 bg-gray-100 border border-gray-300 rounded-xl text-gray-700">
        <XCircle size={20} className="text-gray-500" />
        <span className="font-semibold text-sm">Giao hàng không thành công</span>
      </div>
    );
  }

  const steps = [
    { key: 'PENDING', label: 'Chờ xử lý', icon: Clock },
    { key: 'SHIPPING_TO_VN', label: 'Hàng về VN', icon: Plane },
    { key: 'IN_VN_WAREHOUSE', label: 'Về kho VN', icon: Building2 },
    { key: 'SHIPPING', label: 'Vận chuyển', icon: Truck },
    { key: 'COMPLETED', label: 'Hoàn thành', icon: CheckCircle2 },
  ];

  const statusOrder = ['PENDING', 'SHIPPING_TO_VN', 'IN_VN_WAREHOUSE', 'SHIPPING', 'COMPLETED'];
  let currentIndex = statusOrder.indexOf(status);
  if (currentIndex === -1) {
    if (status === 'CONFIRMED') currentIndex = 1;
    else if (status === 'DELIVERED') currentIndex = 4;
    else currentIndex = 0;
  }

  return (
    <div className="w-full py-4">
      <div className="flex items-center justify-between relative">
        {/* Connecting line */}
        <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-200 -translate-y-1/2 z-0" />
        <div
          className="absolute top-1/2 left-0 h-1 bg-blue-600 -translate-y-1/2 z-0 transition-all duration-500"
          style={{
            width: `${(Math.max(0, currentIndex) / (steps.length - 1)) * 100}%`,
          }}
        />

        {/* Steps */}
        {steps.map((step, idx) => {
          const Icon = step.icon;
          const isPassed = idx <= currentIndex;
          const isCurrent = idx === currentIndex;

          return (
            <div key={step.key} className="flex flex-col items-center relative z-10">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center text-white transition-all duration-300 ${
                  isPassed
                    ? isCurrent
                      ? 'bg-blue-600 ring-4 ring-blue-100 scale-110 shadow-md'
                      : 'bg-blue-600'
                    : 'bg-gray-300 text-gray-500'
                }`}
              >
                <Icon size={18} />
              </div>
              <span
                className={`mt-2 text-xs text-center font-medium whitespace-nowrap ${
                  isCurrent
                    ? 'text-blue-600 font-bold'
                    : isPassed
                    ? 'text-gray-900'
                    : 'text-gray-400'
                }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
