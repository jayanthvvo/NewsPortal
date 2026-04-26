import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register'; // <-- Import the new page
import ArticlesDashboard from './pages/ArticlesDashboard'; 

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} /> {/* <-- Add this route */}
        
        <Route path="/articles" element={<ArticlesDashboard />} />
        
        {/* Placeholders for the other roles we will build later */}
        <Route path="/admin" element={<h2>Admin Console</h2>} />
        <Route path="/author" element={<h2>Author Workspace</h2>} />
      </Routes>
    </Router>
  );
}

export default App;