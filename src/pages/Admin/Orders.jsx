import { useState, useEffect } from "react";

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showModal, setShowModal] = useState(false);
  
  // Filter states
  const [filterType, setFilterType] = useState('all'); // 'all', 'date', 'week', 'month', 'year'
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedWeek, setSelectedWeek] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [totalOrders, setTotalOrders] = useState(0);

  useEffect(() => {
    fetchOrders();
  }, [filterType, selectedDate, selectedWeek, selectedMonth, selectedYear]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      let url = "http://localhost:5000/api/admin/all-orders";
      
      // Build filtered URL if filter is active
      if (filterType !== 'all') {
        url = "http://localhost:5000/api/admin/orders/filter?";
        const params = new URLSearchParams();
        params.append('filterType', filterType);
        
        switch (filterType) {
          case 'date':
            if (selectedDate) params.append('date', selectedDate);
            break;
          case 'week':
            if (selectedWeek) params.append('week', selectedWeek);
            if (selectedYear) params.append('year', selectedYear);
            break;
          case 'month':
            if (selectedMonth) params.append('month', selectedMonth);
            if (selectedYear) params.append('year', selectedYear);
            break;
          case 'year':
            if (selectedYear) params.append('year', selectedYear);
            break;
        }
        
        url += params.toString();
      }
      
      const response = await fetch(url);
      const data = await response.json();
      if (data.success) {
        console.log('📦 Orders fetched:', data.orders.length);
        // Debug: Check for custom photos in orders
        data.orders.forEach((order, orderIndex) => {
          if (order.items) {
            order.items.forEach((item, itemIndex) => {
              if (item.customPhoto) {
                console.log(`📷 Order ${orderIndex + 1}, Item ${itemIndex + 1} has custom photo:`, {
                  hasImage: !!item.customPhoto.image,
                  imageType: typeof item.customPhoto.image,
                  imageStart: item.customPhoto.image ? item.customPhoto.image.substring(0, 50) + '...' : 'null',
                  photoName: item.customPhoto.name
                });
              }
            });
          }
        });
        setOrders(data.orders);
        setTotalOrders(data.count || data.orders.length);
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId, status) => {
    try {
      await fetch(`http://localhost:5000/api/admin/orders/${orderId}/status`, {
        method: "PUT",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({ status }),
      });
      fetchOrders();
    } catch (error) {
      console.error("Status update failed:", error);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount) => {
    return `₹${amount?.toFixed(2) || '0.00'}`;
  };

  const downloadPhoto = (photoData, filename) => {
    console.log('Downloading photo:', photoData);
    if (!photoData || (!photoData.filePath && !photoData.image)) {
      alert('No photo available to download - the photo data appears to be missing or corrupted.');
      return;
    }

    try {
      let downloadUrl = null;
      let downloadFilename = filename || photoData.name || 'customer-photo.jpg';
      
      // Ensure filename has proper extension
      if (!downloadFilename.includes('.')) {
        downloadFilename += '.jpg';
      }
      
      // Priority: filePath > image field > fallback
      if (photoData.filePath) {
        downloadUrl = `http://localhost:5000${photoData.filePath}`;
      } else if (photoData.image) {
        if (photoData.image.startsWith('data:image/')) {
          downloadUrl = photoData.image;
        } else if (photoData.image.startsWith('http')) {
          downloadUrl = photoData.image;
        } else {
          downloadUrl = `http://localhost:5000${photoData.image}`;
        }
      }
      
      if (!downloadUrl) {
        alert('No valid photo URL found for download');
        return;
      }
      
      // Create a link element and trigger download
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = downloadFilename;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      console.log('Download initiated for:', downloadFilename);
    } catch (error) {
      console.error('Failed to download photo:', error);
      alert('Failed to download photo: ' + error.message);
    }
  };

  const openPhotoInNewTab = (photoData) => {
    console.log('🔍 Opening photo - Full data:', JSON.stringify(photoData, null, 2));
    console.log('📊 Photo data analysis:', {
      hasPhotoData: !!photoData,
      hasFilePath: !!photoData?.filePath,
      hasImage: !!photoData?.image,
      filePath: photoData?.filePath,
      imageStart: photoData?.image ? photoData.image.substring(0, 100) + '...' : 'null',
      name: photoData?.name,
      type: photoData?.type
    });
    
    // Check if photoData exists and has any actual image data
    if (!photoData || (!photoData.filePath && !photoData.image)) {
      console.log('⚠️ No photo data or empty photo object');
      alert('No photo available to view - the photo data appears to be missing or corrupted.');
      return;
    }
    
    try {
      let imageUrl = null;
      
      console.log('🎯 Processing photo URL...');
      
      // Priority: filePath > image field > fallback
      if (photoData.filePath) {
        imageUrl = `http://localhost:5000${photoData.filePath}`;
        console.log('✅ Using filePath:', imageUrl);
      } else if (photoData.image) {
        if (photoData.image.startsWith('data:image/')) {
          console.log('✅ Using base64 image');
          // Handle base64 images
          const newWindow = window.open();
          newWindow.document.write(`
            <html>
              <head><title>Customer Photo</title></head>
              <body style="margin:0; display:flex; justify-content:center; align-items:center; min-height:100vh; background:#f0f0f0;">
                <img src="${photoData.image}" alt="Customer Photo" style="max-width:90vw; max-height:90vh; box-shadow: 0 4px 8px rgba(0,0,0,0.1);" />
              </body>
            </html>
          `);
          newWindow.document.close();
          return;
        } else if (photoData.image.startsWith('http')) {
          imageUrl = photoData.image;
          console.log('✅ Using full HTTP URL:', imageUrl);
        } else if (photoData.image.startsWith('/uploads/')) {
          imageUrl = `http://localhost:5000${photoData.image}`;
          console.log('✅ Using relative uploads path:', imageUrl);
        } else {
          // Try as relative path anyway
          imageUrl = `http://localhost:5000${photoData.image}`;
          console.log('⚠️ Using fallback relative path:', imageUrl);
        }
      } else {
        // Last resort: check if there are any image-like properties
        const possibleImageFields = ['url', 'src', 'path', 'fileName'];
        for (const field of possibleImageFields) {
          if (photoData[field] && typeof photoData[field] === 'string') {
            if (photoData[field].startsWith('data:image/')) {
              console.log(`🎯 Found base64 in field '${field}'`);
              const newWindow = window.open();
              newWindow.document.write(`
                <html>
                  <head><title>Customer Photo</title></head>
                  <body style="margin:0; display:flex; justify-content:center; align-items:center; min-height:100vh; background:#f0f0f0;">
                    <img src="${photoData[field]}" alt="Customer Photo" style="max-width:90vw; max-height:90vh; box-shadow: 0 4px 8px rgba(0,0,0,0.1);" />
                  </body>
                </html>
              `);
              newWindow.document.close();
              return;
            } else {
              imageUrl = photoData[field].startsWith('http') ? photoData[field] : `http://localhost:5000${photoData[field]}`;
              console.log(`🎯 Found URL in field '${field}':`, imageUrl);
              break;
            }
          }
        }
      }
      
      if (imageUrl) {
        console.log('🌍 Opening URL:', imageUrl);
        window.open(imageUrl, '_blank');
      } else {
        console.error('❌ No valid image URL found in:', photoData);
        alert('No valid photo URL found. Check console for details.');
      }
      
    } catch (error) {
      console.error('Failed to open photo:', error);
      alert('Failed to open photo. Please try again.');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: "#ffc107",
      confirmed: "#17a2b8", 
      processing: "#fd7e14",
      shipped: "#6f42c1",
      delivered: "#28a745",
      cancelled: "#dc3545"
    };
    return colors[status] || "#6c757d";
  };

  const viewOrderDetails = (order) => {
    setSelectedOrder(order);
    setShowModal(true);
  };

  if (loading) {
    return <div style={{ padding: '2rem' }}>Loading orders...</div>;
  }

  const handleFilterTypeChange = (type) => {
    setFilterType(type);
    // Reset specific filters when changing type
    setSelectedDate('');
    setSelectedWeek('');
    setSelectedMonth('');
  };

  const clearFilters = () => {
    setFilterType('all');
    setSelectedDate('');
    setSelectedWeek('');
    setSelectedMonth('');
    setSelectedYear(new Date().getFullYear());
  };

  // Generate options for year selector
  const generateYearOptions = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = currentYear; i >= currentYear - 5; i--) {
      years.push(i);
    }
    return years;
  };

  // Generate week options (1-52)
  const generateWeekOptions = () => {
    const weeks = [];
    for (let i = 1; i <= 52; i++) {
      weeks.push(i);
    }
    return weeks;
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
      <h1 style={{ color: '#2c3e50', marginBottom: '2rem' }}>
        📦 Orders Management ({totalOrders})
      </h1>
      
      {/* Filter Section */}
      <div style={{ 
        background: 'white',
        borderRadius: '10px',
        padding: '1.5rem',
        marginBottom: '1.5rem',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
      }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '1rem',
          flexWrap: 'wrap'
        }}>
          <label style={{ fontWeight: '600', color: '#2c3e50' }}>Filter by:</label>
          
          <select 
            value={filterType} 
            onChange={(e) => handleFilterTypeChange(e.target.value)}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '6px',
              border: '2px solid #e0e0e0',
              fontSize: '0.9rem',
              cursor: 'pointer',
              background: 'white'
            }}
          >
            <option value="all">All Orders</option>
            <option value="date">Specific Date</option>
            <option value="week">Week</option>
            <option value="month">Month</option>
            <option value="year">Year</option>
          </select>

          {filterType === 'date' && (
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '6px',
                border: '2px solid #007bff',
                fontSize: '0.9rem'
              }}
            />
          )}

          {filterType === 'week' && (
            <>
              <select
                value={selectedWeek}
                onChange={(e) => setSelectedWeek(e.target.value)}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '6px',
                  border: '2px solid #007bff',
                  fontSize: '0.9rem',
                  cursor: 'pointer'
                }}
              >
                <option value="">Select Week</option>
                {generateWeekOptions().map(week => (
                  <option key={week} value={week}>Week {week}</option>
                ))}
              </select>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '6px',
                  border: '2px solid #007bff',
                  fontSize: '0.9rem',
                  cursor: 'pointer'
                }}
              >
                {generateYearOptions().map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </>
          )}

          {filterType === 'month' && (
            <>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '6px',
                  border: '2px solid #007bff',
                  fontSize: '0.9rem',
                  cursor: 'pointer'
                }}
              >
                <option value="">Select Month</option>
                <option value="1">January</option>
                <option value="2">February</option>
                <option value="3">March</option>
                <option value="4">April</option>
                <option value="5">May</option>
                <option value="6">June</option>
                <option value="7">July</option>
                <option value="8">August</option>
                <option value="9">September</option>
                <option value="10">October</option>
                <option value="11">November</option>
                <option value="12">December</option>
              </select>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '6px',
                  border: '2px solid #007bff',
                  fontSize: '0.9rem',
                  cursor: 'pointer'
                }}
              >
                {generateYearOptions().map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </>
          )}

          {filterType === 'year' && (
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '6px',
                border: '2px solid #007bff',
                fontSize: '0.9rem',
                cursor: 'pointer'
              }}
            >
              {generateYearOptions().map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          )}

          {filterType !== 'all' && (
            <button
              onClick={clearFilters}
              style={{
                background: '#dc3545',
                color: 'white',
                border: 'none',
                padding: '0.5rem 1rem',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.9rem',
                fontWeight: '500'
              }}
            >
              Clear Filters
            </button>
          )}

          <div style={{ 
            marginLeft: 'auto',
            padding: '0.5rem 1rem',
            background: '#e3f2fd',
            borderRadius: '6px',
            color: '#1976d2',
            fontWeight: '600'
          }}>
            Showing: {orders.length} order{orders.length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>
      <div style={{ 
        background: 'white',
        borderRadius: '10px',
        overflow: 'hidden',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
      }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ 
            width: '100%', 
            borderCollapse: 'collapse',
            minWidth: '1000px'
          }}>
            <thead>
              <tr style={{ background: '#f8f9fa' }}>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>Order ID</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>Customer</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>Products</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>Date</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>Amount</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>Payment</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>Status</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order._id} style={{
                  borderBottom: '1px solid #eee',
                  transition: 'background 0.2s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#f8f9fa'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                >
                  <td style={{ padding: '1rem' }}>
                    <div>
                      <strong style={{ color: '#007bff' }}>{order.orderId}</strong>
                      <br />
                      <small style={{ color: '#6c757d' }}>
                        {formatDate(order.createdAt)}
                      </small>
                    </div>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <div>
                      <strong>{order.user?.name || order.shippingAddress?.name || 'N/A'}</strong>
                      <br />
                      <small style={{ color: '#6c757d' }}>
                        {order.user?.email || order.shippingAddress?.email || 'N/A'}
                      </small>
                    </div>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', maxWidth: '200px' }}>
                      {order.items?.slice(0, 3).map((item, itemIndex) => (
                        <div key={itemIndex} style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          background: '#f8f9fa', 
                          padding: '6px',
                          borderRadius: '6px',
                          fontSize: '0.85rem',
                          minWidth: '160px'
                        }}>
                          {item.product?.image && (
                            <img 
                              src={`http://localhost:5000${item.product.image}`} 
                              alt={item.product?.name}
                              style={{ 
                                width: '30px', 
                                height: '30px', 
                                objectFit: 'cover', 
                                borderRadius: '4px',
                                marginRight: '8px',
                                border: '1px solid #ddd'
                              }}
                              onError={(e) => {
                                e.target.style.display = 'none';
                              }}
                            />
                          )}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ 
                              fontWeight: '500', 
                              color: '#2c3e50',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}>
                              {item.isCustomDesign ? item.customDesign?.name : item.product?.name || 'Product'}
                            </div>
                            <div style={{ color: '#6c757d', fontSize: '0.75rem' }}>
                              Qty: {item.quantity} × ₹{item.price}
                            </div>
                            {/* Photo debug info */}
                            {item.customPhoto && !(item.customPhoto.filePath || item.customPhoto.image) && (
                              <div style={{ 
                                marginTop: '4px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                backgroundColor: '#fff3cd',
                                padding: '4px 8px',
                                borderRadius: '12px',
                                fontSize: '0.7rem'
                              }}>
                                
                              </div>
                            )}
                            {item.customPhoto && (item.customPhoto.filePath || item.customPhoto.image) && (
                              <div style={{ 
                                marginTop: '4px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                backgroundColor: '#e8f4fd',
                                padding: '4px 8px',
                                borderRadius: '12px',
                                fontSize: '0.7rem'
                              }}>
                                <span>📷</span>
                                <span style={{ color: '#1976d2' }}>Photo attached</span>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openPhotoInNewTab(item.customPhoto);
                                  }}
                                  style={{
                                    background: 'none',
                                    border: 'none',
                                    color: '#1976d2',
                                    cursor: 'pointer',
                                    padding: '0',
                                    fontSize: '0.7rem',
                                    textDecoration: 'underline'
                                  }}
                                >
                                  View
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                      {order.items?.length > 3 && (
                        <div style={{
                          background: '#e9ecef',
                          padding: '6px 12px',
                          borderRadius: '6px',
                          fontSize: '0.8rem',
                          color: '#495057',
                          fontWeight: '500'
                        }}>
                          +{order.items.length - 3} more
                        </div>
                      )}
                    </div>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    {formatDate(order.createdAt)}
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <strong style={{ color: '#28a745', fontSize: '1.1rem' }}>
                      {formatCurrency(order.totalAmount)}
                    </strong>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{
                      background: order.paymentStatus === 'paid' ? '#d4edda' : '#fff3cd',
                      color: order.paymentStatus === 'paid' ? '#155724' : '#856404',
                      padding: '0.25rem 0.75rem',
                      borderRadius: '15px',
                      fontSize: '0.8rem',
                      fontWeight: '600',
                      textTransform: 'uppercase'
                    }}>
                      {order.paymentStatus || 'pending'}
                    </span>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <select
                      value={order.orderStatus}
                      onChange={e => updateOrderStatus(order.orderId, e.target.value)}
                      style={{
                        background: getStatusColor(order.orderStatus),
                        color: 'white',
                        padding: '0.4rem 1rem',
                        borderRadius: '20px',
                        fontSize: '0.8rem',
                        fontWeight: '600',
                        textTransform: 'capitalize',
                        border: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="processing">Processing</option>
                      <option value="shipped">Shipped</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <button
                      onClick={() => viewOrderDetails(order)}
                      style={{
                        background: '#007bff',
                        color: 'white',
                        border: 'none',
                        padding: '0.5rem 1rem',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '0.9rem'
                      }}
                    >
                      👁️ View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {orders.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: '3rem',
            color: '#666'
          }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📦</div>
            <h3>No orders found</h3>
          </div>
        )}
      </div>
      {showModal && selectedOrder && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000
        }} onClick={() => setShowModal(false)}>
          <div style={{
            background: 'white',
            borderRadius: '15px',
            padding: '2rem',
            maxWidth: '900px',
            maxHeight: '90vh',
            overflowY: 'auto',
            margin: '1rem'
          }} onClick={e => e.stopPropagation()}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '2rem',
              borderBottom: '1px solid #eee',
              paddingBottom: '1rem'
            }}>
              <h2 style={{ margin: 0, color: '#2c3e50' }}>
                Order Details - {selectedOrder.orderId}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '2rem',
                  cursor: 'pointer',
                  color: '#666'
                }}
              >
                ×
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
              <div>
                <h3>Order Information</h3>
                <div style={{ background: '#f8f9fa', padding: '1rem', borderRadius: '8px' }}>
                  <p><strong>Order ID:</strong> {selectedOrder.orderId}</p>
                  <p><strong>Date:</strong> {formatDate(selectedOrder.createdAt)}</p>
                  <p><strong>Status:</strong> {selectedOrder.orderStatus}</p>
                  <p><strong>Payment:</strong> {selectedOrder.paymentStatus}</p>
                  <p><strong>Total:</strong> {formatCurrency(selectedOrder.totalAmount)}</p>
                </div>
              </div>
              <div>
                <h3>Customer Details</h3>
                <div style={{ background: '#f8f9fa', padding: '1rem', borderRadius: '8px' }}>
                  <p><strong>Name:</strong> {selectedOrder.shippingAddress?.name}</p>
                  <p><strong>Email:</strong> {selectedOrder.shippingAddress?.email}</p>
                  <p><strong>Phone:</strong> {selectedOrder.shippingAddress?.phone}</p>
                  <p><strong>Address:</strong> {selectedOrder.shippingAddress?.address}</p>
                </div>
              </div>
            </div>
            <div>
              <h3>Order Items</h3>
              <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                {selectedOrder.items?.map((item, index) => (
                  <div key={index} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    padding: '1rem',
                    background: '#f8f9fa',
                    borderRadius: '8px',
                    marginBottom: '1rem'
                  }}>
                    {item.product?.image && (
                      <img 
                        src={`http://localhost:5000${item.product.image}`} 
                        alt={item.product?.name}
                        style={{ 
                          width: '80px', 
                          height: '80px', 
                          objectFit: 'cover', 
                          borderRadius: '8px',
                          border: '2px solid #ddd'
                        }}
                        onError={e => { e.target.src = '/placeholder-image.jpg'; }}
                      />
                    )}
                    <div style={{ flex: 1 }}>
                      <h4 style={{ margin: '0 0 0.5rem 0', color: '#2c3e50' }}>
                        {item.isCustomDesign ? item.customDesign?.name : item.product?.name}
                        {item.isCustomDesign && <span style={{ 
                          background: '#ff6b6b', 
                          color: 'white', 
                          padding: '0.2rem 0.5rem', 
                          borderRadius: '10px', 
                          fontSize: '0.7rem',
                          marginLeft: '0.5rem'
                        }}>Custom</span>}
                      </h4>
                      <p style={{ margin: '0', color: '#666' }}>
                        Quantity: {item.quantity} × {formatCurrency(item.price)} = {formatCurrency(item.quantity * item.price)}
                      </p>
                      {item.product?.description && (
                        <p style={{ margin: '0.5rem 0 0 0', color: '#888', fontSize: '0.9rem' }}>
                          {item.product.description.substring(0, 100)}...
                        </p>
                      )}
                      {item.specialRequest && item.specialRequest.trim() && (
                        <div style={{
                          backgroundColor: '#fff3e0',
                          border: '1px solid #ffcc02',
                          borderRadius: '6px',
                          padding: '8px',
                          margin: '8px 0',
                          fontSize: '0.85rem'
                        }}>
                          <strong style={{ color: '#f57c00' }}>📝 Special Request:</strong>
                          <p style={{ margin: '4px 0 0 0', color: '#666' }}>"{item.specialRequest.trim()}"</p>
                        </div>
                      )}
                      {/* ✅ Multiple Photos Display (Preferred) */}
                      {item.customPhotos && item.customPhotos.length > 0 && (
                        <div style={{
                          backgroundColor: '#e8f4fd',
                          border: '1px solid #1976d2',
                          borderRadius: '6px',
                          padding: '8px',
                          margin: '8px 0',
                          fontSize: '0.85rem'
                        }}>
                          <div style={{ 
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '8px'
                          }}>
                            <strong style={{ color: '#1976d2' }}>📸 Customer Photos ({item.customPhotos.length})</strong>
                          </div>
                          <div style={{ 
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
                            gap: '8px',
                            marginBottom: '8px'
                          }}>
                            {item.customPhotos.map((photo, photoIndex) => {
                              const getPhotoUrl = (photo) => {
                                if (photo.filePath) {
                                  return `http://localhost:5000${photo.filePath}`;
                                }
                                if (photo.image && photo.image.startsWith('data:image/')) {
                                  return photo.image;
                                }
                                if (photo.image && photo.image.startsWith('/uploads')) {
                                  return `http://localhost:5000${photo.image}`;
                                }
                                return photo.image || 'https://via.placeholder.com/100?text=Error';
                              };
                              
                              const photoUrl = getPhotoUrl(photo);
                              
                              return (
                                <div key={photoIndex} style={{
                                  border: '1px solid #ddd',
                                  borderRadius: '4px',
                                  overflow: 'hidden',
                                  backgroundColor: 'white'
                                }}>
                                  <img
                                    src={photoUrl}
                                    alt={`Customer photo ${photoIndex + 1}`}
                                    style={{
                                      width: '100%',
                                      height: '80px',
                                      objectFit: 'cover',
                                      cursor: 'pointer'
                                    }}
                                    onClick={() => openPhotoInNewTab(photo)}
                                    onError={(e) => {
                                      console.error('Image load failed for photo:', photo);
                                      e.target.src = 'https://via.placeholder.com/80?text=Error';
                                    }}
                                  />
                                  <div style={{ 
                                    padding: '4px',
                                    fontSize: '0.7rem',
                                    color: '#666',
                                    textAlign: 'center'
                                  }}>
                                    <div>{photo.name ? (photo.name.length > 15 ? photo.name.substring(0, 15) + '...' : photo.name) : `Photo ${photoIndex + 1}`}</div>
                                    <div style={{ display: 'flex', justifyContent: 'center', gap: '4px', marginTop: '2px' }}>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          openPhotoInNewTab(photo);
                                        }}
                                        style={{
                                          background: '#1976d2',
                                          color: 'white',
                                          border: 'none',
                                          padding: '2px 6px',
                                          borderRadius: '3px',
                                          fontSize: '0.6rem',
                                          cursor: 'pointer'
                                        }}
                                      >
                                        👁️
                                      </button>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          downloadPhoto(photo, `order-${selectedOrder.orderId}-photo-${photoIndex + 1}.jpg`);
                                        }}
                                        style={{
                                          background: '#4caf50',
                                          color: 'white',
                                          border: 'none',
                                          padding: '2px 6px',
                                          borderRadius: '3px',
                                          fontSize: '0.6rem',
                                          cursor: 'pointer'
                                        }}
                                      >
                                        💾
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                      
                      {/* ✅ Single Photo Display (Backward Compatibility) */}
                      {(!item.customPhotos || item.customPhotos.length === 0) && item.customPhoto && !(item.customPhoto.filePath || item.customPhoto.image) && (
                        <div style={{
                          backgroundColor: '#fff3cd',
                          border: '1px solid #ffc107',
                          borderRadius: '6px',
                          padding: '8px',
                          margin: '8px 0',
                          fontSize: '0.85rem'
                        }}>
                          <div style={{ color: '#856404' }}>
                            <strong>⚠️ Photo Upload Issue</strong>
                            <p style={{ margin: '4px 0 0 0' }}>Customer attempted to upload: {item.customPhoto.name || 'Unknown file'}</p>
                            <p style={{ margin: '4px 0 0 0', fontSize: '0.75rem' }}>Photo data was not properly saved. Please contact customer for re-upload.</p>
                          </div>
                        </div>
                      )}
                      {(!item.customPhotos || item.customPhotos.length === 0) && item.customPhoto && (item.customPhoto.filePath || item.customPhoto.image) && (
                        <div style={{
                          backgroundColor: '#e8f4fd',
                          border: '1px solid #1976d2',
                          borderRadius: '6px',
                          padding: '8px',
                          margin: '8px 0',
                          fontSize: '0.85rem'
                        }}>
                          <div style={{ 
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '8px'
                          }}>
                            <strong style={{ color: '#1976d2' }}>📷 Customer Photo</strong>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button
                                onClick={() => openPhotoInNewTab(item.customPhoto)}
                                style={{
                                  backgroundColor: '#1976d2',
                                  color: 'white',
                                  border: 'none',
                                  padding: '4px 8px',
                                  borderRadius: '4px',
                                  fontSize: '0.75rem',
                                  cursor: 'pointer'
                                }}
                              >
                                👁️ View
                              </button>
                              <button
                                onClick={() => downloadPhoto(item.customPhoto, `order-${selectedOrder.orderId}-photo-${Date.now()}.jpg`)}
                                style={{
                                  backgroundColor: '#4caf50',
                                  color: 'white',
                                  border: 'none',
                                  padding: '4px 8px',
                                  borderRadius: '4px',
                                  fontSize: '0.75rem',
                                  cursor: 'pointer'
                                }}
                              >
                                💾 Download
                              </button>
                            </div>
                          </div>
                          <div style={{ 
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                          }}>
                            <img
                              src={item.customPhoto.filePath ? `http://localhost:5000${item.customPhoto.filePath}` : 
                                   (item.customPhoto.image?.startsWith('data:image/') ? item.customPhoto.image : 
                                   `http://localhost:5000${item.customPhoto.image}`)}
                              alt="Customer reference"
                              style={{
                                width: '50px',
                                height: '50px',
                                objectFit: 'cover',
                                borderRadius: '4px',
                                border: '1px solid #ddd',
                                cursor: 'pointer'
                              }}
                              onClick={() => openPhotoInNewTab(item.customPhoto)}
                              onError={(e) => {
                                console.error('Image load failed for:', item.customPhoto);
                                e.target.style.display = 'none';
                              }}
                            />
                            <div style={{ flex: 1, fontSize: '0.75rem', color: '#666' }}>
                              <div><strong>File:</strong> {item.customPhoto.name || 'customer-photo.jpg'}</div>
                              <div><strong>Size:</strong> {item.customPhoto.size ? (item.customPhoto.size / 1024 / 1024).toFixed(2) + ' MB' : 'Unknown'}</div>
                              <div><strong>Type:</strong> {item.customPhoto.mimeType || item.customPhoto.type || 'image/jpeg'}</div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
