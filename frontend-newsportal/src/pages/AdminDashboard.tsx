import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminService, type User } from '../services/adminService';
import { authService } from '../services/authService';

const AdminDashboard: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const navigate = useNavigate();

    useEffect(() => {
        // SECURITY CHECK: Kick out anyone who isn't an Admin!
        const role = authService.getRole();
        if (!authService.isAuthenticated() || role !== 'ROLE_ADMIN') {
            alert("Unauthorized access. Admins only.");
            navigate('/login');
            return;
        }

        fetchUsers();
    }, [navigate]);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const data = await adminService.getAllUsers();
            setUsers(data);
        } catch (error) {
            console.error("Error fetching users");
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (userId: number, username: string) => {
        if (!window.confirm(`Are you sure you want to approve ${username}?`)) return;

        try {
            await adminService.approveUser(userId);
            alert("User approved successfully!");
            fetchUsers(); // Refresh the list to show the updated status
        } catch (error) {
            alert("Failed to approve user. Check your Java backend logs.");
        }
    };

    const handleLogout = () => {
        authService.logout();
        navigate('/login');
    };

    return (
        <div style={{ padding: '20px', fontFamily: 'sans-serif', maxWidth: '1000px', margin: '0 auto' }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #0056b3', paddingBottom: '10px', marginBottom: '20px' }}>
                <h1 style={{ color: '#0056b3', margin: 0 }}>System Admin Console</h1>
                <button onClick={handleLogout} style={{ padding: '8px 16px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                    Logout
                </button>
            </header>

            <main>
                <h2>User Management</h2>
                
                {loading ? (
                    <p>Loading users...</p>
                ) : users.length === 0 ? (
                    <p>No pending approval requests at this time. You're all caught up!</p>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
                        <thead>
                            <tr style={{ backgroundColor: '#f4f7f6', textAlign: 'left' }}>
                                <th style={{ padding: '12px', borderBottom: '2px solid #ddd' }}>ID</th>
                                <th style={{ padding: '12px', borderBottom: '2px solid #ddd' }}>Username</th>
                                <th style={{ padding: '12px', borderBottom: '2px solid #ddd' }}>Email</th>
                                <th style={{ padding: '12px', borderBottom: '2px solid #ddd' }}>Requested Role</th>
                                <th style={{ padding: '12px', borderBottom: '2px solid #ddd' }}>Status</th>
                                <th style={{ padding: '12px', borderBottom: '2px solid #ddd' }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((user) => (
                                <tr key={user.id} style={{ borderBottom: '1px solid #eee' }}>
                                    <td style={{ padding: '12px' }}>{user.id}</td>
                                    <td style={{ padding: '12px', fontWeight: 'bold' }}>{user.username}</td>
                                    <td style={{ padding: '12px' }}>{user.email}</td>
                                    <td style={{ padding: '12px' }}>
                                        <span style={{ 
                                            padding: '4px 8px', 
                                            borderRadius: '4px', 
                                            backgroundColor: user.role === 'ROLE_ADMIN' ? '#f8d7da' : user.role === 'ROLE_AUTHOR' ? '#fff3cd' : '#e2e3e5',
                                            fontSize: '12px'
                                        }}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td style={{ padding: '12px' }}>
                                        <strong style={{ color: user.status === 'PENDING' ? '#d9534f' : '#28a745' }}>
                                            {user.status}
                                        </strong>
                                    </td>
                                    <td style={{ padding: '12px' }}>
                                        {user.status === 'PENDING' ? (
                                            <button 
                                                onClick={() => handleApprove(user.id, user.username)}
                                                style={{ padding: '6px 12px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                                            >
                                                Approve
                                            </button>
                                        ) : (
                                            <span style={{ color: '#6c757d', fontSize: '14px' }}>Active</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </main>
        </div>
    );
};

export default AdminDashboard;