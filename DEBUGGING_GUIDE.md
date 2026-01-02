# Debugging & Codebase Guide for Invoice Genie

This guide provides a deep dive into the Invoice Genie codebase, designed to help developers understand "every line" of the core flows and debug issues effectively.

## 1. Architecture Overview

Invoice Genie is a **local-first** React application. This means:
*   **No Backend API**: All data lives in the user's browser (IndexedDB).
*   **State Management**: React State (`useState`) + Dexie.js (Database).
*   **PDF Generation**: Happens entirely client-side using `html2canvas` + `jspdf`.

### Data Flow Diagram

```mermaid
graph TD
    UserInput[User Input (Paste/Type)] --> ReactState[React State (Index.tsx)]
    ReactState --> Effects[useEffect Hooks]
    Effects --> IndexedDB[(IndexedDB - Dexie)]
    
    subgraph PDF Generation
        IndexedDB --> Render[Render Hidden HTML]
        Render --> HTML2Canvas[html2canvas]
        HTML2Canvas --> JSPDF[jsPDF]
        JSPDF --> PDFFile[Download/Blob]
    end
    
    subgraph Persistance
        ReactState -- Auto-Save --> IndexedDB
        IndexedDB -- Initial Load --> ReactState
    end
```

---

## 2. Line-by-Line Code Walkthrough

### Core File: `src/pages/Index.tsx`

This is the "Brain" of the application. It manages the invoice creation form.

| Line Range | What It Does | Key Concepts |
| :--- | :--- | :--- |
| **1-7** | **Imports**: Key libraries like `react`, `sonner` (toasts), and our custom DB utilities. | `imports` |
| **136** | **Component Start**: The main functional component `Index` begins here. | `FC` |
| **137-143** | **State Declaration**: <br> `pastedData`: Raw text from the user.<br> `orderDetails`: Object storing invoice metadata (date, currency).<br> `companyInfo`: Your settings (logo, address).<br> `customerData`: Extracted customer info. | `useState` |
| **146-161** | **Effect 1: Initial Load**: Runs *once* on mount (`[]`). It fetches saved drafts from `db.settings` and populates the state. This is why your draft survives a refresh. | `useEffect`, `Async/Await` |
| **164-177** | **Effect 2: ID Sync**: Checks if `orderNumber` or `invoiceNumber` are missing. If so, it calls `getNextSequence` from DB to generate new ones safely. | `Data Integrity` |
| **180-212** | **Effect 3: Auto-Save**: These `useEffect` hooks watch state variables (e.g., `[orderDetails]`). Whenever they change, they write to `db.settings`. This provides "Auto-Save" functionality. | `Persistence` |
| **215-249** | **`handleDataPaste`**: The magic function. It takes raw text, uses `parseCustomerData` (regex logic) to extract names/dates, and updates state. It also triggers ID generation if needed. | `Event Handler` |

### Core File: `src/components/OrderHistory.tsx`

This component displays past orders and creates the side panel.

| Line Range | What It Does | Key Concepts |
| :--- | :--- | :--- |
| **37** | **`useLiveQuery`**: A special hook from Dexie. It *subscribes* to changes in the `orders` table. If you add an order anywhere else, this list updates automatically without a reload. | `Reactivity` |
| **42-44** | **`useImperativeHandle`**: Exposes the `open()` function to the parent (`Index.tsx`). This allows the parent to open this panel via Keyboard Shortcut (Ctrl+F) even though it's inside a child component. | `Ref Forwarding` |
| **56-93** | **`handleCommunication`**: Handles generating PDFs for email/WhatsApp. It sets `orderForPdf` state -> waits for React to render the hidden preview -> generates PDF -> downloads it. | `Async Logic` |

---

## 3. Debugging Techniques

### Technique A: Inspecting the Database (IndexedDB)

Since there is no "server," you debug the database right in your browser.

1.  Open **Chrome DevTools** (F12 or Right Click -> Inspect).
2.  Go to the **Application** tab.
3.  In the sidebar, look for **Storage** -> **IndexedDB**.
4.  Expand **InvoiceGenieDB** (or similar).
5.  Click on tables like `orders` or `products`.
    *   *Why?* Check if data is actually being saved. If your invoice isn't showing up in history, check the `orders` table here.

### Technique B: Debugging PDF Generation issues

If a PDF looks wrong (cut off, missing styles), it's usually because the *hidden* element it generated from was wrong.

1.  Go to `src/pages/Index.tsx` (or `OrderHistory.tsx`).
2.  Find the `<div id="invoice-preview" ...>` element.
3.  Temporarily remove `className="hidden"` or `style={{ position: 'absolute', left: '-9999px' }}`.
4.  Now the invoice preview will be visible on screen.
5.  **Inspect Element** on it to see if CSS styles are failing to apply.

### Technique C: Console Logging efficiently

Don't just `console.log(data)`. Use:

*   `console.table(data)`: Great for arrays of objects (like your list of orders).
*   `console.group('Saving Order')` ... `console.groupEnd()`: Groups related logs together so your console isn't a mess.

### Common Issues & Fixes

**Issue**: "My changes aren't saving!"
*   **Check**: Are you editing a *draft* (saved in `settings` table) or a final *order* (saved in `orders` table)?
*   **Action**: Use Technique A to check the `settings` table in IndexedDB.

**Issue**: "PDF is blank"
*   **Check**: Is the image/logo cross-origin?
*   **Fix**: Ensure all images used are Base64 strings (data URLs), not external links (http://...). The PDF generator cannot screenshot external images due to security security policies (CORS).

**Issue**: "Access Denied" on Camera/Microphone
*   **Check**: Browser permissions icon in the URL bar.
*   **Fix**: You must be on `localhost` or `https`. Most browsers block media devices on `http` (insecure) unless it is localhost.
