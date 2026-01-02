# Invoice Genie

**Invoice Genie** is a powerful, local-first Invoice and Shipping Label generator designed for e-commerce sellers. It runs entirely in your browser or as a desktop application, ensuring your data stays private and secure on your device.

## Features

### 🚀 Core Invoice Engine
-   **Professional Templates**: Choose from Modern, Minimal, and Business styles.
-   **Multi-Currency**: Support for international currencies (USD, EUR, INR, etc.).
-   **Tax Engine**: Automatic calculation of GST/VAT/Sales Tax.
-   **PDF Export**: Print-ready invoices and shipping labels (A4/Thermal support).

### 📦 Inventory & Products
-   **Stock Tracking**: Automatically deducts inventory when orders are created.
-   **Low Stock Alerts**: Visual warnings when products run low.
-   **Bulk Import**: Import product lists via CSV.

### 👥 Customer Management
-   **CRM**: Auto-saves customer details from orders.
-   **History**: View purchase history per customer.

### 📊 Dashboard & Analytics
-   **Sales Insights**: Standard visual dashboard for revenue and order trends.
-   **Recent Activity**: Quick view of latest actions.

### 🔒 Security & Privacy
-   **Local First**: All data is stored in IndexedDB on your device. No cloud uploads.
-   **Role-Based Access**: separate Admin and User roles.
-   **Data Backup**: Full JSON export/import capability.

### 📨 Communication Hub
-   **WhatsApp Dispatch**: Send "Order Dispatched" messages with tracking ID, full address, and attachable PDF invoice.
-   **Payment Reminders**: Send quick payment reminders via WhatsApp.
-   **Email Integration**: Send invoices using your Default Mail App or Gmail directly.
-   **Auto-PDF Generation**: Invoices are auto-downloaded for easy attachment.

### ✍️ Digital Signatures
-   **E-Sign**: Draw or upload your Authorized Signatory signature in Company Settings.
-   **Professional Look**: Automatically appears on all generated invoices.

### ⌨️ Productivity Shortcuts
-   `Ctrl + N`: New Invoice (Reset Form)
-   `Ctrl + S`: Save Draft / Order
-   `Ctrl + P`: Print / Export PDF
-   `Ctrl + F`: Search Order History
-   `Ctrl + K`: Open Command Palette

## Getting Started

### Prerequisites
-   Node.js (v18+)

### Installation
1.  Clone the repository:
    ```bash
    git clone https://github.com/yourusername/invoice-genie.git
    cd invoice-genie
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```

### Running Locally
To start the web application:
```bash
npm run dev
```
Open [http://localhost:8080](http://localhost:8080) in your browser.

## Troubleshooting & Debugging

**Q: I clicked "WhatsApp Dispatch" but the PDF wasn't attached!**
**A:** This is expected security behavior.
1.  The PDF will **automatically download** to your computer when you click the button.
2.  WhatsApp Web will open.
3.  You must manually **drag and drop** the downloaded PDF into the chat.
*Note: No website can legally auto-attach files to WhatsApp without using the paid Business API.*

**Q: "Email Invoice" opens a window asking me to choose an app.**
**A:** This happens if you choose "Default Email App" but don't have Outlook or Mail set up.
*   **Solution**: Use the **"Send via Gmail"** option instead to open Gmail in your browser.

**Q: My PDF is cut off or looks wrong.**
**A:** Ensure you are using the `Print / Export` button or the shortcut `Ctrl+P`. The application generates a hidden A4 view specifically for this. If issues persist, try using a different browser (Chrome/Edge recommended).

**Q: Digital Signature is not showing.**
**A:** Go to **Company Settings** and ensure you have drawn and saved your signature. It will only appear on *new* PDF generations.

**Q: How do I report a bug?**
**A:** If you see a red error box or something breaks:
1.  Press `F12` to open Developer Tools.
2.  Click the **Console** tab.
3.  Take a screenshot of any red error text.
4.  Send the screenshot to the developer.

## License
MIT
