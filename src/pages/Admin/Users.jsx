import React, { useState, useEffect } from 'react';
import './Users.css';

export default function Users() {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [currentPage, setCurrentPage] = useState(1);
  const [showAddUser, setShowAddUser] = useState(false);
  const [showEditUser, setShowEditUser] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [showCommunication, setShowCommunication] = useState(false);
  const [loading, setLoading] = useState(true);

  const itemsPerPage = 10;

  // Mock data - replace with real API calls
  const mockUsers = [
    {
      id: 1,
      name: 'John Doe',
      email: 'john@example.com',
      phone: '+91 98765 43210',
      role: 'customer',
      isActive: true,
      avatar: '/avatars/john.jpg',
      createdAt: '2024-01-15',
      lastLogin: '2025-09-22',
      orderCount: 5,
      totalSpent: 2500,
      address: '123 Main St, Mumbai',
      preferences: {
        emailNotifications: true,
        smsNotifications: false,
        marketingEmails: true
      }
    },
    {
      id: 2,
      name: 'Jane Smith',
      email: 'jane@example.com',
      phone: '+91 87654 32109',
      role: 'admin',
      isActive: true,
      avatar: '/avatars/jane.jpg',
      createdAt: '2024-03-20',
      lastLogin: '2025-09-23',
      orderCount: 0,
      totalSpent: 0,
      address: '456 Oak Ave, Delhi',
      preferences: {
        emailNotifications: true,
        smsNotifications: true,
        marketingEmails: false
      }
    },
    {
      id: 3,
      name: 'Mike Johnson',
      email: 'mike@example.com',
      phone: '+91 76543 21098',
      role: 'customer',
      isActive: false,
      avatar: '/avatars/mike.jpg',
      createdAt: '2024-02-10',
      lastLogin: '2025-08-15',
      orderCount: 12,
      totalSpent: 5800,
      address: '789 Pine St, Bangalore',
      preferences: {
        emailNotifications: false,
        smsNotifications: false,
        marketingEmails: false
      }
    }
  ];

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setUsers(mockUsers);
      setFilteredUsers(mockUsers);
      setLoading(false);
    }, 1000);
  }, []);

  // Filter and search logic
  useEffect(() => {
    let filtered = users;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.phone.includes(searchTerm)
      );
    }

    // Role filter
    if (filterRole !== 'all') {
      filtered = filtered.filter(user => user.role === filterRole);
    }

    // Status filter
    if (filterStatus !== 'all') {
      const isActive = filterStatus === 'active';
      filtered = filtered.filter(user => user.isActive === isActive);
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'email':
          return a.email.localeCompare(b.email);
        case 'createdAt':
          return new Date(b.createdAt) - new Date(a.createdAt);
        case 'lastLogin':
          return new Date(b.lastLogin) - new Date(a.lastLogin);
        case 'orderCount':
          return b.orderCount - a.orderCount;
        case 'totalSpent':
          return b.totalSpent - a.totalSpent;
        default:
          return 0;
      }
    });

    setFilteredUsers(filtered);
    setCurrentPage(1);
  }, [users, searchTerm, filterRole, filterStatus, sortBy]);

  // User actions
  const handleAddUser = () => {
    setSelectedUser(null);
    setShowAddUser(true);
  };

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setShowEditUser(true);
  };

  const handleDeleteUser = (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      setUsers(users.filter(user => user.id !== userId));
    }
  };

  const handleToggleStatus = (userId) => {
    setUsers(users.map(user =>
      user.id === userId ? { ...user, isActive: !user.isActive } : user
    ));
  };

  const handleSaveUser = (userData) => {
    if (selectedUser) {
      // Update existing user
      setUsers(users.map(user =>
        user.id === selectedUser.id ? { ...userData, id: selectedUser.id } : user
      ));
    } else {
      // Add new user
      const newUser = {
        ...userData,
        id: Date.now(),
        createdAt: new Date().toISOString().split('T')[0],
        orderCount: 0,
        totalSpent: 0
      };
      setUsers([...users, newUser]);
    }
    setShowAddUser(false);
    setShowEditUser(false);
  };

  const handleSelectUser = (userId) => {
    if (selectedUsers.includes(userId)) {
      setSelectedUsers(selectedUsers.filter(id => id !== userId));
    } else {
      setSelectedUsers([...selectedUsers, userId]);
    }
  };

  const handleSelectAllUsers = () => {
    if (selectedUsers.length === filteredUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(filteredUsers.map(user => user.id));
    }
  };

  const handleBulkAction = (action) => {
    switch (action) {
      case 'activate':
        setUsers(users.map(user =>
          selectedUsers.includes(user.id) ? { ...user, isActive: true } : user
        ));
        break;
      case 'deactivate':
        setUsers(users.map(user =>
          selectedUsers.includes(user.id) ? { ...user, isActive: false } : user
        ));
        break;
      case 'delete':
        if (window.confirm(`Are you sure you want to delete ${selectedUsers.length} users?`)) {
          setUsers(users.filter(user => !selectedUsers.includes(user.id)));
        }
        break;
    }
    setSelectedUsers([]);
    setShowBulkActions(false);
  };

  const exportUsers = (format) => {
    const data = filteredUsers.map(user => ({
      Name: user.name,
      Email: user.email,
      Phone: user.phone,
      Role: user.role,
      Status: user.isActive ? 'Active' : 'Inactive',
      'Orders': user.orderCount,
      'Total Spent': `₹${user.totalSpent}`,
      'Date Joined': user.createdAt,
      'Last Login': user.lastLogin
    }));

    if (format === 'csv') {
      const csv = convertToCSV(data);
      downloadFile(csv, 'users.csv', 'text/csv');
    }
  };

  const convertToCSV = (data) => {
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(row => Object.values(row).join(','));
    return [headers, ...rows].join('\n');
  };

  const downloadFile = (content, filename, contentType) => {
    const blob = new Blob([content], { type: contentType });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Pagination
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, startIndex + itemsPerPage);

  const stats = {
    total: users.length,
    active: users.filter(u => u.isActive).length,
    customers: users.filter(u => u.role === 'customer').length,
    admins: users.filter(u => u.role === 'admin').length,
    blocked: users.filter(u => !u.isActive).length
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

  return (
    <div className="users-page">
      {/* Header */}
      <div className="users-header">
        <div className="header-info">
          <h1>👥 Manage Users</h1>
          <p>Manage your customers and admin users</p>
        </div>
        <div className="header-actions">
          <button className="add-user-btn" onClick={handleAddUser}>
            ➕ Add User
          </button>
          <button className="export-btn" onClick={() => exportUsers('csv')}>
            📊 Export CSV
          </button>
          {selectedUsers.length > 0 && (
            <button 
              className="bulk-actions-btn"
              onClick={() => setShowBulkActions(!showBulkActions)}
            >
              ⚡ Bulk Actions ({selectedUsers.length})
            </button>
          )}
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="user-stats">
        <div className="stat-card total">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <h3>Total Users</h3>
            <p className="stat-number">{stats.total}</p>
            <span className="stat-change">+12% from last month</span>
          </div>
        </div>
        
        <div className="stat-card customers">
          <div className="stat-icon">🛒</div>
          <div className="stat-content">
            <h3>Active Customers</h3>
            <p className="stat-number">{stats.customers}</p>
            <span className="stat-change">+8% from last month</span>
          </div>
        </div>
        
        <div className="stat-card admins">
          <div className="stat-icon">👔</div>
          <div className="stat-content">
            <h3>Admins</h3>
            <p className="stat-number">{stats.admins}</p>
            <span className="stat-change">No change</span>
          </div>
        </div>
        
        <div className="stat-card blocked">
          <div className="stat-icon">🔒</div>
          <div className="stat-content">
            <h3>Blocked Users</h3>
            <p className="stat-number">{stats.blocked}</p>
            <span className="stat-change">-2% from last month</span>
          </div>
        </div>
      </div>

      {/* Bulk Actions Dropdown */}
      {showBulkActions && (
        <div className="bulk-actions-dropdown">
          <div className="bulk-actions-content">
            <button onClick={() => handleBulkAction('activate')}>
              ✅ Activate Selected Users
            </button>
            <button onClick={() => handleBulkAction('deactivate')}>
              ❌ Deactivate Selected Users
            </button>
            <button onClick={() => setShowCommunication(true)}>
              📧 Send Message to Selected
            </button>
            <button onClick={() => handleBulkAction('delete')} className="danger">
              🗑️ Delete Selected Users
            </button>
          </div>
        </div>
      )}

      {/* Search and Filter Controls */}
      <div className="users-controls">
        <div className="search-section">
          <div className="search-bar">
            <input
              type="text"
              placeholder="🔍 Search users by name, email, phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        <div className="filter-section">
          <select 
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Roles</option>
            <option value="customer">Customers</option>
            <option value="admin">Admins</option>
            <option value="super_admin">Super Admin</option>
          </select>
          
          <select 
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          
          <select 
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="filter-select"
          >
            <option value="createdAt">Date Joined</option>
            <option value="lastLogin">Last Login</option>
            <option value="name">Name</option>
            <option value="orderCount">Order Count</option>
            <option value="totalSpent">Total Spent</option>
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
                  checked={selectedUsers.length === paginatedUsers.length}
                  onChange={handleSelectAllUsers}
                />
              </th>
              <th>User</th>
              <th>Contact</th>
              <th>Role</th>
              <th>Status</th>
              <th>Orders</th>
              <th>Total Spent</th>
              <th>Last Login</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedUsers.map(user => (
              <tr key={user.id} className={selectedUsers.includes(user.id) ? 'selected' : ''}>
                <td>
                  <input
                    type="checkbox"
                    checked={selectedUsers.includes(user.id)}
                    onChange={() => handleSelectUser(user.id)}
                  />
                </td>
                <td className="user-cell">
                  <div className="user-info">
                    <div className="user-avatar">
                      {user.avatar ? (
                        <img src={user.avatar} alt={user.name} />
                      ) : (
                        <div className="avatar-placeholder">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="user-details">
                      <div className="user-name">{user.name}</div>
                      <div className="user-id">ID: {user.id}</div>
                    </div>
                  </div>
                </td>
                <td className="contact-cell">
                  <div className="contact-info">
                    <div className="email">{user.email}</div>
                    <div className="phone">{user.phone}</div>
                  </div>
                </td>
                <td>
                  <span className={`role-badge ${user.role}`}>
                    {user.role === 'customer' && '🛒'}
                    {user.role === 'admin' && '👔'}
                    {user.role === 'super_admin' && '👑'}
                    {user.role.replace('_', ' ').toUpperCase()}
                  </span>
                </td>
                <td>
                  <button
                    className={`status-toggle ${user.isActive ? 'active' : 'inactive'}`}
                    onClick={() => handleToggleStatus(user.id)}
                  >
                    {user.isActive ? '✅ Active' : '❌ Inactive'}
                  </button>
                </td>
                <td className="orders-cell">{user.orderCount}</td>
                <td className="spent-cell">₹{user.totalSpent.toLocaleString()}</td>
                <td className="login-cell">{user.lastLogin}</td>
                <td className="actions-cell">
                  <div className="action-buttons">
                    <button
                      className="action-btn edit"
                      onClick={() => handleEditUser(user)}
                      title="Edit User"
                    >
                      ✏️
                    </button>
                    <button
                      className="action-btn view"
                      title="View Details"
                    >
                      👁️
                    </button>
                    <button
                      className="action-btn delete"
                      onClick={() => handleDeleteUser(user.id)}
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
      </div>

      {/* Pagination */}
      <div className="pagination">
        <div className="pagination-info">
          Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredUsers.length)} of {filteredUsers.length} users
        </div>
        <div className="pagination-controls">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            ← Previous
          </button>
          
          {[...Array(totalPages)].map((_, i) => (
            <button
              key={i + 1}
              onClick={() => setCurrentPage(i + 1)}
              className={currentPage === i + 1 ? 'active' : ''}
            >
              {i + 1}
            </button>
          ))}
          
          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
          >
            Next →
          </button>
        </div>
      </div>

      {/* Modals */}
      {showAddUser && (
        <UserModal
          user={null}
          onClose={() => setShowAddUser(false)}
          onSave={handleSaveUser}
        />
      )}

      {showEditUser && (
        <UserModal
          user={selectedUser}
          onClose={() => setShowEditUser(false)}
          onSave={handleSaveUser}
        />
      )}

      {showCommunication && (
        <CommunicationModal
          selectedUsers={selectedUsers.map(id => users.find(u => u.id === id))}
          onClose={() => setShowCommunication(false)}
        />
      )}
    </div>
  );
}

// User Modal Component
const UserModal = ({ user, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    role: user?.role || 'customer',
    isActive: user?.isActive !== false,
    address: user?.address || '',
    preferences: user?.preferences || {
      emailNotifications: true,
      smsNotifications: false,
      marketingEmails: true
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content user-modal">
        <div className="modal-header">
          <h2>{user ? 'Edit User' : 'Add New User'}</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>
        
        <form onSubmit={handleSubmit} className="user-form">
          <div className="form-section">
            <h3>👤 Basic Information</h3>
            <div className="form-grid">
              <div className="form-group">
                <label>Full Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Email Address *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Phone Number</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                />
              </div>
              
              <div className="form-group">
                <label>Address</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>🔐 Role & Status</h3>
            <div className="form-grid">
              <div className="form-group">
                <label>Role</label>
                <select 
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                >
                  <option value="customer">Customer</option>
                  <option value="admin">Admin</option>
                  <option value="super_admin">Super Admin</option>
                </select>
              </div>
              
              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                  />
                  <span className="checkmark"></span>
                  Account Active
                </label>
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>⚙️ Preferences</h3>
            <div className="preferences-grid">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.preferences.emailNotifications}
                  onChange={(e) => setFormData({
                    ...formData,
                    preferences: {...formData.preferences, emailNotifications: e.target.checked}
                  })}
                />
                <span className="checkmark"></span>
                Email Notifications
              </label>
              
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.preferences.smsNotifications}
                  onChange={(e) => setFormData({
                    ...formData,
                    preferences: {...formData.preferences, smsNotifications: e.target.checked}
                  })}
                />
                <span className="checkmark"></span>
                SMS Notifications
              </label>
              
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.preferences.marketingEmails}
                  onChange={(e) => setFormData({
                    ...formData,
                    preferences: {...formData.preferences, marketingEmails: e.target.checked}
                  })}
                />
                <span className="checkmark"></span>
                Marketing Emails
              </label>
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
};

// Communication Modal Component
const CommunicationModal = ({ selectedUsers, onClose }) => {
  const [messageType, setMessageType] = useState('email');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [template, setTemplate] = useState('');

  const messageTemplates = {
    welcome: {
      subject: 'Welcome to Shafe\'s Handcraft!',
      message: 'Welcome to our handcraft community! We\'re excited to have you join us.'
    },
    promotion: {
      subject: 'Special Offer Just for You!',
      message: 'Don\'t miss out on our exclusive handcraft collection with special discounts.'
    },
    reminder: {
      subject: 'We Miss You!',
      message: 'Come back and explore our latest handcrafted items.'
    }
  };

  const handleTemplateChange = (templateKey) => {
    setTemplate(templateKey);
    if (templateKey && messageTemplates[templateKey]) {
      setSubject(messageTemplates[templateKey].subject);
      setMessage(messageTemplates[templateKey].message);
    } else {
      setSubject('');
      setMessage('');
    }
  };

  const handleSendMessage = () => {
    // Implement message sending logic
    alert(`Message sent to ${selectedUsers.length} users via ${messageType}`);
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content communication-modal">
        <div className="modal-header">
          <h2>💬 Send Message to Users</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>
        
        <div className="communication-form">
          <div className="form-section">
            <h3>Recipients ({selectedUsers.length} users)</h3>
            <div className="recipients-list">
              {selectedUsers.map(user => (
                <div key={user.id} className="recipient-item">
                  <span className="recipient-name">{user.name}</span>
                  <span className="recipient-email">{user.email}</span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="form-section">
            <h3>Message Type</h3>
            <div className="message-type-options">
              <label className="radio-label">
                <input
                  type="radio"
                  value="email"
                  checked={messageType === 'email'}
                  onChange={(e) => setMessageType(e.target.value)}
                />
                <span className="radio-custom"></span>
                📧 Email
              </label>
              
              <label className="radio-label">
                <input
                  type="radio"
                  value="sms"
                  checked={messageType === 'sms'}
                  onChange={(e) => setMessageType(e.target.value)}
                />
                <span className="radio-custom"></span>
                📱 SMS
              </label>
              
              <label className="radio-label">
                <input
                  type="radio"
                  value="notification"
                  checked={messageType === 'notification'}
                  onChange={(e) => setMessageType(e.target.value)}
                />
                <span className="radio-custom"></span>
                🔔 Push Notification
              </label>
            </div>
          </div>
          
          <div className="form-section">
            <h3>Message Template</h3>
            <select 
              value={template}
              onChange={(e) => handleTemplateChange(e.target.value)}
              className="template-select"
            >
              <option value="">Select a template</option>
              <option value="welcome">Welcome Message</option>
              <option value="promotion">Promotional Offer</option>
              <option value="reminder">Return Reminder</option>
            </select>
          </div>
          
          {messageType === 'email' && (
            <div className="form-section">
              <h3>Subject</h3>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Enter email subject"
                className="subject-input"
              />
            </div>
          )}
          
          <div className="form-section">
            <h3>Message</h3>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Enter your message"
              className="message-textarea"
              rows={6}
            />
          </div>
        </div>
        
        <div className="modal-footer">
          <button className="cancel-btn" onClick={onClose}>
            Cancel
          </button>
          <button className="send-btn" onClick={handleSendMessage}>
            📤 Send Message
          </button>
        </div>
      </div>
    </div>
  );
};
