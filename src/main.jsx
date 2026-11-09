import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Questionnaire from './pages/Questionnaire.jsx'
import Admin from './pages/Admin.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/admin/*" element={<Admin />} />
        <Route path="*" element={<Questionnaire />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
)
