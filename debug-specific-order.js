// Debug specific order that should have photos
fetch('http://localhost:5000/api/admin/all-orders')
  .then(res => res.json())
  .then(data => {
    // Find the specific order from the screenshot
    const specificOrder = data.orders.find(order => order.orderId === 'ORDER_1760710962243_rmx6u39jn');
    
    if (specificOrder) {
      console.log('🎯 Found the specific order:', specificOrder.orderId);
      console.log('📦 Items count:', specificOrder.items.length);
      
      specificOrder.items.forEach((item, index) => {
        console.log(`\n📋 Item ${index + 1}:`);
        console.log('  Product name:', item.product?.name || item.customDesign?.name);
        console.log('  Has customPhoto:', !!item.customPhoto);
        
        if (item.customPhoto) {
          console.log('  📷 Custom Photo Details:');
          console.log('    - filePath:', item.customPhoto.filePath);
          console.log('    - image:', item.customPhoto.image);
          console.log('    - name:', item.customPhoto.name);
          console.log('    - size:', item.customPhoto.size);
          console.log('    - Condition check:', !!(item.customPhoto.filePath || item.customPhoto.image));
          
          // Test the actual image URL construction
          let testUrl = null;
          if (item.customPhoto.filePath) {
            testUrl = `http://localhost:5000${item.customPhoto.filePath}`;
          } else if (item.customPhoto.image) {
            if (item.customPhoto.image.startsWith('data:image/')) {
              testUrl = item.customPhoto.image;
            } else if (item.customPhoto.image.startsWith('http')) {
              testUrl = item.customPhoto.image;
            } else {
              testUrl = `http://localhost:5000${item.customPhoto.image}`;
            }
          }
          console.log('    - Constructed URL:', testUrl);
        }
      });
    } else {
      console.log('❌ Order not found. Available orders:');
      data.orders.forEach((order, index) => {
        console.log(`${index + 1}. ${order.orderId}`);
      });
    }
  })
  .catch(err => console.error('❌ Error:', err));