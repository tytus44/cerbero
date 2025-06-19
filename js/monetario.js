/* ===== GESTIONE LOCALSTORAGE ===== */
const Storage = {
    KEYS: {
        PRICING_DATA: 'cerbero_pricing',
        COMPETITOR_DATA: 'cerbero_competitors',
        FUEL_ORDER_DATA: 'cerbero_fuel_orders'
    },

    save: function(key, data) {
        try {
            const dataString = JSON.stringify(data);
            localStorage.setItem(key, dataString);
            return true;
        } catch (error) {
            console.error('Errore nel salvare i dati:', error);
            return false;
        }
    },

    load: function(key, defaultValue = null) {
        try {
            const dataString = localStorage.getItem(key);
            return dataString ? JSON.parse(dataString) : defaultValue;
        } catch (error) {
            console.error('Errore nel caricare i dati per', key, ':', error);
            return defaultValue;
        }
    }
};

// Funzioni helper per la formattazione dei numeri
const formatter = {
    // Per importi e prezzi in euro (virgola come decimale, punto come migliaia)
    currencyAndPrices: new Intl.NumberFormat('it-IT', { 
        minimumFractionDigits: 2,
        maximumFractionDigits: 3,
        useGrouping: true 
    }),
    // Per prezzi carburanti (formato semplice con virgola: 1,667)
    fuelPrices: new Intl.NumberFormat('it-IT', { 
        minimumFractionDigits: 3,
        maximumFractionDigits: 3,
        useGrouping: false // Nessun separatore migliaia
    }),
    // Per le differenze competitive (virgola come decimale, segno)
    diff: new Intl.NumberFormat('it-IT', { 
        minimumFractionDigits: 3,
        maximumFractionDigits: 3,
        signDisplay: 'auto', 
        useGrouping: false
    }),
    // Per le quantità in litri (solo numeri interi con separatore migliaia)
    liters: (value) => {
        if (typeof value !== 'number' || isNaN(value)) {
            return '';
        }
        // Formatta solo numeri interi con separatore migliaia (punto)
        return new Intl.NumberFormat('it-IT', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
            useGrouping: true
        }).format(Math.round(value));
    }
};

// Funzione helper per parsare l'input, gestendo le diverse convenzioni
function parseNumberInput(value, isLiter = false) {
    let cleanedValue = value.replace(/€/g, '').trim();

    if (isLiter) {
        // Per i litri: solo numeri interi, rimuovi tutto tranne i numeri
        cleanedValue = cleanedValue.replace(/[^0-9]/g, '');
    } else {
        // Per valuta: punto separatore migliaia, virgola decimale
        cleanedValue = cleanedValue.replace(/\./g, '').replace(/,/g, '.');
    }
    return parseFloat(cleanedValue) || 0;
}

/* ===== UTILITY PER TOAST MESSAGES ===== */
function showMessage(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast-message toast-${type}`;
    toast.textContent = message;
    
    const colors = {
        success: '#28a745',
        error: '#dc3545',
        info: '#17a2b8',
        warning: '#ffc107'
    };
    
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${colors[type] || colors.info};
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        z-index: 1001;
        font-family: 'Montserrat', sans-serif;
        font-weight: 600;
        font-size: 14px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }, 3000);
}

/* ===== GESTIONE PREZZI ===== */
class PricingManager {
    constructor() {
        this.pricingData = Storage.load(Storage.KEYS.PRICING_DATA, {});
        this.competitorData = Storage.load(Storage.KEYS.COMPETITOR_DATA, {});
        this.fuelOrderData = Storage.load(Storage.KEYS.FUEL_ORDER_DATA, {});
        this.init();
    }

    init() {
        this.bindPricingEvents();
        this.bindCompetitorEvents();
        this.bindFuelOrderEvents();
        this.loadSavedData();
    }

    bindPricingEvents() {
        document.querySelectorAll('input[data-type="consigliati"]').forEach(inputField => {
            inputField.addEventListener('input', (e) => {
                let value = e.target.value.replace(/[^0-9,.]/g, ''); 
                const parts = value.split(',');
                if (parts.length > 2) {
                    value = parts[0] + ',' + parts.slice(1).join('');
                }
                e.target.value = value;
            });
            inputField.addEventListener('blur', (e) => {
                this.calculatePrices(e.target);
                this.savePricingData();
            });
        });
    }

    calculatePrices(input) {
        const product = input.dataset.product;
        const basePrice = parseNumberInput(input.value);
        
        if (basePrice >= 0) {
            const iperselfPrice = basePrice + 0.005;
            const servitoPrice = basePrice + 0.220;
            
            const iperselfInput = document.querySelector(`input[data-product="${product}"][data-type="iperself"]`);
            const servitoInput = document.querySelector(`input[data-product="${product}"][data-type="servito"]`);
            
            if (iperselfInput) {
                iperselfInput.value = `€ ${formatter.currencyAndPrices.format(iperselfPrice)}`;
            }
            if (servitoInput) {
                servitoInput.value = `€ ${formatter.currencyAndPrices.format(servitoPrice)}`;
            }
            
            this.pricingData[product] = {
                consigliati: basePrice,
                iperself: iperselfPrice,
                servito: servitoPrice
            };
            
            // Ricalcola le differenze per questo prodotto dato che è cambiato il prezzo Iperself
            this.recalculateAllDifferencesForProduct(product);
        }
    }

    bindCompetitorEvents() {
        document.querySelectorAll('input[data-competitor]').forEach(inputField => {
            inputField.addEventListener('input', (e) => {
                let value = e.target.value.replace(/[^0-9,.]/g, ''); 
                const parts = value.split(',');
                if (parts.length > 2) {
                    value = parts[0] + ',' + parts.slice(1).join('');
                }
                e.target.value = value;
            });
            inputField.addEventListener('blur', (e) => {
                this.calculateCompetitorDifference(e.target);
                this.saveCompetitorData();
            });
        });
    }

    calculateCompetitorDifference(input) {
        const product = input.dataset.product;
        const competitor = input.dataset.competitor;
        const competitorPrice = parseNumberInput(input.value.replace('€', ''));
        
        // Ottieni il nostro prezzo Iperself per il confronto
        const ourIperselfPrice = this.pricingData[product]?.iperself || 0;
        
        if (competitorPrice > 0 && ourIperselfPrice > 0) {
            // Differenza = Nostro prezzo Iperself - Prezzo competitor
            const difference = ourIperselfPrice - competitorPrice;
            const diffInput = document.querySelector(`input[data-product="${product}"][data-diff="${competitor}"]`);
            
            if (diffInput) {
                diffInput.value = formatter.diff.format(difference);
                
                // Colore in base alla differenza:
                // Rosso se siamo più cari (differenza positiva)
                // Verde se siamo più economici (differenza negativa)
                if (difference > 0) {
                    diffInput.style.background = 'rgba(220, 53, 69, 0.1)'; // Rosso - siamo più cari
                    diffInput.style.color = '#dc3545';
                } else if (difference < 0) {
                    diffInput.style.background = 'rgba(40, 167, 69, 0.1)'; // Verde - siamo più economici
                    diffInput.style.color = '#28a745';
                } else {
                    diffInput.style.background = 'rgba(0, 86, 179, 0.05)'; // Neutro - stesso prezzo
                    diffInput.style.color = '#64748b';
                }
            }
        } else {
            // Se non ci sono prezzi validi, pulisci il campo differenza
            const diffInput = document.querySelector(`input[data-product="${product}"][data-diff="${competitor}"]`);
            if (diffInput) {
                diffInput.value = '';
                diffInput.style.background = 'rgba(0, 86, 179, 0.05)';
                diffInput.style.color = '#64748b';
            }
        }
        
        // Salva i dati del competitor
        if (!this.competitorData[product]) {
            this.competitorData[product] = {};
        }
        this.competitorData[product][competitor] = competitorPrice;
        
        // Ricalcola tutte le differenze per questo prodotto quando cambiano i prezzi
        this.recalculateAllDifferencesForProduct(product);
    }

    // Nuova funzione per ricalcolare tutte le differenze quando cambiano i prezzi Enilive
    recalculateAllDifferencesForProduct(product) {
        const ourIperselfPrice = this.pricingData[product]?.iperself || 0;
        
        if (ourIperselfPrice > 0 && this.competitorData[product]) {
            ['myoil', 'esso', 'q8'].forEach(competitor => {
                const competitorPrice = this.competitorData[product][competitor];
                if (competitorPrice > 0) {
                    const difference = ourIperselfPrice - competitorPrice;
                    const diffInput = document.querySelector(`input[data-product="${product}"][data-diff="${competitor}"]`);
                    
                    if (diffInput) {
                        diffInput.value = formatter.diff.format(difference);
                        
                        if (difference > 0) {
                            diffInput.style.background = 'rgba(220, 53, 69, 0.1)';
                            diffInput.style.color = '#dc3545';
                        } else if (difference < 0) {
                            diffInput.style.background = 'rgba(40, 167, 69, 0.1)';
                            diffInput.style.color = '#28a745';
                        } else {
                            diffInput.style.background = 'rgba(0, 86, 179, 0.05)';
                            diffInput.style.color = '#64748b';
                        }
                    }
                }
            });
        }
    }

    bindFuelOrderEvents() {
        document.querySelectorAll('input[data-fuel][data-field="quantity"]').forEach(inputField => {
            inputField.addEventListener('input', (e) => {
                // Per i litri: solo numeri interi, rimuovi tutto il resto
                let value = e.target.value.replace(/[^0-9]/g, '');
                e.target.value = value;
            });

            inputField.addEventListener('blur', (e) => {
                this.calculateFuelOrder(e.target);
                this.saveFuelOrderData();
            });
        });
    }

    calculateFuelOrder(input) {
        const fuel = input.dataset.fuel;
        let quantity = parseNumberInput(input.value, true); 
        
        // Arrotonda a numero intero
        quantity = Math.round(quantity);

        if (quantity >= 0) {
            const price = this.pricingData[fuel]?.consigliati || 0;
            
            if (price >= 0) {
                const advance = price * 0.8;
                const totalAmount = quantity * price;
                
                const advanceInput = document.querySelector(`input[data-fuel="${fuel}"][data-field="advance"]`);
                const amountInput = document.querySelector(`input[data-fuel="${fuel}"][data-field="amount"]`);
                
                if (advanceInput) {
                    advanceInput.value = formatter.currencyAndPrices.format(advance);
                }
                if (amountInput) {
                    amountInput.value = `€ ${formatter.currencyAndPrices.format(totalAmount)}`;
                }
                
                this.fuelOrderData[fuel] = {
                    quantity: quantity,
                    advance: advance,
                    amount: totalAmount
                };
                
                this.calculateOrderTotals();
            }
        } else {
            const advanceInput = document.querySelector(`input[data-fuel="${fuel}"][data-field="advance"]`);
            const amountInput = document.querySelector(`input[data-fuel="${fuel}"][data-field="amount"]`);
            
            if (advanceInput) advanceInput.value = '';
            if (amountInput) amountInput.value = '';
            
            if (this.fuelOrderData[fuel]) {
                delete this.fuelOrderData[fuel];
            }
            
            this.calculateOrderTotals();
        }
        
        // Formatta il campo come numero intero con separatori migliaia
        input.value = formatter.liters(quantity); 
    }

    calculateOrderTotals() {
        let totalQuantity = 0;
        let totalAmount = 0;
        
        Object.values(this.fuelOrderData).forEach(data => {
            totalQuantity += data.quantity || 0;
            totalAmount += data.amount || 0;
        });
        
        const totalQuantityEl = document.getElementById('total-quantity');
        const totalAmountEl = document.getElementById('total-amount');
        
        if (totalQuantityEl) {
            totalQuantityEl.textContent = `${formatter.liters(totalQuantity)} L`; 
        }
        if (totalAmountEl) {
            totalAmountEl.textContent = `€ ${formatter.currencyAndPrices.format(totalAmount)}`;
        }
    }

    savePricingData() {
        Storage.save(Storage.KEYS.PRICING_DATA, this.pricingData);
    }

    saveCompetitorData() {
        Storage.save(Storage.KEYS.COMPETITOR_DATA, this.competitorData);
    }

    saveFuelOrderData() {
        Storage.save(Storage.KEYS.FUEL_ORDER_DATA, this.fuelOrderData);
    }

    loadSavedData() {
        // Carica prezzi salvati
        Object.keys(this.pricingData).forEach(product => {
            const data = this.pricingData[product];
            ['consigliati', 'iperself', 'servito'].forEach(type => {
                if (data[type] !== undefined) {
                    const input = document.querySelector(`input[data-product="${product}"][data-type="${type}"]`);
                    if (input && !input.disabled) {
                        input.value = type === 'consigliati' ? 
                            formatter.fuelPrices.format(data[type]) : // Formato 1,667 per consigliati
                            `€ ${formatter.currencyAndPrices.format(data[type])}`; // Formato €1.234,56 per iperself/servito
                    }
                }
            });
        });

        // Carica dati competitor salvati e ricalcola differenze
        Object.keys(this.competitorData).forEach(product => {
            Object.keys(this.competitorData[product]).forEach(competitor => {
                const value = this.competitorData[product][competitor];
                const input = document.querySelector(`input[data-product="${product}"][data-competitor="${competitor}"]`);
                if (input && value) {
                    input.value = `€ ${formatter.fuelPrices.format(value)}`; // Formato €1,667 per competitor
                }
            });
            // Ricalcola tutte le differenze per questo prodotto
            this.recalculateAllDifferencesForProduct(product);
        });

        // Carica ordini carburanti salvati
        let loadedFuelOrderData = {}; 
        Object.keys(this.fuelOrderData).forEach(fuel => {
            const data = this.fuelOrderData[fuel];
            if (data) { 
                const quantityInput = document.querySelector(`input[data-fuel="${fuel}"][data-field="quantity"]`);
                const advanceInput = document.querySelector(`input[data-fuel="${fuel}"][data-field="advance"]`);
                const amountInput = document.querySelector(`input[data-fuel="${fuel}"][data-field="amount"]`);

                if (quantityInput && data.quantity !== undefined) {
                    // Carica come numero intero con separatori migliaia
                    quantityInput.value = formatter.liters(data.quantity); 
                    loadedFuelOrderData[fuel] = loadedFuelOrderData[fuel] || {};
                    loadedFuelOrderData[fuel].quantity = data.quantity; 
                }
                if (advanceInput && data.advance !== undefined) {
                    advanceInput.value = formatter.currencyAndPrices.format(data.advance);
                    loadedFuelOrderData[fuel] = loadedFuelOrderData[fuel] || {};
                    loadedFuelOrderData[fuel].advance = data.advance; 
                }
                if (amountInput && data.amount !== undefined) {
                    amountInput.value = `€ ${formatter.currencyAndPrices.format(data.amount)}`;
                    loadedFuelOrderData[fuel] = loadedFuelOrderData[fuel] || {};
                    loadedFuelOrderData[fuel].amount = data.amount; 
                }
            }
        });
        this.fuelOrderData = loadedFuelOrderData; 
        this.calculateOrderTotals(); 
    }
}

/* ===== CALCOLATRICE IVA ===== */
function calculateVAT(operation) {
    const amountInput = document.getElementById('vat-amount');
    const amount = parseNumberInput(amountInput.value);
    const vatRate = parseFloat(document.querySelector('input[name="aliquota"]:checked').value) / 100;
    
    if (amount <= 0) {
        showMessage('Inserire un importo valido', 'warning');
        return;
    }
    
    let imponibile, iva, totale;
    
    if (operation === 'remove') {
        // Scorporo IVA
        imponibile = amount / (1 + vatRate);
        iva = amount - imponibile;
        totale = amount;
    } else {
        // Aggiungi IVA
        imponibile = amount;
        iva = amount * vatRate;
        totale = amount + iva;
    }
    
    // Aggiorna i risultati
    document.getElementById('vat-imponibile').textContent = `€ ${formatter.currencyAndPrices.format(imponibile)}`;
    document.getElementById('vat-iva').textContent = `€ ${formatter.currencyAndPrices.format(iva)}`;
    document.getElementById('vat-totale').textContent = `€ ${formatter.currencyAndPrices.format(totale)}`;
}

/* ===== CALCOLATRICE ===== */
let calcDisplay = '0';
let calcOperation = null;
let calcPreviousValue = null;
let calcWaitingForOperand = false;

function updateCalcDisplay() {
    document.getElementById('calc-display').textContent = calcDisplay.replace('.', ',');
}

function inputCalculator(input) {
    if (typeof input === 'string' && input.match(/[0-9]/)) {
        inputNumber(input);
    } else if (input === '.') {
        inputDecimal();
    } else if (input.match(/[\+\-\*\/]/)) {
        inputOperator(input);
    }
}

function inputNumber(num) {
    if (calcWaitingForOperand) {
        calcDisplay = num;
        calcWaitingForOperand = false;
    } else {
        calcDisplay = calcDisplay === '0' ? num : calcDisplay + num;
    }
    updateCalcDisplay();
}

function inputDecimal() {
    if (calcWaitingForOperand) {
        calcDisplay = '0.';
        calcWaitingForOperand = false;
    } else if (calcDisplay.indexOf('.') === -1) {
        calcDisplay += '.';
    }
    updateCalcDisplay();
}

function inputOperator(nextOperator) {
    const inputValue = parseNumberInput(calcDisplay);

    if (calcPreviousValue === null) {
        calcPreviousValue = inputValue;
    } else if (calcOperation) {
        const currentValue = calcPreviousValue || 0;
        const newValue = performCalculation(calcOperation, currentValue, inputValue);

        calcDisplay = String(newValue);
        calcPreviousValue = newValue;
        updateCalcDisplay();
    }

    calcWaitingForOperand = true;
    calcOperation = nextOperator;
}

function calculateResult() {
    const inputValue = parseNumberInput(calcDisplay);

    if (calcPreviousValue !== null && calcOperation) {
        const newValue = performCalculation(calcOperation, calcPreviousValue, inputValue);
        calcDisplay = String(newValue);
        calcPreviousValue = null;
        calcOperation = null;
        calcWaitingForOperand = true;
        updateCalcDisplay();
    }
}

function performCalculation(operation, firstValue, secondValue) {
    switch (operation) {
        case '+': return firstValue + secondValue;
        case '-': return firstValue - secondValue;
        case '*': return firstValue * secondValue;
        case '/': return secondValue !== 0 ? firstValue / secondValue : 0;
        default: return secondValue;
    }
}

function clearCalculator() {
    calcDisplay = '0';
    calcPreviousValue = null;
    calcOperation = null;
    calcWaitingForOperand = false;
    updateCalcDisplay();
}

/* ===== FUNZIONI IMPORT/EXPORT ===== */
function importaDatiCompleti() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const importedData = JSON.parse(e.target.result);
                
                if (confirm('Importare i dati monetari? Questo sovrascriverà i dati attuali.')) {
                    if (importedData.monetario) {
                        if (importedData.monetario.pricing) {
                            pricingManager.pricingData = importedData.monetario.pricing;
                            pricingManager.savePricingData();
                        }
                        
                        if (importedData.monetario.competitors) {
                            pricingManager.competitorData = importedData.monetario.competitors;
                            pricingManager.saveCompetitorData();
                        }
                        
                        if (importedData.monetario.fuelOrders) {
                            pricingManager.fuelOrderData = importedData.monetario.fuelOrders;
                            pricingManager.saveFuelOrderData();
                        }
                        
                        pricingManager.loadSavedData();
                        
                        showMessage('Dati monetari importati con successo!', 'success');
                    } else {
                        showMessage('File non contiene dati monetari', 'warning');
                    }
                }
            } catch (error) {
                showMessage('Errore: file non valido', 'error');
                console.error('Errore import:', error);
            }
        };
        reader.readAsText(file);
    });
    
    input.click();
}

function esportaDatiCompleti() {
    try {
        const dataToExport = {
            timestamp: new Date().toISOString(),
            version: '1.0',
            monetario: {
                pricing: pricingManager ? pricingManager.pricingData : {},
                competitors: pricingManager ? pricingManager.competitorData : {},
                fuelOrders: pricingManager ? pricingManager.fuelOrderData : {}
            }
        };

        const dataStr = JSON.stringify(dataToExport, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `cerbero_monetario_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        showMessage('Dati monetari esportati con successo!', 'success');
    } catch (error) {
        showMessage('Errore durante l\'esportazione', 'error');
    }
}

function stampaDati() {
    showMessage('Funzione stampa in fase di sviluppo', 'info');
}

/* ===== FUNZIONI GLOBALI ===== */
function showInfo() {
    const infoMessage = `
GESTIONE MONETARIA - CERBERO v1.0

Funzionalità:
• Gestione prezzi Enilive con calcolo automatico Iperself/Servito
• Monitoraggio concorrenza con calcolo differenze
• Storico prezzi giornalieri
• Calcolatrice IVA (scorporo/aggiunta)
• Calcolo ordini carburanti
• Calcolatrice integrata
• Salvataggio automatico dati

Calcoli automatici:
• Iperself = Consigliato + 0.005€
• Servito = Consigliato + 0.220€
• Differenze competitive colorate
• Anticipi ordini stimati all'80%

Formati numerici:
• Prezzi: formato italiano (1.234,56€)
• Litri: formato italiano (1.234,567)

I dati vengono salvati automaticamente.
    `;
    alert(infoMessage);
}

/* ===== INIZIALIZZAZIONE ===== */
let pricingManager;

document.addEventListener('DOMContentLoaded', function() {
    try {
        pricingManager = new PricingManager();
        console.log('✅ CERBERO Monetario inizializzato correttamente');
        showMessage('Sistema Monetario caricato', 'success');
    } catch (error) {
        console.error('❌ Errore nell\'inizializzazione:', error);
        showMessage('Errore nell\'inizializzazione del sistema', 'error');
    }
});

/* ===== GESTIONE ERRORI GLOBALI ===== */
window.addEventListener('error', function(e) {
    console.error('Errore JavaScript:', e.error);
    showMessage('Si è verificato un errore. Controlla la console.', 'error');
});

/* ===== SALVATAGGIO AUTOMATICO PRIMA DI USCIRE ===== */
window.addEventListener('beforeunload', function(e) {
    if (pricingManager) {
        pricingManager.savePricingData();
        pricingManager.saveCompetitorData();
        pricingManager.saveFuelOrderData();
    }
});

/* ===== FUNZIONI ESPOSTE GLOBALMENTE ===== */
window.exportPricingData = function() {
    if (pricingManager) {
        try {
            const exportData = {
                timestamp: new Date().toISOString(),
                pricing: pricingManager.pricingData,
                competitors: pricingManager.competitorData,
                fuelOrders: pricingManager.fuelOrderData
            };

            const dataStr = JSON.stringify(exportData, null, 2);
            const dataBlob = new Blob([dataStr], {type: 'application/json'});
            const url = URL.createObjectURL(dataBlob);
            
            const link = document.createElement('a');
            link.href = url;
            link.download = `cerbero_monetario_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            
            showMessage('Dati monetari esportati con successo!', 'success');
        } catch (error) {
            showMessage('Errore durante l\'esportazione', 'error');
        }
    }
};

window.clearMonetaryData = function() {
    if (confirm('Cancellare tutti i dati monetari? Questa azione non può essere annullata.')) {
        if (pricingManager) {
            pricingManager.pricingData = {};
            pricingManager.competitorData = {};
            pricingManager.fuelOrderData = {};
            pricingManager.savePricingData();
            pricingManager.saveCompetitorData();
            pricingManager.saveFuelOrderData();
            
            document.querySelectorAll('.grid-input').forEach(input => {
                if (!input.disabled) {
                    input.value = '';
                }
            });
            
            showMessage('Tutti i dati monetari sono stati cancellati', 'info');
            location.reload();
        }
    }
};