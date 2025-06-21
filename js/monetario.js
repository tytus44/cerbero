/* ===== GESTIONE STORAGE UNIFICATO ===== */
const Storage = {
    KEYS: {
        MONETARIO_DATA: 'cerbero_monetario',
        VERSAMENTO_DATA: 'cerbero_versamento'
        // Aggiungi altre chiavi se necessario
    },
    save: function(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
            return true;
        } catch (error) { console.error('Errore salvataggio dati:', error); return false; }
    },
    load: function(key, defaultValue = null) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : defaultValue;
        } catch (error) { console.error('Errore caricamento dati:', error); return defaultValue; }
    }
};

/* ===== FUNZIONI HELPER E UTILITY ===== */
const formatter = {
    currency: new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }),
    fuelPrices: new Intl.NumberFormat('it-IT', { minimumFractionDigits: 3, maximumFractionDigits: 3 }),
    diff: new Intl.NumberFormat('it-IT', { minimumFractionDigits: 3, maximumFractionDigits: 3, signDisplay: 'auto' }),
    liters: new Intl.NumberFormat('it-IT', { maximumFractionDigits: 0 })
};

function parseNumberInput(value) {
    if (typeof value !== 'string') value = String(value);
    return parseFloat(value.replace(/€/g, '').replace(/\./g, '').replace(/,/, '.').trim()) || 0;
}

/* ===== CALCOLATRICE ===== */
let calculatorDisplay = '0';
let calculatorOperator = null;
let calculatorOperand = null;
let calculatorWaitingForOperand = false;

function updateCalculatorDisplay() {
    const display = document.getElementById('calc-display');
    if (display) {
        display.textContent = calculatorDisplay;
    }
}

function inputCalculator(value) {
    if (['+', '-', '*', '/'].includes(value)) {
        // Operatore
        if (calculatorOperand === null) {
            calculatorOperand = parseFloat(calculatorDisplay);
        } else if (calculatorOperator) {
            const result = calculate();
            calculatorDisplay = String(result);
            calculatorOperand = result;
        }
        
        calculatorWaitingForOperand = true;
        calculatorOperator = value;
    } else {
        // Numero o punto decimale
        if (calculatorWaitingForOperand) {
            calculatorDisplay = value;
            calculatorWaitingForOperand = false;
        } else {
            calculatorDisplay = calculatorDisplay === '0' ? value : calculatorDisplay + value;
        }
    }
    
    updateCalculatorDisplay();
}

function calculate() {
    const prev = calculatorOperand;
    const current = parseFloat(calculatorDisplay);
    
    if (prev === null || calculatorOperator === null) {
        return current;
    }
    
    switch (calculatorOperator) {
        case '+':
            return prev + current;
        case '-':
            return prev - current;
        case '*':
            return prev * current;
        case '/':
            return current !== 0 ? prev / current : 0;
        default:
            return current;
    }
}

function calculateResult() {
    if (calculatorOperator && calculatorOperand !== null && !calculatorWaitingForOperand) {
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
    
    if (!amountInput || !selectedRate) {
        console.error('Elementi IVA non trovati');
        return;
    }
    
    const amount = parseFloat(amountInput.value) || 0;
    const rate = parseFloat(selectedRate.value) / 100;
    
    let imponibile, iva, totale;
    
    if (operation === 'add') {
        // Aggiungi IVA
        imponibile = amount;
        iva = amount * rate;
        totale = amount + iva;
    } else {
        // Scorpora IVA
        totale = amount;
        imponibile = amount / (1 + rate);
        iva = amount - imponibile;
    }
    
    // Aggiorna i risultati
    document.getElementById('vat-imponibile').textContent = formatter.currency.format(imponibile);
    document.getElementById('vat-iva').textContent = formatter.currency.format(iva);
    document.getElementById('vat-totale').textContent = formatter.currency.format(totale);
}

/* ===== FUNZIONI IMPORT/EXPORT ===== */
function importaDatiCompleti() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = function(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                try {
                    const data = JSON.parse(e.target.result);
                    
                    // Importa i dati nel localStorage
                    if (data.monetario) {
                        Storage.save(Storage.KEYS.MONETARIO_DATA, data.monetario);
                    }
                    if (data.versamento) {
                        Storage.save(Storage.KEYS.VERSAMENTO_DATA, data.versamento);
                    }
                    
                    // Ricarica la pagina per aggiornare l'interfaccia
                    location.reload();
                    
                } catch (error) {
                    alert('Errore durante l\'importazione del file. Verificare che sia un file JSON valido.');
                    console.error('Errore importazione:', error);
                }
            };
            reader.readAsText(file);
        }
    };
    input.click();
}

function esportaDatiCompleti() {
    const data = {
        monetario: Storage.load(Storage.KEYS.MONETARIO_DATA, {}),
        versamento: Storage.load(Storage.KEYS.VERSAMENTO_DATA, {}),
        timestamp: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `cerbero_monetario_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    URL.revokeObjectURL(url);
}

function stampaDati() {
    window.print();
}

/* ===== DEFINIZIONE CLASSI MANAGER ===== */

class VersamentoManager {
    constructor() {
        this.data = Storage.load(Storage.KEYS.VERSAMENTO_DATA, {});
        this.init();
    }
    init() {
        this.bindEvents();
        this.updateUI();
    }
    bindEvents() {
        [500, 200, 100, 50, 20, 10].forEach(denom => {
            const input = document.getElementById(`banconote-${denom}`);
            if (input) input.addEventListener('input', () => this.handleInput(denom));
        });
    }
    handleInput(denomination) {
        const quantity = parseInt(document.getElementById(`banconote-${denomination}`).value) || 0;
        this.data[`banconote${denomination}`] = quantity;
        this.updateUI();
        Storage.save(Storage.KEYS.VERSAMENTO_DATA, this.data);
    }
    updateUI() {
        let total = 0;
        [500, 200, 100, 50, 20, 10].forEach(denom => {
            const quantity = this.data[`banconote${denom}`] || 0;
            const value = denom * quantity;
            total += value;
            document.getElementById(`banconote-${denom}`).value = quantity;
            document.getElementById(`valore-${denom}`).value = formatter.currency.format(value);
        });
        document.getElementById('versamento-totale').textContent = formatter.currency.format(total);
    }
}

/* ===== INIZIO PRICING MANAGER ===== */

class PricingManager {
    constructor() {
        this.data = Storage.load(Storage.KEYS.MONETARIO_DATA, {
            pricing: {},
            competitors: {},
            fuelOrders: {}
        });
        this.init();
    }
    init() {
        this.bindEvents();
        this.updateUI(); // Esegui un aggiornamento completo all'avvio
    }
    bindEvents() {
        // Un solo listener per tutti gli input gestiti da questa classe
        document.querySelectorAll('.box-content input[type="text"], .box-content input[type="number"]').forEach(input => {
            if (input.dataset.product || input.dataset.fuel) {
                input.addEventListener('blur', () => this.handleInput());
            }
        });
    }
    handleInput() {
        // 1. Legge tutti i valori dal DOM e li salva nell'oggetto this.data
        this.readAllInputs();
        // 2. Aggiorna l'intera UI basandosi sui dati appena aggiornati
        this.updateUI();
        // 3. Salva l'oggetto dati completo nel localStorage
        Storage.save(Storage.KEYS.MONETARIO_DATA, this.data);
    }
    readAllInputs() {
        const products = ['benzina', 'diesel', 'gasolio', 'hvolution'];
        const competitors = ['myoil', 'esso', 'q8'];

        products.forEach(p => {
            const input = document.querySelector(`input[data-product="${p}"][data-type="consigliati"]`);
            if (input) {
                if (!this.data.pricing[p]) this.data.pricing[p] = {};
                this.data.pricing[p].consigliati = parseNumberInput(input.value);
            }
        });
        const adblueInput = document.querySelector('input[data-product="adblue"][data-type="servito"]');
        if (adblueInput) {
            this.data.pricing.adblue = { price: parseNumberInput(adblueInput.value) };
        }

        products.forEach(p => {
            competitors.forEach(c => {
                const input = document.querySelector(`input[data-product="${p}"][data-competitor="${c}"]`);
                if (input) {
                    if (!this.data.competitors[p]) this.data.competitors[p] = {};
                    this.data.competitors[p][c] = parseNumberInput(input.value);
                }
            });
        });

        products.forEach(f => {
            const input = document.querySelector(`input[data-fuel="${f}"][data-field="quantity"]`);
            if (input) {
                if (!this.data.fuelOrders[f]) this.data.fuelOrders[f] = {};
                this.data.fuelOrders[f].quantity = parseNumberInput(input.value);
            }
        });
    }
    updateUI() {
        this.populateInputs(); // Popola prima i valori base inseriti dall'utente

        const products = ['benzina', 'diesel', 'gasolio', 'hvolution'];
        let totalOrderQuantity = 0;
        let totalOrderAmount = 0;

        products.forEach(p => {
            const pricingData = this.data.pricing[p];
            if (pricingData && pricingData.consigliati > 0) {
                pricingData.iperself = pricingData.consigliati + 0.005;
                pricingData.servito = pricingData.consigliati + 0.225;
                document.querySelector(`input[data-product="${p}"][data-type="iperself"]`).value = formatter.fuelPrices.format(pricingData.iperself);
                document.querySelector(`input[data-product="${p}"][data-type="servito"]`).value = formatter.fuelPrices.format(pricingData.servito);
            }

            ['myoil', 'esso', 'q8'].forEach(c => {
                const ourPrice = pricingData?.iperself || 0;
                const competitorPrice = this.data.competitors[p]?.[c] || 0;
                const diff = (ourPrice > 0 && competitorPrice > 0) ? ourPrice - competitorPrice : 0;
                const diffInput = document.querySelector(`input[data-product="${p}"][data-diff="${c}"]`);
                if (diffInput) {
                    diffInput.value = formatter.diff.format(diff);
                    diffInput.style.color = diff > 0.001 ? 'red' : (diff < -0.001 ? 'green' : 'orange');
                }
            });

            const orderData = this.data.fuelOrders[p];
            const servitoPrice = pricingData?.servito || 0;
            const quantity = orderData?.quantity || 0;
            
            // --- LOGICA MODIFICATA QUI ---
            const advancePrice = servitoPrice * (1 - 0.1095); // Calcolo: Prezzo Servito * (1 - 10,95%)
            
            const amount = quantity * advancePrice;

            const advanceInput = document.querySelector(`input[data-fuel="${p}"][data-field="advance"]`);
            const amountInput = document.querySelector(`input[data-fuel="${p}"][data-field="amount"]`);
            
            if (advanceInput) {
                advanceInput.value = (quantity > 0 && advancePrice > 0) ? formatter.fuelPrices.format(advancePrice) : "";
            }
            if (amountInput) {
                amountInput.value = (amount > 0) ? formatter.currency.format(amount) : "";
            }
            
            totalOrderQuantity += quantity;
            totalOrderAmount += amount;
        });

        const totalQuantityEl = document.getElementById('total-quantity');
        const totalAmountEl = document.getElementById('total-amount');
        
        if (totalQuantityEl) {
            totalQuantityEl.textContent = `${formatter.liters.format(totalOrderQuantity)} L`;
        }
        if (totalAmountEl) {
            totalAmountEl.textContent = formatter.currency.format(totalOrderAmount);
        }
    }
    populateInputs() {
        Object.keys(this.data.pricing).forEach(p => {
            const priceData = this.data.pricing[p];
            if (p === 'adblue') {
                const adblueInput = document.querySelector('input[data-product="adblue"][data-type="servito"]');
                if (adblueInput) {
                    adblueInput.value = priceData.price > 0 ? formatter.fuelPrices.format(priceData.price) : '';
                }
            } else {
                const input = document.querySelector(`input[data-product="${p}"][data-type="consigliati"]`);
                if (input) input.value = priceData.consigliati > 0 ? formatter.fuelPrices.format(priceData.consigliati) : '';
            }
        });

        Object.keys(this.data.competitors).forEach(p => {
            Object.keys(this.data.competitors[p] || {}).forEach(c => {
                const input = document.querySelector(`input[data-product="${p}"][data-competitor="${c}"]`);
                if (input) input.value = this.data.competitors[p][c] > 0 ? formatter.fuelPrices.format(this.data.competitors[p][c]) : '';
            });
        });

        Object.keys(this.data.fuelOrders).forEach(f => {
            const input = document.querySelector(`input[data-fuel="${f}"][data-field="quantity"]`);
            if (input) input.value = this.data.fuelOrders[f].quantity || '';
        });
    }
}

/* ===== INIZIALIZZAZIONE ===== */
document.addEventListener('DOMContentLoaded', () => {
    new VersamentoManager();
    new PricingManager();
    
    // Inizializza il display della calcolatrice
    updateCalculatorDisplay();
    
    console.log("Sistema Monetario inizializzato completamente.");
});