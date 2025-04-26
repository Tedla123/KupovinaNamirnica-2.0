let workbook;
let categories = {};
let translations = {};
let selectedItems = {};
let currentLanguage = "HR";

// Automatski učitaj Excel kad se stranica učita
window.onload = async function () {
    await loadExcelData();
    setupTabs();
    setupLanguageButtons();
};

// Učitavanje Excela
async function loadExcelData() {
    const response = await fetch('namirnice_po_drzavama.xlsx');
    const arrayBuffer = await response.arrayBuffer();
    workbook = XLSX.read(arrayBuffer, { type: "array" });

    populateCountryDropdown();
    loadTranslations();
}

// Napuni dropdown s državama
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

    // Odmah učitaj prvu državu
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

    renderCategories();
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
            btn.onclick = () => {
                selectedItems[item] = (selectedItems[item] || 0) + 1;
            };
            itemDiv.appendChild(btn);
        });

        catDiv.appendChild(itemDiv);
        container.appendChild(catDiv);
    }
}

// Gumb za promjenu jezika
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

// Tabs prebacivanje
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

// Spremanje popisa
function saveShoppingList() {
    localStorage.setItem("selectedShoppingList", JSON.stringify(selectedItems));
    alert("Popis spremljen!");
}

// Izvoz popisa
function exportShoppingList() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(selectedItems));
    const dlAnchor = document.createElement("a");
    dlAnchor.setAttribute("href", dataStr);
    const date = new Date().toLocaleDateString("hr-HR").replaceAll("/", "-");
    dlAnchor.setAttribute("download", `Popis-${date}.json`);
    dlAnchor.click();
}

// Uvoz popisa
function importShoppingList(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            Object.assign(selectedItems, data);
            alert("Popis je uvezen!");
        } catch {
            alert("Neispravna datoteka!");
        }
    };
    reader.readAsText(file);
}

// Pokretanje kupovine
function startShopping() {
    const container = document.getElementById("shoppingItems");
    container.innerHTML = "";
    const saved = JSON.parse(localStorage.getItem("selectedShoppingList")) || {};
    Object.assign(selectedItems, saved);

    for (let item in selectedItems) {
        const btn = document.createElement("button");
        btn.textContent = `${item} - ${selectedItems[item]}`;
        btn.className = "shopping-item";
        container.appendChild(btn);
    }
}
