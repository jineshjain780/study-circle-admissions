export interface Inquiry {
  id: string;
  timestamp: string;
  name: string;
  mobile: string;
  standard: '9th' | '10th' | '11th' | '12th';
  stream: 'Science' | 'Commerce' | null;
  centers: string[];
  status: 'pending' | 'synced';
}

export interface SheetConfig {
  spreadsheetId: string | null;
  spreadsheetUrl: string | null;
}
