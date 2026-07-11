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
let priceSortAsc = true;
let activeProduct = null;

// DOM Elements
const productGrid = document.getElementById('productGrid');
const searchBar = document.getElementById('searchBar');
const categoryFilter = document.getElementById('categoryFilter');
const statusFilter = document.getElementById('statusFilter');
const sortDateBtn = document.getElementById('sortDateBtn');
const sortPriceBtn = document.getElementById('sortPriceBtn');
const hideUsedCheck = document.getElementById('hideUsedCheck');
const exportBtn = document.getElementById('exportBtn');
const syncBtn = document.getElementById('syncBtn');

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
const modalDeleteBtn = document.getElementById('modalDeleteBtn');

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

// 1. Fixed: Categories now sort alphabetically automatically
function updateCategoryDropdowns() {
    const uniqueCategories = [...new Set(products.map(p => p.category))];
    if (uniqueCategories.length === 0) {
        uniqueCategories.push("Lipstick", "Foundation", "Blush", "Eyeshadow");
    }
    
    // Sort strings in alphabetical order
    uniqueCategories.sort((a, b) => a.localeCompare(b));

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
        const matchesHideUsed = !hideUsedCheck.checked || product.status !== "Used Up";
        
        return matchesSearch && matchesCategory && matchesStatus && matchesHideUsed;
    });

    filtered.forEach(product => {
        let badgeClass = "badge-in-use";
        if (product.status === "Brand New") badgeClass = "badge-brand-new";
        if (product.status === "Used Up") badgeClass = "badge-used-up";

        const formattedCost = product.cost ? `HKD$${product.cost}` : 'HKD$0';

        // 2. Fixed: Handle image rendering fallback cleanly
        let imageHTML = '';
        if (product.image && product.image.startsWith('data:image') || product.image.startsWith('http')) {
            imageHTML = `<img src="${product.image}" alt="${product.name}">`;
        } else {
            imageHTML = `
                <div class="no-image-placeholder">
                    <span>✨</span>
                    ${product.brand}<br>${product.name}
                </div>`;
        }

        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            <span class="badge ${badgeClass}">${product.status}</span>
            ${imageHTML}
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
    
    if (product.image && (product.image.startsWith('data:image') || product.image.startsWith('http'))) {
        modalImage.src = product.image;
        modalImage.style.display = "block";
    } else {
        modalImage.style.display = "none"; // Hide standard modal img tag if it's utilizing text fallback
    }
    
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

modalDeleteBtn.addEventListener('click', function() {
    if (activeProduct) {
        const confirmDelete = confirm(`Are you sure you want to remove "${activeProduct.brand} - ${activeProduct.name}"?`);
        if (confirmDelete) {
            products = products.filter(product => product.id !== activeProduct.id);
            saveToLocalStorage();
            updateCategoryDropdowns();
            renderGrid();
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

// 3. Fixed: Picture is optional. Saves text placeholder metadata if empty.
addProductForm.addEventListener('submit', function(e) {
    e.preventDefault();

    const fileInput = document.getElementById('prodImage');
    const file = fileInput.files[0];
    const costValue = document.getElementById('prodCost').value;

    const buildProductObject = (imageResult) => {
        return {
            id: Date.now().toString(),
            brand: document.getElementById('prodBrand').value,
            name: document.getElementById('prodName').value,
            category: document.getElementById('prodCategory').value,
            color: document.getElementById('prodColor').value,
            size: document.getElementById('prodSize').value,
            purchaseDate: document.getElementById('prodDate').value,
            cost: costValue ? parseFloat(costValue) : '', // Empty interpreted as blank string initially
            status: document.getElementById('prodStatus').value,
            rating: parseInt(document.getElementById('prodRating').value),
            description: document.getElementById('prodDesc').value,
            image: imageResult
        };
    };

    if (file) {
        const reader = new FileReader();
        reader.onloadend = function() {
            const newProduct = buildProductObject(reader.result);
            products.push(newProduct);
            finalizeProductAdd();
        };
        reader.readAsDataURL(file);
    } else {
        // Fallback flag string used to mark card as text placeholder structure
        const newProduct = buildProductObject('PLACEHOLDER_TXT');
        products.push(newProduct);
        finalizeProductAdd();
    }
});

function finalizeProductAdd() {
    saveToLocalStorage();
    updateCategoryDropdowns();
    renderGrid();
    addProductForm.reset();
    formModal.classList.add('hidden');
}

sortDateBtn.addEventListener('click', () => {
    currentSortAsc = !currentSortAsc;
    products.sort((a, b) => {
        const dateA = new Date(a.purchaseDate);
        const dateB = new Date(b.purchaseDate);
        return currentSortAsc ? dateA - dateB : dateB - dateA;
    });
    renderGrid();
});

// 4. Fixed: Added Sort by Price Logic (Treats empty fields as 0)
sortPriceBtn.addEventListener('click', () => {
    priceSortAsc = !priceSortAsc;
    products.sort((a, b) => {
        const priceA = a.cost ? parseFloat(a.cost) : 0;
        const priceB = b.cost ? parseFloat(b.cost) : 0;
        return priceSortAsc ? priceA - priceB : priceB - priceA;
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

syncBtn.addEventListener('click', function() {
    const confirmSync = confirm("This will clear your current screen and download the master inventory file from GitHub. Proceed?");
    if (confirmSync) {
        localStorage.removeItem('makeup_inventory'); // Wipes local memory slot
        window.location.reload(); // Reloads page, forcing loadDatabase() to run fresh
    }
});

async function loadDatabase() {
    if (!localStorage.getItem('makeup_inventory')) {
        try {
            const response = await fetch('products.json');
            
            // Check if the file actually exists on GitHub
            if (!response.ok) {
                throw new Error(`Could not find products.json on your server (Status: ${response.status}). Check your file name capitalization!`);
            }
            
            const data = await response.json();
            products = data;
            saveToLocalStorage();
            renderGrid();
            updateCategoryDropdowns();
            
        } catch (error) {
            // This will now pop up an alert box on your screen telling you the exact error
            alert("Database Load Error: " + error.message + "\n\nFalling back to default template.");
            console.error(error);
        }
    }
}

searchBar.addEventListener('input', renderGrid);
categoryFilter.addEventListener('change', renderGrid);
statusFilter.addEventListener('change', renderGrid);
hideUsedCheck.addEventListener('change', renderGrid);

updateCategoryDropdowns();
renderGrid();
loadDatabase();