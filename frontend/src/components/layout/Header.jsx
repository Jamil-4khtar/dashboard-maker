import { Moon, Sun } from "lucide-react";

export default function Header({ theme, toggleTheme }) {
  return (
    <header className="header">
      <h1>Dashboard Builder</h1>
      <div className="header-controls">
        <button className="theme-btn" onClick={toggleTheme}>
          {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
        </button>
      </div>
    </header>
  );
}