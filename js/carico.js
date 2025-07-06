/* ===== GESTIONE CARICO CARBURANTI - CERBERO ===== */

/* ===== GESTIONE TEMA ===== */
function applyTheme(theme) {
    const lightIcon = document.getElementById('theme-icon-light');
    const darkIcon = document.getElementById('theme-icon-dark');
    document.body.classList.toggle('dark-theme', theme === 'dark');
    if (lightIcon && darkIcon) {
        lightIcon.classList.toggle('theme-icon-hidden', theme === 'dark');
        darkIcon.classList.toggle('theme-icon-hidden', theme !== 'dark');
    }
    Storage.save(Storage.KEYS.THEME, theme);
}

function initializeThemeSwitcher() {
    const themeSwitcher = document.getElementById('theme-switcher');
    if (themeSwitcher) {
        themeSwitcher.addEventListener('click', (e) => {
            e.preventDefault();
            const newTheme = document.body.classList.contains('dark-theme') ? 'light' : 'dark';
            applyTheme(newTheme);
        });
    }
    const savedTheme = Storage.load(Storage.KEYS.THEME, 'light');
    applyTheme(savedTheme);
}

/* ===== NUOVA FUNZIONE PER MODALE INFO ===== */
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

/* ===== UTILITY PER MESSAGGI E MODALI ===== */
function showMessage(message, type = 'info') {
    try {
        const allowedTypes = ['error', 'warning', 'info'];
        if (!allowedTypes.includes(type)) {
            return;
        }
        
        const toast = document.createElement('div');
        toast.className = `toast-message toast-${type}`;
        toast.textContent = message;
        
        const colors = {
            error: '#FF3547',
            info: '#0ABAB5', 
            warning: '#FFD700'
        };
        
        toast.style.cssText = `
            position: fixed; top: 20px; right: 20px;
            background: ${colors[type] || colors.info};
            color: ${type === 'warning' ? '#333' : 'white'};
            padding: 15px 20px; z-index: 1001; font-family: 'Montserrat', sans-serif; font-weight: 600;
            font-size: 14px; box-shadow: 0 4px 20px rgba(0,0,0,0.2); border-radius: 20px;
            max-width: 350px; word-wrap: break-word;
            animation: slideIn 0.3s ease-out;
        `;
        document.body.appendChild(toast);
        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease forwards';
            setTimeout(() => { if (toast.parentNode) toast.parentNode.removeChild(toast); }, 300);
        }, 3000);
    } catch (error) {
        console.error('Errore visualizzazione messaggio:', error);
        alert(message);
    }
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

/* ===== FORMATTAZIONE NUMERI E DATE ===== */
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
    const year = parsedDate.getFullYear();
    const month = parsedDate.getMonth();
    const day = parsedDate.getDate();
    const localDate = new Date(year, month, day, 12, 0, 0, 0);
    const timezoneOffset = localDate.getTimezoneOffset() * 60000;
    const adjustedDate = new Date(localDate.getTime() - timezoneOffset);
    return adjustedDate.toISOString();
};

/* ===== GESTIONE CARICO ===== */
class CargoManager {
    constructor() {
        const loadedHistory = Storage.load(Storage.KEYS.CARICO_HISTORY, []);
        this.cargoData = {
            totals: Storage.load(Storage.KEYS.CARICO_TOTALS, {}),
            history: Array.isArray(loadedHistory) ? loadedHistory : [],
            rimanenze: Storage.load(Storage.KEYS.CARICO_RIMANENZE, {})
        };
        if (!Array.isArray(loadedHistory)) {
             console.warn("Dati 'history' di Carico corrotti, l'array è stato resettato.");
        }
        this.currentYear = new Date().getFullYear();
        this.chart = null;
        this.isEditingHistory = false;
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadRimanenzeUI();
        this.updateTotals();
        this.renderHistory();
        this.renderChart();
        this.updateYearDisplay();
        this.initializeCollapseState();
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
        this.safeBind('btn-stampa', 'click', () => showMessage('Funzione di stampa non ancora disponibile.', 'info'));
        this.safeBind('btn-reset', 'click', () => this.resetYear());
        this.safeBind('newLoadModal', 'click', (e) => {
            if (e.target.id === 'newLoadModal') this.closeModal();
        });
        this.safeBind('collapse-history-btn', 'click', () => this.toggleHistoryCollapse());
        this.safeBind('edit-history-btn', 'click', () => this.toggleEditMode());
        
        ['benzina', 'gasolio', 'diesel', 'hvolution'].forEach(p => {
            this.safeBind(`rimanenza-${p}`, 'change', () => this.saveRimanenzeFromUI());
        });
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
        this.saveAndRefresh();
        const exportableHistory = this.cargoData.history.map(entry => ({...entry, date: formatter.toLocaleDate(parseDate(entry.date)) }));
        const dataToExport = {
            exportDate: new Date().toISOString(),
            exportType: 'carico',
            totals: this.cargoData.totals,
            history: exportableHistory,
            rimanenze: this.cargoData.rimanenze
        };
        const dataStr = JSON.stringify(dataToExport, null, 2);
        const dataBlob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `cerbero_carico_${this.currentYear}.json`;
        a.click();
        URL.revokeObjectURL(url);
        showMessage('Dati carico esportati!', 'info');
    }

    saveAndRefresh() {
        this.saveRimanenzeFromUI(false); 
        this.updateTotals();
        this.renderHistory();
        this.renderChart();
        Storage.save(Storage.KEYS.CARICO_TOTALS, this.cargoData.totals);
        Storage.save(Storage.KEYS.CARICO_HISTORY, this.cargoData.history);
        Storage.save(Storage.KEYS.CARICO_RIMANENZE, this.cargoData.rimanenze);
    }
    
    toggleHistoryCollapse() { 
        const content = document.getElementById('history-box-content');
        const btn = document.getElementById('collapse-history-btn');
        const editBtn = document.getElementById('edit-history-btn');
        
        if (content && btn) {
            const isCollapsed = content.classList.toggle('collapsed');
            btn.classList.toggle('collapsed', isCollapsed);
            
            if (editBtn) {
                editBtn.style.display = isCollapsed ? 'none' : 'inline-block';
            }
            
            if (isCollapsed && this.isEditingHistory) {
                this.isEditingHistory = false;
                if (editBtn) {
                    editBtn.classList.remove('editing');
                    editBtn.title = 'Modifica carichi';
                }
                this.renderHistory();
            }
            
            Storage.save(Storage.KEYS.HISTORY_COLLAPSED, isCollapsed.toString());
        }
    }

    initializeCollapseState() {
        const isCollapsed = Storage.load(Storage.KEYS.HISTORY_COLLAPSED) === 'true';
        const editBtn = document.getElementById('edit-history-btn');
        
        if (isCollapsed) {
            const content = document.getElementById('history-box-content');
            const btn = document.getElementById('collapse-history-btn');
            if(content) content.classList.add('collapsed');
            if(btn) btn.classList.add('collapsed');
            if(editBtn) editBtn.style.display = 'none';
        } else {
            if(editBtn) editBtn.style.display = 'inline-block';
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
            date: timestamp,
            driver: document.getElementById('load-driver').value.trim(),
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

    toggleEditMode() {
        this.isEditingHistory = !this.isEditingHistory;
        this.renderHistory();
        
        const editBtn = document.getElementById('edit-history-btn');
        if (editBtn) {
            editBtn.classList.toggle('editing', this.isEditingHistory);
            editBtn.title = this.isEditingHistory ? 'Fine modifica' : 'Modifica carichi';
        }
        
        showMessage(
            this.isEditingHistory ? 'Modalità modifica attivata' : 'Modalità modifica disattivata', 
            'info'
        );
    }

    editCargo(timestamp) {
        const cargo = this.cargoData.history.find(c => c.timestamp === timestamp);
        if (!cargo) return;

        this.showEditCargoModal(cargo, (updatedCargo) => {
            const index = this.cargoData.history.findIndex(c => c.timestamp === timestamp);
            if (index !== -1) {
                this.cargoData.history[index] = { ...updatedCargo, timestamp };
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
                        <button class="modal-close" id="edit-close-modal">&times;</button>
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
                                    <input type="text" class="form-input" id="edit-load-driver" value="${cargo.driver || ''}" placeholder="Nome autista" required>
                                </div>
                            </div>
                            <div class="form-group full-width">
                                <label class="form-label">Quantità Prodotti e Differenze</label>
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
                                <button type="button" class="action-btn secondary" id="edit-cancel-modal">Annulla</button>
                                <button type="button" class="action-btn warning" id="edit-delete-modal">Elimina Carico</button>
                                <button type="submit" class="action-btn">Salva Modifiche</button>
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

        document.getElementById('edit-delete-modal').addEventListener('click', () => {
            hideModal();
            this.deleteCargo(cargo.timestamp);
        });

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
                driver: document.getElementById('edit-load-driver').value.trim(),
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
    
    updateTotals() {
        const currentYearData = this.cargoData.history.filter(c => {
            const cargoDate = parseDate(c.date);
            return cargoDate && cargoDate.getFullYear() === this.currentYear;
        });
        
        const totals = { benzina: 0, gasolio: 0, diesel: 0, hvolution: 0 };
        const diffs = { benzina: 0, gasolio: 0, diesel: 0, hvolution: 0 };
        const diffsPositive = { benzina: 0, gasolio: 0, diesel: 0, hvolution: 0 };
        const diffsNegative = { benzina: 0, gasolio: 0, diesel: 0, hvolution: 0 };
        
        currentYearData.forEach(cargo => {
            totals.benzina += cargo.benzina || 0;
            diffs.benzina += cargo.diffBenzina || 0;
            if (cargo.diffBenzina > 0) diffsPositive.benzina += cargo.diffBenzina;
            else diffsNegative.benzina += cargo.diffBenzina;

            totals.gasolio += cargo.gasolio || 0;
            diffs.gasolio += cargo.diffGasolio || 0;
            if (cargo.diffGasolio > 0) diffsPositive.gasolio += cargo.diffGasolio;
            else diffsNegative.gasolio += cargo.diffGasolio;

            totals.diesel += cargo.diesel || 0;
            diffs.diesel += cargo.diffDiesel || 0;
            if (cargo.diffDiesel > 0) diffsPositive.diesel += cargo.diffDiesel;
            else diffsNegative.diesel += cargo.diffDiesel;

            totals.hvolution += cargo.hvolution || 0;
            diffs.hvolution += cargo.diffHvolution || 0;
            if (cargo.diffHvolution > 0) diffsPositive.hvolution += cargo.diffHvolution;
            else diffsNegative.hvolution += cargo.diffHvolution;
        });
        
        this.cargoData.totals = totals;
        this.renderTotals(totals, diffs, diffsPositive, diffsNegative); 
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
    }

    renderHistory() {
        const tbody = document.getElementById('history-tbody');
        if(!tbody) return;
        tbody.innerHTML = '';
        
        const table = document.querySelector('.history-table');
        if (table) {
            table.classList.toggle('editing', this.isEditingHistory);
        }
        
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
                    <td>${cargo.driver || ''}</td>
                    <td>
                        <button class="edit-btn" data-timestamp="${cargo.timestamp}">✎</button>
                    </td>
                `;
                
                const editBtn = row.querySelector('.edit-btn');
                
                if (editBtn) {
                    editBtn.addEventListener('click', () => this.editCargo(cargo.timestamp));
                }
            });
    }
    
    renderChart() {
        const canvas = document.getElementById('carichiChart');
        if (!canvas) return;
        if (this.chart) this.chart.destroy();
        if (typeof Chart === 'undefined') return;

        const totals = this.cargoData.totals;

        const rootStyles = getComputedStyle(document.documentElement);
        const productColors = {
            benzina: rootStyles.getPropertyValue('--product-benzina').trim(),
            gasolio: rootStyles.getPropertyValue('--product-gasolio').trim(),
            diesel: rootStyles.getPropertyValue('--product-diesel').trim(),
            hvolution: rootStyles.getPropertyValue('--product-hvolution').trim()
        };

        this.chart = new Chart(canvas, {
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
                    x: { ticks: { color: getComputedStyle(document.body).getPropertyValue('--text-secondary') } },  
                    y: { ticks: { color: getComputedStyle(document.body).getPropertyValue('--text-secondary') } }  
                }
            }
        });
    }

    updateYearDisplay() {
        const year = this.currentYear;
        const boxTitle = document.getElementById('box-title-anno');
        const rimanenzaHeader = document.getElementById('rimanenza-header');

        if(boxTitle) boxTitle.textContent = `TOTALE ANNO (${year})`;
        if(rimanenzaHeader) rimanenzaHeader.textContent = `RIMANENZA (${year - 1})`;
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
}

/* ===== INIZIALIZZAZIONE ===== */
document.addEventListener('DOMContentLoaded', function() {
    try {
        if (typeof Storage === 'undefined') {
            showMessage("Errore critico: storage.js non caricato.", "error");
            return;
        }
        
        initializeThemeSwitcher();
        initializeInfoButton(); // AGGIUNTA CHIAMATA
        
        window.cargoManager = new CargoManager();
        
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