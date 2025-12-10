
import React, { useState, useEffect } from 'react';
import { Search, FileSpreadsheet, AlertCircle, History as HistoryIcon, Clock, Check, Cloud } from 'lucide-react';
import { ParsedResult, SheetData, HistoryItem, FirestoreSchedule } from './types';
import ResultCard from './components/ResultCard';
import { db } from './firebaseConfig';
import { doc, getDoc, setDoc, collection, query, where, getDocs, orderBy, limit, Timestamp } from 'firebase/firestore';

const App: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [inputError, setInputError] = useState<string | null>(null);
  const [status, setStatus] = useState<SheetData>({
    loading: false, // Với Firebase, mặc định là sẵn sàng
    error: null,
  });
  const [results, setResults] = useState<ParsedResult[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  
  // Tạo hoặc lấy Device ID để lưu lịch sử (giả lập user)
  const [deviceId, setDeviceId] = useState<string>('');

  useEffect(() => {
    // 1. Khởi tạo Device ID (lưu trong localStorage để giữ phiên)
    let dId = localStorage.getItem('device_id');
    if (!dId) {
        dId = 'dev_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('device_id', dId);
    }
    setDeviceId(dId);

    // 2. Tải lịch sử từ Firestore dựa trên Device ID
    loadHistoryFromFirebase(dId);
  }, []);

  const loadHistoryFromFirebase = async (dId: string) => {
    try {
        const historyRef = collection(db, 'search_history');
        const q = query(
            historyRef, 
            where("deviceId", "==", dId),
            orderBy("timestamp", "desc"),
            limit(50)
        );
        const querySnapshot = await getDocs(q);
        const fetchedHistory: HistoryItem[] = [];
        querySnapshot.forEach((doc) => {
            fetchedHistory.push(doc.data() as HistoryItem);
        });
        setHistory(fetchedHistory);
    } catch (e) {
        console.error("Lỗi tải lịch sử từ Firebase:", e);
    }
  };

  const saveHistoryToFirebase = async (item: HistoryItem) => {
      try {
          // Lưu vào Firestore collection 'search_history'
          // ID document là timestamp + sđt để unique
          await setDoc(doc(db, 'search_history', `${item.timestamp}_${item.term}`), item);
      } catch (e) {
          console.error("Lỗi lưu lịch sử:", e);
      }
  };

  const handleSearch = async (term: string) => {
    setSearchTerm(term);
    
    // Reset state
    setResults([]);
    setInputError(null);

    if (!term) return;

    // Validation
    const isNum = /^\d+$/.test(term);
    if (!isNum) {
        setInputError("Chỉ được nhập các chữ số.");
        return;
    }
    if (term.length !== 9) {
        setInputError("Vui lòng nhập đúng 9 chữ số.");
        return;
    }

    setStatus({ loading: true, error: null });

    try {
        // --- TRUY VẤN FIRESTORE ---
        // Dữ liệu được Google Apps Script đẩy lên collection 'schedules', document ID là SĐT
        const docRef = doc(db, "schedules", term);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data() as FirestoreSchedule;
            
            // Map dữ liệu từ Firestore sang format hiển thị
            const foundResults: ParsedResult[] = data.shifts.map(shiftString => ({
                formatted: shiftString
            }));
            
            setResults(foundResults);

            // --- LƯU LỊCH SỬ ---
            const newItem: HistoryItem = {
                id: Date.now().toString(),
                term: term,
                timestamp: Date.now(),
                resultCount: foundResults.length,
                savedResults: foundResults.map(r => r.formatted),
                deviceId: deviceId
            };

            // Cập nhật State
            setHistory(prev => [newItem, ...prev]);
            
            // Lưu lên Cloud
            saveHistoryToFirebase(newItem);

        } else {
            // Không tìm thấy SĐT này trong database
            setResults([]);
            
            // Vẫn lưu lịch sử là "Không tìm thấy"
            const newItem: HistoryItem = {
                id: Date.now().toString(),
                term: term,
                timestamp: Date.now(),
                resultCount: 0,
                savedResults: [],
                deviceId: deviceId
            };
            setHistory(prev => [newItem, ...prev]);
            saveHistoryToFirebase(newItem);
        }

    } catch (err) {
        console.error(err);
        setStatus({ loading: false, error: "Lỗi kết nối Server. Vui lòng kiểm tra mạng." });
    } finally {
        setStatus(prev => ({ ...prev, loading: false }));
    }
  };

  // Group history by date
  const groupedHistory = history.reduce((groups, item) => {
    const date = new Date(item.timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    let key = date.toLocaleDateString('vi-VN');
    if (date.toDateString() === today.toDateString()) key = 'Hôm nay';
    else if (date.toDateString() === yesterday.toDateString()) key = 'Hôm qua';

    if (!groups[key]) groups[key] = [];
    groups[key].push(item);
    return groups;
  }, {} as Record<string, HistoryItem[]>);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-6 px-3 sm:px-6">
      
      {/* Header */}
      <div className="w-full max-w-3xl text-center mb-6">
        <div className="flex flex-col items-center justify-center mb-2">
          <div className="flex items-center space-x-2">
             <img 
               src="https://w.ladicdn.com/5dc39976770cd34186edd2d3/20250304-172216-20250318064324-yoeuo.jpg" 
               alt="Ways Station Logo" 
               className="w-9 h-9 rounded-lg object-cover"
             />
             <h1 className="text-xl sm:text-3xl font-bold text-gray-900 tracking-tight">
               Tra cứu lịch làm việc Ways Station
             </h1>
          </div>
          
          {/* Firebase Status */}
          <div className="flex items-center justify-center space-x-1.5 mt-2 animate-fade-in">
                <Check size={16} className="text-[#005df8]" strokeWidth={3} />
                <span className="text-xs sm:text-sm font-bold text-[#005df8]">
                  Hệ thống Online (Cloud)
                </span>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="w-full max-w-3xl space-y-4">
        
        {/* Search Input */}
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className={`h-5 w-5 transition-colors ${inputError ? 'text-red-400' : 'text-gray-400 group-focus-within:text-blue-500'}`} />
          </div>
          <input
            type="text"
            className={`block w-full pl-10 pr-4 py-3 bg-white border rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 text-base sm:text-lg transition-all ${
                inputError 
                ? 'border-red-300 focus:ring-red-500 focus:border-transparent' 
                : 'border-gray-200 focus:ring-blue-500 focus:border-transparent'
            }`}
            placeholder="Nhập 9 chữ số SĐT, ko gồm số 0"
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            maxLength={9}
            inputMode="numeric"
          />
          {status.loading && (
             <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                 <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
             </div>
          )}
        </div>

        {/* Input Validation Error */}
        {inputError && (
             <div className="flex items-center space-x-2 text-red-600 bg-red-50 px-3 py-2 rounded-lg border border-red-100">
                 <AlertCircle size={16} />
                 <span className="text-xs sm:text-sm font-medium">{inputError}</span>
             </div>
        )}
        
        {status.error && (
             <div className="flex items-center space-x-2 text-red-600 bg-red-50 px-3 py-2 rounded-lg border border-red-100">
                 <AlertCircle size={16} />
                 <span className="text-xs sm:text-sm font-medium">{status.error}</span>
             </div>
        )}

        {/* Results */}
        <div className="space-y-3">
          {!inputError && !status.loading && searchTerm.length === 9 && results.length === 0 && (
            <div className="text-center py-8 text-gray-500 bg-white rounded-xl border border-gray-200 border-dashed">
              <FileSpreadsheet className="mx-auto h-8 w-8 text-gray-300 mb-2" />
              <p className="text-sm">Không tìm thấy kết quả nào cho "{searchTerm}"</p>
            </div>
          )}

          {results.map((result, idx) => (
            <ResultCard 
                key={idx} 
                result={result} 
                index={idx} 
                total={results.length}
            />
          ))}
        </div>

        {/* History Section */}
        {Object.keys(groupedHistory).length > 0 && (
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center space-x-2 text-gray-800">
                <Cloud size={20} className="text-blue-500" />
                <h2 className="text-lg font-bold">Lịch sử tra cứu (Đồng bộ Cloud)</h2>
              </div>
            </div>

            <div className="space-y-4">
              {Object.entries(groupedHistory).map(([dateLabel, items]) => (
                <div key={dateLabel}>
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 ml-1">
                    {dateLabel}
                  </h3>
                  <div className="space-y-3">
                    {(items as HistoryItem[]).map((item) => (
                      <div
                        key={item.id}
                        className="bg-white rounded-lg shadow-sm border border-gray-200 p-3"
                      >
                        <div className="flex items-center space-x-2 mb-2 pb-2 border-b border-gray-100">
                           <Clock size={14} className="text-gray-400"/>
                           <span className="text-xs text-gray-500 font-mono">
                              {new Date(item.timestamp).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})}
                           </span>
                           <span className="text-sm font-bold text-blue-600">
                             #{item.term}
                           </span>
                        </div>

                        <div className="space-y-2">
                           {item.savedResults && item.savedResults.length > 0 ? (
                               item.savedResults.map((res, rIdx) => (
                                   <div key={rIdx} className="text-xs sm:text-sm text-gray-800 font-mono bg-gray-50 p-2 rounded border border-gray-100">
                                       {res}
                                   </div>
                               ))
                           ) : (
                               <div className="text-xs text-gray-500 italic">
                                   Không có kết quả
                               </div>
                           )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
