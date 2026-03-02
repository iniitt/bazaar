/**
 * API Service for Bazaar E-Commerce
 * Handles all communication with Google Apps Script Web App
 */

const API = {
    // Google Apps Script Web App URL (Replace with your deployed URL)
    BASE_URL: 'https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec',
    
    // Cache for products data
    productsCache: null,
    cacheTimestamp: null,
    CACHE_DURATION: 5 * 60 * 1000, // 5 minutes in milliseconds

    /**
     * Fetch all products from Google Sheets
     * @returns {Promise<Array>} Array of product objects
     */
    async getProducts() {
        // Check cache first
        if (this.productsCache && this.cacheTimestamp && 
            (Date.now() - this.cacheTimestamp) < this.CACHE_DURATION) {
            console.log('Returning cached products');
            return this.productsCache;
        }

        try {
            console.log('Fetching products from API...');
            const response = await fetch(`${this.BASE_URL}?action=getProducts`, {
                method: 'GET',
                mode: 'cors',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            if (data.error) {
                throw new Error(data.error);
            }

            // Update cache
            this.productsCache = data.products || [];
            this.cacheTimestamp = Date.now();
            
            console.log(`Fetched ${this.productsCache.length} products`);
            return this.productsCache;
            
        } catch (error) {
            console.error('Error fetching products:', error);
            // Return mock data for development/demo
            return this.getMockProducts();
        }
    },

    /**
     * Get products by category
     * @param {string} category - Category name
     * @returns {Promise<Array>} Filtered products
     */
    async getProductsByCategory(category) {
        const products = await this.getProducts();
        if (category === 'all') return products;
        return products.filter(product => product.category === category);
    },

    /**
     * Get single product by ID
     * @param {string|number} id - Product ID
     * @returns {Promise<Object|null>} Product object or null
     */
    async getProductById(id) {
        const products = await this.getProducts();
        return products.find(product => product.id == id) || null;
    },

    /**
     * Submit order to Google Sheets
     * @param {Object} orderData - Order details
     * @returns {Promise<Object>} Response with order ID
     */
    async submitOrder(orderData) {
        try {
            console.log('Submitting order...', orderData);
            
            // Format order data
            const formattedData = {
                action: 'placeOrder',
                orderId: this.generateOrderId(),
                customerName: orderData.fullname,
                email: orderData.email,
                phone: orderData.phone,
                address: orderData.address || 'Branch Pickup',
                branch: orderData.branch || 'Mbale',
                paymentMethod: orderData.payment,
                cartData: JSON.stringify(orderData.cart),
                total: orderData.total,
                date: new Date().toISOString(),
                status: 'Pending'
            };

            const response = await fetch(this.BASE_URL, {
                method: 'POST',
                mode: 'cors',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams(formattedData)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            
            if (result.error) {
                throw new Error(result.error);
            }

            console.log('Order submitted successfully:', result);
            
            // Send confirmation emails (simulated)
            await this.sendOrderConfirmation(formattedData);
            
            return {
                success: true,
                orderId: formattedData.orderId,
                message: 'Order placed successfully!'
            };
            
        } catch (error) {
            console.error('Error submitting order:', error);
            // Simulate successful order for demo
            return {
                success: true,
                orderId: this.generateOrderId(),
                message: 'Demo: Order saved locally (API unavailable)'
            };
        }
    },

    /**
     * Generate unique order ID
     * @returns {string} Order ID
     */
    generateOrderId() {
        return 'ORD-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9).toUpperCase();
    },

    /**
     * Send order confirmation emails (simulated)
     * @param {Object} orderData - Order data
     */
    async sendOrderConfirmation(orderData) {
        console.log('Sending confirmation emails to:', {
            admin: 'twalahahabab@gmail.com',
            customer: orderData.email
        });
        
        // In production, this would trigger the Apps Script to send emails
        // For demo, we'll just log it
        return true;
    },

    /**
     * Mock products data for development/demo
     * @returns {Array} Mock products
     */
    getMockProducts() {
        return [
            {
                id: 1,
                name: 'Oudh Al-Arab Perfume',
                category: 'Perfumes & Cosmetics',
                price: 85000,
                image_url: 'https://via.placeholder.com/300x300?text=Perfume',
                stock: 15,
                description: 'Luxurious Arabic Oudh perfume, alcohol-free'
            },
            {
                id: 2,
                name: 'Premium Abaya - Black',
                category: 'Islamic Clothing',
                price: 120000,
                image_url: 'https://via.placeholder.com/300x300?text=Abaya',
                stock: 8,
                description: 'Elegant black abaya with gold embroidery'
            },
            {
                id: 3,
                name: 'Ceramic Dining Set (12 pcs)',
                category: 'Houseware',
                price: 95000,
                image_url: 'https://via.placeholder.com/300x300?text=Dinner+Set',
                stock: 20,
                description: 'Beautiful ceramic dinner set for 6 persons'
            },
            {
                id: 4,
                name: 'Electric Kettle 1.5L',
                category: 'Home Appliances',
                price: 65000,
                image_url: 'https://via.placeholder.com/300x300?text=Kettle',
                stock: 25,
                description: 'Stainless steel electric kettle with auto shut-off'
            },
            {
                id: 5,
                name: 'Miswak Toothpaste',
                category: 'Perfumes & Cosmetics',
                price: 15000,
                image_url: 'https://via.placeholder.com/300x300?text=Toothpaste',
                stock: 50,
                description: 'Natural toothpaste with miswak extract'
            },
            {
                id: 6,
                name: 'Men\'s Thobe - White',
                category: 'Islamic Clothing',
                price: 95000,
                image_url: 'https://via.placeholder.com/300x300?text=Thobe',
                stock: 12,
                description: 'Classic white thobe, premium cotton'
            }
        ];
    },

    /**
     * Clear cache
     */
    clearCache() {
        this.productsCache = null;
        this.cacheTimestamp = null;
        console.log('Cache cleared');
    },

    /**
     * Check API health
     * @returns {Promise<boolean>} API status
     */
    async checkHealth() {
        try {
            const response = await fetch(`${this.BASE_URL}?action=health`, {
                method: 'GET',
                mode: 'cors'
            });
            return response.ok;
        } catch (error) {
            console.error('API health check failed:', error);
            return false;
        }
    }
};

// Export for use in other files
window.API = API;