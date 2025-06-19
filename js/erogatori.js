/* ===== GESTIONE STORAGE IN MEMORIA ===== */
const CerberoStorage = {
    data: {},

    save: function(key, data) {
        try {
            this.data[key] = JSON.parse(JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('Errore nel salvare i dati:', error);
            return false;
        }
    },

    load: function(key, defaultValue = null) {
        try {
            const data = this.data[key];
            if (!data) return defaultValue;
            return JSON.parse(JSON.stringify(data));
        } catch (error) {
            console.error('Errore nel caricare i dati per', key, ':', error);
            return defaultValue;
        }
    },

    remove: function(key) {
        try {
            delete this.data[key];
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
        return CerberoStorage.load('cerbero_dispensers', {});
    }

    saveDispenserData() {
        CerberoStorage.save('cerbero_dispensers', this.dispensers);
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
                    
                    if (confirm('Importare i dati? Questo sovrascriverà i dati attuali.')) {
                        if (importedData.dispensers) {
                            this.dispensers = importedData.dispensers;
                            this.saveDispenserData();
                            this.loadSavedData();
                            showMessage('Dati importati con successo!', 'success');
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
            
            showMessage('Tutti i dati sono stati cancellati', 'info');
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
}

/* ===== FUNZIONI IMPORT/EXPORT ===== */
function importaDatiCompleti() {
    if (dispenserManager) {
        dispenserManager.importData();
    }
}

function esportaDatiCompleti() {
    if (dispenserManager) {
        dispenserManager.exportData();
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
• Salvataggio automatico dei dati
• Gestione rollover contatori
• Import/Export dati completi

Erogatori configurati:
• Erogatore 1-2 (Servito) - 5 prodotti con AdBlue
• Erogatore 3 (Servito) - 4 prodotti  
• Erogatore 4 (Iperself) - 4 prodotti
• Erogatore 5 (Servito) - 4 prodotti
• Erogatore 6 (Iperself) - 4 prodotti
• Erogatore 7 (Iperself) - 4 prodotti

Design System CERBERO:
• Interfaccia uniforme e moderna
• Animazioni fluide e responsive
• Glassmorphism effect sui componenti

I dati vengono salvati automaticamente in memoria durante la sessione.
    `;
    alert(infoMessage);
}

/* ===== INIZIALIZZAZIONE ===== */
let dispenserManager;

document.addEventListener('DOMContentLoaded', function() {
    try {
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