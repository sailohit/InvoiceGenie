import { useState, useEffect, useMemo, useRef } from 'react';
import { generatePDF } from '@/utils/pdfGenerator';
import { CommandMenu } from '@/components/CommandMenu';
import { OrderHistory, OrderHistoryRef } from '@/components/OrderHistory';
import { DataInput } from '@/components/DataInput';
import { OrderDetailsForm } from '@/components/OrderDetailsForm';
import { PreviewTabs } from '@/components/PreviewTabs';
import { CompanySettings, CompanyInfo } from '@/components/CompanySettings';
import { parseCustomerData, createDefaultOrderInfo, OrderData, loadCompanyInfo, defaultCompanyInfo } from '@/utils/orderUtils';
import { db, getNextSequence, incrementSequence, saveOrder } from '@/db/db';
import { FileText, Package, ShieldCheck, Trash2, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { CustomerDetailsForm } from '@/components/CustomerDetailsForm';
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

const Index = () => {
  const [commandOpen, setCommandOpen] = useState(false);
  const orderHistoryRef = useRef<OrderHistoryRef>(null);

  const [pastedData, setPastedData] = useState('');
  const [orderDetails, setOrderDetails] = useState<ReturnType<typeof createDefaultOrderInfo>>(createDefaultOrderInfo);
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>(loadCompanyInfo);
  const [customerData, setCustomerData] = useState<Partial<OrderData> | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [activeOrderId, setActiveOrderId] = useState<number | null>(null);
  const { user } = useAuth();

  // 1. Initial Load
  useEffect(() => {
    const initApp = async () => {
      const savedCompany = await db.settings.get('companyInfo');
      if (savedCompany) setCompanyInfo(savedCompany.value);

      const savedPasted = await db.settings.get('pastedData');
      if (savedPasted) setPastedData(savedPasted.value || '');

      const savedOrder = await db.settings.get('orderDetails');
      if (savedOrder) setOrderDetails(savedOrder.value);

      const savedCustomer = await db.settings.get('customerData');
      if (savedCustomer) setCustomerData(savedCustomer.value);
    };
    initApp();
  }, []);

  // 2. Force sync IDs if they are missing
  useEffect(() => {
    const syncIDs = async () => {
      if (!orderDetails.orderNumber || !orderDetails.invoiceNumber) {
        const nextOrd = await getNextSequence('order');
        const nextInv = await getNextSequence('invoice');
        setOrderDetails(prev => ({
          ...prev,
          orderNumber: prev.orderNumber || nextOrd,
          invoiceNumber: prev.invoiceNumber || nextInv
        }));
      }
    };
    syncIDs();
  }, [orderDetails.orderNumber, orderDetails.invoiceNumber]);

  // 3. Persistence effects (Saving only, loading handled in initApp)
  useEffect(() => {
    if (pastedData) db.settings.put({ key: 'pastedData', value: pastedData });
  }, [pastedData]);

  useEffect(() => {
    db.settings.put({ key: 'orderDetails', value: orderDetails });
  }, [orderDetails]);

  // Auto-update tracking number in DB for active orders
  useEffect(() => {
    if (activeOrderId && orderDetails.trackingNumber) {
      const updateTracking = async () => {
        try {
          await db.orders.update(activeOrderId, { trackingNumber: orderDetails.trackingNumber });
          // Optional: Toast or indicator could go here, but might be too noisy
        } catch (error) {
          console.error("Failed to auto-update tracking number", error);
        }
      };
      // Debounce slightly to avoid thrashing DB on every keystroke
      const timeoutId = setTimeout(updateTracking, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [activeOrderId, orderDetails.trackingNumber]);

  useEffect(() => {
    db.settings.put({ key: 'companyInfo', value: companyInfo });
  }, [companyInfo]);

  useEffect(() => {
    if (customerData) db.settings.put({ key: 'customerData', value: customerData });
    else db.settings.delete('customerData');
  }, [customerData]);

  // 4. Memos & Handlers
  const handleDataPaste = async (data: string) => {
    setPastedData(data);
    const parsed = parseCustomerData(data);
    if (parsed) {
      setCustomerData(parsed);

      let newDetails = { ...orderDetails };
      let hasChanges = false;

      // 1. Sync IDs if missing (fix for ID generation)
      if (!newDetails.orderNumber || !newDetails.invoiceNumber) {
        const nextOrd = await getNextSequence('order');
        const nextInv = await getNextSequence('invoice');
        newDetails.orderNumber = newDetails.orderNumber || nextOrd;
        newDetails.invoiceNumber = newDetails.invoiceNumber || nextInv;
        hasChanges = true;
      }

      // 2. Sync Order Date from Timestamp (fix for Date issue)
      if (parsed.timestamp) {
        const dateObj = new Date(parsed.timestamp);
        if (!isNaN(dateObj.getTime())) {
          const year = dateObj.getFullYear();
          const month = String(dateObj.getMonth() + 1).padStart(2, '0');
          const day = String(dateObj.getDate()).padStart(2, '0');
          newDetails.orderDate = `${year}-${month}-${day}`;
          hasChanges = true;
        }
      }

      if (hasChanges) {
        setOrderDetails(newDetails);
      }
    }
  };

  const fullOrderData: OrderData | null = useMemo(() => {
    if (!customerData) return null;

    // Calculate totals dynamically before saving/using
    const qty = Number(orderDetails.quantity) || 0;
    const price = Number(orderDetails.unitPrice) || 0;
    const shipping = Number(orderDetails.shippingCharges) || 0;
    const taxRate = Number(orderDetails.taxRate) || 0;

    const subTotal = qty * price;
    const taxAmount = subTotal * (taxRate / 100);
    const totalAmount = subTotal + taxAmount + shipping;

    const calculatedDetails = {
      ...orderDetails,
      taxAmount,
      totalAmount
    };

    return { ...customerData, ...calculatedDetails, ...companyInfo } as OrderData;
  }, [customerData, orderDetails, companyInfo]);

  const handleDownloadComplete = async () => {
    if (fullOrderData) {
      // If we are editing an existing historical order (activeOrderId is set),
      // we might want to update THAT record instead of creating a new one.
      // However, usually "Download/Save" implies "Done with this, save it".
      // If the user wants to creating a NEW record from an old one, clear ID first?
      // Logic: If activeOrderId exists, update it. Else add new.

      if (activeOrderId) {
        await db.orders.put({ ...fullOrderData, id: activeOrderId });
        toast.success("Order updated in history!");
      } else {
        await saveOrder(fullOrderData);
        await incrementSequence('order');
        await incrementSequence('invoice');
        toast.success("Order saved to history and numbers updated!");
      }

      setPastedData('');
      setCustomerData(null);
      setActiveOrderId(null); // Reset active order
      db.settings.delete('pastedData');

      const nextOrd = await getNextSequence('order');
      const nextInv = await getNextSequence('invoice');

      setOrderDetails({
        ...createDefaultOrderInfo(),
        orderNumber: nextOrd,
        invoiceNumber: nextInv,
        currency: companyInfo.currency || 'INR',
        taxRate: companyInfo.defaultTaxRate || 18,
        companyTaxName: companyInfo.taxName || 'GST'
      });
      setIsSaved(false);
    }
  };

  const handleViewHistoryOrder = (order: any) => {
    // Construct pasted data from the order if possible, or just the fields
    // For now, simpler to just populate fields directly if they are already in order object

    // Merge with defaults to ensure new fields (tax/currency) exist if opening old order
    const defaults = createDefaultOrderInfo();

    setOrderDetails({
      ...defaults,
      // Overwrite with saved data
      orderNumber: order.orderNumber,
      invoiceNumber: order.invoiceNumber,
      orderDate: order.orderDate,
      productName: order.productName,
      quantity: order.quantity,
      unitPrice: order.unitPrice,
      shippingCharges: order.shippingCharges,
      paymentMethod: order.paymentMethod,
      trackingNumber: order.trackingNumber || '',
      // Restore financials if they exist, else keep defaults
      currency: order.currency || defaults.currency,
      taxRate: order.taxRate || defaults.taxRate,
      companyTaxName: order.companyTaxName || defaults.companyTaxName,
      template: order.template || defaults.template,
      status: order.status || defaults.status,
      dueDate: order.dueDate || defaults.dueDate
      // Note: taxAmount/totalAmount might be missing in old orders, but they are derived or just fields.
    });

    setCustomerData(order); // Explicitly set customer state from history
    setActiveOrderId(order.id); // Set the active ID for updates

    // We can't perfectly reconstruct the RAW pasted string if it was multi-row,
    // but we can make a fake row for the UI to "recognize" the data.
    const fakePasted = `First Name,Last Name,City,State\n${order.firstName},${order.lastName},${order.city},${order.state}`;
    setPastedData(fakePasted);
    toast.success(`Loaded history for ${order.firstName}`);
  };

  const handleReset = async () => {
    if (confirm('Are you sure you want to clear current draft?')) {
      setPastedData('');
      setCustomerData(null);
      db.settings.delete('pastedData');
      db.settings.delete('orderDetails');

      const nextOrd = await getNextSequence('order');
      const nextInv = await getNextSequence('invoice');
      setOrderDetails({
        ...createDefaultOrderInfo(),
        orderNumber: nextOrd,
        invoiceNumber: nextInv,
        // Inherit defaults
        currency: companyInfo.currency || 'INR',
        taxRate: companyInfo.defaultTaxRate || 18,
        companyTaxName: companyInfo.taxName || 'GST',
        template: companyInfo.defaultTemplate || 'modern',
        status: 'Pending',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      });
      setActiveOrderId(null);
      toast.success('Draft cleared');
    }
  };

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      const isCtrlOrCmd = e.ctrlKey || e.metaKey;

      if (e.key === 'k' && isCtrlOrCmd) {
        e.preventDefault();
        setCommandOpen(prev => !prev);
      }

      if (e.key === 's' && isCtrlOrCmd) {
        e.preventDefault();
        handleDownloadComplete();
      }

      if (e.key === 'n' && isCtrlOrCmd) {
        e.preventDefault();
        handleReset();
      }

      if (e.key === 'p' && isCtrlOrCmd) {
        e.preventDefault();
        const namePrefix = fullOrderData?.firstName ? `${fullOrderData.firstName}-` : '';
        await generatePDF('invoice-preview', `${namePrefix}Invoice`);
        toast.success('PDF Export Initiated');
      }

      if (e.key === 'f' && isCtrlOrCmd) {
        e.preventDefault();
        orderHistoryRef.current?.open();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [fullOrderData, companyInfo]); // Dependencies for actions

  const hasValidData = customerData !== null &&
    Boolean(customerData.firstName || customerData.lastName || customerData.city);

  return (
    <div className="space-y-8">
      <CommandMenu
        open={commandOpen}
        onOpenChange={setCommandOpen}
        actions={{
          handleNew: handleReset,
          handleSave: handleDownloadComplete,
          handlePrint: async () => {
            const namePrefix = fullOrderData?.firstName ? `${fullOrderData.firstName}-` : '';
            await generatePDF('invoice-preview', `${namePrefix}Invoice`);
            toast.success('PDF Export Initiated');
          },
          handleSearch: () => orderHistoryRef.current?.open()
        }}
      />

      {/* Page Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-card/50 backdrop-blur-sm p-6 rounded-2xl border border-border/50 shadow-sm">
        <div>
          <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">New Order</h2>
          <p className="text-muted-foreground mt-1">Create invoices and shipping labels instantly.</p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <OrderHistory ref={orderHistoryRef} onViewOrder={handleViewHistoryOrder} />
          {user?.role === 'admin' && (
            <CompanySettings companyInfo={companyInfo} onChange={setCompanyInfo} />
          )}
          <Button
            variant="destructive"
            size="sm"
            onClick={handleReset}
            className="gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Clear
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="bg-card rounded-xl shadow-lg p-6 border border-border">
            <DataInput onDataPaste={handleDataPaste} pastedData={pastedData} hasValidData={hasValidData} />
          </div>

          {customerData && (
            <div className="bg-card rounded-xl shadow-lg p-6 border border-border">
              <CustomerDetailsForm customerData={customerData} onChange={setCustomerData} />
            </div>
          )}

          <div className="bg-card rounded-xl shadow-lg p-6 border border-border">
            <OrderDetailsForm orderDetails={orderDetails} onChange={setOrderDetails} />
          </div>
        </div>

        <div className="bg-card rounded-xl shadow-lg p-6 border border-border overflow-hidden">
          {fullOrderData ? (
            <PreviewTabs order={fullOrderData} onDownload={handleDownloadComplete} />
          ) : (
            <div className="flex flex-col items-center justify-center h-full min-h-[500px] text-center p-8">
              <FileText className="w-16 h-16 text-muted-foreground mb-4 opacity-20" />
              <h3 className="text-xl font-semibold mb-2">No Order Selected</h3>
              <p className="text-muted-foreground">Paste data or select an order from history to preview</p>
            </div>
          )}
        </div>
      </div>

      {/* Footer info embedded or just removed since Sidebar covers it */}
      <div className="flex items-center justify-center gap-2 text-sm text-green-700/80 bg-green-50/50 p-3 rounded-lg border border-green-100/50">
        <ShieldCheck className="w-4 h-4" />
        <span className="font-medium">100% Client-Side Processing. No data stored on servers.</span>
      </div>
    </div>
  );
};

export default Index;
