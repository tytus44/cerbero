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

/* ===== UTILITY PER MESSAGGI TOAST ===== */
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

/* ===== GESTIONE EROGATORI ===== */
class DispenserManager {
    constructor() {
        this.dispensers = this.loadDispenserData();
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadSavedData();
    }

    loadDispenserData() {
        try {
            const data = Storage.load(Storage.KEYS.DISPENSERS, {});
            console.log('📂 Dati erogatori caricati da localStorage:', data);
            return data;
        } catch (error) {
            console.error('❌ Errore nel caricare i dati erogatori:', error);
            return {};
        }
    }

    saveDispenserData() {
        try {
            const success = Storage.save(Storage.KEYS.DISPENSERS, this.dispensers);
            if (success) {
                console.log('📁 Dati erogatori salvati in localStorage');
            } else {
                console.error('❌ Errore nel salvare i dati erogatori');
            }
            return success;
        } catch (error) {
            console.error('❌ Errore critico nel salvataggio:', error);
            return false;
        }
    }

    bindEvents() {
        // Event delegation per tutti gli input
        document.addEventListener('input', (e) => {
            if (e.target.classList.contains('grid-input') && !e.target.readOnly) {
                this.handleInputChange(e.target);
            }
        });

        // Auto-save quando l'utente lascia un campo
        document.addEventListener('blur', (e) => {
            if (e.target.classList.contains('grid-input') && !e.target.readOnly) {
                this.saveDispenserData();
            }
        }, true);
    }

    handleInputChange(input) {
        const dispenser = input.dataset.dispenser;
        const product = input.dataset.product;
        const role = input.dataset.role;
        const value = parseFloat(input.value) || 0;

        console.log(`🔧 Modifica input: ${dispenser}-${product}-${role} = ${value}`);

        // Inizializza la struttura dati se non esiste
        if (!this.dispensers[dispenser]) {
            this.dispensers[dispenser] = {};
        }
        if (!this.dispensers[dispenser][product]) {
            this.dispensers[dispenser][product] = {};
        }

        // Salva il valore
        this.dispensers[dispenser][product][role] = value;

        // Calcola i litri se sono stati inseriti sia iniziali che finali
        if (role === 'initial' || role === 'final') {
            this.calculateLiters(dispenser, product);
        }

        // Salva immediatamente i dati
        this.saveDispenserData();
    }

    calculateLiters(dispenser, product) {
        const data = this.dispensers[dispenser]?.[product];
        if (!data) return;

        const initial = data.initial || 0;
        const final = data.final || 0;
        
        let liters = 0;
        if (final >= initial) {
            liters = final - initial;
        } else {
            // Gestisce il caso di rollover del contatore
            liters = (999999 - initial) + final + 1;
        }

        // Aggiorna il campo litri
        const litersInput = document.querySelector(
            `input[data-dispenser="${dispenser}"][data-product="${product}"][data-role="liters"]`
        );
        
        if (litersInput) {
            litersInput.value = liters.toFixed(2);
            this.dispensers[dispenser][product].liters = liters;
        }
    }

    loadSavedData() {
        // Carica i dati salvati negli input
        Object.keys(this.dispensers).forEach(dispenser => {
            Object.keys(this.dispensers[dispenser]).forEach(product => {
                const data = this.dispensers[dispenser][product];
                
                ['initial', 'final', 'liters'].forEach(role => {
                    if (data[role] !== undefined) {
                        const input = document.querySelector(
                            `input[data-dispenser="${dispenser}"][data-product="${product}"][data-role="${role}"]`
                        );
                        if (input) {
                            input.value = role === 'liters' ? 
                                data[role].toFixed(2) : 
                                data[role];
                        }
                    }
                });
            });
        });
    }

    exportData() {
        try {
            const exportData = {
                timestamp: new Date().toISOString(),
                version: '1.0',
                dispensers: this.dispensers,
                summary: this.generateSummary()
            };

            const dataStr = JSON.stringify(exportData, null, 2);
            const dataBlob = new Blob([dataStr], {type: 'application/json'});
            const url = URL.createObjectURL(dataBlob);
            
            const link = document.createElement('a');
            link.href = url;
            link.download = `cerbero_erogatori_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            
            showMessage('Dati erogatori esportati con successo!', 'success');
        } catch (error) {
            showMessage('Errore durante l\'esportazione', 'error');
        }
    }

    importData() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        
        input.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const importedData = JSON.parse(e.target.result);
                    
                    if (confirm('Importare i dati? Questo sovrascriverà i dati attuali degli erogatori.')) {
                        if (importedData.dispensers) {
                            this.dispensers = importedData.dispensers;
                            this.saveDispenserData();
                            this.loadSavedData();
                            showMessage('Dati erogatori importati con successo!', 'success');
                        } else {
                            showMessage('File non valido: formato non riconosciuto', 'error');
                        }
                    }
                } catch (error) {
                    showMessage('Errore: file non valido', 'error');
                }
            };
            reader.readAsText(file);
        });
        
        input.click();
    }

    generateSummary() {
        const summary = {};
        const products = ['gasolio', 'diesel', 'benzina', 'hvolution', 'adblue'];
        
        products.forEach(product => {
            summary[product] = {
                totalLiters: 0,
                dispensers: []
            };
        });

        Object.keys(this.dispensers).forEach(dispenser => {
            Object.keys(this.dispensers[dispenser]).forEach(product => {
                const data = this.dispensers[dispenser][product];
                if (data.liters) {
                    summary[product].totalLiters += data.liters;
                    summary[product].dispensers.push({
                        dispenser: dispenser,
                        liters: data.liters
                    });
                }
            });
        });

        return summary;
    }

    clearAllData() {
        if (confirm('Cancellare tutti i dati degli erogatori? Questa azione non può essere annullata.')) {
            this.dispensers = {};
            this.saveDispenserData();
            
            // Pulisce tutti gli input
            document.querySelectorAll('.grid-input').forEach(input => {
                input.value = '';
            });
            
            showMessage('Tutti i dati degli erogatori sono stati cancellati', 'info');
        }
    }

    getTotalsByProduct() {
        const totals = {};
        const products = ['gasolio', 'diesel', 'benzina', 'hvolution', 'adblue'];
        
        products.forEach(product => {
            totals[product] = 0;
            Object.keys(this.dispensers).forEach(dispenser => {
                const data = this.dispensers[dispenser]?.[product];
                if (data?.liters) {
                    totals[product] += data.liters;
                }
            });
        });
        
        return totals;
    }

    // Metodo per sincronizzare con il backup completo
    syncWithSystemData(systemData) {
        if (systemData && systemData.erogatori) {
            this.dispensers = systemData.erogatori;
            this.saveDispenserData();
            this.loadSavedData();
            return true;
        }
        return false;
    }
}

/* ===== FUNZIONI IMPORT/EXPORT INTEGRATE ===== */
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
                    let importSuccess = false;
                    
                    // Importa dati Erogatori
                    if (importedData.erogatori && dispenserManager) {
                        if (dispenserManager.syncWithSystemData(importedData)) {
                            importSuccess = true;
                        }
                    }
                    
                    // Importa altri dati del sistema
                    if (importedData.carico) {
                        if (importedData.carico.totals) {
                            Storage.save(Storage.KEYS.CARICO_TOTALS, importedData.carico.totals);
                            importSuccess = true;
                        }
                        if (importedData.carico.history) {
                            Storage.save(Storage.KEYS.CARICO_HISTORY, importedData.carico.history);
                            importSuccess = true;
                        }
                    }
                    
                    if (importedData.vendite) {
                        Storage.save(Storage.KEYS.VENDITE_DATA, importedData.vendite);
                        importSuccess = true;
                    }
                    
                    if (importedData.monetario) {
                        Storage.save(Storage.KEYS.MONETARIO_DATA, importedData.monetario);
                        importSuccess = true;
                    }
                    
                    if (importedData.credito) {
                        Storage.save(Storage.KEYS.CREDITO_DATA, importedData.credito);
                        importSuccess = true;
                    }
                    
                    if (importedData.registro) {
                        Storage.save(Storage.KEYS.REGISTRO_DATA, importedData.registro);
                        importSuccess = true;
                    }
                    
                    if (importSuccess) {
                        showMessage('Dati importati con successo!', 'success');
                    } else {
                        showMessage('Nessun dato valido trovato nel file', 'warning');
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

function stampaDati() {
    showMessage('Funzione stampa in fase di sviluppo', 'info');
    // TODO: Implementazione futura della stampa
}

/* ===== FUNZIONI GLOBALI ===== */
function showInfo() {
    const infoMessage = `
GESTIONE EROGATORI - CERBERO v1.0

Funzionalità:
• Tracciamento letture iniziali e finali
• Calcolo automatico litri erogati
• Salvataggio automatico con localStorage
• Gestione rollover contatori
• Import/Export integrato con sistema completo

Erogatori configurati:
• Erogatore 1-2 (Servito) - 5 prodotti con AdBlue
• Erogatore 3 (Servito) - 4 prodotti  
• Erogatore 4 (Iperself) - 4 prodotti
• Erogatore 5 (Servito) - 4 prodotti
• Erogatore 6 (Iperself) - 4 prodotti
• Erogatore 7 (Iperself) - 4 prodotti

Storage unificato:
• Compatibile con tutte le pagine CERBERO
• Backup automatico e sincronizzazione
• Persistenza dati tra sessioni

I dati vengono salvati automaticamente in localStorage.
    `;
    alert(infoMessage);
}

/* ===== INIZIALIZZAZIONE ===== */
let dispenserManager;

document.addEventListener('DOMContentLoaded', function() {
    try {
        // Test localStorage prima dell'inizializzazione
        console.log('🧪 Test localStorage...');
        
        // Test di scrittura
        localStorage.setItem('cerbero_test', 'test');
        const testRead = localStorage.getItem('cerbero_test');
        console.log('✅ localStorage funziona:', testRead === 'test');
        localStorage.removeItem('cerbero_test');
        
        // Verifica dati esistenti
        const existingData = localStorage.getItem('cerbero_dispensers');
        console.log('📋 Dati esistenti in localStorage:', existingData);
        
        dispenserManager = new DispenserManager();
        console.log('✅ CERBERO Erogatori inizializzato correttamente');
        showMessage('Sistema Erogatori caricato', 'success');
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

/* ===== SALVATAGGIO AUTOMATICO ===== */
window.addEventListener('beforeunload', function(e) {
    if (dispenserManager) {
        dispenserManager.saveDispenserData();
    }
});

/* ===== FUNZIONI ESPOSTE GLOBALMENTE ===== */
window.exportDispenserData = function() {
    if (dispenserManager) {
        dispenserManager.exportData();
    }
};

window.importDispenserData = function() {
    if (dispenserManager) {
        dispenserManager.importData();
    }
};

window.clearDispenserData = function() {
    if (dispenserManager) {
        dispenserManager.clearAllData();
    }
};

window.getDispenserTotals = function() {
    if (dispenserManager) {
        return dispenserManager.getTotalsByProduct();
    }
    return {};
};

window.getDispenserSummary = function() {
    if (dispenserManager) {
        return {
            products: dispenserManager.getTotalsByProduct(),
            detailed: dispenserManager.generateSummary()
        };
    }
    return {};
};