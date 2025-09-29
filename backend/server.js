import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import multer from "multer";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
// import categoryRoutes from "../backend/Routes/category.js";
// import productRoutes from "../backend/Routes/products.js";
import Product from "../backend/models/Products.js";
import Cart from "../backend/models/Cart.js";
import Wishlist from "../backend/models/Wishlist.js";
import authMiddleware from "../backend/middleware/auth.js"; // Assuming you have an auth middleware
// import Category from "../backend/models/Category.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
// app.use("/api/categories", categoryRoutes);

const MONGO_URI = process.env.MONGO_URI;
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret";

// ✅ serve uploads folder
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));
// app.use("/api/products", productRoutes);

if (!MONGO_URI) {
  console.error("❌ MONGO_URI is missing in .env file");
  process.exit(1);
}

// ======================== DB CONNECTION ========================
mongoose
  .connect(MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => {
    console.error("❌ MongoDB Error:", err.message);
    process.exit(1);
  });

// ======================== MODELS ========================

// --- User Model ---
const userSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6 },
    phone: { type: String, trim: true },
    address: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    country: { type: String, trim: true, default: "India" },
  },
  { timestamps: true }
);

// Create User model
const User = mongoose.model("User", userSchema);

// --- Category Model ---
const categorySchema = new mongoose.Schema(
  {
    categoryname: { type: String, required: true },
    image: { type: String, required: false },
  },
  { timestamps: true }
);
const Category = mongoose.model("Category", categorySchema);

// --- Admin Model ---
const adminSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    name: { type: String },
  },
  { timestamps: true }
);

adminSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const Admin = mongoose.model("Admin", adminSchema);

// ======================== MIDDLEWARE ========================
const verifyAdmin = (req, res, next) => {
  const token = req.headers["authorization"]?.split(" ")[1]; // Bearer TOKEN
  if (!token) return res.status(401).json({ message: "Not authorized" });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.adminId = decoded.id;
    next();
  } catch (err) {
    res.status(401).json({ message: "Token is invalid or expired" });
  }
};

// ===================== MULTER SETUP =====================
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});
const upload = multer({ storage });

// ======================== ROUTES ========================

// --- User Routes ---
app.post("/register", async (req, res) => {
  try {
    const { email, password, name, phone, address, city, state, country } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "Email and password are required" });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res
        .status(400)
        .json({ success: false, message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      email,
      password: hashedPassword,
      name,
      phone,
      address,
      city,
      state,
      country,
    });

    res.json({
      success: true,
      message: "User registered successfully",
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        address: user.address,
        city: user.city,
        state: user.state,
        country: user.country,
      },
    });
  } catch (err) {
    console.error("Register error:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// --- User Login Route ---
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    }

    // Compare entered password with hashed password in DB
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    }

    // Generate JWT token
    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "1d" });

    res.json({
      success: true,
      message: "Login successful",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        city: user.city,
        state: user.state,
        country: user.country,
      },
      token,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// middleware (you already have verifyAdmin, add verifyUser)
const verifyUser = (req, res, next) => {
  const token = req.headers["authorization"]?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Not authorized" });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch (err) {
    res.status(401).json({ message: "Invalid or expired token" });
  }
};

// Get profile
app.get("/api/profile", verifyUser, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password");
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Update profile
app.put("/api/profile", verifyUser, async (req, res) => {
  try {
    const { name, phone, address, city, state, country } = req.body;
    const updatedUser = await User.findByIdAndUpdate(
      req.userId,
      { name, phone, address, city, state, country },
      { new: true, runValidators: true }
    ).select("-password");
    res.json({ success: true, user: updatedUser });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});





// ✅ Enhanced error handling middleware
const handleCartError = (error, res) => {
  console.error("Cart operation error:", error);
  
  if (error.name === 'ValidationError') {
    const errors = Object.values(error.errors).map(err => err.message);
    return res.status(400).json({ 
      message: "Validation failed", 
      errors: errors 
    });
  }
  
  if (error.name === 'CastError') {
    return res.status(400).json({ 
      message: "Invalid ID format" 
    });
  }
  
  return res.status(500).json({ 
    message: "Internal server error",
    error: process.env.NODE_ENV === 'development' ? error.message : "Something went wrong"
  });
};

// ✅ Get cart - with enhanced error handling
app.get("/api/cart", verifyUser, async (req, res) => {
  try {
    let cart = await Cart.findOne({ user: req.userId }).populate("items.product");
    if (!cart) {
      cart = await Cart.create({ user: req.userId, items: [] });
    }
    
    // Process items to ensure consistent structure
    const processedItems = cart.items.map(item => {
      if (item.isCustomDesign) {
        return {
          _id: item._id,
          cartItemId: item.cartItemId || item._id.toString(),
          isCustomDesign: true,
          customDesign: item.customDesign,
          quantity: item.quantity,
          specialRequest: item.specialRequest,
          addedAt: item.addedAt,
          // Flatten custom design data for easier frontend access
          name: item.customDesign?.name || "Custom Design",
          price: item.customDesign?.price || 0,
          image: item.customDesign?.image || "",
          material: item.customDesign?.material || {},
          size: item.customDesign?.size || {}
        };
      } else {
        return {
          _id: item._id,
          product: item.product,
          quantity: item.quantity,
          specialRequest: item.specialRequest,
          addedAt: item.addedAt,
          isCustomDesign: false
        };
      }
    });
    
    res.json({ items: processedItems });
  } catch (err) {
    handleCartError(err, res);
  }
});

// ✅ Add to cart - with enhanced validation and error handling
app.post("/api/cart/add", verifyUser, async (req, res) => {
  try {
    const { productId, quantity = 1, specialRequest = "", customDesign } = req.body;
    
    // Validate basic inputs
    if (quantity < 1) {
      return res.status(400).json({ message: "Quantity must be at least 1" });
    }
    
    let cart = await Cart.findOne({ user: req.userId });
    if (!cart) {
      cart = new Cart({ user: req.userId, items: [] });
    }

    // ✅ Handle custom design items with proper validation
    if (customDesign) {
      console.log("Received custom design:", customDesign);
      
      // Validate required custom design fields
      if (!customDesign.name || !customDesign.price) {
        return res.status(400).json({ 
          message: "Custom design must have name and price" 
        });
      }

      // Validate image data
      if (!customDesign.image || !customDesign.image.startsWith('data:image/')) {
        return res.status(400).json({ 
          message: "Custom design must have valid image data" 
        });
      }

      // Create unique cart item ID
      const cartItemId = `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Prepare custom design data with defaults
      const customDesignData = {
        name: customDesign.name,
        price: Number(customDesign.price),
        image: customDesign.image,
        designData: customDesign.designData || "",
        material: {
          type: customDesign.material?.type || "resin",
          name: customDesign.material?.name || "Resin",
          description: customDesign.material?.description || "High-quality resin",
          multiplier: Number(customDesign.material?.multiplier || 1)
        },
        size: {
          value: customDesign.size?.value || "4",
          name: customDesign.size?.name || "4 inch",
          multiplier: Number(customDesign.size?.multiplier || 1)
        },
        pricing: {
          basePrice: Number(customDesign.pricing?.basePrice || 299),
          materialMultiplier: Number(customDesign.pricing?.materialMultiplier || 1),
          sizeMultiplier: Number(customDesign.pricing?.sizeMultiplier || 1),
          finalPrice: Number(customDesign.price)
        },
        specifications: {
          material: customDesign.specifications?.material || customDesign.material?.name || "Resin",
          size: customDesign.specifications?.size || customDesign.size?.name || "4 inch",
          customization: customDesign.specifications?.customization || "Hand-crafted based on your design",
          processing: customDesign.specifications?.processing || "3-5 business days"
        }
      };

      // Add custom design to cart
      const customItem = {
        isCustomDesign: true,
        cartItemId: cartItemId,
        customDesign: customDesignData,
        quantity: quantity,
        specialRequest: specialRequest,
        addedAt: new Date()
      };

      console.log("Adding custom item to cart:", customItem);
      
      cart.items.push(customItem);
      await cart.save();
      
      // Return updated cart
      await cart.populate("items.product");
      const processedItems = cart.items.map(item => {
        if (item.isCustomDesign) {
          return {
            _id: item._id,
            cartItemId: item.cartItemId,
            isCustomDesign: true,
            customDesign: item.customDesign,
            quantity: item.quantity,
            specialRequest: item.specialRequest,
            addedAt: item.addedAt,
            name: item.customDesign?.name || "Custom Design",
            price: item.customDesign?.price || 0,
            image: item.customDesign?.image || "",
            material: item.customDesign?.material || {},
            size: item.customDesign?.size || {}
          };
        } else {
          return {
            _id: item._id,
            product: item.product,
            quantity: item.quantity,
            specialRequest: item.specialRequest,
            addedAt: item.addedAt,
            isCustomDesign: false
          };
        }
      });
      
      console.log("Custom design added successfully");
      return res.json({ items: processedItems });
    }

    // ✅ Handle regular products (existing logic with validation)
    if (!productId) {
      return res.status(400).json({ message: "Product ID is required for regular products" });
    }

    // Validate productId format
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: "Invalid product ID format" });
    }

    const existingItem = cart.items.find(
      (item) => !item.isCustomDesign && item.product && item.product.toString() === productId
    );

    if (existingItem) {
      existingItem.quantity += quantity;
      if (specialRequest !== undefined) {
        existingItem.specialRequest = specialRequest;
      }
    } else {
      cart.items.push({ 
        product: productId, 
        quantity, 
        specialRequest,
        isCustomDesign: false,
        addedAt: new Date()
      });
    }

    await cart.save();
    await cart.populate("items.product");
    
    // Process and return items
    const processedItems = cart.items.map(item => {
      if (item.isCustomDesign) {
        return {
          _id: item._id,
          cartItemId: item.cartItemId,
          isCustomDesign: true,
          customDesign: item.customDesign,
          quantity: item.quantity,
          specialRequest: item.specialRequest,
          addedAt: item.addedAt,
          name: item.customDesign?.name || "Custom Design",
          price: item.customDesign?.price || 0,
          image: item.customDesign?.image || "",
          material: item.customDesign?.material || {},
          size: item.customDesign?.size || {}
        };
      } else {
        return {
          _id: item._id,
          product: item.product,
          quantity: item.quantity,
          specialRequest: item.specialRequest,
          addedAt: item.addedAt,
          isCustomDesign: false
        };
      }
    });
    
    res.json({ items: processedItems });
  } catch (err) {
    handleCartError(err, res);
  }
});

// ✅ Remove from cart - with enhanced error handling
app.post("/api/cart/remove", verifyUser, async (req, res) => {
  try {
    const { productId, cartItemId, isCustom } = req.body;
    
    if (!productId && !cartItemId) {
      return res.status(400).json({ message: "Product ID or Cart Item ID is required" });
    }
    
    let cart = await Cart.findOne({ user: req.userId });
    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    if (isCustom || cartItemId) {
      // Remove custom design item by cartItemId or _id
      const initialLength = cart.items.length;
      cart.items = cart.items.filter(item => {
        if (item.isCustomDesign) {
          return item.cartItemId !== cartItemId && item._id.toString() !== productId;
        }
        return true; // Keep regular items
      });
      
      if (cart.items.length === initialLength) {
        return res.status(404).json({ message: "Custom item not found in cart" });
      }
    } else {
      // Remove regular product item
      if (!mongoose.Types.ObjectId.isValid(productId)) {
        return res.status(400).json({ message: "Invalid product ID format" });
      }
      
      const initialLength = cart.items.length;
      cart.items = cart.items.filter(item => {
        if (!item.isCustomDesign && item.product) {
          return item.product.toString() !== productId;
        }
        return true; // Keep custom items and items without product
      });
      
      if (cart.items.length === initialLength) {
        return res.status(404).json({ message: "Product not found in cart" });
      }
    }

    await cart.save();
    await cart.populate("items.product");
    
    // Process and return updated items
    const processedItems = cart.items.map(item => {
      if (item.isCustomDesign) {
        return {
          _id: item._id,
          cartItemId: item.cartItemId,
          isCustomDesign: true,
          customDesign: item.customDesign,
          quantity: item.quantity,
          specialRequest: item.specialRequest,
          addedAt: item.addedAt,
          name: item.customDesign?.name || "Custom Design",
          price: item.customDesign?.price || 0,
          image: item.customDesign?.image || "",
          material: item.customDesign?.material || {},
          size: item.customDesign?.size || {}
        };
      } else {
        return {
          _id: item._id,
          product: item.product,
          quantity: item.quantity,
          specialRequest: item.specialRequest,
          addedAt: item.addedAt,
          isCustomDesign: false
        };
      }
    });
    
    res.json({ items: processedItems });
  } catch (err) {
    handleCartError(err, res);
  }
});

// ✅ Update cart item quantity (add this route if missing)
app.post("/api/cart/update", verifyUser, async (req, res) => {
  try {
    const { productId, cartItemId, quantity, isCustom } = req.body;
    
    if (quantity < 1) {
      return res.status(400).json({ message: "Quantity must be at least 1" });
    }
    
    if (!productId && !cartItemId) {
      return res.status(400).json({ message: "Product ID or Cart Item ID is required" });
    }
    
    let cart = await Cart.findOne({ user: req.userId });
    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    let itemFound = false;
    
    cart.items = cart.items.map(item => {
      if (isCustom && item.isCustomDesign) {
        if (item.cartItemId === cartItemId || item._id.toString() === productId) {
          item.quantity = quantity;
          itemFound = true;
        }
      } else if (!isCustom && !item.isCustomDesign && item.product) {
        if (item.product.toString() === productId) {
          item.quantity = quantity;
          itemFound = true;
        }
      }
      return item;
    });

    if (!itemFound) {
      return res.status(404).json({ message: "Item not found in cart" });
    }

    await cart.save();
    await cart.populate("items.product");
    
    // Process and return updated items
    const processedItems = cart.items.map(item => {
      if (item.isCustomDesign) {
        return {
          _id: item._id,
          cartItemId: item.cartItemId,
          isCustomDesign: true,
          customDesign: item.customDesign,
          quantity: item.quantity,
          specialRequest: item.specialRequest,
          addedAt: item.addedAt,
          name: item.customDesign?.name || "Custom Design",
          price: item.customDesign?.price || 0,
          image: item.customDesign?.image || "",
          material: item.customDesign?.material || {},
          size: item.customDesign?.size || {}
        };
      } else {
        return {
          _id: item._id,
          product: item.product,
          quantity: item.quantity,
          specialRequest: item.specialRequest,
          addedAt: item.addedAt,
          isCustomDesign: false
        };
      }
    });
    
    res.json({ items: processedItems });
  } catch (err) {
    handleCartError(err, res);
  }
});

// ✅ Clear cart
app.post("/api/cart/clear", verifyUser, async (req, res) => {
  try {
    let cart = await Cart.findOne({ user: req.userId });
    if (!cart) {
      cart = await Cart.create({ user: req.userId, items: [] });
    } else {
      cart.items = [];
      await cart.save();
    }
    
    res.json({ items: [] });
  } catch (err) {
    handleCartError(err, res);
  }
});


// Import verifyUser middleware as needed
//wishlist routes 
app.get("/api/wishlist", verifyUser, async (req, res) => {
  try {
    const userId = req.userId;
    let wishlist = await Wishlist.findOne({ userId }).populate("products");
    if (!wishlist) {
      // Create empty wishlist if none exists
      wishlist = await Wishlist.create({ userId, products: [] });
    }
    res.json({ success: true, wishlist });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});


app.post("/api/wishlist/add", verifyUser, async (req, res) => {
  const { productId } = req.body;
  const userId = req.userId;

  let wishlist = await Wishlist.findOne({ userId });

  if (!wishlist) {
    wishlist = await Wishlist.create({ userId, products: [productId] });
  } else {
    if (!wishlist.products.includes(productId)) {
      wishlist.products.push(productId);
    }
    await wishlist.save();
  }

  await wishlist.populate("products");
  res.json({ success: true, wishlist });
});
app.post("/api/wishlist/remove", verifyUser, async (req, res) => {
  try {
    const { productId } = req.body;
    const userId = req.userId;

    let wishlist = await Wishlist.findOne({ userId });
    if (!wishlist) {
      return res.status(404).json({ success: false, message: "Wishlist not found" });
    }

    // Remove productId from wishlist products array
    wishlist.products = wishlist.products.filter(
      (id) => id.toString() !== productId.toString()
    );

    await wishlist.save();
    await wishlist.populate("products");

    res.json({ success: true, wishlist });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});



// --- Admin Routes ---
app.post("/admin/signup", async (req, res) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: "Email and password required" });

    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin)
      return res.status(400).json({ message: "Admin already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const admin = await Admin.create({ email, password: hashedPassword, name });

    res.status(201).json({
      message: "Admin registered successfully",
      admin: { id: admin._id, email: admin.email, name: admin.name },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post("/admin/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const admin = await Admin.findOne({ email });
    if (!admin)
      return res.status(400).json({ message: "Invalid email or password" });

    const isMatch = password === admin.password;
    if (!isMatch)
      return res.status(400).json({ message: "Invalid email or password" });

    const token = jwt.sign({ id: admin._id }, JWT_SECRET, { expiresIn: "1d" });
    res.json({ token, admin: { id: admin._id, email: admin.email } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get("/admin/dashboard", verifyAdmin, (req, res) => {
  res.json({
    message: "Welcome Admin! You are authenticated.",
    adminId: req.adminId,
  });
});
// ======================== ADMIN STATS API ========================
app.get("/api/admin/stats", async (req, res) => {
  try {
    const users = await User.countDocuments();       // User schema is already defined in server.js
    const products = await Product.countDocuments(); // Product imported from models
    const categories = await Category.countDocuments(); // Category schema is already in server.js
    const orders = 0; // since no Order model yet

    res.json({
      success: true,
      stats: { users, products, categories, orders },
    });
  } catch (err) {
    console.error("❌ Error fetching stats:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});


// --- Product Routes ---
app.post("/addproducts", upload.single("image"), async (req, res) => {
  try {
    const { name, price, category, stock, description } = req.body;

    if (!name || !price || !category || !stock) {
      return res
        .status(400)
        .json({ success: false, message: "All fields are required" });
    }

    const existing = await Product.findOne({ name });
    if (existing) {
      return res
        .status(400)
        .json({ success: false, message: "Product already exists" });
    }

    const image = req.file ? `/uploads/${req.file.filename}` : "";

    const product = await Product.create({
      name,
      price,
      category,
      stock,
      description, // ✅ new field saved
      image,
    });

    res.status(201).json({ success: true, product });
  } catch (err) {
    console.error("Error adding product:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get("/api/products", async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.json({ success: true, products });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});
app.get("/api/products/:id", async (req, res) => {
  try {
    console.log("🛠 Fetching product from DB with id:", req.params.id); // ✅ add this
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }
    res.json({ success: true, product });
  } catch (err) {
    console.error("❌ Error in /api/products/:id:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});



// ✅ Update product
app.put("/api/products/:id", upload.single("image"), async (req, res) => {
  try {
    const { name, price, category, stock, description } = req.body;

    const updateData = { name, price, category, stock, description }; // ✅ added
    if (req.file) {
      updateData.image = `/uploads/${req.file.filename}`;
    }

    const updated = await Product.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
    });

    res.json({ success: true, product: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});


// ✅ Delete product
app.delete("/api/products/:id", async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Product deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});


// ===================== CATEGORY APIs =====================

// Add category with image
app.post("/addcategory", upload.single("image"), async (req, res) => {
  try {
    const { categoryname } = req.body;

    const image = req.file
      ? `/uploads/${req.file.filename}`
      : req.body.image || "";

    const newCategory = new Category({ categoryname, image });
    await newCategory.save();

    res.json({ success: true, category: newCategory });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET all categories
app.get("/getcategories", async (req, res) => {
  try {
    const categories = await Category.find().sort({ createdAt: -1 });
    res.json({ success: true, categories });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.delete("/deletecategory/:id", async (req, res) => {
  console.log("Delete request received with id:", req.params.id);

  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ success: false, message: "Invalid category ID" });
  }

  try {
    const deleted = await Category.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: "Category not found" });
    }
    res.json({ success: true, message: "Category deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Error deleting category" });
  }
});


// --- Test Route ---
app.get("/", (req, res) => {
  res.send("✅ Backend is working!");
});

// ======================== START SERVER ========================
app.listen(PORT, () => {
  console.log(`🚀 Backend running on http://localhost:${PORT}`);
});
