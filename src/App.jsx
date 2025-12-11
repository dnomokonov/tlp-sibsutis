import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import ArithmeticParser from './pages/ArithmeticParser'
import AutomataMinimization from './pages/AutomataMinimization'
import HomePage from './pages/HomePage'
import DMPautomaticPage from './pages/DMPautomaticPage'
import ConverterRpnPage from "./pages/ConverterRpnPage.jsx";
import ParseTextHTMLPage from "./pages/ParseTextHTMLPage.jsx";

function App() {
  return (
    <Router>
        <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/parser" element={<ArithmeticParser />} />
            <Route path="/automata" element={<AutomataMinimization />} />
            <Route path="/dmpautomatics" element={<DMPautomaticPage />} />
            <Route path="/conrpn" element={<ConverterRpnPage />} />
            <Route path="/rgr" element={<ParseTextHTMLPage />} />
        </Routes>
    </Router>
  )
}

export default App
