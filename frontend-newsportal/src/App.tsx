import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import ArticlesDashboard from './pages/ArticlesDashboard'; 

function App() {
  return (
    <Router>
      <Routes>
        {/* If someone just goes to localhost:5173, send them to login */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        
        {/* The Login Page */}
        <Route path="/login" element={<Login />} />
        
        {/* The Articles Dashboard Page */}
        <Route path="/articles" element={<ArticlesDashboard />} />
      </Routes>
    </Router>
  );
}

export default App;