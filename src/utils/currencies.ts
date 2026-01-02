export const currencies = [
    { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
    { code: 'USD', symbol: '$', name: 'US Dollar' },
    { code: 'EUR', symbol: '€', name: 'Euro' },
    { code: 'GBP', symbol: '£', name: 'British Pound' },
    { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
    { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
    { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar' },
    { code: 'AED', symbol: 'AED', name: 'UAE Dirham' },
    { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
];

export const getCurrencySymbol = (code: string) => {
    return currencies.find(c => c.code === code)?.symbol || code;
};
