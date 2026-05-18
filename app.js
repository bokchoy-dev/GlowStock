const initialProducts = [
  {
    "id": "1001",
    "brand": "Rom&nd",
    "name": "Juicy Lasting Tint",
    "category": "Lipstick",
    "purchaseDate": "2026-01-15",
    "cost": 120,
    "status": "Brand New",
    "image": "https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=400",
    "color": "Bare Grape",
    "size": "5.5g",
    "description": "Lovely daily cool-toned tint.",
    "rating": 5
  }
];

let products = JSON.parse(localStorage.getItem('makeup_inventory')) || initialProducts;
let currentSortAsc = true;
let activeProduct = null;

// Fetches the master data file from your GitHub repository if local storage is blank
async function loadDatabase() {
    if (!localStorage.getItem('makeup_inventory')) {
        try {
            const response = await fetch('products.json');
            if (response.ok) {
                const data = await response.json();
                products = data;
                saveToLocalStorage();
                renderGrid();
                updateCategoryDropdowns();
            }
        } catch (error) {
            console.log("No initial products.json found yet, using default template.");
        }
    }
}

// DOM Elements
const productGrid = document.getElementById('productGrid');
const searchBar = document.getElementById('searchBar');
const categoryFilter = document.getElementById('categoryFilter');
const statusFilter = document.getElementById('statusFilter');
const sortDateBtn = document.getElementById('sortDateBtn');
const exportBtn = document.getElementById('exportBtn');
const modalDeleteBtn = document.getElementById('modalDeleteBtn');

// Modals
const detailModal = document.getElementById('detailModal');
const closeModal = document.getElementById('closeModal');
const formModal = document.getElementById('formModal');
const openFormBtn = document.getElementById('openFormBtn');
const closeFormModal = document.getElementById('closeFormModal');
const addProductForm = document.getElementById('addProductForm');
const editProductForm = document.getElementById('editProductForm');
const addNewCategoryBtn = document.getElementById('addNewCategoryBtn');
const prodCategorySelect = document.getElementById('prodCategory');

// Editable Detail Modal Elements
const modalImage = document.getElementById('modalImage');
const modalBrandInput = document.getElementById('modalBrandInput');
const modalNameInput = document.getElementById('modalNameInput');
const modalCategorySelect = document.getElementById('modalCategorySelect');
const modalColorInput = document.getElementById('modalColorInput');
const modalSizeInput = document.getElementById('modalSizeInput');
const modalDateInput = document.getElementById('modalDateInput');
const modalCostInput = document.getElementById('modalCostInput');
const modalStatusSelect = document.getElementById('modalStatusSelect');
const modalRatingSelect = document.getElementById('modalRatingSelect');
const modalDescriptionInput = document.getElementById('modalDescriptionInput');

function saveToLocalStorage() {
    localStorage.setItem('makeup_inventory', JSON.stringify(products));
}

function updateCategoryDropdowns() {
    const uniqueCategories = [...new Set(products.map(p => p.category))];
    if (uniqueCategories.length === 0) {
        uniqueCategories.push("Lipstick", "Foundation", "Blush", "Eyeshadow");
    }

    const savedFilterValue = categoryFilter.value;
    categoryFilter.innerHTML = '<option value="all">All Categories</option>';
    uniqueCategories.forEach(cat => {
        categoryFilter.innerHTML += `<option value="${cat}">${cat}</option>`;
    });
    categoryFilter.value = savedFilterValue;

    prodCategorySelect.innerHTML = '';
    uniqueCategories.forEach(cat => {
        prodCategorySelect.innerHTML += `<option value="${cat}">${cat}</option>`;
    });

    modalCategorySelect.innerHTML = '';
    uniqueCategories.forEach(cat => {
        modalCategorySelect.innerHTML += `<option value="${cat}">${cat}</option>`;
    });
}

function renderGrid() {
    productGrid.innerHTML = '';
    
    const filtered = products.filter(product => {
        const searchText = searchBar.value.toLowerCase();
        const matchesSearch = 
            product.name.toLowerCase().includes(searchText) || 
            product.brand.toLowerCase().includes(searchText) ||
            (product.color && product.color.toLowerCase().includes(searchText));
            
        const matchesCategory = categoryFilter.value === 'all' || product.category === categoryFilter.value;
        const matchesStatus = statusFilter.value === 'all' || product.status === statusFilter.value;
        
        return matchesSearch && matchesCategory && matchesStatus;
    });

    filtered.forEach(product => {
        let badgeClass = "badge-in-use";
        if (product.status === "Brand New") badgeClass = "badge-brand-new";
        if (product.status === "Used Up") badgeClass = "badge-used-up";

        // Display cost on the main screen card layout if it exists
        const formattedCost = product.cost ? `HKD$${product.cost}` : '—';

        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            <span class="badge ${badgeClass}">${product.status}</span>
            <img src="${product.image}" alt="${product.name}">
            <div class="card-content">
                <p class="card-category"><strong>${product.brand}</strong> — ${product.category} ${product.size ? `(${product.size})` : ''}</p>
                <h3 class="card-title">${product.name}</h3>
                <p style="font-size: 13px; color: var(--accent); margin-top: 5px; font-weight: 600;">${formattedCost}</p>
            </div>
        `;
        card.addEventListener('click', () => openModal(product));
        productGrid.appendChild(card);
    });
}

function openModal(product) {
    activeProduct = product;
    
    modalImage.src = product.image;
    modalBrandInput.value = product.brand;
    modalNameInput.value = product.name;
    modalCategorySelect.value = product.category;
    modalColorInput.value = product.color || '';
    modalSizeInput.value = product.size || '';
    modalDateInput.value = product.purchaseDate;
    modalCostInput.value = product.cost || '';
    modalStatusSelect.value = product.status || 'In Use';
    modalRatingSelect.value = product.rating || 5;
    modalDescriptionInput.value = product.description || '';
    
    detailModal.classList.remove('hidden');
}

closeModal.addEventListener('click', () => detailModal.classList.add('hidden'));

// Edit submission logic incorporating costs
editProductForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    if (activeProduct) {
        activeProduct.brand = modalBrandInput.value;
        activeProduct.name = modalNameInput.value;
        activeProduct.category = modalCategorySelect.value;
        activeProduct.color = modalColorInput.value;
        activeProduct.size = modalSizeInput.value;
        activeProduct.purchaseDate = modalDateInput.value;
        activeProduct.cost = modalCostInput.value ? parseFloat(modalCostInput.value) : '';
        activeProduct.status = modalStatusSelect.value;
        activeProduct.rating = parseInt(modalRatingSelect.value);
        activeProduct.description = modalDescriptionInput.value;
        
        saveToLocalStorage();
        updateCategoryDropdowns();
        renderGrid();
        
        detailModal.classList.add('hidden');
    }
});

// Handle deleting an item permanently from local storage
modalDeleteBtn.addEventListener('click', function() {
    if (activeProduct) {
        // Pop up a quick verification window so you don't accidentally click it
        const confirmDelete = confirm(`Are you sure you want to remove "${activeProduct.brand} - ${activeProduct.name}" from your inventory?`);
        
        if (confirmDelete) {
            // Filter the array to keep every item EXCEPT the active product ID
            products = products.filter(product => product.id !== activeProduct.id);
            
            // Save the updated list back to your browser storage and refresh screen view
            saveToLocalStorage();
            updateCategoryDropdowns();
            renderGrid();
            
            // Close the pop-up modal layer
            detailModal.classList.add('hidden');
        }
    }
});


openFormBtn.addEventListener('click', () => formModal.classList.remove('hidden'));
closeFormModal.addEventListener('click', () => formModal.classList.add('hidden'));

addNewCategoryBtn.addEventListener('click', () => {
    const newCat = prompt("Enter the name of the new category:");
    if (newCat && newCat.trim() !== "") {
        const cleanCat = newCat.trim();
        const option = document.createElement('option');
        option.value = cleanCat;
        option.textContent = cleanCat;
        prodCategorySelect.appendChild(option);
        prodCategorySelect.value = cleanCat;
    }
});

// Create item submission tracking incorporating costs
addProductForm.addEventListener('submit', function(e) {
    e.preventDefault();

    const fileInput = document.getElementById('prodImage');
    const file = fileInput.files[0];
    const reader = new FileReader();

    reader.onloadend = function() {
        const costValue = document.getElementById('prodCost').value;

        const newProduct = {
            id: Date.now().toString(),
            brand: document.getElementById('prodBrand').value,
            name: document.getElementById('prodName').value,
            category: document.getElementById('prodCategory').value,
            color: document.getElementById('prodColor').value,
            size: document.getElementById('prodSize').value,
            purchaseDate: document.getElementById('prodDate').value,
            cost: costValue ? parseFloat(costValue) : '',
            status: document.getElementById('prodStatus').value,
            rating: parseInt(document.getElementById('prodRating').value),
            description: document.getElementById('prodDesc').value,
            image: reader.result
        };

        products.push(newProduct);
        saveToLocalStorage();
        updateCategoryDropdowns();
        renderGrid();
        
        addProductForm.reset();
        formModal.classList.add('hidden');
    };

    if (file) {
        reader.readAsDataURL(file);
    }
});

sortDateBtn.addEventListener('click', () => {
    currentSortAsc = !currentSortAsc;
    products.sort((a, b) => {
        const dateA = new Date(a.purchaseDate);
        const dateB = new Date(b.purchaseDate);
        return currentSortAsc ? dateA - dateB : dateB - dateA;
    });
    renderGrid();
});

exportBtn.addEventListener('click', () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(products, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "products.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
});

searchBar.addEventListener('input', renderGrid);
categoryFilter.addEventListener('change', renderGrid);
statusFilter.addEventListener('change', renderGrid);



// 2. Initial Setup Launch Sequences (Make sure loadDatabase() is at the bottom)
updateCategoryDropdowns();
renderGrid();
loadDatabase();