/* ===== CERBERO - GESTIONE STORAGE UNIFICATO v2.1 ===== */

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
        // NUOVE CHIAVI AGGIUNTE PER IL SUPPORTO COMPLETO
        CORRISPETTIVI_FATTURATO_MANUALE: 'cerbero_fatturato_manuale',
        CURRENT_TURNO: 'cerbero_turno',
        REGISTRO_DATA: 'cerbero_registro',
        DISPENSERS: 'cerbero_erogatori',
        HISTORY_COLLAPSED: 'cerbero_history_collapsed'
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
            
            // Debug logging (rimuovi in produzione se necessario)
            if (localStorage.getItem('debug_storage') === 'true') {
                console.log(`[STORAGE] Salvato ${key}:`, data);
            }
        } catch (error) {
            console.error(`[STORAGE] Errore nel salvare i dati per la chiave "${key}":`, error);
        }
    },
    load: function(key, defaultValue = null) {
        try {
            const data = localStorage.getItem(key);
            if (data === null) {
                if (localStorage.getItem('debug_storage') === 'true') {
                    console.log(`[STORAGE] Chiave "${key}" non trovata, uso valore di default:`, defaultValue);
                }
                return defaultValue;
            }
            const result = this._plainTextKeys.includes(key) ? data : JSON.parse(data);
            
            if (localStorage.getItem('debug_storage') === 'true') {
                console.log(`[STORAGE] Caricato ${key}:`, result);
            }
            return result;
        } catch (error) {
            console.error(`[STORAGE] Errore nel caricare i dati per la chiave "${key}":`, error);
            return defaultValue;
        }
    },
    remove: function(key) {
        localStorage.removeItem(key);
        if (localStorage.getItem('debug_storage') === 'true') {
            console.log(`[STORAGE] Rimossa chiave: ${key}`);
        }
    },
    // NUOVA FUNZIONE PER DEBUG
    debugAll: function() {
        console.log('=== DEBUG STORAGE COMPLETO ===');
        Object.entries(this.KEYS).forEach(([keyName, keyValue]) => {
            const data = this.load(keyValue);
            if (data !== null) {
                console.log(`✅ ${keyName} (${keyValue}):`, data);
            } else {
                console.log(`❌ ${keyName} (${keyValue}): VUOTO`);
            }
        });
        console.log('=== FINE DEBUG STORAGE ===');
    },
    // FUNZIONE PER VERIFICARE L'INTEGRITÀ DEI DATI
    checkIntegrity: function() {
        console.log('🔍 Controllo integrità dati Storage...');
        let validKeys = 0;
        let totalSize = 0;
        
        Object.entries(this.KEYS).forEach(([keyName, keyValue]) => {
            const data = localStorage.getItem(keyValue);
            if (data !== null) {
                validKeys++;
                totalSize += data.length;
                
                // Verifica se è un JSON valido per le chiavi non di testo semplice
                if (!this._plainTextKeys.includes(keyValue)) {
                    try {
                        JSON.parse(data);
                    } catch (e) {
                        console.warn(`⚠️ Dati corrotti per ${keyName}: JSON non valido`);
                    }
                }
            }
        });
        
        console.log(`📊 Chiavi valide: ${validKeys}/${Object.keys(this.KEYS).length}`);
        console.log(`💾 Dimensione totale: ${(totalSize / 1024).toFixed(2)} KB`);
        
        // Controlla spazio disponibile localStorage
        try {
            const testKey = 'storage_test_' + Date.now();
            const testData = 'x'.repeat(1024); // 1KB di test
            localStorage.setItem(testKey, testData);
            localStorage.removeItem(testKey);
            console.log('✅ LocalStorage funzionante');
        } catch (e) {
            console.error('❌ Problema con localStorage:', e.message);
        }
    },
    // FUNZIONE PER PULIZIA DATI ORFANI
    cleanup: function() {
        console.log('🧹 Pulizia dati orfani...');
        const validKeys = Object.values(this.KEYS);
        let removedCount = 0;
        
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('cerbero_') && !validKeys.includes(key)) {
                console.log(`🗑️ Rimuovo chiave orfana: ${key}`);
                localStorage.removeItem(key);
                removedCount++;
                i--; // Adjusts for the removed item
            }
        }
        
        console.log(`✅ Pulizia completata. Rimosse ${removedCount} chiavi orfane.`);
    }
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
        window.dispatchEvent(new CustomEvent('theme-changed', {
            detail: { theme: newTheme }
        }));
    },
    updateIcons: function() {
        const isDark = document.documentElement.classList.contains('dark-theme');
        const lightIcon = document.getElementById('theme-icon-light');
        const darkIcon = document.getElementById('theme-icon-dark');
        if (lightIcon && darkIcon) {
            lightIcon.classList.toggle('theme-icon-hidden', isDark);
            darkIcon.classList.toggle('theme-icon-hidden', !isDark);
        }
    },
    getCurrentTheme: function() {
        return document.documentElement.classList.contains('dark-theme') ? 'dark' : 'light';
    }
};

// ===== FUNZIONI HELPER GLOBALI PER DEBUG ===== 
// Puoi chiamare queste funzioni dalla console del browser

// Vede tutti i dati salvati
window.debugStorage = () => Storage.debugAll();

// Controlla l'integrità dei dati
window.checkStorageIntegrity = () => Storage.checkIntegrity();

// Pulisce i dati orfani
window.cleanupStorage = () => Storage.cleanup();

// Abilita/disabilita logging dettagliato
window.enableStorageDebug = () => {
    localStorage.setItem('debug_storage', 'true');
    console.log('🔍 Debug Storage abilitato');
};

window.disableStorageDebug = () => {
    localStorage.removeItem('debug_storage');
    console.log('🔇 Debug Storage disabilitato');
};

// Mostra statistiche storage
window.showStorageStats = () => {
    console.log('📈 STATISTICHE STORAGE:');
    let totalItems = 0;
    let totalSize = 0;
    let cerberoItems = 0;
    
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        const value = localStorage.getItem(key);
        totalItems++;
        totalSize += key.length + value.length;
        
        if (key.startsWith('cerbero_')) {
            cerberoItems++;
        }
    }
    
    console.log(`📦 Elementi totali: ${totalItems}`);
    console.log(`🎯 Elementi CeRBERO: ${cerberoItems}`);
    console.log(`💾 Dimensione totale: ${(totalSize / 1024).toFixed(2)} KB`);
    console.log(`🏠 Spazio stimato disponibile: ${((5 * 1024 * 1024 - totalSize) / 1024).toFixed(2)} KB`);
};

console.log('🗄️ Storage CeRBERO v2.1 inizializzato');
console.log('💡 Comandi debug disponibili: debugStorage(), checkStorageIntegrity(), cleanupStorage(), showStorageStats()');
console.log('🔍 Per abilitare logging: enableStorageDebug() | Per disabilitare: disableStorageDebug()');