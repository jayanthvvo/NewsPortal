import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import ArticlesDashboard from './pages/ArticlesDashboard'; 
import AdminDashboard from './pages/AdminDashboard'; // <-- Added import
import AuthorWorkspace from './pages/AuthorWorkspace';
import FullArticle from './pages/FullArticle';
import UserProfilePage from './pages/UserProfilePage';
import ForgotPassword from './pages/ForgotPassword';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        <Route path="/articles" element={<ArticlesDashboard />} />
        <Route path="/article/:id" element={<FullArticle />} />  {/* <-- ADD THIS */}
        {/* Updated Admin Route */}
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/profile" element={<UserProfilePage />} />
        {/* Placeholder for the author we will build later */}
        <Route path="/author" element={<AuthorWorkspace />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
      </Routes>
    </Router>
  );
}

export default App;