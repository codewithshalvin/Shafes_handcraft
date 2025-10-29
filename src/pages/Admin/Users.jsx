import React, { useEffect, useState, useMemo } from 'react';
import './Users.css';

const API = 'http://localhost:5000';

export default function Users() {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [sortBy, setSortBy] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');

  // Fetch users data
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API}/api/admin/users?page=1&limit=1000`, {
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' }
        });
        const data = await res.json();
        if (!alive) return;
        if (data.success) {
          const list = data.users || [];
          setUsers(list.map(user => ({
            ...user,
            isActive: true,
            lastLogin: user.lastLogin || new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
            totalOrders: Math.floor(Math.random() * 50),
            totalSpent: Math.floor(Math.random() * 5000)
          })));
        } else {
          setError('Failed to load users');
        }
      } catch (e) {
        setError('Failed to load users');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  // Filter and sort users
  const filteredUsers = useMemo(() => {
    let filtered = users.filter(user => {
      const matchesSearch = !searchTerm || 
        user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesRole = roleFilter === 'all' || user.role === roleFilter;
      
      return matchesSearch && matchesRole;
    });

    // Sort users
    filtered.sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];
      
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }
      
      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [users, searchTerm, roleFilter, sortBy, sortDirection]);

  // Calculate statistics
  const stats = useMemo(() => {
    const total = users.length;
    const customers = users.filter(u => u.role === 'customer').length;
    return { total, customers };
  }, [users]);

  // Pagination
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentUsers = filteredUsers.slice(startIndex, endIndex);

  // Handle user selection
  const handleUserSelect = (userId) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSelectAll = () => {
    if (selectedUsers.length === currentUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(currentUsers.map(user => user._id));
    }
  };

  // Handle user actions
  const handleEditUser = (user) => {
    setEditingUser(user);
    setShowUserModal(true);
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        const res = await fetch(`${API}/api/admin/users/${userId}`, {
          method: 'DELETE',
          credentials: 'include'
        });
        if (res.ok) {
          setUsers(prev => prev.filter(u => u._id !== userId));
        }
      } catch (error) {
        console.error('Error deleting user:', error);
      }
    }
  };


  const handleSort = (field) => {
    if (sortBy === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDirection('asc');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getInitials = (name) => {
    return name ? name.split(' ').map(n => n[0]).join('').toUpperCase() : 'U';
  };

  if (loading) {
    return (
      <div className="users-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading users...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="users-page">
        <div className="loading-container">
          <p style={{ color: '#dc2626' }}>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="users-page">
      {/* Header */}
      <div className="users-header">
        <div className="header-info">
          <h1>User Management</h1>
          <p>Manage your platform users and their permissions</p>
        </div>
        <div className="header-actions">
          <button className="export-btn" onClick={() => console.log('Export users')}>
            📊 Export
          </button>
          <button className="add-user-btn" onClick={() => { setEditingUser(null); setShowUserModal(true); }}>
            ➕ Add User
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="user-stats">
        <div className="stat-card total">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <h3>Total Users</h3>
            <div className="stat-number">{stats.total}</div>
            <div className="stat-change">↗ +12 this month</div>
          </div>
        </div>
        <div className="stat-card customers">
          <div className="stat-icon">🛍️</div>
          <div className="stat-content">
            <h3>Customers</h3>
            <div className="stat-number">{stats.customers}</div>
            <div className="stat-change">↗ +8 this month</div>
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedUsers.length > 0 && (
        <div className="bulk-actions-dropdown">
          <div className="bulk-actions-content">
            <span>({selectedUsers.length} selected)</span>
            <button onClick={() => console.log('Send email to selected')}>
              📧 Send Email
            </button>
            <button onClick={() => console.log('Export selected')}>
              📊 Export Selected
            </button>
            <button className="danger" onClick={() => console.log('Delete selected')}>
              🗑️ Delete Selected
            </button>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="users-controls">
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search users by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-section">
          <select
            className="filter-select"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="all">All Roles</option>
            <option value="customer">Customers</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="users-table-container">
        <table className="users-table">
          <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  checked={selectedUsers.length === currentUsers.length && currentUsers.length > 0}
                  onChange={handleSelectAll}
                />
              </th>
              <th onClick={() => handleSort('name')} style={{ cursor: 'pointer' }}>
                User {sortBy === 'name' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => handleSort('email')} style={{ cursor: 'pointer' }}>
                Contact {sortBy === 'email' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => handleSort('role')} style={{ cursor: 'pointer' }}>
                Role {sortBy === 'role' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => handleSort('totalOrders')} style={{ cursor: 'pointer' }}>
                Orders {sortBy === 'totalOrders' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => handleSort('totalSpent')} style={{ cursor: 'pointer' }}>
                Spent {sortBy === 'totalSpent' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => handleSort('lastLogin')} style={{ cursor: 'pointer' }}>
                Last Login {sortBy === 'lastLogin' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentUsers.map(user => (
              <tr key={user._id} className={selectedUsers.includes(user._id) ? 'selected' : ''}>
                <td>
                  <input
                    type="checkbox"
                    checked={selectedUsers.includes(user._id)}
                    onChange={() => handleUserSelect(user._id)}
                  />
                </td>
                <td className="user-cell">
                  <div className="user-info">
                    <div className="user-avatar">
                      {user.avatar ? (
                        <img src={user.avatar} alt={user.name || 'User'} />
                      ) : (
                        <div className="avatar-placeholder">
                          {getInitials(user.name || user.email)}
                        </div>
                      )}
                    </div>
                    <div className="user-details">
                      <div className="user-name">{user.name || 'Unknown User'}</div>
                      <div className="user-id">ID: {user._id?.slice(-6)}</div>
                    </div>
                  </div>
                </td>
                <td className="contact-cell">
                  <div className="contact-info">
                    <div className="email">{user.email}</div>
                    <div className="phone">{user.phone || 'No phone'}</div>
                  </div>
                </td>
                <td>
                  <span className={`role-badge ${user.role}`}>
                    👤 Customer
                  </span>
                </td>
                <td className="orders-cell">{user.totalOrders}</td>
                <td className="spent-cell">${user.totalSpent.toLocaleString()}</td>
                <td className="login-cell">{formatDate(user.lastLogin)}</td>
                <td className="actions-cell">
                  <div className="action-buttons">
                    <button
                      className="action-btn view"
                      onClick={() => console.log('View user:', user._id)}
                      title="View Details"
                    >
                      👁️
                    </button>
                    <button
                      className="action-btn edit"
                      onClick={() => handleEditUser(user)}
                      title="Edit User"
                    >
                      ✏️
                    </button>
                    <button
                      className="action-btn delete"
                      onClick={() => handleDeleteUser(user._id)}
                      title="Delete User"
                    >
                      🗑️
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {currentUsers.length === 0 && (
          <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
            No users found matching your criteria.
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination">
          <div className="pagination-info">
            Showing {startIndex + 1} to {Math.min(endIndex, filteredUsers.length)} of {filteredUsers.length} users
          </div>
          <div className="pagination-controls">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(1)}
            >
              First
            </button>
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(currentPage - 1)}
            >
              Previous
            </button>
            
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pageNum = currentPage <= 3 ? i + 1 : currentPage - 2 + i;
              if (pageNum > totalPages) return null;
              return (
                <button
                  key={pageNum}
                  className={pageNum === currentPage ? 'active' : ''}
                  onClick={() => setCurrentPage(pageNum)}
                >
                  {pageNum}
                </button>
              );
            })}
            
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(currentPage + 1)}
            >
              Next
            </button>
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(totalPages)}
            >
              Last
            </button>
          </div>
        </div>
      )}

      {/* User Modal */}
      {showUserModal && (
        <UserModal
          user={editingUser}
          onClose={() => {
            setShowUserModal(false);
            setEditingUser(null);
          }}
          onSave={(userData) => {
            if (editingUser) {
              // Update existing user
              setUsers(prev => prev.map(u => 
                u._id === editingUser._id ? { ...u, ...userData } : u
              ));
            } else {
              // Add new user
              const newUser = {
                _id: Date.now().toString(),
                ...userData,
                isActive: true,
                lastLogin: new Date().toISOString(),
                totalOrders: 0,
                totalSpent: 0
              };
              setUsers(prev => [newUser, ...prev]);
            }
            setShowUserModal(false);
            setEditingUser(null);
          }}
        />
      )}
    </div>
  );
}

// User Modal Component
function UserModal({ user, onClose, onSave }) {
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    role: user?.role || 'customer',
    ...user
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{user ? 'Edit User' : 'Add New User'}</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <form className="user-form" onSubmit={handleSubmit}>
          <div className="form-section">
            <h3>👤 Personal Information</h3>
            <div className="form-grid">
              <div className="form-group">
                <label>Full Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Email Address</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Phone Number</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => handleChange('role', e.target.value)}
                >
                  <option value="customer">Customer</option>
                </select>
              </div>
            </div>
          </div>
          
          <div className="modal-footer">
            <button type="button" className="cancel-btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="save-btn">
              {user ? 'Update User' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
