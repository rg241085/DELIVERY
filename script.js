const pasteArea = document.getElementById('pasteArea');
const processBtn = document.getElementById('processBtn');
const recordsContainer = document.getElementById('recordsContainer');
const tabs = document.querySelectorAll('.tab');

// Store orders here
const orders = [];
let orderCounter = 1;
let currentFilter = 'pending';

function parseOrderText(text) {
    // Regex to extract fields excluding status and email
    const orderIdMatch = text.match(/Order Id\s*([\w\d]+)/i);
    const customerNameMatch = text.match(/Name\s*([^\n]*)/i);
    const mobileMatch = text.match(/Mobile Number\s*([\d]{10})/i);
    const addressMatch = text.match(/Address\s*([\s\S]*)/i);

    const orderId = orderIdMatch ? orderIdMatch[1].trim() : null;
    let customerName = customerNameMatch ? customerNameMatch[1].trim() : null;
    // Remove email and unwanted trailing text from customer name
    if (customerName) {
        customerName = customerName
            .replace(/Email.*$/i, '')
            .replace(/Mobile.*$/i, '')
            .trim();
    }
    const mobile = mobileMatch ? mobileMatch[1].trim() : null;
    let address = null;
    if (addressMatch) {
        let addrText = addressMatch[1].trim();
        // Remove common unwanted prefixes like "Details Address", "Details", "Address:"
        addrText = addrText.replace(/^(Details\s+Address|Details|Address)\s*[:.-]*\s*/i, '');
        address = addrText.replace(/\n\s*\n/g, '\n').replace(/\n/g, ' ').trim();
    }

    // Default all new orders to Pending status (no status parsing)
    let status = 'Pending';

    if (!orderId || !customerName || !mobile || !address) {
        return null;
    }

    return { orderId, customerName, mobile, address, status };
}

function createOrderDiv(order) {
    const div = document.createElement('div');
    div.setAttribute('data-id', order.id);
    div.setAttribute('data-status', order.status.toLowerCase());
    div.innerHTML = `
    <p><strong>Order Id:</strong> ${order.orderId}</p>
    <p><strong>Customer Name:</strong> ${order.customerName}</p>
    <p><strong>Address:</strong> ${order.address}</p>
    <p><strong>Mobile Number:</strong> ${order.mobile}</p>
    ${order.status.toLowerCase() === 'pending' ? `
    <div class="actions">
      <button class="delivered-btn">Delivered</button>
      <button class="issue-btn">Some Issue</button>
    </div>` : ''}
    ${order.status.toLowerCase() === 'issue' && order.issueNote ? `
    <p class="issue-note">Issue: ${order.issueNote}</p>` : ''}
    <p><strong>Status:</strong> ${order.status}</p>
  `;
    if (order.status.toLowerCase() === 'pending') {
        div.querySelector('.delivered-btn').addEventListener('click', () => {
            updateOrderStatus(order.id, 'delivered');
        });
        div.querySelector('.issue-btn').addEventListener('click', () => {
            const note = prompt('Please enter issue details for this order:');
            if (note && note.trim() !== '') {
                updateOrderStatus(order.id, 'issue', note.trim());
            } else {
                alert('Issue details required!');
            }
        });
    }
    return div;
}

function updateOrderStatus(id, newStatus, issueNote = '') {
    const idx = orders.findIndex(o => o.id === id);
    if (idx !== -1) {
        orders[idx].status = newStatus.charAt(0).toUpperCase() + newStatus.slice(1);
        if (newStatus === 'issue') {
            orders[idx].issueNote = issueNote;
        } else {
            delete orders[idx].issueNote;
        }
        renderOrders();
        filterOrders(currentFilter);
    }
}

function renderOrders() {
    recordsContainer.innerHTML = '';
    orders.forEach(order => {
        const orderDiv = createOrderDiv(order);
        recordsContainer.appendChild(orderDiv);
    });
}

function filterOrders(status) {
    currentFilter = status;
    const children = recordsContainer.children;
    for (let i = 0; i < children.length; i++) {
        const elem = children[i];
        if (elem.getAttribute('data-status') === status) {
            elem.style.display = 'block';
        } else {
            elem.style.display = 'none';
        }
    }
}

tabs.forEach(tab => {
    tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        filterOrders(tab.getAttribute('data-status'));
    });
});

processBtn.addEventListener('click', () => {
    const text = pasteArea.value;
    const parsed = parseOrderText(text);
    if (parsed) {
        const newOrder = {
            ...parsed,
            id: String(orderCounter++)
        };
        orders.unshift(newOrder);
        renderOrders();
        filterOrders(currentFilter);
        pasteArea.value = ''; // Clear textarea after processing
    } else {
        alert('Could not extract complete order details. Please check the pasted text.');
    }
});

// Initialize with Pending filter active
filterOrders(currentFilter);
