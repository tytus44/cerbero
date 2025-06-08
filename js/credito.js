// credito.js - Logica specifica per la pagina credito.html

document.addEventListener('DOMContentLoaded', () => {
    // La vecchia lista 'customerNames' è stata rimossa perché non più utilizzata.
    
    let searchInput;
    let searchIcon;   
    const mainContainer = document.querySelector('main.credito-layout');
    let addNewBoxPairButton;
    
    let nextClienteIndex = 0; 

    function performSearch() {
        const searchTerm = searchInput.value.toLowerCase().trim();
        const allClientBoxes = document.querySelectorAll('.colonna-meta.box'); 
        let foundBox = null;
        if (searchTerm === '') {
            allClientBoxes.forEach(box => box.classList.remove('highlight-search'));
            return;
        }
        allClientBoxes.forEach(box => box.classList.remove('highlight-search'));
        for (const box of allClientBoxes) {
            const clientNameElement = box.querySelector('h3');
            if (clientNameElement && clientNameElement.textContent !== "") { 
                const clientName = clientNameElement.textContent.toLowerCase();
                if (clientName.includes(searchTerm)) {
                    foundBox = box;
                    break;
                }
            }
        }
        if (foundBox) {
            foundBox.scrollIntoView({ behavior: 'smooth', block: 'start' });
            foundBox.classList.add('highlight-search'); 
            setTimeout(() => {
                foundBox.classList.remove('highlight-search'); 
            }, 2000); 
        } else {
            alert(`Nessun cliente trovato con il nome "${searchTerm}"`);
        }
    }

    function salvaDatiCredito() {
        const allClientData = [];
        const boxes = document.querySelectorAll('.colonna-meta.box'); 
        boxes.forEach(box => {
            const clientId = box.id;
            const clientName = box.querySelector('h3').textContent.trim();
            const transactions = [];
            box.querySelectorAll('.tabella-credito tbody tr:not(.riga-totale)').forEach(row => {
                const dataInput = row.querySelector('.credito-campo.credito-data');
                const importoInput = row.querySelector('.credito-campo.credito-importo');
                const noteInput = row.querySelector('.credito-campo.credito-note');
                if (dataInput.value || importoInput.value || noteInput.value) {
                    transactions.push({
                        date: dataInput.value,
                        amount: importoInput.value.replace('€', '').trim().replace(/\./g, '').replace(',', '.'),
                        note: noteInput.value
                    });
                }
            });
            allClientData.push({
                id: clientId,
                name: clientName,
                transactions: transactions
            });
        });
        salvaDati('credito', allClientData); 
    }

    function caricaDatiCredito() {
        const parsedData = caricaDati('credito'); 
        mainContainer.innerHTML = ''; 
        const searchDiv = document.createElement('div');
        searchDiv.classList.add('search-container');
        searchDiv.style.margin = '20px auto';
        
        searchDiv.innerHTML = `
            <input type="text" id="searchInput" class="search-input" placeholder="Cerca...">
            <div class="search-icon" id="searchIcon"></div>
        `;
        mainContainer.appendChild(searchDiv);
        
        searchInput = searchDiv.querySelector('#searchInput');
        searchIcon = searchDiv.querySelector('#searchIcon');
        
        if (searchInput) {
            searchInput.addEventListener('keydown', (event) => { if (event.key === 'Enter') { performSearch(); event.preventDefault(); } });
        }
        if (searchIcon) {
            searchIcon.addEventListener('click', performSearch);
        }

        let currentGlobalIndex = 0; 
        let currentRow = null; 
        if (parsedData && parsedData.length > 0) {
            parsedData.forEach((clientData) => { 
                if (currentGlobalIndex % 2 === 0) { 
                    if (currentRow) { 
                        const existingEmptyDiv = currentRow.querySelector('.colonna-meta[style*="visibility: hidden"]');
                        if (existingEmptyDiv) existingEmptyDiv.remove();
                    }
                    currentRow = document.createElement('div');
                    currentRow.classList.add('riga-box');
                    mainContainer.appendChild(currentRow);
                }
                const boxElement = createClienteBox(currentGlobalIndex, clientData); 
                currentRow.appendChild(boxElement);
                initializeBoxLogic(boxElement); 
                currentGlobalIndex++;
            });
            nextClienteIndex = currentGlobalIndex; 
            if (currentGlobalIndex % 2 !== 0 && currentRow) {
                const emptyDiv = document.createElement('div');
                emptyDiv.classList.add('colonna-meta');
                emptyDiv.style.visibility = 'hidden';
                currentRow.appendChild(emptyDiv);
            }
        } else {
            nextClienteIndex = 0; 
        }
        const addButtonContainer = document.createElement('div');
        addButtonContainer.classList.add('add-box-button-container');
        addButtonContainer.style.display = 'flex';
        addButtonContainer.style.justifyContent = 'center';
        addButtonContainer.style.paddingBottom = '40px';
        addButtonContainer.innerHTML = `<button id="addNewBoxPair" class="add-box-button">AGGIUNGI</button>`;
        mainContainer.appendChild(addButtonContainer);
        addNewBoxPairButton = addButtonContainer.querySelector('#addNewBoxPair');
        if (addNewBoxPairButton) {
            addNewBoxPairButton.addEventListener('click', handleAddNewBoxPairClick); 
        }
    }

    function createClienteBox(index, clientData = null) { 
        const boxId = `cliente-${index + 1}`;
        const colorClassIndex = (index % 20) + 1; 
        const colorClass = `colore-header-${colorClassIndex}`; 
        const initialClientName = clientData ? clientData.name : '';
        let tableRowsHtml = '';

        if (clientData && clientData.transactions && clientData.transactions.length > 0) {
            clientData.transactions.forEach(transaction => {
                tableRowsHtml += `
                    <tr>
                        <td><input type="text" class="credito-campo credito-data" value="${transaction.date || ''}" disabled></td>
                        <td><input type="text" class="credito-campo credito-importo" value="${transaction.amount || ''}" disabled></td>
                        <td><input type="text" class="credito-campo credito-note" value="${transaction.note || ''}" disabled></td>
                    </tr>
                `;
            });
        } else {
            tableRowsHtml = `
                <tr>
                    <td><input type="text" class="credito-campo credito-data" value="" disabled></td>
                    <td><input type="text" class="credito-campo credito-importo" value="" disabled></td>
                    <td><input type="text" class="credito-campo credito-note" value="" disabled></td>
                </tr>
            `;
        }

        const boxHtml = `
            <div id="${boxId}" class="colonna-meta box ${colorClass}">
                <div class="header-box" style="display: flex; justify-content: space-between; align-items: center;">
                    
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <img src="../icons/icon_utente.svg" alt="Cliente" style="width: 24px; height: 24px; filter: brightness(0) invert(1);">
                        <h3 ${initialClientName ? '' : 'style="pointer-events: none;"'}>${initialClientName}</h3>
                    </div>

                    <div style="display: flex; align-items: center; gap: 15px;">
                        <img src="../icons/icon_aggiungi.svg" alt="Aggiungi Riga" class="aggiungi-riga-icona" title="Aggiungi riga" style="cursor: pointer; width: 24px; height: 24px; filter: brightness(0) invert(1); display: none;">
                        <img src="../icons/icon_cancella.svg" alt="Cancella Ultima Riga" class="cancella-ultima-riga-icona" title="Cancella ultima riga" style="cursor: pointer; width: 24px; height: 24px; filter: brightness(0) invert(1); display: none;">
                        <img src="../icons/icon_pulisci.svg" alt="Pulisci Tabella" class="pulisci-tutto-icona" title="Pulisci tutto" style="cursor: pointer; width: 24px; height: 24px; filter: brightness(0) invert(1); display: none;">
                        <img src="../icons/icon_cestino.svg" class="delete-box-icon" alt="Elimina Box" title="Elimina Box" style="cursor: pointer; width: 24px; height: 24px; filter: brightness(0) invert(1); display: none;">
                        <img src="../icons/icon_modifica.svg" class="edit-icon" alt="Modifica" title="Modifica Cliente">
                    </div>
                </div>
                <div class="content-box">
                    <table class="tabella-credito">
                        <thead>
                            <tr><th>Data</th><th>Importo</th><th>Note</th></tr>
                        </thead>
                        <tbody>
                            ${tableRowsHtml}
                            <tr class="riga-totale">
                                <td class="empty-cell"></td>
                                <td class="cella-totale">€ 0,00</td>
                                <td class="empty-cell"></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        `;
        const div = document.createElement('div');
        div.innerHTML = boxHtml.trim();
        return div.firstChild;
    }

    function initializeBoxLogic(box) {
        const editIcon = box.querySelector('.edit-icon');
        const aggiungiRigaIcon = box.querySelector('.aggiungi-riga-icona'); 
        const cancellaUltimaRigaIcon = box.querySelector('.cancella-ultima-riga-icona');
        const pulisciTuttoIcon = box.querySelector('.pulisci-tutto-icona');
        const deleteBoxIcon = box.querySelector('.delete-box-icon'); 
        const tabellaCredito = box.querySelector('.tabella-credito');
        const headerTitle = box.querySelector('h3');
        const cellaTotale = box.querySelector('.cella-totale'); 
        const headerBox = box.querySelector('.header-box'); 
        let isBoxEditable = false; 
        headerTitle.setAttribute('contenteditable', 'false'); 

        function calcolaTotaleBox() {
            let totale = 0;
            box.querySelectorAll('.tabella-credito tbody tr:not(.riga-totale)').forEach(row => {
                const importoInput = row.querySelector('.credito-campo.credito-importo');
                if (importoInput && importoInput.value) {
                    let valorePulito = importoInput.value.replace('€', '').trim().replace(/\./g, '').replace(',', '.');
                    totale += parseFloat(valorePulito) || 0;
                }
            });
            cellaTotale.textContent = '€ ' + new Intl.NumberFormat('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(totale);
        }

        if (headerBox && cellaTotale) {
            const computedStyle = window.getComputedStyle(headerBox);
            const headerBackgroundColor = computedStyle.backgroundColor;
            cellaTotale.style.backgroundColor = headerBackgroundColor;
            cellaTotale.style.color = 'white'; 
        }

        function formatImportoOnFocus() {
            if (!this.value) return;
            let plainValue = this.value.replace('€', '').trim().replace(/\./g, '');
            this.value = plainValue;
        }
        
        function formatImportoOnBlur() {
            let value = this.value.trim().replace(',', '.');
            value = parseFloat(value);
            if (!isNaN(value)) {
                this.value = '€ ' + new Intl.NumberFormat('it-IT', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                }).format(value);
            } else {
                this.value = '€ 0,00';
            }
            salvaDatiCredito(); 
        }
        
        function formatDateOnBlur() {
            let value = this.value.trim();
            if (!value) return;
            value = value.replace(/-/g, '/');
            const parts = value.split('/');
            let day = parseInt(parts[0], 10);
            let month = parseInt(parts[1], 10);
            if (isNaN(day) || isNaN(month) || day < 1 || day > 31 || month < 1 || month > 12) {
                this.value = ''; 
                return;
            }
            const formattedDay = String(day).padStart(2, '0');
            const formattedMonth = String(month).padStart(2, '0');
            this.value = `${formattedDay}/${formattedMonth}`;
            salvaDatiCredito();
        }

        if (editIcon && tabellaCredito && aggiungiRigaIcon && deleteBoxIcon) { 
            editIcon.addEventListener('click', () => {
                isBoxEditable = !isBoxEditable;
                tabellaCredito.classList.toggle('in-modifica', isBoxEditable); 
                box.classList.toggle('in-modifica', isBoxEditable);
                tabellaCredito.querySelectorAll('input.credito-campo').forEach(input => {
                    input.disabled = !isBoxEditable;
                    if (isBoxEditable) {
                        input.addEventListener('blur', salvaDatiCredito); 
                        input.addEventListener('blur', calcolaTotaleBox);
                        if (input.classList.contains('credito-importo')) {
                            input.addEventListener('focus', formatImportoOnFocus);
                            input.addEventListener('blur', formatImportoOnBlur); 
                        }
                        if (input.classList.contains('credito-data')) { 
                            input.addEventListener('blur', formatDateOnBlur); 
                        }
                    } else {
                        input.removeEventListener('blur', salvaDatiCredito);
                        input.removeEventListener('blur', calcolaTotaleBox);
                        if (input.classList.contains('credito-importo')) {
                            input.removeEventListener('focus', formatImportoOnFocus);
                            input.removeEventListener('blur', formatImportoOnBlur); 
                        }
                        if (input.classList.contains('credito-data')) { 
                            input.removeEventListener('blur', formatDateOnBlur); 
                        }
                    }
                });
                
                aggiungiRigaIcon.style.display = isBoxEditable ? 'inline-block' : 'none';
                cancellaUltimaRigaIcon.style.display = isBoxEditable ? 'inline-block' : 'none';
                pulisciTuttoIcon.style.display = isBoxEditable ? 'inline-block' : 'none';
                deleteBoxIcon.style.display = isBoxEditable ? 'inline-block' : 'none';
                editIcon.style.filter = isBoxEditable ? 'brightness(0)' : 'brightness(0) invert(1)';
                headerTitle.setAttribute('contenteditable', isBoxEditable ? 'true' : 'false');
                headerTitle.classList.toggle('editable-field', isBoxEditable); 
                if (!isBoxEditable) {
                    salvaDatiCredito();
                }
            });

            aggiungiRigaIcon.addEventListener('click', () => {
                const tbody = tabellaCredito.querySelector('tbody');
                const rigaTotale = tbody.querySelector('.riga-totale');
                const nuovaRiga = document.createElement('tr');
                nuovaRiga.innerHTML = `
                    <td><input type="text" class="credito-campo credito-data" value="" placeholder="GG/MM"></td>
                    <td><input type="text" class="credito-campo credito-importo" value="€ 0,00" placeholder="0,00"></td>
                    <td><input type="text" class="credito-campo credito-note" value="" placeholder="Nota"></td>
                `;
                tbody.insertBefore(nuovaRiga, rigaTotale);
                nuovaRiga.querySelectorAll('input.credito-campo').forEach(input => {
                    input.disabled = false;
                    input.addEventListener('blur', salvaDatiCredito); 
                    input.addEventListener('blur', calcolaTotaleBox);
                    if (input.classList.contains('credito-importo')) {
                        input.addEventListener('focus', formatImportoOnFocus);
                        input.addEventListener('blur', formatImportoOnBlur);
                    }
                    if (input.classList.contains('credito-data')) { 
                        input.addEventListener('blur', formatDateOnBlur);
                    }
                });
                salvaDatiCredito();
                calcolaTotaleBox(); 
            });

            cancellaUltimaRigaIcon.addEventListener('click', () => {
                const righe = box.querySelectorAll('.tabella-credito tbody tr:not(.riga-totale)');
                if (righe.length === 0) {
                    alert('Non ci sono righe da eliminare.');
                    return;
                }
                if (confirm('Sei sicuro di voler eliminare l\'ultima riga?')) {
                    righe[righe.length - 1].remove();
                    calcolaTotaleBox();
                    salvaDatiCredito();
                }
            });

            pulisciTuttoIcon.addEventListener('click', () => {
                const righe = box.querySelectorAll('.tabella-credito tbody tr:not(.riga-totale)');
                if (righe.length === 0) {
                    alert('La tabella è già vuota.');
                    return;
                }
                if (confirm('ATTENZIONE: Stai per eliminare TUTTE le righe. L\'azione è irreversibile.\n\nSei sicuro di voler continuare?')) {
                    righe.forEach(riga => riga.remove());
                    calcolaTotaleBox();
                    salvaDatiCredito();
                }
            });
            
            deleteBoxIcon.addEventListener('click', () => {
                if (confirm('Sei sicuro di voler eliminare questo box cliente e tutti i suoi dati?')) {
                    const rigaBoxGenitore = box.closest('.riga-box'); 
                    box.remove(); 
                    if (rigaBoxGenitore && rigaBoxGenitore.children.length === 1) {
                        const remainingBox = rigaBoxGenitore.querySelector('.colonna-meta.box');
                        if (remainingBox) { 
                            const emptyDiv = document.createElement('div');
                            emptyDiv.classList.add('colonna-meta');
                            emptyDiv.style.visibility = 'hidden';
                            rigaBoxGenitore.appendChild(emptyDiv);
                        } else { 
                            rigaBoxGenitore.remove(); 
                        }
                    } else if (rigaBoxGenitore && rigaBoxGenitore.children.length === 0) {
                        rigaBoxGenitore.remove();
                    }
                    salvaDatiCredito(); 
                }
            });
            
            tabellaCredito.querySelectorAll('input.credito-campo').forEach(input => {
                input.disabled = true;
                if (input.classList.contains('credito-importo') && input.value) {
                    let valoreNumerico = parseFloat(input.value);
                    if (!isNaN(valoreNumerico)) {
                        input.value = '€ ' + new Intl.NumberFormat('it-IT', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                        }).format(valoreNumerico);
                    } else {
                        input.value = '';
                    }
                }
                if (input.classList.contains('credito-data') && input.value) {
                    let value = input.value.trim().replace(/-/g, '/');
                    const parts = value.split('/');
                    if (parts.length === 2 && !isNaN(parseInt(parts[0], 10)) && !isNaN(parseInt(parts[1], 10))) {
                        const day = String(parseInt(parts[0], 10)).padStart(2, '0');
                        const month = String(parseInt(parts[1], 10)).padStart(2, '0');
                        input.value = `${day}/${month}`;
                    } else {
                        input.value = ''; 
                    }
                }
            });
            calcolaTotaleBox(); 
        }
    }

    function handleAddNewBoxPairClick() {
        let currentRow;
        const allRows = mainContainer.querySelectorAll('.riga-box');
        const lastRow = allRows[allRows.length - 1];
        const lastRowRealChildrenCount = lastRow ? lastRow.querySelectorAll('.colonna-meta.box').length : 0;
        if (allRows.length === 0 || lastRowRealChildrenCount === 2) {
            currentRow = document.createElement('div');
            currentRow.classList.add('riga-box');
            mainContainer.insertBefore(currentRow, addNewBoxPairButton.closest('.add-box-button-container')); 
        } else {
            currentRow = lastRow;
        }
        const existingEmptyDiv = currentRow.querySelector('.colonna-meta[style*="visibility: hidden"]');
        if (existingEmptyDiv) {
            existingEmptyDiv.remove();
        }
        const newBox = createClienteBox(nextClienteIndex, null); 
        currentRow.appendChild(newBox);
        initializeBoxLogic(newBox); 
        nextClienteIndex++; 
        const currentBoxesInRow = currentRow.querySelectorAll('.colonna-meta.box').length;
        if (currentBoxesInRow % 2 !== 0) { 
            const emptyDiv = document.createElement('div');
            emptyDiv.classList.add('colonna-meta');
            emptyDiv.style.visibility = 'hidden'; 
            currentRow.appendChild(emptyDiv); 
        }
        salvaDatiCredito(); 
    }

    caricaDatiCredito();

    function salvaDatiCreditoSuFile() {
        const clientBlocks = [];
        const tuttiIBoxtClienti = document.querySelectorAll('.colonna-meta.box');
        tuttiIBoxtClienti.forEach(box => {
            const nomeCliente = box.querySelector('h3').textContent.trim();
            if (!nomeCliente) { return; }
            let singleBlockLines = [];
            singleBlockLines.push(nomeCliente.toUpperCase());
            const righeTransazioni = box.querySelectorAll('.tabella-credito tbody tr:not(.riga-totale)');
            righeTransazioni.forEach(riga => {
                const data = riga.querySelector('.credito-campo.credito-data').value.trim() || 'N/D';
                const importo = riga.querySelector('.credito-campo.credito-importo').value.trim() || '€ 0,00';
                const note = riga.querySelector('.credito-note').value.trim() || '-';
                singleBlockLines.push(`${data} - ${importo} - ${note}`);
            });
            const totale = box.querySelector('.cella-totale').textContent.trim();
            singleBlockLines.push(`\nTOTALE`);
            singleBlockLines.push(totale);
            clientBlocks.push(singleBlockLines.join('\n'));
        });
        if (clientBlocks.length === 0) {
            alert('Nessun dato da salvare. Aggiungi almeno un cliente.');
            return;
        }
        const separatore = '\n-----------------------------------\n';
        let fileContent = clientBlocks.join(separatore);
        fileContent += '\n-----------------------------------';
        const oggi = new Date();
        const anno = oggi.getFullYear();
        const mese = String(oggi.getMonth() + 1).padStart(2, '0');
        const giorno = String(oggi.getDate()).padStart(2, '0');
        const nomeFile = `${anno}${mese}${giorno}-credito.txt`;
        downloadFileDiTesto(nomeFile, fileContent);
    }

    function downloadFileDiTesto(filename, text) {
        const element = document.createElement('a');
        const file = new Blob([text], {type: 'text/plain;charset=utf-8'});
        element.href = URL.createObjectURL(file);
        element.download = filename;
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    }

    window.handleFabSave = salvaDatiCreditoSuFile;
});