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
        // Rimuove '€', punti come separatori delle migliaia e sostituisce la virgola decimale con il punto.
        const cleaned = value.replace(/€/g, '').replace(/\./g, '').replace(/,/, '.').trim();
        const parsed = parseFloat(cleaned);
        return isNaN(parsed) ? 0 : parsed;
    } catch (error) {
        console.error('Errore parsing numero:', error);
        return 0;
    }
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
        // Modificato per mostrare '0' se il valore è 0, altrimenti il valore convertito in stringa
        input.value = newValue === 0 ? '0' : newValue.toString(); 
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
        // Modificato per mostrare '0' se il valore è 0, altrimenti il valore convertito in stringa
        input.value = quantity === 0 ? '0' : quantity.toString(); 
    }
    
    updateUI() {
        let totalValue = 0;
        let totalCount = 0;
        this.denominations.forEach(denom => {
            const quantity = this.data[`banconote${denom}`] || 0;
            totalValue += denom * quantity;
            totalCount += quantity;
            
            const qtyInput = document.querySelector(`.spinner-input-group[data-denom="${denom}"] .spinner-value`);
            if (qtyInput && document.activeElement !== qtyInput) {
                // Modificato per mostrare '0' se il valore è 0, altrimenti il valore convertito in stringa
                qtyInput.value = quantity === 0 ? '0' : quantity.toString(); 
            }
            
            const valoreInput = document.getElementById(`valore-${denom}`);
            if (valoreInput) {
                valoreInput.value = formatter.currency.format(denom * quantity);
            }
        });
        
        const totalBanconoteEl = document.getElementById('versamento-total-banconote');
        if (totalBanconoteEl) totalBanconoteEl.textContent = totalCount.toString();
        
        const totalImportoEl = document.getElementById('versamento-total-importo');
        if (totalImportoEl) totalImportoEl.textContent = formatter.currency.format(totalValue);
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
            // Seleziona correttamente il gruppo spinner con data-fuel
            const inputGroup = document.querySelector(`.spinner-input-group[data-fuel="${fuel}"]`);
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
        input.value = newValue > 0 ? formatter.liters.format(newValue) : '0'; // Mostra 0 se il valore è 0
    }

    moveToNextInput(currentInput) {
        const allInputs = Array.from(document.querySelectorAll('.grid-input:not([readonly]), .spinner-value:not([readonly])'));
        const currentIndex = allInputs.indexOf(currentInput);
        if (currentIndex > -1 && currentIndex < allInputs.length - 1) allInputs[currentIndex + 1].focus();
    }
    
    handleInput(input) {
        const { product, type, competitor, fuel, field } = input.dataset;
        const value = parseNumberInput(input.value);
        if (type === 'consigliati') { 
            this.data.pricing[product] = {...this.data.pricing[product], consigliati: value }; 
        } else if (type === 'servito' && product === 'adblue') { 
            this.data.pricing.adblue = {...this.data.pricing.adblue, price: value }; 
        } else if (competitor) { 
            this.data.competitors[product] = {...this.data.competitors[product], [competitor]: value }; 
        } else if (fuel && field === 'quantity-value') { 
            this.data.fuelOrders[fuel] = {...this.data.fuelOrders[fuel], quantity: Math.max(0, value) }; 
        }
        this.updateCalculatedFields();
        Storage.save(Storage.KEYS.MONETARIO_DATA, this.data);
    }
    
    handleBlur(input) {
        const { product, type, competitor, fuel, field } = input.dataset;
        let value;
        let formatFunction = formatter.fuelPrices; // Default formatter for prices
    
        if (type === 'consigliati') { 
            value = this.data.pricing[product]?.consigliati;
        } else if (type === 'servito' && product === 'adblue') { 
            value = this.data.pricing.adblue?.price;
        } else if (competitor) { 
            value = this.data.competitors[product]?.[competitor];
        } else if (fuel && field === 'quantity-value') { 
            value = this.data.fuelOrders[fuel]?.quantity; 
            formatFunction = formatter.liters; // Specific formatter for liters
        }
    
        // If value is undefined, null, or 0, format it to "€ 0,000" or "0" depending on context
        if (value === undefined || value === null || value === 0) {
            if (input.dataset.fuel && input.dataset.field === 'quantity-value') {
                input.value = '0'; // Liters can be '0'
            } else if (input.dataset.type === 'consigliati' || input.dataset.competitor) {
                input.value = formatter.fuelPrices.format(0); // Prices should be '€ 0,000'
            } else {
                input.value = ''; // Default to empty if not specific formatting applies
            }
        } else {
            input.value = formatFunction.format(value);
        }
    }
    

    updateCalculatedFields() {
        let totalOrderQuantity = 0, totalOrderAmount = 0;
        this.fuelProducts.forEach(p => {
            const pricingData = this.data.pricing[p];
            if (pricingData && pricingData.consigliati !== undefined && pricingData.consigliati !== null) { // Check for explicit value
                // Ensure iperself and servito are calculated only if consigliati has a value
                if (pricingData.consigliati > 0) {
                    pricingData.iperself = pricingData.consigliati + 0.005;
                    pricingData.servito = pricingData.consigliati + 0.225;
                } else {
                    // If consigliati is 0, set iperself and servito to 0 as well
                    pricingData.iperself = 0;
                    pricingData.servito = 0;
                }
                
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
            
            const advanceInput = document.querySelector(`input[data-fuel="${p}"][data-field="advance"]`);
            if (advanceInput) advanceInput.value = (advancePrice !== 0) ? formatter.fuelPrices.format(advancePrice) : "0,000"; 
            
            const amountInput = document.querySelector(`input[data-fuel="${p}"][data-field="amount"]`);
            if (amountInput) amountInput.value = (amount !== 0) ? formatter.currency.format(amount) : "€ 0,00"; 
        });
        
        const totalQtyEl = document.getElementById('total-quantity');
        if (totalQtyEl) totalQtyEl.textContent = `${formatter.liters.format(totalOrderQuantity)} L`;
        
        const totalAmountEl = document.getElementById('total-amount');
        if (totalAmountEl) totalAmountEl.textContent = formatter.currency.format(totalOrderAmount);
    }
    
    populateInputs() {
        // Populate Pricing Grid (Prezzi Applicati Enilive)
        // Ensure values are properly retrieved and formatted from stored data
        ['benzina', 'diesel', 'gasolio', 'hvolution'].forEach(p => {
            const pricingData = this.data.pricing[p] || {};
            const consigliatiInput = document.querySelector(`input[data-product="${p}"][data-type="consigliati"]`);
            if (consigliatiInput) {
                // If value is 0, display '€ 0,000', otherwise format the value or empty string
                consigliatiInput.value = (pricingData.consigliati !== undefined && pricingData.consigliati !== null) ? formatter.fuelPrices.format(pricingData.consigliati) : '';
            }
        });

        // Populate Competitor Monitoring
        // Ensure values are properly retrieved and formatted from stored data
        ['benzina', 'gasolio'].forEach(p => {
            const competitorData = this.data.competitors[p] || {};
            ['myoil', 'esso', 'q8'].forEach(c => {
                const competitorInput = document.querySelector(`input[data-product="${p}"][data-competitor="${c}"]`);
                if (competitorInput) {
                    // If value is 0, display '€ 0,000', otherwise format the value or empty string
                    competitorInput.value = (competitorData[c] !== undefined && competitorData[c] !== null) ? formatter.fuelPrices.format(competitorData[c]) : '';
                }
            });
        });

        // Populate Fuel Order Quantities
        this.fuelProducts.forEach(fuel => {
            const orderData = this.data.fuelOrders[fuel] || {};
            const quantityInput = document.querySelector(`input[data-fuel="${fuel}"][data-field="quantity-value"]`);
            if (quantityInput) {
                quantityInput.value = (orderData.quantity !== undefined && orderData.quantity !== null && orderData.quantity > 0) ? formatter.liters.format(orderData.quantity) : '0'; // Mostra '0' invece di stringa vuota
            }
        });
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
        new VersamentoManager();
        window.pricingManager = new PricingManager();
        
        // RIMOSSI event listener per salvare e cancellare ordini
        
    } catch (error) {
        console.error("Errore durante l'inizializzazione:", error);
        showMessage("Errore critico nell'avvio dell'applicazione.", 'error');
    }
});