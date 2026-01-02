import { useState } from 'react';
import { OrderData } from '@/utils/orderUtils';
import { InvoicePreview } from './InvoicePreview';
import { ShippingLabel } from './ShippingLabel';
import { generatePDF } from '@/utils/pdfGenerator';
import { FileText, Tag, Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface PreviewTabsProps {
  order: OrderData;
  onDownload?: () => void;
}

export const PreviewTabs = ({ order, onDownload }: PreviewTabsProps) => {
  const [activeTab, setActiveTab] = useState<'invoice' | 'label'>('invoice');
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const namePrefix = order.firstName ? `${order.firstName}-` : '';
      if (activeTab === 'invoice') {
        await generatePDF('invoice-preview', `${namePrefix}Invoice`);
        toast.success('Invoice downloaded successfully!');
      } else {
        await generatePDF('shipping-label', `${namePrefix}ShippingLabel`, {
          scale: 3,
          format: [101.6, 152.4] // 4x6 inches in mm
        });
        toast.success('Shipping label downloaded successfully!');
      }

      if (onDownload) {
        onDownload();
      }
    } catch (error) {
      toast.error('Failed to generate PDF. Please try again.');
      console.error(error);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Tab Navigation */}
      <div className="flex items-center justify-between border-b border-border">
        <div className="flex">
          <button
            onClick={() => setActiveTab('invoice')}
            className={`tab-button flex items-center gap-2 ${activeTab === 'invoice' ? 'active' : ''}`}
          >
            <FileText className="w-4 h-4" />
            Invoice
          </button>
          <button
            onClick={() => setActiveTab('label')}
            className={`tab-button flex items-center gap-2 ${activeTab === 'label' ? 'active' : ''}`}
          >
            <Tag className="w-4 h-4" />
            Shipping Label
          </button>
        </div>
        <Button
          onClick={handleDownload}
          disabled={isDownloading}
          className="mb-2 bg-success text-success-foreground hover:bg-success/90"
        >
          {isDownloading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Download className="w-4 h-4" />
          )}
          Download PDF
        </Button>
      </div>

      {/* Preview Content */}
      <div className="bg-muted/30 rounded-lg p-6 overflow-auto max-h-[800px]">
        <div className="animate-fade-in">
          {activeTab === 'invoice' ? (
            <InvoicePreview order={order} />
          ) : (
            <ShippingLabel order={order} />
          )}
        </div>
      </div>
    </div>
  );
};
