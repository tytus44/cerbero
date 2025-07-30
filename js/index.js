/* ===== INIZIO JAVASCRIPT - INDEX UNIFICATO - TIMER OTTIMIZZATO ===== */

/* ===== INIZIO VARIABILI GLOBALI ===== */
let calendarWidget = null;
let todoWidget = null;
let updateTimer = null; // Timer reference per poterlo gestire
let lastDataHash = null; // Hash per tracciare cambiamenti dati
let isUpdating = false; // Flag per evitare aggiornamenti simultanei

const VAT_RATE = 0.22;
const MARGIN_NON_SERVITO = 0.035;
const MARGIN_SERVITO = 0.065;
/* ===== FINE VARIABILI GLOBALI ===== */

/* ===== INIZIO UTILITY ===== */
function showMessage(message, type = 'info') {
  try {
    const colors = {
      error: '#FF3547',
      info: '#0ABAB5',
      warning: '#FFD700',
      success: '#00C851'
    };

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;

    // 🎯 Posizione in basso + animazione
    toast.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: ${colors[type] || colors.info};
      color: ${type === 'warning' ? '#333' : 'white'};
      padding: 15px 20px;
      z-index: 1001;
      font-weight: 600;
      font-size: 14px;
      border-radius: 8px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.2);
      animation: slideInFromBottom 0.3s ease-out;
    `;

    document.body.appendChild(toast);

    // 🔄 Rimuovi dopo 3 secondi con animazione di uscita
    setTimeout(() => {
      toast.style.animation = 'slideOutToBottom 0.3s ease forwards';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  } catch (error) {
    console.error('Errore toast:', error);
    alert(message);
  }
}

// 🎞️ Keyframes per l'animazione (puoi metterli in <style> o CSS)
const style = document.createElement('style');
style.textContent = `
  @keyframes slideInFromBottom {
    from { opacity: 0; transform: translateY(100px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes slideOutToBottom {
    from { opacity: 1; transform: translateY(0); }
    to   { opacity: 0; transform: translateY(100px); }
  }
`;
document.head.appendChild(style);

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
    newBtnOk.addEventListener('click', () => { onConfirm(); hideModal(); });
    newBtnCancel.addEventListener('click', hideModal);
    modal.classList.add('active');
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => { clearTimeout(timeout); func(...args); };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

const formatEuro = (num) => new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(num);
const formatLiters = (num) => new Intl.NumberFormat('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num);
const parseNumberInput = (value) => {
    if (typeof value !== 'string') value = String(value);
    let cleaned = value.replace(/[€\s\u00A0]/g, '').replace(/\./g, '').replace(',', '.');
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
};

function formatProductName(product) {
    const productNames = { 'gasolio': 'Gasolio', 'diesel': 'Diesel+', 'adblue': 'AdBlue', 'benzina': 'Benzina', 'hvolution': 'HVolution' };
    return productNames[product] || product.charAt(0).toUpperCase() + product.slice(1);
}

function getFormattedTimestamp() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${year}${month}${day}-${hours}${minutes}`;
}

// ✅ NUOVA FUNZIONE: Calcola hash dei dati per rilevare cambiamenti
function calculateDataHash(data) {
    try {
        return btoa(JSON.stringify(data)).slice(0, 16); // Hash semplice
    } catch (error) {
        return String(Date.now()).slice(-8);
    }
}
/* ===== FINE UTILITY ===== */

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
    renderTodos() {
      const todoList = document.getElementById('todo-list');
      if (!todoList) return;
      todoList.innerHTML = '';
      this.todos.forEach(todo => {
        const li = document.createElement('li');
        li.setAttribute('data-todo-id', todo.id);
        li.innerHTML = `
          <label>${todo.text}</label>
          <button class="todo-delete" onclick="todoWidget.deleteTodo(this.parentElement)">
            <i class="fa-solid fa-xmark"></i>
          </button>
        `;
        todoList.appendChild(li);
      });
    }
}
/* ===== FINE WIDGETS ===== */

/* ===== FUNZIONI CENTRALI E DI RIEPILOGO - CORRETTE E MIGLIORATE ===== */
function getSalesSummaryData() {
    const virtualstationData = Storage.load(Storage.KEYS.VIRTUALSTATION_DATA, {});
    
    const productTotals = { benzina: 0, gasolio: 0, diesel: 0, hvolution: 0, adblue: 0 };
    const modalityTotals = { servito: 0, iperself: 0, selfservice: 0 };
    
    // ✅ CORREZIONE: Usa i totali globali se disponibili (più affidabile)
    if (virtualstationData.globalTotals) {
        const globalTotals = virtualstationData.globalTotals;
        
        modalityTotals.servito = globalTotals.servito?.liters || 0;
        modalityTotals.iperself = globalTotals.iperself?.liters || 0;
        modalityTotals.selfservice = globalTotals.selfService?.liters || 0;
    }
    
    // ✅ CORREZIONE: Calcola i totali per prodotto in modo più robusto
    const turnKeys = Object.keys(virtualstationData).filter(key => key.startsWith('turn-'));
    
    turnKeys.forEach(turnKey => {
        const turnData = virtualstationData[turnKey];
        if (turnData && typeof turnData === 'object') {
            // Itera sui prodotti per ogni turno
            Object.keys(productTotals).forEach(product => {
                if (turnData[product]) {
                    const productData = turnData[product];
                    
                    // Usa totalLiters se disponibile, altrimenti calcola manualmente
                    if (typeof productData.totalLiters === 'number') {
                        productTotals[product] += productData.totalLiters;
                    } else {
                        const iperself = productData.iperself || 0;
                        const servito = productData.servito || 0;
                        const selfService = productData['self-service'] || 0;
                        const total = iperself + servito + selfService;
                        productTotals[product] += total;
                    }
                }
            });
        }
    });
    
    return { productTotals, modalityTotals };
}

function updateSalesSummaryWidget() {
    console.log('[INDEX] 🔄 Aggiornamento widget riepilogo vendite...');
    
    const { productTotals } = getSalesSummaryData();
    
    // ✅ DEBUG: Verifica che i dati siano corretti
    console.log('[INDEX] 🔍 Dati prodotti ricevuti:', productTotals);
    
    // ✅ DEBUG: Verifica che tutti gli elementi esistano
    const expectedElements = ['benzina-liters', 'gasolio-liters', 'diesel-liters', 'hvolution-liters', 'adblue-liters', 'total-liters'];
    expectedElements.forEach(id => {
        const element = document.getElementById(id);
        if (!element) {
            console.error(`[INDEX] ❌ Elemento mancante: ${id}`);
        } else {
            console.log(`[INDEX] ✅ Elemento trovato: ${id}`, element.tagName, element.type);
        }
    });
    
    // ✅ CORREZIONE: Usa .value per elementi <input>
    Object.entries(productTotals).forEach(([product, liters]) => {
        const elementId = `${product}-liters`;
        const element = document.getElementById(elementId);
        
        console.log(`[INDEX] 🔍 Processando ${product}:`, {
            elementId,
            element: element ? 'TROVATO' : 'NON_TROVATO',
            liters: liters,
            type: typeof liters
        });
        
        if (element) {
            const formattedLiters = `${formatLiters(liters)} L`;
            const oldValue = element.value;
            element.value = formattedLiters;
            console.log(`[INDEX] ✅ ${product} aggiornato: "${oldValue}" → "${formattedLiters}"`);
        } else {
            console.error(`[INDEX] ❌ Elemento non trovato per ${elementId}`);
        }
    });
    
    // Calcola e aggiorna il totale
    const totalLiters = Object.values(productTotals).reduce((sum, liters) => sum + liters, 0);
    const totalElement = document.getElementById('total-liters');
    
    console.log('[INDEX] 🔍 Totale litri calcolato:', totalLiters);
    
    if (totalElement) {
        const formattedTotal = `${formatLiters(totalLiters)} L`;
        const oldValue = totalElement.value;
        totalElement.value = formattedTotal;
        console.log(`[INDEX] ✅ Totale aggiornato: "${oldValue}" → "${formattedTotal}"`);
    } else {
        console.error('[INDEX] ❌ Elemento total-liters non trovato');
    }
    
    console.log('[INDEX] ✅ Widget riepilogo vendite completato');
}

function calculateFatturatoFromVenditeData() {
    const virtualstationData = Storage.load(Storage.KEYS.VIRTUALSTATION_DATA, {});
    
    // ✅ CORREZIONE: Prima prova a usare i totali globali (più affidabile)
    if (virtualstationData.globalTotals?.general?.amount) {
        const globalAmount = virtualstationData.globalTotals.general.amount;
        console.log('[INDEX] ✅ Usando totali globali per fatturato:', globalAmount);
        return globalAmount;
    }
    
    // ✅ FALLBACK: Calcola dai singoli turni se non ci sono totali globali
    let totalFromAllTurns = 0;
    const turnKeys = Object.keys(virtualstationData).filter(key => key.startsWith('turn-'));
    
    turnKeys.forEach(turnKey => {
        const turnData = virtualstationData[turnKey];
        const turnAmount = turnData?.totalTurnAmount || 0;
        totalFromAllTurns += turnAmount;
    });
    
    if (totalFromAllTurns > 0) {
        console.log('[INDEX] ✅ Totale calcolato dai turni:', totalFromAllTurns);
        return totalFromAllTurns;
    }
    
    // ✅ ULTIMO FALLBACK: Usa storico vendite se disponibile
    const venditeHistory = Storage.load(Storage.KEYS.VENDITE_HISTORY, []);
    if (venditeHistory.length > 0) {
        const lastSnapshot = venditeHistory[venditeHistory.length - 1];
        if (lastSnapshot?.totalSales) {
            console.log('[INDEX] ✅ Usando storico vendite:', lastSnapshot.totalSales);
            return lastSnapshot.totalSales;
        }
    }
    
    console.log('[INDEX] ⚠️ Nessun dato di fatturato trovato, ritorno 0');
    return 0;
}

function updateIncassoBox(fatturatoValue) {
    const imponibileElement = document.getElementById('corrispettivi-imponibile');
    const ivaElement = document.getElementById('corrispettivi-iva');
    if (!imponibileElement || !ivaElement) return;
    
    const imponibile = fatturatoValue / (1 + VAT_RATE);
    const iva = fatturatoValue - imponibile;
    
    // ✅ CORREZIONE: Usa .value per elementi <input>
    imponibileElement.value = formatEuro(imponibile);
    ivaElement.value = formatEuro(iva);
    
    console.log(`[INDEX] 💰 Incasso aggiornato - Fatturato: ${formatEuro(fatturatoValue)}, Imponibile: ${formatEuro(imponibile)}, IVA: ${formatEuro(iva)}`);
}

function updateMarginBox() {
    const marginElement = document.getElementById('corrispettivi-margine');
    if (!marginElement) return;
    
    const { modalityTotals } = getSalesSummaryData();
    
    // ✅ CORREZIONE: Usa i nomi corretti delle chiavi
    const nonServitoLiters = modalityTotals.iperself + modalityTotals.selfservice;
    const servitoLiters = modalityTotals.servito;
    
    const nonServitoMargin = nonServitoLiters * MARGIN_NON_SERVITO;
    const servitoMargin = servitoLiters * MARGIN_SERVITO;
    const totalMargin = nonServitoMargin + servitoMargin;
    
    // ✅ CORREZIONE: Usa .value per elemento <input>
    marginElement.value = formatEuro(totalMargin);
    console.log(`[INDEX] 📊 Margine aggiornato: ${formatEuro(totalMargin)} (Non servito: ${nonServitoLiters.toFixed(2)}L = ${formatEuro(nonServitoMargin)}, Servito: ${servitoLiters.toFixed(2)}L = ${formatEuro(servitoMargin)})`);
}

// ✅ NUOVA FUNZIONE: Aggiorna campo turno display
function updateTurnoDisplay() {
    const turnoElement = document.getElementById('controlTurno');
    if (!turnoElement) return;
    
    const currentTurno = Storage.load(Storage.KEYS.CURRENT_TURNO, '');
    turnoElement.value = currentTurno || 'N/A';
    
    console.log(`[INDEX] 🎯 Campo turno aggiornato: "${currentTurno || 'N/A'}"`);
}

// ✅ FUNZIONE PRINCIPALE DI AGGIORNAMENTO - OTTIMIZZATA ANTI-LOOP
function refreshDataFromVirtualstation() {
    // ✅ PROTEZIONE ANTI-LOOP: Evita aggiornamenti simultanei
    if (isUpdating) {
        console.log('[INDEX] ⏭️ Aggiornamento già in corso, evito duplicazione...');
        return;
    }
    
    isUpdating = true;
    console.log('[INDEX] 🔄 === INIZIO AGGIORNAMENTO DATI DA VIRTUALSTATION ===');
    
    try {
        // ✅ CONTROLLO HASH: Evita aggiornamenti ridondanti
        const virtualstationData = Storage.load(Storage.KEYS.VIRTUALSTATION_DATA, {});
        const currentHash = calculateDataHash(virtualstationData);
        
        if (lastDataHash && lastDataHash === currentHash) {
            console.log('[INDEX] 📝 Dati non cambiati (hash identico), skip aggiornamento ridondante');
            return;
        }
        
        lastDataHash = currentHash;
        console.log('[INDEX] 🆕 Rilevati nuovi dati, procedo con aggiornamento...');
        
        // 1. Aggiorna sempre il riepilogo vendite
        updateSalesSummaryWidget();
        
        // 2. Aggiorna il fatturato solo se non è stato impostato manualmente
        const savedManualFatturato = Storage.load(Storage.KEYS.CORRISPETTIVI_FATTURATO_MANUALE, null);
        if (savedManualFatturato === null) {
            console.log('[INDEX] 💰 Fatturato manuale non impostato, calcolo automatico...');
            const fatturatoInput = document.getElementById('corrispettivi-fatturato');
            if (fatturatoInput) {
                const calculatedFatturato = calculateFatturatoFromVenditeData();
                fatturatoInput.value = formatEuro(calculatedFatturato);
                updateIncassoBox(calculatedFatturato);
            }
        } else {
            console.log('[INDEX] 💰 Fatturato manuale presente, non aggiorno automaticamente:', savedManualFatturato);
            updateIncassoBox(savedManualFatturato);
        }
        
        // 3. Aggiorna sempre il margine
        updateMarginBox();
        
        // ✅ AGGIUNTA: Aggiorna campo turno (display)
        updateTurnoDisplay();
        
        console.log('[INDEX] ✅ === AGGIORNAMENTO COMPLETATO CON SUCCESSO ===');
        
    } catch (error) {
        console.error('[INDEX] ❌ Errore durante aggiornamento dati:', error);
        showMessage('Errore aggiornamento dati da Virtualstation', 'error');
    } finally {
        // ✅ RELEASE FLAG
        isUpdating = false;
    }
}

function initializeIncassoBox() {
    const fatturatoInput = document.getElementById('corrispettivi-fatturato');
    if (!fatturatoInput) return;
    
    console.log('[INDEX] 🔧 Inizializzazione box Incasso...');
    
    const savedManualFatturato = Storage.load(Storage.KEYS.CORRISPETTIVI_FATTURATO_MANUALE, null);
    let initialFatturato = 0;
    
    if (savedManualFatturato !== null) {
        initialFatturato = typeof savedManualFatturato === 'number' ? savedManualFatturato : parseNumberInput(savedManualFatturato);
        console.log('[INDEX] 💰 Caricato fatturato manuale:', initialFatturato);
    } else {
        initialFatturato = calculateFatturatoFromVenditeData();
        console.log('[INDEX] 💰 Calcolato fatturato automatico:', initialFatturato);
    }
    
    fatturatoInput.value = formatEuro(initialFatturato);
    updateIncassoBox(initialFatturato);
    
    // ✅ Event handlers migliorati
    const handleFatturatoChange = debounce(() => {
        const manualValue = parseNumberInput(fatturatoInput.value);
        Storage.save(Storage.KEYS.CORRISPETTIVI_FATTURATO_MANUALE, manualValue);
        updateIncassoBox(manualValue);
        console.log('[INDEX] 💰 Fatturato manuale salvato:', manualValue);
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
    
    console.log('[INDEX] ✅ Box Incasso inizializzato');
}

function resetManualFatturato() {
    showConfirmModal('Azzera Fatturato Manuale?', 'Verrà usato il valore calcolato da Virtualstation. Confermi?', () => {
        Storage.remove(Storage.KEYS.CORRISPETTIVI_FATTURATO_MANUALE);
        initializeIncassoBox();
        updateSalesSummaryWidget();
        updateMarginBox();
        showMessage('Fatturato manuale azzerato.', 'success');
    });
}

/* ===== LISTENER PER EVENTI VIRTUALSTATION - MIGLIORATI ===== */
function initializeVirtualstationListener() {
    console.log('[INDEX] 👂 Inizializzazione listener Virtualstation...');
    
    // ✅ LISTENER PRINCIPALE per eventi custom
    window.addEventListener('virtualstation-data-changed', (event) => {
        console.log('[INDEX] 🔔 Ricevuta notifica cambiamento da Virtualstation:', event.detail);
        
        // Aggiorna solo se non siamo nella pagina virtualstation stessa
        if (!window.location.pathname.includes('virtualstation.html')) {
            // ✅ Aggiornamento immediato senza delay eccessivi
            setTimeout(() => {
                refreshDataFromVirtualstation();
                console.log('[INDEX] ✅ Aggiornamento automatico completato');
            }, 50); // Ridotto da 100ms a 50ms per maggiore reattività
        } else {
            console.log('[INDEX] 🚫 Su pagina Virtualstation, skip aggiornamento automatico');
        }
    });
    
    // ✅ LISTENER per eventi di storage (modifiche in altre tab)
    window.addEventListener('storage', (event) => {
        if (event.key === Storage.KEYS.VIRTUALSTATION_DATA) {
            console.log('[INDEX] 🔔 Rilevato cambiamento dati Virtualstation in altra tab');
            setTimeout(() => {
                refreshDataFromVirtualstation();
                console.log('[INDEX] ✅ Aggiornamento da altra tab completato');
            }, 100);
        }
    });
    
    // ✅ LISTENER per focus window (quando si torna alla tab)
    window.addEventListener('focus', () => {
        console.log('[INDEX] 👁️ Finestra tornata in focus, aggiorno dati...');
        setTimeout(() => {
            refreshDataFromVirtualstation();
        }, 200);
    });
    
    console.log('[INDEX] ✅ Listener Virtualstation inizializzati correttamente');
}

// ✅ TIMER INTELLIGENTE - ANTI-LOOP
function startSmartTimer() {
    // ✅ Pulisce timer esistente se presente
    if (updateTimer) {
        clearInterval(updateTimer);
        updateTimer = null;
    }
    
    console.log('[INDEX] ⏰ Avvio timer intelligente (10 secondi)...');
    
    updateTimer = setInterval(() => {
        try {
            // ✅ CONTROLLO INTELLIGENTE: Aggiorna solo se necessario
            const savedManualFatturato = Storage.load(Storage.KEYS.CORRISPETTIVI_FATTURATO_MANUALE, null);
            
            // Se non c'è fatturato manuale, controlla se ci sono cambiamenti nei dati
            if (savedManualFatturato === null) {
                const virtualstationData = Storage.load(Storage.KEYS.VIRTUALSTATION_DATA, {});
                const currentHash = calculateDataHash(virtualstationData);
                
                // Aggiorna solo se i dati sono effettivamente cambiati
                if (lastDataHash !== currentHash) {
                    console.log('[INDEX] ⏰ Timer: rilevati nuovi dati, aggiorno...');
                    refreshDataFromVirtualstation();
                } else {
                    console.log('[INDEX] ⏰ Timer: nessun cambiamento rilevato, skip...');
                }
            } else {
                // Se c'è fatturato manuale, aggiorna solo vendite e margine (se dati cambiati)
                const virtualstationData = Storage.load(Storage.KEYS.VIRTUALSTATION_DATA, {});
                const currentHash = calculateDataHash(virtualstationData);
                
                if (lastDataHash !== currentHash) {
                    console.log('[INDEX] ⏰ Timer: aggiorno solo vendite, margine e turno...');
                    lastDataHash = currentHash;
                    updateSalesSummaryWidget();
                    updateMarginBox();
                    updateTurnoDisplay();
                }
            }
        } catch (error) {
            console.error('[INDEX] ❌ Errore nel timer intelligente:', error);
        }
    }, 10000); // ✅ AUMENTATO: da 2 secondi a 10 secondi per evitare loop
    
    console.log('[INDEX] ✅ Timer intelligente attivato ogni 10 secondi');
}

/* ===== FUNZIONE DI DEBUG MIGLIORATA ===== */
function debugVirtualstationConnection() {
    console.log('=== 🔍 DEBUG CONNESSIONE VIRTUALSTATION ===');
    
    const virtualstationData = Storage.load(Storage.KEYS.VIRTUALSTATION_DATA, {});
    console.log('📊 Dati Virtualstation completi:', virtualstationData);
    
    if (virtualstationData.globalTotals) {
        console.log('✅ Totali globali trovati:', virtualstationData.globalTotals);
        console.log('  - Iperself:', virtualstationData.globalTotals.iperself);
        console.log('  - Servito:', virtualstationData.globalTotals.servito);
        console.log('  - Self-Service:', virtualstationData.globalTotals.selfService);
        console.log('  - Generale:', virtualstationData.globalTotals.general);
    } else {
        console.log('⚠️ Totali globali non trovati');
    }
    
    const turnKeys = Object.keys(virtualstationData).filter(key => key.startsWith('turn-'));
    console.log(`📋 Trovati ${turnKeys.length} turni:`, turnKeys);
    
    turnKeys.forEach(turnKey => {
        const turnData = virtualstationData[turnKey];
        console.log(`🔸 ${turnKey}:`, {
            totalTurnLiters: turnData.totalTurnLiters,
            totalTurnAmount: turnData.totalTurnAmount,
            turnNumber: turnData.turnNumber,
            prodotti: Object.keys(turnData).filter(key => !key.startsWith('total') && key !== 'turnNumber')
        });
        
        // Dettaglio prodotti per questo turno
        const products = ['benzina', 'gasolio', 'diesel', 'hvolution', 'adblue'];
        products.forEach(product => {
            if (turnData[product]) {
                console.log(`    ${product}:`, turnData[product]);
            }
        });
    });
    
    const { productTotals, modalityTotals } = getSalesSummaryData();
    console.log('📊 Totali prodotti calcolati:', productTotals);
    console.log('📊 Totali modalità calcolati:', modalityTotals);
    
    const calculatedFatturato = calculateFatturatoFromVenditeData();
    console.log('💰 Fatturato calcolato:', calculatedFatturato);
    
    const savedManualFatturato = Storage.load(Storage.KEYS.CORRISPETTIVI_FATTURATO_MANUALE, null);
    console.log('💰 Fatturato manuale salvato:', savedManualFatturato);
    
    console.log('🔄 Is updating flag:', isUpdating);
    console.log('🔍 Last data hash:', lastDataHash);
    console.log('⏰ Timer active:', updateTimer !== null);
    
    console.log('=== 🏁 FINE DEBUG ===');
}

// Aggiungi questa funzione come globale per debug dalla console
window.debugVirtualstationConnection = debugVirtualstationConnection;

/* ===== SISTEMA IMPORT/EXPORT UNIFICATO ===== */
const COMPLETE_EXPORT_MAPPING = {
    [Storage.KEYS.THEME]: 'theme', [Storage.KEYS.NOTES]: 'notes', [Storage.KEYS.TODO_LIST]: 'todo',
    [Storage.KEYS.CURRENT_TURNO]: 'turno', [Storage.KEYS.CORRISPETTIVI_FATTURATO_MANUALE]: 'corrispettiviFatturatoManuale',
    [Storage.KEYS.DISPENSERS]: 'erogatori', [Storage.KEYS.REGISTRO_DATA]: 'registro', [Storage.KEYS.MONETARIO_DATA]: 'monetario',
    [Storage.KEYS.VERSAMENTO_DATA]: 'versamento', [Storage.KEYS.ORDER_HISTORY]: 'ordini', [Storage.KEYS.CREDITO_DATA]: 'credito',
    [Storage.KEYS.CARICO_TOTALS]: 'caricoTotals', [Storage.KEYS.CARICO_HISTORY]: 'caricoHistory',
    [Storage.KEYS.CARICO_RIMANENZE]: 'caricoRimanenze', [Storage.KEYS.VENDITE_HISTORY]: 'venditeHistory',
    [Storage.KEYS.HISTORY_COLLAPSED]: 'historyCollapsed', [Storage.KEYS.VIRTUALSTATION_DATA]: 'virtualstationData'
};

function importaDatiCompleti() {
    showConfirmModal('Importare Tutti i Dati?', 'Questo sovrascriverà TUTTI i dati di tutte le pagine. Procedere?', () => {
        const input = document.createElement('input');
        input.type = 'file'; input.accept = '.json';
        input.onchange = function(e) {
            const file = e.target.files[0]; if (!file) return;
            const reader = new FileReader();
            reader.onload = function(e) {
                try {
                    const importedData = JSON.parse(e.target.result);
                    let importedCount = 0;
                    Object.entries(COMPLETE_EXPORT_MAPPING).forEach(([storageKey, exportKey]) => {
                        if (importedData.hasOwnProperty(exportKey)) { Storage.save(storageKey, importedData[exportKey]); importedCount++; }
                    });
                    if (importedCount === 0) { showMessage('Nessun dato valido trovato nel file.', 'warning'); return; }
                    showMessage(`${importedCount} sezioni importate! Ricarico...`, 'info');
                    setTimeout(() => window.location.reload(), 1500);
                } catch (error) { showMessage('Errore: file non valido o corrotto', 'error'); }
            };
            reader.readAsText(file);
        };
        input.click();
    });
}

function esportaTuttiIDati() {
    showConfirmModal('Esportare Tutti i Dati?', 'Verrà creato un backup completo di TUTTE le pagine. Continuare?', () => {
        try {
            const dataToExport = { exportDate: new Date().toISOString(), exportVersion: '2.0', systemName: 'CERBERO', exportType: 'COMPLETE_SYSTEM_BACKUP' };
            Object.entries(COMPLETE_EXPORT_MAPPING).forEach(([storageKey, exportKey]) => {
                const data = Storage.load(storageKey);
                if (data !== null) dataToExport[exportKey] = data;
            });
            const dataStr = JSON.stringify(dataToExport, null, 2);
            const dataBlob = new Blob([dataStr], {type: 'application/json'});
            const url = URL.createObjectURL(dataBlob);
            const link = document.createElement('a');
            link.href = url;
            const timestamp = getFormattedTimestamp();
            link.download = `backup-completo_${timestamp}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            showMessage('Backup completo esportato!', 'info');
        } catch (error) { showMessage('Errore durante l\'esportazione completa', 'error'); }
    });
}

function resetRegistroData() { Storage.remove(Storage.KEYS.REGISTRO_DATA); }
function resetVirtualstationData() {
     const virtualstationData = Storage.load(Storage.KEYS.VIRTUALSTATION_DATA, {});
    const clearedData = { globalTotals: virtualstationData.globalTotals || {} };
    Storage.save(Storage.KEYS.VIRTUALSTATION_DATA, clearedData);
}
function resetFatturatoManuale() { Storage.remove(Storage.KEYS.CORRISPETTIVI_FATTURATO_MANUALE); }

function esportaTuttiIDatiConfirmBypass() {
    try {
        const dataToExport = { exportDate: new Date().toISOString(), exportVersion: '2.0', systemName: 'CERBERO', exportType: 'COMPLETE_SYSTEM_BACKUP_NEW_DAY' };
        Object.entries(COMPLETE_EXPORT_MAPPING).forEach(([storageKey, exportKey]) => {
            const data = Storage.load(storageKey);
            if (data !== null) dataToExport[exportKey] = data;
        });
        const dataStr = JSON.stringify(dataToExport, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        const timestamp = getFormattedTimestamp();
        link.download = `backup-giornata_${timestamp}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    } catch (error) { throw error; }
}

function confirmNewDay() {
    showConfirmModal('Avvia Nuova Giornata?', 'Salverà un backup completo, azzererà il Registro, resetterà i turni di Virtualstation e azzererà il fatturato totale. Procedere?', async () => {
        try {
            esportaTuttiIDatiConfirmBypass();
            showMessage('Backup completo eseguito!', 'success');
            resetRegistroData();
            showMessage('Registro azzerato!', 'info');
            resetVirtualstationData();
            showMessage('Virtualstation resettata!', 'info');
            resetFatturatoManuale();
            showMessage('Fatturato totale azzerato!', 'info');
            showMessage('Operazione completata. Ricarico la pagina...', 'info');
            setTimeout(() => window.location.reload(), 1500);
        } catch(e) { showMessage("Errore nell'esportazione. La giornata NON è stata azzerata.", 'error'); }
    });
}

/* ===== GESTIONE ERRORI GLOBALI ===== */
window.addEventListener('error', function(event) { console.error('Errore JavaScript globale:', event.error); showMessage('Si è verificato un errore imprevisto', 'error'); });
window.addEventListener('unhandledrejection', function(event) { console.error('Promise rifiutata non gestita:', event.reason); showMessage('Errore nell\'operazione asincrona', 'error'); });

/* ===== INIZIALIZZAZIONE PAGINA - MIGLIORATA ===== */
document.addEventListener('DOMContentLoaded', function() {
    try {
        if (typeof Storage === 'undefined' || !Storage.KEYS) { 
            console.error("❌ Storage o Storage.KEYS non definiti."); 
            return; 
        }
        
        console.log('[INDEX] 🚀 === INIZIALIZZAZIONE INDEX AVVIATA ===');
        
        // Inizializza il tema
        ThemeManager.init();
        console.log('[INDEX] ✅ Tema inizializzato');
        
        // Inizializza modali info
        const infoBtn = document.getElementById('info-btn');
        const infoModal = document.getElementById('info-modal');
        if (infoBtn && infoModal) {
            const closeBtn = infoModal.querySelector('.modal-close-btn');
            infoBtn.addEventListener('click', (e) => { e.preventDefault(); infoModal.classList.add('active'); });
            if(closeBtn) { closeBtn.addEventListener('click', () => { infoModal.classList.remove('active'); }); }
            infoModal.addEventListener('click', (e) => { if(e.target === infoModal) { infoModal.classList.remove('active'); } });
        }
        console.log('[INDEX] ✅ Modali info inizializzate');
        
        // Inizializza widgets
        calendarWidget = new CalendarWidget();
        todoWidget = new TodoWidget();
        console.log('[INDEX] ✅ Widget inizializzati');
        
        // Inizializza campo turno (ora solo display)
        updateTurnoDisplay();
        console.log('[INDEX] ✅ Campo turno inizializzato (display)');
        
        // Inizializza area note
        const notesArea = document.getElementById('notesArea');
        if (notesArea) {
            notesArea.value = Storage.load(Storage.KEYS.NOTES, '');
            notesArea.addEventListener('input', debounce(() => Storage.save(Storage.KEYS.NOTES, notesArea.value), 500));
        }
        console.log('[INDEX] ✅ Area note inizializzata');
        
        // Inizializza data/ora
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
        console.log('[INDEX] ✅ Data/ora inizializzate');
        
        // ✅ INIZIALIZZA LISTENER VIRTUALSTATION (PRIMA DI TUTTO IL RESTO)
        initializeVirtualstationListener();
        console.log('[INDEX] ✅ Listener Virtualstation inizializzati');
        
        // ✅ INIZIALIZZA BOX INCASSO
        initializeIncassoBox();
        console.log('[INDEX] ✅ Box Incasso inizializzato');
        
        // ✅ PRIMA IMPORTAZIONE DATI DA VIRTUALSTATION
        console.log('[INDEX] 📊 Importazione iniziale dati da Virtualstation...');
        refreshDataFromVirtualstation();
        
        // ✅ AVVIA TIMER INTELLIGENTE
        startSmartTimer();
        
        // ✅ CLEANUP al unload della pagina
        window.addEventListener('beforeunload', () => {
            if (updateTimer) {
                clearInterval(updateTimer);
                updateTimer = null;
            }
            console.log('[INDEX] 🧹 Cleanup completato');
        });
        
        console.log('[INDEX] 🎉 === SISTEMA INDEX INIZIALIZZATO CORRETTAMENTE ===');
        
        // ✅ Debug iniziale (solo se attivato)
        if (localStorage.getItem('debug_virtualstation') === 'true') {
            setTimeout(debugVirtualstationConnection, 1000);
        }
        
    } catch (error) { 
        console.error('[INDEX] ❌ Errore critico nell\'inizializzazione:', error); 
        showMessage('Errore critico nell\'inizializzazione del sistema', 'error'); 
    }
});

/* ===== COMANDI DI DEBUG GLOBALI ===== */
// Per attivare il debug dalla console: localStorage.setItem('debug_virtualstation', 'true')
// Per disattivarlo: localStorage.removeItem('debug_virtualstation')
// Per eseguire debug immediato: debugVirtualstationConnection()
window.forceRefreshFromVirtualstation = refreshDataFromVirtualstation;

// ✅ FUNZIONI DI CONTROLLO TIMER
window.pauseTimer = () => {
    if (updateTimer) {
        clearInterval(updateTimer);
        updateTimer = null;
        console.log('[INDEX] ⏸️ Timer pausato');
    }
};

window.resumeTimer = () => {
    if (!updateTimer) {
        startSmartTimer();
        console.log('[INDEX] ▶️ Timer riavviato');
    }
};

window.checkTimerStatus = () => {
    console.log('[INDEX] ⏰ Timer attivo:', updateTimer !== null);
    console.log('[INDEX] 🔄 Aggiornamento in corso:', isUpdating);
    console.log('[INDEX] 🔍 Ultimo hash dati:', lastDataHash);
};

// ✅ FUNZIONE DI TEST PER DEBUG
window.testUpdateFields = () => {
    console.log('[INDEX] 🧪 === TEST MANUALE AGGIORNAMENTO CAMPI ===');
    
    // Test dati di esempio
    const testData = {
        benzina: 1500.50,
        gasolio: 2000.75,
        diesel: 800.25,
        hvolution: 300.00,
        adblue: 150.00
    };
    
    console.log('[INDEX] 🧪 Aggiornamento con dati di test:', testData);
    
    Object.entries(testData).forEach(([product, liters]) => {
        const elementId = `${product}-liters`;
        const element = document.getElementById(elementId);
        
        if (element) {
            const formattedValue = `${formatLiters(liters)} L`;
            element.value = formattedValue;
            console.log(`[INDEX] ✅ ${product}: ${formattedValue} → campo aggiornato`);
        } else {
            console.error(`[INDEX] ❌ Campo ${elementId} non trovato`);
        }
    });
    
    // Test totale
    const total = Object.values(testData).reduce((sum, val) => sum + val, 0);
    const totalElement = document.getElementById('total-liters');
    if (totalElement) {
        const formattedTotal = `${formatLiters(total)} L`;
        totalElement.value = formattedTotal;
        console.log(`[INDEX] ✅ Totale: ${formattedTotal} → campo aggiornato`);
    }
    
    // Test campo turno
    updateTurnoDisplay();
    
    console.log('[INDEX] 🧪 === FINE TEST ===');
};

// ✅ FUNZIONE PER CONTROLLARE STRUTTURA HTML
window.checkHtmlStructure = () => {
    console.log('[INDEX] 🔍 === CONTROLLO STRUTTURA HTML ===');
    
    const expectedIds = [
        'benzina-liters', 'gasolio-liters', 'diesel-liters', 
        'hvolution-liters', 'adblue-liters', 'total-liters',
        'corrispettivi-imponibile', 'corrispettivi-iva', 'corrispettivi-margine',
        'controlTurno'
    ];
    
    expectedIds.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            console.log(`✅ ${id}: ${element.tagName.toLowerCase()}${element.type ? `[${element.type}]` : ''} = "${element.value}"`);
        } else {
            console.error(`❌ ${id}: NON TROVATO`);
        }
    });
    
    console.log('[INDEX] 🔍 === FINE CONTROLLO ===');
};