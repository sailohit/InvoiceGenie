import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Settings, Upload, X } from 'lucide-react';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { currencies } from '@/utils/currencies';
// @ts-ignore
import SignatureCanvas from 'react-signature-canvas';

const SignatureCapture = ({ onSave }: { onSave: (data: string) => void }) => {
  const sigRef = useRef<any>(null);

  const clear = () => sigRef.current?.clear();
  const save = () => {
    if (!sigRef.current?.isEmpty()) {
      onSave(sigRef.current.getTrimmedCanvas().toDataURL('image/png'));
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="border border-border rounded-md overflow-hidden bg-white">
        <SignatureCanvas
          ref={sigRef}
          penColor="black"
          canvasProps={{ width: 300, height: 100, className: 'sigCanvas' }}
        />
      </div>
      <div className="flex gap-2">
        <Button size="sm" variant="ghost" onClick={clear}>Clear</Button>
        <Button size="sm" variant="secondary" onClick={save}>Save</Button>
      </div>
    </div>
  );
};

export interface CompanyInfo {
  companyName: string;
  companyAddress: string;
  companyPhone: string;
  companyEmail: string;
  companyLogo: string | null;
  signature?: string | null;
  whatsappTemplate?: string;

  // New Global Preferences
  currency?: string;
  currencySymbol?: string;
  taxName?: string;
  defaultTaxRate?: number;
  defaultTemplate?: string;
}

interface CompanySettingsProps {
  companyInfo: CompanyInfo;
  onChange: (info: CompanyInfo) => void;
}

export const CompanySettings = ({ companyInfo, onChange }: CompanySettingsProps) => {
  const [open, setOpen] = useState(false);
  const [localInfo, setLocalInfo] = useState(companyInfo);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const defaultTemplate = "Hi {customerName}, your order #{orderNumber} is shipped! Tracking: {trackingNumber}. Thanks!";

  const handleChange = (field: keyof CompanyInfo, value: any) => {
    setLocalInfo(prev => ({ ...prev, [field]: value }));
  };

  const handleCurrencyChange = (code: string) => {
    const selected = currencies.find(c => c.code === code);
    if (selected) {
      setLocalInfo(prev => ({
        ...prev,
        currency: code,
        currencySymbol: selected.symbol
      }));
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Logo must be less than 2MB');
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setLocalInfo(prev => ({ ...prev, companyLogo: result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const removeLogo = () => {
    setLocalInfo(prev => ({ ...prev, companyLogo: null }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSave = () => {
    // Fill default if empty
    const infoToSave = {
      ...localInfo,
      whatsappTemplate: localInfo.whatsappTemplate || defaultTemplate,
      currency: localInfo.currency || 'INR',
      currencySymbol: localInfo.currencySymbol || '₹',
      taxName: localInfo.taxName || 'GST',
      defaultTaxRate: localInfo.defaultTaxRate ?? 18
    };
    onChange(infoToSave);
    localStorage.setItem('companyInfo', JSON.stringify(infoToSave));
    toast.success('Company settings saved!');
    setOpen(false);
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen) {
      setLocalInfo({
        ...companyInfo,
        whatsappTemplate: companyInfo.whatsappTemplate || defaultTemplate,
        currency: companyInfo.currency || 'INR',
        taxName: companyInfo.taxName || 'GST',
        defaultTaxRate: companyInfo.defaultTaxRate ?? 18
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Settings className="w-4 h-4" />
          Company Settings
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Company Settings</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Logo Upload */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Company Logo</Label>
                <div className="flex items-center gap-4">
                  {localInfo.companyLogo ? (
                    <div className="relative">
                      <img
                        src={localInfo.companyLogo}
                        alt="Company Logo"
                        className="w-16 h-16 object-contain border rounded-lg bg-white"
                      />
                      <button
                        onClick={removeLogo}
                        className="absolute -top-2 -right-2 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-16 h-16 border-2 border-dashed border-border rounded-lg flex items-center justify-center bg-muted/50">
                      <Upload className="w-6 h-6 text-muted-foreground" />
                    </div>
                  )}
                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                      id="logo-upload"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {localInfo.companyLogo ? 'Change' : 'Upload'}
                    </Button>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Signature / Stamp</Label>
                <div className="flex items-center gap-4">
                  {localInfo.signature ? (
                    <div className="relative">
                      <img
                        src={localInfo.signature}
                        alt="Signature"
                        className="w-24 h-12 object-contain border rounded-lg bg-white"
                      />
                      <button
                        onClick={() => setLocalInfo(prev => ({ ...prev, signature: null }))}
                        className="absolute -top-2 -right-2 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <SignatureCapture
                      onSave={(data) => setLocalInfo(prev => ({ ...prev, signature: data }))}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Company Name */}
            <div className="space-y-2 col-span-2">
              <Label htmlFor="companyName">Company Name</Label>
              <Input
                id="companyName"
                value={localInfo.companyName}
                onChange={(e) => handleChange('companyName', e.target.value)}
                placeholder="Your Company Name"
              />
            </div>

            {/* Invoice Preferences Section */}
            <div className="space-y-2 col-span-2 pt-2 border-t mt-2">
              <Label className="text-sm font-semibold text-muted-foreground">Invoice Preferences</Label>
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Select value={localInfo.currency || 'INR'} onValueChange={handleCurrencyChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Currency" />
                </SelectTrigger>
                <SelectContent>
                  {currencies.map(c => (
                    <SelectItem key={c.code} value={c.code}>
                      {c.name} ({c.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="taxName">Tax Name</Label>
              <Input
                id="taxName"
                value={localInfo.taxName || 'GST'}
                onChange={(e) => handleChange('taxName', e.target.value)}
                placeholder="e.g. GST, VAT"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="defaultTaxRate">Default Tax Rate (%)</Label>
              <Input
                id="defaultTaxRate"
                type="number"
                value={localInfo.defaultTaxRate}
                onChange={(e) => handleChange('defaultTaxRate', parseFloat(e.target.value))}
                placeholder="18"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="template">Invoice Template</Label>
              <Select value={localInfo.defaultTemplate || 'modern'} onValueChange={(val) => handleChange('defaultTemplate', val)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Template" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="modern">Modern (Blue)</SelectItem>
                  <SelectItem value="minimal">Minimal (B&W)</SelectItem>
                  <SelectItem value="business">Business (Classic)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>


          {/* Address */}
          <div className="space-y-2">
            <Label htmlFor="companyAddress">Address</Label>
            <Textarea
              id="companyAddress"
              value={localInfo.companyAddress}
              onChange={(e) => handleChange('companyAddress', e.target.value)}
              placeholder="123 Business Street, City"
              rows={2}
            />
          </div>

          {/* Phone & Email */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="companyPhone">Phone</Label>
              <Input
                id="companyPhone"
                value={localInfo.companyPhone}
                onChange={(e) => handleChange('companyPhone', e.target.value)}
                placeholder="+91 98765 43210"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="companyEmail">Email</Label>
              <Input
                id="companyEmail"
                type="email"
                value={localInfo.companyEmail}
                onChange={(e) => handleChange('companyEmail', e.target.value)}
                placeholder="contact@company.com"
              />
            </div>
          </div>

          {/* WhatsApp Template */}
          <div className="space-y-2 pt-4 border-t border-border">
            <Label htmlFor="waTemplate">WhatsApp Message Template</Label>
            <Textarea
              id="waTemplate"
              value={localInfo.whatsappTemplate || ""}
              onChange={(e) => handleChange('whatsappTemplate', e.target.value)}
              placeholder={defaultTemplate}
              rows={3}
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Variables: <code className="bg-muted px-1 rounded">{"{customerName}"}</code>, <code className="bg-muted px-1 rounded">{"{orderNumber}"}</code>, <code className="bg-muted px-1 rounded">{"{trackingNumber}"}</code>
            </p>
          </div>

          {/* Save Button */}
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              Save Settings
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
