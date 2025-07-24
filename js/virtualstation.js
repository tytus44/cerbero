/* ===== CERBERO VIRTUALSTATION - CLONAZIONE TURNI E IMPORT/EXPORT ===== */

/* ===== GESTIONE TEMA (Copia da monetario.js) ===== */
function applyTheme(theme) {
    try {
        document.documentElement.classList.toggle('dark-theme', theme === 'dark');
        const lightIcon = document.getElementById('theme-icon-light');
        const darkIcon = document.getElementById('theme-icon-dark');
        if (lightIcon && darkIcon) {
            lightIcon.classList.toggle('theme-icon-hidden', theme === 'dark');
            darkIcon.classList.toggle('theme-icon-hidden', theme !== 'dark');
        }
        Storage.save(Storage.KEYS.THEME, theme);
    } catch (error) {
        console.error('Errore applicazione tema:', error);
    }
}

function initializeThemeSwitcher() {
    try {
        const themeSwitcher = document.getElementById('theme-switcher');
        if (themeSwitcher) {
            themeSwitcher.addEventListener('click', (e) => {
                e.preventDefault();
                const newTheme = document.documentElement.classList.contains('dark-theme') ? 'light' : 'dark';
                applyTheme(newTheme);
            });
        }
    } catch (error) {
        console.error('Errore inizializzazione theme switcher:', error);
    }
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

/* ===== UTILITY PER MESSAGGI E MODALI (Copia da monetario.js) ===== */
function showMessage(message, type = 'info') {
    try {
        const allowedTypes = ['error', 'warning', 'info', 'success'];
        if (!allowedTypes.includes(type)) {
            return;
        }
        
        const toast = document.createElement('div');
        toast.className = `toast-message toast-${type}`;
        toast.textContent = message;
        
        const colors = {
            error: '#FF3547',
            info: '#0ABAB5', 
            warning: '#FFD700',
            success: '#00C851'
        };
        
        toast.style.cssText = `
            position: fixed; top: 20px; right: 20px;
            background: ${colors[type] || colors.info};
            color: ${type === 'warning' ? '#333' : 'white'};
            padding: 15px 20px; z-index: 1001;
            font-weight: 600; font-size: 14px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.2); max-width: 350px; word-wrap: break-word;
            animation: slideIn 0.3s ease-out;
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease forwards';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, 3000);
    } catch (error) {
        console.error('Errore visualizzazione messaggio:', error);
        alert(message);
    }
}

function showConfirmModal(title, text, onConfirm) {
    try {
        const modal = document.getElementById('confirm-modal');
        if (!modal) {
            if(confirm(`${title}\n${text}`)) {
                onConfirm();
            }
            return;
        }
        
        const modalTitle = document.getElementById('confirm-modal-title');
        const modalText = document.getElementById('confirm-modal-text');
        const btnOk = document.getElementById('confirm-modal-ok');
        const btnCancel = document.getElementById('confirm-modal-cancel');
        const btnClose = modal.querySelector('.modal-close-btn');

        if (modalTitle) modalTitle.textContent = title;
        if (modalText) modalText.textContent = text;

        const hideModal = () => modal.classList.remove('active');

        if (btnOk) {
            const newBtnOk = btnOk.cloneNode(true);
            btnOk.parentNode.replaceChild(newBtnOk, btnOk);
            newBtnOk.addEventListener('click', () => {
                onConfirm();
                hideModal();
            }, { once: true });
        }
        
        if (btnCancel) {
            const newBtnCancel = btnCancel.cloneNode(true);
            btnCancel.parentNode.replaceChild(newBtnCancel, btnCancel);
            newBtnCancel.addEventListener('click', hideModal, { once: true });
        }
        
        if (btnClose) {
            const newBtnClose = btnClose.cloneNode(true);
            btnClose.parentNode.replaceChild(newBtnClose, btnClose);
            newBtnClose.addEventListener('click', hideModal, { once: true });
        }
        
        modal.classList.add('active');
    } catch (error) {
        console.error('Errore modal:', error);
        if(confirm(`${title}\n${text}`)) {
            onConfirm();
        }
    }
}


const formatter = {
    liters: new Intl.NumberFormat('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    currency: new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }),
};

function parseNumberInput(value) {
    try {
        if (typeof value !== 'string') value = String(value);
        const cleaned = value.replace(/\./g, '').replace(/,/, '.').trim();
        const parsed = parseFloat(cleaned);
        return isNaN(parsed) ? 0 : parsed;
    } catch (error) {
        console.error('Errore parsing numero:', error);
        return 0;
    }
}

/* ===== VIRTUALSTATION MANAGER (Gestore di tutti i turni) ===== */
class VirtualstationManager {
    constructor() {
        let loadedData = Storage.load(Storage.KEYS.VIRTUALSTATION_DATA, {});
        if (typeof loadedData !== 'object' || loadedData === null) {
            console.warn("Dati Virtualstation caricati non validi, resetto a oggetto vuoto.");
            loadedData = {};
        }
        this.data = loadedData;
        this.products = ['gasolio', 'diesel', 'adblue', 'benzina', 'hvolution'];
        this.types = ['iperself', 'servito', 'self-service'];
        this.monetaryPrices = {};
        this.nextTurnIndex = Object.keys(this.data).filter(key => key.startsWith('turn-')).length;
        
        const template = document.getElementById('turn-block-0');
        if (template) {
            this.turnBlockTemplate = template.cloneNode(true);
            this.turnBlockTemplate.removeAttribute('id');
            this.turnBlockTemplate.style.display = ''; 
        } else {
            console.error("Template 'turn-block-0' non trovato!");
            return; 
        }

        const turnsContainer = document.getElementById('turns-container');
        if (turnsContainer) {
            turnsContainer.innerHTML = '';
        }
        this.turnManagers = [];

        if (this.data.globalTotals === undefined) {
            this.data.globalTotals = {
                iperself: { liters: 0, amount: 0 },
                servito: { liters: 0, amount: 0 },
                selfService: { liters: 0, amount: 0 },
                general: { liters: 0, amount: 0 }
            };
        }
        this.init();
    }

    updateAllTurnsInStorage() {
        const turnKeys = Object.keys(this.data)
            .filter(key => key.startsWith('turn-'))
            .sort((a, b) => parseInt(a.split('-')[1]) - parseInt(b.split('-')[1]));

        const allTurnNumbers = turnKeys
            .map(key => this.data[key].turnNumber)
            .filter(num => num !== null && num !== undefined && num !== '');

        const turnString = allTurnNumbers.join(', ');
        Storage.save(Storage.KEYS.CURRENT_TURNO, turnString);
    }

    loadMonetaryPrices() {
        const monetaryData = Storage.load(Storage.KEYS.MONETARIO_DATA, { pricing: {} });
        this.products.forEach(product => {
            const pricingInfo = monetaryData.pricing[product];
            if (pricingInfo) {
                if (product === 'adblue') {
                    this.monetaryPrices[product] = {
                        servito: pricingInfo.price || 0,
                        iperself: pricingInfo.price || 0 
                    };
                } else {
                    this.monetaryPrices[product] = {
                        servito: pricingInfo.servito || 0,
                        iperself: pricingInfo.iperself || 0
                    };
                }
            } else {
                this.monetaryPrices[product] = { servito: 0, iperself: 0 };
                console.warn(`Prezzi per ${product} non trovati in monetario.js.`);
            }
        });
    }

    init() {
        this.loadMonetaryPrices(); 
        const turnKeys = Object.keys(this.data).filter(key => key.startsWith('turn-')).sort((a,b) => parseInt(a.split('-')[1]) - parseInt(b.split('-')[1]));
        
        if (turnKeys.length === 0) {
            this.addTurnBlockInternal(0, true);
        } else {
            turnKeys.forEach(key => {
                const index = key.split('-')[1];
                this.addTurnBlockInternal(parseInt(index), true);
            });
            this.nextTurnIndex = turnKeys.length;
        }

        const addTurnBtn = document.getElementById('add-turn-btn');
        if (addTurnBtn) {
            addTurnBtn.addEventListener('click', () => this.addTurnBlock());
        }

        const resetTurnsBtn = document.getElementById('reset-turns-btn');
        if (resetTurnsBtn) {
            resetTurnsBtn.addEventListener('click', () => this.confirmResetTurns());
        }
        this.updateGlobalTotals();
        this.updateAllTurnsInStorage();
    }

    addTurnBlockInternal(turnIndex, isInitialLoad = false) {
        const newTurnBlock = this.turnBlockTemplate.cloneNode(true);
        newTurnBlock.id = `turn-block-${turnIndex}`;
        newTurnBlock.querySelectorAll('[id]').forEach(element => {
            element.id = element.id.replace(/-\d+$/, `-${turnIndex}`);
        });

        const deleteBtn = newTurnBlock.querySelector('.delete-turn-btn');
        if (deleteBtn) {
            const isOnlyOneTurn = this.turnManagers.length < 1 && isInitialLoad;
            deleteBtn.style.display = isOnlyOneTurn ? 'none' : 'flex';
            deleteBtn.dataset.turnIndex = turnIndex;
            deleteBtn.onclick = () => this.confirmDeleteTurn(turnIndex);
        }
        
        document.getElementById('turns-container').appendChild(newTurnBlock);
        if (!this.data[`turn-${turnIndex}`]) {
            this.data[`turn-${turnIndex}`] = {};
        }

        const manager = new SingleTurnManager(turnIndex.toString(), this.data[`turn-${turnIndex}`], this.monetaryPrices, this);
        this.turnManagers.push(manager);

        if (!isInitialLoad && Object.keys(this.data[`turn-${turnIndex}`]).length === 0) {
             manager.resetInputs(); 
        }
        manager.populateTurnNumber(); 
        manager.updateTotals();
        this.updateGlobalTotals();
    }

    addTurnBlock() {
        showConfirmModal('Aggiungi Turno', 'Vuoi aggiungere un nuovo turno?', () => {
            const newTurnIndex = this.nextTurnIndex++;
            this.addTurnBlockInternal(newTurnIndex, false);
            Storage.save(Storage.KEYS.VIRTUALSTATION_DATA, this.data);
            this.updateGlobalTotals();
            this.updateAllTurnsInStorage();

            if(this.turnManagers.length > 1) {
                const firstTurnDeleteBtn = document.querySelector('#turn-block-0 .delete-turn-btn');
                if (firstTurnDeleteBtn) firstTurnDeleteBtn.style.display = 'flex';
            }
        });
    }

    confirmDeleteTurn(turnIndex) {
        showConfirmModal('Elimina Turno', `Sei sicuro di voler eliminare il turno? L'azione non è reversibile.`, () => this.deleteTurn(turnIndex));
    }

    deleteTurn(turnIndex) {
        delete this.data[`turn-${turnIndex}`];
        const turnElement = document.getElementById(`turn-block-${turnIndex}`);
        if (turnElement) turnElement.remove();
        this.turnManagers = this.turnManagers.filter(manager => manager.turnIndex !== turnIndex.toString());
        
        let reindexedData = { globalTotals: this.data.globalTotals || {} };
        let reindexedManagers = [];
        let currentNewIndex = 0;
        
        const sortedTurnKeys = Object.keys(this.data).filter(key => key.startsWith('turn-')).sort((a,b) => parseInt(a.split('-')[1]) - parseInt(b.split('-')[1]));
        
        sortedTurnKeys.forEach(oldKey => {
            const oldIndex = parseInt(oldKey.split('-')[1]);
            const newKey = `turn-${currentNewIndex}`;
            reindexedData[newKey] = this.data[oldKey];
            const oldTurnBlockElement = document.getElementById(`turn-block-${oldIndex}`);
            if (oldTurnBlockElement) {
                oldTurnBlockElement.id = `turn-block-${currentNewIndex}`;
                oldTurnBlockElement.querySelectorAll('[id]').forEach(element => {
                    element.id = element.id.replace(/-\d+$/, `-${currentNewIndex}`);
                });

                const reindexedDeleteBtn = oldTurnBlockElement.querySelector('.delete-turn-btn'); 
                if(reindexedDeleteBtn) {
                    reindexedDeleteBtn.dataset.turnIndex = currentNewIndex;
                    reindexedDeleteBtn.onclick = () => this.confirmDeleteTurn(currentNewIndex);
                    reindexedDeleteBtn.style.display = (sortedTurnKeys.length > 1) ? 'flex' : 'none';
                }
            }
            const managerToReindex = this.turnManagers.find(mgr => mgr.turnIndex === oldKey.split('-')[1]);
            if (managerToReindex) {
                managerToReindex.turnIndex = currentNewIndex.toString();
                managerToReindex.data = reindexedData[newKey];
                managerToReindex.populateTurnNumber();
                reindexedManagers.push(managerToReindex);
            }
            currentNewIndex++;
        });

        this.data = reindexedData;
        this.turnManagers = reindexedManagers;
        this.nextTurnIndex = currentNewIndex;
        
        Storage.save(Storage.KEYS.VIRTUALSTATION_DATA, this.data);
        showMessage(`Turno eliminato!`, 'info');
        
        if (this.turnManagers.length === 0) {
            this.addTurnBlockInternal(0, true);
        } else if (this.turnManagers.length === 1) {
            const onlyTurnDeleteBtn = document.querySelector('#turn-block-0 .delete-turn-btn');
            if (onlyTurnDeleteBtn) onlyTurnDeleteBtn.style.display = 'none';
        }

        this.updateGlobalTotals();
        this.updateAllTurnsInStorage();
    }


    confirmResetTurns() {
        showConfirmModal('Reset Tutti i Turni', 'Sei sicuro di voler cancellare tutti i turni? L\'operazione è irreversibile.', () => this.resetAllTurns());
    }

    resetAllTurns() {
        this.data = { globalTotals: this.data.globalTotals || {} };
        const turnsContainer = document.getElementById('turns-container');
        if (turnsContainer) turnsContainer.innerHTML = '';
        this.turnManagers = [];
        this.nextTurnIndex = 0;
        this.addTurnBlockInternal(0, true);
        Storage.save(Storage.KEYS.VIRTUALSTATION_DATA, this.data);
        showMessage('Tutti i turni sono stati resettati!', 'info');
        this.updateGlobalTotals();
        this.updateAllTurnsInStorage();
    }
    
    exportData() {
        const dataToExport = {
            exportDate: new Date().toISOString(),
            exportType: 'virtualstation_all_turns',
            version: '1.0',
            turnsData: this.data,
            monetaryPricesSnapshot: this.monetaryPrices
        };
        const jsonString = JSON.stringify(dataToExport, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `cerbero_virtualstation_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showMessage('Dati Virtualstation esportati!', 'success');
    }

    importData() {
        showConfirmModal('Importa Dati Virtualstation?', 'Questo sovrascriverà i dati correnti.', () => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.json';
            input.onchange = (event) => {
                const file = event.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        try {
                            const importedData = JSON.parse(e.target.result);
                            if (importedData.exportType === 'virtualstation_all_turns' && importedData.turnsData) {
                                this.data = importedData.turnsData;
                                if (this.data.globalTotals === undefined || typeof this.data.globalTotals !== 'object') {
                                    this.data.globalTotals = { iperself: { liters: 0, amount: 0 }, servito: { liters: 0, amount: 0 }, selfService: { liters: 0, amount: 0 }, general: { liters: 0, amount: 0 } };
                                }
                                const turnsContainer = document.getElementById('turns-container');
                                if (turnsContainer) turnsContainer.innerHTML = '';
                                this.turnManagers = [];
                                const turnKeys = Object.keys(this.data).filter(key => key.startsWith('turn-')).sort((a,b) => parseInt(a.split('-')[1]) - parseInt(b.split('-')[1]));
                                this.nextTurnIndex = 0;
                                turnKeys.forEach(key => {
                                    const index = parseInt(key.split('-')[1]);
                                    this.addTurnBlockInternal(index, true);
                                    this.nextTurnIndex++;
                                });
                                if (turnKeys.length === 0) {
                                    this.addTurnBlockInternal(0, true);
                                }
                                Storage.save(Storage.KEYS.VIRTUALSTATION_DATA, this.data);
                                showMessage('Dati importati! Pagina aggiornata.', 'info');
                                this.updateGlobalTotals();
                                this.updateAllTurnsInStorage();
                            } else {
                                showMessage('Errore: File JSON non valido.', 'error');
                            }
                        } catch (error) {
                            showMessage('Errore: file corrotto o formato non valido.', 'error');
                            console.error('Errore importazione:', error);
                        }
                    };
                    reader.readAsText(file);
                }
            };
            input.click();
        });
    }
    
    updateGlobalTotals() {
        let totalGlobalIperselfLiters = 0, totalGlobalIperselfAmount = 0, totalGlobalServitoLiters = 0, totalGlobalServitoAmount = 0,
            totalGlobalSelfServiceLiters = 0, totalGlobalSelfServiceAmount = 0, totalGlobalLiters = 0, totalGlobalAmount = 0;

        Object.keys(this.data).filter(key => key.startsWith('turn-')).forEach(turnKey => {
            const turnData = this.data[turnKey];
            this.products.forEach(product => {
                const productData = turnData[product] || {}; 
                const priceServito = this.monetaryPrices[product]?.servito || 0;
                const priceIperself = this.monetaryPrices[product]?.iperself || 0; 
                const iperselfLiters = productData.iperself || 0;
                const servitoLiters = productData.servito || 0;
                const selfServiceLiters = productData['self-service'] || 0;
                totalGlobalIperselfLiters += iperselfLiters;
                totalGlobalIperselfAmount += iperselfLiters * priceIperself;
                totalGlobalServitoLiters += servitoLiters;
                totalGlobalServitoAmount += servitoLiters * priceServito;
                totalGlobalSelfServiceLiters += selfServiceLiters;
                totalGlobalSelfServiceAmount += selfServiceLiters * priceIperself;
                totalGlobalLiters += iperselfLiters + servitoLiters + selfServiceLiters;
                totalGlobalAmount += (iperselfLiters * priceIperself) + (servitoLiters * priceServito) + (selfServiceLiters * priceIperself);
            });
        });

        this.data.globalTotals = {
            iperself: { liters: totalGlobalIperselfLiters, amount: totalGlobalIperselfAmount },
            servito: { liters: totalGlobalServitoLiters, amount: totalGlobalServitoAmount },
            selfService: { liters: totalGlobalSelfServiceLiters, amount: totalGlobalSelfServiceAmount },
            general: { liters: totalGlobalLiters, amount: totalGlobalAmount }
        };
        Storage.save(Storage.KEYS.VIRTUALSTATION_DATA, this.data);

        document.getElementById('global-iperself-liters').textContent = formatter.liters.format(totalGlobalIperselfLiters) + ' L';
        document.getElementById('global-iperself-amount').textContent = formatter.currency.format(totalGlobalIperselfAmount);
        document.getElementById('global-servito-liters').textContent = formatter.liters.format(totalGlobalServitoLiters) + ' L';
        document.getElementById('global-servito-amount').textContent = formatter.currency.format(totalGlobalServitoAmount);
        document.getElementById('global-self-service-liters').textContent = formatter.liters.format(totalGlobalSelfServiceLiters) + ' L';
        document.getElementById('global-self-service-amount').textContent = formatter.currency.format(totalGlobalSelfServiceAmount);
        document.getElementById('global-total-liters').textContent = formatter.liters.format(totalGlobalLiters) + ' L';
        document.getElementById('global-total-amount').textContent = formatter.currency.format(totalGlobalAmount);
    }
}

/* ===== SINGLE TURN MANAGER (Gestore di un singolo blocco di turno) ===== */
class SingleTurnManager {
    constructor(turnIndex, turnData, monetaryPrices, virtualstationManager) {
        this.turnIndex = turnIndex;
        this.data = turnData; 
        this.monetaryPrices = monetaryPrices;
        this.virtualstationManager = virtualstationManager;
        this.products = ['gasolio', 'diesel', 'adblue', 'benzina', 'hvolution'];
        this.types = ['iperself', 'servito', 'self-service'];
        this.initializeProductData(); 
        this.init();
    }

    initializeProductData() {
        this.data.totalTurnLiters ??= 0;
        this.data.totalTurnAmount ??= 0;
        this.products.forEach(p => {
            this.data[p] ??= {};
            this.types.forEach(type => { this.data[p][type] ??= 0; });
            this.data[p].totalLiters ??= 0;
            this.data[p].totalAmount ??= 0;
        });
    }

    init() {
        this.bindEvents();
        this.populateInputs();
        this.updateTotals();
        this.populateTurnNumber(); 
    }

    bindEvents() {
        const turnBlockElement = document.getElementById(`turn-block-${this.turnIndex}`);
        if (!turnBlockElement) return;

        turnBlockElement.querySelectorAll('.grid-input[data-product]').forEach(input => {
            input.addEventListener('input', (e) => this.handleInput(e.target));
            input.addEventListener('blur', (e) => this.handleBlur(e.target));
            input.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); this.moveToNextInput(e.target); } });
        });

        const turnNumberInput = turnBlockElement.querySelector(`#turn-number-input-${this.turnIndex}`);
        if (turnNumberInput) {
            turnNumberInput.addEventListener('input', (e) => this.handleTurnNumberInput(e.target)); 
            turnNumberInput.addEventListener('blur', (e) => this.handleTurnNumberInput(e.target));
        }
    }

    handleTurnNumberInput(input) {
        this.data.turnNumber = input.value; 
        Storage.save(Storage.KEYS.VIRTUALSTATION_DATA, this.virtualstationManager.data); 
        this.virtualstationManager.updateAllTurnsInStorage();
    }

    populateTurnNumber() {
        const turnNumberInput = document.getElementById(`turn-number-input-${this.turnIndex}`);
        if (turnNumberInput) turnNumberInput.value = this.data.turnNumber ?? '';
    }


    handleInput(input) {
        const { product, type } = input.dataset;
        this.data[product] ??= {};
        this.data[product][type] = parseNumberInput(input.value);
        Storage.save(Storage.KEYS.VIRTUALSTATION_DATA, this.virtualstationManager.data); 
        this.updateTotals();
        this.virtualstationManager.updateGlobalTotals(); 
    }

    handleBlur(input) {
        const { product, type } = input.dataset;
        const value = this.data[product]?.[type] || 0;
        input.value = value > 0 ? formatter.liters.format(value) : '';
    }

    populateInputs() {
        const turnBlockElement = document.getElementById(`turn-block-${this.turnIndex}`);
        if (!turnBlockElement) return;
        this.products.forEach(product => {
            this.types.forEach(type => {
                const input = turnBlockElement.querySelector(`.grid-input[data-product="${product}"][data-type="${type}"]`);
                if (input && document.activeElement !== input) {
                    const value = this.data[product]?.[type] || 0;
                    input.value = value > 0 ? formatter.liters.format(value) : '';
                }
            });
        });
    }

    updateTotals() {
        const turnBlockElement = document.getElementById(`turn-block-${this.turnIndex}`);
        if (!turnBlockElement) return;

        let totalTurnLiters = 0, totalTurnAmount = 0;
        let columnTotals = { iperself: 0, servito: 0, 'self-service': 0 };
        
        this.products.forEach(product => {
            this.data[product] ??= {};
            const iperselfLiters = this.data[product].iperself || 0;
            const servitoLiters = this.data[product].servito || 0;
            const selfServiceLiters = this.data[product]['self-service'] || 0;

            columnTotals.iperself += iperselfLiters;
            columnTotals.servito += servitoLiters;
            columnTotals['self-service'] += selfServiceLiters;

            const priceServito = this.monetaryPrices[product]?.servito || 0;
            const priceIperself = this.monetaryPrices[product]?.iperself || 0; 

            const iperselfAmount = iperselfLiters * priceIperself;
            const servitoAmount = servitoLiters * priceServito;
            const selfServiceAmount = selfServiceLiters * priceIperself;

            this.data[product].iperselfAmount = iperselfAmount;
            this.data[product].servitoAmount = servitoAmount;
            this.data[product].selfServiceAmount = selfServiceAmount;

            const rowTotalLiters = iperselfLiters + servitoLiters + selfServiceLiters;
            const rowTotalAmount = iperselfAmount + servitoAmount + selfServiceAmount;
            
            this.data[product].totalLiters = rowTotalLiters;
            this.data[product].totalAmount = rowTotalAmount;
            
            totalTurnLiters += rowTotalLiters;
            totalTurnAmount += rowTotalAmount;

            turnBlockElement.querySelector(`#total-turn-${product}-liters-${this.turnIndex}`).textContent = formatter.liters.format(rowTotalLiters);
            turnBlockElement.querySelector(`#total-turn-${product}-amount-${this.turnIndex}`).textContent = formatter.currency.format(rowTotalAmount);
        });

        turnBlockElement.querySelector(`#total-iperself-${this.turnIndex}`).textContent = formatter.liters.format(columnTotals.iperself);
        turnBlockElement.querySelector(`#total-servito-${this.turnIndex}`).textContent = formatter.liters.format(columnTotals.servito);
        turnBlockElement.querySelector(`#total-self-service-${this.turnIndex}`).textContent = formatter.liters.format(columnTotals['self-service']);
        
        turnBlockElement.querySelector(`#total-general-liters-${this.turnIndex}`).textContent = formatter.liters.format(totalTurnLiters);
        turnBlockElement.querySelector(`#total-general-amount-${this.turnIndex}`).textContent = formatter.currency.format(totalTurnAmount);

        this.data.totalTurnLiters = totalTurnLiters;
        this.data.totalTurnAmount = totalTurnAmount;
        Storage.save(Storage.KEYS.VIRTUALSTATION_DATA, this.virtualstationManager.data);
    }

    moveToNextInput(currentInput) {
        const turnBlockElement = document.getElementById(`turn-block-${this.turnIndex}`);
        if (!turnBlockElement) return;
        const allInputs = Array.from(turnBlockElement.querySelectorAll('.grid-input[data-product]'));
        const currentIndex = allInputs.indexOf(currentInput);
        if (currentIndex > -1 && currentIndex < allInputs.length - 1) {
            allInputs[currentIndex + 1].focus();
        } else if (currentIndex === allInputs.length - 1) {
            turnBlockElement.querySelector(`#turn-number-input-${this.turnIndex}`)?.focus();
        }
    }
}

/* ===== FUNZIONI GLOBALI E INIZIALIZZAZIONE ===== */
function importData() { window.virtualstationManager.importData(); }
function exportData() { window.virtualstationManager.exportData(); }

window.addEventListener('error', e => showMessage('Si è verificato un errore imprevisto', 'error'));
window.addEventListener('unhandledrejection', e => showMessage('Errore operazione asincrona', 'error'));

document.addEventListener('DOMContentLoaded', () => {
    try {
        // MOBILE MENU LOGIC (START)
        const hamburgerBtn = document.getElementById('hamburger-menu-btn');
        const mainNav = document.getElementById('main-nav');
        const mobileOverlay = document.getElementById('mobile-menu-overlay');

        if (hamburgerBtn && mainNav && mobileOverlay) {
            hamburgerBtn.addEventListener('click', () => {
                mainNav.classList.toggle('active');
                mobileOverlay.classList.toggle('active');
                document.body.classList.toggle('no-scroll');
            });

            mobileOverlay.addEventListener('click', () => {
                mainNav.classList.remove('active');
                mobileOverlay.classList.remove('active');
                document.body.classList.remove('no-scroll');
            });

            mainNav.querySelectorAll('a').forEach(link => {
                link.addEventListener('click', () => {
                    mainNav.classList.remove('active');
                    mobileOverlay.classList.remove('active');
                    document.body.classList.remove('no-scroll');
                });
            });
        }
        // MOBILE MENU LOGIC (END)

        initializeThemeSwitcher();
        initializeInfoButton();
        window.virtualstationManager = new VirtualstationManager();
        console.log("Sistema Virtualstation inizializzato.");
    } catch (error) {
        console.error('Errore critico nell\'inizializzazione di Virtualstation:', error);
        showMessage('Errore critico nell\'avvio di Virtualstation.', 'error');
    }
});