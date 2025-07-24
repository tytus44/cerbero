document.addEventListener('DOMContentLoaded', () => {

    /* ===== 1. FUNZIONI HELPER E UTILITY GLOBALI (Le funzioni del tema sono rimosse) ===== */

    function parseNumber(value) {
        if (typeof value !== 'string' || value.trim() === '') return 0;
        const cleanedValue = value.replace(/€|\s/g, '').replace(/\./g, '').replace(',', '.');
        const parsed = parseFloat(cleanedValue);
        return isNaN(parsed) ? 0 : parsed;
    }

    function parseItalianDate(dateString) {
        if (!dateString || typeof dateString !== 'string') return null;
        const parts = dateString.trim().split('/');
        if (parts.length === 3) {
            const day = parseInt(parts[0], 10),
                  month = parseInt(parts[1], 10) - 1, // Mesi in JS sono 0-11
                  year = parseInt(parts[2], 10);
            if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
                 const date = new Date(year, month, day);
                 if (date.getDate() === day && date.getMonth() === month && date.getFullYear() === year) return date;
            }
        }
        return null;
    }
    
    function setupDateInputAutoComplete(input) {
        if (!input) return;
        const formatDate = () => {
            const parts = input.value.trim().match(/^(\d{1,2})[\/-](\d{1,2})$/);
            if (parts) {
                input.value = `${String(parts[1]).padStart(2, '0')}/${String(parts[2]).padStart(2, '0')}/${new Date().getFullYear()}`;
            }
        };
        input.addEventListener('blur', formatDate);
        input.addEventListener('keydown', e => { if (e.key === 'Enter') formatDate(); });
    }

    function initializeInfoButton() {
        const infoBtn = document.getElementById('info-btn');
        const infoModal = document.getElementById('info-modal');
        const modalCloseBtn = infoModal ? infoModal.querySelector('.modal-close-btn') : null;
        
        if (infoBtn && infoModal) {
            infoBtn.addEventListener('click', (e) => {
                e.preventDefault();
                infoModal.classList.add('active');
            });
            if (modalCloseBtn) {
                modalCloseBtn.addEventListener('click', () => infoModal.classList.remove('active'));
            }
            infoModal.addEventListener('click', (e) => {
                if (e.target === infoModal) infoModal.classList.remove('active');
            });
        }
    }

    function showMessage(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease-out forwards';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    function showConfirmModal(title, text, onConfirm) {
        const modal = document.getElementById('confirm-modal');
        if (!modal) {
            if (confirm(`${title}\n${text}`)) onConfirm();
            return;
        }
        modal.querySelector('#confirm-modal-title').textContent = title;
        modal.querySelector('#confirm-modal-text').textContent = text;
        const btnOk = modal.querySelector('#confirm-modal-ok');
        const btnCancel = modal.querySelector('#confirm-modal-cancel');
        
        const newBtnOk = btnOk.cloneNode(true);
        btnOk.parentNode.replaceChild(newBtnOk, btnOk);
        newBtnOk.addEventListener('click', () => { onConfirm(); modal.classList.remove('active'); }, { once: true });
        
        const newBtnCancel = btnCancel.cloneNode(true);
        btnCancel.parentNode.replaceChild(newBtnCancel, btnCancel);
        newBtnCancel.addEventListener('click', () => modal.classList.remove('active'), { once: true });
        
        modal.classList.add('active');
    }

    const formatter = {
        currency: new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }),
        date: (d) => new Date(d).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' }),
        dateTime: (d) => new Date(d).toLocaleString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    };
    
    function setupAutocomplete(inputElement, suggestionsArray) {
        // Implementazione Autocomplete...
    }

    /* ===== 2. STATO E GESTIONE DATI ===== */
    
    const pageState = { fondi: {}, entrate: [], uscite: [] };

    function saveData() {
        document.querySelectorAll('.top-row-grid .grid-input').forEach(input => {
            if (input && input.id) pageState.fondi[input.id] = input.value || '';
        });
        Storage.save(Storage.KEYS.REGISTRO_DATA, pageState);
    }

    function loadData() {
        const loadedData = Storage.load(Storage.KEYS.REGISTRO_DATA, { fondi: {}, entrate: [], uscite: [] });
        pageState.fondi = loadedData.fondi || {};
        pageState.entrate = Array.isArray(loadedData.entrate) ? loadedData.entrate : [];
        pageState.uscite = Array.isArray(loadedData.uscite) ? loadedData.uscite : [];
    }

    function getCreditClients() {
        const creditoData = Storage.load(Storage.KEYS.CREDITO_DATA, {});
        const clientNames = Object.values(creditoData).map(client => client.name).filter(Boolean);
        const frequentProducts = ['lubrificante', 'spazzole', 'lampadina', 'deodorante', 'sapone', 'Scontrino Self-Service', 'Bibita', 'Saldo'];
        return Array.from(new Set([...clientNames, ...frequentProducts]));
    }

    /* ===== 3. LOGICA DI BUSINESS E RENDER ===== */
    
    function createSectionHandler(type) {
        return {
            type,
            addEntry() {
                const dateInput = document.getElementById(`${this.type}-date`);
                const descInput = document.getElementById(`${this.type}-desc`);
                const amountInput = document.getElementById(`${this.type}-amount`);
                if (!dateInput || !descInput || !amountInput) return;

                const dateStr = dateInput.value.trim(), desc = descInput.value.trim(), amount = parseNumber(amountInput.value);
                const validDate = parseItalianDate(dateStr);

                if (!validDate || !desc || amount === 0) {
                    showMessage('Data (GG/MM/AAAA), descrizione e importo sono richiesti.', 'warning');
                    return;
                }
                const now = new Date();
                validDate.setHours(now.getHours(), now.getMinutes(), now.getSeconds());
                const newEntry = { id: Date.now().toString(), date: validDate.toISOString(), description: desc, amount: amount };
                const wasLinked = this.linkToCreditSystem(newEntry, this.type);
                pageState[this.type].push(newEntry);
                saveData();
                this.render();
                updateTopSummary();
                descInput.value = '';
                amountInput.value = '';
                if (!wasLinked) showMessage(`${this.type === 'entrate' ? 'Entrata' : 'Uscita'} aggiunta!`, 'success');
            },
            
            linkToCreditSystem(transaction, transactionType) {
                const clientsData = Storage.load(Storage.KEYS.CREDITO_DATA, {});
                if (!clientsData || typeof clientsData !== 'object') return false;
                const clientEntry = Object.entries(clientsData).find(([id, client]) => client.name.trim().toLowerCase() === transaction.description.trim().toLowerCase());
                if (!clientEntry) return false;
                const [clientId, client] = clientEntry;
                let creditAmount = (transactionType === 'entrate') ? Math.abs(transaction.amount) : -Math.abs(transaction.amount);
                const creditTransaction = { id: 'reg-' + transaction.id, date: transaction.date, description: `DA REGISTRO CASSA`, amount: creditAmount, timestamp: Date.now() };
                if (!clientsData[clientId].transactions) clientsData[clientId].transactions = [];
                clientsData[clientId].transactions.push(creditTransaction);
                Storage.save(Storage.KEYS.CREDITO_DATA, clientsData);
                showMessage(`Transazione collegata a: ${client.name}`, 'info');
                return true;
            },

            deleteEntry(entryId) {
                const index = pageState[this.type].findIndex(e => e.id === entryId);
                if (index === -1) return;
                const entry = pageState[this.type][index];
                showConfirmModal('Conferma Eliminazione', `Eliminare la voce "${entry.description}"?`, () => {
                    pageState[this.type].splice(index, 1);
                    saveData(); this.render(); updateTopSummary();
                    showMessage('Voce eliminata.', 'success');
                });
            },
            render() {
                const container = document.getElementById(`${this.type}-container`);
                if (!container) return;
                const title = this.type === 'entrate' ? 'ENTRATE TURNO' : 'USCITE TURNO';
                const total = pageState[this.type].reduce((sum, e) => sum + (e.amount || 0), 0);
                const today = formatter.date(new Date());
                let historyHTML = pageState[this.type].length > 0 ? pageState[this.type].sort((a, b) => new Date(b.date) - new Date(a.date)).map(e => `
                    <div class="transaction-item">
                        <div class="transaction-details">${e.description || 'N/D'}<div class="transaction-date">${formatter.dateTime(e.date)}</div></div>
                        <div class="transaction-right-side">
                            <div class="transaction-amount">${formatter.currency.format(e.amount || 0)}</div>
                            <button class="transaction-delete-btn" data-id="${e.id}"><i class="fa-solid fa-xmark"></i></button>
                        </div>
                    </div>`).join('') : '<p style="text-align:center; font-size:12px; color:var(--text-secondary); padding:10px 0;">Nessuna voce registrata.</p>';
                
                container.innerHTML = `
                    <div class="box summary-box">
                        <h2 class="box-header">${title}</h2>
                        <div class="box-content">
                            <div class="transaction-form-grid">
                                <input type="text" id="${this.type}-date" class="grid-input" value="${today}" placeholder="GG/MM/AAAA">
                                <input type="text" id="${this.type}-desc" class="grid-input" placeholder="Descrizione">
                                <input type="text" id="${this.type}-amount" class="grid-input" placeholder="Importo" inputmode="decimal">
                            </div>
                            <div class="history-toggle">MOSTRA / NASCONDI STORICO</div>
                            <div class="transactions-container">${historyHTML}</div>
                            <div class="box-total"><span>Totale:</span><span class="total-value">${formatter.currency.format(total)}</span></div>
                        </div>
                    </div>`;
                this.addEventListeners(container);
                setupAutocomplete(container.querySelector(`#${this.type}-desc`), getCreditClients());
                setupDateInputAutoComplete(container.querySelector(`#${this.type}-date`));
            },
            addEventListeners(container) {
                const amountInput = container.querySelector(`#${this.type}-amount`);
                const descInput = container.querySelector(`#${this.type}-desc`);
                if (amountInput) {
                    amountInput.addEventListener('blur', e => { if (e.target.value.trim() !== '') e.target.value = formatter.currency.format(parseNumber(e.target.value)); });
                    amountInput.addEventListener('keydown', e => { if (e.key === 'Enter') this.addEntry(); });
                }
                if (descInput) {
                    descInput.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.value.trim() !== '' && amountInput) amountInput.focus(); });
                }
                const historyToggle = container.querySelector('.history-toggle');
                if (historyToggle) {
                    historyToggle.addEventListener('click', (e) => e.target.nextElementSibling.classList.toggle('is-expanded'));
                }
                container.querySelectorAll('.transaction-delete-btn').forEach(btn => btn.addEventListener('click', e => this.deleteEntry(e.currentTarget.dataset.id)));
            }
        };
    }

    function getSalesTotal() {
        if (!window.Storage || !Storage.KEYS?.VIRTUALSTATION_DATA) return 0;
        const virtualstationData = Storage.load(Storage.KEYS.VIRTUALSTATION_DATA, {});
        let totalSales = 0;
        for (const key in virtualstationData) {
            if (key.startsWith('turn-')) totalSales += virtualstationData[key].totalTurnAmount || 0;
        }
        return totalSales;
    }
    
    function updateTopSummary() {
        const fondi = pageState.fondi;
        const fondiInizio = parseNumber(fondi['cassa-inizio']) + parseNumber(fondi['monete-inizio']) + parseNumber(fondi['altro-inizio']) + parseNumber(fondi['altro2-inizio']);
        const fondiFine = parseNumber(fondi['contanti-fine']) + parseNumber(fondi['monete-fine']) + parseNumber(fondi['pos-fine']) + parseNumber(fondi['buoni-fine']);
        const totaleVociEntrate = pageState.entrate.reduce((sum, e) => sum + (e.amount || 0), 0);
        const totaleVociUscite = pageState.uscite.reduce((sum, e) => sum + (e.amount || 0), 0);
        const totaleCarburanti = getSalesTotal();
        const granTotaleEntrate = fondiInizio + totaleVociEntrate + totaleCarburanti;
        const granTotaleUscite = fondiFine + totaleVociUscite;
        const differenza = granTotaleEntrate - granTotaleUscite;

        const elTotaleEntrate = document.getElementById('totale-entrate');
        if (elTotaleEntrate) elTotaleEntrate.textContent = formatter.currency.format(granTotaleEntrate);

        const elTotaleCarburanti = document.getElementById('totale-carburanti');
        if (elTotaleCarburanti) elTotaleCarburanti.textContent = formatter.currency.format(totaleCarburanti);

        const elTotaleUscite = document.getElementById('totale-uscite');
        if (elTotaleUscite) elTotaleUscite.textContent = formatter.currency.format(granTotaleUscite);

        const elDifferenza = document.getElementById('differenza');
        if (elDifferenza) {
            elDifferenza.textContent = formatter.currency.format(differenza);
        }
    }

    window.importaDatiCompleti = function() {
        showConfirmModal('Importare Dati Registro?', 'Questo sovrascriverà i dati correnti. Procedere?', () => {
            const input = document.createElement('input');
            input.type = 'file'; input.accept = '.json';
            input.onchange = e => {
                const file = e.target.files[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = re => {
                    try {
                        const data = JSON.parse(re.target.result);
                        let registroData = data.registro || (data.fondi || data.entrate || data.uscite ? data : null);
                        if (!registroData) throw new Error('Formato file non riconosciuto');
                        Storage.save(Storage.KEYS.REGISTRO_DATA, { fondi: {}, entrate: [], uscite: [], ...registroData });
                        showMessage('Dati importati!', 'success');
                        setTimeout(() => location.reload(), 1000);
                    } catch (err) { showMessage('Errore: file non valido.', 'error'); }
                };
                reader.readAsText(file);
            };
            input.click();
        });
    }
    
    window.esportaDatiCompleti = function() {
        const registroData = Storage.load(Storage.KEYS.REGISTRO_DATA, { fondi: {}, entrate: [], uscite: [] });
        const data = { exportDate: new Date().toISOString(), exportType: 'registro', version: '2.0', registro: registroData };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `cerbero_registro_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        a.remove();
        showMessage('Dati esportati!', 'success');
    }
    
    window.stampaDati = function() { showMessage('Funzione di stampa non ancora implementata.', 'info'); }


    /* ===== 4. INIZIALIZZAZIONE PAGINA ===== */
    
    function initializePage() {
        try {
            if (typeof window.Storage === 'undefined' || !Storage.KEYS) {
                console.error("Storage o Storage.KEYS non definiti.");
                showMessage("Errore: Impossibile caricare lo storage. L'app non funzionerà.", "error");
                return;
            }
            
            ThemeManager.init(); // Chiamata al gestore centralizzato
            
            const infoBtn = document.getElementById('info-btn');
            const infoModal = document.getElementById('info-modal');
            if (infoBtn && infoModal) {
                const closeBtn = infoModal.querySelector('.modal-close-btn');
                infoBtn.addEventListener('click', (e) => { e.preventDefault(); infoModal.classList.add('active'); });
                if(closeBtn) { closeBtn.addEventListener('click', () => infoModal.classList.remove('active')); }
                infoModal.addEventListener('click', (e) => { if (e.target === infoModal) infoModal.classList.remove('active'); });
            }

            loadData();
            
            const entrateManager = createSectionHandler('entrate');
            const usciteManager = createSectionHandler('uscite');
            
            entrateManager.render();
            usciteManager.render();
            
            const fondiInputs = document.querySelectorAll('.top-row-grid .grid-input');
            fondiInputs.forEach(input => {
                if (input && input.id) {
                    const value = pageState.fondi[input.id] || '';
                    input.value = (value.trim() !== '' && !isNaN(parseNumber(value))) ? formatter.currency.format(parseNumber(value)) : '';
                }
            });
            updateTopSummary();
            
            fondiInputs.forEach(input => {
                input.addEventListener('blur', e => {
                    if (e.target.value.trim() !== '') e.target.value = formatter.currency.format(parseNumber(e.target.value));
                    saveData();
                    updateTopSummary();
                });
                input.addEventListener('focus', e => {
                    const parsedValue = parseNumber(e.target.value);
                    e.target.value = parsedValue !== 0 ? String(parsedValue).replace('.', ',') : '';
                });
                input.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); e.target.blur(); } });
            });
        } catch (error) {
            console.error("Errore durante l'inizializzazione: ", error);
            showMessage("Errore critico nell'avvio dell'applicazione.", 'error');
        }
    }

    initializePage();

});