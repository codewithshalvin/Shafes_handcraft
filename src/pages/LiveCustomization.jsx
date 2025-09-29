import { useEffect, useRef, useState } from "react";
import { useCart } from "../context/CartContext";
import { useNavigate } from "react-router-dom";

export default function LiveCustomization() {
  const canvasRef = useRef(null);
  const fabricCanvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const { addToCart } = useCart();
  const navigate = useNavigate();

  const [color, setColor] = useState("#ff0000");
  const [productName, setProductName] = useState("Custom Handmade Item");
  const [basePrice] = useState(299); // Base price for smallest size
  const [requestMessage, setRequestMessage] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [canvasReady, setCanvasReady] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawingMode, setDrawingMode] = useState(false);
  const [brushSize, setBrushSize] = useState(5);

  // ✅ New state for dynamic pricing
  const [selectedMaterial, setSelectedMaterial] = useState("resin");
  const [selectedSize, setSelectedSize] = useState("4");
  const [calculatedPrice, setCalculatedPrice] = useState(299);

  // ✅ Material and Size Options with Pricing
  const materialOptions = {
    resin: {
      name: "Resin",
      multiplier: 1.0,
      description: "High-quality epoxy resin finish"
    },
    wood: {
      name: "Wood",
      multiplier: 1.2,
      description: "Premium wood base with custom design"
    },
    acrylic: {
      name: "Acrylic",
      multiplier: 0.8,
      description: "Clear acrylic with printed design"
    },
    metal: {
      name: "Metal",
      multiplier: 1.5,
      description: "Durable metal plate with engraved design"
    },
    ceramic: {
      name: "Ceramic",
      multiplier: 1.3,
      description: "Premium ceramic with fired design"
    }
  };

  const sizeOptions = {
    "2": { name: "2 inch", multiplier: 0.5 },
    "3": { name: "3 inch", multiplier: 0.7 },
    "4": { name: "4 inch", multiplier: 1.0 },
    "5": { name: "5 inch", multiplier: 1.3 },
    "6": { name: "6 inch", multiplier: 1.6 },
    "7": { name: "7 inch", multiplier: 2.0 },
    "8": { name: "8 inch", multiplier: 2.5 },
    "9": { name: "9 inch", multiplier: 3.0 },
    "10": { name: "10 inch", multiplier: 3.6 },
    "11": { name: "11 inch", multiplier: 4.2 },
    "12": { name: "12 inch", multiplier: 5.0 }
  };

  // ✅ Calculate price based on material and size
  const calculatePrice = () => {
    const material = materialOptions[selectedMaterial];
    const size = sizeOptions[selectedSize];
    
    if (material && size) {
      const newPrice = Math.round(basePrice * material.multiplier * size.multiplier);
      setCalculatedPrice(newPrice);
    }
  };

  // ✅ Update price when material or size changes
  useEffect(() => {
    calculatePrice();
  }, [selectedMaterial, selectedSize, basePrice]);

  // Simple history for undo
  const historyRef = useRef([]);
  const currentPath = useRef([]);

  useEffect(() => {
    const initCanvas = () => {
      if (!canvasRef.current) return;

      // Mock canvas object with enhanced functionality
      const mockCanvas = {
        width: 600,
        height: 500,
        backgroundColor: "#ffffff",
        objects: [],
        activeObject: null,
        drawingMode: false,
        isDrawing: false,
        
        add: function(obj) {
          this.objects.push(obj);
          this.activeObject = obj;
          this.render();
          console.log('Added object:', obj);
        },
        
        remove: function(obj) {
          const index = this.objects.indexOf(obj);
          if (index > -1) {
            this.objects.splice(index, 1);
            this.activeObject = null;
            this.render();
            console.log('Removed object:', obj);
          }
        },
        
        getActiveObject: function() {
          return this.activeObject;
        },
        
        setActiveObject: function(obj) {
          this.activeObject = obj;
          this.render();
        },
        
        clear: function() {
          this.objects = [];
          this.activeObject = null;
          this.render();
        },
        
        render: function() {
          const ctx = canvasRef.current?.getContext('2d');
          if (!ctx) return;
          
          // Clear canvas
          ctx.fillStyle = this.backgroundColor;
          ctx.fillRect(0, 0, this.width, this.height);
          
          // Draw objects
          this.objects.forEach((obj, index) => {
            ctx.save();
            
            if (obj.type === 'text') {
              ctx.font = `${obj.fontSize}px Arial`;
              ctx.fillStyle = obj.fill;
              ctx.fillText(obj.text, obj.left, obj.top + obj.fontSize);
            } else if (obj.type === 'rect') {
              ctx.fillStyle = obj.fill;
              ctx.fillRect(obj.left, obj.top, obj.width, obj.height);
            } else if (obj.type === 'circle') {
              ctx.fillStyle = obj.fill;
              ctx.beginPath();
              ctx.arc(obj.left + obj.radius, obj.top + obj.radius, obj.radius, 0, 2 * Math.PI);
              ctx.fill();
            } else if (obj.type === 'triangle') {
              ctx.fillStyle = obj.fill;
              ctx.beginPath();
              ctx.moveTo(obj.left + obj.width / 2, obj.top);
              ctx.lineTo(obj.left, obj.top + obj.height);
              ctx.lineTo(obj.left + obj.width, obj.top + obj.height);
              ctx.closePath();
              ctx.fill();
            } else if (obj.type === 'image') {
              if (obj.imageElement) {
                ctx.drawImage(obj.imageElement, obj.left, obj.top, obj.width, obj.height);
              }
            } else if (obj.type === 'path') {
              ctx.strokeStyle = obj.stroke;
              ctx.lineWidth = obj.strokeWidth;
              ctx.lineCap = 'round';
              ctx.lineJoin = 'round';
              ctx.beginPath();
              obj.path.forEach((point, i) => {
                if (i === 0) {
                  ctx.moveTo(point.x, point.y);
                } else {
                  ctx.lineTo(point.x, point.y);
                }
              });
              ctx.stroke();
            }
            
            // Highlight active object with resize handles
            if (obj === this.activeObject) {
              ctx.strokeStyle = '#007bff';
              ctx.lineWidth = 2;
              ctx.setLineDash([5, 5]);
              
              let bounds = this.getObjectBounds(obj);
              ctx.strokeRect(bounds.left - 2, bounds.top - 2, bounds.width + 4, bounds.height + 4);
              
              // Draw resize handles
              ctx.setLineDash([]);
              ctx.fillStyle = '#007bff';
              const handleSize = 8;
              const handles = [
                { x: bounds.left - handleSize/2, y: bounds.top - handleSize/2 },
                { x: bounds.left + bounds.width - handleSize/2, y: bounds.top - handleSize/2 },
                { x: bounds.left - handleSize/2, y: bounds.top + bounds.height - handleSize/2 },
                { x: bounds.left + bounds.width - handleSize/2, y: bounds.top + bounds.height - handleSize/2 },
              ];
              
              handles.forEach(handle => {
                ctx.fillRect(handle.x, handle.y, handleSize, handleSize);
              });
            }
            
            ctx.restore();
          });
        },
        
        getObjectBounds: function(obj) {
          if (obj.type === 'circle') {
            return {
              left: obj.left,
              top: obj.top,
              width: obj.radius * 2,
              height: obj.radius * 2
            };
          } else if (obj.type === 'text') {
            return {
              left: obj.left,
              top: obj.top,
              width: obj.width || 200,
              height: obj.fontSize || 26
            };
          } else if (obj.type === 'path') {
            const xs = obj.path.map(p => p.x);
            const ys = obj.path.map(p => p.y);
            return {
              left: Math.min(...xs),
              top: Math.min(...ys),
              width: Math.max(...xs) - Math.min(...xs),
              height: Math.max(...ys) - Math.min(...ys)
            };
          }
          return {
            left: obj.left,
            top: obj.top,
            width: obj.width,
            height: obj.height
          };
        },
        
        toDataURL: function(options = {}) {
          return canvasRef.current?.toDataURL('image/png') || '';
        },
        
        loadFromJSON: function(json, callback) {
          this.objects = [...json.objects];
          this.backgroundColor = json.backgroundColor;
          this.render();
          if (callback) callback();
        },
        
        toJSON: function() {
          return {
            objects: [...this.objects],
            backgroundColor: this.backgroundColor
          };
        }
      };

      fabricCanvasRef.current = mockCanvas;
      
      if (canvasRef.current) {
        canvasRef.current.width = 600;
        canvasRef.current.height = 500;
        canvasRef.current.style.cursor = 'crosshair';
      }
      
      mockCanvas.render();
      setCanvasReady(true);
      pushHistory();

      console.log("Enhanced mock canvas initialized");
    };

    const timer = setTimeout(initCanvas, 100);

    return () => {
      clearTimeout(timer);
      setCanvasReady(false);
    };
  }, []);

  // Enhanced canvas interaction handlers (keeping the existing code)
  useEffect(() => {
    const canvas = canvasRef.current;
    const mockCanvas = fabricCanvasRef.current;
    
    if (!canvas || !mockCanvas) return;
    
    let isDragging = false;
    let isResizing = false;
    let resizeHandle = null;
    let dragStart = { x: 0, y: 0 };
    let originalSize = { width: 0, height: 0 };

    const getMousePos = (e) => {
      const rect = canvas.getBoundingClientRect();
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
    };

    const getResizeHandle = (obj, mousePos) => {
      if (!obj) return null;
      
      const bounds = mockCanvas.getObjectBounds(obj);
      const handleSize = 12;
      
      const handles = [
        { type: 'tl', x: bounds.left, y: bounds.top },
        { type: 'tr', x: bounds.left + bounds.width, y: bounds.top },
        { type: 'bl', x: bounds.left, y: bounds.top + bounds.height },
        { type: 'br', x: bounds.left + bounds.width, y: bounds.top + bounds.height },
      ];
      
      for (let handle of handles) {
        if (mousePos.x >= handle.x - handleSize/2 && 
            mousePos.x <= handle.x + handleSize/2 &&
            mousePos.y >= handle.y - handleSize/2 && 
            mousePos.y <= handle.y + handleSize/2) {
          return handle.type;
        }
      }
      return null;
    };

    const handleMouseDown = (e) => {
      const mousePos = getMousePos(e);
      
      if (drawingMode) {
        setIsDrawing(true);
        currentPath.current = [mousePos];
        return;
      }
      
      const activeObj = mockCanvas.getActiveObject();
      if (activeObj) {
        const handle = getResizeHandle(activeObj, mousePos);
        if (handle) {
          isResizing = true;
          resizeHandle = handle;
          const bounds = mockCanvas.getObjectBounds(activeObj);
          originalSize = { width: bounds.width, height: bounds.height };
          dragStart = mousePos;
          canvas.style.cursor = handle.includes('t') ? 
            (handle.includes('l') ? 'nw-resize' : 'ne-resize') :
            (handle.includes('l') ? 'sw-resize' : 'se-resize');
          return;
        }
      }
      
      let clickedObject = null;
      for (let i = mockCanvas.objects.length - 1; i >= 0; i--) {
        const obj = mockCanvas.objects[i];
        const bounds = mockCanvas.getObjectBounds(obj);
        
        if (mousePos.x >= bounds.left && mousePos.x <= bounds.left + bounds.width &&
            mousePos.y >= bounds.top && mousePos.y <= bounds.top + bounds.height) {
          clickedObject = obj;
          break;
        }
      }
      
      if (clickedObject) {
        mockCanvas.setActiveObject(clickedObject);
        isDragging = true;
        dragStart = mousePos;
        canvas.style.cursor = 'move';
      } else {
        mockCanvas.setActiveObject(null);
      }
    };

    const handleMouseMove = (e) => {
      const mousePos = getMousePos(e);
      
      if (drawingMode && isDrawing) {
        currentPath.current.push(mousePos);
        const ctx = canvas.getContext('2d');
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = color;
        ctx.lineWidth = brushSize;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        if (currentPath.current.length > 1) {
          const prev = currentPath.current[currentPath.current.length - 2];
          ctx.beginPath();
          ctx.moveTo(prev.x, prev.y);
          ctx.lineTo(mousePos.x, mousePos.y);
          ctx.stroke();
        }
        return;
      }
      
      const activeObj = mockCanvas.getActiveObject();
      
      if (isResizing && activeObj) {
        const dx = mousePos.x - dragStart.x;
        const dy = mousePos.y - dragStart.y;
        
        if (activeObj.type === 'circle') {
          const newRadius = Math.max(10, activeObj.radius + (dx + dy) / 4);
          activeObj.radius = newRadius;
        } else if (activeObj.type === 'rect' || activeObj.type === 'triangle') {
          if (resizeHandle.includes('r')) {
            activeObj.width = Math.max(20, originalSize.width + dx);
          }
          if (resizeHandle.includes('b')) {
            activeObj.height = Math.max(20, originalSize.height + dy);
          }
        } else if (activeObj.type === 'text') {
          if (resizeHandle.includes('r')) {
            activeObj.fontSize = Math.max(12, activeObj.fontSize + dx / 5);
          }
        }
        
        mockCanvas.render();
        return;
      }
      
      if (isDragging && activeObj) {
        const dx = mousePos.x - dragStart.x;
        const dy = mousePos.y - dragStart.y;
        
        activeObj.left += dx;
        activeObj.top += dy;
        
        dragStart = mousePos;
        mockCanvas.render();
        return;
      }
      
      if (activeObj) {
        const handle = getResizeHandle(activeObj, mousePos);
        if (handle) {
          canvas.style.cursor = handle.includes('t') ? 
            (handle.includes('l') ? 'nw-resize' : 'ne-resize') :
            (handle.includes('l') ? 'sw-resize' : 'se-resize');
          return;
        }
        
        const bounds = mockCanvas.getObjectBounds(activeObj);
        if (mousePos.x >= bounds.left && mousePos.x <= bounds.left + bounds.width &&
            mousePos.y >= bounds.top && mousePos.y <= bounds.top + bounds.height) {
          canvas.style.cursor = 'move';
          return;
        }
      }
      
      canvas.style.cursor = drawingMode ? 'crosshair' : 'default';
    };

    const handleMouseUp = () => {
      if (drawingMode && isDrawing && currentPath.current.length > 1) {
        const pathObj = {
          type: 'path',
          path: [...currentPath.current],
          stroke: color,
          strokeWidth: brushSize,
          fill: 'transparent'
        };
        mockCanvas.add(pathObj);
        pushHistory();
        currentPath.current = [];
      }
      
      if (isDragging || isResizing) {
        pushHistory();
      }
      
      setIsDrawing(false);
      isDragging = false;
      isResizing = false;
      resizeHandle = null;
      canvas.style.cursor = drawingMode ? 'crosshair' : 'default';
    };
    
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('mouseleave', handleMouseUp);
    
    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('mouseleave', handleMouseUp);
    };
  }, [canvasReady, drawingMode, color, brushSize, isDrawing]);

  function pushHistory() {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;
    try {
      const json = canvas.toJSON();
      historyRef.current.push(JSON.parse(JSON.stringify(json)));
      if (historyRef.current.length > 20) historyRef.current.shift();
      console.log('History saved, total states:', historyRef.current.length);
    } catch (e) {
      console.error("Error pushing history:", e);
    }
  }

  const toggleDrawingMode = () => {
    const newMode = !drawingMode;
    setDrawingMode(newMode);
    
    if (canvasRef.current) {
      canvasRef.current.style.cursor = newMode ? 'crosshair' : 'default';
    }
    
    if (newMode && fabricCanvasRef.current) {
      fabricCanvasRef.current.setActiveObject(null);
    }
    
    console.log('Drawing mode:', newMode ? 'ON' : 'OFF');
  };

  const uploadImage = (e) => {
    const file = e.target.files[0];
    if (!file) {
      setIsUploading(false);
      return;
    }

    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file.');
      setIsUploading(false);
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Image size should be less than 5MB');
      setIsUploading(false);
      return;
    }

    setIsUploading(true);
    const reader = new FileReader();
    
    reader.onload = (event) => {
      const canvas = fabricCanvasRef.current;
      if (!canvas) {
        setIsUploading(false);
        return;
      }

      const img = new Image();
      img.onload = () => {
        const maxWidth = 200;
        const maxHeight = 200;
        const scale = Math.min(maxWidth / img.width, maxHeight / img.height, 1);
        
        const imageObj = {
          type: 'image',
          left: 50,
          top: 50,
          width: img.width * scale,
          height: img.height * scale,
          imageElement: img
        };
        
        canvas.add(imageObj);
        pushHistory();
        setIsUploading(false);
        console.log('Image added successfully');
      };
      
      img.onerror = () => {
        alert('Failed to load image');
        setIsUploading(false);
      };
      
      img.src = event.target.result;
    };

    reader.readAsDataURL(file);
    e.target.value = null;
  };

  const addText = () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;
    
    const textObj = {
      type: 'text',
      text: "Your text here",
      left: 60,
      top: 60,
      fontSize: 26,
      fill: color,
      width: 300,
      height: 30
    };
    
    canvas.add(textObj);
    pushHistory();
  };

  const addShape = (shape) => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;
    
    let obj;
    if (shape === "rect") {
      obj = {
        type: 'rect',
        left: 120,
        top: 120,
        width: 150,
        height: 100,
        fill: color,
      };
    } else if (shape === "circle") {
      obj = {
        type: 'circle',
        left: 180,
        top: 160,
        radius: 60,
        fill: color,
      };
    } else if (shape === "triangle") {
      obj = {
        type: 'triangle',
        left: 160,
        top: 140,
        width: 120,
        height: 120,
        fill: color,
      };
    }
    
    if (obj) {
      canvas.add(obj);
      pushHistory();
    }
  };

  const deleteSelected = () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;
    
    const activeObject = canvas.getActiveObject();
    if (activeObject) {
      canvas.remove(activeObject);
      pushHistory();
    } else {
      alert("Please select an object to delete");
    }
  };

  const changeColor = () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;
    
    const active = canvas.getActiveObject();
    if (!active) {
      alert("Select an object to apply color");
      return;
    }
    
    if (active.type === 'path') {
      active.stroke = color;
    } else {
      active.fill = color;
    }
    canvas.render();
    pushHistory();
  };

  const undo = () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;
    
    if (historyRef.current.length > 1) {
      historyRef.current.pop();
      const previousState = historyRef.current[historyRef.current.length - 1];
      
      if (previousState) {
        canvas.loadFromJSON(previousState);
      }
    }
  };

  const clearCanvas = () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;
    
    canvas.clear();
    historyRef.current = [];
    pushHistory();
  };

  const download = () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;
    
    const dataURL = canvas.toDataURL();
    const link = document.createElement("a");
    link.href = dataURL;
    link.download = "custom-design.png";
    link.click();
  };

  // Update the saveDesignToCart function in your LiveCustomization.jsx

// Update the saveDesignToCart function in LiveCustomization.jsx

const saveDesignToCart = async () => {
  const canvas = fabricCanvasRef.current;
  if (!canvas) {
    alert("Canvas not ready. Please try again.");
    return;
  }

  // Validation
  if (!productName.trim()) {
    alert("Please enter a product name before saving.");
    return;
  }

  if (!calculatedPrice || calculatedPrice <= 0) {
    alert("Please select valid options before saving.");
    return;
  }

  try {
    // ✅ Wait for all images to be fully loaded before converting to dataURL
    await new Promise(resolve => {
      canvas.render(); // Force re-render
      setTimeout(resolve, 100); // Small delay to ensure rendering is complete
    });

    // ✅ Create high-quality image with proper format
    const canvasElement = canvasRef.current;
    let designImageData = '';
    
    if (canvasElement) {
      // Ensure canvas has content
      const ctx = canvasElement.getContext('2d');
      const imageData = ctx.getImageData(0, 0, canvasElement.width, canvasElement.height);
      const hasContent = imageData.data.some(channel => channel !== 0);
      
      if (hasContent) {
        designImageData = canvasElement.toDataURL('image/png', 1.0);
      } else {
        // Fallback: render canvas content manually
        canvas.render();
        designImageData = canvasElement.toDataURL('image/png', 1.0);
      }
    }

    // ✅ Fallback image if canvas fails
    if (!designImageData || designImageData === 'data:,') {
      designImageData = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjBmMGYwIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzMzMyIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkN1c3RvbSBEZXNpZ24gSW1hZ2U8L3RleHQ+PC9zdmc+';
    }
    
    // ✅ Get canvas design data for potential future editing
    const designJSON = canvas.toJSON();
    
    // ✅ Create unique ID with timestamp and random string
    const uniqueId = `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // ✅ Create comprehensive product object
    const customProduct = {
      _id: uniqueId,
      id: uniqueId,
      cartItemId: uniqueId, // Unique cart identifier
      name: productName.trim(),
      price: calculatedPrice,
      originalPrice: calculatedPrice,
      
      // ✅ Custom design specific fields  
      image: designImageData,
      designImage: designImageData,
      designData: JSON.stringify(designJSON), // Stringify for storage
      isCustomDesign: true,
      customDesign: true,
      isLocal: true, // Flag for local storage
      
      // ✅ Product configuration details
      material: {
        type: selectedMaterial,
        name: materialOptions[selectedMaterial].name,
        description: materialOptions[selectedMaterial].description,
        multiplier: materialOptions[selectedMaterial].multiplier
      },
      
      size: {
        value: selectedSize,
        name: sizeOptions[selectedSize].name,
        multiplier: sizeOptions[selectedSize].multiplier
      },
      
      // ✅ Pricing breakdown
      pricing: {
        basePrice: basePrice,
        materialMultiplier: materialOptions[selectedMaterial].multiplier,
        sizeMultiplier: sizeOptions[selectedSize].multiplier,
        finalPrice: calculatedPrice
      },
      
      // ✅ Special customer request
      specialRequest: requestMessage.trim() || "",
      requestMessage: requestMessage.trim() || "",
      
      // ✅ Cart specific fields
      quantity: 1,
      qty: 1,
      
      // ✅ Metadata
      createdAt: new Date().toISOString(),
      addedAt: new Date().toISOString(),
      category: "Custom Design",
      type: "custom",
      
      // ✅ Display information
      description: `Custom ${materialOptions[selectedMaterial].name} design - ${sizeOptions[selectedSize].name}`,
      specifications: {
        material: materialOptions[selectedMaterial].name,
        size: sizeOptions[selectedSize].name,
        customization: "Hand-crafted based on your design",
        processing: "3-5 business days"
      }
    };

    // ✅ Log for debugging
    console.log("Adding custom product to cart:", customProduct);
    console.log("Image data length:", designImageData.length);
    
    // ✅ Add to cart
    await addToCart(customProduct);
    
    // ✅ Success message
    alert(`🎨 Custom Design Added Successfully!\n\n📦 Product: ${productName}\n🎯 Material: ${materialOptions[selectedMaterial].name}\n📏 Size: ${sizeOptions[selectedSize].name}\n💰 Price: ₹${calculatedPrice}`);
    
    // ✅ Navigate to cart
    navigate("/cart");
    
  } catch (error) {
    console.error('Error adding custom design to cart:', error);
    alert('Failed to add design to cart. Please try again.');
  }
};


  const previewDesign = () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;
    
    const dataURL = canvas.toDataURL();
    if (dataURL) {
      const newWindow = window.open();
      newWindow.document.write(`
        <html>
          <head><title>Design Preview</title></head>
          <body style="margin:0; display:flex; justify-content:center; align-items:center; min-height:100vh; background:#f0f0f0;">
            <img src="${dataURL}" style="max-width:90%; max-height:90%; border:2px solid #ddd; border-radius:8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);" />
          </body>
        </html>
      `);
    }
  };

  return (
    <div style={{ padding: 20, fontFamily: 'Arial, sans-serif' }}>
      <h2 style={{ textAlign: "center", marginBottom: 20, color: '#333' }}>
        🎨 Advanced Live Customization
      </h2>
      
      <div style={{ 
        textAlign: 'center', 
        marginBottom: 15, 
        padding: 10, 
        backgroundColor: '#e3f2fd', 
        borderRadius: 8,
        color: '#1565c0'
      }}>
        <strong>Enhanced Demo:</strong> Draw, resize, drag objects! Click objects to select, drag to move, use corner handles to resize!
      </div>

      {/* Toolbar */}
      <div style={{ 
        display: "flex", 
        gap: 8, 
        flexWrap: "wrap", 
        justifyContent: "center", 
        marginBottom: 20,
        padding: 15,
        backgroundColor: '#f8f9fa',
        borderRadius: 8,
        border: '1px solid #dee2e6'
      }}>
        {/* Drawing Mode Toggle */}
        <button 
          onClick={toggleDrawingMode}
          style={{ 
            padding: '8px 12px', 
            backgroundColor: drawingMode ? '#dc3545' : '#28a745', 
            color: 'white', 
            border: 'none', 
            borderRadius: 4,
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          {drawingMode ? '✏️ Exit Draw' : '✏️ Draw Mode'}
        </button>

        {/* Brush Size Control */}
        {drawingMode && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <label style={{ fontSize: '12px', color: '#666' }}>Brush:</label>
            <input 
              type="range" 
              min="1" 
              max="20" 
              value={brushSize}
              onChange={(e) => setBrushSize(parseInt(e.target.value))}
              style={{ width: '80px' }}
            />
            <span style={{ fontSize: '12px', minWidth: '20px' }}>{brushSize}px</span>
          </div>
        )}
        
        <button 
          onClick={addText}
          disabled={drawingMode}
          style={{ 
            padding: '8px 12px', 
            backgroundColor: drawingMode ? '#6c757d' : '#28a745', 
            color: 'white', 
            border: 'none', 
            borderRadius: 4,
            cursor: drawingMode ? 'not-allowed' : 'pointer'
          }}
        >
          Add Text
        </button>
        
        <button 
          onClick={() => addShape("rect")}
          disabled={drawingMode}
          style={{ 
            padding: '8px 12px', 
            backgroundColor: drawingMode ? '#6c757d' : '#17a2b8', 
            color: 'white', 
            border: 'none', 
            borderRadius: 4,
            cursor: drawingMode ? 'not-allowed' : 'pointer'
          }}
        >
          Add Rectangle
        </button>
        
        <button 
          onClick={() => addShape("circle")}
          disabled={drawingMode}
          style={{ 
            padding: '8px 12px', 
            backgroundColor: drawingMode ? '#6c757d' : '#ffc107', 
            color: 'black', 
            border: 'none', 
            borderRadius: 4,
            cursor: drawingMode ? 'not-allowed' : 'pointer'
          }}
        >
          Add Circle
        </button>
        
        <button 
          onClick={() => addShape("triangle")}
          disabled={drawingMode}
          style={{ 
            padding: '8px 12px', 
            backgroundColor: drawingMode ? '#6c757d' : '#6f42c1', 
            color: 'white', 
            border: 'none', 
            borderRadius: 4,
            cursor: drawingMode ? 'not-allowed' : 'pointer'
          }}
        >
          Add Triangle
        </button>

        <button 
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading || drawingMode}
          style={{ 
            padding: '8px 12px',
            backgroundColor: (isUploading || drawingMode) ? '#6c757d' : '#fd7e14',
            color: 'white',
            border: 'none',
            borderRadius: 4,
            cursor: (isUploading || drawingMode) ? 'not-allowed' : 'pointer'
          }}
        >
          {isUploading ? 'Uploading...' : 'Upload Image'}
        </button>

        <input 
          ref={fileInputRef} 
          type="file" 
          accept="image/*" 
          onChange={uploadImage} 
          style={{ display: 'none' }}
        />

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input 
            type="color" 
            value={color} 
            onChange={(e) => setColor(e.target.value)} 
            title="Pick color"
            style={{ 
              width: '40px', 
              height: '35px', 
              border: 'none', 
              borderRadius: 4,
              cursor: 'pointer'
            }}
          />
          <button 
            onClick={changeColor}
            disabled={drawingMode}
            style={{ 
              padding: '8px 12px', 
              backgroundColor: drawingMode ? '#6c757d' : '#007bff', 
              color: 'white', 
              border: 'none', 
              borderRadius: 4,
              cursor: drawingMode ? 'not-allowed' : 'pointer'
            }}
          >
            Apply Color
          </button>
        </div>

        <button 
          onClick={deleteSelected}
          disabled={drawingMode}
          style={{ 
            padding: '8px 12px', 
            backgroundColor: drawingMode ? '#6c757d' : '#dc3545', 
            color: 'white', 
            border: 'none', 
            borderRadius: 4,
            cursor: drawingMode ? 'not-allowed' : 'pointer'
          }}
        >
          Delete Selected
        </button>

        <button 
          onClick={undo}
          style={{ 
            padding: '8px 12px', 
            backgroundColor: '#6c757d', 
            color: 'white', 
            border: 'none', 
            borderRadius: 4,
            cursor: 'pointer'
          }}
        >
          Undo
        </button>

        <button 
          onClick={clearCanvas}
          style={{ 
            padding: '8px 12px', 
            backgroundColor: '#dc3545', 
            color: 'white', 
            border: 'none', 
            borderRadius: 4,
            cursor: 'pointer'
          }}
        >
          Clear All
        </button>

        <button 
          onClick={download}
          style={{ 
            padding: '8px 12px', 
            backgroundColor: '#20c997', 
            color: 'white', 
            border: 'none', 
            borderRadius: 4,
            cursor: 'pointer'
          }}
        >
          Download
        </button>

        <button 
          onClick={previewDesign}
          style={{ 
            padding: '8px 12px', 
            backgroundColor: '#e83e8c', 
            color: 'white', 
            border: 'none', 
            borderRadius: 4,
            cursor: 'pointer'
          }}
        >
          Preview
        </button>
      </div>

      {/* Canvas Container */}
      <div style={{ 
        display: "flex", 
        justifyContent: "center", 
        marginBottom: 20,
        padding: 15,
        backgroundColor: '#ffffff',
        borderRadius: 8,
        border: '2px solid #dee2e6',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <canvas
          ref={canvasRef}
          width={600}
          height={500}
          style={{ 
            border: "2px solid #007bff",
            borderRadius: 8,
            backgroundColor: "#ffffff",
            cursor: drawingMode ? 'crosshair' : 'default'
          }}
        />
      </div>

      {/* ✅ Product Details Form with Dynamic Pricing */}
      <div style={{ 
        maxWidth: 600, 
        margin: '0 auto',
        padding: 20,
        backgroundColor: '#f8f9fa',
        borderRadius: 8,
        border: '1px solid #dee2e6'
      }}>
        <h3 style={{ marginBottom: 15, color: '#333', textAlign: 'center' }}>
          Product Details
        </h3>
        
        <div style={{ marginBottom: 15 }}>
          <label style={{ 
            display: 'block', 
            marginBottom: 5, 
            fontWeight: 'bold',
            color: '#495057'
          }}>
            Product Name:
          </label>
          <input
            type="text"
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            placeholder="Enter product name"
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #ced4da',
              borderRadius: 4,
              fontSize: '14px',
              boxSizing: 'border-box'
            }}
          />
        </div>

        {/* ✅ Material Selection */}
        <div style={{ marginBottom: 15 }}>
          <label style={{ 
            display: 'block', 
            marginBottom: 5, 
            fontWeight: 'bold',
            color: '#495057'
          }}>
            Material:
          </label>
          <select
            value={selectedMaterial}
            onChange={(e) => setSelectedMaterial(e.target.value)}
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #ced4da',
              borderRadius: 4,
              fontSize: '14px',
              boxSizing: 'border-box',
              backgroundColor: 'white'
            }}
          >
            {Object.entries(materialOptions).map(([key, material]) => (
              <option key={key} value={key}>
                {material.name} - {material.description}
              </option>
            ))}
          </select>
        </div>

        {/* ✅ Size Selection */}
        <div style={{ marginBottom: 15 }}>
          <label style={{ 
            display: 'block', 
            marginBottom: 5, 
            fontWeight: 'bold',
            color: '#495057'
          }}>
            Size:
          </label>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))', 
            gap: '8px',
            marginBottom: '10px'
          }}>
            {Object.entries(sizeOptions).map(([key, size]) => (
              <button
                key={key}
                onClick={() => setSelectedSize(key)}
                style={{
                  padding: '8px 12px',
                  border: selectedSize === key ? '2px solid #007bff' : '1px solid #ced4da',
                  borderRadius: 4,
                  backgroundColor: selectedSize === key ? '#e3f2fd' : 'white',
                  color: selectedSize === key ? '#007bff' : '#495057',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: selectedSize === key ? 'bold' : 'normal',
                  transition: 'all 0.2s ease'
                }}
              >
                {size.name}
              </button>
            ))}
          </div>
        </div>

        {/* ✅ Dynamic Price Display */}
        <div style={{ 
          marginBottom: 15,
          padding: '15px',
          backgroundColor: '#e8f5e8',
          borderRadius: 8,
          border: '2px solid #28a745'  
        }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '10px'
          }}>
            <span style={{ fontWeight: 'bold', color: '#495057' }}>
              Selected Configuration:
            </span>
            <span style={{ 
              fontSize: '24px', 
              fontWeight: 'bold', 
              color: '#28a745' 
            }}>
              ₹{calculatedPrice}
            </span>
          </div>
          <div style={{ fontSize: '14px', color: '#6c757d' }}>
            <div>• Material: {materialOptions[selectedMaterial].name}</div>
            <div>• Size: {sizeOptions[selectedSize].name}</div>
            <div>• Base Price: ₹{basePrice}</div>
            <div>• Material Multiplier: {materialOptions[selectedMaterial].multiplier}x</div>
            <div>• Size Multiplier: {sizeOptions[selectedSize].multiplier}x</div>
          </div>
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ 
            display: 'block', 
            marginBottom: 5, 
            fontWeight: 'bold',
            color: '#495057'
          }}>
            Special Request Message (Optional):
          </label>
          <textarea
            value={requestMessage}
            onChange={(e) => setRequestMessage(e.target.value)}
            placeholder="Any specific requests or instructions for this custom item..."
            rows={3}
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #ced4da',
              borderRadius: 4,
              fontSize: '14px',
              resize: 'vertical',
              boxSizing: 'border-box'
            }}
          />
        </div>

        <div style={{ 
          display: 'flex', 
          gap: 10, 
          justifyContent: 'center',
          flexWrap: 'wrap'
        }}>
          <button
            onClick={saveDesignToCart}
            style={{
              padding: '12px 24px',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: 6,
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: 'pointer',
              minWidth: '150px'
            }}
          >
            💾 Save to Cart
          </button>

          <button
            onClick={previewDesign}
            style={{
              padding: '12px 24px',
              backgroundColor: '#17a2b8',
              color: 'white',
              border: 'none',
              borderRadius: 6,
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: 'pointer',
              minWidth: '150px'
            }}
          >
            👁️ Preview Design
          </button>
        </div>
      </div>

      {/* ✅ Instructions */}
      <div style={{ 
        maxWidth: 600, 
        margin: '20px auto 0',
        padding: 15,
        backgroundColor: '#e3f2fd',
        borderRadius: 8,
        border: '1px solid #bbdefb'
      }}>
        <h4 style={{ margin: '0 0 10px 0', color: '#1565c0' }}>
          📋 How to Use:
        </h4>
        <ul style={{ margin: 0, paddingLeft: 20, color: '#1976d2' }}>
          <li>Select your preferred material from the dropdown menu</li>
          <li>Choose the size by clicking on the size buttons (2-12 inches)</li>
          <li>Watch the price update dynamically based on your selections</li>
          <li>Click "Draw Mode" to enable free drawing with adjustable brush size</li>
          <li>Add shapes, text, and upload images using the toolbar buttons</li>
          <li>Click any object to select it (blue border with resize handles)</li>
          <li>Drag selected objects to move them around the canvas</li>
          <li>Use corner handles to resize objects (drag outward/inward)</li>
          <li>Use "Apply Color" to change the color of selected objects</li>
          <li>Fill in product details and save your design to cart!</li>
        </ul>
      </div>
    </div>
  );
}
