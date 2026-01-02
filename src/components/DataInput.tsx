import { useState } from 'react';
import { sampleCustomerData, MAPPABLE_FIELDS } from '@/utils/orderUtils';
import { Clipboard, FileSpreadsheet, Info, CheckCircle2, Table as TableIcon, ArrowRightLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from 'sonner';
import * as Papa from 'papaparse';

interface DataInputProps {
  onDataPaste: (data: string) => void;
  pastedData: string;
  hasValidData: boolean;
}

export const DataInput = ({ onDataPaste, pastedData, hasValidData }: DataInputProps) => {
  const [showSample, setShowSample] = useState(false);
  const [isMappingOpen, setIsMappingOpen] = useState(false);
  const [rawColumns, setRawColumns] = useState<string[]>([]);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const text = e.clipboardData.getData('text');
    onDataPaste(text);

    // Auto-detect if mapping might be needed (simple heuristic: no known headers found in first line)
    // For now, just let it paste. We'll add a manual trigger button.
    toast.success('Customer data pasted!');
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onDataPaste(e.target.value);
  };

  const loadSampleData = () => {
    onDataPaste(sampleCustomerData);
    toast.success('Sample data loaded!');
  };

  // --- Mapping Logic ---
  const validHeadersSet = new Set([
    'timestamp', 'date', 'time',
    'first_name', 'firstname', 'first',
    'last_name', 'lastname', 'last',
    'email_id', 'email', 'emailid',
    'phone_number', 'phone', 'mobile',
    'city', 'town', 'state', 'pincode', 'zip'
  ]);

  const openMappingTool = () => {
    if (!pastedData.trim()) {
      toast.error("Please paste some data first");
      return;
    }

    // 1. Parse without headers to get raw columns
    const result = Papa.parse(pastedData.trim(), {
      header: false,
      skipEmptyLines: true,
    });

    if (result.data && result.data.length > 0) {
      // Use the first row as the sample "columns"
      const firstRow = result.data[0] as string[];
      setRawColumns(firstRow);
      setIsMappingOpen(true);

      // Reset mapping
      setColumnMapping({});
    } else {
      toast.error("Could not parse data");
    }
  };

  const applyMapping = () => {
    // 1. Construct the new CSV with headers
    // The keys in columnMapping are the MAPPABLE_FIELDS keys (e.g., 'firstName')
    // The values are the INDICES of the raw columns (e.g., '0', '1')

    // We need to create a header row based on the keys we have mapped
    const mappedKeys = Object.keys(columnMapping);
    if (mappedKeys.length === 0) {
      toast.error("Please map at least one field");
      return;
    }

    // New Header line
    // We will use slight variations of the keys that our parser recognizes in 'orderUtils.ts'
    // Actually, 'orderUtils' parser handles standard snake_case versions well.
    // So we can just use the key names themselves (like 'firstName') if we convert them to snake_case or 
    // just rely on the flexible parser.
    // The flexible parser looks for: 'first_name', 'firstname', 'first' for firstName.
    // Let's use clean readable headers for the "Generated" CSV.

    const headers = mappedKeys.map(k => {
      // Convert camelCase to Space Separated or just use the label from definition
      const fieldDef = MAPPABLE_FIELDS.find(f => f.key === k);
      return fieldDef ? fieldDef.label : k;
    });

    // Now reconstructing the data rows
    const result = Papa.parse(pastedData.trim(), {
      header: false,
      skipEmptyLines: true,
    });

    if (!result.data || result.data.length === 0) return;

    // We need to extract the correct columns for each row
    const rows = (result.data as string[][]).map(row => {
      return mappedKeys.map(key => {
        const colIndex = parseInt(columnMapping[key]);
        return row[colIndex] || '';
      });
    });

    // Unparse back to CSV
    const newCsv = Papa.unparse({
      fields: headers,
      data: rows
    });

    // Update parent
    onDataPaste(newCsv);
    setIsMappingOpen(false);
    toast.success("Column mapping applied!");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileSpreadsheet className="w-5 h-5 text-invoice-accent" />
          <h2 className="font-semibold text-lg">Customer Data</h2>
          {hasValidData && (
            <CheckCircle2 className="w-5 h-5 text-success" />
          )}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={openMappingTool}
            className="text-xs gap-1"
          >
            <ArrowRightLeft className="w-3 h-3" />
            Map Columns
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={loadSampleData}
            className="text-xs"
          >
            <Clipboard className="w-3 h-3 mr-1" />
            Load Sample
          </Button>
        </div>
      </div>

      <div className="relative">
        <textarea
          className="paste-area"
          placeholder="Paste customer data from Google Sheets here...
          
If your data doesn't have headers, paste it and click 'Map Columns' above."
          value={pastedData}
          onChange={handleChange}
          onPaste={handlePaste}
        />
      </div>

      <button
        onClick={() => setShowSample(!showSample)}
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <Info className="w-4 h-4" />
        {showSample ? 'Hide' : 'Show'} expected columns
      </button>

      {showSample && (
        <div className="bg-muted/50 rounded-lg p-4 text-xs font-mono overflow-x-auto animate-fade-in">
          <p className="text-muted-foreground mb-2">Your Google Sheet columns:</p>
          <code className="text-foreground">
            Timestamp | First Name | Last Name | Email ID | Phone Number | Building/House/Apartment Name | Street Address | Locality | City | State | Pincode | Delivery Instructions
          </code>
        </div>
      )}

      {/* Mapping Dialog */}
      <Dialog open={isMappingOpen} onOpenChange={setIsMappingOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Map Columns</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <p className="text-sm text-muted-foreground">
              Match your pasted columns to our fields. The values shown are from the first row of your data.
            </p>

            <div className="bg-muted/30 p-3 rounded-md text-xs font-mono mb-4 overflow-x-auto whitespace-nowrap">
              <strong>Pasted Row Sample:</strong>
              <br />
              {rawColumns.map((c, i) => `[${i + 1}] ${c}`).join('  |  ')}
            </div>

            <div className="grid grid-cols-2 gap-4">
              {MAPPABLE_FIELDS.map((field) => (
                <div key={field.key} className="space-y-1">
                  <Label className="text-xs">{field.label}</Label>
                  <Select
                    value={columnMapping[field.key] || ''}
                    onValueChange={(val) => setColumnMapping(prev => ({ ...prev, [field.key]: val }))}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Select column..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="skip_this_field_special_val">-- Skip / None --</SelectItem>
                      {rawColumns.map((colVal, idx) => (
                        <SelectItem key={idx} value={String(idx)}>
                          Col {idx + 1}: {colVal.substring(0, 20)}{colVal.length > 20 ? '...' : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsMappingOpen(false)}>Cancel</Button>
            <Button onClick={applyMapping}>Apply Mapping</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
