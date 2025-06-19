/* ===== INIZIO JAVASCRIPT ===== */

/* ===== INIZIO VARIABILI GLOBALI ===== */
let calendarWidget = null;
let todoWidget = null;
/* ===== FINE VARIABILI GLOBALI ===== */

/* ===== INIZIO GESTIONE STORAGE ===== */
const Storage = {
    KEYS: {
        NOTES: 'cerbero_notes',
        TODO_LIST: 'cerbero_todo',
        CURRENT_TURNO: 'cerbero_turno',
        DISPENSERS: 'cerbero_dispensers',
        CARICO_TOTALS: 'cerbero_carico_totals',
        CARICO_HISTORY: 'cerbero_carico_history',
        VENDITE_DATA: 'cerbero_vendite',
        MONETARIO_DATA: 'cerbero_monetario',
        CREDITO_DATA: 'cerbero_credito',
        REGISTRO_DATA: 'cerbero_registro'
    },

    save: function(key, data) {
        try {
            if (key === this.KEYS.NOTES) {
                localStorage.setItem(key, data);
                return true;
            }
            localStorage.setItem(key, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('Errore nel salvare i dati:', error);
            return false;
        }
    },

    load: function(key, defaultValue = null) {
        try {
            const data = localStorage.getItem(key);
            if (!data) return defaultValue;
            
            if (key === this.KEYS.NOTES) {
                return data;
            }
            return JSON.parse(data);
        } catch (error) {
            console.error('Errore nel caricare i dati per', key, ':', error);
            if (key === this.KEYS.NOTES) {
                const rawData = localStorage.getItem(key);
                return rawData || defaultValue;
            }
            return defaultValue;
        }
    },

    remove: function(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error('Errore nel rimuovere i dati:', error);
            return false;
        }
    }
};
/* ===== FINE GESTIONE STORAGE ===== */

/* ===== INIZIO UTILITY ===== */
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

function getCurrentDate() {
    return new Date().toLocaleDateString('it-IT');
}

function getCurrentTime() {
    return new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
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
/* ===== FINE UTILITY ===== */

/* ===== INIZIO WIDGET CALENDARIO ===== */
class CalendarWidget {
    constructor() {
        this.currentDate = new Date();
        this.holidays = this.initializeHolidays();
        this.init();
    }

    init() {
        this.render();
        this.bindEvents();
    }

    // Calcola la Pasqua usando l'algoritmo di Gauss
    calculateEaster(year) {
        const a = year % 19;
        const b = Math.floor(year / 100);
        const c = year % 100;
        const d = Math.floor(b / 4);
        const e = b % 4;
        const f = Math.floor((b + 8) / 25);
        const g = Math.floor((b - f + 1) / 3);
        const h = (19 * a + b - d - g + 15) % 30;
        const i = Math.floor(c / 4);
        const k = c % 4;
        const l = (32 + 2 * e + 2 * i - h - k) % 7;
        const m = Math.floor((a + 11 * h + 22 * l) / 451);
        const month = Math.floor((h + l - 7 * m + 114) / 31);
        const day = ((h + l - 7 * m + 114) % 31) + 1;
        
        return new Date(year, month - 1, day);
    }

    // Inizializza le festività italiane per l'anno corrente
    initializeHolidays() {
        const year = this.currentDate.getFullYear();
        
        // Calcola la Pasqua e il Lunedì dell'Angelo
        const easter = this.calculateEaster(year);
        const easterMonday = new Date(easter);
        easterMonday.setDate(easter.getDate() + 1);
        
        // Festività fisse italiane
        const holidays = [
            `${year}-01-01`, // Capodanno
            `${year}-01-06`, // Epifania
            `${year}-04-25`, // Festa della Liberazione
            `${year}-05-01`, // Festa del Lavoro
            `${year}-06-02`, // Festa della Repubblica
            `${year}-08-15`, // Ferragosto
            `${year}-11-01`, // Ognissanti
            `${year}-12-08`, // Immacolata Concezione
            `${year}-12-25`, // Natale
            `${year}-12-26`, // Santo Stefano
            // Festività mobili
            easter.toISOString().split('T')[0], // Pasqua
            easterMonday.toISOString().split('T')[0] // Lunedì dell'Angelo
        ];
        
        return holidays;
    }

    // Verifica se una data è festiva (incluse le domeniche)
    isHoliday(date) {
        // Controlla se è domenica (giorno 0)
        if (date.getDay() === 0) {
            return true;
        }
        
        // Controlla le festività fisse
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const dateString = `${year}-${month}-${day}`;
        return this.holidays.includes(dateString);
    }

    bindEvents() {
        const prevBtn = document.getElementById('calendarPrev');
        const nextBtn = document.getElementById('calendarNext');
        
        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                this.currentDate.setMonth(this.currentDate.getMonth() - 1);
                this.holidays = this.initializeHolidays(); // Ricalcola per il nuovo anno se necessario
                this.render();
            });
        }
        
        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                this.currentDate.setMonth(this.currentDate.getMonth() + 1);
                this.holidays = this.initializeHolidays(); // Ricalcola per il nuovo anno se necessario
                this.render();
            });
        }
    }

    render() {
        this.renderHeader();
        this.renderDates();
    }

    renderHeader() {
        const titleElement = document.getElementById('calendarTitle');
        if (titleElement) {
            const monthNames = [
                'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
                'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
            ];
            titleElement.textContent = `${monthNames[this.currentDate.getMonth()]} ${this.currentDate.getFullYear()}`;
        }
    }

    renderDates() {
        const datesContainer = document.getElementById('calendarDates');
        if (!datesContainer) return;

        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        const today = new Date();
        
        const firstDay = new Date(year, month, 1);
        const startDate = new Date(firstDay);
        const dayOfWeek = (firstDay.getDay() + 6) % 7;
        startDate.setDate(firstDay.getDate() - dayOfWeek);
        
        const dates = [];
        for (let i = 0; i < 42; i++) {
            const date = new Date(startDate);
            date.setDate(startDate.getDate() + i);
            dates.push(date);
        }

        datesContainer.innerHTML = dates.map(date => {
            const isCurrentMonth = date.getMonth() === month;
            const isToday = this.isSameDay(date, today);
            const isHoliday = this.isHoliday(date);
            
            let classes = [];
            if (!isCurrentMonth) classes.push('other-month');
            if (isToday) classes.push('current-day');
            if (isHoliday && isCurrentMonth) classes.push('holiday');
            
            return `<div class="${classes.join(' ')}">${date.getDate()}</div>`;
        }).join('');
    }

    isSameDay(date1, date2) {
        return date1.getDate() === date2.getDate() &&
               date1.getMonth() === date2.getMonth() &&
               date1.getFullYear() === date2.getFullYear();
    }
}
/* ===== FINE WIDGET CALENDARIO ===== */

/* ===== INIZIO WIDGET TODO ===== */
class TodoWidget {
    constructor() {
        this.maxTasks = 6;
        this.todos = this.loadTodos() || this.getDefaultTodos();
        this.init();
    }

    init() {
        this.renderTodos();
        this.bindEvents();
    }

    getDefaultTodos() {
        return [
            { id: 'task_1', text: 'Verificare livelli serbatoi', completed: false },
            { id: 'task_2', text: 'Controllare funzionamento POS', completed: true },
            { id: 'task_3', text: 'Pulizia area distributori', completed: false }
        ];
    }

    loadTodos() {
        return Storage.load(Storage.KEYS.TODO_LIST, null);
    }

    saveTodos() {
        Storage.save(Storage.KEYS.TODO_LIST, this.todos);
    }

    bindEvents() {
        const addBtn = document.getElementById('addTodoBtn');
        const input = document.getElementById('newTodoInput');
        const todoList = document.getElementById('todoList');
        
        if (addBtn) {
            addBtn.addEventListener('click', () => {
                this.addTodo();
            });
        }
        
        if (input) {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.addTodo();
                }
            });
        }
        
        if (todoList) {
            todoList.addEventListener('click', (e) => {
                if (e.target.classList.contains('todo-delete') || e.target.closest('.todo-delete')) {
                    this.deleteTodo(e.target.closest('li'));
                }
            });
            
            todoList.addEventListener('change', (e) => {
                if (e.target.type === 'checkbox') {
                    this.updateTodoStatus(e.target);
                }
            });
        }
    }

    addTodo() {
        const input = document.getElementById('newTodoInput');
        const text = input.value.trim();
        
        if (!text) {
            input.focus();
            return;
        }
        
        if (this.todos.length >= this.maxTasks) {
            showMessage(`Massimo ${this.maxTasks} task consentiti`, 'warning');
            return;
        }
        
        const newTodo = {
            id: 'task_' + Date.now(),
            text: text,
            completed: false
        };
        
        this.todos.push(newTodo);
        this.saveTodos();
        this.addTodoToDOM(newTodo);
        input.value = '';
        input.focus();
    }

    addTodoToDOM(todo) {
        const todoList = document.getElementById('todoList');
        const li = document.createElement('li');
        
        li.setAttribute('data-todo-id', todo.id);
        li.innerHTML = `
            <input type="checkbox" id="${todo.id}" ${todo.completed ? 'checked' : ''}>
            <label for="${todo.id}">${todo.text}</label>
            <div class="todo-delete"></div>
        `;
        
        todoList.appendChild(li);
        
        // Animazione di entrata
        li.style.opacity = '0';
        li.style.transform = 'translateX(-20px)';
        
        requestAnimationFrame(() => {
            li.style.transition = 'all 0.3s ease';
            li.style.opacity = '1';
            li.style.transform = 'translateX(0)';
        });
    }

    deleteTodo(todoItem) {
        if (confirm('Eliminare questo task?')) {
            const todoId = todoItem.getAttribute('data-todo-id');
            this.todos = this.todos.filter(todo => todo.id !== todoId);
            this.saveTodos();
            
            // Animazione di uscita
            todoItem.style.transition = 'all 0.3s ease';
            todoItem.style.opacity = '0';
            todoItem.style.transform = 'translateX(20px)';
            
            setTimeout(() => {
                todoItem.remove();
            }, 300);
        }
    }

    updateTodoStatus(checkbox) {
        const todoId = checkbox.id;
        const todo = this.todos.find(t => t.id === todoId);
        if (todo) {
            todo.completed = checkbox.checked;
            this.saveTodos();
        }
    }

    renderTodos() {
        const todoList = document.getElementById('todoList');
        if (!todoList) return;
        
        todoList.innerHTML = '';
        this.todos.forEach(todo => {
            this.addTodoToDOM(todo);
        });
    }

    getTodos() {
        return [...this.todos];
    }

    setTodos(newTodos) {
        this.todos = newTodos.slice(0, this.maxTasks);
        this.saveTodos();
        this.renderTodos();
    }
}
/* ===== FINE WIDGET TODO ===== */

/* ===== INIZIO FUNZIONI AGGIORNAMENTO DISPLAY ===== */
function updateTimeDisplay() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
    const dateString = now.toLocaleDateString('it-IT', { 
        weekday: 'long', 
        day: 'numeric', 
        month: 'long' 
    });
    
    const currentTimeEl = document.getElementById('currentTime');
    const currentDateEl = document.getElementById('currentDateDisplay');
    
    if (currentTimeEl) {
        currentTimeEl.textContent = timeString;
    }
    
    if (currentDateEl) {
        // Capitalizza la prima lettera del giorno
        const formattedDate = dateString.charAt(0).toUpperCase() + dateString.slice(1);
        currentDateEl.textContent = formattedDate;
    }
}
/* ===== FINE FUNZIONI AGGIORNAMENTO DISPLAY ===== */

/* ===== INIZIO INIZIALIZZAZIONE CAMPI ===== */
function initializeControlInputs() {
    const dateInput = document.getElementById('controlDate');
    const turnoInput = document.getElementById('controlTurno');
    
    if (dateInput && !dateInput.value) {
        const today = new Date();
        const day = today.getDate().toString().padStart(2, '0');
        const month = (today.getMonth() + 1).toString().padStart(2, '0');
        const year = today.getFullYear();
        dateInput.value = `${day}/${month}/${year}`;
    }
    
    if (turnoInput && !turnoInput.value) {
        const savedTurno = Storage.load(Storage.KEYS.CURRENT_TURNO, '1');
        turnoInput.value = savedTurno;
    }
}

function initializeNotes() {
    const notesArea = document.getElementById('notesArea');
    if (notesArea) {
        const savedNotes = Storage.load(Storage.KEYS.NOTES, '');
        notesArea.value = savedNotes;
        
        // Auto-save delle note con debounce
        const debouncedSave = debounce((value) => {
            Storage.save(Storage.KEYS.NOTES, value);
        }, 1000);
        
        notesArea.addEventListener('input', (e) => {
            debouncedSave(e.target.value);
        });
    }
}
/* ===== FINE INIZIALIZZAZIONE CAMPI ===== */

/* ===== INIZIO FUNZIONI IMPORT/EXPORT ===== */
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
                
                if (confirm('Importare TUTTI i dati? Questo sovrascriverà i dati attuali di tutte le sezioni.')) {
                    // Importa dati Index
                    if (importedData.index) {
                        if (importedData.index.date) {
                            const dateInput = document.getElementById('controlDate');
                            if (dateInput) dateInput.value = importedData.index.date;
                        }
                        
                        if (importedData.index.turno) {
                            const turnoInput = document.getElementById('controlTurno');
                            if (turnoInput) turnoInput.value = importedData.index.turno;
                            Storage.save(Storage.KEYS.CURRENT_TURNO, importedData.index.turno);
                        }
                        
                        if (importedData.index.notes) {
                            const notesArea = document.getElementById('notesArea');
                            if (notesArea) notesArea.value = importedData.index.notes;
                            Storage.save(Storage.KEYS.NOTES, importedData.index.notes);
                        }
                        
                        if (importedData.index.todos && todoWidget) {
                            todoWidget.setTodos(importedData.index.todos);
                        }
                    }
                    
                    // Importa dati Erogatori
                    if (importedData.erogatori) {
                        Storage.save(Storage.KEYS.DISPENSERS, importedData.erogatori);
                    }
                    
                    // Importa dati Carico
                    if (importedData.carico) {
                        if (importedData.carico.totals) {
                            Storage.save(Storage.KEYS.CARICO_TOTALS, importedData.carico.totals);
                        }
                        if (importedData.carico.history) {
                            Storage.save(Storage.KEYS.CARICO_HISTORY, importedData.carico.history);
                        }
                    }
                    
                    // Importa altri dati delle pagine
                    if (importedData.vendite) {
                        Storage.save(Storage.KEYS.VENDITE_DATA, importedData.vendite);
                    }
                    
                    if (importedData.monetario) {
                        Storage.save(Storage.KEYS.MONETARIO_DATA, importedData.monetario);
                    }
                    
                    if (importedData.credito) {
                        Storage.save(Storage.KEYS.CREDITO_DATA, importedData.credito);
                    }
                    
                    if (importedData.registro) {
                        Storage.save(Storage.KEYS.REGISTRO_DATA, importedData.registro);
                    }
                    
                    showMessage('Tutti i dati importati con successo!', 'success');
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
            
            // Dati Index
            index: {
                date: document.getElementById('controlDate')?.value || '',
                turno: document.getElementById('controlTurno')?.value || '',
                notes: document.getElementById('notesArea')?.value || '',
                todos: todoWidget ? todoWidget.getTodos() : []
            },
            
            // Dati Erogatori
            erogatori: Storage.load(Storage.KEYS.DISPENSERS, {}),
            
            // Dati Carico
            carico: {
                totals: Storage.load(Storage.KEYS.CARICO_TOTALS, {}),
                history: Storage.load(Storage.KEYS.CARICO_HISTORY, [])
            },
            
            // Altri dati delle pagine
            vendite: Storage.load(Storage.KEYS.VENDITE_DATA, {}),
            monetario: Storage.load(Storage.KEYS.MONETARIO_DATA, {}),
            credito: Storage.load(Storage.KEYS.CREDITO_DATA, {}),
            registro: Storage.load(Storage.KEYS.REGISTRO_DATA, {})
        };

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
        
        showMessage('Backup completo esportato con successo!', 'success');
    } catch (error) {
        showMessage('Errore durante l\'esportazione completa', 'error');
        console.error('Errore export:', error);
    }
}
/* ===== FINE FUNZIONI IMPORT/EXPORT ===== */

/* ===== INIZIO FUNZIONE STAMPA ===== */
function stampaDati() {
    showMessage('Funzione stampa in fase di sviluppo', 'info');
    // TODO: Implementazione futura della stampa
}
/* ===== FINE FUNZIONE STAMPA ===== */

/* ===== INIZIO FUNZIONE INFO (DEPRECATA) ===== */
// Questa funzione non è più utilizzata - INFO ora porta alla pagina dedicata
/* ===== FINE FUNZIONE INFO (DEPRECATA) ===== */

/* ===== INIZIO AUTO-UPDATE ===== */
function startAutoUpdate() {
    // Aggiorna l'ora ogni minuto
    setInterval(() => {
        updateTimeDisplay();
    }, 60000);
    
    // Salva i dati del turno quando cambiano
    const turnoInput = document.getElementById('controlTurno');
    if (turnoInput) {
        turnoInput.addEventListener('change', (e) => {
            Storage.save(Storage.KEYS.CURRENT_TURNO, e.target.value);
        });
    }
}
/* ===== FINE AUTO-UPDATE ===== */

/* ===== INIZIO INIZIALIZZAZIONE PAGINA ===== */
document.addEventListener('DOMContentLoaded', function() {
    try {
        // Inizializza i widget specifici della homepage
        calendarWidget = new CalendarWidget();
        todoWidget = new TodoWidget();
        
        // Inizializza i campi di controllo
        initializeControlInputs();
        
        // Inizializza le note
        initializeNotes();
        
        // Avvia l'aggiornamento automatico
        startAutoUpdate();
        
        // Aggiorna immediatamente l'ora
        updateTimeDisplay();
        
        console.log('✅ CERBERO Homepage inizializzata correttamente');
        showMessage('Sistema CERBERO caricato', 'success');
        
    } catch (error) {
        console.error('❌ Errore nell\'inizializzazione:', error);
        showMessage('Errore nell\'inizializzazione del sistema', 'error');
    }
});
/* ===== FINE INIZIALIZZAZIONE PAGINA ===== */

/* ===== INIZIO GESTIONE ERRORI ===== */
window.addEventListener('error', function(e) {
    console.error('Errore JavaScript:', e.error);
    showMessage('Si è verificato un errore. Controlla la console.', 'error');
});
/* ===== FINE GESTIONE ERRORI ===== */

/* ===== INIZIO SALVATAGGIO AUTOMATICO ===== */
window.addEventListener('beforeunload', function(e) {
    const notesArea = document.getElementById('notesArea');
    if (notesArea && notesArea.value) {
        Storage.save(Storage.KEYS.NOTES, notesArea.value);
    }
    
    const turnoInput = document.getElementById('controlTurno');
    if (turnoInput && turnoInput.value) {
        Storage.save(Storage.KEYS.CURRENT_TURNO, turnoInput.value);
    }
});
/* ===== FINE SALVATAGGIO AUTOMATICO ===== */

/* ===== INIZIO EFFETTO BLUR SELEZIONE ===== */
let selectedBox = null;

// Funzione per selezionare un box
function selectBox(box) {
    // Se c'è già un box selezionato, deselezionalo
    if (selectedBox) {
        selectedBox.classList.remove('selected');
    }
    
    // Seleziona il nuovo box
    selectedBox = box;
    box.classList.add('selected');
    
    // Attiva l'overlay blur
    const blurOverlay = document.getElementById('blurOverlay');
    const closeSelection = document.getElementById('closeSelection');
    
    if (blurOverlay) blurOverlay.classList.add('active');
    if (closeSelection) closeSelection.classList.add('active');
    
    // Impedisci lo scroll del body
    document.body.style.overflow = 'hidden';
}

// Funzione per deselezionare
function deselectBox() {
    if (selectedBox) {
        selectedBox.classList.remove('selected');
        selectedBox = null;
    }
    
    // Disattiva l'overlay blur
    const blurOverlay = document.getElementById('blurOverlay');
    const closeSelection = document.getElementById('closeSelection');
    
    if (blurOverlay) blurOverlay.classList.remove('active');
    if (closeSelection) closeSelection.classList.remove('active');
    
    // Ripristina lo scroll del body
    document.body.style.overflow = '';
}

// Inizializza gli event listeners per l'effetto blur
function initializeBlurEffect() {
    // Click sui box per selezionarli
    const boxes = document.querySelectorAll('.box');
    boxes.forEach(box => {
        box.addEventListener('click', function(e) {
            // Se il box è già selezionato, non fare nulla
            if (this.classList.contains('selected')) {
                return;
            }
            
            // Previeni la propagazione per evitare conflitti
            e.stopPropagation();
            selectBox(this);
        });
    });
    
    // Click sul pulsante chiudi
    const closeSelection = document.getElementById('closeSelection');
    if (closeSelection) {
        closeSelection.addEventListener('click', function(e) {
            e.stopPropagation();
            deselectBox();
        });
    }
    
    // Click sull'overlay per chiudere
    const blurOverlay = document.getElementById('blurOverlay');
    if (blurOverlay) {
        blurOverlay.addEventListener('click', function(e) {
            e.stopPropagation();
            deselectBox();
        });
    }
    
    // Tasto ESC per chiudere
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && selectedBox) {
            deselectBox();
        }
    });
    
    // Previeni che i click all'interno del box selezionato chiudano la selezione
    document.addEventListener('click', function(e) {
        if (selectedBox && selectedBox.contains(e.target)) {
            e.stopPropagation();
        }
    });
}
/* ===== FINE EFFETTO BLUR SELEZIONE ===== */

/* ===== FINE JAVASCRIPT ===== */