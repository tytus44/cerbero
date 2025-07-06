/* ===== CERBERO MONETARIO - VERSIONE OTTIMIZZATA E COMPLETA ===== */

/* ===== GESTIONE TEMA ===== */
function applyTheme(theme) {
    try {
        const lightIcon = document.getElementById('theme-icon-light');
        const darkIcon = document.getElementById('theme-icon-dark');
        document.body.classList.toggle('dark-theme', theme === 'dark');
        if (lightIcon && darkIcon) {
            lightIcon.classList.toggle('theme-icon-hidden', theme === 'dark');
            darkIcon.classList.toggle('theme-icon-hidden', theme !== 'dark');
        }
        Storage.save(Storage.KEYS.THEME, theme);
    } catch (error) {
        console.error('Errore applicazione tema:', error);
    }
}

function initializeThemeSwitcher() {
    try {
        const themeSwitcher = document.getElementById('theme-switcher');
        if (themeSwitcher) {
            themeSwitcher.addEventListener('click', (e) => {
                e.preventDefault();
                const newTheme = document.body.classList.contains('dark-theme') ? 'light' : 'dark';
                applyTheme(newTheme);
            });
        }
        const savedTheme = Storage.load(Storage.KEYS.THEME, 'light');
        applyTheme(savedTheme);
    } catch (error) {
        console.error('Errore inizializzazione theme switcher:', error);
    }
}

/* ===== GESTIONE MODALE INFO ===== */
function initializeInfoModal() {
    try {
        const infoBtn = document.getElementById('info-btn');
        const infoModal = document.getElementById('info-modal');

        if (infoBtn && infoModal) {
            // Seleziona il bottone di chiusura del modale per Monetario, che ora ha un'icona FA
            const closeBtn = infoModal.querySelector('.modal-close-btn');
            
            infoBtn.addEventListener('click', (e) => {
                e.preventDefault();
                infoModal.classList.add('active');
            });

            if(closeBtn) {
                closeBtn.addEventListener('click', () => {
                    infoModal.classList.remove('active');
                });
            }

            infoModal.addEventListener('click', (e) => {
                if(e.target === infoModal) {
                    infoModal.classList.remove('active');
                }
            });
        }
    } catch (error) {
        console.error('Errore inizializzazione modale info:', error);
    }
}

/* ===== UTILITY PER MESSAGGI E MODALI ===== */
function showMessage(message, type = 'info') {
    try {
        const toast = document.createElement('div');
        toast.className = `toast-message toast-${type}`;
        toast.textContent = message;
        
        const colors = {
            error: '#FF3547', info: '#0ABAB5', warning: '#FFD700', success: '#00C851'
        };
        
        toast.style.cssText = `position: fixed; top: 20px; right: 20px; background: ${colors[type] || colors.info}; color: ${type === 'warning' ? '#333' : 'white'}; padding: 15px 20px; z-index: 1001; border-radius: 20px; font-family: 'Montserrat', sans-serif; font-weight: 600; font-size: 14px; box-shadow: 0 4px 20px rgba(0,0,0,0.2); max-width: 350px; word-wrap: break-word; animation: slideIn 0.3s ease-out;`;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease forwards';
            setTimeout(() => { if (toast.parentNode) toast.parentNode.removeChild(toast); }, 300);
        }, 3000);
    } catch (error) {
        console.error('Errore visualizzazione messaggio:', error);
        alert(message);
    }
}

function showConfirmModal(title, text, onConfirm) {
    try {
        const modal = document.getElementById('confirm-modal');
        if (!modal) {
            if(confirm(`${title}\n${text}`)) onConfirm();
            return;
        }
        
        modal.querySelector('#confirm-modal-title').textContent = title;
        modal.querySelector('#confirm-modal-text').textContent = text;
        const btnOk = modal.querySelector('#confirm-modal-ok');
        // Clona i bottoni per rimuovere listeners precedenti (soluzione robusta)
        const newBtnOk = btnOk.cloneNode(true);
        btnOk.parentNode.replaceChild(newBtnOk, btnOk);
        
        const hideModal = () => modal.classList.remove('active');

        newBtnOk.addEventListener('click', () => { onConfirm(); hideModal(); }, { once: true });
        modal.querySelector('#confirm-modal-cancel').addEventListener('click', hideModal, { once: true });
        
        modal.classList.add('active');
    } catch (error) {
        console.error('Errore modal:', error);
        if(confirm(`${title}\n${text}`)) onConfirm();
    }
}

const formatter = {
    currency: new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }),
    fuelPrices: new Intl.NumberFormat('it-IT', { minimumFractionDigits: 3, maximumFractionDigits: 3 }),
    diff: new Intl.NumberFormat('it-IT', { minimumFractionDigits: 3, maximumFractionDigits: 3, signDisplay: 'auto' }),
    liters: new Intl.NumberFormat('it-IT', { minimumFractionDigits: 0, maximumFractionDigits: 3 })
};

function parseNumberInput(value) {
    try {
        if (typeof value !== 'string') value = String(value);
        const cleaned = value.replace(/€/g, '').replace(/\./g, '').replace(/,/, '.').trim();
        const parsed = parseFloat(cleaned);
        return isNaN(parsed) ? 0 : parsed;
    } catch (error) {
        console.error('Errore parsing numero:', error);
        return 0;
    }
}

/* ===== CALCOLATRICE ===== */
let calculatorDisplay = '0';
let calculatorOperator = null;
let calculatorOperand = null;
let calculatorWaitingForOperand = false;

function updateCalculatorDisplay() {
    document.getElementById('calc-display').textContent = calculatorDisplay.replace('.', ',');
}

function inputCalculator(value) {
    if (['+', '-', '*', '/'].includes(value)) { handleOperator(value); } 
    else if (value === '.') { inputDecimal(); } 
    else { inputDigit(value); }
    updateCalculatorDisplay();
}

function inputDigit(digit) {
    if (calculatorWaitingForOperand) {
        calculatorDisplay = digit;
        calculatorWaitingForOperand = false;
    } else {
        calculatorDisplay = calculatorDisplay === '0' ? digit : calculatorDisplay + digit;
    }
}

function inputDecimal() {
    if (calculatorWaitingForOperand) {
        calculatorDisplay = '0.';
        calculatorWaitingForOperand = false;
        return;
    }
    if (!calculatorDisplay.includes('.')) {
        calculatorDisplay += '.';
    }
}

function handleOperator(nextOperator) {
    const inputValue = parseFloat(calculatorDisplay);
    if (calculatorOperator && calculatorWaitingForOperand) {
        calculatorOperator = nextOperator;
        return;
    }
    if (calculatorOperand === null) {
        calculatorOperand = inputValue;
    } else if (calculatorOperator) {
        const result = calculate();
        calculatorDisplay = String(result);
        calculatorOperand = result;
    }
    calculatorWaitingForOperand = true;
    calculatorOperator = nextOperator;
}

function calculate() {
    const prev = calculatorOperand;
    const current = parseFloat(calculatorDisplay);
    if (isNaN(prev) || isNaN(current)) return 0;
    switch (calculatorOperator) {
        case '+': return prev + current;
        case '-': return prev - current;
        case '*': return prev * current;
        case '/': return current !== 0 ? prev / current : 0;
        default: return current;
    }
}

function calculateResult() {
    if (calculatorOperator && !calculatorWaitingForOperand) {
        const result = calculate();
        calculatorDisplay = String(result);
        calculatorOperand = null;
        calculatorOperator = null;
        calculatorWaitingForOperand = true;
        updateCalculatorDisplay();
    }
}

function clearCalculator() {
    calculatorDisplay = '0';
    calculatorOperator = null;
    calculatorOperand = null;
    calculatorWaitingForOperand = false;
    updateCalculatorDisplay();
}

/* ===== CALCOLO IVA ===== */
function calculateVAT(operation) {
    const amountInput = document.getElementById('vat-amount');
    const selectedRate = document.querySelector('input[name="aliquota"]:checked');
    if (!amountInput || !selectedRate) return;
    const amount = parseNumberInput(amountInput.value);
    if (amount <= 0) { showMessage('Inserire un importo valido', 'warning'); return; }
    const rate = parseFloat(selectedRate.value) / 100;
    let imponibile, iva, totale;
    if (operation === 'add') {
        imponibile = amount;
        iva = amount * rate;
        totale = amount + iva;
    } else {
        totale = amount;
        imponibile = amount / (1 + rate);
        iva = amount - imponibile;
    }
    document.getElementById('vat-imponibile').textContent = formatter.currency.format(imponibile);
    document.getElementById('vat-iva').textContent = formatter.currency.format(iva);
    document.getElementById('vat-totale').textContent = formatter.currency.format(totale);
}

/* ===== GESTIONE ORDINI ===== */
function saveOrder() {
    const totalAmount = parseNumberInput(document.getElementById('total-amount').textContent);
    if (totalAmount <= 0) { showMessage("Impossibile salvare un ordine vuoto.", 'warning'); return; }

    const products = [];
    document.querySelectorAll('.spinner-input-group[data-fuel][data-field="quantity"] .spinner-value').forEach(input => {
        const quantity = parseNumberInput(input.value);
        if (quantity > 0) {
            const productName = input.dataset.fuel.charAt(0).toUpperCase() + input.dataset.fuel.slice(1);
            products.push(`${productName}: ${formatter.liters.format(quantity)} L`);
        }
    });

    if(products.length === 0) { showMessage("Nessun prodotto con quantità valida.", 'warning'); return; }

    const newOrder = {
        id: Date.now().toString(),
        date: new Date().toLocaleString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
        amount: formatter.currency.format(totalAmount),
        products: products.join(', '),
        timestamp: Date.now()
    };
    const history = Storage.load(Storage.KEYS.ORDER_HISTORY, []);
    history.unshift(newOrder); 
    if (history.length > 20) history.splice(20);
    Storage.save(Storage.KEYS.ORDER_HISTORY, history);
    document.querySelectorAll('.spinner-input-group[data-fuel][data-field="quantity"] .spinner-value').forEach(input => { input.value = ''; });
    if (window.pricingManager) window.pricingManager.updateCalculatedFields();
    displayOrderHistory();
    showMessage("Ordine salvato!", 'success');
}

function displayOrderHistory() {
    const history = Storage.load(Storage.KEYS.ORDER_HISTORY, []);
    const container = document.getElementById('order-history-content');
    if (!container) return;
    if (history.length === 0) { container.innerHTML = '<p style="text-align:center;">Nessun ordine salvato.</p>'; return; }
    container.innerHTML = history.slice(0, 4).map((order, index) => `
        <div class="order-history-item">
            <div class="order-details">
                <div class="order-history-header">
                    <span class="order-date">${order.date}</span>
                    <span class="order-amount">${order.amount}</span>
                </div>
                <div class="order-products">${order.products}</div>
            </div>
            <button class="order-delete-btn" data-order-index="${index}" title="Elimina ordine"><i class="fa-solid fa-xmark"></i></button>
        </div>
    `).join('');
}

function deleteOrder(index) {
    showConfirmModal('Eliminare Ordine?', 'Sei sicuro di voler eliminare questo ordine?', () => {
        const history = Storage.load(Storage.KEYS.ORDER_HISTORY, []);
        if (index >= 0 && index < history.length) {
            history.splice(index, 1);
            Storage.save(Storage.KEYS.ORDER_HISTORY, history);
            displayOrderHistory();
            showMessage("Ordine eliminato.", 'info');
        }
    });
}

/* ===== VERSAMENTO MANAGER ===== */
class VersamentoManager {
    constructor() {
        this.data = Storage.load(Storage.KEYS.VERSAMENTO_DATA, {});
        this.denominations = [500, 200, 100, 50, 20, 10];
        this.init();
    }
    
    init() { this.bindEvents(); this.updateUI(); }
    
    bindEvents() {
        this.denominations.forEach(denom => {
            const inputGroup = document.querySelector(`.spinner-input-group[data-denom="${denom}"]`);
            if (!inputGroup) return;
            const input = inputGroup.querySelector('.spinner-value');
            inputGroup.querySelector('.spinner-btn.decrement').addEventListener('click', () => this.adjustValue(denom, -1));
            inputGroup.querySelector('.spinner-btn.increment').addEventListener('click', () => this.adjustValue(denom, 1));
            input.addEventListener('input', () => this.handleInput(denom));
            input.addEventListener('blur', () => this.handleBlur(denom));
            input.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); this.moveToNextField(denom); } });
        });
    }
    
    adjustValue(denomination, direction) {
        const input = document.querySelector(`.spinner-input-group[data-denom="${denomination}"] .spinner-value`);
        const step = parseInt(input.parentElement.dataset.step || '1');
        let newValue = Math.max(0, (this.data[`banconote${denomination}`] || 0) + (direction * step));
        this.data[`banconote${denomination}`] = newValue;
        this.updateUI();
        Storage.save(Storage.KEYS.VERSAMENTO_DATA, this.data);
        input.focus();
        input.value = newValue > 0 ? newValue.toString() : '';
    }

    moveToNextField(currentDenom) {
        const currentIndex = this.denominations.indexOf(currentDenom);
        const nextDenom = (currentIndex < this.denominations.length - 1) ? this.denominations[currentIndex + 1] : this.denominations[0];
        document.querySelector(`.spinner-input-group[data-denom="${nextDenom}"] .spinner-value`)?.focus();
    }
    
    handleInput(denomination) {
        const input = document.querySelector(`.spinner-input-group[data-denom="${denomination}"] .spinner-value`);
        this.data[`banconote${denomination}`] = Math.max(0, parseNumberInput(input.value));
        this.updateUI();
        Storage.save(Storage.KEYS.VERSAMENTO_DATA, this.data);
    }

    handleBlur(denomination) {
        const input = document.querySelector(`.spinner-input-group[data-denom="${denomination}"] .spinner-value`);
        const quantity = this.data[`banconote${denomination}`] || 0;
        input.value = quantity > 0 ? quantity.toString() : '';
    }
    
    updateUI() {
        let totalValue = 0;
        let totalCount = 0; // Nuovo totale per il numero di banconote
        this.denominations.forEach(denom => {
            const quantity = this.data[`banconote${denom}`] || 0;
            totalValue += denom * quantity;
            totalCount += quantity; // Aggiorna il totale del numero di banconote
            const qtyInput = document.querySelector(`.spinner-input-group[data-denom="${denom}"] .spinner-value`);
            if (qtyInput && document.activeElement !== qtyInput) qtyInput.value = quantity > 0 ? quantity.toString() : '';
            document.getElementById(`valore-${denom}`).value = formatter.currency.format(denom * quantity);
        });
        document.getElementById('versamento-total-banconote').textContent = totalCount.toString(); // Aggiorna il display del totale banconote
        document.getElementById('versamento-total-importo').textContent = formatter.currency.format(totalValue); // Aggiorna il display del totale importo
    }
}

/* ===== PRICING MANAGER ===== */
class PricingManager {
    constructor() {
        this.data = Storage.load(Storage.KEYS.MONETARIO_DATA, { pricing: {}, competitors: {}, fuelOrders: {} });
        this.fuelProducts = ['benzina', 'diesel', 'gasolio', 'hvolution'];
        this.init();
    }
    
    init() { this.bindEvents(); this.populateInputs(); this.updateCalculatedFields(); }
    
    bindEvents() {
        document.querySelectorAll('.grid-input[data-product]:not(.spinner-value), .grid-input[data-fuel]:not(.spinner-value)').forEach(input => {
            input.addEventListener('input', (e) => this.handleInput(e.target));
            input.addEventListener('blur', (e) => this.handleBlur(e.target));
            input.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); this.moveToNextInput(e.target); } });
        });
        this.fuelProducts.forEach(fuel => {
            const inputGroup = document.querySelector(`.spinner-input-group[data-fuel="${fuel}"][data-field="quantity"]`);
            if(inputGroup) {
                const input = inputGroup.querySelector('.spinner-value');
                inputGroup.querySelector('.spinner-btn.decrement').addEventListener('click', () => this.adjustFuelQuantity(fuel, -1));
                inputGroup.querySelector('.spinner-btn.increment').addEventListener('click', () => this.adjustFuelQuantity(fuel, 1));
                input.addEventListener('input', () => this.handleInput(input));
                input.addEventListener('blur', () => this.handleBlur(input));
                input.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); this.moveToNextInput(input); } });
            }
        });
    }
    
    adjustFuelQuantity(fuel, direction) {
        const input = document.querySelector(`.spinner-input-group[data-fuel="${fuel}"] .spinner-value`);
        const step = parseInt(input.parentElement.dataset.step || '1000');
        let newValue = Math.max(0, (this.data.fuelOrders[fuel]?.quantity || 0) + (direction * step));
        if (!this.data.fuelOrders[fuel]) this.data.fuelOrders[fuel] = {};
        this.data.fuelOrders[fuel].quantity = newValue;
        this.updateCalculatedFields();
        Storage.save(Storage.KEYS.MONETARIO_DATA, this.data);
        input.focus();
        input.value = newValue > 0 ? formatter.liters.format(newValue) : '';
    }

    moveToNextInput(currentInput) {
        const allInputs = Array.from(document.querySelectorAll('.grid-input:not([readonly]), .spinner-value:not([readonly])'));
        const currentIndex = allInputs.indexOf(currentInput);
        if (currentIndex > -1 && currentIndex < allInputs.length - 1) allInputs[currentIndex + 1].focus();
    }
    
    handleInput(input) {
        const { product, type, competitor, fuel, field } = input.dataset;
        const value = parseNumberInput(input.value);
        if (type === 'consigliati') { this.data.pricing[product] = {...this.data.pricing[product], consigliati: value }; } 
        else if (type === 'servito' && product === 'adblue') { this.data.pricing.adblue = {...this.data.pricing.adblue, price: value }; } 
        else if (competitor) { this.data.competitors[product] = {...this.data.competitors[product], [competitor]: value }; } 
        else if (fuel && field === 'quantity-value') { this.data.fuelOrders[fuel] = {...this.data.fuelOrders[fuel], quantity: Math.max(0, value) }; }
        this.updateCalculatedFields();
        Storage.save(Storage.KEYS.MONETARIO_DATA, this.data);
    }
    
    handleBlur(input) {
        const { product, type, competitor, fuel, field } = input.dataset;
        let value, formatFunc = formatter.fuelPrices;
        if (type === 'consigliati') value = this.data.pricing[product]?.consigliati || 0;
        else if (type === 'servito' && product === 'adblue') value = this.data.pricing.adblue?.price || 0;
        else if (competitor) value = this.data.competitors[product]?.[competitor] || 0;
        else if (fuel && field === 'quantity-value') { value = this.data.fuelOrders[fuel]?.quantity || 0; formatFunc = formatter.liters; }
        input.value = value > 0 ? formatFunc.format(value) : '';
    }

    updateCalculatedFields() {
        let totalOrderQuantity = 0, totalOrderAmount = 0;
        this.fuelProducts.forEach(p => {
            const pricingData = this.data.pricing[p];
            if (pricingData && pricingData.consigliati > 0) {
                pricingData.iperself = pricingData.consigliati + 0.005;
                pricingData.servito = pricingData.consigliati + 0.225;
                document.querySelector(`input[data-product="${p}"][data-type="iperself"]`).value = formatter.fuelPrices.format(pricingData.iperself);
                document.querySelector(`input[data-product="${p}"][data-type="servito"]`).value = formatter.fuelPrices.format(pricingData.servito);
            }
            ['myoil', 'esso', 'q8'].forEach(c => {
                const diff = (pricingData?.iperself || 0) - (this.data.competitors[p]?.[c] || 0);
                const diffInput = document.querySelector(`input[data-product="${p}"][data-diff="${c}"]`);
                if (diffInput) {
                    diffInput.value = formatter.diff.format(diff);
                    diffInput.style.color = diff > 0.001 ? 'var(--danger)' : (diff < -0.001 ? 'var(--success)' : 'var(--orange)');
                }
            });
            const orderData = this.data.fuelOrders[p] || {};
            const servitoPrice = pricingData?.servito || 0;
            const quantity = orderData.quantity || 0;
            const advancePrice = servitoPrice > 0 ? servitoPrice * (1 - 0.1095) : 0;
            const amount = quantity * advancePrice;
            totalOrderQuantity += quantity;
            totalOrderAmount += amount;
            document.querySelector(`input[data-fuel="${p}"][data-field="advance"]`).value = (quantity > 0 && advancePrice > 0) ? formatter.fuelPrices.format(advancePrice) : "";
            document.querySelector(`input[data-fuel="${p}"][data-field="amount"]`).value = (amount > 0) ? formatter.currency.format(amount) : "";
        });
        document.getElementById('total-quantity').textContent = `${formatter.liters.format(totalOrderQuantity)} L`;
        document.getElementById('total-amount').textContent = formatter.currency.format(totalOrderAmount);
    }
    
    populateInputs() {
        Object.keys(this.data.pricing).forEach(p => {
            if (p === 'adblue') {
                const input = document.querySelector('input[data-product="adblue"][data-type="servito"]');
                if (input) input.value = this.data.pricing[p].price > 0 ? formatter.fuelPrices.format(this.data.pricing[p].price) : '';
            } else {
                const input = document.querySelector(`input[data-product="${p}"][data-type="consigliati"]`);
                if(input) input.value = this.data.pricing[p].consigliati > 0 ? formatter.fuelPrices.format(this.data.pricing[p].consigliati) : '';
            }
        });
        Object.keys(this.data.competitors).forEach(p => {
            Object.keys(this.data.competitors[p] || {}).forEach(c => {
                const input = document.querySelector(`input[data-product="${p}"][data-competitor="${c}"]`);
                if(input) input.value = this.data.competitors[p][c] > 0 ? formatter.fuelPrices.format(this.data.competitors[p][c]) : '';
            });
        });
        this.fuelProducts.forEach(f => {
            const input = document.querySelector(`.spinner-value[data-fuel="${f}"]`);
            if(input) input.value = (this.data.fuelOrders[f]?.quantity || 0) > 0 ? formatter.liters.format(this.data.fuelOrders[f].quantity) : '';
        });
        this.updateCalculatedFields();
    }
}

/* ===== FUNZIONI IMPORT/EXPORT UNIFICATE ===== */
function importaDatiCompleti() {
    showConfirmModal('Importare Dati Monetario?', 'Sovrascriverà i dati correnti.', () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = (event) => {
            const file = event.target.files[0]; if (!file) return;
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    // Controllo più robusto delle chiavi per l'importazione
                    if (data.monetario) Storage.save(Storage.KEYS.MONETARIO_DATA, data.monetario);
                    if (data.versamento) Storage.save(Storage.KEYS.VERSAMENTO_DATA, data.versamento);
                    if (data.ordini) Storage.save(Storage.KEYS.ORDER_HISTORY, data.ordini);
                    showMessage('Dati importati!', 'success');
                    setTimeout(() => location.reload(), 1000);
                } catch (error) { showMessage('Errore: file corrotto.', 'error'); }
            };
            reader.readAsText(file);
        };
        input.click();
    });
}

function esportaDatiCompleti() {
    const data = {
        exportDate: new Date().toISOString(), exportType: 'monetario', version: '2.1',
        monetario: Storage.load(Storage.KEYS.MONETARIO_DATA, {}),
        versamento: Storage.load(Storage.KEYS.VERSAMENTO_DATA, {}),
        ordini: Storage.load(Storage.KEYS.ORDER_HISTORY, [])
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    a.download = `cerbero_monetario_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

/* ===== SUPPORTO TASTIERA PER CALCOLATRICE ===== */
function initializeCalculatorKeyboard() {
    document.addEventListener('keydown', (e) => {
        // Ignora gli eventi se l'utente sta digitando in un campo input o textarea
        if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA') return;

        const key = e.key;
        if (/[0-9]/.test(key)) { e.preventDefault(); inputCalculator(key); }
        else if (['+', '-', '*', '/'].includes(key)) { e.preventDefault(); inputCalculator(key); }
        else if (key === '.' || key === ',') { e.preventDefault(); inputCalculator('.'); }
        else if (key === 'Enter' || key === '=') { e.preventDefault(); calculateResult(); }
        else if (key === 'Escape' || key.toLowerCase() === 'c') { e.preventDefault(); clearCalculator(); }
        else if (key === 'Backspace') {
            e.preventDefault();
            calculatorDisplay = calculatorDisplay.length > 1 ? calculatorDisplay.slice(0, -1) : '0';
            updateCalculatorDisplay();
        }
    });
}

/* ===== GESTIONE ERRORI GLOBALI ===== */
window.addEventListener('error', function(event) {
    console.error('Errore JavaScript globale:', event.error);
    showMessage('Si è verificato un errore imprevisto', 'error');
});

window.addEventListener('unhandledrejection', function(event) {
    console.error('Promise rifiutata non gestita:', event.reason);
    showMessage('Errore nell\'operazione asincrona', 'error');
});

/* ===== INIZIALIZZAZIONE OTTIMIZZATA ===== */
document.addEventListener('DOMContentLoaded', () => {
    try {
        initializeThemeSwitcher();
        initializeInfoModal();
        new VersamentoManager(); // Inizializza il VersamentoManager
        window.pricingManager = new PricingManager();
        updateCalculatorDisplay();
        initializeCalculatorKeyboard();

        document.getElementById('save-order-btn')?.addEventListener('click', saveOrder);
        document.getElementById('order-history-content')?.addEventListener('click', (e) => {
            if (e.target.closest('.order-delete-btn')) { // Usa closest per l'icona interna
                deleteOrder(parseInt(e.target.closest('.order-delete-btn').dataset.orderIndex));
            }
        });
        document.querySelectorAll('button.action-btn[onclick^="calculateVAT"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                calculateVAT(e.target.textContent.toLowerCase().includes('scorpora') ? 'remove' : 'add');
            });
        });
        displayOrderHistory();
        // showMessage('Sistema Monetario caricato', 'success'); // Rimosso come da richiesta
        
    } catch (error) {
        console.error('Errore durante l\'inizializzazione:', error);
        showMessage('Errore critico nell\'avvio dell\'applicazione.', 'error');
    }
});