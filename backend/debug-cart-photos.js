// Debug script to check cart photo data
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Cart from './models/Cart.js';
import Product from './models/Products.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;

async function debugCartPhotos() {
    try {
        console.log('🔍 Debugging Cart Photo Data...\n');
        
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected to MongoDB\n');

        // Get all carts with items that have photos
        const carts = await Cart.find({}).populate('items.product');
        
        console.log(`📦 Found ${carts.length} carts total\n`);
        
        for (const cart of carts) {
            if (cart.items && cart.items.length > 0) {
                console.log(`\n🛒 Cart for User: ${cart.user}`);
                console.log(`   Items: ${cart.items.length}`);
                
                cart.items.forEach((item, index) => {
                    console.log(`\n   📦 Item ${index + 1}:`);
                    console.log(`      Product: ${item.product?.name || 'Custom Design'}`);
                    console.log(`      Is Custom: ${item.isCustomDesign}`);
                    console.log(`      Has customPhoto: ${!!item.customPhoto}`);
                    console.log(`      Has customPhotos: ${!!(item.customPhotos && item.customPhotos.length > 0)}`);
                    
                    // Debug single photo
                    if (item.customPhoto) {
                        console.log(`      🔍 Single Photo Debug:`);
                        console.log(`         filePath: ${item.customPhoto.filePath || 'MISSING'}`);
                        console.log(`         image: ${item.customPhoto.image ? (item.customPhoto.image.length > 50 ? item.customPhoto.image.substring(0, 50) + '...' : item.customPhoto.image) : 'MISSING'}`);
                        console.log(`         name: ${item.customPhoto.name || 'MISSING'}`);
                        console.log(`         size: ${item.customPhoto.size || 'MISSING'}`);
                        console.log(`         type: ${item.customPhoto.type || item.customPhoto.mimeType || 'MISSING'}`);
                    }
                    
                    // Debug multiple photos
                    if (item.customPhotos && item.customPhotos.length > 0) {
                        console.log(`      🔍 Multiple Photos Debug (${item.customPhotos.length}):`);
                        item.customPhotos.forEach((photo, photoIndex) => {
                            console.log(`         Photo ${photoIndex + 1}:`);
                            console.log(`            filePath: ${photo.filePath || 'MISSING'}`);
                            console.log(`            image: ${photo.image ? (photo.image.length > 50 ? photo.image.substring(0, 50) + '...' : photo.image) : 'MISSING'}`);
                            console.log(`            name: ${photo.name || 'MISSING'}`);
                            console.log(`            size: ${photo.size || 'MISSING'}`);
                            console.log(`            id: ${photo.id || 'MISSING'}`);
                        });
                    }
                    
                    // Check if photos are completely missing
                    if (!item.customPhoto && (!item.customPhotos || item.customPhotos.length === 0)) {
                        console.log(`      ⚠️  NO PHOTOS FOUND for this item`);
                    }
                });
            }
        }
        
        // Summary
        console.log(`\n📊 SUMMARY:`);
        let totalItems = 0;
        let itemsWithSinglePhoto = 0;
        let itemsWithMultiplePhotos = 0;
        let itemsWithNoPhotos = 0;
        
        carts.forEach(cart => {
            cart.items.forEach(item => {
                totalItems++;
                if (item.customPhoto) itemsWithSinglePhoto++;
                if (item.customPhotos && item.customPhotos.length > 0) itemsWithMultiplePhotos++;
                if (!item.customPhoto && (!item.customPhotos || item.customPhotos.length === 0)) itemsWithNoPhotos++;
            });
        });
        
        console.log(`   Total Items: ${totalItems}`);
        console.log(`   Items with Single Photo: ${itemsWithSinglePhoto}`);
        console.log(`   Items with Multiple Photos: ${itemsWithMultiplePhotos}`);
        console.log(`   Items with NO Photos: ${itemsWithNoPhotos}`);
        
        if (itemsWithNoPhotos > 0) {
            console.log(`\n❌ ISSUE FOUND: ${itemsWithNoPhotos} items have no photo data`);
            console.log(`   This explains why photos aren't showing in the cart`);
        } else {
            console.log(`\n✅ All items have photo data - issue might be in frontend URL construction`);
        }
        
    } catch (error) {
        console.error('❌ Debug Error:', error);
    } finally {
        await mongoose.connection.close();
        process.exit(0);
    }
}

debugCartPhotos();