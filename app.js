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

// Helper to detect mobile devices safely
function isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || (window.innerWidth <= 768);
}

// Helper to match categories to cute emojis dynamically for mobile view fallback
function getEmojiForCategory(category) {
    const cat = category ? category.toLowerCase() : '';
    if (cat.includes('lip')) return '💄';
    if (cat.includes('foundation') || cat.includes('cushion') || cat.includes('base') || cat.includes('powder')) return '🧴';
    if (cat.includes('blush') || cat.includes('cheek')) return '🌸';
    if (cat.includes('eye') || cat.includes('shadow') || cat.includes('palette')) return '👁️';
    if (cat.includes('mascara') || cat.includes('liner')) return '✏️';
    if (cat.includes('nail')) return '💅';
    if (cat.includes('perfume') || cat.includes('scent')) return '⚱️';
    if (cat.includes('brush') || cat.includes('tool')) return '🖌️';
    return '✨';
}

// Automatically resizes and compresses image files when uploading on PC
function compressImage(file, maxWidth = 400, quality = 0.7) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = event => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                if (width > maxWidth) {
                    height = Math.round((height * maxWidth) / width);
                    width = maxWidth;
                }

                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL('image/jpeg', quality));
            };
            img.onerror = err => reject(err);
        };
        reader.onerror = err => reject(err);
    });
}

function updateCategoryDropdowns() {
    const uniqueCategories = [...new Set(products.map(p => p.category))];
    if (uniqueCategories.length === 0) {
        uniqueCategories.push("Lipstick", "Foundation", "Blush", "Eyeshadow");
    }
    
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
    const mobileMode = isMobileDevice();
    
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
        
        let imageHTML = '';
        // IF ON MOBILE: Completely ignore the image data to save memory and show a cute emoji instead
        if (mobileMode) {
            imageHTML = `
                <div class="emoji-placeholder-tile">
                    <span>${getEmojiForCategory(product.category)}</span>
                </div>`;
        } 
        // IF ON PC: Render the image normally if it exists
        else if (product.image && (product.image.startsWith('data:image') || product.image.startsWith('http'))) {
            imageHTML = `<img src="${product.image}" alt="${product.name}">`;
        } else {
            imageHTML = `
                <div class="emoji-placeholder-tile">
                    <span>${getEmojiForCategory(product.category)}</span>
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
    
    // Only display image element inside details modal on PC
    if (!isMobileDevice() && product.image && (product.image.startsWith('data:image') || product.image.startsWith('http'))) {
        modalImage.src = product.image;
        modalImage.style.display = "block";
    } else {
        modalImage.style.display = "none";
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

addProductForm.addEventListener('submit', async function(e) {
    e.preventDefault();

    const fileInput = document.getElementById('prodImage');
    const file = fileInput.files[0];
    const costValue = document.getElementById('prodCost').value;
    let finalImage = 'PLACEHOLDER_TXT';

    if (file) {
        try {
            finalImage = await compressImage(file, 400, 0.7);
        } catch (error) {
            console.error("Compression failed:", error);
        }
    }

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
        image: finalImage
    };

    products.push(newProduct);
    finalizeProductAdd();
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
    products.sort((a, b) => new Date(a.purchaseDate) - new Date(b.purchaseDate));
    if (!currentSortAsc) products.reverse();
    renderGrid();
});

sortPriceBtn.addEventListener('click', () => {
    priceSortAsc = !priceSortAsc;
    products.sort((a, b) => (a.cost || 0) - (b.cost || 0));
    if (!priceSortAsc) products.reverse();
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
        localStorage.removeItem('makeup_inventory');
        window.location.reload();
    }
});

async function loadDatabase() {
    const mobileMode = isMobileDevice();
    
    if (!localStorage.getItem('makeup_inventory')) {
        try {
            const response = await fetch('products.json');
            if (!response.ok) throw new Error(`Status: ${response.status}`);
            
            const data = await response.json();
            
            if (mobileMode) {
                // MOBILE PROTECTOR: If loading on a phone, strip images from phone's local memory completely so it can't crash.
                // Your actual pictures remain completely safe inside your products.json file on GitHub!
                products = data.map(item => {
                    return { ...item, image: 'PLACEHOLDER_TXT' };
                });
            } else {
                // PC MODE: Keep all high-resolution pictures loaded normally.
                products = data;
            }
            
            saveToLocalStorage();
            renderGrid();
            updateCategoryDropdowns();
        } catch (error) {
            console.error("Database Load Error: " + error.message);
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