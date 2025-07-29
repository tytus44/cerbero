/* ===== GESTIONE CARICO CARBURANTI - CERBERO AGGIORNATO ===== */

/* ===== UTILITY E FUNZIONI HELPER ===== */
function initializeInfoButton() {
    try {
        const infoBtn = document.getElementById('info-btn');
        const infoModal = document.getElementById('info-modal');
        const modalCloseBtn = infoModal ? infoModal.querySelector('.modal-close-btn') : null;
        
        if (infoBtn && infoModal) {
            infoBtn.addEventListener('click', (e) => {
                e.preventDefault();
                infoModal.classList.add('active');
            });
            
            if (modalCloseBtn) {
                modalCloseBtn.addEventListener('click', () => {
                    infoModal.classList.remove('active');
                });
            }
            
            infoModal.addEventListener('click', (e) => {
                if (e.target === infoModal) {
                    infoModal.classList.remove('active');
                }
            });
        }
    } catch (error) {
        console.error('Errore inizializzazione pulsante info:', error);
    }
}

function showMessage(message, type = 'info') {
    try {
        const allowedTypes = ['error', 'warning', 'info'];
        if (!allowedTypes.includes(type)) return;
        const toast = document.createElement('div');
        toast.className = `toast-message toast-${type}`;
        toast.textContent = message;
        const colors = { error: '#FF3547', info: '#0ABAB5', warning: '#FFD700' };
        toast.style.cssText = `
            position: fixed; top: 20px; right: 20px;
            background: ${colors[type] || colors.info};
            color: ${type === 'warning' ? '#333' : 'white'};
            padding: 15px 20px; z-index: 1001; font-family: 'Montserrat', sans-serif; font-weight: 600;
            font-size: 14px; box-shadow: 0 4px 20px rgba(0,0,0,0.2); border-radius: 4px;
            max-width: 350px; word-wrap: break-word;
            animation: slideIn 0.3s ease-out;`;
        document.body.appendChild(toast);
        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease forwards';
            setTimeout(() => { if (toast.parentNode) toast.parentNode.removeChild(toast); }, 300);
        }, 3000);
    } catch (error) { console.error('Errore visualizzazione messaggio:', error); alert(message); }
}

function showConfirmModal(title, text, onConfirm) {
    const modal = document.getElementById('confirm-modal');
    if (!modal) {
        if(confirm(`${title}\n${text}`)) onConfirm();
        return;
    }
    modal.querySelector('#confirm-modal-title').textContent = title;
    modal.querySelector('#confirm-modal-text').textContent = text;
    const btnOk = modal.querySelector('#confirm-modal-ok');
    const newBtnOk = btnOk.cloneNode(true);
    btnOk.parentNode.replaceChild(newBtnOk, btnOk);
    const hideModal = () => modal.classList.remove('active');
    newBtnOk.addEventListener('click', () => { onConfirm(); hideModal(); }, { once: true });
    modal.querySelector('#confirm-modal-cancel').addEventListener('click', hideModal, { once: true });
    modal.classList.add('active');
}

const formatter = {
    liters: (value) => {
        if (typeof value !== 'number' || isNaN(value)) return '0';
        return new Intl.NumberFormat('it-IT').format(Math.round(value)); 
    },
    diff: new Intl.NumberFormat('it-IT', { signDisplay: 'always' }),
    toLocaleDate: (date) => {
        if (!(date instanceof Date) || isNaN(date)) return '';
        return date.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' });
    }
};

const parseDate = (dateStr) => {
    if (!dateStr || typeof dateStr !== 'string') return null;
    let date = null;
    if (dateStr.includes('/')) {
        const parts = dateStr.split('/');
        if (parts.length === 3) {
            const day = parseInt(parts[0], 10);
            const month = parseInt(parts[1], 10) - 1;
            const year = parseInt(parts[2], 10);
            date = new Date(year, month, day, 12, 0, 0, 0);
        }
    } else if (dateStr.includes('-')) {
        const isoDate = dateStr.split('T')[0];
        const parts = isoDate.split('-');
        if (parts.length === 3) {
            const year = parseInt(parts[0], 10);
            const month = parseInt(parts[1], 10) - 1;
            const day = parseInt(parts[2], 10);
            date = new Date(year, month, day, 12, 0, 0, 0);
        }
    }
    return (date && !isNaN(date)) ? date : null;
};

const createDateTimestamp = (dateStr) => {
    const parsedDate = parseDate(dateStr);
    if (!parsedDate) return null;
    return parsedDate.toISOString();
};

function getDriverSurname(fullName) {
    if (!fullName || typeof fullName !== 'string') return '';
    const trimmed = fullName.trim().toUpperCase();
    const parts = trimmed.split(' ');
    return parts[0];
}

/* ===== GESTIONE CARICO ===== */
class CargoManager {
    constructor() {
        const loadedHistory = Storage.load(Storage.KEYS.CARICO_HISTORY, []);
        this.cargoData = {
            totals: Storage.load(Storage.KEYS.CARICO_TOTALS, {}),
            history: Array.isArray(loadedHistory) ? loadedHistory : [],
            rimanenze: Storage.load(Storage.KEYS.CARICO_RIMANENZE, {})
        };
        this.currentlyDisplayedData = [];
        this.currentlyDisplayedTotals = {};
        this.currentPeriodLabel = 'TOTALE ANNO';
        
        if (!Array.isArray(loadedHistory)) {
             console.warn("Dati 'history' di Carico corrotti, l'array è stato resettato.");
        }
        this.currentYear = new Date().getFullYear();
        this.carichiChart = null;
        this.monthlyLoadChart = null;
        this.init();
    }

    init() {
        this.bindEvents();
        this.updateFilterValueOptions();
        this.loadRimanenzeUI();
        this.updateTotals();
        this.renderHistory();
        this.updateYearDisplay();
        this.renderMonthlyLoadChart();
    }

    safeBind(elementId, event, handler) {
        const element = document.getElementById(elementId);
        if (element) {
            element.addEventListener(event, handler);
        } else {
            console.warn(`Elemento non trovato: #${elementId}. Impossibile associare l'evento.`);
        }
    }

    bindEvents() {
        this.safeBind('btn-nuovo-carico', 'click', () => this.openModal());
        this.safeBind('btn-close-modal', 'click', () => this.closeModal());
        this.safeBind('btn-cancel-modal', 'click', () => this.closeModal());
        this.safeBind('newLoadForm', 'submit', (e) => this.saveNewCargo(e));
        this.safeBind('btn-esporta', 'click', () => this.exportData());
        this.safeBind('btn-importa', 'click', () => this.importData());
        this.safeBind('btn-stampa', 'click', () => this.stampaDati());
        this.safeBind('btn-reset', 'click', () => this.resetYear());
        this.safeBind('newLoadModal', 'click', (e) => {
            if (e.target.id === 'newLoadModal') this.closeModal();
        });
        
        ['benzina', 'gasolio', 'diesel', 'hvolution'].forEach(p => {
            this.safeBind(`rimanenza-${p}`, 'change', () => this.saveRimanenzeFromUI());
        });
        
        this.safeBind('btn-apply-filter', 'click', () => this.applyPeriodFilter());
        this.safeBind('btn-reset-filter', 'click', () => this.resetPeriodFilter());
        this.safeBind('filter-type', 'change', () => this.updateFilterValueOptions());
    }

    updateFilterValueOptions() {
        const type = document.getElementById('filter-type').value;
        const valueSelect = document.getElementById('filter-value');
        valueSelect.innerHTML = '';
        let options = [];

        if (type === 'mese') {
            options = ["Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno", "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"]
                .map((mese, index) => `<option value="${index}">${mese.toUpperCase()}</option>`);
        } else if (type === 'trimestre') {
            options = [1, 2, 3, 4].map(q => `<option value="${q}">TRIMESTRE ${q}</option>`);
        } else if (type === 'semestre') {
            options = [1, 2].map(s => `<option value="${s}">SEMESTRE ${s}</option>`);
        }
        valueSelect.innerHTML = options.join('');
    }

    applyPeriodFilter() {
        const type = document.getElementById('filter-type').value;
        const value = parseInt(document.getElementById('filter-value').value);

        let startDate, endDate;
        const year = this.currentYear;

        if (type === 'mese') {
            startDate = new Date(year, value, 1);
            endDate = new Date(year, value + 1, 0, 23, 59, 59);
        } else if (type === 'trimestre') {
            const startMonth = (value - 1) * 3;
            startDate = new Date(year, startMonth, 1);
            endDate = new Date(year, startMonth + 3, 0, 23, 59, 59);
        } else if (type === 'semestre') {
            const startMonth = (value - 1) * 6;
            startDate = new Date(year, startMonth, 1);
            endDate = new Date(year, startMonth + 6, 0, 23, 59, 59);
        }
        
        const titleLabel = document.getElementById('filter-value').options[document.getElementById('filter-value').selectedIndex].text;
        this.updateTotals({ start: startDate, end: endDate }, titleLabel);
        this.renderMonthlyLoadChart();
    }
    
    resetPeriodFilter() {
        document.getElementById('box-sinistro').classList.remove('period-filtered');
        this.updateTotals();
        this.renderMonthlyLoadChart();
    }

    importData() {
        showConfirmModal('Importare Dati Carico?', 'I dati attuali verranno sovrascritti.', () => {
            const fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.accept = '.json';
            fileInput.onchange = (event) => {
                const file = event.target.files[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        const data = JSON.parse(e.target.result);
                        if (data.caricoTotals || data.caricoHistory || data.caricoRimanenze) {
                            if (data.caricoTotals) this.cargoData.totals = data.caricoTotals;
                            if (data.caricoHistory && Array.isArray(data.caricoHistory)) {
                                this.cargoData.history = data.caricoHistory.map(entry => ({...entry, date: createDateTimestamp(entry.date) || entry.date }));
                            }
                            if (data.caricoRimanenze) this.cargoData.rimanenze = data.caricoRimanenze;
                        } else if (data.totals || data.history || data.rimanenze) {
                            if (data.totals) this.cargoData.totals = data.totals;
                            if (data.history && Array.isArray(data.history)) {
                                this.cargoData.history = data.history.map(entry => ({...entry, date: createDateTimestamp(entry.date) || entry.date }));
                            }
                            if (data.rimanenze) this.cargoData.rimanenze = data.rimanenze;
                        } else {
                            return showMessage('File non valido per il carico.', 'warning');
                        }
                        this.saveAndRefresh();
                        this.loadRimanenzeUI();
                        showMessage('Dati carico importati con successo!', 'info');
                    } catch (err) {
                        showMessage('File non valido o corrotto.', 'error');
                        console.error('Errore importazione carico:', err);
                    }
                };
                reader.readAsText(file);
            };
            fileInput.click();
        });
    }

    exportData() {
        const dataToExport = {
            exportDate: new Date().toISOString(),
            exportType: 'carico_report',
            periodLabel: this.currentPeriodLabel,
            currentYear: this.currentYear,
            totals: this.currentlyDisplayedTotals,
            history: this.currentlyDisplayedData.map(entry => ({ 
                ...entry, 
                date: formatter.toLocaleDate(parseDate(entry.date))
            })),
            rimanenzeSnapshot: this.cargoData.rimanenze
        };

        const dataStr = JSON.stringify(dataToExport, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const a = document.createElement('a');
        a.href = url;
        const safeFilename = this.currentPeriodLabel.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        a.download = `cerbero_carico_${safeFilename}_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        URL.revokeObjectURL(url);
        showMessage(`Dati per ${this.currentPeriodLabel} esportati!`, 'info');
    }

    saveAndRefresh() {
        this.saveRimanenzeFromUI(false); 
        this.updateTotals();
        this.renderHistory();
        Storage.save(Storage.KEYS.CARICO_TOTALS, this.cargoData.totals);
        Storage.save(Storage.KEYS.CARICO_HISTORY, this.cargoData.history);
        Storage.save(Storage.KEYS.CARICO_RIMANENZE, this.cargoData.rimanenze);
    }

    updateSummaryBoxes(dataToProcess) {
        const totaleProdotti = dataToProcess.reduce((sum, cargo) => {
            return sum + (cargo.benzina || 0) + (cargo.gasolio || 0) + (cargo.diesel || 0) + (cargo.hvolution || 0);
        }, 0);

        const prodottiTotali = {
            'BENZINA': dataToProcess.reduce((sum, c) => sum + (c.benzina || 0), 0),
            'GASOLIO': dataToProcess.reduce((sum, c) => sum + (c.gasolio || 0), 0),
            'DIESEL+': dataToProcess.reduce((sum, c) => sum + (c.diesel || 0), 0),
            'HVOLUTION': dataToProcess.reduce((sum, c) => sum + (c.hvolution || 0), 0)
        };

        let prodottoPiuCaricato = '--';
        let maxLitri = 0;
        for (const [prodotto, litri] of Object.entries(prodottiTotali)) {
            if (litri > maxLitri) {
                maxLitri = litri;
                prodottoPiuCaricato = prodotto;
            }
        }

        const autistiCarichi = {};
        dataToProcess.forEach(cargo => {
            if (cargo.driver) {
                const autista = cargo.driver.trim().toUpperCase();
                if (!autistiCarichi[autista]) {
                    autistiCarichi[autista] = 0;
                }
                autistiCarichi[autista]++;
            }
        });

        let autistaTop = '--';
        let maxCarichi = 0;
        for (const [autista, numeroCarichi] of Object.entries(autistiCarichi)) {
            if (numeroCarichi > maxCarichi) {
                maxCarichi = numeroCarichi;
                autistaTop = autista;
            }
        }

        const totaleProdottiEl = document.getElementById('totaleProdottiCaricati');
        if (totaleProdottiEl) {
            totaleProdottiEl.textContent = totaleProdotti > 0 ? formatter.liters(totaleProdotti) + ' L' : '0 L';
        }

        const prodottoPiuCaricatoEl = document.getElementById('prodottoPiuCaricato');
        const prodottoPiuCaricatoDettagliEl = document.getElementById('prodottoPiuCaricatoDettagli');
        if (prodottoPiuCaricatoEl) {
            prodottoPiuCaricatoEl.textContent = prodottoPiuCaricato;
        }
        if (prodottoPiuCaricatoDettagliEl) {
            prodottoPiuCaricatoDettagliEl.textContent = maxLitri > 0 ? formatter.liters(maxLitri) + ' litri' : '';
        }

        const autistaTopEl = document.getElementById('autistaTop');
        const autistaTopDettagliEl = document.getElementById('autistaTopDettagli');
        if (autistaTopEl) {
            let displayName = getDriverSurname(autistaTop);
            autistaTopEl.textContent = displayName;
            if (autistaTop !== '--' && autistaTop.includes(' ')) {
                autistaTopEl.title = autistaTop;
            } else {
                autistaTopEl.removeAttribute('title');
            }
        }
        if (autistaTopDettagliEl) {
            autistaTopDettagliEl.textContent = maxCarichi > 0 ? maxCarichi + ' carichi' : '';
        }
    }
    
    openModal() {
        const modal = document.getElementById('newLoadModal');
        if(modal) {
            modal.classList.add('active');
            document.getElementById('load-date').value = formatter.toLocaleDate(new Date());
            document.getElementById('load-driver').focus();
        }
    }

    closeModal() {
        const modal = document.getElementById('newLoadModal');
        if(modal) {
            modal.classList.remove('active');
            document.getElementById('newLoadForm').reset();
        }
    }

    saveNewCargo(e) {
        e.preventDefault();
        const dateValue = document.getElementById('load-date').value;
        const timestamp = createDateTimestamp(dateValue);

        if (!timestamp) {
            return showMessage('Data non valida. Usare il formato GG/MM/AAAA.', 'warning');
        }
        
        const formData = {
            id: Date.now().toString(),
            date: timestamp,
            driver: document.getElementById('load-driver').value.trim().toUpperCase(),
            benzina: parseInt(document.getElementById('load-benzina').value) || 0,
            diffBenzina: parseInt(document.getElementById('load-diff-benzina').value) || 0,
            gasolio: parseInt(document.getElementById('load-gasolio').value) || 0,
            diffGasolio: parseInt(document.getElementById('load-diff-gasolio').value) || 0,
            diesel: parseInt(document.getElementById('load-diesel').value) || 0,
            diffDiesel: parseInt(document.getElementById('load-diff-diesel').value) || 0,
            hvolution: parseInt(document.getElementById('load-hvolution').value) || 0,
            diffHvolution: parseInt(document.getElementById('load-diff-hvolution').value) || 0,
            timestamp: new Date().toISOString()
        };
        
        if (!formData.driver) {
            return showMessage('Il nome dell\'autista è obbligatorio.', 'warning');
        }
        if (formData.benzina === 0 && formData.gasolio === 0 && formData.diesel === 0 && formData.hvolution === 0) {
            return showMessage('Inserire almeno un prodotto caricato.', 'warning');
        }

        this.cargoData.history.push(formData);
        this.saveAndRefresh();
        this.closeModal();
        showMessage('Carico salvato con successo!', 'info');
    }

    deleteCargo(timestamp) {
        showConfirmModal(
            'Eliminare Carico?',
            'Sei sicuro di voler eliminare questo carico dalla cronologia?',
            () => {
                this.cargoData.history = this.cargoData.history.filter(c => c.timestamp !== timestamp);
                this.saveAndRefresh();
                showMessage('Carico eliminato.', 'info');
            }
        );
    }

    editCargo(timestamp) {
        const cargo = this.cargoData.history.find(c => c.timestamp === timestamp);
        if (!cargo) return;

        this.showEditCargoModal(cargo, (updatedCargo) => {
            const index = this.cargoData.history.findIndex(c => c.timestamp === timestamp);
            if (index !== -1) {
                this.cargoData.history[index] = { ...updatedCargo, timestamp: cargo.timestamp };
                this.saveAndRefresh();
                showMessage('Carico modificato con successo!', 'info');
            }
        });
    }

    showEditCargoModal(cargo, onConfirm) {
        const existingModal = document.getElementById('edit-cargo-modal');
        if (existingModal) existingModal.remove();

        const cargoDate = parseDate(cargo.date);
        const formattedDate = cargoDate ? formatter.toLocaleDate(cargoDate) : '';

        const modalHTML = `
            <div class="modal-overlay" id="edit-cargo-modal">
                <div class="modal">
                    <div class="modal-header">
                        <h3 class="modal-title">Modifica Carico</h3>
                        <button class="modal-close-btn" id="edit-close-modal" title="Chiudi"><i class="fa-solid fa-xmark"></i></button>
                    </div>
                    <div class="modal-content">
                        <form class="modal-form" id="editCargoForm">
                            <div class="form-row">
                                <div class="form-group">
                                    <label class="form-label">Data Carico</label>
                                    <input type="text" class="form-input" id="edit-load-date" value="${formattedDate}" placeholder="GG/MM/AAAA" required>
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Autista</label>
                                    <input type="text" class="form-input autista-input" id="edit-load-driver" value="${cargo.driver || ''}" placeholder="Nome autista" required>
                                </div>
                            </div>
                            <div class="form-group full-width">
                                <div class="product-inputs">
                                    <div class="product-input-group">
                                        <div class="product-input-label benzina">Benzina</div>
                                        <input type="number" class="form-input" id="edit-load-benzina" value="${cargo.benzina || 0}" placeholder="0" step="1000" min="0">
                                        <input type="number" class="form-input product-diff-input" id="edit-load-diff-benzina" value="${cargo.diffBenzina || 0}" placeholder="+/- 0">
                                    </div>
                                    <div class="product-input-group">
                                        <div class="product-input-label gasolio">Gasolio</div>
                                        <input type="number" class="form-input" id="edit-load-gasolio" value="${cargo.gasolio || 0}" placeholder="0" step="1000" min="0">
                                        <input type="number" class="form-input product-diff-input" id="edit-load-diff-gasolio" value="${cargo.diffGasolio || 0}" placeholder="+/- 0">
                                    </div>
                                    <div class="product-input-group">
                                        <div class="product-input-label diesel">Diesel+</div>
                                        <input type="number" class="form-input" id="edit-load-diesel" value="${cargo.diesel || 0}" placeholder="0" step="1000" min="0">
                                        <input type="number" class="form-input product-diff-input" id="edit-load-diff-diesel" value="${cargo.diffDiesel || 0}" placeholder="+/- 0">
                                    </div>
                                    <div class="product-input-group">
                                        <div class="product-input-label hvolution">HVOlution</div>
                                        <input type="number" class="form-input" id="edit-load-hvolution" value="${cargo.hvolution || 0}" placeholder="0" step="1000" min="0">
                                        <input type="number" class="form-input product-diff-input" id="edit-load-diff-hvolution" value="${cargo.diffHvolution || 0}" placeholder="+/- 0">
                                    </div>
                                </div>
                            </div>

                            <div class="modal-actions">
                                <button type="button" class="action-btn btn-danger" id="edit-cancel-modal">
                                    <i class="fa-solid fa-xmark"></i>ANNULLA
                                </button>
                                <button type="submit" class="action-btn btn-success">
                                    <i class="fa-solid fa-check"></i>SALVA MODIFICHE
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);

        const modal = document.getElementById('edit-cargo-modal');
        const form = document.getElementById('editCargoForm');
        
        const hideModal = () => {
            modal.classList.remove('active');
            setTimeout(() => modal.remove(), 300);
        };

        document.getElementById('edit-close-modal').addEventListener('click', hideModal);
        document.getElementById('edit-cancel-modal').addEventListener('click', hideModal);

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const dateValue = document.getElementById('edit-load-date').value;
            const timestamp = createDateTimestamp(dateValue);

            if (!timestamp) {
                showMessage('Data non valida. Usare il formato GG/MM/AAAA.', 'warning');
                return;
            }

            const updatedCargo = {
                date: timestamp,
                driver: document.getElementById('edit-load-driver').value.trim().toUpperCase(),
                benzina: parseInt(document.getElementById('edit-load-benzina').value) || 0,
                diffBenzina: parseInt(document.getElementById('edit-load-diff-benzina').value) || 0,
                gasolio: parseInt(document.getElementById('edit-load-gasolio').value) || 0,
                diffGasolio: parseInt(document.getElementById('edit-load-diff-gasolio').value) || 0,
                diesel: parseInt(document.getElementById('edit-load-diesel').value) || 0,
                diffDiesel: parseInt(document.getElementById('edit-load-diff-diesel').value) || 0,
                hvolution: parseInt(document.getElementById('edit-load-hvolution').value) || 0,
                diffHvolution: parseInt(document.getElementById('edit-load-diff-hvolution').value) || 0
            };
            
            if (!updatedCargo.driver) {
                showMessage('Il nome dell\'autista è obbligatorio.', 'warning');
                return;
            }
            if (updatedCargo.benzina === 0 && updatedCargo.gasolio === 0 && updatedCargo.diesel === 0 && updatedCargo.hvolution === 0) {
                showMessage('Inserire almeno un prodotto caricato.', 'warning');
                return;
            }

            onConfirm(updatedCargo);
            hideModal();
        });

        modal.addEventListener('click', (e) => {
            if (e.target.id === 'edit-cargo-modal') hideModal();
        });

        modal.classList.add('active');
        document.getElementById('edit-load-driver').focus();
    }
    
    updateTotals(dateRange = null, filterLabel = '') {
        const box = document.getElementById('box-sinistro');
        let dataToProcess;
        let periodTotals = { benzina: 0, gasolio: 0, diesel: 0, hvolution: 0 };
        
        if (dateRange) {
            box.classList.add('period-filtered');
            this.currentPeriodLabel = `TOTALE ${filterLabel.toUpperCase()}`;
            dataToProcess = this.cargoData.history.filter(c => {
                const cargoDate = parseDate(c.date);
                return cargoDate && cargoDate >= dateRange.start && cargoDate <= dateRange.end;
            });
            document.getElementById('box-title-anno').textContent = this.currentPeriodLabel;
        } else {
            box.classList.remove('period-filtered');
            this.currentPeriodLabel = `TOTALE ANNO (${this.currentYear})`;
            dataToProcess = this.cargoData.history.filter(c => {
                const cargoDate = parseDate(c.date);
                return cargoDate && cargoDate.getFullYear() === this.currentYear;
            });
            this.updateYearDisplay();
        }
        
        this.currentlyDisplayedData = dataToProcess;
        
        const diffs = { benzina: 0, gasolio: 0, diesel: 0, hvolution: 0 };
        const diffsPositive = { benzina: 0, gasolio: 0, diesel: 0, hvolution: 0 };
        const diffsNegative = { benzina: 0, gasolio: 0, diesel: 0, hvolution: 0 };
        
        dataToProcess.forEach(cargo => {
            periodTotals.benzina += cargo.benzina || 0;
            diffs.benzina += cargo.diffBenzina || 0;
            if (cargo.diffBenzina > 0) diffsPositive.benzina += cargo.diffBenzina;
            else diffsNegative.benzina += cargo.diffBenzina;

            periodTotals.gasolio += cargo.gasolio || 0;
            diffs.gasolio += cargo.diffGasolio || 0;
            if (cargo.diffGasolio > 0) diffsPositive.gasolio += cargo.diffGasolio;
            else diffsNegative.gasolio += cargo.diffGasolio;

            periodTotals.diesel += cargo.diesel || 0;
            diffs.diesel += cargo.diffDiesel || 0;
            if (cargo.diffDiesel > 0) diffsPositive.diesel += cargo.diffDiesel;
            else diffsNegative.diesel += cargo.diffDiesel;

            periodTotals.hvolution += cargo.hvolution || 0;
            diffs.hvolution += cargo.diffHvolution || 0;
            if (cargo.diffHvolution > 0) diffsPositive.hvolution += cargo.diffHvolution;
            else diffsNegative.hvolution += cargo.diffHvolution;
        });
        
        this.currentlyDisplayedTotals = periodTotals;

        if (!dateRange) {
            this.cargoData.totals = periodTotals;
        }

        this.renderTotals(periodTotals, diffs, diffsPositive, diffsNegative);
        this.updateSummaryBoxes(dataToProcess);
        this.renderCarichiChart(periodTotals);
        this.renderMonthlyLoadChart();
    }
    
    renderTotals(totals, diffs, diffsPositive, diffsNegative) {
        ['benzina', 'gasolio', 'diesel', 'hvolution'].forEach(p => {
            const litriEl = document.getElementById(`litri-${p}`);
            if (litriEl) litriEl.value = formatter.liters(totals[p]);

            const piuEl = document.getElementById(`piu-${p}`);
            if (piuEl) piuEl.value = formatter.liters(diffsPositive[p] || 0);

            const menoEl = document.getElementById(`meno-${p}`);
            if (menoEl) menoEl.value = formatter.liters(diffsNegative[p] || 0); 

            const diffInput = document.getElementById(`diff-${p}`);
            if (diffInput) {
                const diffValue = diffs[p];
                diffInput.value = formatter.diff.format(diffValue);
                diffInput.style.color = diffValue > 0 ? 'var(--success)' : diffValue < 0 ? 'var(--danger)' : 'var(--text-secondary)';
            }
            const rimanenza = this.cargoData.rimanenze[p] || 0;
            const totaleEl = document.getElementById(`totale-${p}`);
            if (totaleEl) totaleEl.value = formatter.liters(totals[p] + diffs[p] + rimanenza);
        });

        this.renderGrandTotals(totals, diffs, diffsPositive, diffsNegative);
    }

    renderGrandTotals(totals, diffs, diffsPositive, diffsNegative) {
        const totalLitri = Object.values(totals).reduce((sum, val) => sum + (val || 0), 0);
        const totalPiu = Object.values(diffsPositive).reduce((sum, val) => sum + (val || 0), 0);
        const totalMeno = Object.values(diffsNegative).reduce((sum, val) => sum + (val || 0), 0);
        const totalDiff = Object.values(diffs).reduce((sum, val) => sum + (val || 0), 0);
        const totalRimanenze = Object.values(this.cargoData.rimanenze).reduce((sum, val) => sum + (val || 0), 0);
        const totalFinale = totalLitri + totalDiff + totalRimanenze;

        const totaliLitriEl = document.getElementById('totali-litri');
        if (totaliLitriEl) totaliLitriEl.value = formatter.liters(totalLitri);

        const totaliPiuEl = document.getElementById('totali-piu');
        if (totaliPiuEl) totaliPiuEl.value = formatter.liters(totalPiu);

        const totaliMenoEl = document.getElementById('totali-meno');
        if (totaliMenoEl) totaliMenoEl.value = formatter.liters(totalMeno);

        const totaliDiffEl = document.getElementById('totali-diff');
        if (totaliDiffEl) {
            totaliDiffEl.value = formatter.diff.format(totalDiff);
            totaliDiffEl.style.color = totalDiff > 0 ? 'var(--success)' : totalDiff < 0 ? 'var(--danger)' : 'var(--text-secondary)';
        }

        const totaliRimanenzaEl = document.getElementById('totali-rimanenza');
        if (totaliRimanenzaEl) totaliRimanenzaEl.value = formatter.liters(totalRimanenze);

        const totaliTotaleEl = document.getElementById('totali-totale');
        if (totaliTotaleEl) totaliTotaleEl.value = formatter.liters(totalFinale);
    }

    renderHistory() {
        const tbody = document.getElementById('history-tbody');
        if(!tbody) return;
        tbody.innerHTML = '';
        
        const currentYearHistory = this.cargoData.history.filter(c => {
            const cargoDate = parseDate(c.date);
            return cargoDate && cargoDate.getFullYear() === this.currentYear;
        });
        
        if (currentYearHistory.length === 0) {
            tbody.innerHTML = `<tr><td colspan="11" style="text-align:center; padding: 20px;">Nessun carico per il ${this.currentYear}</td></tr>`;
            return;
        }
        
        currentYearHistory
            .sort((a, b) => (parseDate(b.date) || 0) - (parseDate(a.date) || 0))
            .forEach((cargo) => {
                const row = tbody.insertRow();
                row.innerHTML = `
                    <td>${formatter.toLocaleDate(parseDate(cargo.date)) || 'Data non valida'}</td>
                    <td>${formatter.liters(cargo.benzina || 0)}</td>
                    <td>${formatter.diff.format(cargo.diffBenzina || 0)}</td>
                    <td>${formatter.liters(cargo.gasolio || 0)}</td>
                    <td>${formatter.diff.format(cargo.diffGasolio || 0)}</td>
                    <td>${formatter.liters(cargo.diesel || 0)}</td>
                    <td>${formatter.diff.format(cargo.diffDiesel || 0)}</td>
                    <td>${formatter.liters(cargo.hvolution || 0)}</td>
                    <td>${formatter.diff.format(cargo.diffHvolution || 0)}</td>
                    <td style="text-transform: uppercase; text-align: left; padding-left: 8px;">${getDriverSurname(cargo.driver || '')}</td>
                    <td>
                        <button class="edit-btn" data-timestamp="${cargo.timestamp}" title="Modifica carico"><i class="fa-solid fa-pen-to-square"></i></button>
                        <button class="delete-btn" data-timestamp="${cargo.timestamp}" title="Elimina carico"><i class="fa-solid fa-xmark"></i></button>
                    </td>
                `;
                
                const editBtn = row.querySelector('.edit-btn');
                const deleteBtn = row.querySelector('.delete-btn');
                
                if (editBtn) {
                    editBtn.addEventListener('click', (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        this.editCargo(cargo.timestamp);
                    });
                }
                
                if (deleteBtn) {
                    deleteBtn.addEventListener('click', (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        this.deleteCargo(cargo.timestamp);
                    });
                }
            });
    }
    
    renderCarichiChart(totalsToRender) {
        const canvas = document.getElementById('carichiChart');
        if (!canvas) return;
        if (this.carichiChart) this.carichiChart.destroy();
        if (typeof Chart === 'undefined') return;

        const totals = totalsToRender;

        const rootStyles = getComputedStyle(document.documentElement);
        const productColors = {
            benzina: rootStyles.getPropertyValue('--product-benzina').trim(),
            gasolio: rootStyles.getPropertyValue('--product-gasolio').trim(),
            diesel: rootStyles.getPropertyValue('--product-diesel').trim(),
            hvolution: rootStyles.getPropertyValue('--product-hvolution').trim()
        };

        this.carichiChart = new Chart(canvas, {
            type: 'bar',
            data: {
                labels: ['Benzina', 'Gasolio', 'Diesel+', 'HVOlution'],
                datasets: [{ 
                    label: 'Litri Caricati', 
                    data: [totals.benzina || 0, totals.gasolio || 0, totals.diesel || 0, totals.hvolution || 0], 
                    backgroundColor: [
                        productColors.benzina,
                        productColors.gasolio,
                        productColors.diesel,
                        productColors.hvolution
                    ], 
                    borderRadius: 8 
                }]
            },
            options: {
                responsive: true, 
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {  
                    x: { ticks: { color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary') } },  
                    y: { ticks: { color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary') } }  
                }
            }
        });
    }

    renderMonthlyLoadChart() {
        const canvas = document.getElementById('monthlyLoadChart');
        if (!canvas) return;
        if (this.monthlyLoadChart) this.monthlyLoadChart.destroy();
        if (typeof Chart === 'undefined') return;

        const currentYearData = this.cargoData.history.filter(c => {
            const cargoDate = parseDate(c.date);
            return cargoDate && cargoDate.getFullYear() === this.currentYear;
        });

        const monthlyTotals = Array(12).fill(0);
        const monthlyDiffs = Array(12).fill(0);

        currentYearData.forEach(cargo => {
            const cargoDate = parseDate(cargo.date);
            if (cargoDate) {
                const month = cargoDate.getMonth();
                monthlyTotals[month] += (cargo.benzina || 0) + (cargo.gasolio || 0) + (cargo.diesel || 0) + (cargo.hvolution || 0);
                monthlyDiffs[month] += (cargo.diffBenzina || 0) + (cargo.diffGasolio || 0) + (cargo.diffDiesel || 0) + (cargo.diffHvolution || 0);
            }
        });

        const monthLabels = ["Gen", "Feb", "Mar", "Apr", "Mag", "Giu", "Lug", "Ago", "Set", "Ott", "Nov", "Dic"];
        const rootStyles = getComputedStyle(document.documentElement);
        const primaryBlue = rootStyles.getPropertyValue('--primary-blue').trim();
        const infoColor = rootStyles.getPropertyValue('--info').trim();
        const textColor = rootStyles.getPropertyValue('--text-secondary').trim();

        this.monthlyLoadChart = new Chart(canvas, {
            type: 'line',
            data: {
                labels: monthLabels,
                datasets: [
                    {
                        label: 'Litri Caricati',
                        data: monthlyTotals,
                        borderColor: primaryBlue,
                        backgroundColor: 'rgba(9, 63, 180, 0.2)',
                        fill: true,
                        tension: 0.3,
                        pointBackgroundColor: primaryBlue,
                        pointBorderColor: '#fff',
                        pointHoverBackgroundColor: primaryBlue,
                        pointHoverBorderColor: 'rgba(9, 63, 180, 0.2)',
                    },
                    {
                        label: 'Differenze',
                        data: monthlyDiffs,
                        borderColor: infoColor,
                        backgroundColor: 'rgba(10, 186, 181, 0.2)',
                        fill: true,
                        tension: 0.3,
                        pointBackgroundColor: infoColor,
                        pointBorderColor: '#fff',
                        pointHoverBackgroundColor: infoColor,
                        pointHoverBorderColor: 'rgba(10, 186, 181, 0.2)',
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: {
                            color: textColor
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                let label = context.dataset.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                if (context.parsed.y !== null) {
                                    label += formatter.liters(context.parsed.y) + ' L';
                                }
                                return label;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        ticks: { color: textColor },
                        grid: { color: 'rgba(148, 163, 184, 0.2)' }
                    },
                    y: {
                        ticks: { color: textColor },
                        grid: { color: 'rgba(148, 163, 184, 0.2)' }
                    }
                }
            }
        });
    }

    updateYearDisplay() {
        const year = this.currentYear;
        const boxTitle = document.getElementById('box-title-anno');
        const rimanenzaHeader = document.getElementById('rimanenza-header');

        if(boxTitle) boxTitle.textContent = `TOTALE ANNO (${year})`;
        if(rimanenzaHeader) rimanenzaHeader.textContent = `(${year - 1})`;
    }

    saveRimanenzeFromUI(triggerRefresh = true) {
        ['benzina', 'gasolio', 'diesel', 'hvolution'].forEach(p => {
            const input = document.getElementById(`rimanenza-${p}`);
            if (input) this.cargoData.rimanenze[p] = parseInt(input.value.replace(/\./g, '')) || 0;
        });
        Storage.save(Storage.KEYS.CARICO_RIMANENZE, this.cargoData.rimanenze);
        if (triggerRefresh) {
            this.updateTotals();
        }
    }

    loadRimanenzeUI() {
        ['benzina', 'gasolio', 'diesel', 'hvolution'].forEach(p => {
            const input = document.getElementById(`rimanenza-${p}`);
            if (input) input.value = formatter.liters(this.cargoData.rimanenze[p] || 0);
        });
    }

    resetYear() {
        showConfirmModal(
            `Resettare Anno ${this.currentYear}?`,
            `Questa azione eliminerà tutti i dati di carico e le rimanenze per l'anno corrente. L'azione non può essere annullata.`,
            () => {
                this.cargoData.history = this.cargoData.history.filter(c => {
                    const cargoDate = parseDate(c.date);
                    return !cargoDate || cargoDate.getFullYear() !== this.currentYear;
                });
                
                this.cargoData.rimanenze = {};
                this.saveAndRefresh();
                this.loadRimanenzeUI();
                showMessage(`Dati per l'anno ${this.currentYear} cancellati.`, 'info');
            }
        );
    }
    
    stampaDati() {
        const carichiChartImage = this.carichiChart ? this.carichiChart.toBase64Image('image/png', 1) : '';
        const monthlyLoadChartImage = this.monthlyLoadChart ? this.monthlyLoadChart.toBase64Image('image/png', 1) : '';

        const printContent = this.generatePrintContent(
            this.currentlyDisplayedData, 
            this.currentlyDisplayedTotals, 
            this.currentPeriodLabel, 
            carichiChartImage,
            monthlyLoadChartImage
        );
        
        const printWindow = window.open('', '_blank');
        printWindow.document.write(printContent);
        printWindow.document.close();
        printWindow.onload = () => { setTimeout(() => { printWindow.print(); printWindow.close(); }, 500); };
        showMessage('Generazione report in corso...', 'info');
    }

    generatePrintContent(data, totals, periodLabel, carichiChartImage, monthlyLoadChartImage) {
        const currentDate = new Date().toLocaleString('it-IT');
        
        let summary = {
            totaleLitri: 0,
            prodottoTop: '--',
            maxLitri: 0,
            autistaTop: '--',
            maxCarichi: 0
        };

        const prodottiTotali = { ...totals };
        summary.totaleLitri = Object.values(prodottiTotali).reduce((a, b) => a + b, 0);

        for (const [prodotto, litri] of Object.entries(prodottiTotali)) {
            if (litri > summary.maxLitri) {
                summary.maxLitri = litri;
                summary.prodottoTop = prodotto.toUpperCase();
            }
        }

        const autistiCarichi = {};
        data.forEach(cargo => {
            if (cargo.driver) {
                const autista = cargo.driver.trim().toUpperCase();
                autistiCarichi[autista] = (autistiCarichi[autista] || 0) + 1;
            }
        });
        for (const [autista, n] of Object.entries(autistiCarichi)) {
            if (n > summary.maxCarichi) {
                summary.maxCarichi = n;
                summary.autistaTop = getDriverSurname(autista);
            }
        }

        return `
            <!DOCTYPE html><html><head><title>CERBERO - Report Carichi</title><style>
                body { font-family: Arial, sans-serif; font-size: 11px; line-height: 1.3; color: #333; }
                .print-header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #093fb4; padding-bottom: 10px; }
                .print-title { font-size: 20px; font-weight: bold; color: #093fb4; }
                .print-date, .period-info { font-size: 12px; color: #666; }
                .print-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 20px; text-align: center;}
                .print-stat-item { border: 1px solid #ccc; padding: 10px; border-radius: 8px; }
                .print-stat-value { font-size: 16px; font-weight: bold; color: #093fb4; }
                .print-stat-label { font-size: 10px; text-transform: uppercase; }
                .chart-container { text-align: center; border: 1px solid #eee; padding: 15px; border-radius: 8px; page-break-inside: avoid; margin-bottom: 20px; }
                .chart-title { font-size: 14px; font-weight: bold; margin-bottom: 10px; color: #093fb4; }
                .chart-image { max-width: 80%; height: auto; margin: 0 auto; }
                .print-footer { margin-top: 30px; text-align: center; font-size: 10px; color: #999; border-top: 1px solid #ccc; padding-top: 10px; }
            </style></head><body>
                <div class="print-header"><div class="print-title">Report Carichi - CERBERO</div><div class="print-date">Generato il: ${currentDate}</div></div>
                <div class="period-info" style="text-align:center; margin-bottom: 20px;">Riferimento: <strong>${periodLabel}</strong></div>
                <div class="print-stats">
                    <div class="print-stat-item"><div class="print-stat-value">${formatter.liters(summary.totaleLitri)} L</div><div class="print-stat-label">Totale Caricato</div></div>
                    <div class="print-stat-item"><div class="print-stat-value">${summary.prodottoTop}</div><div class="print-stat-label">Prodotto Top</div></div>
                    <div class="print-stat-item"><div class="print-stat-value">${summary.autistaTop}</div><div class="print-stat-label">Autista Top</div></div>
                </div>
                ${carichiChartImage ? `<div class="chart-container"><div class="chart-title">Grafico Carichi del Periodo</div><img src="${carichiChartImage}" class="chart-image"></div>` : ''}
                ${monthlyLoadChartImage ? `<div class="chart-container"><div class="chart-title">Andamento Carichi Mensili</div><img src="${monthlyLoadChartImage}" class="chart-image"></div>` : ''}
                <div class="print-footer">Report generato dal sistema di gestione CERBERO.</div>
            </body></html>
        `;
    }
}

/* ===== INIZIALIZZAZIONE ===== */
document.addEventListener('DOMContentLoaded', function() {
    try {
        if (typeof Storage === 'undefined') {
            showMessage("Errore critico: storage.js non caricato.", "error");
            return;
        }
        
        ThemeManager.init();
        
        initializeInfoButton();
        
        window.cargoManager = new CargoManager();
        
        window.addEventListener('theme-changed', () => {
            if (window.cargoManager) {
                window.cargoManager.renderCarichiChart(window.cargoManager.currentlyDisplayedTotals);
                window.cargoManager.renderMonthlyLoadChart();
            }
        });
        
    } catch (error) {
        console.error('Errore critico durante l\'inizializzazione di Carico:', error);
        showMessage('Errore critico nell\'avvio del modulo Carico', 'error');
    }
});

window.addEventListener('beforeunload', () => {
    try {
        if (window.cargoManager) {
            window.cargoManager.saveAndRefresh();
        }
    } catch (error) {
        console.error('Errore durante il salvataggio finale:', error);
    }
});