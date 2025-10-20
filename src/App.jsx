import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import ArithmeticParser from './pages/ArithmeticParser'
import AutomataMinimization from './pages/AutomataMinimization'
import HomePage from './pages/HomePage'

function App() {
  return (
    <Router>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/parser" element={<ArithmeticParser />} />
          <Route path="/automata" element={<AutomataMinimization />} />
        </Routes>
    </Router>
  )
}

export default App
