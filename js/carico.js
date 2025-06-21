/* ===== GESTIONE CARICO CARBURANTI - CERBERO UNIFICATO ===== */

/* ===== GESTIONE STORAGE UNIFICATO ===== */
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

/* ===== UTILITY PER TOAST MESSAGES ===== */
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

/* ===== FORMATTAZIONE NUMERI ===== */
const formatter = {
    // Per litri (numeri interi con separatore migliaia)
    liters: (value) => {
        if (typeof value !== 'number' || isNaN(value)) {
            return '0';
        }
        return new Intl.NumberFormat('it-IT', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
            useGrouping: true
        }).format(Math.round(value));
    },
    
    // Per differenze (con segno)
    diff: new Intl.NumberFormat('it-IT', { 
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
        signDisplay: 'auto', 
        useGrouping: true
    })
};

/* ===== GESTIONE CARICO UNIFICATA ===== */
class CargoManager {
    constructor() {
        this.cargoData = this.loadCargoData();
        this.currentYear = new Date().getFullYear();
        this.chart = null;
        this.init();
    }

    loadCargoData() {
        // Carica dati dal storage unificato
        const totals = Storage.load(Storage.KEYS.CARICO_TOTALS, {
            benzina: 0,
            gasolio: 0,
            diesel: 0,
            hvolution: 0
        });
        
        const history = Storage.load(Storage.KEYS.CARICO_HISTORY, []);
        
        // Struttura unificata
        return {
            totals: totals,
            history: history
        };
    }

    saveCargoData() {
        try {
            const totalSuccess = Storage.save(Storage.KEYS.CARICO_TOTALS, this.cargoData.totals);
            const historySuccess = Storage.save(Storage.KEYS.CARICO_HISTORY, this.cargoData.history);
            
            if (totalSuccess && historySuccess) {
                console.log('💾 Dati carico salvati in localStorage');
                return true;
            } else {
                console.error('❌ Errore nel salvare i dati carico');
                return false;
            }
        } catch (error) {
            console.error('❌ Errore critico nel salvataggio carico:', error);
            return false;
        }
    }

    init() {
        this.bindEvents();
        this.loadRimanenze();
        this.updateTotals();
        this.loadHistory();
        this.updateChart();
        this.updateYearDisplay();
    }

    bindEvents() {
        // Modal events
        const btnNuovo = document.getElementById('btn-nuovo-carico');
        const btnClose = document.getElementById('btn-close-modal');
        const btnCancel = document.getElementById('btn-cancel-modal');
        const form = document.getElementById('newLoadForm');
        
        if (btnNuovo) btnNuovo.addEventListener('click', () => this.openModal());
        if (btnClose) btnClose.addEventListener('click', () => this.closeModal());
        if (btnCancel) btnCancel.addEventListener('click', () => this.closeModal());
        if (form) form.addEventListener('submit', (e) => this.saveNewCargo(e));
        
        // Action buttons
        const btnExport = document.getElementById('btn-esporta');
        const btnImport = document.getElementById('btn-importa');
        const btnReset = document.getElementById('btn-reset');
        
        if (btnExport) btnExport.addEventListener('click', () => this.exportData());
        if (btnImport) btnImport.addEventListener('click', () => this.importData());
        if (btnReset) btnReset.addEventListener('click', () => this.resetYear());
        
        // Rimanenze events
        ['benzina', 'gasolio', 'diesel', 'hvolution'].forEach(product => {
            const input = document.getElementById(`rimanenza-${product}`);
            if (input) {
                input.addEventListener('blur', () => this.saveRimanenze());
            }
        });

        // Date input default to today
        const dateInput = document.getElementById('load-date');
        if (dateInput) {
            dateInput.value = new Date().toISOString().split('T')[0];
        }

        // Click su overlay per chiudere modal
        const overlay = document.getElementById('newLoadModal');
        if (overlay) {
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    this.closeModal();
                }
            });
        }

        console.log('Eventi carico inizializzati correttamente');
    }

    openModal() {
        const modal = document.getElementById('newLoadModal');
        if (modal) {
            modal.classList.add('active');
            const dateInput = document.getElementById('load-date');
            if (dateInput) {
                dateInput.focus();
            }
        }
    }

    closeModal() {
        const modal = document.getElementById('newLoadModal');
        const form = document.getElementById('newLoadForm');
        const dateInput = document.getElementById('load-date');
        
        if (modal) modal.classList.remove('active');
        if (form) form.reset();
        if (dateInput) dateInput.value = new Date().toISOString().split('T')[0];
    }

    saveNewCargo(e) {
        e.preventDefault();
        
        console.log('=== SALVATAGGIO CARICO ===');

        // Funzione helper per ottenere valori con fallback
        const getValueSafe = (id, defaultValue = 0) => {
            const element = document.getElementById(id);
            if (!element) {
                console.warn(`Campo ${id} non trovato`);
                return defaultValue;
            }
            const value = parseInt(element.value) || defaultValue;
            return value;
        };

        const getTextSafe = (id, defaultValue = '') => {
            const element = document.getElementById(id);
            if (!element) {
                console.warn(`Campo ${id} non trovato`);
                return defaultValue;
            }
            return element.value.trim() || defaultValue;
        };
        
        // Parsing sicuro dei valori dai campi del modal
        const formData = {
            date: getTextSafe('load-date'),
            driver: getTextSafe('load-driver'),
            benzina: getValueSafe('load-benzina'),
            diffBenzina: getValueSafe('load-diff-benzina'),
            gasolio: getValueSafe('load-gasolio'),
            diffGasolio: getValueSafe('load-diff-gasolio'),
            diesel: getValueSafe('load-diesel'),
            diffDiesel: getValueSafe('load-diff-diesel'),
            hvolution: getValueSafe('load-hvolution'),
            diffHvolution: getValueSafe('load-diff-hvolution'),
            timestamp: new Date().toISOString()
        };

        console.log('Dati elaborati:', formData);

        // Validazioni
        if (!formData.driver) {
            showMessage('Inserire il nome dell\'autista', 'warning');
            return;
        }

        if (!formData.date) {
            showMessage('Inserire la data del carico', 'warning');
            return;
        }

        if (formData.benzina === 0 && formData.gasolio === 0 && 
            formData.diesel === 0 && formData.hvolution === 0) {
            showMessage('Inserire almeno un prodotto', 'warning');
            return;
        }

        // Aggiungi al history nel storage unificato
        this.cargoData.history.push(formData);
        this.cargoData.history.sort((a, b) => new Date(b.date) - new Date(a.date));

        // Salva e aggiorna
        this.saveCargoData();
        this.updateTotals();
        this.loadHistory();
        this.updateChart();
        this.closeModal();
        
        showMessage('Carico salvato con successo!', 'success');
        console.log('=== FINE SALVATAGGIO CARICO ===');
    }

    updateTotals() {
        const currentYearData = this.cargoData.history.filter(cargo => 
            new Date(cargo.date).getFullYear() === this.currentYear
        );

        const totals = {
            benzina: 0,
            gasolio: 0,
            diesel: 0,
            hvolution: 0
        };

        const diffs = {
            benzina: 0,
            gasolio: 0,
            diesel: 0,
            hvolution: 0
        };

        currentYearData.forEach(cargo => {
            totals.benzina += cargo.benzina || 0;
            totals.gasolio += cargo.gasolio || 0;
            totals.diesel += cargo.diesel || 0;
            totals.hvolution += cargo.hvolution || 0;
            
            diffs.benzina += cargo.diffBenzina || 0;
            diffs.gasolio += cargo.diffGasolio || 0;
            diffs.diesel += cargo.diffDiesel || 0;
            diffs.hvolution += cargo.diffHvolution || 0;
        });

        // Aggiorna totali nello storage unificato
        this.cargoData.totals = totals;

        // Aggiorna i campi
        Object.keys(totals).forEach(product => {
            const litriInput = document.getElementById(`litri-${product}`);
            const diffInput = document.getElementById(`diff-${product}`);
            const rimanenzaInput = document.getElementById(`rimanenza-${product}`);
            const totaleInput = document.getElementById(`totale-${product}`);

            if (litriInput) {
                litriInput.value = formatter.liters(totals[product]);
            }
            if (diffInput) {
                const diffValue = diffs[product];
                diffInput.value = formatter.diff.format(diffValue);
                
                // Colora il campo differenza
                if (diffValue > 0) {
                    diffInput.style.background = 'rgba(40, 167, 69, 0.1)';
                    diffInput.style.color = '#28a745';
                } else if (diffValue < 0) {
                    diffInput.style.background = 'rgba(220, 53, 69, 0.1)';
                    diffInput.style.color = '#dc3545';
                } else {
                    diffInput.style.background = 'rgba(0, 86, 179, 0.05)';
                    diffInput.style.color = '#64748b';
                }
            }
            if (totaleInput) {
                const rimanenza = this.getRimanenza(product);
                const totale = totals[product] + rimanenza;
                totaleInput.value = formatter.liters(totale);
            }
        });
    }

    getRimanenza(product) {
        const input = document.getElementById(`rimanenza-${product}`);
        if (input) {
            const value = input.value.replace(/\./g, '');
            return parseInt(value) || 0;
        }
        return 0;
    }

    loadRimanenze() {
        // Le rimanenze sono gestite direttamente negli input per semplicità
        // Potrebbero essere migrate nello storage unificato in futuro
        ['benzina', 'gasolio', 'diesel', 'hvolution'].forEach(product => {
            const input = document.getElementById(`rimanenza-${product}`);
            if (input && !input.value) {
                input.value = '0';
            }
        });
    }

    saveRimanenze() {
        ['benzina', 'gasolio', 'diesel', 'hvolution'].forEach(product => {
            const input = document.getElementById(`rimanenza-${product}`);
            if (input) {
                const value = input.value.replace(/\./g, '');
                const numValue = parseInt(value) || 0;
                input.value = formatter.liters(numValue);
            }
        });
        
        this.updateTotals();
        this.saveCargoData();
    }

    loadHistory() {
        const tbody = document.getElementById('history-tbody');
        if (!tbody) {
            console.log('ERRORE: Tabella history-tbody non trovata!');
            return;
        }

        tbody.innerHTML = '';

        const currentYearHistory = this.cargoData.history.filter(cargo => 
            new Date(cargo.date).getFullYear() === this.currentYear
        );

        if (currentYearHistory.length === 0) {
            tbody.innerHTML = `<tr><td colspan="11" style="text-align: center; padding: 20px; color: #64748b;">Nessun carico registrato per il ${this.currentYear}</td></tr>`;
            return;
        }

        currentYearHistory.forEach((cargo, index) => {
            const row = document.createElement('tr');
            
            row.innerHTML = `
                <td>${new Date(cargo.date).toLocaleDateString('it-IT')}</td>
                <td>${formatter.liters(cargo.benzina || 0)}</td>
                <td style="color: ${(cargo.diffBenzina || 0) > 0 ? '#28a745' : (cargo.diffBenzina || 0) < 0 ? '#dc3545' : '#64748b'};">
                    ${(cargo.diffBenzina || 0) > 0 ? '+' : ''}${cargo.diffBenzina || 0}
                </td>
                <td>${formatter.liters(cargo.gasolio || 0)}</td>
                <td style="color: ${(cargo.diffGasolio || 0) > 0 ? '#28a745' : (cargo.diffGasolio || 0) < 0 ? '#dc3545' : '#64748b'};">
                    ${(cargo.diffGasolio || 0) > 0 ? '+' : ''}${cargo.diffGasolio || 0}
                </td>
                <td>${formatter.liters(cargo.diesel || 0)}</td>
                <td style="color: ${(cargo.diffDiesel || 0) > 0 ? '#28a745' : (cargo.diffDiesel || 0) < 0 ? '#dc3545' : '#64748b'};">
                    ${(cargo.diffDiesel || 0) > 0 ? '+' : ''}${cargo.diffDiesel || 0}
                </td>
                <td>${formatter.liters(cargo.hvolution || 0)}</td>
                <td style="color: ${(cargo.diffHvolution || 0) > 0 ? '#28a745' : (cargo.diffHvolution || 0) < 0 ? '#dc3545' : '#64748b'};">
                    ${(cargo.diffHvolution || 0) > 0 ? '+' : ''}${cargo.diffHvolution || 0}
                </td>
                <td>${cargo.driver || ''}</td>
                <td>
                    <button class="delete-btn" onclick="cargoManager.deleteCargo('${cargo.timestamp}')" title="Elimina carico">×</button>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    deleteCargo(timestamp) {
        if (confirm('Eliminare questo carico?')) {
            const originalIndex = this.cargoData.history.findIndex(cargo => 
                cargo.timestamp === timestamp
            );
            
            if (originalIndex !== -1) {
                this.cargoData.history.splice(originalIndex, 1);
                this.saveCargoData();
                this.updateTotals();
                this.loadHistory();
                this.updateChart();
                showMessage('Carico eliminato', 'success');
            }
        }
    }

    updateChart() {
        const canvas = document.getElementById('carichiChart');
        if (!canvas) {
            console.log('Canvas non trovato');
            return;
        }

        // Destroy existing chart
        if (this.chart) {
            this.chart.destroy();
        }

        // Usa i totali calcolati
        const totals = this.cargoData.totals;

        // Crea nuovo grafico con una singola barra per prodotto
        try {
            this.chart = new Chart(canvas, {
                type: 'bar',
                data: {
                    labels: ['BENZINA', 'GASOLIO', 'DIESEL+', 'HVOLUTION'],
                    datasets: [{
                        data: [totals.benzina, totals.gasolio, totals.diesel, totals.hvolution],
                        backgroundColor: ['#28a746', '#ff9f00', '#fe5d26', '#007bff'],
                        borderRadius: {
                            topLeft: 20,
                            topRight: 20,
                            bottomLeft: 0,
                            bottomRight: 0
                        },
                        borderSkipped: 'bottom'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false },
                        tooltip: { enabled: false }
                    },
                    scales: {
                        x: { display: false },
                        y: { display: false }
                    }
                }
            });
        } catch (error) {
            console.error('Errore nella creazione del grafico:', error);
        }
    }

    updateYearDisplay() {
        const titleElement = document.getElementById('box-title-anno');
        const rimanenzaHeader = document.getElementById('rimanenza-header');
        
        if (titleElement) {
            titleElement.textContent = `TOTALE ANNO (${this.currentYear})`;
        }
        if (rimanenzaHeader) {
            rimanenzaHeader.textContent = `RIMANENZA (${this.currentYear - 1})`;
        }
    }

    exportData() {
        try {
            const dataToExport = {
                timestamp: new Date().toISOString(),
                version: '1.0',
                carico: {
                    totals: this.cargoData.totals,
                    history: this.cargoData.history,
                    year: this.currentYear
                }
            };

            const dataStr = JSON.stringify(dataToExport, null, 2);
            const dataBlob = new Blob([dataStr], {type: 'application/json'});
            const url = URL.createObjectURL(dataBlob);
            
            const link = document.createElement('a');
            link.href = url;
            link.download = `cerbero_carico_${this.currentYear}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            
            showMessage('Dati carico esportati con successo!', 'success');
        } catch (error) {
            showMessage('Errore durante l\'esportazione', 'error');
            console.error('Export error:', error);
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
                    
                    if (confirm('Importare i dati di carico? Questo sovrascriverà i dati attuali.')) {
                        if (importedData.carico) {
                            if (importedData.carico.history) {
                                this.cargoData.history = importedData.carico.history;
                            }
                            
                            if (importedData.carico.totals) {
                                this.cargoData.totals = importedData.carico.totals;
                            }
                            
                            this.saveCargoData();
                            this.loadRimanenze();
                            this.updateTotals();
                            this.loadHistory();
                            this.updateChart();
                            
                            showMessage('Dati carico importati con successo!', 'success');
                        } else {
                            showMessage('File non contiene dati di carico validi', 'warning');
                        }
                    }
                } catch (error) {
                    showMessage('Errore: file non valido', 'error');
                    console.error('Import error:', error);
                }
            };
            reader.readAsText(file);
        });
        
        input.click();
    }

    resetYear() {
        if (confirm(`Eliminare tutti i dati di carico per l'anno ${this.currentYear}?\nQuesta azione non può essere annullata.`)) {
            this.cargoData.history = this.cargoData.history.filter(cargo => 
                new Date(cargo.date).getFullYear() !== this.currentYear
            );
            
            // Reset totali
            this.cargoData.totals = {
                benzina: 0,
                gasolio: 0,
                diesel: 0,
                hvolution: 0
            };
            
            this.saveCargoData();
            this.updateTotals();
            this.loadHistory();
            this.updateChart();
            
            showMessage(`Dati ${this.currentYear} eliminati`, 'success');
        }
    }

    // Metodo per sincronizzare con il backup completo
    syncWithSystemData(systemData) {
        if (systemData && systemData.carico) {
            if (systemData.carico.totals) {
                this.cargoData.totals = systemData.carico.totals;
            }
            if (systemData.carico.history) {
                this.cargoData.history = systemData.carico.history;
            }
            
            this.saveCargoData();
            this.loadRimanenze();
            this.updateTotals();
            this.loadHistory();
            this.updateChart();
            return true;
        }
        return false;
    }

    // Cancella tutti i dati del carico
    clearAllData() {
        if (confirm('Cancellare tutti i dati del carico? Questa azione non può essere annullata.')) {
            this.cargoData = {
                totals: { benzina: 0, gasolio: 0, diesel: 0, hvolution: 0 },
                history: []
            };
            
            this.saveCargoData();
            this.updateTotals();
            this.loadHistory();
            this.updateChart();
            
            // Reset rimanenze
            ['benzina', 'gasolio', 'diesel', 'hvolution'].forEach(product => {
                const input = document.getElementById(`rimanenza-${product}`);
                if (input) input.value = '0';
            });
            
            showMessage('Tutti i dati del carico sono stati cancellati', 'info');
        }
    }

    // Ottieni statistiche del carico
    getStatistics() {
        const currentYearHistory = this.cargoData.history.filter(cargo => 
            new Date(cargo.date).getFullYear() === this.currentYear
        );
        
        return {
            totalCarichi: currentYearHistory.length,
            totaleLitri: Object.values(this.cargoData.totals).reduce((sum, val) => sum + val, 0),
            prodotti: this.cargoData.totals,
            lastUpdate: currentYearHistory.length > 0 ? 
                Math.max(...currentYearHistory.map(c => new Date(c.timestamp).getTime())) : null
        };
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
                    
                    // Importa dati Carico
                    if (importedData.carico && cargoManager) {
                        if (cargoManager.syncWithSystemData(importedData)) {
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
                    
                    if (importedData.registro) {
                        Storage.save(Storage.KEYS.REGISTRO_DATA, importedData.registro);
                        importSuccess = true;
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
            
            // Dati Carico
            carico: {
                totals: Storage.load(Storage.KEYS.CARICO_TOTALS, {}),
                history: Storage.load(Storage.KEYS.CARICO_HISTORY, [])
            },
            
            // Dati Erogatori
            erogatori: Storage.load(Storage.KEYS.DISPENSERS, {}),
            
            // Dati Monetario
            monetario: Storage.load(Storage.KEYS.MONETARIO_DATA, {}),
            
            // Dati Registro
            registro: Storage.load(Storage.KEYS.REGISTRO_DATA, {}),
            
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

function stampaDati() {
    showMessage('Funzione stampa in fase di sviluppo', 'info');
}

/* ===== FUNZIONI GLOBALI ===== */
function showInfo() {
    const infoMessage = `
GESTIONE CARICO - CERBERO v1.0

Funzionalità:
• Registrazione carichi carburanti per anno
• Calcolo automatico totali e differenze
• Grafico statistiche prodotti
• Gestione rimanenze anno precedente
• Storage unificato con sistema CERBERO

Prodotti gestiti:
• Benzina
• Gasolio
• Diesel+
• Hvolution

Storage unificato:
• Compatibile con tutte le pagine CERBERO
• Backup automatico e sincronizzazione
• Persistenza dati tra sessioni

Grafici:
• Visualizzazione totali per prodotto
• Aggiornamento automatico
• Colori distintivi per categoria

I dati vengono salvati automaticamente in localStorage.
    `;
    alert(infoMessage);
}

/* ===== INIZIALIZZAZIONE ===== */
let cargoManager;

document.addEventListener('DOMContentLoaded', function() {
    try {
        cargoManager = new CargoManager();
        console.log('✅ CERBERO Carico inizializzato correttamente');
        showMessage('Sistema Carico caricato', 'success');
    } catch (error) {
        console.error('❌ Errore nell\'inizializzazione carico:', error);
        showMessage('Errore nell\'inizializzazione del sistema', 'error');
    }
});

/* ===== GESTIONE ERRORI GLOBALI ===== */
window.addEventListener('error', function(e) {
    console.error('Errore JavaScript:', e.error);
    showMessage('Si è verificato un errore. Controlla la console.', 'error');
});

/* ===== SALVATAGGIO AUTOMATICO PRIMA DI USCIRE ===== */
window.addEventListener('beforeunload', function(e) {
    if (cargoManager) {
        cargoManager.saveCargoData();
    }
});

/* ===== FUNZIONI ESPOSTE GLOBALMENTE ===== */
window.exportCargoData = function() {
    if (cargoManager) {
        cargoManager.exportData();
    }
};

window.clearCargoData = function() {
    if (cargoManager) {
        cargoManager.clearAllData();
    }
};

window.getCargoSummary = function() {
    if (cargoManager) {
        return cargoManager.getStatistics();
    }
    return { totalCarichi: 0, totaleLitri: 0, prodotti: {}, lastUpdate: null };
};