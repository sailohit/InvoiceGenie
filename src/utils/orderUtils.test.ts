import { describe, it, expect, vi } from 'vitest';
import {
    parseCustomerData,
    generateWhatsAppLink,
    createDefaultOrderInfo,
    loadCompanyInfo,
    defaultCompanyInfo
} from '@/utils/orderUtils';

describe('generateWhatsAppLink', () => {
    it('should format Indian numbers correctly', () => {
        expect(generateWhatsAppLink('9876543210', 'Hello')).toContain('wa.me/919876543210');
    });
    it('should keep existing country codes', () => {
        expect(generateWhatsAppLink('12345678901', 'Hello')).toContain('wa.me/12345678901');
    });
    it('should remove non-digits', () => {
        expect(generateWhatsAppLink('+91-98765 43210', 'Hello')).toContain('wa.me/919876543210');
    });
    it('should encode the message', () => {
        expect(generateWhatsAppLink('1234567890', 'Hello World')).toContain('text=Hello%20World');
    });
});

describe('parseCustomerData', () => {
    const standardHeader = `Timestamp	First Name	Last Name	Email ID	Phone Number	Building/House/Apartment Name	Street Address	Locality	City	State	Pincode	Any Delivery Instructions/Notes
12/26/2024 10:30:00	John	Doe	john@example.com	9876543210	Apt 1	Main St	Downtown	Metrics	State	123456	Leave at door`;

    it('should parse standard Google format with headers', () => {
        const result = parseCustomerData(standardHeader);
        expect(result).not.toBeNull();
        expect(result?.firstName).toBe('John');
        expect(result?.lastName).toBe('Doe');
        expect(result?.email).toBe('john@example.com');
        expect(result?.pincode).toBe('123456');
    });

    it('should handle headerless data using heuristics', () => {
        // Note: Heuristics rely on email/phone being present
        const headerless = `12/26/2024	Unknown	User	test@test.com	9998887776	House	Street	Loc	City	State	500001`;
        const result = parseCustomerData(headerless);

        expect(result).not.toBeNull();
        expect(result?.email).toBe('test@test.com');
        expect(result?.phone).toBe('9998887776');
        expect(result?.pincode).toBe('500001');
    });

    it('should return null for empty input', () => {
        expect(parseCustomerData('')).toBeNull();
        expect(parseCustomerData('   ')).toBeNull();
    });

    it('should return null for garbage input without mapable fields', () => {
        expect(parseCustomerData('just some random text without email or phone')).toBeNull();
    });
});

describe('createDefaultOrderInfo', () => {
    it('should return defaults', () => {
        const defaults = createDefaultOrderInfo();
        expect(defaults).toHaveProperty('paymentMethod', 'Prepaid');
    });
});

describe('loadCompanyInfo', () => {
    it('should return default info if storage empty', () => {
        localStorage.clear();
        expect(loadCompanyInfo()).toEqual(defaultCompanyInfo);
    });

    it('should return stored info', () => {
        const custom = { companyName: 'Test Corp' };
        localStorage.setItem('companyInfo', JSON.stringify(custom));
        expect(loadCompanyInfo()).toEqual(custom);
    });

    it('should handle invalid json in storage', () => {
        localStorage.setItem('companyInfo', 'invalid-json');
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
        expect(loadCompanyInfo()).toEqual(defaultCompanyInfo);
        consoleSpy.mockRestore();
    });
});
