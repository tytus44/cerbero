/* ===== CERBERO CREDITO - VERSIONE CORRETTA E COMPLETA ===== */

/* ===== GESTIONE TEMA ===== */
function applyTheme(theme) {
    document.body.classList.toggle('dark-theme', theme === 'dark');
    const lightIcon = document.getElementById('theme-icon-light');
    const darkIcon = document.getElementById('theme-icon-dark');
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
    applyTheme(Storage.load(Storage.KEYS.THEME, 'light'));
}

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


/* ===== UTILITY ===== */
function showMessage(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast-message toast-${type}`;
    toast.textContent = message;
    const colors = { error: '#FF3547', info: '#0ABAB5', warning: '#FFD700', success: '#4CAF50' };
    toast.style.cssText = `position: fixed; top: 20px; right: 20px; background: ${colors[type] || colors.info}; color: ${type === 'warning' ? '#333' : 'white'}; padding: 15px 20px; z-index: 1002; border-radius: 20px; font-family: 'Montserrat', sans-serif; font-weight: 600; font-size: 14px; box-shadow: 0 4px 20px rgba(0,0,0,0.2); max-width: 350px; animation: slideIn 0.3s ease-out;`;
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease forwards';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function showConfirmModal(title, text, onConfirm) {
    const modal = document.getElementById('confirm-modal');
    if (!modal) {
        if (confirm(`${title}\n${text}`)) onConfirm();
        return;
    }
    document.getElementById('confirm-modal-title').textContent = title;
    document.getElementById('confirm-modal-text').textContent = text;
    const btnOk = document.getElementById('confirm-modal-ok');
    const newBtnOk = btnOk.cloneNode(true);
    btnOk.parentNode.replaceChild(newBtnOk, btnOk);
    const hide = () => modal.classList.remove('active');
    newBtnOk.addEventListener('click', () => { onConfirm(); hide(); }, { once: true });
    document.getElementById('confirm-modal-cancel').addEventListener('click', hide, { once: true });
    modal.classList.add('active');
}

/* ===== FORMATTER E PARSERS ===== */
const formatter = {
    currency: new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }),
    date: (dateStr) => new Date(dateStr).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' }),
    dateTime: (dateStr) => new Date(dateStr).toLocaleString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
};
function parseNumberInput(value) {
    if (typeof value !== 'string' || value.trim() === '') return 0;
    const cleaned = value.replace(/€|\s/g, '').replace(/\./g, '').replace(',', '.');
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
}
function parseItalianDate(dateString) {
    const parts = String(dateString).trim().split('/');
    if (parts.length === 3) {
        const date = new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
        if (!isNaN(date.getTime())) return date;
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

/* ===== GESTIONE BARRA DI RICERCA ===== */
function initializeSearchBar() {
    const searchInput = document.getElementById('searchInput');
    const clearBtn = document.getElementById('clearSearchBtn');
    if (searchInput && clearBtn) {
        const updateClearButton = () => {
            clearBtn.style.display = searchInput.value.length > 0 ? 'block' : 'none';
        };
        searchInput.addEventListener('input', updateClearButton);
        clearBtn.addEventListener('click', () => {
            searchInput.value = '';
            updateClearButton();
            searchInput.dispatchEvent(new Event('input'));
            searchInput.focus();
        });
        updateClearButton();
    }
}

/* ===== CREDIT MANAGER ===== */
class CreditManager {
    constructor() {
        this.clients = Storage.load(Storage.KEYS.CREDITO_DATA, {});
        this.searchTerm = '';
        this.accentColors = [
            'var(--primary-blue)', 'var(--success)', 'var(--danger)', 
            'var(--info)', 'var(--warning)', 'var(--purple)', 'var(--orange)'
        ];
        this.init();
    }

    init() {
        this.bindGlobalEvents();
        this.render();
    }
    
    bindGlobalEvents() {
        document.getElementById('addNewClientBtn')?.addEventListener('click', () => this.showAddClientModal());
        document.getElementById('searchInput')?.addEventListener('input', (e) => {
            this.searchTerm = e.target.value.toLowerCase().trim();
            this.render();
        });
        // StampaDati e altre funzioni globali chiameranno i metodi della classe
        document.getElementById('stampaDatiBtn')?.addEventListener('click', () => this.stampaDati());
        document.getElementById('importaDatiCompletiBtn')?.addEventListener('click', () => this.importData()); // Assicurati che l'HTML abbia l'ID corretto
        document.getElementById('esportaDatiCompletiBtn')?.addEventListener('click', () => this.exportData()); // Assicurati che l'HTML abbia l'ID corretto
    }

    getFilteredAndSortedClients() {
        return Object.entries(this.clients)
            .filter(([, client]) => client.name && client.name.toLowerCase().includes(this.searchTerm))
            .sort(([, a], [, b]) => a.name.localeCompare(b.name));
    }

    save() {
        Storage.save(Storage.KEYS.CREDITO_DATA, this.clients);
        this.updateSummary();
    }
    
    render() {
        this.updateSummary();
        this.renderClientGrid();
    }

    renderClientGrid() {
        const grid = document.getElementById('clientsGrid');
        if (!grid) return;
        
        grid.innerHTML = '';
        const clientsToRender = this.getFilteredAndSortedClients();

        if (clientsToRender.length === 0) {
            grid.innerHTML = `<p style="text-align: center; grid-column: 1 / -1; padding: 40px; color: var(--text-secondary);">${this.searchTerm ? 'Nessun cliente trovato.' : 'Nessun cliente registrato.'}</p>`;
            return;
        }
        
        let colorIndex = 0;
        clientsToRender.forEach(([id, client]) => {
            const box = document.createElement('div');
            box.className = 'box summary-box';
            
            const accentColor = this.accentColors[colorIndex % this.accentColors.length];
            colorIndex++;
            box.style.borderLeft = `5px solid ${accentColor}`;

            box.innerHTML = `<span class="client-name">${client.name}</span>`;
            box.addEventListener('click', () => this.showClientModal(id));
            grid.appendChild(box);
        });
    }

    showClientModal(clientId) {
        const client = this.clients[clientId];
        if (!client) return;
    
        const modal = document.getElementById('client-detail-modal');
        const modalBody = document.getElementById('modal-body-content'); // Questo è il div con class="modal-inner-content"
    
        const balance = this.getClientBalance(clientId);
        const isEssepi = client.name.trim().toLowerCase() === 'essepi';
        const serviziValue = isEssepi ? (client.transactions || []).filter(t => t.description.toLowerCase() === 'acconto').reduce((total, t) => total + (Math.abs(t.amount) * 0.10), 0) : 0;
        const finalBalance = balance - serviziValue;
        const balanceColor = finalBalance < 0 ? 'var(--danger)' : (finalBalance > 0 ? 'var(--success)' : 'var(--text-secondary)');
        const serviziHTML = isEssepi && serviziValue > 0 ? `<div class="client-total"><span>Servizi (10%):</span><span class="total-value" style="color: var(--danger);">- ${formatter.currency.format(serviziValue)}</span></div>` : '';
        const today = formatter.date(new Date());
        
        // Ho rimosso padding-left e padding-right da transaction-item e client-total nell'HTML generato
        // Per lasciare che il padding del .modal-inner-content gestisca lo spazio orizzontale
        const transactionsHTML = (client.transactions || []).length > 0 ? [...client.transactions].sort((a, b) => new Date(b.date) - new Date(a.date)).map(t => `<div class="transaction-item"><div class="transaction-details">${t.description}<div class="transaction-date">${formatter.dateTime(t.date)}</div></div><div class="transaction-right-side"><div class="transaction-amount" style="color: ${t.amount > 0 ? 'var(--success)' : 'var(--danger)'}">${t.amount > 0 ? '+' : '-'}${formatter.currency.format(Math.abs(t.amount))}</div><button class="transaction-delete-btn" onclick="window.creditManager.deleteTransaction('${clientId}', '${t.id}')"><i class="fa-solid fa-xmark"></i></button></div></div>`).join('') : '<p class="no-transactions-message">Nessuna transazione.</p>';
        
        const clientNameHTML = `<input type="text" class="client-name-input" value="${client.name}">`;
        const moreOptionsIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M6 10c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2m12 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2m-6 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2"/></svg>`;
        
        // Allargato il modale in credito.css
        // Testo bianco sui pulsanti rossi di eliminazione in credito.css
        // Icone sui pulsanti dell'action-bar in credito.css (tramite ::before)

        modalBody.innerHTML = `
            <div class="client-header">${clientNameHTML}<div class="client-actions-wrapper"><div class="client-actions"><button class="client-acconto-btn" title="Acconto"></button><button class="client-salda-btn" title="Salda" ${finalBalance >= 0 ? 'disabled' : ''}></button><button class="client-print-btn" title="Stampa"></button><button class="client-delete-btn" title="Elimina"></button></div><button class="client-more-options-btn" title="Altro">${moreOptionsIcon}</button></div></div>
            <div class="transaction-form-grid"><input type="text" class="grid-input date-input" value="${today}"><input type="text" class="grid-input desc-input" placeholder="Descrizione"><input type="text" class="grid-input amount-input" placeholder="Importo"></div>
            <div class="history-toggle">MOSTRA / NASCONDI STORICO</div>
            <div class="transactions-container">${transactionsHTML}</div>
            ${serviziHTML}
            <div class="client-total"><span>SALDO FINALE:</span><span class="total-value" style="color: ${balanceColor}">${formatter.currency.format(finalBalance)}</span></div>`;
    
        this.bindModalEvents(clientId, modal);
        modal.classList.add('active');
    }

    bindModalEvents(clientId, modal) {
        const client = this.clients[clientId];
        const hideModal = () => {
            modal.classList.remove('active');
            this.render();
        };

        modal.onclick = (e) => { if (e.target === modal) hideModal(); };
        
        const content = modal.querySelector('.modal-inner-content');
        
        content.querySelector('.client-more-options-btn').addEventListener('click', e => content.querySelector('.client-actions').classList.toggle('is-open'));

        const nameInput = content.querySelector('.client-name-input');
        if (nameInput) {
            nameInput.addEventListener('focus', () => {
                content.querySelector('.client-actions')?.classList.remove('is-open');
            });
            
            const saveName = () => {
                const originalName = client.name;
                const newName = nameInput.value.trim();
                if (originalName !== newName) {
                    this.editClientName(clientId, newName);
                }
            };
            nameInput.addEventListener('blur', saveName);
            nameInput.addEventListener('keydown', e => { 
                if (e.key === 'Enter') nameInput.blur();
                if (e.key === 'Escape') {
                    nameInput.value = client.name;
                    nameInput.blur();
                }
            });
        }
        
        const amountInput = content.querySelector('.amount-input');
        amountInput.addEventListener('keydown', e => {
            if (e.key === 'Enter') {
                const dateInput = content.querySelector('.date-input');
                const descInput = content.querySelector('.desc-input');
                this.addTransaction(clientId, dateInput.value, descInput.value, parseNumberInput(amountInput.value));
                dateInput.value = formatter.date(new Date());
                descInput.value = '';
                amountInput.value = '';
                descInput.focus();
            }
        });

        content.querySelector('.history-toggle').addEventListener('click', (e) => {
            content.querySelector('.transactions-container').classList.toggle('is-expanded');
        });

        content.querySelector('.client-delete-btn').addEventListener('click', () => this.deleteClient(clientId, true));
        content.querySelector('.client-print-btn').addEventListener('click', () => this.printClientStatement(clientId));
        content.querySelector('.client-acconto-btn').addEventListener('click', () => this.addAcconto(clientId));
        content.querySelector('.client-salda-btn').addEventListener('click', () => this.clearBalance(clientId));
        setupDateInputAutoComplete(content.querySelector('.date-input'));
    }

    showAddClientModal() {
        const modal = document.getElementById('add-client-modal');
        const nameInput = document.getElementById('new-client-name');
        const btnOk = document.getElementById('add-client-ok');
        const btnCancel = document.getElementById('add-client-cancel');
        
        const hide = () => {
            modal.classList.remove('active');
            nameInput.value = '';
        };
        
        const addClient = () => {
            const trimmedName = nameInput.value.trim();
            if(!trimmedName) { 
                showMessage("Il nome non può essere vuoto.", 'warning'); 
                return; 
            }
            
            if (Object.values(this.clients).some(c => c.name.toLowerCase() === trimmedName.toLowerCase())) {
                showMessage('Esiste già un cliente con questo nome.', 'error'); 
                return;
            }
            
            const clientId = Date.now().toString();
            this.clients[clientId] = { 
                name: trimmedName, 
                transactions: [], 
                createdAt: new Date().toISOString() 
            };
            this.save();
            this.render();
            showMessage('Cliente aggiunto!', 'success');
            hide();
        };
        
        const newBtnOk = btnOk.cloneNode(true);
        const newBtnCancel = btnCancel.cloneNode(true);
        btnOk.parentNode.replaceChild(newBtnOk, btnOk);
        btnCancel.parentNode.replaceChild(newBtnCancel, btnCancel);
        
        newBtnOk.addEventListener('click', addClient, { once: true });
        newBtnCancel.addEventListener('click', hide, { once: true });
        nameInput.addEventListener('keydown', e => {
            if (e.key === 'Enter') addClient();
            if (e.key === 'Escape') hide();
        });
        
        modal.classList.add('active');
        setTimeout(() => nameInput.focus(), 100);
    }
    
    editClientName(clientId, newName) {
        const trimmedName = newName.trim();
        if(!trimmedName) { 
            showMessage("Il nome non può essere vuoto.", 'warning'); 
            return false; 
        }
        this.clients[clientId].name = trimmedName;
        this.save();
        showMessage(`Nome modificato in "${trimmedName}".`, 'success');
        return true;
    }

    deleteClient(clientId, fromModal = false) {
        const clientName = this.clients[clientId]?.name;
        showConfirmModal('Eliminare Cliente?', `Sei sicuro di voler eliminare "${clientName}"? L'azione è irreversibile.`, () => {
            delete this.clients[clientId];
            this.save();
            if (fromModal) document.getElementById('client-detail-modal')?.classList.remove('active');
            this.render();
            showMessage(`Cliente "${clientName}" eliminato.`, 'info');
        });
    }

    addTransaction(clientId, date, description, amount) {
        const transactionDate = parseItalianDate(date);
        if (!transactionDate || !description.trim() || amount === 0) {
            showMessage('Data, descrizione e importo validi richiesti.', 'warning');
            return;
        }

        const now = new Date();
        transactionDate.setHours(now.getHours(), now.getMinutes(), now.getSeconds());

        this.clients[clientId].transactions.push({ 
            id: Date.now().toString(), 
            date: transactionDate.toISOString(), 
            description: description.trim(), 
            amount: -Math.abs(amount), 
            timestamp: Date.now() 
        });
        this.save();
        showMessage('Transazione aggiunta.', 'success');
        this.showClientModal(clientId);
    }

    deleteTransaction(clientId, transactionId) {
        const client = this.clients[clientId];
        const transaction = client.transactions.find(t => t.id === transactionId);
        if (!transaction) return;
        
        showConfirmModal('Elimina Transazione?', `Eliminare "${transaction.description}"?`, () => {
            client.transactions = client.transactions.filter(t => t.id !== transactionId);
            this.save();
            showMessage('Transazione eliminata.', 'info');
            this.showClientModal(clientId);
        });
    }
    
    getClientBalance(clientId) {
        if (!this.clients[clientId] || !Array.isArray(this.clients[clientId].transactions)) return 0;
        return this.clients[clientId].transactions.reduce((sum, t) => sum + (t.amount || 0), 0);
    }

    updateSummary() {
        const balances = Object.keys(this.clients).map(id => this.getClientBalance(id));
        const totalDebt = balances.filter(b => b < 0).reduce((sum, b) => sum + b, 0);
        document.getElementById('totalCredito').textContent = formatter.currency.format(totalDebt);
        document.getElementById('clientiAttivi').textContent = balances.filter(b => b < 0).length;

        const clientEl = document.getElementById('last-op-client');
        const detailsEl = document.getElementById('last-op-details');
        
        const allTransactions = Object.values(this.clients).flatMap(client =>
            (client.transactions || []).map(tx => ({ ...tx, clientName: client.name }))
        );

        if (allTransactions.length > 0) {
            allTransactions.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
            const lastTx = allTransactions[0];
            
            clientEl.textContent = lastTx.clientName;
            detailsEl.innerHTML = `${lastTx.description} <span style="color:${lastTx.amount > 0 ? 'var(--success)' : 'var(--danger)'};">(${formatter.currency.format(lastTx.amount)})</span>`;
        } else {
            clientEl.textContent = '--';
            detailsEl.textContent = '';
        }
    }

    clearBalance(clientId) {
        const balance = this.getClientBalance(clientId);
        if (balance >= 0) return;
        showConfirmModal('Saldare Debito?', `Creare un pagamento di ${formatter.currency.format(Math.abs(balance))}?`, () => {
            this.clients[clientId].transactions.push({ 
                id: Date.now().toString(), 
                date: new Date().toISOString(), 
                description: 'Saldo debito', 
                amount: -balance, 
                timestamp: Date.now() 
            });
            this.save();
            this.showClientModal(clientId);
            showMessage('Debito saldato.', 'success');
        });
    }

    addAcconto(clientId) {
        const client = this.clients[clientId];
        if (!client) return;
    
        const modal = document.getElementById('acconto-modal');
        const clientNameEl = document.getElementById('acconto-client-name');
        const amountInput = document.getElementById('acconto-amount-input');
        const btnOk = document.getElementById('acconto-ok-btn');
        const btnCancel = document.getElementById('acconto-cancel-btn');
    
        clientNameEl.textContent = client.name;
        amountInput.value = '';
        modal.classList.add('active');
        setTimeout(() => amountInput.focus(), 100);
    
        const hide = () => modal.classList.remove('active');
    
        const handleConfirm = () => {
            const parsedAmount = parseNumberInput(amountInput.value);
            if (parsedAmount <= 0) {
                showMessage('Importo non valido.', 'warning');
                return;
            }
    
            this.clients[clientId].transactions.push({
                id: Date.now().toString(),
                date: new Date().toISOString(),
                description: 'Acconto',
                amount: parsedAmount,
                timestamp: Date.now()
            });
            this.save();
            this.showClientModal(clientId);
            showMessage('Acconto aggiunto.', 'success');
            hide();
        };
    
        const newBtnOk = btnOk.cloneNode(true);
        btnOk.parentNode.replaceChild(newBtnOk, btnOk);
        newBtnOk.addEventListener('click', handleConfirm, { once: true });
    
        const newBtnCancel = btnCancel.cloneNode(true);
        btnCancel.parentNode.replaceChild(newBtnCancel, btnCancel);
        newBtnCancel.addEventListener('click', hide, { once: true });
    }

    printClientStatement(clientId) {
        const client = this.clients[clientId];
        if (!client) return;
        
        const balance = this.getClientBalance(clientId);
    
        const printContent = `
            <div class="print-header">
                <div class="print-title">Estratto Conto</div>
                <div class="print-subtitle">${client.name}</div>
                <div class="print-date">Generato il: ${new Date().toLocaleDateString('it-IT')}</div>
            </div>
            <div class="transactions-list">
                ${[...(client.transactions || [])]
                    .sort((a, b) => new Date(a.date) - new Date(b.date))
                    .map(t => `
                    <div class="transaction-item">
                        <div class="transaction-details">
                            <span>${t.description}</span>
                            <div class="transaction-date">${formatter.dateTime(t.date)}</div>
                        </div>
                        <div class="transaction-amount" style="color:${t.amount > 0 ? 'green' : 'red'};">
                            ${formatter.currency.format(t.amount)}
                        </div>
                    </div>
                `).join('')}
            </div>
            <div class="total-row">
                <span>SALDO FINALE:</span>
                <span>${formatter.currency.format(balance)}</span>
            </div>
        `;
        
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html>
                <head>
                    <title>Estratto ${client.name}</title>
                    <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;700&display=swap" rel="stylesheet">
                    <style>
                        body { font-family: 'Montserrat', sans-serif; margin: 20px; color: #333; }
                        .print-header { text-align: center; margin-bottom: 15px; border-bottom: 2px solid #093fb4; padding-bottom: 10px; }
                        .print-title { font-size: 22px; font-weight: 700; color: #093fb4; margin: 0; }
                        .print-subtitle { font-size: 16px; color: #333; margin: 5px 0 0 0; }
                        .print-date { font-size: 12px; color: #666; }
                        .transactions-list { margin-top: 20px; }
                        .transaction-item { display: flex; justify-content: space-between; padding: 8px 5px; border-bottom: 1px solid #eee; font-size: 14px; }
                        .transaction-details { text-align: left; }
                        .transaction-date { font-size: 11px; color: #777; }
                        .transaction-amount { font-weight: 700; text-align: right; }
                        .total-row { display: flex; justify-content: space-between; font-size: 18px; font-weight: bold; margin-top: 20px; border-top: 2px solid #093fb4; padding-top: 10px; }
                    </style>
                </head>
                <body>${printContent}</body>
            </html>
        `);
        printWindow.document.close();
        setTimeout(() => { printWindow.print(); printWindow.close(); }, 500);
    }

    stampaDati() {
        const clientsWithBalance = Object.values(this.clients).map(client => {
            const balance = this.getClientBalance(Object.keys(this.clients).find(id => this.clients[id] === client));
            return { name: client.name, balance: balance };
        });

        const filteredClients = clientsWithBalance
            .filter(client => client.balance < 0)
            .sort((a, b) => a.name.localeCompare(b.name));

        if (filteredClients.length === 0) {
            showMessage('Nessun cliente con debito da stampare.', 'info');
            return;
        }
        
        const clientListHTML = filteredClients.map(client => {
            return `<div class="client-item"><span>${client.name}:</span> <span style="font-weight: 700;">${formatter.currency.format(client.balance)}</span></div>`;
        }).join('');

        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html>
                <head><title>Riepilogo Crediti</title><link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;700&display=swap" rel="stylesheet">
                    <style>
                        body { font-family: 'Montserrat', sans-serif; margin: 20px; color: #000; }
                        .header-text { text-align: center; margin-bottom: 20px; padding-bottom: 10px; color: #333; font-size: 14px; }
                        .clients-container { display: grid; grid-template-columns: 1fr 1fr; gap: 5px 25px; border-top: 1px solid #ccc; padding-top: 10px; }
                        .client-item { display: flex; justify-content: space-between; padding: 8px; border-bottom: 1px solid #eee; font-size: 14px; }
                    </style>
                </head>
                <body>
                    <p class="header-text">Riepilogo Clienti a Debito del ${new Date().toLocaleDateString('it-IT')}</p>
                    <div class="clients-container">${clientListHTML}</div>
                </body>
            </html>
        `);
        printWindow.document.close();
        setTimeout(() => { printWindow.print(); printWindow.close(); }, 500);
    }
    
    importData() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = e => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = re => {
                try {
                    const data = JSON.parse(re.target.result);
                    const clientsToImport = data.credito || data;
                    if (typeof clientsToImport !== 'object' || clientsToImport === null) throw new Error('Formato dati non valido.');
                    this.clients = clientsToImport;
                    this.save();
                    this.render();
                    showMessage('Dati credito importati!', 'success');
                } catch (error) { showMessage('Errore: file non valido.', 'error'); }
            };
            reader.readAsText(file);
        };
        input.click();
    }

    exportData() {
        const dataStr = JSON.stringify(this.clients, null, 2);
        const dataBlob = new Blob([dataStr], {type: "application/json;charset=utf-8"});
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `cerbero_credito_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }
}

// ===== COLLEGAMENTO FUNZIONI GLOBALI ALLA CLASSE =====
function importaDatiCompleti() { if(window.creditManager) window.creditManager.importData(); }
function esportaDatiCompleti() { if(window.creditManager) window.creditManager.exportData(); }
function stampaDati() { if (window.creditManager) window.creditManager.stampaDati(); }

/* ===== INIZIALIZZAZIONE ===== */
document.addEventListener('DOMContentLoaded', () => {
    try {
        if (!window.Storage) throw new Error('Storage non disponibile');
        
        // MOBILE MENU LOGIC (START)
        const hamburgerBtn = document.getElementById('hamburger-menu-btn');
        const mainNav = document.getElementById('main-nav');
        const mobileOverlay = document.getElementById('mobile-menu-overlay');

        if (hamburgerBtn && mainNav && mobileOverlay) {
            hamburgerBtn.addEventListener('click', () => {
                mainNav.classList.toggle('active');
                mobileOverlay.classList.toggle('active');
                document.body.classList.toggle('no-scroll'); // Optional: prevent scrolling background
            });

            mobileOverlay.addEventListener('click', () => {
                mainNav.classList.remove('active');
                mobileOverlay.classList.remove('active');
                document.body.classList.remove('no-scroll'); // Optional
            });

            // Close menu if a nav link is clicked
            mainNav.querySelectorAll('a').forEach(link => {
                link.addEventListener('click', () => {
                    mainNav.classList.remove('active');
                    mobileOverlay.classList.remove('active');
                    document.body.classList.remove('no-scroll'); // Optional
                });
            });
        }
        // MOBILE MENU LOGIC (END)

        initializeThemeSwitcher();
        initializeInfoButton();
        initializeSearchBar();
        window.creditManager = new CreditManager();
    } catch (error) {
        console.error('Errore inizializzazione:', error);
        showMessage("Errore critico nell'avvio.", 'error');
    }
});