import React, { useState } from 'react';
import { BookOpen, GraduationCap, History, Newspaper, BookA, Bookmark, PenTool, Trash2, Check, RefreshCw } from 'lucide-react';
import { Mode } from '../types';
// AI ऐवजी आता फक्त Local Cache/Storage क्लीनिंग सेवा वापरा
import { clearAllCache } from '../services/storageService'; 

interface HeaderProps {
  currentMode: Mode;
  onNavigate: (mode: Mode) => void;
}

export const Header: React.FC<HeaderProps> = ({ currentMode, onNavigate }) => {
  const [isClearing, setIsClearing] = useState(false);
  const [showClearSuccess, setShowClearSuccess] = useState(false);

  const handleClear = async () => {
    if (!window.confirm("तुम्हाला साठवलेल्या सर्व नोट्स आणि प्रश्न डिलीट करायचे आहेत का? (हा बदल कायमस्वरूपी असेल)")) return;
    
    setIsClearing(true);
    // ही सेवा आता फक्त स्थानिक डेटा (LocalStorage/Cache) साफ करेल
    const success = await clearAllCache();
    setIsClearing(false);
    
    if (success) {
      setShowClearSuccess(true);
      setTimeout(() => setShowClearSuccess(false), 3000);
      // डेटा डिलीट झाल्यावर होम पेजवर रिफ्रेश करणे सोयीचे ठरेल
      onNavigate(Mode.HOME);
    }
  };

  return (
    <header className="bg-indigo-700 text-white shadow-lg sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        {/* Logo & Branding */}
        <div 
          className="flex items-center space-x-2 cursor-pointer group" 
          onClick={() => onNavigate(Mode.HOME)}
        >
          <div className="bg-white p-1.5 rounded-xl group-hover:rotate-12 transition-transform">
            <GraduationCap size={28} className="text-indigo-700" />
          </div>
          <div>
            <h1 className="text-xl font-black leading-tight tracking-tight">MPSC सारथी</h1>
            <p className="text-[10px] text-indigo-200 font-bold uppercase tracking-widest">तुमचा अभ्यासाचा सोबती</p>
          </div>
        </div>
        
        {/* Navigation - Desktop */}
        <nav className="hidden xl:flex space-x-1 text-sm font-bold items-center">
          <NavButton 
            active={currentMode === Mode.HOME} 
            onClick={() => onNavigate(Mode.HOME)}
            label="डॅशबोर्ड"
          />
          <NavButton 
            active={currentMode === Mode.STUDY} 
            onClick={() => onNavigate(Mode.STUDY)}
            label="अभ्यास नोट्स"
          />
          <NavButton 
            active={currentMode === Mode.LITERATURE} 
            onClick={() => onNavigate(Mode.LITERATURE)}
            label="सराव"
            icon={<PenTool size={14} />}
          />
          <NavButton 
            active={currentMode === Mode.VOCAB} 
            onClick={() => onNavigate(Mode.VOCAB)}
            label="शब्दसंग्रह"
            icon={<BookA size={16} />}
          />
          <NavButton 
            active={currentMode === Mode.QUIZ} 
            onClick={() => onNavigate(Mode.QUIZ)}
            label="चाचणी"
          />
          <NavButton 
            active={currentMode === Mode.PYQ} 
            onClick={() => onNavigate(Mode.PYQ)}
            label="PYQs"
            icon={<History size={16} />}
          />
          <NavButton 
            active={currentMode === Mode.BOOKMARKS} 
            onClick={() => onNavigate(Mode.BOOKMARKS)}
            label="साठवलेले"
            icon={<Bookmark size={16} />}
          />
          <NavButton 
            active={currentMode === Mode.CURRENT_AFFAIRS} 
            onClick={() => onNavigate(Mode.CURRENT_AFFAIRS)}
            label="चालू घडामोडी"
            icon={<Newspaper size={16} />}
          />

          <div className="h-6 w-px bg-indigo-500 mx-3 opacity-50"></div>

          {/* Settings/Clear Action */}
          <button 
            onClick={handleClear}
            className="p-2.5 rounded-xl hover:bg-red-500 transition-all flex items-center gap-2 group relative bg-indigo-800"
            title="डेटा साफ करा"
          >
            {isClearing ? (
              <RefreshCw className="animate-spin" size={18} />
            ) : showClearSuccess ? (
              <Check className="text-green-300" size={18} />
            ) : (
              <Trash2 size={18} className="group-hover:scale-110 transition-transform" />
            )}
            <span className="text-[10px] font-black uppercase opacity-0 group-hover:opacity-100 transition-opacity absolute top-12 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-2 py-1 rounded shadow-xl whitespace-nowrap">
              डेटा हटवा
            </span>
          </button>
        </nav>

        {/* Mobile View Icons */}
        <div className="xl:hidden flex items-center gap-4">
            <button onClick={handleClear} className="p-2 text-indigo-200"><Trash2 size={20} /></button>
            <button onClick={() => onNavigate(Mode.HOME)} className="p-2 bg-indigo-600 rounded-lg shadow-inner"><BookOpen size={24} /></button>
        </div>
      </div>
    </header>
  );
};

/* Helper Component for Nav Buttons */
const NavButton = ({ active, onClick, label, icon }: { active: boolean, onClick: () => void, label: string, icon?: React.ReactNode }) => (
  <button 
    onClick={onClick}
    className={`px-3 py-2 rounded-lg transition-all flex items-center gap-2 ${
      active 
      ? 'bg-white text-indigo-700 shadow-md scale-105' 
      : 'text-indigo-100 hover:bg-indigo-600 hover:text-white'
    }`}
  >
    {icon}
    <span>{label}</span>
  </button>
);
