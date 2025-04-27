let workbook;
let categories = {};
let translations = {};
let selectedItems = {};
let currentLanguage = "HR";

// Automatski učitavanje Excela
window.onload = async function () {
    await loadExcelData();
    setupTabs();
    setupLanguageButtons();
    loadSettings();
};

// Funkcija za učitavanje Excela
async function loadExcelData() {
    const response = await fetch('namirnice_po_drzavama.xlsx');
    const arrayBuffer = await response.arrayBuffer();
    workbook = XLSX.read(arrayBuffer, { type: "array" });

    populateCountryDropdown();
    loadTranslations();
}

// Popunjavanje dropdowna država
function populateCountryDropdown() {
    const select = document.getElementById('countrySelect');
    workbook.SheetNames.forEach(sheetName => {
        if (sheetName !== "Prijevodi") {
            const option = document.createElement('option');
            option.value = sheetName;
            option.textContent = sheetName;
            select.appendChild(option);
        }
    });

    select.addEventListener('change', () => {
        loadCountryData(select.value);
    });

    if (select.options.length > 0) {
        select.selectedIndex = 0;
        loadCountryData(select.value);
    }
}

// Učitavanje podataka za odabranu državu
function loadCountryData(countryName) {
    const sheet = workbook.Sheets[countryName];
    const data = XLSX.utils.sheet_to_json(sheet);
    categories = {};

    data.forEach(row => {
        const category = row['Kategorija'];
        const item = row['Namirnica'];
        if (!categories[category]) categories[category] = [];
        categories[category].push(item);
    });

    function renderCategories() {
    const container = document.getElementById("categoriesContainer");
    container.innerHTML = "";

    for (let [category, items] of Object.entries(categories)) {
        const translatedCategory = currentLanguage === "HR" ? category : (translations[category] || category);

        const catDiv = document.createElement("div");
        catDiv.className = "category";

        const catHeader = document.createElement("h3");
        catHeader.textContent = translatedCategory;
        catHeader.onclick = () => {
            document.querySelectorAll(".category").forEach(c => c.classList.remove("active"));
            catDiv.classList.add("active");
        };
        catDiv.appendChild(catHeader);

        const itemDiv = document.createElement("div");
        itemDiv.className = "items";

        items.forEach(item => {
            const translatedItem = currentLanguage === "HR" ? item : (translations[item] || item);

            const btn = document.createElement("button");
            btn.textContent = translatedItem;
            if (selectedItems[item]) {
                btn.classList.add("selected-item");
            }
            btn.onclick = () => {
                selectedItems[item] = (selectedItems[item] || 0) + 1;
                btn.classList.add("selected-item");
                renderSelectedItems();
            };
            itemDiv.appendChild(btn);
        });

        catDiv.appendChild(itemDiv);
        container.appendChild(catDiv);
    }
}


// Učitavanje prijevoda
function loadTranslations() {
    const sheet = workbook.Sheets["Prijevodi"];
    if (!sheet) return;
    const data = XLSX.utils.sheet_to_json(sheet);
    translations = {};

    data.forEach(row => {
        translations[row['Hrvatski naziv']] = row['Engleski naziv'];
    });
}

// Prikaz kategorija i namirnica
function renderCategories() {
    const container = document.getElementById("categoriesContainer");
    container.innerHTML = "";

    for (let [category, items] of Object.entries(categories)) {
        const translatedCategory = currentLanguage === "HR" ? category : (translations[category] || category);

        const catDiv = document.createElement("div");
        catDiv.className = "category";

        const catHeader = document.createElement("h3");
        catHeader.textContent = translatedCategory;
        catHeader.onclick = () => catDiv.classList.toggle("active");
        catDiv.appendChild(catHeader);

        const itemDiv = document.createElement("div");
        itemDiv.className = "items";

        items.forEach(item => {
            const translatedItem = currentLanguage === "HR" ? item : (translations[item] || item);

            const btn = document.createElement("button");
            btn.textContent = translatedItem;
            if (selectedItems[item]) {
                btn.classList.add("selected-item");
            }
            btn.onclick = () => {
                selectedItems[item] = (selectedItems[item] || 0) + 1;
                btn.classList.add("selected-item");
                renderSelectedItems();
            };
            itemDiv.appendChild(btn);
        });

        catDiv.appendChild(itemDiv);
        container.appendChild(catDiv);
    }
}

// Postavke gumbića za jezik
function setupLanguageButtons() {
    document.getElementById('hrButton').addEventListener('click', () => {
        currentLanguage = "HR";
        renderCategories();
    });

    document.getElementById('enButton').addEventListener('click', () => {
        currentLanguage = "EN";
        renderCategories();
    });
}

// Postavljanje tabova
function setupTabs() {
    document.querySelectorAll(".tab").forEach(tab => {
        tab.addEventListener("click", function () {
            document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
            document.querySelectorAll(".content").forEach(c => c.classList.remove("active"));
            this.classList.add("active");
            document.getElementById(this.getAttribute("data-target")).classList.add("active");
        });
    });
}

// Spremljene funkcije
function saveShoppingList() {
    if (Object.keys(selectedItems).length === 0) {
        alert("Popis je prazan!");
        return;
    }

    const savedContainer = document.getElementById("savedShoppingLists");
    const today = new Date();
    const dateStr = today.toLocaleDateString("hr-HR");
    const baseTitle = `${dateStr} Popis za kupovinu`;
    let title = baseTitle;
    let counter = 1;

    while ([...savedContainer.querySelectorAll("h4")].some(h => h.textContent === title)) {
        counter++;
        title = `${baseTitle} (${counter})`;
    }

    const wrapper = document.createElement("div");
    const titleEl = document.createElement("h4");
    titleEl.textContent = title;
    titleEl.onclick = () => {
        listDiv.style.display = listDiv.style.display === "none" ? "block" : "none";
    };
    titleEl.style.cursor = "pointer";
    titleEl.style.color = "#0078d4";

    const listDiv = document.createElement("div");
    listDiv.style.display = "none";
    listDiv.style.marginTop = "10px";

    for (let item in selectedItems) {
        const p = document.createElement("p");
        p.textContent = `• ${item} x ${selectedItems[item]}`;
        listDiv.appendChild(p);
    }

    wrapper.appendChild(titleEl);
    wrapper.appendChild(listDiv);
    wrapper.style.marginBottom = "15px";
    savedContainer.appendChild(wrapper);

    selectedItems = {};
    renderSelectedItems();
}

function exportShoppingList() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(selectedItems));
    const dlAnchor = document.createElement("a");
    dlAnchor.setAttribute("href", dataStr);
    const date = new Date().toLocaleDateString("hr-HR").replaceAll("/", "-");
    dlAnchor.setAttribute("download", `Popis-${date}.json`);
    dlAnchor.click();
}

function importShoppingList(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function (e) {
        try {
            const data = JSON.parse(e.target.result);
            Object.assign(selectedItems, data);
            renderSelectedItems();
            alert("Popis je uvezen!");
        } catch {
            alert("Neispravna datoteka!");
        }
    };
    reader.readAsText(file);
}

function clearShoppingList() {
    if (confirm("Jesi li siguran/na da želiš obrisati cijeli popis?")) {
        selectedItems = {};
        renderSelectedItems();
    }
}

function startShopping() {
    const container = document.getElementById("shoppingItems");
    container.innerHTML = "";

    for (let item in selectedItems) {
        const btn = document.createElement("button");
        btn.textContent = `${item} - ${selectedItems[item]}`;
        btn.className = "shopping-item";
        container.appendChild(btn);
    }
}

function renderSelectedItems() {
    const container = document.getElementById("selectedCategoriesView");
    if (!container) return;

    container.innerHTML = "";

    for (let item in selectedItems) {
        const btn = document.createElement("button");
        btn.textContent = `${item} - ${selectedItems[item]}`;
        btn.className = "shopping-item";
        container.appendChild(btn);
    }
}

// Scroll i swipe postavke
function loadSettings() {
    const swipeEnabled = localStorage.getItem("swipeEnabled") === "true";
    const verticalScroll = localStorage.getItem("scrollY") !== "false";
    const horizontalScroll = localStorage.getItem("scrollX") !== "false";

    document.getElementById("swipeToggle").checked = swipeEnabled;
    document.getElementById("verticalScrollToggle").checked = verticalScroll;
    document.getElementById("horizontalScrollToggle").checked = horizontalScroll;

    applyScrollSettings();
}

function applyScrollSettings() {
    const body = document.body;
    body.style.overflowY = document.getElementById("verticalScrollToggle").checked ? 'scroll' : 'hidden';
    body.style.overflowX = document.getElementById("horizontalScrollToggle").checked ? 'scroll' : 'hidden';
}

// Swipe podrška
let touchStartX = 0;
let touchEndX = 0;

document.addEventListener("touchstart", (e) => {
    touchStartX = e.changedTouches[0].screenX;
}, false);

document.addEventListener("touchend", (e) => {
    touchEndX = e.changedTouches[0].screenX;
    handleSwipe();
}, false);

function handleSwipe() {
    const tabs = Array.from(document.querySelectorAll(".tab"));
    const activeTab = tabs.findIndex((tab) => tab.classList.contains("active"));

    if (touchEndX < touchStartX - 50 && activeTab < tabs.length - 1) {
        tabs[activeTab + 1].click();
    }
    if (touchEndX > touchStartX + 50 && activeTab > 0) {
        tabs[activeTab - 1].click();
    }
}
