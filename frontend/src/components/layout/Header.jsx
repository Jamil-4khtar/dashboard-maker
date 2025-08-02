import { Moon, Save, Share2, Sun } from "lucide-react";

export default function Header({ theme, toggleTheme, onSave, onShare, isSaving }) {
  return (
    <header className="header">
      <h1>Dashboard Builder</h1>
      <div className="header-controls">
        <button 
          className={`save-btn ${isSaving ? 'saving' : ''}`}
          onClick={onSave}
          disabled={isSaving}
        >
          <Save size={16} />
          {isSaving ? 'Saving...' : 'Save'}
        </button>
        
        <button className="share-btn" onClick={onShare}>
          <Share2 size={16} />
          Share
        </button>
        
        <button className="theme-btn" onClick={toggleTheme}>
          {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
        </button>
      </div>
    </header>
  );
}