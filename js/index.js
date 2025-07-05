/* ===== INIZIO JAVASCRIPT - INDEX UNIFICATO ===== */

/* ===== INIZIO VARIABILI GLOBALI ===== */
let calendarWidget = null;
let todoWidget = null;
const VAT_RATE = 0.22; // Aliquota IVA fissa al 22% per i carburanti in Italia
const MARGIN_NON_SERVITO = 0.035;
const MARGIN_SERVITO = 0.065;
/* ===== FINE VARIABILI GLOBALI ===== */

/* ===== INIZIO UTILITY ===== */
function showMessage(message, type = 'info') {
    try {
        const allowedTypes = ['error', 'warning', 'info', 'success'];
        if (!allowedTypes.includes(type)) {
            return;
        }
        
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        
        const colors = {
            error: '#FF3547',
            info: '#0ABAB5',
            warning: '#FFD700',
            success: '#00C851'
        };
        
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${colors[type] || colors.info};
            color: ${type === 'warning' ? '#333' : 'white'};
            padding: 15px 20px;
            z-index: 1001;
            font-family: 'Montserrat', sans-serif;
            font-weight: 600;
            font-size: 14px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.2);
            border-radius: 20px;
            max-width: 350px;
            word-wrap: break-word;
            animation: slideIn 0.3s ease-out;
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
    } catch (error) {
        console.error('Errore visualizzazione messaggio:', error);
        alert(message);
    }
}

function showConfirmModal(title, text, onConfirm) {
    const modal = document.getElementById('confirm-modal');
    const modalTitle = document.getElementById('confirm-modal-title');
    const modalText = document.getElementById('confirm-modal-text');
    const btnOk = document.getElementById('confirm-modal-ok');
    const btnCancel = document.getElementById('confirm-modal-cancel');

    modalTitle.textContent = title;
    modalText.textContent = text;

    const hideModal = () => modal.classList.remove('active');

    const newBtnOk = btnOk.cloneNode(true);
    btnOk.parentNode.replaceChild(newBtnOk, btnOk);
    
    const newBtnCancel = btnCancel.cloneNode(true);
    btnCancel.parentNode.replaceChild(newBtnCancel, btnCancel);

    newBtnOk.addEventListener('click', () => {
        onConfirm();
        hideModal();
    });
    newBtnCancel.addEventListener('click', hideModal);
    
    modal.classList.add('active');
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

const formatEuro = (num) => {
    return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(num);
};

const formatLiters = (num) => {
    return new Intl.NumberFormat('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num);
};

const parseNumberInput = (value) => {
    if (typeof value !== 'string') value = String(value);
    
    let cleaned = value.replace(/[€\s\u00A0]/g, '').replace(/\./g, '').replace(',', '.');
    
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
};

function formatProductName(product) {
    const productNames = {
        'gasolio': 'Gasolio',
        'diesel': 'Diesel+',
        'adblue': 'AdBlue',
        'benzina': 'Benzina',
        'hvolution': 'HVolution'
    };
    return productNames[product] || product.charAt(0).toUpperCase() + product.slice(1);
}

/**
 * Gestione del fullscreen semplificata
 */
function initializeFullscreenButton() {
    try {
        const fullscreenBtn = document.getElementById('fullscreen-btn');
        if (fullscreenBtn) {
            fullscreenBtn.addEventListener('click', (e) => {
                e.preventDefault();
                
                if (!document.fullscreenElement) {
                    // Entra in fullscreen
                    const fullscreenPromise = document.documentElement.requestFullscreen ? 
                        document.documentElement.requestFullscreen() :
                        document.documentElement.mozRequestFullScreen ? 
                        document.documentElement.mozRequestFullScreen() :
                        document.documentElement.webkitRequestFullscreen ? 
                        document.documentElement.webkitRequestFullscreen() :
                        document.documentElement.msRequestFullscreen ? 
                        document.documentElement.msRequestFullscreen() : null;
                    
                    if (fullscreenPromise) {
                        fullscreenPromise.then(() => {
                            // Salva lo stato fullscreen solo se riesce
                            Storage.save('fullscreen_state', true);
                        }).catch(err => {
                            console.warn('Fullscreen non supportato:', err);
                            Storage.save('fullscreen_state', false);
                        });
                    }
                } else {
                    // Esce dal fullscreen
                    const exitPromise = document.exitFullscreen ? 
                        document.exitFullscreen() :
                        document.mozCancelFullScreen ? 
                        document.mozCancelFullScreen() :
                        document.webkitExitFullscreen ? 
                        document.webkitExitFullscreen() :
                        document.msExitFullscreen ? 
                        document.msExitFullscreen() : null;
                    
                    if (exitPromise) {
                        exitPromise.then(() => {
                            Storage.save('fullscreen_state', false);
                        }).catch(err => {
                            console.warn('Errore uscita fullscreen:', err);
                        });
                    }
                }
            });
        }

        // Listener per quando l'utente esce dal fullscreen con ESC
        document.addEventListener('fullscreenchange', () => {
            if (!document.fullscreenElement) {
                Storage.save('fullscreen_state', false);
            }
        });

        // Compatibilità con altri browser
        document.addEventListener('webkitfullscreenchange', () => {
            if (!document.webkitFullscreenElement) {
                Storage.save('fullscreen_state', false);
            }
        });

        document.addEventListener('mozfullscreenchange', () => {
            if (!document.mozFullScreenElement) {
                Storage.save('fullscreen_state', false);
            }
        });

    } catch (error) {
        console.error('Errore inizializzazione pulsante fullscreen:', error);
    }
}
/* ===== FINE UTILITY ===== */

/* ===== INIZIO GESTIONE TEMA ===== */
function applyTheme(theme) {
    const lightIcon = document.getElementById('theme-icon-light');
    const darkIcon = document.getElementById('theme-icon-dark');
    document.body.classList.toggle('dark-theme', theme === 'dark');
    if (lightIcon && darkIcon) {
        lightIcon.classList.toggle('theme-icon-hidden', theme === 'dark');
        darkIcon.classList.toggle('theme-icon-hidden', theme !== 'dark');
    }
    Storage.save(Storage.KEYS.THEME, theme);
}

function initializeThemeSwitcher() {
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
}
/* ===== FINE GESTIONE TEMA ===== */

/* ===== INIZIO WIDGETS ===== */
class CalendarWidget {
    constructor() { this.currentDate = new Date(); this.holidays = this.initializeHolidays(); this.init(); }
    init() { this.render(); this.bindEvents(); }
    calculateEaster(year) { const a = year % 19, b = Math.floor(year / 100), c = year % 100, d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451), month = Math.floor((h + l - 7 * m + 114) / 31), day = ((h + l - 7 * m + 114) % 31) + 1; return new Date(year, month - 1, day); }
    initializeHolidays() { const year = this.currentDate.getFullYear(); const easter = this.calculateEaster(year); const easterMonday = new Date(easter); easterMonday.setDate(easter.getDate() + 1); return [ `${year}-01-01`, `${year}-01-06`, `${year}-04-25`, `${year}-05-01`, `${year}-06-02`, `${year}-08-15`, `${year}-11-01`, `${year}-12-08`, `${year}-12-25`, `${year}-12-26`, easter.toISOString().split('T')[0], easterMonday.toISOString().split('T')[0] ]; }
    isHoliday(date) { if (date.getDay() === 0) return true; const year = date.getFullYear(), month = String(date.getMonth() + 1).padStart(2, '0'), day = String(date.getDate()).padStart(2, '0'); return this.holidays.includes(`${year}-${month}-${day}`); }
    bindEvents() { const prevBtn = document.getElementById('calendarPrev'), nextBtn = document.getElementById('calendarNext'); if (prevBtn) prevBtn.addEventListener('click', () => { this.currentDate.setMonth(this.currentDate.getMonth() - 1); this.render(); }); if (nextBtn) nextBtn.addEventListener('click', () => { this.currentDate.setMonth(this.currentDate.getMonth() + 1); this.render(); }); }
    render() { this.renderHeader(); this.renderDates(); }
    renderHeader() { const titleEl = document.getElementById('calendarTitle'); if (titleEl) { const monthNames = [ 'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre' ]; titleEl.textContent = `${monthNames[this.currentDate.getMonth()]} ${this.currentDate.getFullYear()}`; } }
    renderDates() { const container = document.getElementById('calendarDates'); if (!container) return; const year = this.currentDate.getFullYear(), month = this.currentDate.getMonth(); const today = new Date(); const firstDayOfMonth = new Date(year, month, 1); const dayOfWeek = (firstDayOfMonth.getDay() + 6) % 7; const startDate = new Date(firstDayOfMonth); startDate.setDate(firstDayOfMonth.getDate() - dayOfWeek); container.innerHTML = Array.from({ length: 42 }).map((_, i) => { const date = new Date(startDate); date.setDate(startDate.getDate() + i); const isCurrentMonth = date.getMonth() === month; const isToday = date.toDateString() === today.toDateString(); const isHoliday = this.isHoliday(date); let classes = 'day'; if (!isCurrentMonth) classes += ' other-month'; if (isToday) classes += ' current-day'; if (isHoliday && isCurrentMonth) classes += ' holiday'; return `<div class="${classes}">${date.getDate()}</div>`; }).join(''); }
}

class TodoWidget {
    constructor() { this.maxTasks = 5; this.todos = Storage.load(Storage.KEYS.TODO_LIST, []); this.init(); }
    init() { this.renderTodos(); this.bindEvents(); }
    bindEvents() { const addBtn = document.getElementById('addTodoBtn'), input = document.getElementById('newTodoInput'), todoList = document.getElementById('todo-list'); if (addBtn) addBtn.addEventListener('click', () => this.addTodo()); if (input) input.addEventListener('keypress', e => { if (e.key === 'Enter') this.addTodo(); }); if (todoList) todoList.addEventListener('click', e => { if (e.target.matches('.todo-delete, .todo-delete *')) this.deleteTodo(e.target.closest('li')); }); }
    addTodo() { const input = document.getElementById('newTodoInput'); const text = input.value.trim(); if (!text) { input.focus(); return; } if (this.todos.length >= this.maxTasks) { showMessage(`Massimo ${this.maxTasks} task consentiti`, 'warning'); return; } this.todos.push({ id: `task_${Date.now()}`, text }); Storage.save(Storage.KEYS.TODO_LIST, this.todos); this.renderTodos(); input.value = ''; input.focus(); }
    deleteTodo(todoItem) { showConfirmModal('Eliminare Task?', 'L\'azione non può essere annullata.', () => { const todoId = todoItem.getAttribute('data-todo-id'); this.todos = this.todos.filter(todo => todo.id !== todoId); Storage.save(Storage.KEYS.TODO_LIST, this.todos); this.renderTodos(); }); }
    renderTodos() { const todoList = document.getElementById('todo-list'); if (!todoList) return; todoList.innerHTML = ''; this.todos.forEach(todo => { const li = document.createElement('li'); li.setAttribute('data-todo-id', todo.id); li.innerHTML = `<label>${todo.text}</label><button class="todo-delete"></button>`; todoList.appendChild(li); }); }
}
/* ===== FINE WIDGETS ===== */

/* ===== INIZIO FUNZIONI PER RIEPILOGO VENDITE ===== */

function getSalesSummaryData() {
    const virtualstationData = Storage.load(Storage.KEYS.VIRTUALSTATION_DATA, {});
    
    const productTotals = { benzina: 0, gasolio: 0, diesel: 0, hvolution: 0, adblue: 0 };
    const modalityTotals = { servito: 0, iperself: 0, selfservice: 0 };

    for (const key in virtualstationData) {
        if (key.startsWith('turn-')) {
            const turnData = virtualstationData[key];
            if (turnData && typeof turnData === 'object') {
                for (const product in productTotals) {
                    const productInfo = turnData[product] || {};
                    
                    productTotals[product] += productInfo.totalLiters || 0;
                    modalityTotals.servito += productInfo.servito || 0;
                    modalityTotals.iperself += productInfo.iperself || 0;
                    modalityTotals.selfservice += productInfo['self-service'] || 0;
                }
            }
        }
    }
    
    return { productTotals, modalityTotals };
}

function updateSalesSummaryWidget() {
    const { productTotals, modalityTotals } = getSalesSummaryData();
    
    const productListEl = document.getElementById('product-liters-summary');
    if (productListEl) {
        productListEl.innerHTML = ''; 
        Object.entries(productTotals).forEach(([product, liters]) => {
            if (liters > 0) { 
                const li = document.createElement('li');
                li.classList.add(`product-${product}`);
                li.innerHTML = `
                    <span>${formatProductName(product)}</span>
                    <span class="value">${formatLiters(liters)} L</span>
                `;
                productListEl.appendChild(li);
            }
        });
    }

    const totalModalityLiters = modalityTotals.servito + modalityTotals.iperself + modalityTotals.selfservice;
    const servitoPerc = totalModalityLiters > 0 ? (modalityTotals.servito / totalModalityLiters) * 100 : 0;

    const percentageValueEl = document.getElementById('servito-percentage-value');
    const progressBarEl = document.getElementById('servito-progress-bar');

    if (percentageValueEl) {
        percentageValueEl.textContent = `${servitoPerc.toFixed(1)}%`;
    }
    if (progressBarEl) {
        progressBarEl.style.width = `${servitoPerc}%`;
    }
}

/* ===== FINE FUNZIONI PER RIEPILOGO VENDITE ===== */

/* ===== INIZIO FUNZIONI CENTRALI ===== */
function calculateFatturatoFromVenditeData() {
    const virtualstationData = Storage.load(Storage.KEYS.VIRTUALSTATION_DATA, {});
    if (virtualstationData.globalTotals?.general?.amount) {
        return virtualstationData.globalTotals.general.amount;
    }
    
    let totalFromAllTurns = 0;
    const turnKeys = Object.keys(virtualstationData).filter(key => key.startsWith('turn-'));
    turnKeys.forEach(turnKey => {
        totalFromAllTurns += virtualstationData[turnKey].totalTurnAmount || 0;
    });

    if (totalFromAllTurns > 0) return totalFromAllTurns;

    const venditeHistory = Storage.load(Storage.KEYS.VENDITE_HISTORY, []);
    if (venditeHistory.length > 0) {
        const lastSnapshot = venditeHistory[venditeHistory.length - 1];
        if (lastSnapshot.totalSales) return lastSnapshot.totalSales;
    }
    
    return 0;
}

function updateIncassoBox(fatturatoValue) {
    const imponibileElement = document.getElementById('corrispettivi-imponibile');
    const ivaElement = document.getElementById('corrispettivi-iva');
    if (!imponibileElement || !ivaElement) return;

    const imponibile = fatturatoValue / (1 + VAT_RATE);
    const iva = fatturatoValue - imponibile;
    
    imponibileElement.textContent = formatEuro(imponibile);
    ivaElement.textContent = formatEuro(iva);
}

function updateMarginBox() {
    const marginElement = document.getElementById('corrispettivi-margine');
    if (!marginElement) return;

    const { modalityTotals } = getSalesSummaryData();

    const nonServitoLiters = modalityTotals.iperself + modalityTotals.selfservice;
    const servitoLiters = modalityTotals.servito;

    const nonServitoMargin = nonServitoLiters * MARGIN_NON_SERVITO;
    const servitoMargin = servitoLiters * MARGIN_SERVITO;

    const totalMargin = nonServitoMargin + servitoMargin;

    marginElement.textContent = formatEuro(totalMargin);
}

function initializeIncassoBox() {
    const fatturatoInput = document.getElementById('corrispettivi-fatturato');
    if (!fatturatoInput) return;

    const savedManualFatturato = Storage.load(Storage.KEYS.CORRISPETTIVI_FATTURATO_MANUALE, null);
    let initialFatturato = 0;
    if (savedManualFatturato !== null) {
        initialFatturato = typeof savedManualFatturato === 'number' ? savedManualFatturato : parseNumberInput(savedManualFatturato);
    } else {
        initialFatturato = calculateFatturatoFromVenditeData();
    }

    fatturatoInput.value = formatEuro(initialFatturato);
    updateIncassoBox(initialFatturato);

    const handleFatturatoChange = debounce(() => {
        const manualValue = parseNumberInput(fatturatoInput.value);
        Storage.save(Storage.KEYS.CORRISPETTIVI_FATTURATO_MANUALE, manualValue);
        updateIncassoBox(manualValue);
    }, 400);

    fatturatoInput.addEventListener('input', handleFatturatoChange);

    fatturatoInput.addEventListener('focus', () => {
        const rawValue = parseNumberInput(fatturatoInput.value);
        fatturatoInput.value = rawValue === 0 ? '' : String(rawValue).replace('.', ',');
        fatturatoInput.select();
    });

    fatturatoInput.addEventListener('blur', () => {
        const finalValue = parseNumberInput(fatturatoInput.value);
        fatturatoInput.value = formatEuro(finalValue);
    });
}


/* ===== SISTEMA IMPORT/EXPORT UNIFICATO ===== */
const COMPLETE_EXPORT_MAPPING = {
    [Storage.KEYS.THEME]: 'theme',
    [Storage.KEYS.NOTES]: 'notes', 
    [Storage.KEYS.TODO_LIST]: 'todo',
    [Storage.KEYS.CURRENT_TURNO]: 'turno',
    [Storage.KEYS.CORRISPETTIVI_FATTURATO_MANUALE]: 'corrispettiviFatturatoManuale',
    [Storage.KEYS.DISPENSERS]: 'erogatori',
    [Storage.KEYS.REGISTRO_DATA]: 'registro',
    [Storage.KEYS.MONETARIO_DATA]: 'monetario',
    [Storage.KEYS.VERSAMENTO_DATA]: 'versamento',
    [Storage.KEYS.ORDER_HISTORY]: 'ordini',
    [Storage.KEYS.CREDITO_DATA]: 'credito',
    [Storage.KEYS.CARICO_TOTALS]: 'caricoTotals',
    [Storage.KEYS.CARICO_HISTORY]: 'caricoHistory',
    [Storage.KEYS.CARICO_RIMANENZE]: 'caricoRimanenze',
    [Storage.KEYS.VENDITE_HISTORY]: 'venditeHistory',
    [Storage.KEYS.HISTORY_COLLAPSED]: 'historyCollapsed',
    [Storage.KEYS.VIRTUALSTATION_DATA]: 'virtualstationData'
};

function importaDatiCompleti() {
    showConfirmModal(
        'Importare Tutti i Dati?',
        'Questo sovrascriverà TUTTI i dati di tutte le pagine. Procedere?',
        () => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.json';
            input.onchange = function(e) {
                const file = e.target.files[0];
                if (!file) return;
                
                const reader = new FileReader();
                reader.onload = function(e) {
                    try {
                        const importedData = JSON.parse(e.target.result);
                        let importedCount = 0;
                        
                        Object.entries(COMPLETE_EXPORT_MAPPING).forEach(([storageKey, exportKey]) => {
                            if (importedData.hasOwnProperty(exportKey)) {
                                Storage.save(storageKey, importedData[exportKey]);
                                importedCount++;
                            }
                        });
                        
                        if (importedCount === 0) {
                            showMessage('Nessun dato valido trovato nel file.', 'warning');
                            return;
                        }
                        
                        showMessage(`${importedCount} sezioni importate! Ricarico...`, 'info');
                        setTimeout(() => window.location.reload(), 1500);
                        
                    } catch (error) {
                        showMessage('Errore: file non valido o corrotto', 'error');
                    }
                };
                reader.readAsText(file);
            };
            input.click();
        }
    );
}

function esportaTuttiIDati() {
    showConfirmModal(
        'Esportare Tutti i Dati?',
        'Verrà creato un backup completo di TUTTE le pagine. Continuare?',
        () => {
            try {
                const dataToExport = {
                    exportDate: new Date().toISOString(),
                    exportVersion: '2.0',
                    systemName: 'CERBERO',
                    exportType: 'COMPLETE_SYSTEM_BACKUP'
                };
                
                Object.entries(COMPLETE_EXPORT_MAPPING).forEach(([storageKey, exportKey]) => {
                    const data = Storage.load(storageKey);
                    if (data !== null) dataToExport[exportKey] = data;
                });
                
                const dataStr = JSON.stringify(dataToExport, null, 2);
                const dataBlob = new Blob([dataStr], {type: 'application/json'});
                const url = URL.createObjectURL(dataBlob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `cerbero_backup_completo_${new Date().toISOString().split('T')[0]}.json`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
                
                showMessage('Backup completo esportato!', 'info');

            } catch (error) {
                showMessage('Errore durante l\'esportazione completa', 'error');
            }
        }
    );
}

function resetRegistroData() {
    Storage.remove(Storage.KEYS.REGISTRO_DATA);
}

function resetVirtualstationData() {
     const virtualstationData = Storage.load(Storage.KEYS.VIRTUALSTATION_DATA, {});
     const clearedData = { globalTotals: virtualstationData.globalTotals || {} };
     Storage.save(Storage.KEYS.VIRTUALSTATION_DATA, clearedData);
}

function esportaTuttiIDatiConfirmBypass() {
    try {
        const dataToExport = {
            exportDate: new Date().toISOString(),
            exportVersion: '2.0',
            systemName: 'CERBERO',
            exportType: 'COMPLETE_SYSTEM_BACKUP_NEW_DAY'
        };
        
        Object.entries(COMPLETE_EXPORT_MAPPING).forEach(([storageKey, exportKey]) => {
            const data = Storage.load(storageKey);
            if (data !== null) dataToExport[exportKey] = data;
        });
        
        const dataStr = JSON.stringify(dataToExport, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `cerbero_backup_giornata_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

    } catch (error) {
        throw error;
    }
}

function confirmNewDay() {
    showConfirmModal(
        'Avvia Nuova Giornata?',
        'Salverà un backup completo, azzererà il Registro e resetterà i turni di Virtualstation. Procedere?',
        async () => {
            try {
                esportaTuttiIDatiConfirmBypass();
                showMessage('Backup completo eseguito!', 'success');
                
                resetRegistroData();
                showMessage('Registro azzerato!', 'info');

                resetVirtualstationData();
                showMessage('Virtualstation resettata!', 'info');
                
                showMessage('Operazione completata. Ricarico la pagina...', 'info');
                setTimeout(() => window.location.reload(), 1500);
            } catch(e) {
                showMessage("Errore nell'esportazione. La giornata NON è stata azzerata.", 'error');
            }
        }
    );
}

/* ===== GESTIONE ERRORI GLOBALI ===== */
window.addEventListener('error', function(event) {
    console.error('Errore JavaScript globale:', event.error);
    showMessage('Si è verificato un errore imprevisto', 'error');
});

window.addEventListener('unhandledrejection', function(event) {
    console.error('Promise rifiutata non gestita:', event.reason);
    showMessage('Errore operazione asincrona', 'error');
});

/* ===== INIZIALIZZAZIONE PAGINA ===== */
document.addEventListener('DOMContentLoaded', function() {
    try {
        if (typeof Storage === 'undefined' || !Storage.KEYS) {
            console.error("Storage o Storage.KEYS non definiti.");
            return;
        }

        initializeThemeSwitcher();
        
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
        
        calendarWidget = new CalendarWidget();
        todoWidget = new TodoWidget();
        
        const turnoInput = document.getElementById('controlTurno');
        if (turnoInput) {
            turnoInput.value = Storage.load(Storage.KEYS.CURRENT_TURNO, '');
            turnoInput.addEventListener('change', (e) => Storage.save(Storage.KEYS.CURRENT_TURNO, e.target.value));
        }

        const notesArea = document.getElementById('notesArea');
        if (notesArea) {
            notesArea.value = Storage.load(Storage.KEYS.NOTES, '');
            notesArea.addEventListener('input', debounce(() => Storage.save(Storage.KEYS.NOTES, notesArea.value), 500));
        }
        
        const resetManualFatturatoBtn = document.getElementById('reset-manual-fatturato-btn');
        if (resetManualFatturatoBtn) {
            resetManualFatturatoBtn.addEventListener('click', () => {
                showConfirmModal('Azzera Fatturato Manuale?', 'Verrà usato il valore calcolato da Virtualstation. Confermi?', () => {
                    Storage.remove(Storage.KEYS.CORRISPETTIVI_FATTURATO_MANUALE);
                    initializeIncassoBox();
                    showMessage('Fatturato manuale azzerato.', 'success');
                });
            });
        }
        
        function updateDateTime() {
            const now = new Date();
            const timeString = now.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
            const dateString = now.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' });
            const dateInputString = now.toLocaleDateString('it-IT');

            const currentTimeEl = document.getElementById('currentTime');
            const currentDateDisplayEl = document.getElementById('currentDateDisplay');
            const controlDateInput = document.getElementById('controlDate');
            
            if (currentTimeEl) currentTimeEl.textContent = timeString;
            if (currentDateDisplayEl) currentDateDisplayEl.textContent = dateString.charAt(0).toUpperCase() + dateString.slice(1);
            if (controlDateInput) controlDateInput.value = dateInputString;
        }

        updateDateTime();
        setInterval(updateDateTime, 60000);
        
        initializeIncassoBox();
        updateSalesSummaryWidget();
        updateMarginBox();

    } catch (error) {
        console.error('❌ Errore nell\'inizializzazione:', error);
        showMessage('Errore critico nell\'inizializzazione del sistema', 'error');
    }
});