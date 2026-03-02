/**
 * Admin Panel Functionality
 * Restricted access for store management
 */

// Admin credentials (demo only - in production, use proper authentication)
const ADMIN_EMAIL = 'twalahahabab@gmail.com';

document.addEventListener('DOMContentLoaded', () => {
    initAdminPanel();
});

/**
 * Initialize admin panel
 */
function initAdminPanel() {
    const loginForm = document.getElementById('admin-login-form');
    const loginSection = document.getElementById('admin-login');
    const dashboard = document.getElementById('admin-dashboard');
    const logoutBtn = document.getElementById('admin-logout');
    
    // Check if already logged in
    if (sessionStorage.getItem('adminLoggedIn') === 'true') {
        showDashboard();
    }
    
    // Handle login
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const email = document.getElementById('admin-email').value;
            const password = document.getElementById('admin-password').value;
            
            // Simple validation - in production, use proper authentication
            if (email === ADMIN_EMAIL) {
                // Demo: Any password works
                sessionStorage.setItem('adminLoggedIn', 'true');
                showDashboard();
                
                // Load admin data
                loadAdminData();
            } else {
                alert('Invalid credentials. Use admin email: ' + ADMIN_EMAIL);
            }
        });
    }
    
    // Handle logout
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            sessionStorage.removeItem('adminLoggedIn');
            if (loginSection) loginSection.style.display = 'flex';
            if (dashboard) dashboard.style.display = 'none';
        });
    }
    
    // Handle tab switching
    initAdminTabs();
    
    /**
     * Show dashboard and hide login
     */
    function showDashboard() {
        if (loginSection) loginSection.style.display = 'none';
        if (dashboard) dashboard.style.display = 'block';
        loadAdminData();
    }
}

/**
 * Initialize admin tab switching
 */
function initAdminTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active class from all tabs and buttons
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            
            // Add active class to clicked button
            btn.classList.add('active');
            
            // Show corresponding tab
            const tabId = btn.dataset.tab + '-tab';
            const tab = document.getElementById(tabId);
            if (tab) {
                tab.classList.add('active');
                
                // Load tab-specific data
                if (btn.dataset.tab === 'orders') {
                    loadOrders();
                } else if (btn.dataset.tab === 'products') {
                    loadInventory();
                } else if (btn.dataset.tab === 'analytics') {
                    loadAnalytics();
                }
            }
        });
    });
}

/**
 * Load all admin data
 */
async function loadAdminData() {
    await Promise.all([
        loadOrders(),
        loadInventory(),
        loadAnalytics()
    ]);
}

/**
 * Load and display orders
 */
async function loadOrders() {
    const ordersList = document.getElementById('orders-list');
    
    if (!ordersList) return;
    
    try {
        // In production, fetch from API
        // For demo, show mock data
        const mockOrders = getMockOrders();
        
        if (mockOrders.length === 0) {
            ordersList.innerHTML = '<tr><td colspan="6" class="no-data">No orders found</td></tr>';
            return;
        }
        
        ordersList.innerHTML = mockOrders.map(order => `
            <tr>
                <td>${order.id}</td>
                <td>${order.customer}</td>
                <td>${Cart.formatPrice(order.total)} UGX</td>
                <td><span class="payment-status ${order.payment.toLowerCase()}">${order.payment}</span></td>
                <td>${new Date(order.date).toLocaleDateString()}</td>
                <td>
                    <button class="btn btn-secondary btn-sm" onclick="viewOrderDetails('${order.id}')">
                        View
                    </button>
                </td>
            </tr>
        `).join('');
        
    } catch (error) {
        console.error('Error loading orders:', error);
        ordersList.innerHTML = '<tr><td colspan="6" class="error">Failed to load orders</td></tr>';
    }
}

/**
 * Load and display inventory
 */
async function loadInventory() {
    const inventoryList = document.getElementById('inventory-list');
    
    if (!inventoryList) return;
    
    try {
        const products = await API.getProducts();
        
        if (products.length === 0) {
            inventoryList.innerHTML = '<tr><td colspan="6" class="no-data">No products found</td></tr>';
            return;
        }
        
        inventoryList.innerHTML = products.map(product => `
            <tr data-id="${product.id}">
                <td>${product.id}</td>
                <td>${product.name}</td>
                <td>${product.category}</td>
                <td>${Cart.formatPrice(product.price)} UGX</td>
                <td>
                    <input type="number" class="stock-input" value="${product.stock}" min="0" 
                           data-product-id="${product.id}">
                    <button class="update-stock" onclick="updateStock(${product.id})">Update</button>
                </td>
                <td>
                    <button class="btn btn-secondary btn-sm" onclick="editProduct(${product.id})">
                        Edit
                    </button>
                </td>
            </tr>
        `).join('');
        
    } catch (error) {
        console.error('Error loading inventory:', error);
        inventoryList.innerHTML = '<tr><td colspan="6" class="error">Failed to load inventory</td></tr>';
    }
}

/**
 * Load analytics data
 */
async function loadAnalytics() {
    const totalOrdersEl = document.getElementById('total-orders');
    const totalRevenueEl = document.getElementById('total-revenue');
    const productsSoldEl = document.getElementById('products-sold');
    const avgOrderEl = document.getElementById('avg-order');
    
    if (!totalOrdersEl) return;
    
    try {
        const mockOrders = getMockOrders();
        const products = await API.getProducts();
        
        // Calculate analytics
        const totalOrders = mockOrders.length;
        const totalRevenue = mockOrders.reduce((sum, order) => sum + order.total, 0);
        const productsSold = mockOrders.reduce((sum, order) => {
            const cart = typeof order.cart === 'string' ? JSON.parse(order.cart) : order.cart;
            return sum + (cart ? cart.reduce((s, item) => s + item.quantity, 0) : 0);
        }, 0);
        const avgOrder = totalOrders > 0 ? totalRevenue / totalOrders : 0;
        
        // Update display
        totalOrdersEl.textContent = totalOrders;
        totalRevenueEl.textContent = `${Cart.formatPrice(totalRevenue)} UGX`;
        productsSoldEl.textContent = productsSold;
        avgOrderEl.textContent = `${Cart.formatPrice(avgOrder)} UGX`;
        
    } catch (error) {
        console.error('Error loading analytics:', error);
    }
}

/**
 * Update product stock
 * @param {number} productId - Product ID
 */
async function updateStock(productId) {
    const input = document.querySelector(`.stock-input[data-product-id="${productId}"]`);
    if (!input) return;
    
    const newStock = parseInt(input.value);
    if (isNaN(newStock) || newStock < 0) {
        alert('Please enter a valid stock number');
        return;
    }
    
    try {
        // In production, send to API
        // For demo, show success message
        alert(`Stock updated for product ${productId} to ${newStock}`);
        
        // Refresh inventory
        await loadInventory();
        
    } catch (error) {
        console.error('Error updating stock:', error);
        alert('Failed to update stock');
    }
}

/**
 * View order details
 * @param {string} orderId - Order ID
 */
function viewOrderDetails(orderId) {
    alert(`Viewing order ${orderId}\n(This would show detailed order information in production)`);
}

/**
 * Edit product
 * @param {number} productId - Product ID
 */
function editProduct(productId) {
    alert(`Editing product ${productId}\n(This would open product edit form in production)`);
}

/**
 * Get mock orders for demo
 * @returns {Array} Mock orders
 */
function getMockOrders() {
    return [
        {
            id: 'ORD-001',
            customer: 'John Doe',
            total: 165000,
            payment: 'MTN MoMo',
            date: '2024-01-15T10:30:00',
            cart: [{ id: 1, name: 'Product 1', quantity: 2, price: 75000 }]
        },
        {
            id: 'ORD-002',
            customer: 'Jane Smith',
            total: 95000,
            payment: 'Cash on Delivery',
            date: '2024-01-16T14:20:00',
            cart: [{ id: 3, name: 'Product 3', quantity: 1, price: 95000 }]
        },
        {
            id: 'ORD-003',
            customer: 'Ahmed Hassan',
            total: 280000,
            payment: 'Airtel Money',
            date: '2024-01-17T09:15:00',
            cart: [{ id: 2, name: 'Product 2', quantity: 2, price: 120000 }, { id: 5, quantity: 2, price: 15000 }]
        }
    ];
}

// Make functions globally available
window.updateStock = updateStock;
window.viewOrderDetails = viewOrderDetails;
window.editProduct = editProduct;