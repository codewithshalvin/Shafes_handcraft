// Quick debug to check order photo data
fetch('http://localhost:5000/api/admin/all-orders')
  .then(res => res.json())
  .then(data => {
    console.log('📦 Total orders:', data.orders.length);
    
    // Check each order for custom photos
    data.orders.forEach((order, orderIndex) => {
      console.log(`\n🔍 Order ${orderIndex + 1}: ${order.orderId}`);
      
      if (order.items && order.items.length > 0) {
        order.items.forEach((item, itemIndex) => {
          console.log(`  📋 Item ${itemIndex + 1}: ${item.product?.name || item.customDesign?.name || 'Unknown'}`);
          
          if (item.customPhoto) {
            console.log('  📷 Custom Photo Found:');
            console.log('    - filePath:', item.customPhoto.filePath);
            console.log('    - image:', item.customPhoto.image ? item.customPhoto.image.substring(0, 50) + '...' : 'null');
            console.log('    - name:', item.customPhoto.name);
            console.log('    - size:', item.customPhoto.size);
            console.log('    - mimeType:', item.customPhoto.mimeType);
          } else {
            console.log('  ❌ No custom photo');
          }
        });
      }
    });
  })
  .catch(err => console.error('❌ Error:', err));