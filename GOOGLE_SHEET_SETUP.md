# Setup Real-Time Sync to Google Sheets (Option A)

This applet is pre-configured to automatically save student inquiries directly to your **Google Sheets** in real-time as soon as they are submitted!

To do this, we use a simple **Google Apps Script Webhook**. It requires **no Google Developers account or Firebase config**, is 100% free, and takes under 2 minutes to set up.

---

## 🛠️ Setup Instructions (2 Minutes)

### Step 1: Create your Google Sheet
1. Open [Google Sheets](https://sheets.google.com) and create a new blank spreadsheet.
2. In the first sheet, add these columns in row 1 (from **A1** to **J1**):
   * **Col A:** `Inquiry ID`
   * **Col B:** `Date (IST)`
   * **Col C:** `Time (IST)`
   * **Col D:** `Student Name`
   * **Col E:** `Mobile Number`
   * **Col F:** `Academic Standard`
   * **Col G:** `Academic Board`
   * **Col H:** `Academic Stream`
   * **Col I:** `Preferred Centers`
   * **Col J:** `Sync Status`

---

### Step 2: Add the Apps Script Code
1. In your Google Sheet menu, click on **Extensions** > **Apps Script**.
2. Delete any existing code in the editor, and paste the following snippet:

```javascript
function doPost(e) {
  try {
    // 1. Open the active spreadsheet
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheets()[0]; // Use the first tab
    
    // 2. Parse the submitted inquiry data
    var data = JSON.parse(e.postData.contents);
    
    // 3. Append the new row to the sheet
    sheet.appendRow([
      data.id,
      data.date,
      data.time,
      data.name,
      data.mobile,
      data.standard,
      data.board,
      data.stream,
      data.centers,
      "Synced"
    ]);
    
    return ContentService.createTextOutput(JSON.stringify({ success: true }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
```

---

### Step 3: Deploy as a Web App (Webhook)
1. At the top right of the Apps Script page, click the blue **Deploy** button > select **New deployment** (or **Manage deployments** if you are updating an existing one).
2. Click the gear icon next to "Select type" and choose **Web app**.
3. Configure the settings exactly as follows:
   * **Description:** `Study Circle Leads Webhook`
   * **Execute as:** `Me (your-email@gmail.com)`
   * **Who has access:** `Anyone`  *(This is critical so your website can post leads!)*
4. Click **Deploy**.
   * ⚠️ **IF YOU ARE UPDATING AN EXISTING DEPLOYMENT:** You **MUST** select **New version** in the deployment dialog to apply your edits, otherwise Google Sheets will continue to run the old code!
5. Google may show an authorization prompt. Click **Authorize Access**, choose your Google account, click **Advanced** (at the bottom) and click **Go to Untitled project (unsafe)** to approve the script permissions.
6. Copy the **Web app URL** provided in the success dialog (it will look like `https://script.google.com/macros/s/.../exec`).

---

### Step 4: Add the URL to AI Studio Secrets
1. Go to the **Settings** / **Secrets** menu in AI Studio.
2. Add a new secret named:
   `GOOGLE_SHEETS_WEBHOOK_URL`
3. Paste the Web app URL you copied in Step 3 as the value.
4. Refresh or deploy! Any new inquiry submitted will instantly auto-populate your Google Sheet!
