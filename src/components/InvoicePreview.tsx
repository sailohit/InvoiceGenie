import { OrderData } from '@/utils/orderUtils';
import { FileText } from 'lucide-react';

interface InvoicePreviewProps {
  order: OrderData;
}

export const InvoicePreview = ({ order }: InvoicePreviewProps) => {
  const qty = Number(order.quantity) || 0;
  const price = Number(order.unitPrice) || 0;
  const shipping = Number(order.shippingCharges) || 0;
  const taxRate = Number(order.taxRate) || 0;

  const subTotal = price * qty;
  const taxAmount = subTotal * (taxRate / 100);
  const grandTotal = subTotal + taxAmount + shipping;

  const customerName = `${order.firstName} ${order.lastName}`.trim();
  const fullAddress = [order.building, order.streetAddress, order.locality].filter(Boolean).join(', ');

  const formatCurrency = (amount: number) => {
    const currency = order.currency || 'INR';
    // Use en-IN for INR to get lakhs/crores formatting, else en-US or standard
    const locale = currency === 'INR' ? 'en-IN' : 'en-US';
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2
    }).format(amount);
  };

  const template = order.template || 'modern';

  // Theme configuration
  const themes = {
    modern: {
      primary: 'bg-[#1e3a5f] text-white',
      secondary: 'bg-[#f0f7ff] border-[#1e3a5f]/10',
      textheader: 'text-[#1e3a5f]',
      border: 'border-gray-200'
    },
    minimal: {
      primary: 'bg-black text-white',
      secondary: 'bg-gray-50 border-gray-200',
      textheader: 'text-black',
      border: 'border-black'
    },
    business: {
      primary: 'bg-slate-800 text-white',
      secondary: 'bg-slate-50 border-slate-200',
      textheader: 'text-slate-800',
      border: 'border-slate-300'
    }
  };

  const theme = themes[template as keyof typeof themes] || themes.modern;

  return (
    <div id="invoice-preview" className={`bg-white text-gray-900 p-8 w-[210mm] mx-auto shadow-xl ${template === 'business' ? 'font-serif' : ''}`} style={{ minHeight: '297mm' }}>
      {/* Header */}
      <div className={`flex justify-between items-start mb-8 pb-6 border-b-2 ${theme.border}`}>
        <div>
          <div className="flex items-center gap-3 mb-2">
            {order.companyLogo ? (
              <img
                src={order.companyLogo}
                alt="Company Logo"
                className="w-14 h-14 object-contain"
              />
            ) : (
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${theme.primary}`}>
                <FileText className="w-7 h-7 text-white" />
              </div>
            )}
            <div>
              <h1 className={`text-2xl font-bold ${theme.textheader}`}>{order.companyName}</h1>
              <p className="text-xs text-gray-500">Tax Invoice</p>
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-600 space-y-1">
            <p>{order.companyAddress}</p>

            <p>Phone: {order.companyPhone}</p>
            <p>Email: {order.companyEmail}</p>
          </div>
        </div>
        <div className="text-right">
          <div className={`${theme.primary} px-6 py-3 rounded-lg mb-4`}>
            <p className="text-xs opacity-80">Invoice Number</p>
            <p className="text-xl font-bold">{order.invoiceNumber || 'N/A'}</p>
          </div>
          <div className="text-sm text-gray-600">
            <p><span className="font-medium">Date:</span> {order.orderDate}</p>
            <p><span className="font-medium">Payment:</span> {order.paymentMethod}</p>
          </div>
        </div>
      </div>

      {/* Bill To */}
      <div className="mb-8 grid grid-cols-2 gap-8">
        <div className={`p-5 rounded-lg border ${theme.border} bg-gray-50`}>
          <h3 className={`text-xs font-semibold uppercase tracking-wide mb-3 ${theme.textheader}`}>Bill To / Ship To</h3>
          <p className="font-semibold text-lg text-gray-900">{customerName || 'Customer Name'}</p>
          <div className="text-sm text-gray-600 mt-2 space-y-1">
            <p>{fullAddress}</p>
            <p>{order.city}, {order.state} - {order.pincode}</p>
            <p>Phone: {order.phone}</p>
            <p>Email: {order.email}</p>
          </div>
        </div>
        <div className={`p-5 rounded-lg border ${theme.secondary}`}>
          <h3 className={`text-xs font-semibold uppercase tracking-wide mb-3 ${theme.textheader}`}>Order Summary</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Order ID:</span>
              <span className="font-medium">{order.orderNumber || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Order Date:</span>
              <span className="font-medium">{order.orderDate}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Total Items:</span>
              <span className="font-medium">{qty}</span>
            </div>
            {order.trackingNumber && (
              <div className="flex justify-between">
                <span className="text-gray-600">Tracking #:</span>
                <span className="font-medium">{order.trackingNumber}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Items Table */}
      <div className="mb-8">
        <table className="w-full border-collapse">
          <thead>
            <tr className={`${theme.primary}`}>
              <th className="text-left p-3 text-sm font-semibold rounded-tl-lg w-12">S.No</th>
              <th className="text-left p-3 text-sm font-semibold">Product Description</th>
              <th className="text-center p-3 text-sm font-semibold w-16">Qty</th>
              <th className="text-right p-3 text-sm font-semibold w-32">Unit Price</th>
              <th className="text-right p-3 text-sm font-semibold rounded-tr-lg w-36">Total</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-gray-200 hover:bg-gray-50">
              <td className="p-4 text-sm">1</td>
              <td className="p-4 text-sm font-medium leading-relaxed">{order.productName || 'Product'}</td>
              <td className="p-4 text-sm text-center">{qty}</td>
              <td className="p-4 text-sm text-right whitespace-nowrap">{formatCurrency(price)}</td>
              <td className="p-4 text-sm text-right font-medium whitespace-nowrap">{formatCurrency(subTotal)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Totals */}
      <div className="flex justify-end mb-8">
        <div className="w-80">
          <div className="space-y-2 text-sm">
            <div className={`flex justify-between py-2 border-b ${theme.border}`}>
              <span className="text-gray-600">Subtotal:</span>
              <span>{formatCurrency(subTotal)}</span>
            </div>

            <div className={`flex justify-between py-2 border-b ${theme.border}`}>
              <span className="text-gray-600">{order.companyTaxName || 'Tax'} ({taxRate}%):</span>
              <span>{formatCurrency(taxAmount)}</span>
            </div>

            <div className={`flex justify-between py-2 border-b ${theme.border}`}>
              <span className="text-gray-600">Shipping Charges:</span>
              <span>{formatCurrency(shipping)}</span>
            </div>

            <div className={`flex justify-between py-3 rounded-lg px-4 mt-2 ${theme.primary}`}>
              <span className="font-semibold">Grand Total:</span>
              <span className="font-bold text-lg">{formatCurrency(grandTotal)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Delivery Notes */}
      {order.deliveryNotes && (
        <div className="mb-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-xs font-semibold text-yellow-800 uppercase mb-1">Delivery Notes</p>
          <p className="text-sm text-yellow-700">{order.deliveryNotes}</p>
        </div>
      )}

      {/* Footer */}
      <div className="border-t-2 border-gray-200 pt-6 mt-auto">
        <div className="grid grid-cols-2 gap-8">
          <div>
            <h4 className="text-xs font-semibold text-[#1e3a5f] uppercase tracking-wide mb-2">Terms & Conditions</h4>
            <ul className="text-xs text-gray-500 space-y-1">
              <li>• Goods once sold will not be taken back</li>
              <li>• Subject to local jurisdiction only</li>
              <li>• E&OE - Errors and Omissions Excepted</li>
            </ul>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500 mb-2">Authorized Signatory</p>
            {order.signature && (
              <img src={order.signature} alt="Signature" className="h-12 object-contain ml-auto mb-1" />
            )}
            <div className="border-t border-gray-300 pt-2 inline-block">
              <p className="text-sm font-semibold text-[#1e3a5f]">{order.companyName}</p>
            </div>
          </div>
        </div>
        <div className="text-center mt-6 pt-4 border-t border-gray-100">
          <p className="text-xs text-gray-400">This is a computer-generated invoice and does not require a physical signature.</p>
        </div>
      </div>
    </div>
  );
};
