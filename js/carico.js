/* ===== GESTIONE CARICO CARBURANTI - CERBERO ===== */

/* ===== GESTIONE LOCALSTORAGE ===== */
const CargoStorage = {
    KEYS: {
        CARGO_DATA: 'cerbero_cargo_data',
        CARGO_HISTORY: 'cerbero_cargo_history',
        RIMANENZE_DATA: 'cerbero_rimanenze_data'
    },

    save: function(key, data) {
        try {
            const dataString = JSON.stringify(data);
            localStorage.setItem(key, dataString);
            return true;
        } catch (error) {
            console.error('Errore nel salvare i dati:', error);
            return false;
        }
    },

    load: function(key, defaultValue = null) {
        try {
            const dataString = localStorage.getItem(key);
            return dataString ? JSON.parse(dataString) : defaultValue;
        } catch (error) {
            console.error('Errore nel caricare i dati per', key, ':', error);
            return defaultValue;
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

/* ===== GESTIONE CARICO ===== */
class CargoManager {
    constructor() {
        this.cargoHistory = CargoStorage.load(CargoStorage.KEYS.CARGO_HISTORY, []);
        this.rimanenzeData = CargoStorage.load(CargoStorage.KEYS.RIMANENZE_DATA, {
            benzina: 0,
            gasolio: 0,
            diesel: 0,
            hvolution: 0
        });
        this.currentYear = new Date().getFullYear();
        this.chart = null;
        this.init();
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

        console.log('Eventi inizializzati correttamente');
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

        // Aggiungi al history
        this.cargoHistory.push(formData);
        this.cargoHistory.sort((a, b) => new Date(b.date) - new Date(a.date));

        // Salva e aggiorna
        CargoStorage.save(CargoStorage.KEYS.CARGO_HISTORY, this.cargoHistory);
        this.updateTotals();
        this.loadHistory();
        this.updateChart();
        this.closeModal();
        
        showMessage('Carico salvato con successo!', 'success');
        console.log('=== FINE SALVATAGGIO CARICO ===');
    }

    updateTotals() {
        const currentYearData = this.cargoHistory.filter(cargo => 
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
                const rimanenza = this.rimanenzeData[product] || 0;
                const totale = totals[product] + rimanenza;
                totaleInput.value = formatter.liters(totale);
            }
        });
    }

    loadRimanenze() {
        Object.keys(this.rimanenzeData).forEach(product => {
            const input = document.getElementById(`rimanenza-${product}`);
            if (input) {
                input.value = formatter.liters(this.rimanenzeData[product]);
            }
        });
    }

    saveRimanenze() {
        ['benzina', 'gasolio', 'diesel', 'hvolution'].forEach(product => {
            const input = document.getElementById(`rimanenza-${product}`);
            if (input) {
                const value = input.value.replace(/\./g, '');
                this.rimanenzeData[product] = parseInt(value) || 0;
                input.value = formatter.liters(this.rimanenzeData[product]);
            }
        });
        
        CargoStorage.save(CargoStorage.KEYS.RIMANENZE_DATA, this.rimanenzeData);
        this.updateTotals();
    }

    loadHistory() {
        const tbody = document.getElementById('history-tbody');
        if (!tbody) {
            console.log('ERRORE: Tabella history-tbody non trovata!');
            return;
        }

        tbody.innerHTML = '';

        const currentYearHistory = this.cargoHistory.filter(cargo => 
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
            const originalIndex = this.cargoHistory.findIndex(cargo => 
                cargo.timestamp === timestamp
            );
            
            if (originalIndex !== -1) {
                this.cargoHistory.splice(originalIndex, 1);
                CargoStorage.save(CargoStorage.KEYS.CARGO_HISTORY, this.cargoHistory);
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

        // Calcola i totali per l'anno corrente
        const currentYearData = this.cargoHistory.filter(cargo => 
            new Date(cargo.date).getFullYear() === this.currentYear
        );

        const totals = {
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
        });

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
                    history: this.cargoHistory,
                    rimanenze: this.rimanenzeData,
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
            
            showMessage('Dati esportati con successo!', 'success');
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
                                this.cargoHistory = importedData.carico.history;
                                CargoStorage.save(CargoStorage.KEYS.CARGO_HISTORY, this.cargoHistory);
                            }
                            
                            if (importedData.carico.rimanenze) {
                                this.rimanenzeData = importedData.carico.rimanenze;
                                CargoStorage.save(CargoStorage.KEYS.RIMANENZE_DATA, this.rimanenzeData);
                            }
                            
                            this.loadRimanenze();
                            this.updateTotals();
                            this.loadHistory();
                            this.updateChart();
                            
                            showMessage('Dati importati con successo!', 'success');
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
            this.cargoHistory = this.cargoHistory.filter(cargo => 
                new Date(cargo.date).getFullYear() !== this.currentYear
            );
            
            CargoStorage.save(CargoStorage.KEYS.CARGO_HISTORY, this.cargoHistory);
            this.updateTotals();
            this.loadHistory();
            this.updateChart();
            
            showMessage(`Dati ${this.currentYear} eliminati`, 'success');
        }
    }
}

/* ===== INIZIALIZZAZIONE ===== */
let cargoManager;

document.addEventListener('DOMContentLoaded', function() {
    try {
        cargoManager = new CargoManager();
        console.log('✅ CERBERO Carico inizializzato correttamente');
        showMessage('Sistema Carico caricato', 'success');
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

/* ===== SALVATAGGIO AUTOMATICO PRIMA DI USCIRE ===== */
window.addEventListener('beforeunload', function(e) {
    if (cargoManager) {
        CargoStorage.save(CargoStorage.KEYS.CARGO_HISTORY, cargoManager.cargoHistory);
        CargoStorage.save(CargoStorage.KEYS.RIMANENZE_DATA, cargoManager.rimanenzeData);
    }
});