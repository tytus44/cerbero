/* ===== CERBERO - GESTIONE STORAGE UNIFICATO v2.0 ===== */

const Storage = {
    // Elenco completo di tutte le chiavi usate nell'applicazione
    KEYS: {
        // === CONFIGURAZIONE SISTEMA ===
        THEME: 'cerbero_theme',
        NOTES: 'cerbero_notes',
        TODO_LIST: 'cerbero_todo',
        CURRENT_TURNO: 'cerbero_turno',
        
        // === DATI OPERATIVI PRINCIPALI ===
        REGISTRO_DATA: 'cerbero_registro',
        MONETARIO_DATA: 'cerbero_monetario',
        VIRTUALSTATION_DATA: 'cerbero_virtual_station_data', // <<< NOME UNIFORMATO QUI
        VERSAMENTO_DATA: 'cerbero_versamento',
        ORDER_HISTORY: 'cerbero_order_history',
        CREDITO_DATA: 'cerbero_credito',
        ELABORAZIONE_DATA: 'cerbero_elaborazione_data',
        
        // === DATI CARICO CARBURANTI ===
        CARICO_TOTALS: 'cerbero_carico_totals',
        CARICO_HISTORY: 'cerbero_carico_history',
        CARICO_RIMANENZE: 'cerbero_carico_rimanenze',
        
        // === ANALYTICS E REPORTING ===
        VENDITE_HISTORY: 'cerbero_vendite_history',
        
        // === PREFERENZE UI ===
        HISTORY_COLLAPSED: 'cerbero_carico_history_collapsed'
    },

    // Elenco delle chiavi che non devono essere convertite in JSON
    _plainTextKeys: [
        'cerbero_theme', 
        'cerbero_notes', 
        'cerbero_turno',
        'cerbero_carico_history_collapsed'
    ],

    save: function(key, data) {
        try {
            const dataToStore = this._plainTextKeys.includes(key) 
                ? data 
                : JSON.stringify(data);
            localStorage.setItem(key, dataToStore);
            return true;
        } catch (error) {
            console.error(`[STORAGE] Errore nel salvare i dati per la chiave "${key}":`, error);
            return false;
        }
    },

    load: function(key, defaultValue = null) {
        try {
            const data = localStorage.getItem(key);
            if (data === null) return defaultValue;
            
            return this._plainTextKeys.includes(key) 
                ? data 
                : JSON.parse(data);
        } catch (error) {
            console.error(`[STORAGE] Errore nel caricare i dati per la chiave "${key}":`, error);
            return defaultValue;
        }
    },

    remove: function(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error(`[STORAGE] Errore nel rimuovere la chiave "${key}":`, error);
            return false;
        }
    },

    clearAll: function() {
        try {
            Object.values(this.KEYS).forEach(key => {
                localStorage.removeItem(key);
            });
            return true;
        } catch (error) {
            console.error('[STORAGE] Errore nella cancellazione completa:', error);
            return false;
        }
    },
    
    getStorageInfo: function() {
        const info = {
            totalKeys: 0,
            totalSize: 0,
            keys: {}
        };

        Object.entries(this.KEYS).forEach(([keyName, keyValue]) => {
            const data = localStorage.getItem(keyValue);
            if (data !== null) {
                info.totalKeys++;
                info.totalSize += data.length;
                info.keys[keyName] = {
                    size: data.length,
                    hasData: true
                };
            } else {
                info.keys[keyName] = {
                    size: 0,
                    hasData: false
                };
            }
        });

        return info;
    },

    verifyIntegrity: function() {
        const report = {
            isValid: true,
            errors: [],
            warnings: []
        };

        Object.entries(this.KEYS).forEach(([keyName, keyValue]) => {
            try {
                const data = this.load(keyValue);
                if (['REGISTRO_DATA', 'MONETARIO_DATA'].includes(keyName)) {
                    if (!data || (typeof data === 'object' && Object.keys(data).length === 0)) {
                        report.warnings.push(`Dati mancanti per sezione critica: ${keyName}`);
                    }
                }
            } catch (error) {
                report.isValid = false;
                report.errors.push(`Errore nel caricamento di ${keyName}: ${error.message}`);
            }
        });

        return report;
    }
};