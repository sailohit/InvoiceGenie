# Invoice Genie - Setup & User Guide

## Prerequisites
- **Node.js**: Ensure you have Node.js installed (v16 or higher).
- **Git**: To clone the repository (optional if you have the files already).

## 1. Installation

Open your terminal (Command Prompt, PowerShell, or Terminal) in the project folder and run:

```bash
npm install
```

This will download all necessary dependencies.

## 2. Running the Application

### Option A: Web Mode (Recommended for Development)
Runs the application in your default web browser.

```bash
npm run dev
```
- Open [http://localhost:8080](http://localhost:8080) to view it.

### Option B: Desktop App (Electron)
Runs the application as a standalone desktop window.

```bash
npm run electron:dev
```
*Note: Make sure port 8080 is free, as the electron script connects to the dev server.*

## 3. Building for Production

### Create a Desktop Installer (.exe)
To create a Windows installer for distribution:

```bash
npm run build:exe
```
- The installer (and executable) will be generated in the `dist_electron` folder.

## 4. Getting Started (Login)

On the first launch, the system automatically creates a default Admin account.

- **Username**: `admin`
- **Password**: `admin123`

### Role Features

| Feature | Admin | User |
| :--- | :---: | :---: |
| Generate Invoice | ✅ | ✅ |
| View Order History | ✅ | ✅ |
| **Send WhatsApp Updates** | ✅ | ✅ |
| View Dashboard | ✅ | ❌ |
| Manage Users | ✅ | ❌ |
| Edit Company Settings | ✅ | ❌ |
| **Manage Inventory** | ✅ | ❌ |
| **Digital Signatures** | ✅ | ❌ |

## 5. Setting Up Your Company

### 1. Basic Info
Go to **Settings** (Admin only) to set your Company Name, Address, and Logo.

### 2. Digital Signature (New!)
You can now add an authorized signature to your invoices.
1.  Scroll down to the **Digital Signature** section in Settings.
2.  Use your mouse/touchpad to **Draw** your signature in the box.
3.  OR Click **Upload** to use a scandalous image of your stamp/signature.
4.  Click **Save Settings**.
*This signature will automatically appear at the bottom-right of all invoices.*

### 3. Financial Preferences
-   **Currency**: Set to INR (₹), USD ($), etc.
-   **Tax Name**: Set to GST, VAT, Sales Tax.
-   **Default Tax Rate**: Set your common tax % (e.g., 18).

## 6. Using Communication Features

### WhatsApp Dispatch
1.  Go to **Order History** for any order.
2.  Click the ... menu > **WhatsApp Dispatch**.
3.  **Step 1**: The Invoice PDF will auto-download.
4.  **Step 2**: WhatsApp Web opens with a pre-filled "Order Dispatched" message (including tracking details).
5.  **Step 3**: Drag the downloaded PDF into the chat and send.

### Sending Emails
-   **Default App**: Opens Outlook/Mail app on your PC.
-   **Gmail**: Opens a Gmail compose window in your browser.
*Note: In both cases, you must manually attach the downloaded PDF file.*

## 7. Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| `Ctrl + N` | New Invoice (Clear Form) |
| `Ctrl + S` | Save Order / Draft |
| `Ctrl + P` | Print / Export PDF |
| `Ctrl + F` | Search History |
| `Ctrl + K` | Open Command Palette |

## 8. Key Features Guide

### Invoice Engine & Settings
-   **Currency & Tax**: Go to **Company Settings** to define your default Currency (e.g., USD, INR) and Tax Name (GST/VAT).
-   **Templates**: Toggle between "Modern", "Minimal", and "Business" styles for your invoices.
-   **Preview**: In the Order Form, you can see live calculations for Tax and Totals.

### Product & Inventory
-   **Add Products**: Go to **Dashboard > Products**. Add items with Name, Price, and SKU.
-   **Bulk Import**: Click "Import CSV" to upload a list of products at once.
-   **Stock Deduction**: When you create an order, if the Product Name matches an inventory item, stock is automatically reduced.

### Data Management
-   **Backup**: Go to **Settings > Data Management** to Export your entire database as a file.
-   **Restore**: Use Import to restore data from a previous backup.

## 5. Frequently Asked Questions

**Q: How do I verify the database?**
A: Open the browser's Developer Tools (F12) -> Application -> Storage -> IndexedDB -> `InvoiceGenieDB`.

**Q: Where is data stored?**
A: Data is stored locally in your browser/device (IndexedDB). If you clear your browser data, you will lose your records unless you upgraded to a synced version.

**Q: How do I change the WhatsApp Message?**
A: Log in as **Admin** -> Click **Company Settings** -> Edit the "WhatsApp Message Template".
