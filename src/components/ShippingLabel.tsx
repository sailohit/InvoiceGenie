import { OrderData } from '@/utils/orderUtils';
import { Package, MapPin, Truck } from 'lucide-react';

interface ShippingLabelProps {
  order: OrderData;
}

export const ShippingLabel = ({ order }: ShippingLabelProps) => {
  const customerName = `${order.firstName} ${order.lastName}`.trim();
  const fullAddress = [order.building, order.streetAddress, order.locality].filter(Boolean).join(', ');

  return (
    <div id="shipping-label" className="bg-white text-gray-900 p-2.5 mx-auto border-4 border-gray-900 text-[10px]" style={{ width: '101.6mm', height: '152.4mm', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div className="border-b-2 border-gray-900 pb-0.5 mb-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {order.companyLogo ? (
              <img
                src={order.companyLogo}
                alt="Logo"
                className="w-9 h-9 object-contain"
              />
            ) : (
              <Truck className="w-8 h-8" />
            )}
            <span className="font-bold text-sm uppercase tracking-wide">Shipping Label</span>
          </div>
          <div className="text-right">
            <p className="text-[8px] text-gray-600">Order ID</p>
            <p className="font-bold text-xs">{order.orderNumber || 'N/A'}</p>
          </div>
        </div>
      </div>

      {/* Barcode Placeholder */}
      <div className="flex justify-center mb-1 py-1 bg-gray-50 border border-gray-200 rounded">
        <div className="text-center">
          <div className="flex justify-center gap-[1px] mb-0.5">
            {Array.from({ length: 44 }).map((_, i) => (
              <div
                key={i}
                className="bg-gray-900"
                style={{
                  width: i % 4 === 0 ? '2px' : '1px',
                  height: '20px',
                }}
              />
            ))}
          </div>
          <p className="text-[7px] font-mono tracking-wider">{order.orderNumber || 'ORDER-ID'}</p>
          {order.trackingNumber && (
            <p className="text-[7px] text-gray-500">AWB: {order.trackingNumber}</p>
          )}
        </div>
      </div>

      <div className="mb-1 p-1 bg-gray-100 rounded border border-gray-300">
        <div className="flex items-start gap-2">
          <Package className="w-3 h-3 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-[8px] font-semibold uppercase text-gray-600 mb-0.5">From:</p>
            <p className="font-bold text-xs">{order.companyName}</p>
            <p className="text-[9px] text-gray-600 leading-tight">{order.companyAddress}</p>
            <p className="text-[9px] text-gray-600">Ph: {order.companyPhone}</p>
          </div>
        </div>
      </div>

      {/* To Section - Main Focus (NO PHONE, NO PRICE) */}
      <div className="p-1.5 border-2 border-gray-900 rounded bg-white mb-1">
        <div className="flex items-start gap-2">
          <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-[7px] font-semibold uppercase text-gray-600 mb-0.5">Deliver To:</p>
            <p className="font-bold text-sm mb-0.5 leading-tight">{customerName || 'Customer Name'}</p>
            <p className="text-[11px] leading-snug text-gray-800">
              {fullAddress}
            </p>
            <p className="text-[11px] text-gray-800">
              {order.city}, {order.state}
            </p>
            <p className="text-[11px] text-gray-800 font-medium">
              Ph: {order.phone}
            </p>
            <div className="mt-1 pt-1 border-t border-gray-200">
              <span className="inline-block bg-gray-900 text-white px-3 py-0.5 rounded font-bold text-base tracking-wider">
                Pincode: {order.pincode || '000000'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Product Info (NO PRICE) */}
      <div className="grid grid-cols-3 gap-2 text-[9px] border-t border-gray-200 pt-1 flex-grow min-h-0 overflow-hidden">
        <div className="space-y-0.5">
          <p className="text-gray-500 uppercase font-semibold text-[6px]">Product</p>
          <p className="font-medium leading-tight text-[9px]">{order.productName || 'N/A'}</p>
        </div>
        <div className="space-y-0.5">
          <p className="text-gray-500 uppercase font-semibold text-[6px]">Qty</p>
          <p className="font-medium text-[9px]">{order.quantity}</p>
        </div>
        <div className="space-y-0.5 text-right">
          <p className="text-gray-500 uppercase font-semibold text-[6px]">Payment</p>
          <div className="pt-0.5">
            <span className={`inline-block px-1.5 py-0.5 rounded text-[6.5px] font-bold uppercase tracking-wider ${order.paymentMethod.toLowerCase() === 'cod'
              ? 'bg-orange-100 text-orange-700 border border-orange-300'
              : 'bg-green-100 text-green-700 border border-green-300'
              }`}>
              {order.paymentMethod}
            </span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-1 pt-1 border-t-2 border-dashed border-gray-300 text-center">
        <p className="text-[6px] text-gray-500 uppercase font-medium">Handle with care • Do not bend</p>
      </div>
    </div>
  );
};
