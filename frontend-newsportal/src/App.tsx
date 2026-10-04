import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import ArticlesDashboard from './pages/ArticlesDashboard';
import AdminDashboard from './pages/AdminDashboard';
import AuthorWorkspace from './pages/AuthorWorkspace';
import FullArticle from './pages/FullArticle';
import UserProfilePage from './pages/UserProfilePage';
import ForgotPassword from './pages/ForgotPassword';
import LandingPage from './pages/LandingFile';
import { authService } from './services/authService';

interface ProtectedRouteProps {
    children: React.ReactNode;
    allowedRoles?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
    children,
    allowedRoles
}) => {
    const isAuthenticated = authService.isAuthenticated();
    const role = authService.getRole();

    // User is not logged in
    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    // Route requires a specific role
    if (allowedRoles && !allowedRoles.includes(role || '')) {
        return <Navigate to="/articles" replace />;
    }

    return <>{children}</>;
};

function App() {
    return (
        <Router>
            <Routes>

                {/* Public routes */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />

                {/* Logged-in users */}
                <Route
                    path="/articles"
                    element={
                        <ProtectedRoute>
                            <ArticlesDashboard />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/article/:id"
                    element={
                        <ProtectedRoute>
                            <FullArticle />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/profile"
                    element={
                        <ProtectedRoute>
                            <UserProfilePage />
                        </ProtectedRoute>
                    }
                />

                {/* Editor only */}
                <Route
                    path="/author"
                    element={
                        <ProtectedRoute allowedRoles={['ROLE_EDITOR', 'ROLE_AUTHOR']}>
                            <AuthorWorkspace />
                        </ProtectedRoute>
                    }
                />

                {/* Admin only */}
                <Route
                    path="/admin"
                    element={
                        <ProtectedRoute allowedRoles={['ROLE_ADMIN']}>
                            <AdminDashboard />
                        </ProtectedRoute>
                    }
                />

                {/* Unknown route */}
                <Route path="*" element={<Navigate to="/" replace />} />

            </Routes>
        </Router>
    );
}

export default App;