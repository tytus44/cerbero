/* ===== CERBERO - GESTIONE STORAGE UNIFICATO v2.0 ===== */

const Storage = {
    KEYS: {
        THEME: 'cerbero_theme',
        NOTES: 'cerbero_notes',
        TODO_LIST: 'cerbero_todo',
        CONTACTS: 'cerbero_contacts',
        MONETARIO_DATA: 'cerbero_monetario',
        VIRTUALSTATION_DATA: 'cerbero_virtual_station_data',
        VERSAMENTO_DATA: 'cerbero_versamento',
        ORDER_HISTORY: 'cerbero_order_history',
        CREDITO_DATA: 'cerbero_credito',
        CARICO_TOTALS: 'cerbero_carico_totals',
        CARICO_HISTORY: 'cerbero_carico_history',
        CARICO_RIMANENZE: 'cerbero_carico_rimanenze',
        VENDITE_HISTORY: 'cerbero_vendite_history',
    },
    _plainTextKeys: [
        'cerbero_theme', 
        'cerbero_notes', 
        'cerbero_turno',
        'cerbero_carico_history_collapsed'
    ],
    save: function(key, data) {
        try {
            const dataToStore = this._plainTextKeys.includes(key) ? data : JSON.stringify(data);
            localStorage.setItem(key, dataToStore);
        } catch (error) {
            console.error(`[STORAGE] Errore nel salvare i dati per la chiave "${key}":`, error);
        }
    },
    load: function(key, defaultValue = null) {
        try {
            const data = localStorage.getItem(key);
            if (data === null) return defaultValue;
            return this._plainTextKeys.includes(key) ? data : JSON.parse(data);
        } catch (error) {
            console.error(`[STORAGE] Errore nel caricare i dati per la chiave "${key}":`, error);
            return defaultValue;
        }
    },
    remove: function(key) {
        localStorage.removeItem(key);
    },
};

// ===== GESTIONE TEMA CENTRALIZZATA =====
const ThemeManager = {
    init: function() {
        const themeSwitcher = document.getElementById('theme-switcher');
        this.updateIcons();
        if (themeSwitcher) {
            themeSwitcher.addEventListener('click', (e) => {
                e.preventDefault();
                this.toggleTheme();
            });
        }
    },
    toggleTheme: function() {
        const isDark = document.documentElement.classList.toggle('dark-theme');
        const newTheme = isDark ? 'dark' : 'light';
        Storage.save(Storage.KEYS.THEME, newTheme);
        this.updateIcons();
        window.dispatchEvent(new CustomEvent('theme-changed'));
    },
    updateIcons: function() {
        const isDark = document.documentElement.classList.contains('dark-theme');
        const lightIcon = document.getElementById('theme-icon-light');
        const darkIcon = document.getElementById('theme-icon-dark');
        if (lightIcon && darkIcon) {
            lightIcon.classList.toggle('theme-icon-hidden', isDark);
            darkIcon.classList.toggle('theme-icon-hidden', !isDark);
        }
    }
};