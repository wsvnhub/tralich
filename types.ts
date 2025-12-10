
export interface ParsedResult {
  formatted: string;
  raw?: string;
  components?: {
    A: string;
    B: string;
    C: string;
    D: string;
    E: string;
    F: string;
    G: string;
    H: string;
    I: string;
    J: string;
  };
  coordinates?: {
    row: number;
    col: number;
  };
}

export interface SheetData {
  loading: boolean;
  error: string | null;
}

export interface HistoryItem {
  id: string;
  term: string;
  timestamp: number;
  resultCount: number;
  savedResults: string[]; 
  deviceId?: string; // Để định danh thiết bị nếu cần
}

// Cấu trúc dữ liệu trên Firestore: collection 'schedules' -> doc ID = SĐT
export interface FirestoreSchedule {
  updatedAt: string;
  shifts: string[]; // Danh sách các chuỗi kết quả đã format sẵn từ Google Apps Script
}
