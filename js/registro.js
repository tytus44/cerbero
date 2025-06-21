/* ===== INIZIO JAVASCRIPT ===== */

/* ===== INIZIO GESTIONE STORAGE UNIFICATO ===== */
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
/* ===== FINE GESTIONE STORAGE UNIFICATO ===== */

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

// Formatta valore euro in formato italiano
function formatEuro(value) {
    if (isNaN(value) || value === null || value === undefined) return '€ 0,00';
    return new Intl.NumberFormat('it-IT', {
        style: 'currency',
        currency: 'EUR'
    }).format(value);
}

// Converte stringa euro in numero
function parseEuro(value) {
    if (!value) return 0;
    // Rimuove simboli euro e spazi, converte virgola in punto per i decimali
    const cleaned = value.replace(/[€\s]/g, '').replace(/\./g, '').replace(',', '.');
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
}

// CORRETTO: Formatta valore litri SELF come XXX,XX (es. 990,04)
function formatLitriSelf(input) {
    let value = input.value.replace(/[^\d,]/g, ''); // Mantiene solo cifre e virgola
    
    if (value === '') {
        input.value = '';
        return;
    }
    
    // Se non c'è virgola, aggiungiamo ,00 alla fine
    if (!value.includes(',')) {
        if (value.length > 0) {
            // Formatta parte intera con punti ogni 3 cifre
            let formattedValue = value.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
            input.value = formattedValue + ',00';
        }
        return;
    }
    
    // Se c'è la virgola, processa normalmente
    const parts = value.split(',');
    let integerPart = parts[0];
    let decimalPart = parts[1] || '';
    
    // Limita decimali a 2 cifre
    if (decimalPart.length > 2) {
        decimalPart = decimalPart.substring(0, 2);
    }
    
    // Formatta parte intera con punti ogni 3 cifre
    if (integerPart.length > 3) {
        integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    }
    
    // Ricompone il valore
    input.value = decimalPart ? `${integerPart},${decimalPart}` : `${integerPart},`;
}

// CORRETTO: Converte stringa litri SELF in numero (es. "990,04" → 990.04)
function parseLitriSelf(value) {
    if (!value) return 0;
    // Rimuove punti (separatori migliaia) e converte virgola in punto decimale
    const cleaned = value.replace(/\./g, '').replace(',', '.');
    const parsed = parseFloat(cleaned) || 0;
    return parsed;
}

// Formatta input importo nel formato corretto (sempre con ,00)
function formatImportoInput(input) {
    let value = input.value.replace(/[^\d,]/g, '');
    
    if (value === '') {
        return;
    }

    // Se non c'è virgola, è solo numero intero - aggiungi ,00
    if (!value.includes(',')) {
        // NON aggiungere ,00 durante la digitazione, solo al blur
        const parts = [value, ''];
        let integerPart = parts[0];
        
        // Formatta parte intera con punti ogni 3 cifre
        if (integerPart.length > 3) {
            integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
        }
        
        input.value = integerPart;
        return;
    }

    // Se c'è la virgola, processa normalmente
    const parts = value.split(',');
    let integerPart = parts[0];
    let decimalPart = parts[1] || '';

    // Limita decimali a 2 cifre
    if (decimalPart.length > 2) {
        decimalPart = decimalPart.substring(0, 2);
    }

    // Formatta parte intera con punti ogni 3 cifre
    if (integerPart.length > 3) {
        integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    }

    // Ricompone il valore
    input.value = decimalPart ? `${integerPart},${decimalPart}` : `${integerPart},`;
}

/* ===== FINE UTILITY ===== */

/* ===== INIZIO GESTIONE REGISTRO UNIFICATA ===== */
const RegistroManager = {
    // Calcola totale fondi inizio turno
    calculateFondiInizio: function() {
        const fondoCassa = parseEuro(document.getElementById('fondo-cassa-inizio')?.value || '0');
        const monete = parseEuro(document.getElementById('monete-inizio')?.value || '0');
        const litriSelf = parseLitriSelf(document.getElementById('litri-self-inizio')?.value || '0');
        const importoSelf = parseEuro(document.getElementById('importo-self-inizio')?.value || '0');
        
        // I litri non contribuiscono al totale monetario, solo gli importi
        return fondoCassa + monete + importoSelf;
    },

    // Calcola totale entrate dalle tabelle
    calculateEntrateTabelle: function() {
        let total = 0;
        const entrateRows = document.querySelectorAll('.bottom-row-grid .box:nth-child(1) .table-input.importo');
        
        entrateRows.forEach(input => {
            const value = parseEuro(input.value);
            if (value > 0) total += value;
        });
        
        return total;
    },

    // Calcola totale fondi fine turno
    calculateFondiFine: function() {
        const fondoCassa = parseEuro(document.getElementById('fondo-cassa-fine')?.value || '0');
        const monete = parseEuro(document.getElementById('monete-fine')?.value || '0');
        const litriSelf = parseLitriSelf(document.getElementById('litri-self-fine')?.value || '0');
        const importoSelf = parseEuro(document.getElementById('importo-self-fine')?.value || '0');
        
        // I litri non contribuiscono al totale monetario, solo gli importi
        return fondoCassa + monete + importoSelf;
    },

    // Calcola totale uscite dalle tabelle
    calculateUsciteTabelle: function() {
        let total = 0;
        const usciteRows = document.querySelectorAll('.bottom-row-grid .box:nth-child(2) .table-input.importo');
        
        usciteRows.forEach(input => {
            const value = parseEuro(input.value);
            if (value > 0) total += value;
        });
        
        return total;
    },

    // Aggiorna il riepilogo secondo la nuova logica
    updateRiepilogo: function() {
        // LOGICA CORRETTA:
        // Totale Entrate = Fondi Inizio + Entrate Tabelle
        // Totale Uscite = Fondi Fine + Uscite Tabelle

        const fondiInizio = this.calculateFondiInizio();
        const entrateTabelle = this.calculateEntrateTabelle();
        const fondiFine = this.calculateFondiFine();
        const usciteTabelle = this.calculateUsciteTabelle();

        const totaleEntrate = fondiInizio + entrateTabelle;
        const totaleUscite = fondiFine + usciteTabelle;
        const differenza = totaleEntrate - totaleUscite;
        const chiusuraPrevista = totaleEntrate;

        // Aggiorna i valori nel DOM
        document.getElementById('totale-entrate').textContent = formatEuro(totaleEntrate);
        document.getElementById('totale-uscite').textContent = formatEuro(totaleUscite);
        document.getElementById('differenza').textContent = formatEuro(differenza);
        document.getElementById('chiusura-prevista').textContent = formatEuro(chiusuraPrevista);
    },

    // Ottieni tutti i dati del registro (struttura unificata)
    getAllData: function() {
        return {
            timestamp: new Date().toISOString(),
            date: new Date().toLocaleDateString('it-IT'),
            fondiInizio: {
                fondoCassa: document.getElementById('fondo-cassa-inizio')?.value || '',
                monete: document.getElementById('monete-inizio')?.value || '',
                litriSelf: document.getElementById('litri-self-inizio')?.value || '',
                importoSelf: document.getElementById('importo-self-inizio')?.value || ''
            },
            fondiFine: {
                fondoCassa: document.getElementById('fondo-cassa-fine')?.value || '',
                monete: document.getElementById('monete-fine')?.value || '',
                litriSelf: document.getElementById('litri-self-fine')?.value || '',
                importoSelf: document.getElementById('importo-self-fine')?.value || ''
            },
            entrate: this.getTableData('.bottom-row-grid .box:nth-child(1) .table-input'),
            uscite: this.getTableData('.bottom-row-grid .box:nth-child(2) .table-input'),
            riepilogo: {
                totaleEntrate: this.calculateFondiInizio() + this.calculateEntrateTabelle(),
                totaleUscite: this.calculateFondiFine() + this.calculateUsciteTabelle(),
                differenza: (this.calculateFondiInizio() + this.calculateEntrateTabelle()) - (this.calculateFondiFine() + this.calculateUsciteTabelle())
            }
        };
    },

    // Estrae dati dalle tabelle
    getTableData: function(selector) {
        const data = [];
        const inputs = document.querySelectorAll(selector);
        
        for (let i = 0; i < inputs.length; i += 3) {
            if (inputs[i]?.value || inputs[i+1]?.value || inputs[i+2]?.value) {
                data.push({
                    nome: inputs[i]?.value || '',
                    prodotto: inputs[i+1]?.value || '',
                    importo: inputs[i+2]?.value || ''
                });
            }
        }
        
        return data;
    },

    // Carica dati nel registro
    loadData: function(data) {
        if (!data) return;

        try {
            // Carica fondi inizio
            if (data.fondiInizio) {
                if (data.fondiInizio.fondoCassa) document.getElementById('fondo-cassa-inizio').value = data.fondiInizio.fondoCassa;
                if (data.fondiInizio.monete) document.getElementById('monete-inizio').value = data.fondiInizio.monete;
                if (data.fondiInizio.litriSelf) document.getElementById('litri-self-inizio').value = data.fondiInizio.litriSelf;
                if (data.fondiInizio.importoSelf) document.getElementById('importo-self-inizio').value = data.fondiInizio.importoSelf;
            }

            // Carica fondi fine
            if (data.fondiFine) {
                if (data.fondiFine.fondoCassa) document.getElementById('fondo-cassa-fine').value = data.fondiFine.fondoCassa;
                if (data.fondiFine.monete) document.getElementById('monete-fine').value = data.fondiFine.monete;
                if (data.fondiFine.litriSelf) document.getElementById('litri-self-fine').value = data.fondiFine.litriSelf;
                if (data.fondiFine.importoSelf) document.getElementById('importo-self-fine').value = data.fondiFine.importoSelf;
            }

            // Carica tabelle entrate
            if (data.entrate) {
                this.loadTableData('.bottom-row-grid .box:nth-child(1) .table-input', data.entrate);
            }

            // Carica tabelle uscite
            if (data.uscite) {
                this.loadTableData('.bottom-row-grid .box:nth-child(2) .table-input', data.uscite);
            }

            this.updateRiepilogo();
            console.log('📊 Dati registro caricati correttamente');
        } catch (error) {
            console.error('❌ Errore nel caricamento dati registro:', error);
        }
    },

    // Carica dati nelle tabelle
    loadTableData: function(selector, data) {
        const inputs = document.querySelectorAll(selector);
        let inputIndex = 0;

        data.forEach(row => {
            if (inputIndex < inputs.length - 2) {
                inputs[inputIndex].value = row.nome || '';
                inputs[inputIndex + 1].value = row.prodotto || '';
                inputs[inputIndex + 2].value = row.importo || '';
                inputIndex += 3;
            }
        });
    },

    // Salva automaticamente i dati nel storage unificato
    autoSave: function() {
        try {
            const data = this.getAllData();
            const success = Storage.save(Storage.KEYS.REGISTRO_DATA, data);
            if (success) {
                console.log('💾 Dati registro salvati in localStorage');
            } else {
                console.error('❌ Errore nel salvare i dati registro');
            }
            return success;
        } catch (error) {
            console.error('❌ Errore critico nel salvataggio registro:', error);
            return false;
        }
    },

    // Carica dati salvati dal storage unificato
    loadSavedData: function() {
        try {
            const savedData = Storage.load(Storage.KEYS.REGISTRO_DATA);
            if (savedData) {
                this.loadData(savedData);
                console.log('📂 Dati registro caricati da localStorage');
            } else {
                console.log('📭 Nessun dato registro salvato');
            }
        } catch (error) {
            console.error('❌ Errore nel caricare dati registro salvati:', error);
        }
    },

    // Metodo per sincronizzare con il backup completo
    syncWithSystemData: function(systemData) {
        if (systemData && systemData.registro) {
            this.loadData(systemData.registro);
            this.autoSave();
            return true;
        }
        return false;
    },

    // Cancella tutti i dati del registro
    clearAllData: function() {
        if (confirm('Cancellare tutti i dati del registro? Questa azione non può essere annullata.')) {
            // Cancella tutti gli input
            document.querySelectorAll('.grid-input, .table-input').forEach(input => {
                input.value = '';
            });
            
            // Reset riepilogo
            this.updateRiepilogo();
            
            // Cancella dal storage
            Storage.remove(Storage.KEYS.REGISTRO_DATA);
            
            showMessage('Tutti i dati del registro sono stati cancellati', 'info');
        }
    },

    // Ottieni statistiche del registro
    getStatistics: function() {
        const data = this.getAllData();
        return {
            entrateCount: data.entrate.length,
            usciteCount: data.uscite.length,
            totaleEntrate: data.riepilogo.totaleEntrate,
            totaleUscite: data.riepilogo.totaleUscite,
            differenza: data.riepilogo.differenza,
            lastUpdate: data.timestamp
        };
    }
};
/* ===== FINE GESTIONE REGISTRO UNIFICATA ===== */

/* ===== INIZIO FUNZIONI IMPORT/EXPORT INTEGRATE ===== */
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
                    
                    // Importa dati Registro
                    if (importedData.registro) {
                        if (RegistroManager.syncWithSystemData(importedData)) {
                            importSuccess = true;
                        }
                    }
                    
                    // Importa altri dati del sistema
                    if (importedData.erogatori) {
                        Storage.save(Storage.KEYS.DISPENSERS, importedData.erogatori);
                        importSuccess = true;
                    }
                    
                    if (importedData.monetario) {
                        Storage.save(Storage.KEYS.MONETARIO_DATA, importedData.monetario);
                        importSuccess = true;
                    }
                    
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
                    
                    if (importedData.credito) {
                        Storage.save(Storage.KEYS.CREDITO_DATA, importedData.credito);
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
            
            // Dati Registro
            registro: Storage.load(Storage.KEYS.REGISTRO_DATA, {}),
            
            // Dati Erogatori
            erogatori: Storage.load(Storage.KEYS.DISPENSERS, {}),
            
            // Dati Monetario
            monetario: Storage.load(Storage.KEYS.MONETARIO_DATA, {}),
            
            // Dati Carico
            carico: {
                totals: Storage.load(Storage.KEYS.CARICO_TOTALS, {}),
                history: Storage.load(Storage.KEYS.CARICO_HISTORY, [])
            },
            
            // Altri dati delle pagine
            vendite: Storage.load(Storage.KEYS.VENDITE_DATA, {}),
            credito: Storage.load(Storage.KEYS.CREDITO_DATA, {})
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
/* ===== FINE FUNZIONI IMPORT/EXPORT INTEGRATE ===== */

/* ===== INIZIO FUNZIONE STAMPA ===== */
function stampaDati() {
    showMessage('Funzione stampa in fase di sviluppo', 'info');
    // TODO: Implementazione futura della stampa
}
/* ===== FINE FUNZIONE STAMPA ===== */

/* ===== INIZIO FUNZIONE INFO ===== */
function showInfo() {
    const infoMessage = `
REGISTRO DI CASSA - CERBERO v1.0

Funzionalità:
• Gestione completa turni di cassa
• Tracciamento entrate e uscite
• Calcolo automatico differenze
• Riepilogo in tempo reale
• Storage unificato con sistema CERBERO

Logica di calcolo:
• Totale Entrate = Fondi Inizio + Entrate Turno
• Totale Uscite = Fondi Fine + Uscite Turno
• Differenza = Entrate - Uscite

Campi gestiti:
• Fondo Cassa: formato euro completo (€ 1.200,54)
• Monete: formato euro completo (€ 1.200,54)
• Litri Self: formato virgola decimale (990,04)
• Importo Self: formato euro completo (€ 1.682,58)

FORMATO CORRETTO CAMPI SELF:
• SELF L: 990,04 (virgola per decimali)
• SELF €: € 1.682,58 (formato euro standard)

Storage unificato:
• Compatibile con tutte le pagine CERBERO
• Backup automatico e sincronizzazione
• Persistenza dati tra sessioni

Colori:
• Verde: Entrate
• Rosso: Uscite
• Azzurro: Prodotti/Spese

Salvataggio automatico attivo in localStorage.
    `;
    alert(infoMessage);
}
/* ===== FINE FUNZIONE INFO ===== */

/* ===== INIZIO EVENT LISTENERS ===== */
document.addEventListener('DOMContentLoaded', function() {
    try {
        // Carica dati salvati
        RegistroManager.loadSavedData();

        // Auto-aggiornamento riepilogo con debounce
        let updateTimeout;
        document.addEventListener('input', function(e) {
            if (e.target.classList.contains('grid-input') || e.target.classList.contains('table-input')) {
                // Formatta input importo in tempo reale  
                if (e.target.classList.contains('importo')) {
                    formatImportoInput(e.target);
                }

                // CORRETTO: Formatta input euro in tempo reale (solo cifre, virgola e punti)
                if (e.target.classList.contains('grid-input') && !e.target.classList.contains('litri-self')) {
                    // Durante l'input, permetti solo cifre, virgola e punti per separatori migliaia
                    let value = e.target.value.replace(/[^\d,.]/g, '');
                    e.target.value = value;
                }

                // CORRETTO: Formatta input litri SELF in tempo reale
                if (e.target.classList.contains('litri-self')) {
                    // Durante l'input, permetti solo cifre e virgola
                    let value = e.target.value.replace(/[^\d,]/g, '');
                    e.target.value = value;
                }

                // Aggiorna riepilogo con debounce
                clearTimeout(updateTimeout);
                updateTimeout = setTimeout(() => {
                    RegistroManager.updateRiepilogo();
                    RegistroManager.autoSave();
                }, 500);
            }
        });

        // Formattazione euro sui campi grid al blur
        document.addEventListener('blur', function(e) {
            if (e.target.classList.contains('grid-input') && !e.target.classList.contains('litri-self')) {
                const value = parseEuro(e.target.value);
                if (value > 0) {
                    e.target.value = formatEuro(value);
                }
                RegistroManager.updateRiepilogo();
                RegistroManager.autoSave();
            }

            // CORRETTO: Formattazione litri SELF al blur
            if (e.target.classList.contains('litri-self')) {
                formatLitriSelf(e.target);
                RegistroManager.updateRiepilogo();
                RegistroManager.autoSave();
            }

            // Formattazione automatica per importi al blur
            if (e.target.classList.contains('importo')) {
                let value = e.target.value.replace(/[^\d,]/g, '');
                
                if (value && !value.includes(',')) {
                    // Aggiungi ,00 solo al blur se non c'è virgola
                    value = value + ',00';
                } else if (value.endsWith(',')) {
                    // Se finisce con virgola, aggiungi 00
                    value = value + '00';
                } else if (value.includes(',')) {
                    // Se ha virgola ma decimali incompleti
                    const parts = value.split(',');
                    if (parts[1].length === 1) {
                        value = parts[0] + ',' + parts[1] + '0';
                    }
                }
                
                e.target.value = value;
                formatImportoInput(e.target);
                RegistroManager.updateRiepilogo();
                RegistroManager.autoSave();
            }

        }, true);

        // Calcolo iniziale
        RegistroManager.updateRiepilogo();
        console.log('✅ CERBERO Registro inizializzato correttamente');
        showMessage('Sistema Registro caricato', 'success');
    } catch (error) {
        console.error('❌ Errore nell\'inizializzazione registro:', error);
        showMessage('Errore nell\'inizializzazione del sistema', 'error');
    }
});
/* ===== FINE EVENT LISTENERS ===== */

/* ===== INIZIO GESTIONE ERRORI ===== */
window.addEventListener('error', function(e) {
    console.error('Errore JavaScript:', e.error);
    showMessage('Si è verificato un errore. Controlla la console.', 'error');
});
/* ===== FINE GESTIONE ERRORI ===== */

/* ===== INIZIO SALVATAGGIO AUTOMATICO ===== */
window.addEventListener('beforeunload', function(e) {
    if (RegistroManager) {
        RegistroManager.autoSave();
    }
});
/* ===== FINE SALVATAGGIO AUTOMATICO ===== */

/* ===== FUNZIONI ESPOSTE GLOBALMENTE ===== */
window.exportRegistroData = function() {
    try {
        const exportData = {
            timestamp: new Date().toISOString(),
            version: '1.0',
            registro: RegistroManager.getAllData()
        };

        const dataStr = JSON.stringify(exportData, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `cerbero_registro_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        showMessage('Registro esportato con successo!', 'success');
    } catch (error) {
        showMessage('Errore durante l\'esportazione', 'error');
    }
};

window.clearRegistroData = function() {
    if (RegistroManager) {
        RegistroManager.clearAllData();
    }
};

window.getRegistroSummary = function() {
    if (RegistroManager) {
        return RegistroManager.getStatistics();
    }
    return { entrateCount: 0, usciteCount: 0, totaleEntrate: 0, totaleUscite: 0, differenza: 0 };
};

/* ===== FINE JAVASCRIPT ===== */