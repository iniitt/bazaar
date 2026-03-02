/**
 * Shopping Cart Management System
 * Uses LocalStorage for persistent cart storage
 */

const Cart = {
    // Cart storage key
    STORAGE_KEY: 'bazaar_cart',
    
    // Delivery fee (UGX)
    DELIVERY_FEE: 10000,

    /**
     * Get current cart from localStorage
     * @returns {Array} Cart items array
     */
    getCart() {
        const cart = localStorage.getItem(this.STORAGE_KEY);
        return cart ? JSON.parse(cart) : [];
    },

    /**
     * Save cart to localStorage
     * @param {Array} cart - Cart items array
     */
    saveCart(cart) {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(cart));
        this.updateCartCount();
    },

    /**
     * Add item to cart
     * @param {Object} product - Product object
     * @param {number} quantity - Quantity to add
     * @returns {boolean} Success status
     */
    addToCart(product, quantity = 1) {
        if (!product || quantity < 1) return false;
        
        const cart = this.getCart();
        const existingItem = cart.find(item => item.id === product.id);
        
        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            cart.push({
                id: product.id,
                name: product.name,
                price: product.price,
                image: product.image_url,
                category: product.category,
                quantity: quantity,
                maxStock: product.stock
            });
        }
        
        this.saveCart(cart);
        this.showNotification(`${product.name} added to cart!`);
        return true;
    },

    /**
     * Remove item from cart
     * @param {number} productId - Product ID
     */
    removeFromCart(productId) {
        const cart = this.getCart();
        const updatedCart = cart.filter(item => item.id !== productId);
        this.saveCart(updatedCart);
        this.showNotification('Item removed from cart');
    },

    /**
     * Update item quantity
     * @param {number} productId - Product ID
     * @param {number} newQuantity - New quantity
     * @returns {boolean} Success status
     */
    updateQuantity(productId, newQuantity) {
        if (newQuantity < 1) return false;
        
        const cart = this.getCart();
        const item = cart.find(item => item.id === productId);
        
        if (item) {
            if (newQuantity > item.maxStock) {
                this.showNotification(`Only ${item.maxStock} items available`, 'error');
                return false;
            }
            item.quantity = newQuantity;
            this.saveCart(cart);
            return true;
        }
        return false;
    },

    /**
     * Get cart total items count
     * @returns {number} Total items count
     */
    getTotalItems() {
        const cart = this.getCart();
        return cart.reduce((total, item) => total + item.quantity, 0);
    },

    /**
     * Get cart subtotal
     * @returns {number} Subtotal in UGX
     */
    getSubtotal() {
        const cart = this.getCart();
        return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    },

    /**
     * Get delivery fee
     * @param {string} deliveryMethod - 'pickup' or 'home'
     * @returns {number} Delivery fee
     */
    getDeliveryFee(deliveryMethod = 'home') {
        return deliveryMethod === 'home' ? this.DELIVERY_FEE : 0;
    },

    /**
     * Get cart total including delivery
     * @param {string} deliveryMethod - Delivery method
     * @returns {number} Total amount
     */
    getTotal(deliveryMethod = 'home') {
        return this.getSubtotal() + this.getDeliveryFee(deliveryMethod);
    },

    /**
     * Clear entire cart
     */
    clearCart() {
        localStorage.removeItem(this.STORAGE_KEY);
        this.updateCartCount();
        this.showNotification('Cart cleared');
    },

    /**
     * Update cart count badge in header
     */
    updateCartCount() {
        const count = this.getTotalItems();
        const cartCountElements = document.querySelectorAll('#cart-count');
        cartCountElements.forEach(element => {
            element.textContent = count;
            element.style.display = count > 0 ? 'inline' : 'none';
        });
    },

    /**
     * Render cart items on cart page
     * @param {HTMLElement} container - Container element
     */
    async renderCartPage(container) {
        const cart = this.getCart();
        
        if (cart.length === 0) {
            container.innerHTML = `
                <div class="empty-cart">
                    <i class="fas fa-shopping-cart"></i>
                    <h3>Your cart is empty</h3>
                    <p>Browse our products and add items to your cart</p>
                    <a href="products.html" class="btn btn-primary">Start Shopping</a>
                </div>
            `;
            return;
        }

        let html = '<div class="cart-items">';
        
        for (const item of cart) {
            // Fetch latest product data for stock status
            const product = await API.getProductById(item.id);
            const stockStatus = product ? product.stock : item.maxStock;
            const inStock = stockStatus >= item.quantity;
            
            html += `
                <div class="cart-item" data-id="${item.id}">
                    <img src="${item.image || 'https://via.placeholder.com/100x100'}" 
                         alt="${item.name}" class="cart-item-image">
                    <div class="cart-item-info">
                        <h3>${item.name}</h3>
                        <p class="cart-item-price">${this.formatPrice(item.price)} UGX</p>
                        <p class="product-stock ${inStock ? 'in-stock' : 'out-of-stock'}">
                            ${inStock ? '✓ In Stock' : '✗ Low Stock'}
                        </p>
                    </div>
                    <div class="cart-item-quantity">
                        <button class="quantity-btn minus" onclick="Cart.decrementQuantity(${item.id})">-</button>
                        <input type="number" class="quantity-input" value="${item.quantity}" 
                               min="1" max="${stockStatus}" 
                               onchange="Cart.updateQuantity(${item.id}, parseInt(this.value))">
                        <button class="quantity-btn plus" onclick="Cart.incrementQuantity(${item.id})">+</button>
                    </div>
                    <div class="cart-item-total">
                        ${this.formatPrice(item.price * item.quantity)} UGX
                    </div>
                    <div class="remove-item" onclick="Cart.removeFromCart(${item.id})">
                        <i class="fas fa-trash"></i>
                    </div>
                </div>
            `;
        }
        
        html += '</div>';
        
        // Add totals section
        const subtotal = this.getSubtotal();
        html += `
            <div class="cart-totals">
                <h3>Cart Summary</h3>
                <div class="cart-summary">
                    <div>
                        <span>Subtotal:</span>
                        <span>${this.formatPrice(subtotal)} UGX</span>
                    </div>
                    <div>
                        <span>Delivery Fee:</span>
                        <span>${this.formatPrice(this.DELIVERY_FEE)} UGX</span>
                    </div>
                    <div class="total">
                        <span>Total:</span>
                        <span>${this.formatPrice(subtotal + this.DELIVERY_FEE)} UGX</span>
                    </div>
                </div>
            </div>
        `;
        
        container.innerHTML = html;
    },

    /**
     * Increment item quantity
     * @param {number} productId - Product ID
     */
    async incrementQuantity(productId) {
        const cart = this.getCart();
        const item = cart.find(i => i.id === productId);
        if (item) {
            const product = await API.getProductById(productId);
            const maxStock = product ? product.stock : item.maxStock;
            
            if (item.quantity < maxStock) {
                item.quantity++;
                this.saveCart(cart);
                this.renderCartPage(document.getElementById('cart-container'));
            } else {
                this.showNotification('Maximum stock reached', 'error');
            }
        }
    },

    /**
     * Decrement item quantity
     * @param {number} productId - Product ID
     */
    decrementQuantity(productId) {
        const cart = this.getCart();
        const item = cart.find(i => i.id === productId);
        if (item && item.quantity > 1) {
            item.quantity--;
            this.saveCart(cart);
            this.renderCartPage(document.getElementById('cart-container'));
        } else if (item && item.quantity === 1) {
            this.removeFromCart(productId);
        }
    },

    /**
     * Format price with commas
     * @param {number} price - Price in UGX
     * @returns {string} Formatted price
     */
    formatPrice(price) {
        return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    },

    /**
     * Show notification
     * @param {string} message - Notification message
     * @param {string} type - 'success' or 'error'
     */
    showNotification(message, type = 'success') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
            <span>${message}</span>
        `;
        
        // Style the notification
        notification.style.position = 'fixed';
        notification.style.bottom = '20px';
        notification.style.right = '20px';
        notification.style.backgroundColor = type === 'success' ? '#27ae60' : '#e74c3c';
        notification.style.color = 'white';
        notification.style.padding = '1rem 2rem';
        notification.style.borderRadius = '5px';
        notification.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
        notification.style.zIndex = '9999';
        notification.style.animation = 'slideIn 0.3s ease';
        
        document.body.appendChild(notification);
        
        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'fadeOut 0.3s ease';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    },

    /**
     * Validate cart before checkout
     * @returns {Object} Validation result
     */
    async validateCart() {
        const cart = this.getCart();
        
        if (cart.length === 0) {
            return {
                valid: false,
                message: 'Your cart is empty'
            };
        }
        
        // Check stock availability
        for (const item of cart) {
            const product = await API.getProductById(item.id);
            if (!product) {
                return {
                    valid: false,
                    message: `Product ${item.name} is no longer available`
                };
            }
            if (product.stock < item.quantity) {
                return {
                    valid: false,
                    message: `Only ${product.stock} units of ${item.name} are available`
                };
            }
        }
        
        return {
            valid: true,
            message: 'Cart is valid'
        };
    }
};

// Initialize cart count on page load
document.addEventListener('DOMContentLoaded', () => {
    Cart.updateCartCount();
});

window.Cart = Cart;