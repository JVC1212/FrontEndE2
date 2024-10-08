// CRUD para cualquier entidad
function createItem(key, item) {
    const items = safelyParseJSON(key);

    if (key === 'categories') {
        item.nombre = item['nombre-categoria'];
        item.tipo = item['tipo-categoria'];
        delete item['nombre-categoria'];
        delete item['tipo-categoria'];
    }

    item.id = items.length > 0 ? Math.max(...items.map(i => i.id)) + 1 : 1;
    items.push(item);
    localStorage.setItem(key, JSON.stringify(items));
    
    console.log(`${key} creado:`, item); // Para depuración
}

function updateItem(key, updatedItem) {
    const items = safelyParseJSON(key);
    const index = items.findIndex(i => i.id === updatedItem.id);
    if (index !== -1) {
        items[index] = updatedItem;
        localStorage.setItem(key, JSON.stringify(items));
        return true;
    }
    return false;
}

function deleteItem(key, itemId) {
    let items = safelyParseJSON(key);
    items = items.filter(i => i.id !== itemId);
    localStorage.setItem(key, JSON.stringify(items));
}

function getItems(key) {
    return safelyParseJSON(key);
}

function safelyParseJSON(key) {
    try {
        return JSON.parse(localStorage.getItem(key)) || [];
    } catch (e) {
        console.error(`Error parsing ${key} from localStorage:`, e);
        return [];
    }
}

// Autenticación de usuario
function login(username, password) {
    const users = getItems('users');
    const user = users.find(u => u.usuario === username && u.contrasena === password);
    
    if (user) {
        localStorage.setItem('currentUser', JSON.stringify(user));
        return true;
    }
    return false;
}

function logout() {
    localStorage.removeItem('currentUser');
    window.location.href = 'index.html';
}

function getCurrentUser() {
    return JSON.parse(localStorage.getItem('currentUser'));
}

// manejo de formulario de login
function initializeLoginForm() {
    const loginForm = document.querySelector('#login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', function (e) {
            e.preventDefault();
            const username = this.querySelector('#username').value;
            const password = this.querySelector('#password').value;

            if (login(username, password)) {
                const currentUser = getCurrentUser();
                window.location.href = currentUser.tipo === 'Administrador' ? 'admin.html' : 'admin-user.html';
            } else {
                alert('Usuario o contraseña incorrectos');
            }
        });
    }
}

// manejo de panel de administración
function initializeAdminPanel() {
    const createUserForm = document.querySelector('#create-user-form');
    const createCategoryForm = document.querySelector('#create-category-form');

    if (createUserForm) handleFormSubmit(createUserForm, 'users');
    if (createCategoryForm) handleFormSubmit(createCategoryForm, 'categories');

    initializeTabs();
}

function initializeTabs() {
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');
    tabButtons.forEach(button => {
        button.addEventListener('click', function () {
            const tabName = this.getAttribute('data-tab');
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));

            this.classList.add('active');
            document.getElementById(tabName).classList.add('active');
        });
    });
}

function initializeProductCreationForm() {
    const createProductForm = document.querySelector('#create-product-form');
    if (createProductForm) {
        populateCategorySelect(createProductForm);

        createProductForm.addEventListener('submit', function (e) {
            e.preventDefault();
            handleProductCreation(this);
        });
    }
}

function populateCategorySelect(form) {
    const categorySelect = form.querySelector('#categoria');
    const categories = getItems('categories');
    categorySelect.innerHTML = categories.map(category =>
        `<option value="${category.nombre}">${category.nombre}</option>`
    ).join('');
}

function handleProductCreation(form) {
    const newProduct = {
        nombre: form.querySelector('#nombre').value,
        description: form.querySelector('#descripcion').value,
        category: form.querySelector('#categoria').value,
        price: parseFloat(form.querySelector('#precio').value),
    };

    const imageInput = form.querySelector('#imagen');
    if (imageInput.files && imageInput.files[0]) {
        const reader = new FileReader();
        reader.onload = function (e) {
            newProduct.image = e.target.result;
            createItem('products', newProduct);
            alert('Producto/Servicio creado correctamente!');
            form.reset();
            // Actualizar la lista de productos después de crear uno nuevo
            const productList = document.getElementById('product-list');
            if (productList) {
                renderList(productList, 'products', 'product');
            }
        };
        reader.readAsDataURL(imageInput.files[0]);
    } else {
        alert('Por favor, selecciona una imagen para el producto.');
    }
}

// creación de usuarios o categorias
function handleFormSubmit(form, key) {
    form.addEventListener('submit', function (e) {
        e.preventDefault();
        const formData = new FormData(form);
        const item = Object.fromEntries(formData);

        if (!validateFormData(key, item)) return;

        createItem(key, item);
        alert(`${key.slice(0, -1).toUpperCase()} creado correctamente!`);
        form.reset();

        if (key === 'users') {
            const userList = document.querySelector('#user-list');
            if (userList) {
                renderList(userList, 'users', 'user');
            }
        }
    });
}

function validateFormData(key, item) {
    if (key === 'users') {
        if (!item.nombre || !item.usuario || !item.contrasena || !item.tipo) {
            alert('Faltan datos del usuario. Por favor, completa todos los campos.');
            return false;
        }
    } else if (key === 'categories') {
        if (!item['nombre-categoria'] || !item['tipo-categoria']) {
            alert('Faltan datos de la categoría. Por favor, completa todos los campos.');
            return false;
        }
    }
    return true;
}

// Mostrar lista
function renderList(listElement, key, type) {
    if (!listElement) {
        console.error(`Elemento de lista no encontrado: ${key}-list`);
        return;
    }

    const items = getItems(key);
    listElement.innerHTML = items.map(item => createListItem(item, type)).join('');
    addEditAndDeleteListeners(listElement, key);
}   


function createListItem(item, type) {
    return `
        <li>
            <span>${item.nombre || item.name || 'Sin nombre'}</span>
            <div class="item-actions">
                <button class="delete-button" data-id="${item.id}" data-type="${type}">Eliminar</button>
            </div>
        </li>
    `;
}

function addEditAndDeleteListeners(listElement, key) {
    listElement.querySelectorAll('.edit-button').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = parseInt(e.target.dataset.id);
            editItem(key, id);
        });
    });

    listElement.querySelectorAll('.delete-button').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = parseInt(e.target.dataset.id);
            deleteItem(key, id);
            renderList(listElement, key, key.slice(0, -1));
        });
    });
}

// Inicializar páginas
document.addEventListener('DOMContentLoaded', function () {
    initializeLocalStorage();
    const currentPage = document.body.id;

    if (currentPage === 'login') {
        initializeLoginForm();
    }

    if (['admin', 'admin-user', 'list'].includes(currentPage)) {
        checkLoginState();
    }

    switch (currentPage) {
        case 'home':
            initializeHomePage();
            break;
        case 'admin':
            initializeAdminPanel();
            break;
        case 'admin-user':
            initializeProductCreationForm();
            break;
        case 'list':
            initializeListView();
   const addProductBtn = document.querySelector('#add_product_btn');
                console.log('addProductBtn', addProductBtn)
                if(addProductBtn){
                    addProductBtn.addEventListener('click', function () {
                        window.location.href = 'admin-user.html';
                    });
                }


       
     
            break;
    }

    const logoutButton = document.querySelector('.logout-button');
    if (logoutButton) {
        logoutButton.addEventListener('click', logout);
    }
});

function initializeHomePage() {
    const productContainer = document.querySelector('.product-container');
    const products = getItems('products');
    productContainer.innerHTML = products.map(createProductElement).join('');
}

function createProductElement(product) {
    return `
        <div class="product-card">
            <div class="product-image">
                <img src="${product.image || '/api/placeholder/300/200'}" alt="${product.nombre}" style="width: 100%; height: 200px; object-fit: cover;">
            </div>
            <div class="product-info">
                <h2>${product.nombre}</h2>
                <p>${product.description}</p>
                <p class="price">$${product.price.toFixed(2)}</p>
                <div class="view-details">
                    <button class="view-button" aria-label="Ver detalles">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="eye-icon">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                            <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    `;
}


function checkLoginState() {
    const currentUser = getCurrentUser();
    const userInfoElement = document.querySelector('.user-info');
    const addUserBtn = document.querySelector('.add-user-btn');
    const addProductBtn = document.querySelector('#add_product_btn');


    if (currentUser) {
        document.body.classList.add('logged-in');
        
        if (userInfoElement) {
            userInfoElement.textContent = `Bienvenido, ${currentUser.usuario}`;
        }

        if (addUserBtn && addProductBtn) {

            
            addProductBtn.addEventListener('click', function () {
                window.location.href = 'admin-user.html';
            });

            addUserBtn.style.display = currentUser.tipo === 'Administrador' ? 'block' : 'none';
            addProductBtn.style.display = 'block';

        }
    } else {
        document.body.classList.remove('logged-in');
        if (userInfoElement) {
            userInfoElement.textContent = '';
        }
        if (!window.location.pathname.endsWith('login.html')) {
            window.location.href = 'login.html';
        }
    }
}

function initializeLocalStorage() {
    if (!localStorage.getItem('users')) {
        localStorage.setItem('users', JSON.stringify([{ id: 1, nombre: 'Admin', usuario: 'admin', contrasena: 'admin123', tipo: 'Administrador' }]));
    }
    if (!localStorage.getItem('categories')) {
        localStorage.setItem('categories', JSON.stringify([{ id: 1, nombre: 'Electronica', tipo: 'Producto' }, { id: 2, nombre: 'Limpieza', tipo: 'Servicio' }]));
    }
    // if (!localStorage.getItem('products')) {
    //     localStorage.setItem('products', JSON.stringify([{ id: 1, name: 'Laptop', description: 'Powerful laptop', category: 'Electronics', price: 999.99 }]));
    // }
}

function initializeListView() {
    const currentUser = getCurrentUser();
    const userList = document.getElementById('user-list');
    const productList = document.getElementById('product-list');
    
    if (!currentUser) {
        alert("Usuario no autenticado. Redirigiendo al inicio de sesión.");
        window.location.href = 'login.html';
        return;
    }

    if (currentUser.tipo === 'Administrador' && userList) {
        renderList(userList, 'users', 'user');
    }

    if (productList) {
        const products = currentUser.tipo === 'Publicador' 
            ? getItems('products').filter(p => p.createdBy === currentUser.usuario) 
            : getItems('products');
        renderList(productList, 'products', 'product');
    }
}

function editItem(key, id) {
    const items = getItems(key);
    const item = items.find(i => i.id === id);
    
    if (!item) {
        alert('Elemento no encontrado');
        return;
    }

    // Abrir el modal de edición
    const modal = document.getElementById(`${key}-modal`);
    if (modal) {
        openModal(modal);
        const form = modal.querySelector('form');
        if (form) {
            Object.keys(item).forEach(field => {
                const input = form.querySelector(`[name=${field}]`);
                if (input) {
                    input.value = item[field];
                }
            });

            form.addEventListener('submit', function (e) {
                e.preventDefault();
                const formData = new FormData(form);
                const updatedItem = Object.fromEntries(formData);
                updatedItem.id = item.id;

                updateItem(key, updatedItem);
                alert('Elemento actualizado correctamente!');
                form.reset();
                closeModal(modal);
                const listElement = document.querySelector(`#${key}-list`);
                if (listElement) {
                    renderList(listElement, key, key.slice(0, -1));
                }
            }, { once: true });
        } else {
            console.error(`Formulario no encontrado en el modal de ${key}`);
        }
    } else {
        console.error(`Modal para ${key} no encontrado`);
    }
}


