/* ===== CERBERO CREDITO - VERSIONE CORRETTA E COMPLETA ===== */

/* ===== UTILITY (Le funzioni del tema sono rimosse) ===== */
function initializeInfoButton() {
    try {
        var infoBtn = document.getElementById('info-btn');
        var infoModal = document.getElementById('info-modal');
        var modalCloseBtn = infoModal ? infoModal.querySelector('.modal-close-btn') : null;
        
        if (infoBtn && infoModal) {
            infoBtn.addEventListener('click', function(e) {
                e.preventDefault();
                infoModal.classList.add('active');
            });
            
            if (modalCloseBtn) {
                modalCloseBtn.addEventListener('click', function() {
                    infoModal.classList.remove('active');
                });
            }
            
            infoModal.addEventListener('click', function(e) {
                if (e.target === infoModal) {
                    infoModal.classList.remove('active');
                }
            });
        }
    } catch (error) {
        console.error('Errore inizializzazione pulsante info:', error);
    }
}

function showMessage(message, type) {
    type = type || 'info';
    var toast = document.createElement('div');
    toast.className = 'toast-message toast-' + type;
    toast.textContent = message;
    var colors = { error: '#FF3547', info: '#0ABAB5', warning: '#FFD700', success: '#4CAF50' };
    var bgColor = colors[type] || colors.info;
    var textColor = type === 'warning' ? '#333' : 'white';
    toast.style.cssText = 'position: fixed; top: 20px; right: 20px; background: ' + bgColor + '; color: ' + textColor + '; padding: 15px 20px; z-index: 1002; border-radius: 4px; font-family: "Montserrat", sans-serif; font-weight: 600; font-size: 14px; box-shadow: 0 4px 20px rgba(0,0,0,0.2); max-width: 350px; animation: slideIn 0.3s ease-out;';
    document.body.appendChild(toast);
    setTimeout(function() {
        toast.style.animation = 'slideOut 0.3s ease forwards';
        setTimeout(function() { 
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }, 3000);
}

function showConfirmModal(title, text, onConfirm) {
    var modal = document.getElementById('confirm-modal');
    if (!modal) {
        if (confirm(title + '\n' + text)) {
            onConfirm();
        }
        return;
    }
    document.getElementById('confirm-modal-title').textContent = title;
    document.getElementById('confirm-modal-text').textContent = text;
    var btnOk = document.getElementById('confirm-modal-ok');
    var newBtnOk = btnOk.cloneNode(true);
    btnOk.parentNode.replaceChild(newBtnOk, btnOk);
    
    var hide = function() { 
        modal.classList.remove('active'); 
    };
    
    newBtnOk.addEventListener('click', function() { 
        onConfirm(); 
        hide(); 
    });
    
    var btnCancel = document.getElementById('confirm-modal-cancel');
    var newBtnCancel = btnCancel.cloneNode(true);
    btnCancel.parentNode.replaceChild(newBtnCancel, btnCancel);
    newBtnCancel.addEventListener('click', hide);
    
    modal.classList.add('active');
}

/* ===== FORMATTER E PARSERS ===== */
var formatter = {
    currency: new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }),
    date: function(dateStr) { 
        return new Date(dateStr).toLocaleDateString('it-IT', { 
            day: '2-digit', 
            month: '2-digit', 
            year: 'numeric' 
        }); 
    },
    dateTime: function(dateStr) { 
        return new Date(dateStr).toLocaleString('it-IT', { 
            day: '2-digit', 
            month: '2-digit', 
            year: 'numeric', 
            hour: '2-digit', 
            minute: '2-digit' 
        }); 
    }
};

function parseNumberInput(value) {
    if (typeof value !== 'string' || value.trim() === '') return 0;
    var cleaned = value.replace(/€|\s/g, '').replace(/\./g, '').replace(',', '.');
    var parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
}

function parseItalianDate(dateString) {
    var parts = String(dateString).trim().split('/');
    if (parts.length === 3) {
        var date = new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
        if (!isNaN(date.getTime())) return date;
    }
    return null;
}

function setupDateInputAutoComplete(input) {
    if (!input) return;
    var formatDate = function() {
        var parts = input.value.trim().match(/^(\d{1,2})[\/-](\d{1,2})$/);
        if (parts) {
            input.value = String(parts[1]).padStart(2, '0') + '/' + String(parts[2]).padStart(2, '0') + '/' + new Date().getFullYear();
        }
    };
    input.addEventListener('blur', formatDate);
    input.addEventListener('keydown', function(e) { 
        if (e.key === 'Enter') formatDate(); 
    });
}

/* ===== GESTIONE BARRA DI RICERCA ===== */
function initializeSearchBar() {
    var searchInput = document.getElementById('searchInput');
    var clearBtn = document.getElementById('clearSearchBtn');
    if (searchInput && clearBtn) {
        var updateClearButton = function() {
            clearBtn.style.display = searchInput.value.length > 0 ? 'block' : 'none';
        };
        searchInput.addEventListener('input', updateClearButton);
        clearBtn.addEventListener('click', function() {
            searchInput.value = '';
            updateClearButton();
            searchInput.dispatchEvent(new Event('input'));
            searchInput.focus();
        });
        updateClearButton();
    }
}

/* ===== CREDIT MANAGER (Tutta la logica è stata mantenuta com'era) ===== */
function CreditManager() {
    this.clients = Storage.load(Storage.KEYS.CREDITO_DATA, {});
    this.searchTerm = '';
    this.accentColors = [
        'var(--primary-blue)', 'var(--success)', 'var(--danger)', 
        'var(--info)', 'var(--warning)', 'var(--purple)', 'var(--orange)'
    ];
    this.init();
}

CreditManager.prototype.init = function() {
    this.bindGlobalEvents();
    this.render();
};

CreditManager.prototype.bindGlobalEvents = function() {
    var self = this;
    var addBtn = document.getElementById('addNewClientBtn');
    var searchInput = document.getElementById('searchInput');
    var stampaDatiBtn = document.getElementById('stampaDatiBtn');
    
    if (addBtn) {
        addBtn.addEventListener('click', function() { 
            self.showAddClientModal(); 
        });
    }
    if (searchInput) {
        searchInput.addEventListener('input', function(e) {
            self.searchTerm = e.target.value.toLowerCase().trim();
            self.render();
        });
    }
    if (stampaDatiBtn) {
        stampaDatiBtn.addEventListener('click', function() { 
            self.stampaDati(); 
        });
    }
};

CreditManager.prototype.getFilteredAndSortedClients = function() {
    var self = this;
    var clientEntries = [];
    for (var id in this.clients) {
        if (this.clients.hasOwnProperty(id)) {
            clientEntries.push([id, this.clients[id]]);
        }
    }
    
    return clientEntries.filter(function(entry) { 
        var client = entry[1];
        return client.name && client.name.toLowerCase().indexOf(self.searchTerm) !== -1;
    }).sort(function(a, b) { 
        return a[1].name.localeCompare(b[1].name); 
    });
};

CreditManager.prototype.save = function() {
    Storage.save(Storage.KEYS.CREDITO_DATA, this.clients);
    this.updateSummary();
};

CreditManager.prototype.render = function() {
    this.updateSummary();
    this.renderClientGrid();
};

CreditManager.prototype.renderClientGrid = function() {
    var self = this;
    var grid = document.getElementById('clientsGrid');
    if (!grid) return;
    
    grid.innerHTML = '';
    var clientsToRender = this.getFilteredAndSortedClients();

    if (clientsToRender.length === 0) {
        var message = this.searchTerm ? 'Nessun cliente trovato.' : 'Nessun cliente registrato.';
        grid.innerHTML = '<p style="text-align: center; grid-column: 1 / -1; padding: 40px; color: var(--text-secondary);">' + message + '</p>';
        return;
    }
    
    var colorIndex = 0;
    for (var i = 0; i < clientsToRender.length; i++) {
        var entry = clientsToRender[i];
        var id = entry[0];
        var client = entry[1];
        var box = document.createElement('div');
        box.className = 'box summary-box';
        
        var accentColor = this.accentColors[colorIndex % this.accentColors.length];
        colorIndex++;
        box.style.borderLeft = '5px solid ' + accentColor;

        box.innerHTML = '<span class="client-name">' + client.name + '</span>';
        
        (function(clientId) {
            box.addEventListener('click', function() { 
                self.showClientModal(clientId); 
            });
        })(id);
        
        grid.appendChild(box);
    }
};

CreditManager.prototype.showClientModal = function (clientId) {
    var self = this;
    var client = this.clients[clientId];
    if (!client) return;

    var modal = document.getElementById("client-detail-modal");
    var modalBody = document.getElementById("modal-body-content");

    var balance = this.getClientBalance(clientId);
    var isEssepi = client.name.trim().toLowerCase() === "essepi";

    var serviziValue = 0;
    if (isEssepi && client.transactions) {
        for (var i = 0; i < client.transactions.length; i++) {
            var t = client.transactions[i];
            if (t.description.toLowerCase() === "acconto") {
                serviziValue += Math.abs(t.amount) * 0.1;
            }
        }
    }

    var finalBalance = balance - serviziValue;
    var balanceColor =
        finalBalance < 0
            ? "var(--danger)"
            : finalBalance > 0
            ? "var(--success)"
            : "var(--text-secondary)";

    var serviziHTML =
        isEssepi && serviziValue > 0
            ? (
                '<div class="client-total servizi-row">' +
                    '<span>Servizi (10%):</span>' +
                    '<span class="total-value" style="color: var(--danger);">- ' +
                        formatter.currency.format(serviziValue) +
                    "</span>" +
                "</div>"
              )
            : "";

    var today = formatter.date(new Date());

    var transactionsHTML = "";
    if (client.transactions && client.transactions.length > 0) {
        var sortedTransactions = client.transactions
            .slice()
            .sort(function (a, b) {
                return new Date(b.date) - new Date(a.date);
            });

        transactionsHTML = sortedTransactions
            .map(function (t) {
                var amountColor = t.amount > 0 ? "var(--success)" : "var(--danger)";
                var amountSign = t.amount > 0 ? "+" : "-";
                return (
                    '<div class="transaction-item">' +
                        '<div class="transaction-details">' +
                            t.description +
                            '<div class="transaction-date">' +
                                formatter.dateTime(t.date) +
                            "</div>" +
                        "</div>" +
                        '<div class="transaction-right-side">' +
                            '<div class="transaction-amount" style="color:' +
                                amountColor +
                            '">' +
                                amountSign +
                                formatter.currency.format(Math.abs(t.amount)) +
                            "</div>" +
                            '<button class="transaction-delete-btn" onclick="window.creditManager.deleteTransaction(\'' +
                                clientId +
                                "', '" +
                                t.id +
                            "')\"><i class=\"fa-solid fa-xmark\"></i></button>" +
                        "</div>" +
                    "</div>"
                );
            })
            .join("");
    } else {
        transactionsHTML =
            '<p class="no-transactions-message">Nessuna transazione.</p>';
    }

    var clientNameHTML =
        '<input type="text" class="client-name-input" value="' + client.name + '">';
    var disabledAttr = finalBalance >= 0 ? "disabled" : "";

    // ✅ Costruzione completa del contenuto del modale con pulsanti stilizzati
    modalBody.innerHTML =
        '<div class="client-header">' +
            clientNameHTML +
            '<button class="modal-close-btn client-modal-close" title="Chiudi">' +
                '<i class="fa-solid fa-xmark"></i>' +
            "</button>" +
        "</div>" +

        // Riga inserimento transazione
        '<div class="transaction-form-grid">' +
            '<input type="text" class="grid-input date-input" value="' + today + '">' +
            '<input type="text" class="grid-input desc-input" placeholder="Descrizione">' +
            '<input type="text" class="grid-input amount-input" placeholder="Importo">' +
        "</div>" +

        // ✅ Nuova riga pulsanti SOTTO il form con classi corrette
        '<div class="client-actions-bar">' +
            '<button class="history-toggle">' +
                '<i class="fa-solid fa-clock-rotate-left"></i> Storico' +
            "</button>" +
            '<div class="client-actions-right">' +
                '<button class="action-btn btn-success client-salda-btn" ' + disabledAttr + '>' +
                    '<i class="fa-solid fa-check"></i> Salda' +
                "</button>" +
                '<button class="action-btn client-acconto-btn">' +
                    '<i class="fa-solid fa-coins"></i> Acconto' +
                "</button>" +
                '<button class="action-btn client-print-btn">' +
                    '<i class="fa-solid fa-print"></i> Stampa' +
                "</button>" +
                '<button class="action-btn btn-danger client-delete-btn">' +
                    '<i class="fa-solid fa-trash"></i> Elimina' +
                "</button>" +
            "</div>" +
        "</div>" +

        // Lista transazioni
        '<div class="transactions-container">' + transactionsHTML + "</div>" +
        serviziHTML +
        '<div class="client-total">' +
            "<span>SALDO FINALE:</span>" +
            '<span class="total-value" style="color:' + balanceColor + '">' +
                formatter.currency.format(finalBalance) +
            "</span>" +
        "</div>";

    this.bindModalEvents(clientId, modal);
    modal.classList.add("active");
};


CreditManager.prototype.bindModalEvents = function(clientId, modal) {
    var self = this;
    var client = this.clients[clientId];
    
    var hideModal = function() {
        modal.classList.remove('active');
        self.render();
    };

    modal.onclick = function(e) { 
        if (e.target === modal) hideModal(); 
    };
    
    var content = modal.querySelector('.modal-inner-content');
    
    // Pulsante di chiusura del modale
    var closeBtn = content.querySelector('.client-modal-close');
    if (closeBtn) {
        closeBtn.addEventListener('click', hideModal);
    }

    var nameInput = content.querySelector('.client-name-input');
    if (nameInput) {
        var saveName = function() {
            var originalName = client.name;
            var newName = nameInput.value.trim();
            if (originalName !== newName) {
                self.editClientName(clientId, newName);
            }
        };
        
        nameInput.addEventListener('blur', saveName);
        nameInput.addEventListener('keydown', function(e) { 
            if (e.key === 'Enter') nameInput.blur();
            if (e.key === 'Escape') {
                nameInput.value = client.name;
                nameInput.blur();
            }
        });
    }
    
    var amountInput = content.querySelector('.amount-input');
    if (amountInput) {
        amountInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                var dateInput = content.querySelector('.date-input');
                var descInput = content.querySelector('.desc-input');
                self.addTransaction(clientId, dateInput.value, descInput.value, parseNumberInput(amountInput.value));
                dateInput.value = formatter.date(new Date());
                descInput.value = '';
                amountInput.value = '';
                descInput.focus();
            }
        });
    }

    var historyToggle = content.querySelector('.history-toggle');
    if (historyToggle) {
        historyToggle.addEventListener('click', function(e) {
            content.querySelector('.transactions-container').classList.toggle('is-expanded');
        });
    }

    // Gestori per i pulsanti azione - aggiornati per la nuova posizione
    var deleteBtn = content.querySelector('.client-delete-btn');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', function() { 
            self.deleteClient(clientId, true); 
        });
    }
    
    var printBtn = content.querySelector('.client-print-btn');
    if (printBtn) {
        printBtn.addEventListener('click', function() { 
            self.printClientStatement(clientId); 
        });
    }
    
    var accontoBtn = content.querySelector('.client-acconto-btn');
    if (accontoBtn) {
        accontoBtn.addEventListener('click', function() { 
            self.addAcconto(clientId); 
        });
    }
    
    var saldaBtn = content.querySelector('.client-salda-btn');
    if (saldaBtn) {
        saldaBtn.addEventListener('click', function() { 
            self.clearBalance(clientId); 
        });
    }
    
    setupDateInputAutoComplete(content.querySelector('.date-input'));
};

CreditManager.prototype.showAddClientModal = function() {
    var self = this;
    var modal = document.getElementById('add-client-modal');
    var nameInput = document.getElementById('new-client-name');
    var btnOk = document.getElementById('add-client-ok');
    var btnCancel = document.getElementById('add-client-cancel');
    var closeBtn = modal.querySelector('.modal-close-btn'); // Seleziona il pulsante di chiusura

    var hide = function() {
        modal.classList.remove('active');
        nameInput.value = '';
    };
    
    var addClient = function() {
        var trimmedName = nameInput.value.trim();
        if (!trimmedName) { 
            showMessage("Il nome non può essere vuoto.", 'warning'); 
            return; 
        }
        
        var clientExists = false;
        for (var id in self.clients) {
            if (self.clients.hasOwnProperty(id)) {
                if (self.clients[id].name.toLowerCase() === trimmedName.toLowerCase()) {
                    clientExists = true;
                    break;
                }
            }
        }
        
        if (clientExists) {
            showMessage('Esiste già un cliente con questo nome.', 'error'); 
            return;
        }
        
        var clientId = Date.now().toString();
        self.clients[clientId] = { 
            name: trimmedName, 
            transactions: [], 
            createdAt: new Date().toISOString() 
        };
        self.save();
        self.render();
        showMessage('Cliente aggiunto!', 'success');
        hide();
    };
    
    // Rimuovi vecchi listener e assegna nuovi per evitare duplicati
    var newBtnOk = btnOk.cloneNode(true);
    var newBtnCancel = btnCancel.cloneNode(true);
    btnOk.parentNode.replaceChild(newBtnOk, btnOk);
    btnCancel.parentNode.replaceChild(newBtnCancel, btnCancel);
    
    newBtnOk.addEventListener('click', addClient);
    newBtnCancel.addEventListener('click', hide);

    // Gestione del pulsante di chiusura del modale "Aggiungi Nuovo Cliente"
    if (closeBtn) {
        // Rimuovi il listener esistente per evitare duplicati
        var oldCloseBtn = closeBtn;
        var newCloseBtn = oldCloseBtn.cloneNode(true);
        oldCloseBtn.parentNode.replaceChild(newCloseBtn, oldCloseBtn);
        newCloseBtn.addEventListener('click', hide);
    }
    
    nameInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') addClient();
        if (e.key === 'Escape') hide();
    });
    
    modal.classList.add('active');
    setTimeout(function() { nameInput.focus(); }, 100);
};

CreditManager.prototype.editClientName = function(clientId, newName) {
    var trimmedName = newName.trim();
    if (!trimmedName) { 
        showMessage("Il nome non può essere vuoto.", 'warning'); 
        return false; 
    }
    this.clients[clientId].name = trimmedName;
    this.save();
    showMessage('Nome modificato in "' + trimmedName + '".', 'success');
    return true;
};

CreditManager.prototype.deleteClient = function(clientId, fromModal) {
    var self = this;
    var clientName = this.clients[clientId] ? this.clients[clientId].name : '';
    showConfirmModal('Eliminare Cliente?', 'Sei sicuro di voler eliminare "' + clientName + '"? L\'azione è irreversibile.', function() {
        delete self.clients[clientId];
        self.save();
        if (fromModal) {
            var modal = document.getElementById('client-detail-modal');
            if (modal) modal.classList.remove('active');
        }
        self.render();
        showMessage('Cliente "' + clientName + '" eliminato.', 'info');
    });
};

CreditManager.prototype.addTransaction = function(clientId, date, description, amount) {
    var transactionDate = parseItalianDate(date);
    if (!transactionDate || !description.trim() || amount === 0) {
        showMessage('Data, descrizione e importo validi richiesti.', 'warning');
        return;
    }

    var now = new Date();
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
};

CreditManager.prototype.deleteTransaction = function(clientId, transactionId) {
    var self = this;
    var client = this.clients[clientId];
    if (!client || !client.transactions) return;
    
    var transaction = null;
    for (var i = 0; i < client.transactions.length; i++) {
        if (client.transactions[i].id === transactionId) {
            transaction = client.transactions[i];
            break;
        }
    }
    
    if (!transaction) return;
    
    showConfirmModal('Elimina Transazione?', 'Eliminare "' + transaction.description + '"?', function() {
        client.transactions = client.transactions.filter(function(t) { 
            return t.id !== transactionId; 
        });
        self.save();
        showMessage('Transazione eliminata.', 'info');
        self.showClientModal(clientId);
    });
};

CreditManager.prototype.getClientBalance = function(clientId) {
    if (!this.clients[clientId] || !this.clients[clientId].transactions) return 0;
    var sum = 0;
    for (var i = 0; i < this.clients[clientId].transactions.length; i++) {
        sum += this.clients[clientId].transactions[i].amount || 0;
    }
    return sum;
};

CreditManager.prototype.updateSummary = function() {
    var self = this;
    var balances = [];
    for (var id in this.clients) {
        if (this.clients.hasOwnProperty(id)) {
            balances.push(this.getClientBalance(id));
        }
    }
    
    var totalDebt = 0;
    var activeClients = 0;
    for (var i = 0; i < balances.length; i++) {
        if (balances[i] < 0) {
            totalDebt += balances[i];
            activeClients++;
        }
    }
    
    document.getElementById('totalCredito').textContent = formatter.currency.format(totalDebt);
    document.getElementById('clientiAttivi').textContent = activeClients;

    var clientEl = document.getElementById('last-op-client');
    var detailsEl = document.getElementById('last-op-details');
    
    var allTransactions = [];
    for (var clientId in this.clients) {
        if (this.clients.hasOwnProperty(clientId)) {
            var client = this.clients[clientId];
            if (client.transactions) {
                for (var i = 0; i < client.transactions.length; i++) {
                    var tx = client.transactions[i];
                    var txCopy = {
                        id: tx.id,
                        date: tx.date,
                        description: tx.description,
                        amount: tx.amount,
                        timestamp: tx.timestamp,
                        clientName: client.name
                    };
                    allTransactions.push(txCopy);
                }
            }
        }
    }

    if (allTransactions.length > 0) {
        allTransactions.sort(function(a, b) { 
            return (b.timestamp || 0) - (a.timestamp || 0); 
        });
        var lastTx = allTransactions[0];
        
        clientEl.textContent = lastTx.clientName;
        var amountColor = lastTx.amount > 0 ? 'var(--success)' : 'var(--danger)';
        detailsEl.innerHTML = lastTx.description + ' <span style="color:' + amountColor + ';">(' + formatter.currency.format(lastTx.amount) + ')</span>';
    } else {
        clientEl.textContent = '--';
        detailsEl.textContent = '';
    }
};

CreditManager.prototype.clearBalance = function(clientId) {
    var self = this;
    var balance = this.getClientBalance(clientId);
    if (balance >= 0) return;
    
    var clientName = this.clients[clientId].name;
    var transactionCount = this.clients[clientId].transactions.length;
    
    showConfirmModal('Saldare Debito?', 'Eliminare tutte le ' + transactionCount + ' transazioni di "' + clientName + '" e azzerare il debito?', function() {
        self.clients[clientId].transactions = [];
        self.save();
        self.showClientModal(clientId);
        showMessage('Debito saldato - transazioni eliminate.', 'success');
    });
};

CreditManager.prototype.addAcconto = function(clientId) {
    var self = this;
    var client = this.clients[clientId];
    if (!client) return;

    var modal = document.getElementById('acconto-modal');
    var clientNameEl = document.getElementById('acconto-client-name');
    var amountInput = document.getElementById('acconto-amount-input');
    var btnOk = document.getElementById('acconto-ok-btn');
    var btnCancel = document.getElementById('acconto-cancel-btn');

    clientNameEl.textContent = client.name;
    amountInput.value = '';
    modal.classList.add('active');
    setTimeout(function() { amountInput.focus(); }, 100);

    var hide = function() { 
        modal.classList.remove('active'); 
    };

    var handleConfirm = function() {
        var parsedAmount = parseNumberInput(amountInput.value);
        if (parsedAmount <= 0) {
            showMessage('Importo non valido.', 'warning');
            return;
        }

        self.clients[clientId].transactions.push({
            id: Date.now().toString(),
            date: new Date().toISOString(),
            description: 'Acconto',
            amount: parsedAmount,
            timestamp: Date.now()
        });
        self.save();
        self.showClientModal(clientId);
        showMessage('Acconto aggiunto.', 'success');
        hide();
    };

    var newBtnOk = btnOk.cloneNode(true);
    btnOk.parentNode.replaceChild(newBtnOk, btnOk);
    var newBtnCancel = btnCancel.cloneNode(true);
    btnCancel.parentNode.replaceChild(newBtnCancel, btnCancel);
    
    newBtnOk.addEventListener('click', handleConfirm);
    newBtnCancel.addEventListener('click', hide);
    
    amountInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') handleConfirm();
        if (e.key === 'Escape') hide();
    });
};

CreditManager.prototype.printClientStatement = function(clientId) {
    var client = this.clients[clientId];
    if (!client) return;
    
    var balance = this.getClientBalance(clientId);
    var transactionsList = '';
    
    if (client.transactions && client.transactions.length > 0) {
        var sortedTransactions = client.transactions.slice().sort(function(a, b) { 
            return new Date(a.date) - new Date(b.date); 
        });
        
        transactionsList = sortedTransactions.map(function(t) {
            var amountColor = t.amount > 0 ? 'green' : 'red';
            return '<div class="transaction-item">' +
                '<div class="transaction-details">' +
                '<span>' + t.description + '</span>' +
                '<div class="transaction-date">' + formatter.dateTime(t.date) + '</div>' +
                '</div>' +
                '<div class="transaction-amount" style="color:' + amountColor + ';">' +
                formatter.currency.format(t.amount) +
                '</div>' +
                '</div>';
        }).join('');
    }

    var printContent = 
        '<div class="print-header">' +
        '<div class="print-title">Estratto Conto</div>' +
        '<div class="print-subtitle">' + client.name + '</div>' +
        '<div class="print-date">Generato il: ' + new Date().toLocaleDateString('it-IT') + '</div>' +
        '</div>' +
        '<div class="transactions-list">' + transactionsList + '</div>' +
        '<div class="total-row">' +
        '<span>SALDO FINALE:</span>' +
        '<span>' + formatter.currency.format(balance) + '</span>' +
        '</div>';
    
    var printWindow = window.open('', '_blank');
    var htmlContent = 
        '<html>' +
        '<head>' +
        '<title>Estratto ' + client.name + '</title>' +
        '<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;700&display=swap" rel="stylesheet">' +
        '<style>' +
        'body { font-family: "Montserrat", sans-serif; margin: 20px; color: #333; }' +
        '.print-header { text-align: center; margin-bottom: 15px; border-bottom: 2px solid #093fb4; padding-bottom: 10px; }' +
        '.print-title { font-size: 22px; font-weight: 700; color: #093fb4; margin: 0; }' +
        '.print-subtitle { font-size: 16px; color: #333; margin: 5px 0 0 0; }' +
        '.print-date { font-size: 12px; color: #666; }' +
        '.transactions-list { margin-top: 20px; }' +
        '.transaction-item { display: flex; justify-content: space-between; padding: 8px 5px; border-bottom: 1px solid #eee; font-size: 14px; }' +
        '.transaction-details { text-align: left; }' +
        '.transaction-date { font-size: 11px; color: #777; }' +
        '.transaction-amount { font-weight: 700; text-align: right; }' +
        '.total-row { display: flex; justify-content: space-between; font-size: 18px; font-weight: bold; margin-top: 20px; border-top: 2px solid #093fb4; padding-top: 10px; }' +
        '</style>' +
        '</head>' +
        '<body>' + printContent + '</body>' +
        '</html>';
    
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    setTimeout(function() { 
        printWindow.print(); 
        printWindow.close(); 
    }, 500);
};

CreditManager.prototype.stampaDati = function() {
    var self = this;
    var clientsWithBalance = [];
    
    for (var id in this.clients) {
        if (this.clients.hasOwnProperty(id)) {
            var client = this.clients[id];
            var balance = this.getClientBalance(id);
            clientsWithBalance.push({ name: client.name, balance: balance });
        }
    }

    var filteredClients = clientsWithBalance.filter(function(client) { 
        return client.balance < 0; 
    }).sort(function(a, b) { 
        return a.name.localeCompare(b.name); 
    });

    if (filteredClients.length === 0) {
        showMessage('Nessun cliente con debito da stampare.', 'info');
        return;
    }
    
    var clientListHTML = filteredClients.map(function(client) {
        return '<div class="client-item">' +
            '<span>' + client.name + ':</span> ' +
            '<span style="font-weight: 700;">' + formatter.currency.format(client.balance) + '</span>' +
            '</div>';
    }).join('');

    var printWindow = window.open('', '_blank');
    var htmlContent = 
        '<html>' +
        '<head>' +
        '<title>Riepilogo Crediti</title>' +
        '<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;700&display=swap" rel="stylesheet">' +
        '<style>' +
        'body { font-family: "Montserrat", sans-serif; margin: 20px; color: #000; }' +
        '.header-text { text-align: center; margin-bottom: 20px; padding-bottom: 10px; color: #333; font-size: 14px; }' +
        '.clients-container { display: grid; grid-template-columns: 1fr 1fr; gap: 5px 25px; border-top: 1px solid #ccc; padding-top: 10px; }' +
        '.client-item { display: flex; justify-content: space-between; padding: 8px; border-bottom: 1px solid #eee; font-size: 14px; }' +
        '</style>' +
        '</head>' +
        '<body>' +
        '<p class="header-text">Riepilogo Clienti a Debito del ' + new Date().toLocaleDateString('it-IT') + '</p>' +
        '<div class="clients-container">' + clientListHTML + '</div>' +
        '</body>' +
        '</html>';
    
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    setTimeout(function() { 
        printWindow.print(); 
        printWindow.close(); 
    }, 500);
};

CreditManager.prototype.importData = function() {
    var self = this;
    var input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = function(e) {
        var file = e.target.files[0];
        if (!file) return;
        var reader = new FileReader();
        reader.onload = function(re) {
            try {
                var data = JSON.parse(re.target.result);
                var clientsToImport = data.credito || data;
                if (typeof clientsToImport !== 'object' || clientsToImport === null) {
                    throw new Error('Formato dati non valido.');
                }
                self.clients = clientsToImport;
                self.save();
                self.render();
                showMessage('Dati credito importati!', 'success');
            } catch (error) { 
                showMessage('Errore: file non valido.', 'error'); 
            }
        };
        reader.readAsText(file);
    };
    input.click();
};

CreditManager.prototype.exportData = function() {
    var dataStr = JSON.stringify(this.clients, null, 2);
    var dataBlob = new Blob([dataStr], {type: "application/json;charset=utf-8"});
    var url = URL.createObjectURL(dataBlob);
    var link = document.createElement('a');
    link.href = url;
    link.download = 'cerbero_credito_' + new Date().toISOString().split('T')[0] + '.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};

/* ===== COLLEGAMENTO FUNZIONI GLOBALI ALLA CLASSE ===== */
function importaDatiCompleti() { 
    if (window.creditManager) {
        window.creditManager.importData(); 
    }
}

function esportaDatiCompleti() { 
    if (window.creditManager) {
        window.creditManager.exportData(); 
    }
}

function stampaDati() { 
    if (window.creditManager) {
        window.creditManager.stampaDati(); 
    }
}

/* ===== INIZIALIZZAZIONE ===== */
document.addEventListener('DOMContentLoaded', function() {
    try {
        if (!window.Storage) {
            throw new Error('Storage non disponibile');
        }
        
        // Assicurati che ThemeManager.init() sia definito o rimuovilo se non usato
        if (typeof ThemeManager !== 'undefined' && ThemeManager.init) {
             ThemeManager.init();
        }
       
        // ✅ Inizializzazione del pulsante info migliorata
        initializeInfoButton();
        initializeSearchBar();
        window.creditManager = new CreditManager();
        
    } catch (error) {
        console.error('Errore inizializzazione:', error);
        showMessage("Errore critico nell'avvio.", 'error');
    }
});