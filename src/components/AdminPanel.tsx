import { useState, useEffect } from "react";
import { User as FirebaseUser } from "firebase/auth";
import { 
  googleSignIn, 
  googleSignIn as gsi, 
  logout as fbLogout, 
  initAuth, 
  getAccessToken 
} from "../lib/firebase";
import { Inquiry, SheetConfig } from "../types";
import { 
  Check, 
  Database, 
  FileSpreadsheet, 
  Search, 
  LogOut, 
  RefreshCw, 
  Lock, 
  ArrowLeft, 
  AlertCircle, 
  Plus, 
  Globe, 
  ExternalLink,
  Download
} from "lucide-react";
import { motion } from "motion/react";

// Shared timezone-safe formatter for IST Date & Time (UTC + 5:30)
export function formatISTDateAndTime(timestamp: string) {
  let dateStr = "";
  let timeStr = "";
  
  try {
    const dateObj = new Date(timestamp);
    dateStr = dateObj.toLocaleDateString("en-IN", {
      timeZone: "Asia/Kolkata",
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    });
    timeStr = dateObj.toLocaleTimeString("en-IN", {
      timeZone: "Asia/Kolkata",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true
    });
  } catch (err) {
    console.warn("Browser standard formatting failed:", err);
  }

  if (!dateStr || !timeStr || dateStr.includes("Invalid") || timeStr.includes("Invalid")) {
    try {
      const dateObj = new Date(timestamp);
      const istOffsetMs = 19800000;
      const istDateObj = new Date(dateObj.getTime() + istOffsetMs);

      const day = String(istDateObj.getUTCDate()).padStart(2, "0");
      const month = String(istDateObj.getUTCMonth() + 1).padStart(2, "0");
      const year = istDateObj.getUTCFullYear();
      dateStr = `${day}/${month}/${year}`;

      let hours = istDateObj.getUTCHours();
      const minutes = String(istDateObj.getUTCMinutes()).padStart(2, "0");
      const seconds = String(istDateObj.getUTCSeconds()).padStart(2, "0");
      const ampm = hours >= 12 ? "PM" : "AM";
      hours = hours % 12;
      hours = hours ? hours : 12;
      const hoursStr = String(hours).padStart(2, "0");
      timeStr = `${hoursStr}:${minutes}:${seconds} ${ampm}`;
    } catch (manualErr) {
      console.error("Manual browser format failed:", manualErr);
      const d = new Date(timestamp);
      dateStr = d.toISOString().split("T")[0];
      timeStr = d.toISOString().split("T")[1].slice(0, 8);
    }
  }

  return { date: dateStr, time: timeStr, formatted: `${dateStr}, ${timeStr}` };
}

interface AdminPanelProps {
  onBackToLanding: () => void;
}

export default function AdminPanel({ onBackToLanding }: AdminPanelProps) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [needsAuth, setNeedsAuth] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  
  // Data management states
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [sheetConfig, setSheetConfig] = useState<SheetConfig>({ spreadsheetId: null, spreadsheetUrl: null });
  const [isSyncing, setIsSyncing] = useState(false);
  const [isCreatingSheet, setIsCreatingSheet] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Filter and search states
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStd, setFilterStd] = useState<string>("all");
  const [filterSync, setFilterSync] = useState<string>("all");

  // Load inquiries and config from server
  const loadServerData = async () => {
    try {
      const responseInquiries = await fetch("/api/inquiries");
      if (responseInquiries.ok) {
        const data = await responseInquiries.json();
        setInquiries(data);
      }
      
      const responseConfig = await fetch("/api/config");
      if (responseConfig.ok) {
        const config = await responseConfig.json();
        setSheetConfig(config);
      }
    } catch (err) {
      console.error("Failed to fetch server data:", err);
    }
  };

  useEffect(() => {
    // Check initial auth state
    const unsubscribe = initAuth(
      (currentUser, token) => {
        setUser(currentUser);
        setAccessToken(token);
        setNeedsAuth(false);
      },
      () => {
        setUser(null);
        setAccessToken(null);
        setNeedsAuth(true);
      }
    );

    loadServerData();

    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    setIsLoggingIn(true);
    setFeedbackMsg(null);
    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        setAccessToken(result.accessToken);
        setNeedsAuth(false);
        setFeedbackMsg({ type: "success", text: `Welcome, ${result.user.displayName || "Counselor"}` });
      }
    } catch (err: any) {
      console.error("Login failed:", err);
      setFeedbackMsg({ type: "error", text: "Failed to authenticate with Google. Ensure you grant necessary permissions." });
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fbLogout();
      setUser(null);
      setAccessToken(null);
      setNeedsAuth(true);
      setFeedbackMsg(null);
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  // Create a new spreadsheet and set headers
  const handleCreateSheet = async () => {
    const token = accessToken || await getAccessToken();
    if (!token) {
      setFeedbackMsg({ type: "error", text: "Authentication expired. Please sign in again." });
      setNeedsAuth(true);
      return;
    }

    setIsCreatingSheet(true);
    setFeedbackMsg(null);

    try {
      // 1. Create Spreadsheet
      const createResponse = await fetch("https://sheets.googleapis.com/v4/spreadsheets", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          properties: {
            title: "Study Circle Admissions - Inquiry Responses"
          },
          sheets: [
            {
              properties: {
                title: "Inquiries",
                gridProperties: {
                  frozenRowCount: 1
                }
              }
            }
          ]
        })
      });

      if (!createResponse.ok) {
        const errDetails = await createResponse.text();
        throw new Error(`Google API error: ${errDetails}`);
      }

      const sheetData = await createResponse.json();
      const newSpreadsheetId = sheetData.spreadsheetId;
      const newSpreadsheetUrl = sheetData.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${newSpreadsheetId}`;

      // 2. Initialize Headers
      const headers = [
        "Inquiry ID", 
        "Date (IST)", 
        "Time (IST)", 
        "Student Name", 
        "Mobile Number", 
        "Academic Standard", 
        "Academic Board", 
        "Academic Stream", 
        "Preferred Centers", 
        "Sync Status"
      ];
      const headerResponse = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${newSpreadsheetId}/values/Inquiries!A1:J1?valueInputOption=USER_ENTERED`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          values: [headers]
        })
      });

      if (!headerResponse.ok) {
        throw new Error("Failed to write header columns to Google Sheet.");
      }

      // 3. Save to server config
      const configSaveResponse = await fetch("/api/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          spreadsheetId: newSpreadsheetId,
          spreadsheetUrl: newSpreadsheetUrl
        })
      });

      if (!configSaveResponse.ok) {
        throw new Error("Failed to save sheet configuration to backend.");
      }

      const updatedConfig = await configSaveResponse.json();
      setSheetConfig(updatedConfig);
      setFeedbackMsg({ type: "success", text: "New Google Sheet created and linked successfully!" });
    } catch (err: any) {
      console.error("Create Google sheet error:", err);
      setFeedbackMsg({ type: "error", text: err.message || "Failed to create Google Sheet. Ensure your Google account has spreadsheet permissions enabled." });
    } finally {
      setIsCreatingSheet(false);
    }
  };

  // Sync pending inquiries to Google Sheets
  const handleSyncPending = async () => {
    const token = accessToken || await getAccessToken();
    if (!token) {
      setFeedbackMsg({ type: "error", text: "Session expired. Please sign in again." });
      setNeedsAuth(true);
      return;
    }

    if (!sheetConfig.spreadsheetId) {
      setFeedbackMsg({ type: "error", text: "Please link a Google Sheet first." });
      return;
    }

    const pending = inquiries.filter(inq => inq.status === "pending");
    if (pending.length === 0) {
      setFeedbackMsg({ type: "success", text: "All inquiries are already synced with Google Sheets!" });
      return;
    }

    setIsSyncing(true);
    setFeedbackMsg(null);

    try {
      // Format rows for sheets
      const rows = pending.map(inq => {
        const { date: istDate, time: istTime } = formatISTDateAndTime(inq.timestamp);

        return [
          inq.id,
          istDate,
          istTime,
          inq.name,
          inq.mobile,
          inq.standard,
          inq.board || "N/A",
          inq.stream || "N/A",
          inq.centers.join(", "),
          "Synced"
        ];
      });

      // Append to spreadsheet
      const appendResponse = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${sheetConfig.spreadsheetId}/values/Inquiries!A:J:append?valueInputOption=USER_ENTERED`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          values: rows
        })
      });

      if (!appendResponse.ok) {
        throw new Error("Failed to write values to Google Sheet. Please check spreadsheet permission.");
      }

      // Mark as synced on backend
      const pendingIds = pending.map(p => p.id);
      const syncStatusResponse = await fetch("/api/inquiries/sync-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ids: pendingIds,
          status: "synced"
        })
      });

      if (!syncStatusResponse.ok) {
        throw new Error("Google Sheet rows appended, but failed to update status in server database.");
      }

      setFeedbackMsg({ type: "success", text: `Successfully synced ${pending.length} inquiries to Google Sheets!` });
      await loadServerData(); // Reload latest data
    } catch (err: any) {
      console.error("Sync error:", err);
      setFeedbackMsg({ type: "error", text: err.message || "Spreadsheet syncing failed." });
    } finally {
      setIsSyncing(false);
    }
  };

  // Download all inquiries as local CSV file
  const handleDownloadCSV = () => {
    if (inquiries.length === 0) return;
    
    const headers = [
      "Inquiry ID", 
      "Date (IST)", 
      "Time (IST)", 
      "Student Name", 
      "Mobile Number", 
      "Academic Standard", 
      "Academic Board", 
      "Academic Stream", 
      "Preferred Centers", 
      "Sync Status"
    ];
    const rows = inquiries.map(inq => {
      const { date: istDate, time: istTime } = formatISTDateAndTime(inq.timestamp);

      return [
        inq.id,
        istDate,
        istTime,
        `"${inq.name.replace(/"/g, '""')}"`,
        inq.mobile,
        inq.standard,
        inq.board || "N/A",
        inq.stream || "N/A",
        `"${inq.centers.join(", ")}"`,
        inq.status
      ];
    });

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `study_circle_inquiries_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter & Search logic
  const filteredInquiries = inquiries.filter(inq => {
    const matchesSearch = 
      inq.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      inq.mobile.includes(searchQuery);
    
    const matchesStd = filterStd === "all" || inq.standard === filterStd;
    const matchesSync = filterSync === "all" || inq.status === filterSync;

    return matchesSearch && matchesStd && matchesSync;
  });

  const pendingCount = inquiries.filter(i => i.status === "pending").length;

  return (
    <div id="admin-panel" className="max-w-6xl mx-auto px-4 py-8">
      {/* Header back navigation */}
      <div className="flex justify-between items-center mb-8">
        <button
          id="btn-admin-back"
          onClick={onBackToLanding}
          className="flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-purple-600 transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Landing Page</span>
        </button>

        <span className="text-xs bg-gray-100 text-gray-600 font-mono py-1 px-3 rounded-full flex items-center gap-1.5">
          <Globe className="w-3.5 h-3.5" /> Surat Portal
        </span>
      </div>

      {/* Main Content Render */}
      {needsAuth ? (
        /* LOCK SCREEN (AUTH GUARD) */
        <div id="admin-auth-guard" className="max-w-md mx-auto bg-white rounded-3xl border border-gray-100 p-8 shadow-xl text-center">
          <div className="w-16 h-16 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Counselor Administration</h1>
          <p className="text-gray-500 text-sm mb-8 leading-relaxed">
            Please log in with your Study Circle Google Workspace account to review student inquiries and sync data to Google Sheets.
          </p>

          <button
            id="gsi-login-btn"
            onClick={handleLogin}
            disabled={isLoggingIn}
            className="w-full flex items-center justify-center p-0.5 border border-gray-200 rounded-xl bg-white hover:bg-gray-50 hover:border-gray-300 active:scale-[0.99] transition duration-150 shadow-sm cursor-pointer disabled:opacity-50"
          >
            <div className="flex items-center gap-4 py-3 px-4">
              <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-5 h-5 block shrink-0">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
              </svg>
              <span className="text-gray-700 font-semibold text-sm">
                {isLoggingIn ? "Signing In..." : "Sign in with Google"}
              </span>
            </div>
          </button>

          {feedbackMsg && (
            <div id="auth-err-display" className={`mt-4 p-3 rounded-xl text-xs flex gap-2 text-left ${feedbackMsg.type === "error" ? "bg-red-50 text-red-600 border border-red-100" : "bg-green-50 text-green-600 border border-green-100"}`}>
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{feedbackMsg.text}</span>
            </div>
          )}
        </div>
      ) : (
        /* FULL ADMIN DESKTOP OR TABLE VIEW */
        <div id="admin-main-view" className="space-y-6">
          
          {/* Top Counselor Info Bar */}
          <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex gap-4 items-center">
              {user?.photoURL ? (
                <img src={user.photoURL} alt="Counselor Avatar" className="w-12 h-12 rounded-full border border-gray-100 shadow-sm" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center font-bold text-purple-600">
                  {user?.displayName ? user.displayName[0] : "C"}
                </div>
              )}
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{user?.displayName || "Study Circle Advisor"}</h3>
                <span className="text-xs text-gray-500">{user?.email || "counselor@studycircle.in"}</span>
              </div>
            </div>

            <button
              id="btn-admin-logout"
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-xs font-semibold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100/70 py-2.5 px-4 rounded-xl cursor-pointer transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>

          {/* Feedback Display Banner */}
          {feedbackMsg && (
            <div 
              id="admin-feedback-banner"
              className={`p-4 rounded-2xl flex items-start gap-3 border shadow-sm ${
                feedbackMsg.type === "success" 
                  ? "bg-green-50/70 text-green-800 border-green-100" 
                  : "bg-red-50/70 text-red-800 border-red-100"
              }`}
            >
              {feedbackMsg.type === "success" ? (
                <Check className="w-5 h-5 shrink-0 text-green-500 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 shrink-0 text-red-500 mt-0.5" />
              )}
              <span className="text-sm font-medium">{feedbackMsg.text}</span>
            </div>
          )}

          {/* Sheet Sync Link & Management Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Sheet Link Status Card */}
            <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-md md:col-span-2 flex flex-col justify-between min-h-[160px]">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <FileSpreadsheet className="w-6 h-6 text-green-600" />
                  <h4 className="font-semibold text-gray-950 text-base">Google Sheets Integration</h4>
                </div>
                {sheetConfig.spreadsheetId ? (
                  <div className="space-y-2 mt-2">
                    <p className="text-sm font-medium text-gray-800">Linked Spreadsheet ID:</p>
                    <code className="text-xs bg-gray-50 p-2 font-mono rounded-lg block truncate border border-gray-100 max-w-lg mb-1">{sheetConfig.spreadsheetId}</code>
                    
                    <a
                      id="link-go-to-sheets"
                      href={sheetConfig.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${sheetConfig.spreadsheetId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm font-semibold text-purple-600 hover:text-purple-700 hover:underline transition mt-2"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span>Open Google Sheet Document</span>
                    </a>
                  </div>
                ) : (
                  <div className="mt-3">
                    <p className="text-sm text-amber-700 bg-amber-50 border border-amber-100 p-3 rounded-xl inline-flex items-start gap-2 max-w-xl">
                      <AlertCircle className="w-4.5 h-4.5 shrink-0 text-amber-500 mt-0.5" />
                      No active Google Sheet linked. You must link or create a sheet to append offline responses.
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-6 flex flex-wrap gap-2.5">
                {sheetConfig.spreadsheetId ? (
                  <button
                    id="btn-recreate-sheet"
                    onClick={handleCreateSheet}
                    disabled={isCreatingSheet}
                    className="px-4 py-2.5 bg-gray-50 text-gray-600 hover:bg-gray-100 text-xs font-semibold rounded-xl border border-gray-150 flex items-center gap-1.5 transition disabled:opacity-50"
                  >
                    {isCreatingSheet ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                    <span>Link Another Sheet</span>
                  </button>
                ) : (
                  <button
                    id="btn-create-sheet-now"
                    onClick={handleCreateSheet}
                    disabled={isCreatingSheet}
                    className="px-5 py-3 bg-purple-600 text-white hover:bg-purple-700 text-sm font-bold rounded-2xl flex items-center gap-2 transition cursor-pointer disabled:opacity-50 shadow-md shadow-purple-100"
                  >
                    {isCreatingSheet ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Creating Spreadsheet Document...</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        <span>Create & Link Google Sheet</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Sync trigger Widget */}
            <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-md flex flex-col justify-between min-h-[160px]">
              <div>
                <h4 className="font-semibold text-gray-950 text-base mb-1">Queue & Syncing</h4>
                <p className="text-xs text-gray-500 leading-relaxed mb-4">Click below to upload pending website inquiries into the linked Google Sheet spreadsheet.</p>

                <div className="grid grid-cols-2 gap-4 text-center mt-2.5">
                  <div className="bg-purple-50/50 p-3.5 rounded-2xl border border-purple-100/50">
                    <span className="block text-2xl font-bold text-purple-750">{inquiries.length}</span>
                    <span className="text-[10px] uppercase tracking-wider font-mono text-gray-500">Inquiries</span>
                  </div>
                  <div className="bg-amber-50/50 p-3.5 rounded-2xl border border-amber-100/50">
                    <span className="block text-2xl font-bold text-amber-700">{pendingCount}</span>
                    <span className="text-[10px] uppercase tracking-wider font-mono text-gray-500">Pending Sync</span>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <button
                  id="btn-trigger-sync"
                  onClick={handleSyncPending}
                  disabled={isSyncing || pendingCount === 0 || !sheetConfig.spreadsheetId}
                  className="w-full py-3 bg-green-600 hover:bg-green-700 disabled:opacity-50 active:scale-[0.99] text-white text-sm font-bold rounded-2xl flex items-center justify-center gap-2 transition cursor-pointer shadow-md shadow-green-100"
                >
                  {isSyncing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Syncing Inquiries...</span>
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4" />
                      <span>Sync {pendingCount} Pending Rows</span>
                    </>
                  )}
                </button>
              </div>
            </div>

          </div>

          {/* Inquiries Table Container and Controls */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-md p-6">
            
            {/* Table Action Controls */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <h3 className="text-lg font-bold text-gray-950 flex items-center gap-2">
                <Database className="w-5 h-5 text-purple-600" />
                <span>Admissions Response Log</span>
              </h3>
              
              <div className="flex flex-wrap items-center gap-3">
                
                {/* Search Bar */}
                <div className="relative">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="table-search"
                    type="text"
                    placeholder="Search by name or mobile..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9.5 pr-4 py-2 bg-gray-50 focus:bg-white text-sm text-gray-900 border border-gray-150 rounded-xl focus:outline-none focus:border-purple-600 focus:ring-4 focus:ring-purple-100 transition max-w-[220px]"
                  />
                </div>

                {/* Filter Standard */}
                <select
                  id="filter-std-select"
                  value={filterStd}
                  onChange={(e) => setFilterStd(e.target.value)}
                  className="px-3 py-2 bg-gray-50 border border-gray-150 rounded-xl text-xs sm:text-sm text-gray-700 outline-none focus:border-purple-600 focus:ring-4 focus:ring-purple-100 transition"
                >
                  <option value="all">All Standards</option>
                  <option value="9th">9th</option>
                  <option value="10th">10th</option>
                  <option value="11th">11th</option>
                  <option value="12th">12th</option>
                </select>

                {/* Filter Sync Status */}
                <select
                  id="filter-sync-select"
                  value={filterSync}
                  onChange={(e) => setFilterSync(e.target.value)}
                  className="px-3 py-2 bg-gray-50 border border-gray-150 rounded-xl text-xs sm:text-sm text-gray-700 outline-none focus:border-purple-600 focus:ring-4 focus:ring-purple-100 transition"
                >
                  <option value="all">All Sync States</option>
                  <option value="pending">Pending Sync</option>
                  <option value="synced">Synced Only</option>
                </select>

                {/* Local CSV Extract */}
                <button
                  id="btn-download-csv"
                  onClick={handleDownloadCSV}
                  disabled={inquiries.length === 0}
                  className="px-3 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs sm:text-sm font-semibold rounded-xl border border-purple-100 flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
                  title="Download responses as CSV"
                >
                  <Download className="w-4 h-4" />
                  <span>CSV</span>
                </button>

              </div>
            </div>

            {/* Inquiries List Table */}
            <div className="overflow-x-auto -mx-6 sm:mx-0">
              <table id="inquiries-data-table" className="w-full text-left text-sm font-sans border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50 text-gray-500 font-medium text-xs font-mono uppercase tracking-wider">
                    <th className="py-3 px-6">Date/Time (IST)</th>
                    <th className="py-3 px-6">Name</th>
                    <th className="py-3 px-6">Mobile Number</th>
                    <th className="py-3 px-6">Standard</th>
                    <th className="py-3 px-6">Stream</th>
                    <th className="py-3 px-6">Preferred Centers</th>
                    <th className="py-3 px-6 text-center">Sync Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredInquiries.length > 0 ? (
                    filteredInquiries.map((inq) => (
                      <tr id={`row-${inq.id}`} key={inq.id} className="hover:bg-gray-50/50 transition duration-150 text-gray-700">
                        <td className="py-4 px-6 font-mono text-xs whitespace-nowrap text-gray-400">
                          {formatISTDateAndTime(inq.timestamp).formatted}
                        </td>
                        <td className="py-4 px-6 font-semibold text-gray-900 capitalize">{inq.name}</td>
                        <td className="py-4 px-6 font-mono text-sm font-medium">{inq.mobile}</td>
                        <td className="py-4 px-6">
                          <span className="px-2.5 py-1 bg-purple-50 text-purple-700 rounded-full text-xs font-semibold">{inq.standard}</span>
                        </td>
                        <td className="py-4 px-6">
                          {inq.stream ? (
                            <span className="px-2.5 py-1 bg-purple-50 text-purple-700 rounded-full text-xs font-semibold">{inq.stream}</span>
                          ) : (
                            <span className="text-xs text-gray-400 font-mono">—</span>
                          )}
                        </td>
                        <td className="py-4 px-6 text-xs max-w-xs truncate" title={inq.centers.join(", ")}>
                          {inq.centers.join(", ")}
                        </td>
                        <td className="py-4 px-6 text-center">
                          {inq.status === "synced" ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs font-bold border border-green-100">
                              <Check className="w-3.5 h-3.5" /> Synced
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-700 rounded-full text-xs font-bold border border-amber-100">
                              <AlertCircle className="w-3.5 h-3.5 animate-pulse" /> Pending
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-gray-400 font-medium">
                        {inquiries.length === 0 ? "No student inquiries received yet." : "No matching inquiries found."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

          </div>

        </div>
      )}
    </div>
  );
}

// Global declaration for loader icons needed internally or statically
function Loader2(props: any) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}
