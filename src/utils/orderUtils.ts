import * as Papa from 'papaparse';
import { z } from 'zod';

export interface OrderData {
  // Customer data from Google Sheet
  timestamp: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  building: string;
  streetAddress: string;
  locality: string;
  city: string;
  state: string;
  pincode: string;
  deliveryNotes: string;

  // Manual input fields
  orderNumber: string;
  invoiceNumber: string;
  orderDate: string;
  productName: string;
  productId?: number;
  quantity: string | number;
  unitPrice: string | number;
  shippingCharges: string | number;
  paymentMethod: string;
  trackingNumber: string;

  // Financials
  taxRate: string | number; // %
  taxAmount: string | number;
  totalAmount: string | number;
  currency: string; // 'INR', 'USD', etc.

  // Company info
  companyName: string;
  companyAddress: string;
  companyPhone: string;
  companyEmail: string;
  companyLogo: string | null;
  signature?: string | null; // Base64 data URL

  // Company Defaults Snapshot
  companyTaxName?: string; // 'GST', 'VAT'
  template?: string; // 'modern', 'minimal'
  // Communication & Status
  status: 'Pending' | 'Paid' | 'Overdue' | 'Cancelled';
  dueDate: string; // ISO Date string YYYY-MM-DD
}

export const defaultCompanyInfo = {
  companyName: "Your Company Name",
  companyAddress: "123 Business Street, Commercial Area",
  companyPhone: "+91 98765 43210",
  companyEmail: "contact@yourcompany.com",
  companyLogo: null as string | null,
  signature: null as string | null, // Base64 data URL

  // New Global Preferences
  currency: 'INR',
  currencySymbol: '₹',
  taxName: 'GST',
  defaultTaxRate: 18,
  defaultTemplate: 'modern', // 'modern', 'minimal', 'business'
};

export const generateOrderNumber = (): string => {
  return ''; // Will be populated from DB
};

export const generateInvoiceNumber = (): string => {
  return ''; // Will be populated from DB
};

export const generateWhatsAppLink = (phone: string, message: string) => {
  // Clean phone number: remove non-digits
  let cleanPhone = phone.replace(/\D/g, '');

  // If number doesn't have country code (less than 11 digits), assume India (+91)
  if (cleanPhone.length === 10) {
    cleanPhone = '91' + cleanPhone;
  }

  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
};

export const generateGmailLink = (email: string, subject: string, body: string) => {
  return `https://mail.google.com/mail/?view=cm&fs=1&to=${email}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
};

export const generateEmailLink = (email: string, subject: string, body: string) => {
  return `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
};

export const createDefaultOrderInfo = () => ({
  orderNumber: generateOrderNumber(),
  invoiceNumber: generateInvoiceNumber(),
  orderDate: new Date().toISOString().split('T')[0],
  status: 'Pending' as const,
  dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Default 7 days
  productName: '',
  quantity: 1 as string | number,
  unitPrice: 0 as string | number,
  shippingCharges: 0 as string | number,
  taxRate: 18,
  taxAmount: 0,
  totalAmount: 0,
  currency: 'INR',
  paymentMethod: 'Prepaid',
  trackingNumber: '',
  companyTaxName: 'GST',
  template: 'modern',
});

// Heuristics for auto-detection
/**
 * Heuristics to auto-detect data types from raw string input.
 */
const isEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim());

const isPhone = (s: string) => {
  // strict check: shouldn't have date delimiters like / or :
  if (/[/:]/.test(s)) return false;

  const digits = s.replace(/\D/g, '');
  // Indian mobile numbers are 10 digits. International usually max 15. 
  return digits.length >= 10 && digits.length <= 15;
};

const isPincode = (s: string) => /^\d{6}$/.test(s.trim());

const isDate = (s: string) => {
  const val = Date.parse(s);
  return !isNaN(val) && s.length > 5 && /\d/.test(s); // simple check
};

const cleanPincode = (s: string) => s.replace(/\D/g, '').substring(0, 6);

/**
 * intelligently maps columns from a 2D array of strings to OrderData fields.
 * It uses two strategies:
 * 1. Fixed position check (if 11 columns match the known Google Sheet format).
 * 2. Smart column detection based on available data content (email, phone, etc.).
 * 
 * @param rows The raw 2D array (parsed from CSV/TSV)
 * @returns A partial record of mapped fields or null if failed
 */
const detectAndMapColumns = (rows: string[][]): Record<string, string> | null => {
  if (rows.length === 0) return null;
  const firstRow = rows[0].map(s => s.trim());

  // PRIORITY 1: User's Specific Google Sheet Format
  // Header pattern: Timestamp, First, Last, Email, Phone, Building, Street, Locality, City, State, Pincode
  // If we have exactly 11 columns, we assume this specific order to be safe.
  if (firstRow.length >= 11) {
    // Let's check a few key anchors to confirm:
    // Col 3 (index 3) = Email?
    // Col 4 (index 4) = Phone?
    // Col 10 (index 10) = Pincode?
    const looksLikeEmail = isEmail(firstRow[3]) || firstRow[3].includes('@');
    const looksLikePhone = isPhone(firstRow[4]) || /^\d+$/.test(firstRow[4].replace(/[\s\-+()]/g, ''));

    if (looksLikeEmail && looksLikePhone) {
      console.log("Matched standard Google Sheet format");
      return {
        timestamp: firstRow[0],
        firstName: firstRow[1],
        lastName: firstRow[2],
        email: firstRow[3],
        phone: firstRow[4],
        building: firstRow[5],
        streetAddress: firstRow[6],
        locality: firstRow[7],
        city: firstRow[8],
        state: firstRow[9],
        pincode: cleanPincode(firstRow[10])
      };
    }
  }

  // PRIORITY 2: General Heuristic Auto-Detection
  const mapping: Record<string, string> = {};
  const usedIndices = new Set<number>();

  const findColIndex = (predicate: (s: string) => boolean) => {
    // Find best match: first priority is unused columns
    // We look effectively at the first row. 
    // Ideally we should check a few rows if available, but first row is usually enough for paste.

    let bestIdx = -1;
    for (let i = 0; i < firstRow.length; i++) {
      if (usedIndices.has(i)) continue;
      if (predicate(firstRow[i])) {
        bestIdx = i;
        break;
      }
    }
    if (bestIdx !== -1) {
      usedIndices.add(bestIdx);
      return bestIdx;
    }
    return -1;
  };

  // 1. Easy stuff: Email, Phone, Pincode, Date
  const emailIdx = findColIndex(isEmail);
  if (emailIdx !== -1) mapping['email'] = firstRow[emailIdx];

  const phoneIdx = findColIndex(isPhone);
  if (phoneIdx !== -1) mapping['phone'] = firstRow[phoneIdx];

  const pinIdx = findColIndex(isPincode);
  if (pinIdx !== -1) {
    mapping['pincode'] = cleanPincode(firstRow[pinIdx]);
  } else {
    // Fallback: Check if any remaining column *contains* a 6 digit number
    // (Sometimes pincode is hidden in address)
    // For now, strict mapping is safer.
  }

  // Check for date only if not already used (date heuristics can be tricky)
  const dateIdx = findColIndex(isDate);
  if (dateIdx !== -1) mapping['timestamp'] = firstRow[dateIdx];

  // 2. Harder stuff: Name, City, State
  // Remaining columns are likely text.
  // Heuristic: 
  // - State or City are usually single words or short phrases.
  // - Address is long.
  // - Names are 1-3 words.

  const remainingIndices = firstRow.map((_, i) => i).filter(i => !usedIndices.has(i));

  // Simple assignment for now based on order if we found the anchors (phone/email)
  // If we have remaining columns, let's guess standard order or just fill mostly empty fields.
  // Standard pasting order often: First, Last, ... Address ... City ... State

  if (remainingIndices.length > 0) {
    // Assign first remaining to firstName
    const fIdx = remainingIndices.shift();
    if (fIdx !== undefined) mapping['firstName'] = firstRow[fIdx];
  }
  if (remainingIndices.length > 0) {
    // Assign second remaining to lastName
    const lIdx = remainingIndices.shift();
    if (lIdx !== undefined) mapping['lastName'] = firstRow[lIdx];
  }

  // Look for address-like (longest remaining string?)
  if (remainingIndices.length > 0) {
    let maxLen = -1;
    let addrIdxLoc = -1;

    remainingIndices.forEach((realIdx, arrIdx) => {
      if (firstRow[realIdx].length > maxLen) {
        maxLen = firstRow[realIdx].length;
        addrIdxLoc = arrIdx;
      }
    });

    if (addrIdxLoc !== -1) {
      const realIdx = remainingIndices[addrIdxLoc];
      mapping['streetAddress'] = firstRow[realIdx];
      remainingIndices.splice(addrIdxLoc, 1); // remove it
    }
  }

  // Assign any others to City/State if available
  if (remainingIndices.length > 0) mapping['city'] = firstRow[remainingIndices[0]];
  if (remainingIndices.length > 1) mapping['state'] = firstRow[remainingIndices[1]];

  // Quality check: Ensure we found at least one "anchor" field or a significant number of fields
  // prevents "hello world" from becoming firstName="hello world"
  const anchorFields = ['email', 'phone', 'pincode', 'timestamp'];
  const hasAnchor = anchorFields.some(k => k in mapping);

  if (!hasAnchor && Object.keys(mapping).length < 3) {
    return null;
  }

  return mapping;
};

/**
 * Main entry point for parsing pasted text into structured OrderData.
 * Supports both Header-based parsing (PapaParse) and Headerless parsing (Heuristics).
 * 
 * @param pastedData The raw text from the clipboard
 * @returns Partial OrderData object if successful, null otherwise
 */
export const parseCustomerData = (pastedData: string): Partial<OrderData> | null => {
  try {
    const trimmed = pastedData.trim();
    if (!trimmed) return null;

    // 1. Try standard header-based parsing first
    // Check if the first line looks like headers (contains keywords)
    const firstLine = trimmed.split('\n')[0].toLowerCase();
    const keywords = ['name', 'email', 'phone', 'address', 'city', 'state', 'zip', 'pin'];
    const hasKeywords = keywords.some(k => firstLine.includes(k));

    if (hasKeywords) {
      const result = Papa.parse(trimmed, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header: string) => header.trim().toLowerCase().replace(/[\s/]+/g, '_'),
      });

      if (result.data.length > 0) {
        const row = result.data[0] as Record<string, string>;
        const getValue = (keys: string[]): string => {
          for (const key of keys) {
            const normalizedKey = key.toLowerCase().replace(/[\s/]+/g, '_');
            if (row[normalizedKey]) return row[normalizedKey];
          }
          return '';
        };

        // ... Existing extraction logic ...
        // Re-implementing compact extraction to reuse this block
        const rawData = {
          timestamp: getValue(['timestamp', 'date', 'time']),
          firstName: getValue(['first_name', 'firstname', 'first']),
          lastName: getValue(['last_name', 'lastname', 'last']),
          email: getValue(['email_id', 'email', 'emailid', 'e-mail']),
          phone: getValue(['phone_number', 'phone', 'mobile', 'contact', 'phonenumber']),
          building: getValue(['building_house_apartment_name', 'building', 'house', 'apartment', 'flat']),
          streetAddress: getValue(['street_address', 'streetaddress', 'street', 'address']),
          locality: getValue(['locality', 'area', 'neighborhood']),
          city: getValue(['city', 'town']),
          state: getValue(['state', 'province']),
          pincode: cleanPincode(getValue(['pincode', 'zip', 'zipcode', 'postal_code', 'postalcode'])),
          deliveryNotes: getValue(['any_delivery_instructions_notes', 'delivery_instructions', 'notes', 'instructions', 'delivery_notes']),
        };

        if (rawData.email || rawData.phone || rawData.firstName) return rawData;
      }
    }

    // 2. Fallback: Auto-detection (Headerless)
    // If we are here, either no keywords found or header parsing failed/returned empty
    const rawResult = Papa.parse(trimmed, {
      header: false,
      skipEmptyLines: true
    });

    if (rawResult.data && rawResult.data.length > 0) {
      // Use auto-map on the first data row
      const rows = rawResult.data as string[][];
      const mapped = detectAndMapColumns(rows);
      if (mapped) return mapped as Partial<OrderData>;
    }

    return null;
  } catch (error) {
    console.error('Error parsing customer data:', error);
    return null;
  }
};

export const sampleCustomerData = `Timestamp	First Name	Last Name	Email ID	Phone Number	Building/House/Apartment Name	Street Address	Locality	City	State	Pincode	Any Delivery Instructions/Notes
12/26/2024 10:30:00	Rahul	Sharma	rahul.sharma@email.com	9876543210	Flat 402, Sunrise Apartments	MG Road, Sector 15	Andheri West	Mumbai	Maharashtra	400053	Please call before delivery`;

export const loadCompanyInfo = () => {
  try {
    const saved = localStorage.getItem('companyInfo');
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (error) {
    console.error('Error loading company info:', error);
  }
  return defaultCompanyInfo;
};

export const MAPPABLE_FIELDS = [
  { key: 'timestamp', label: 'Timestamp' },
  { key: 'firstName', label: 'First Name' },
  { key: 'lastName', label: 'Last Name' },
  { key: 'email', label: 'Email ID' },
  { key: 'phone', label: 'Phone Number' },
  { key: 'building', label: 'Building/House Name' },
  { key: 'streetAddress', label: 'Street Address' },
  { key: 'locality', label: 'Locality' },
  { key: 'city', label: 'City' },
  { key: 'state', label: 'State' },
  { key: 'pincode', label: 'Pincode' },
  { key: 'deliveryNotes', label: 'Delivery Notes' },
] as const;
