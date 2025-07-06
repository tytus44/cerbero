/* ===== CERBERO REGISTRO JAVASCRIPT - VERSIONE CORRETTA ===== */

/* ===== 1. UTILITY GLOBALI E FUNZIONI HELPER ===== */

function applyTheme(theme) {
    try {
        document.body.classList.toggle('dark-theme', theme === 'dark');
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
                const newTheme = document.body.classList.contains('dark-theme') ? 'light' : 'dark';
                applyTheme(newTheme);
            });
        }
        const savedTheme = Storage.load(Storage.KEYS.THEME, 'light');
        applyTheme(savedTheme);
    } catch (error) {
        console.error('Errore inizializzazione theme switcher:', error);
    }
}

function initializeInfoButton() {
    try {
        const infoBtn = document.getElementById('info-btn');
        const infoModal = document.getElementById('info-modal');
        // Seleziona il bottone di chiusura del modale per il Registro, che ora ha un'icona FA
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
            
            // Chiudi cliccando fuori dal modale
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

function initializeFullscreenButton() {
    try {
        const fullscreenBtn = document.getElementById('fullscreen-btn');
        if (fullscreenBtn) {
            fullscreenBtn.addEventListener('click', (e) => {
                e.preventDefault();
                
                if (!document.fullscreenElement) {
                    // Entra in fullscreen
                    const fullscreenPromise = document.documentElement.requestFullscreen ? 
                        document.documentElement.requestFullscreen() :
                        document.documentElement.mozRequestFullScreen ? 
                        document.documentElement.mozRequestFullScreen() :
                        document.documentElement.webkitRequestFullscreen ? 
                        document.documentElement.webkitRequestFullscreen() :
                        document.documentElement.msRequestFullscreen ? 
                        document.documentElement.msRequestFullscreen() : null;
                    
                    if (fullscreenPromise) {
                        fullscreenPromise.then(() => {
                            // Salva lo stato fullscreen solo se riesce
                            Storage.save('fullscreen_state', true);
                        }).catch(err => {
                            console.warn('Fullscreen non supportato:', err);
                            Storage.save('fullscreen_state', false);
                        });
                    }
                } else {
                    // Esce dal fullscreen
                    const exitPromise = document.exitFullscreen ? 
                        document.exitFullscreen() :
                        document.mozCancelFullScreen ? 
                        document.mozCancelFullScreen() :
                        document.webkitExitFullscreen ? 
                        document.webkitExitFullscreen() :
                        document.msExitFullscreen ? 
                        document.msExitFullscreen() : null;
                    
                    if (exitPromise) {
                        exitPromise.then(() => {
                            Storage.save('fullscreen_state', false);
                        }).catch(err => {
                            console.warn('Errore uscita fullscreen:', err);
                        });
                    }
                }
            });
        }

        // Listener per quando l'utente esce dal fullscreen con ESC
        document.addEventListener('fullscreenchange', () => {
            if (!document.fullscreenElement) {
                Storage.save('fullscreen_state', false);
            }
        });

        // Compatibilità con altri browser
        document.addEventListener('webkitfullscreenchange', () => {
            if (!document.webkitFullscreenElement) {
                Storage.save('fullscreen_state', false);
            }
        });

        document.addEventListener('mozfullscreenchange', () => {
            if (!document.mozFullScreenElement) {
                Storage.save('fullscreen_state', false);
            }
        });

    } catch (error) {
        console.error('Errore inizializzazione pulsante fullscreen:', error);
    }
}

function showMessage(message, type = 'info') {
    try {
        const allowedTypes = ['error', 'warning', 'info', 'success'];
        if (!allowedTypes.includes(type)) return;
        
        const toast = document.createElement('div');
        toast.className = `toast-message toast-${type}`;
        toast.textContent = message;
        
        const colors = {
            error: '#FF3547', info: '#0ABAB5', warning: '#FFD700', success: '#4CAF50' // Updated success color
        };
        
        toast.style.cssText = `
            position: fixed; top: 20px; right: 20px;
            background: ${colors[type] || colors.info};
            color: ${type === 'warning' ? '#333' : 'white'};
            padding: 15px 20px; z-index: 1001; border-radius: 20px;
            font-family: 'Montserrat', sans-serif; font-weight: 600; font-size: 14px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.2); max-width: 350px; word-wrap: break-word;
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
    try {
        const modal = document.getElementById('confirm-modal');
        if (!modal) {
            if (confirm(`${title}\n${text}`)) onConfirm();
            return;
        }
        
        const titleEl = modal.querySelector('#confirm-modal-title');
        const textEl = modal.querySelector('#confirm-modal-text');
        const btnOk = modal.querySelector('#confirm-modal-ok');
        const btnCancel = modal.querySelector('#confirm-modal-cancel');
        
        if (titleEl) titleEl.textContent = title;
        if (textEl) textEl.textContent = text;
        
        // Clona i bottoni per rimuovere listeners precedenti (soluzione robusta)
        const newBtnOk = btnOk.cloneNode(true);
        btnOk.parentNode.replaceChild(newBtnOk, btnOk);
        newBtnOk.addEventListener('click', () => { onConfirm(); modal.classList.remove('active'); }, { once: true });
        
        const newBtnCancel = btnCancel.cloneNode(true);
        btnCancel.parentNode.replaceChild(newBtnCancel, btnCancel);
        newBtnCancel.addEventListener('click', () => modal.classList.remove('active'), { once: true });
        
        modal.classList.add('active');
    } catch (error) {
        console.error('Errore nella visualizzazione del modal:', error);
        if (confirm(`${title}\n${text}`)) onConfirm();
    }
}

const formatter = {
    currency: new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }),
    date: (d) => new Date(d).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' }),
    dateTime: (d) => new Date(d).toLocaleString('it-IT', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit' 
    })
};

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
        const day = parseInt(parts[0], 10), month = parseInt(parts[1], 10) - 1, year = parseInt(parts[2], 10);
        const date = new Date(year, month, day);
        if (date.getDate() === day && date.getMonth() === month && date.getFullYear() === year) return date;
    }
    return null;
}

function setupAutocomplete(inputElement, suggestionsArray) {
    if (!inputElement || !Array.isArray(suggestionsArray)) return;
    let currentFocus = -1;
    let suggestionsContainer = document.createElement('div');
    suggestionsContainer.setAttribute('class', 'autocomplete-suggestions');
    suggestionsContainer.style.display = 'none';
    let inputWrapper = document.createElement('div');
    inputWrapper.setAttribute('class', 'autocomplete-wrapper');
    inputElement.parentNode.insertBefore(inputWrapper, inputElement);
    inputWrapper.appendChild(inputElement);
    inputWrapper.appendChild(suggestionsContainer);
    
    // Posizionamento del container di suggerimenti
    // Questo era il problema di posizionamento, ora lo leghiamo all'inputWrapper
    const positionSuggestions = () => {
        const rect = inputElement.getBoundingClientRect();
        suggestionsContainer.style.top = `${rect.bottom}px`;
        suggestionsContainer.style.left = `${rect.left}px`;
        suggestionsContainer.style.width = `${rect.width}px`;
        suggestionsContainer.style.position = 'fixed'; // Usa fixed per uscire dal flusso del wrapper se necessario
    };

    inputElement.addEventListener('focus', positionSuggestions);
    inputElement.addEventListener('input', function() {
        positionSuggestions(); // Aggiorna posizione ad ogni input
        let val = this.value;
        suggestionsContainer.innerHTML = '';
        currentFocus = -1;
        if (!val) { suggestionsContainer.style.display = 'none'; return; }
        let matchingSuggestions = suggestionsArray.filter(s => s.toUpperCase().includes(val.toUpperCase())).slice(0, 10);
        if (matchingSuggestions.length === 0) { suggestionsContainer.style.display = 'none'; return; }
        suggestionsContainer.style.display = 'block';
        matchingSuggestions.forEach(suggestion => {
            let item = document.createElement('div');
            item.setAttribute('class', 'suggestion-item');
            item.innerHTML = "<strong>" + suggestion.substr(0, val.length) + "</strong>" + suggestion.substr(val.length);
            item.addEventListener('click', () => {
                inputElement.value = suggestion;
                suggestionsContainer.style.display = 'none';
                inputElement.focus();
            });
            suggestionsContainer.appendChild(item);
        });
    });
    inputElement.addEventListener('keydown', function(e) {
        let x = suggestionsContainer.getElementsByClassName('suggestion-item');
        if (e.keyCode == 40) { currentFocus++; addActive(x); }
        else if (e.keyCode == 38) { currentFocus--; addActive(x); }
        else if (e.keyCode == 13) { e.preventDefault(); if (currentFocus > -1 && x[currentFocus]) x[currentFocus].click(); else inputElement.blur(); }
        else if (e.keyCode == 27) { suggestionsContainer.style.display = 'none'; inputElement.blur(); }
    });
    function addActive(x) {
        if (!x) return;
        removeActive(x);
        if (currentFocus >= x.length) currentFocus = 0;
        if (currentFocus < 0) currentFocus = x.length - 1;
        x[currentFocus].classList.add('active-suggestion');
        x[currentFocus].scrollIntoView({ block: 'nearest' });
    }
    function removeActive(x) {
        for (let i = 0; i < x.length; i++) x[i].classList.remove('active-suggestion');
    }
    document.addEventListener('click', e => {
        if (e.target !== inputElement && !suggestionsContainer.contains(e.target)) {
            suggestionsContainer.style.display = 'none';
        }
    });
}


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

const SectionHandler = {
    create(type) {
        return {
            type,
            addEntry() {
                const dateInput = document.getElementById(`${this.type}-date`),
                      descInput = document.getElementById(`${this.type}-desc`),
                      amountInput = document.getElementById(`${this.type}-amount`);
                const dateStr = dateInput.value.trim(), desc = descInput.value.trim(), amount = parseNumber(amountInput.value);
                const validDate = parseItalianDate(dateStr);

                if (!validDate || !desc || amount === 0) {
                    showMessage('Data (GG/MM/AAAA), descrizione e importo sono richiesti.', 'warning');
                    return;
                }

                const now = new Date();
                validDate.setHours(now.getHours(), now.getMinutes(), now.getSeconds());

                const newEntry = {
                    id: Date.now().toString(),
                    date: validDate.toISOString(),
                    description: desc,
                    amount: amount
                };

                const wasLinked = this.linkToCreditSystem(newEntry, this.type);

                pageState[this.type].push(newEntry);
                saveData();
                this.render();
                updateTopSummary();
                descInput.value = '';
                amountInput.value = '';
                
                if (!wasLinked) {
                    showMessage(`${this.type === 'entrate' ? 'Entrata' : 'Uscita'} aggiunta con successo!`, 'success');
                }
            },
            
            linkToCreditSystem(transaction, transactionType) {
                try {
                    const clientsData = Storage.load(Storage.KEYS.CREDITO_DATA, {});
                    if (!clientsData || typeof clientsData !== 'object') return false;

                    const clientEntry = Object.entries(clientsData).find(([id, client]) => 
                        client.name.trim().toLowerCase() === transaction.description.trim().toLowerCase()
                    );

                    if (!clientEntry) return false;

                    const [clientId, client] = clientEntry;
                    let creditAmount;

                    if (transactionType === 'entrate') {
                        creditAmount = Math.abs(transaction.amount);
                    } else if (transactionType === 'uscite') {
                        creditAmount = -Math.abs(transaction.amount);
                    } else {
                        return false; 
                    }
                    
                    const creditTransaction = {
                        id: 'reg-' + transaction.id,
                        date: transaction.date,
                        description: `DA REGISTRO CASSA`,
                        amount: creditAmount,
                        timestamp: Date.now()
                    };

                    if (!clientsData[clientId].transactions) {
                        clientsData[clientId].transactions = [];
                    }
                    clientsData[clientId].transactions.push(creditTransaction);

                    Storage.save(Storage.KEYS.CREDITO_DATA, clientsData);
                    showMessage(`Transazione collegata al cliente: ${client.name}`, 'info');
                    return true;

                } catch (error) {
                    console.error("Errore durante il collegamento al sistema di credito:", error);
                    showMessage("Errore nell'aggiornamento del credito cliente.", 'error');
                    return false;
                }
            },

            deleteEntry(entryId) {
                const index = pageState[this.type].findIndex(e => e.id === entryId);
                if (index === -1) return;
                const entry = pageState[this.type][index];
                showConfirmModal('Conferma Eliminazione', `Eliminare la voce "${entry.description}"?`, () => {
                    pageState[this.type].splice(index, 1);
                    saveData(); this.render(); updateTopSummary();
                    showMessage('Voce eliminata con successo!', 'success');
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
                                <input type="text" id="${this.type}-amount" class="grid-input" placeholder="Importo">
                            </div>
                            <div class="history-toggle">MOSTRA / NASCONDI STORICO</div>
                            <div class="transactions-container">${historyHTML}</div>
                            <div class="box-total"><span>Totale:</span><span class="total-value">${formatter.currency.format(total)}</span></div>
                        </div>
                    </div>`;
                this.addEventListeners(container);
                const descInput = container.querySelector(`#${this.type}-desc`);
                if (descInput) setupAutocomplete(descInput, getCreditClients());
            },
            addEventListeners(container) {
                const amountInput = container.querySelector(`#${this.type}-amount`);
                if (amountInput) {
                    const descInput = container.querySelector(`#${this.type}-desc`);
                    amountInput.addEventListener('blur', e => { if (e.target.value.trim() !== '') e.target.value = formatter.currency.format(parseNumber(e.target.value)); });
                    amountInput.addEventListener('keydown', e => { if (e.key === 'Enter') this.addEntry(); });
                    if (descInput) descInput.addEventListener('keydown', e => { 
                        // Solo triggera l'aggiunta se la descrizione non è vuota E non ci sono suggerimenti visibili o attivi
                        const autocompleteSuggestions = document.querySelector('.autocomplete-suggestions');
                        const hasActiveSuggestion = autocompleteSuggestions && autocompleteSuggestions.style.display !== 'none' && autocompleteSuggestions.getElementsByClassName('active-suggestion').length > 0;

                        if (e.key === 'Enter' && e.target.value.trim() !== '' && !hasActiveSuggestion) { 
                            e.preventDefault(); 
                            amountInput.focus(); 
                        } 
                    });
                }
                const historyToggle = container.querySelector('.history-toggle');
                historyToggle.addEventListener('click', () => {
                    const transactionsContainer = container.querySelector('.transactions-container');
                    transactionsContainer.classList.toggle('is-expanded');
                });
                container.querySelectorAll('.transaction-delete-btn').forEach(btn => btn.addEventListener('click', e => {
                    // Trova l'elemento genitore <li> per ottenere il data-id
                    const listItem = e.target.closest('.transaction-delete-btn');
                    if (listItem) {
                        this.deleteEntry(listItem.dataset.id);
                    }
                }));
            }
        };
    }
};

function getSalesTotal() {
    try {
        if (!Storage.KEYS || !Storage.KEYS.VIRTUALSTATION_DATA) {
            console.warn('Attenzione: La chiave VIRTUALSTATION_DATA non è definita in storage.js. Il totale carburanti sarà 0.');
            return 0;
        }
        const virtualstationData = Storage.load(Storage.KEYS.VIRTUALSTATION_DATA, {});
        if (!virtualstationData || typeof virtualstationData !== 'object') return 0;
        let totalSales = 0;
        for (const key in virtualstationData) {
            if (key.startsWith('turn-')) {
                const turnData = virtualstationData[key];
                totalSales += turnData.totalTurnAmount || 0;
            }
        }
        return totalSales;
    } catch (error) {
        console.error('Errore nel calcolo del totale carburanti:', error);
        return 0;
    }
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
    document.getElementById('totale-entrate').textContent = formatter.currency.format(granTotaleEntrate);
    document.getElementById('totale-carburanti').textContent = formatter.currency.format(totaleCarburanti);
    document.getElementById('totale-uscite').textContent = formatter.currency.format(granTotaleUscite);
    const elDifferenza = document.getElementById('differenza');
    elDifferenza.textContent = formatter.currency.format(differenza);
    elDifferenza.style.color = Math.abs(differenza) < 0.01 ? 'var(--text-secondary)' : (differenza >= 0 ? 'var(--success)' : 'var(--danger)');
}

function importaDatiCompleti() {
    showConfirmModal('Importare Dati Registro?', 'Questo sovrascriverà i dati del registro. Procedere?', () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = event => {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = e => {
                    try {
                        const data = JSON.parse(e.target.result);
                        // Cerca "registro" come chiave principale o le chiavi dirette fondi/entrate/uscite
                        let registroData = data.registro || (data.fondi || data.entrate || data.uscite ? data : null);
                        if (!registroData) throw new Error('Formato file non riconosciuto');
                        
                        // Assicurati che le proprietà esistano, anche se vuote
                        registroData.fondi = registroData.fondi || {};
                        registroData.entrate = Array.isArray(registroData.entrate) ? registroData.entrate : [];
                        registroData.uscite = Array.isArray(registroData.uscite) ? registroData.uscite : [];
                        
                        Storage.save(Storage.KEYS.REGISTRO_DATA, registroData);
                        showMessage('Dati registro importati con successo!', 'success');
                        setTimeout(() => location.reload(), 1000);
                    } catch (error) { showMessage('Errore: file non valido o corrotto.', 'error'); }
                };
                reader.onerror = () => showMessage('Errore nella lettura del file.', 'error');
                reader.readAsText(file);
            }
        };
        input.click();
    });
}

function esportaDatiCompleti() {
    const registroData = Storage.load(Storage.KEYS.REGISTRO_DATA, { fondi: {}, entrate: [], uscite: [] });
    const data = { exportDate: new Date().toISOString(), exportType: 'registro', version: '2.0', registro: registroData };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cerbero_registro_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showMessage('Dati registro esportati con successo!', 'success');
}

function stampaDati() { showMessage('Funzione di stampa non ancora implementata.', 'info'); }

function initializePage() {
    try {
        initializeThemeSwitcher();
        initializeInfoButton();
        loadData();
        const entrateManager = SectionHandler.create('entrate');
        const usciteManager = SectionHandler.create('uscite');
        if (entrateManager) entrateManager.render();
        if (usciteManager) usciteManager.render();
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
                saveData(); updateTopSummary();
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

window.addEventListener('error', event => { console.error('Errore JavaScript globale:', event.error); showMessage('Si è verificato un errore imprevisto', 'error'); });
window.addEventListener('unhandledrejection', event => { console.error('Promise rifiutata non gestita:', event.reason); showMessage('Errore nell\'operazione asincrona', 'error'); });
document.addEventListener('DOMContentLoaded', initializePage);