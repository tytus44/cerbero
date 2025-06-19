/* ===== INIZIO JAVASCRIPT ===== */

/* ===== INIZIO GESTIONE STORAGE ===== */
const Storage = {
    KEYS: {
        REGISTRO_DATA: 'cerbero_registro'
    },

    save: function(key, data) {
        try {
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
            return JSON.parse(data);
        } catch (error) {
            console.error('Errore nel caricare i dati per', key, ':', error);
            return defaultValue;
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

// Formatta valore litri come 0.000 (es. 5460 → 5.460)
function formatLitri(input) {
    let value = input.value.replace(/[^\d]/g, ''); // Solo cifre
    if (value === '') {
        input.value = '';
        return;
    }
    
    // Converte in numero e formatta con 3 decimali
    const numValue = parseInt(value) || 0;
    
    // Formatta come X.XXX (sempre 3 cifre dopo il punto)
    if (numValue < 1000) {
        input.value = `0.${numValue.toString().padStart(3, '0')}`;
    } else {
        const intPart = Math.floor(numValue / 1000);
        const decPart = (numValue % 1000).toString().padStart(3, '0');
        input.value = `${intPart}.${decPart}`;
    }
}

// Converte stringa litri in numero (es. "5.460" → 5460)
function parseLitri(value) {
    if (!value) return 0;
    // Rimuove solo il punto e converte in numero intero
    const cleaned = value.replace(/\./g, '');
    const parsed = parseInt(cleaned) || 0;
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

/* ===== INIZIO GESTIONE REGISTRO ===== */
const RegistroManager = {
    // Calcola totale fondi inizio turno
    calculateFondiInizio: function() {
        const fondoCassa = parseEuro(document.getElementById('fondo-cassa-inizio')?.value || '0');
        const monete = parseEuro(document.getElementById('monete-inizio')?.value || '0');
        const litriSelf = parseLitri(document.getElementById('litri-self-inizio')?.value || '0');
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
        const litriSelf = parseLitri(document.getElementById('litri-self-fine')?.value || '0');
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

    // Ottieni tutti i dati del registro
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
        } catch (error) {
            console.error('Errore nel caricamento dati:', error);
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

    // Salva automaticamente i dati
    autoSave: function() {
        const data = this.getAllData();
        Storage.save(Storage.KEYS.REGISTRO_DATA, data);
    },

    // Carica dati salvati
    loadSavedData: function() {
        const savedData = Storage.load(Storage.KEYS.REGISTRO_DATA);
        if (savedData) {
            this.loadData(savedData);
        }
    }
};
/* ===== FINE GESTIONE REGISTRO ===== */

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
                
                if (confirm('Importare i dati del registro? Questo sovrascriverà i dati attuali.')) {
                    if (importedData.registro) {
                        RegistroManager.loadData(importedData.registro);
                        showMessage('Dati registro importati con successo!', 'success');
                    } else {
                        showMessage('File non contiene dati del registro', 'warning');
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
            registro: RegistroManager.getAllData()
        };

        const dataStr = JSON.stringify(dataToExport, null, 2);
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

/* ===== INIZIO FUNZIONE INFO ===== */
function showInfo() {
    const infoMessage = `
REGISTRO DI CASSA - CERBERO v1.0

Funzionalità:
• Gestione completa turni di cassa
• Tracciamento entrate e uscite
• Calcolo automatico differenze
• Riepilogo in tempo reale
• Gestione fondi cassa multipli

Logica di calcolo:
• Totale Entrate = Fondi Inizio + Entrate Turno
• Totale Uscite = Fondi Fine + Uscite Turno
• Differenza = Entrate - Uscite

Campi gestiti:
• Fondo Cassa: formato euro (€ 0,00)
• Monete: formato euro (€ 0,00)
• Litri Self: formato numerico (0.000)
• Importo Self: formato euro (€ 0,00)

Salvataggio automatico attivo.

Colori:
• Verde: Entrate
• Rosso: Uscite
• Azzurro: Prodotti/Spese
    `;
    alert(infoMessage);
}
/* ===== FINE FUNZIONE INFO ===== */

/* ===== INIZIO EVENT LISTENERS ===== */
document.addEventListener('DOMContentLoaded', function() {
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

        // Formattazione litri sui campi litri-self al blur
        if (e.target.classList.contains('litri-self')) {
            formatLitri(e.target);
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
    showMessage('Sistema Registro caricato', 'success');
});
/* ===== FINE EVENT LISTENERS ===== */

/* ===== INIZIO GESTIONE ERRORI ===== */
window.addEventListener('error', function(e) {
    console.error('Errore JavaScript:', e.error);
    showMessage('Si è verificato un errore. Controlla la console.', 'error');
});
/* ===== FINE GESTIONE ERRORI ===== */

/* ===== FINE JAVASCRIPT ===== */