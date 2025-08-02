import React, { useContext } from 'react'
import "./styles/App.css"
import { DashboardContext } from './contexts/allContext'
import Header from './components/layout/Header'
import Sidebar from './components/layout/Sidebar'
import Canvas from './components/dashboard/Canvas'

function App() {
  const { theme, toggleTheme, addWidget } = useContext(DashboardContext)
  

  return (
    <div className={`app ${theme}`}>
        <Header theme={theme} toggleTheme={toggleTheme} />
        <div className="main-content">
          <Sidebar onAddWidget={addWidget} />
          <Canvas />
        </div>
      </div>
  )
}

export default App
