import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import ArticlesDashboard from './pages/ArticlesDashboard'; 
import AdminDashboard from './pages/AdminDashboard'; // <-- Added import
import AuthorWorkspace from './pages/AuthorWorkspace';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        <Route path="/articles" element={<ArticlesDashboard />} />
        
        {/* Updated Admin Route */}
        <Route path="/admin" element={<AdminDashboard />} />
        
        {/* Placeholder for the author we will build later */}
        <Route path="/author" element={<AuthorWorkspace />} />
      </Routes>
    </Router>
  );
}

export default App;