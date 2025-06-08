/**
 * carico.js
 * Logica per la pagina carico.html con gestione scarico + differenza.
 */
document.addEventListener("DOMContentLoaded", function() {
    
    const editIcon = document.getElementById('editIcon'); // Icona modifica tabella
    const addRowIcon = document.getElementById('addRowIcon');
    const editRimanenzaIcon = document.getElementById('editRimanenzaIcon'); // Icona modifica rimanenza
    const tbody = document.querySelector('#caricoTable tbody');
    const boxTabellaPrincipale = document.querySelector('.box-tabella-principale'); 
    const boxCaricoContabile = document.querySelector('.colonna-riepilogo.box:nth-of-type(2)'); // Il box del carico contabile
    
    let isEditable = false; // Stato per la tabella principale
    let isRimanenzaEditable = false; // Stato per la rimanenza
    const productKeys = ['benzina', 'gasolio', 'dieselPlus', 'hvolution'];

    // Mappa i nomi dei prodotti ai colori (dal tuo base.css)
    const productColors = { 
        'benzina': 'var(--colore-verde)',
        'gasolio': 'var(--colore-giallo)',
        'dieselPlus': 'var(--colore-arancione)',
        'hvolution': 'var(--colore-blu)'
    };

    // Funzioni esistenti (come in carico.js originale)
    function formatNumberOnBlur(event) {
        const el = event.target;
        const text = el.textContent.replace(/\./g, '').trim();
        const number = parseInt(text, 10);
        el.textContent = !isNaN(number) ? new Intl.NumberFormat('it-IT').format(number) : '0';
        if (el.id.startsWith('rimanenza')) {
            salvaDatiRimanenza();
        } else {
            salvaDatiTabella();
        }
    }
    
    function coloreDifferenza(event) {
        const input = event.target;
        if (input.value.startsWith('+')) { input.style.color = '#28a745'; }
        else if (input.value.startsWith('-')) { input.style.color = '#dc3545'; }
        else { input.style.color = ''; }
    }
    
    function onDifferenceChange() { salvaDatiTabella(); }
    
    function parseNumero(str) {
        if (typeof str !== 'string' || !str) return 0;
        return parseInt(str.replace(/\./g, ''), 10) || 0;
    }

    function aggiornaRiepilogoAnno() {
        const dati = leggiDatiDaTabella();
        const annoCorrente = new Date().getFullYear();
        let totaleGeneraleLitri = 0;
        const totaliProdotti = Object.fromEntries(productKeys.map(key => [key, 0]));
        const totaliDifferenze = Object.fromEntries(productKeys.map(key => [key, 0]));
        dati.forEach(riga => {
            productKeys.forEach(key => {
                if(riga[key]) {
                    const scarico = parseNumero(riga[key].scarico);
                    const differenza = parseNumero(riga[key].differenza);
                    totaliProdotti[key] += scarico;
                    totaliDifferenze[key] += differenza;
                    totaleGeneraleLitri += scarico;
                }
            });
        });
        document.getElementById('carico-anno-titolo').textContent = `Totale Carico Anno (${annoCorrente})`;
        document.getElementById('totale-litri-anno').textContent = new Intl.NumberFormat('it-IT').format(totaleGeneraleLitri);
        productKeys.forEach(key => {
            document.getElementById(`totale-${key}`).textContent = new Intl.NumberFormat('it-IT').format(totaliProdotti[key]);
            const diffEl = document.getElementById(`diff-${key}`);
            const diffValue = totaliDifferenze[key];
            diffEl.textContent = new Intl.NumberFormat('it-IT', { signDisplay: 'always' }).format(diffValue);
            diffEl.className = 'diff-prodotto-anno'; // Corretto per usare la classe corretta
            if (diffValue > 0) diffEl.classList.add('positivo');
            if (diffValue < 0) diffEl.classList.add('negativo');
        });
        aggiornaCaricoContabile();
    }

    function aggiornaCaricoContabile() {
        productKeys.forEach(key => {
            const rimanenza = parseNumero(document.getElementById(`rimanenza-${key}`).textContent);
            const caricoAnno = parseNumero(document.getElementById(`totale-${key}`).textContent); // Prende dal totale anno
            const totaleContabile = rimanenza + caricoAnno;
            document.getElementById(`contabile-${key}`).textContent = new Intl.NumberFormat('it-IT').format(totaleContabile);
        });
    }

    function leggiDatiDaTabella() {
        const righe = [];
        tbody.querySelectorAll('tr').forEach((riga, index) => {
            const celle = riga.querySelectorAll('td');
            const datiRiga = { id: index };
            datiRiga.n = celle[0].textContent; // Numero riga
            datiRiga.data = celle[1].textContent; // Data (assumendo sia testo statico)
            
            productKeys.forEach((key, i) => {
                const cellaProdotto = celle[i + 2]; // Inizia dalla 3a cella (indice 2)
                datiRiga[key] = {
                    scarico: cellaProdotto.querySelector('.scarico-value').textContent,
                    differenza: cellaProdotto.querySelector('.differenza-input').value
                };
            });
            datiRiga.autista = celle[celle.length - 1].querySelector('.autista-value').textContent;
            righe.push(datiRiga);
        });
        return righe;
    }
    
    function salvaDatiTabella() {
        const dati = leggiDatiDaTabella();
        // Presumo esista una funzione salvaDati globale (in gestioneStorage.js)
        salvaDati('carico', dati); 
        aggiornaRiepilogoAnno();
    }
    
    function salvaDatiRimanenza() {
        const dati = {};
        productKeys.forEach(key => {
            dati[key] = document.getElementById(`rimanenza-${key}`).textContent;
        });
        // Presumo esista una funzione salvaDati globale (in gestioneStorage.js)
        salvaDati('caricoRimanenza', dati); 
        aggiornaCaricoContabile();
    }

    function caricaDatiRimanenza() {
        // Presumo esista una funzione caricaDati globale (in gestioneStorage.js)
        const datiSalvati = caricaDati('caricoRimanenza');
        document.getElementById('rimanenza-anno-titolo').textContent = `Rimanenza Anno (${new Date().getFullYear() - 1})`;
        productKeys.forEach(key => {
            const valore = (datiSalvati && datiSalvati[key]) ? datiSalvati[key] : '0';
            document.getElementById(`rimanenza-${key}`).textContent = valore;
        });
    }

    function popolaTabella(datiRighe) {
        tbody.innerHTML = ''; // Pulisce la tabella
        datiRighe.forEach(datiRiga => {
            const riga = document.createElement('tr');
            let rigaHtml = `<td>${datiRiga.n || ''}</td><td>${datiRiga.data || ''}</td>`;
            productKeys.forEach(key => {
                const datiProdotto = datiRiga[key];
                const scarico = (datiProdotto && typeof datiProdotto === 'object') ? datiProdotto.scarico : (datiProdotto || '0');
                const differenza = (datiProdotto && typeof datiProdotto === 'object') ? datiProdotto.differenza : '';
                
                // Applica lo stile inline qui, usando productColors e !important
                const coloreProdotto = productColors[key] || 'var(--testo-scuro)'; // Fallback al nero
                
                rigaHtml += `
                    <td>
                        <div class="product-cell-wrapper">
                            <span class="scarico-value ${'colore-' + key}" contenteditable="false" style="color: ${coloreProdotto} !important;">${scarico}</span>
                            <input type="text" class="differenza-input" value="${differenza}" placeholder="±" disabled style="display: none;">
                        </div>
                    </td>`;
            });
            rigaHtml += `<td><span class="autista-value" contenteditable="false">${datiRiga.autista || ''}</span></td>`;
            riga.innerHTML = rigaHtml;
            tbody.appendChild(riga);
        });

        // La logica di applicazione del colore è ora nella generazione HTML, quindi non serve un secondo blocco.

        // Applica i colori iniziali alle differenze e abilita/disabilita in base allo stato isEditable
        tbody.querySelectorAll('.differenza-input').forEach(input => {
            coloreDifferenza({ target: input }); // Applica colore al caricamento
            input.disabled = !isEditable; // Disabilita se non siamo in modalità modifica
            input.style.display = isEditable ? 'block' : 'none'; // Nascondi se non in modalità modifica
        });
        tbody.querySelectorAll('.scarico-value, .autista-value').forEach(el => {
            el.setAttribute('contenteditable', isEditable);
            el.classList.toggle('editable-field', isEditable);
        });
        gestisciListenerCella(tbody, true); // Ricollega i listener dopo aver ripopolato la tabella
    }

    function aggiungiRiga() {
        const numeroRiga = tbody.rows.length + 1;
        const oggi = new Date();
        const dataCorrente = oggi.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' });
        const nuovaRiga = document.createElement('tr');
        
        let nuovaRigaHtml = `<td>${numeroRiga}</td><td>${dataCorrente}</td>`;
        productKeys.forEach(key => {
            const coloreProdotto = productColors[key] || 'var(--testo-scuro)';
            nuovaRigaHtml += `
                <td>
                    <div class="product-cell-wrapper">
                        <span class="scarico-value ${'colore-' + key}" contenteditable="false" style="color: ${coloreProdotto} !important;">0</span>
                        <input type="text" class="differenza-input" value="" placeholder="±" disabled style="display: none;">
                    </div>
                </td>`;
        });
        nuovaRigaHtml += `<td><span class="autista-value" contenteditable="false"></span></td>`;
        nuovaRiga.innerHTML = nuovaRigaHtml;
        
        tbody.appendChild(nuovaRiga);

        // La logica di applicazione del colore è ora nella generazione HTML, quindi non serve un secondo blocco.
        
        if (isEditable) {
            gestisciListenerCella(nuovaRiga, true);
            nuovaRiga.querySelectorAll('.scarico-value, .autista-value').forEach(el => {
                el.setAttribute('contenteditable', 'true');
                el.classList.add('editable-field'); // Aggiungi classe per stile di evidenziazione
            });
            nuovaRiga.querySelectorAll('.differenza-input').forEach(input => {
                input.style.display = 'block';
                input.disabled = false;
                input.dispatchEvent(new Event('input', { bubbles: true }));
            });
        }
        salvaDatiTabella();
    }
    
    function gestisciListenerCella(element, add) {
        const action = add ? 'addEventListener' : 'removeEventListener';
        element.querySelectorAll('.scarico-value, .autista-value').forEach(span => span[action]('blur', formatNumberOnBlur));
        element.querySelectorAll('.differenza-input').forEach(input => {
            input[action]('blur', onDifferenceChange);
            input[action]('input', coloreDifferenza);
        });
    }
    
    function inizializzaPaginaCarico() {
        const datiSalvati = caricaDati('carico');
        if (datiSalvati && datiSalvati.length > 0) {
            popolaTabella(datiSalvati);
        } else {
            const datiDefault = [{ id: 0, n: '1', data: '06/06', benzina: { scarico: '5.000', differenza: '-15' }, gasolio: { scarico: '8.000', differenza: '+10' }, dieselPlus: { scarico: '2.500', differenza: '' }, hvolution:  { scarico: '1.200', differenza: '' }, autista: 'Mario Rossi' }];
            popolaTabella(datiDefault);
        }
        aggiornaRiepilogoAnno();
        caricaDatiRimanenza();
    }

    function ricaricaDatiCompletiCarico() {
        const datiSalvati = caricaDati('carico');
        if (datiSalvati && datiSalvati.length > 0) {
            popolaTabella(datiSalvati);
        } else {
            // Se non ci sono dati salvati, carica i dati di default o una tabella vuota
            popolaTabella([]); // O popolaTabella(datiDefault); se preferisci un reset completo
        }
        caricaDatiRimanenza();
        aggiornaRiepilogoAnno();
    }

    // Event Listener per l'icona di modifica della TABELLA PRINCIPALE (editIcon)
    // base.js gestirà il focus del box principale. Questo listener gestisce solo gli elementi interni alla tabella.
    editIcon.addEventListener('click', () => {
        // Legge lo stato di modifica dopo che base.js ha fatto il toggle del .in-modifica sul box genitore
        isEditable = boxTabellaPrincipale.classList.contains('in-modifica');

        // Mostra/nascondi addRowIcon
        addRowIcon.style.display = isEditable ? 'inline-block' : 'none';

        // Abilita/disabilita e mostra/nascondi i campi contenteditable e input differenza
        tbody.querySelectorAll('.scarico-value, .autista-value').forEach(el => {
            el.setAttribute('contenteditable', isEditable);
            el.classList.toggle('editable-field', isEditable); // Aggiungi/rimuovi classe per evidenziazione
        });
        tbody.querySelectorAll('.differenza-input').forEach(input => {
            input.disabled = !isEditable;
            input.style.display = isEditable ? 'block' : 'none';
            if (!isEditable) {
                coloreDifferenza({ target: input }); // Applica colore al disabilitare (utile per rimuovere colore su non validi)
            }
        });
        
        gestisciListenerCella(tbody, isEditable); // Ri-aggancia/sconnetti listener per blur, input
        // Aggiorna il filtro dell'icona (base.js non tocca il filter, quindi lo gestiamo qui)
        editIcon.style.filter = isEditable ? 'brightness(0) invert(0.8) sepia(1) hue-rotate(80deg) saturate(5)' : 'brightness(0) invert(1)';
    });

    // Event Listener per l'icona di modifica della RIMANENZA (editRimanenzaIcon)
    // base.js gestirà il focus del box di rimanenza. Questo listener gestisce solo i contenteditable.
    editRimanenzaIcon.addEventListener('click', () => {
        // Legge lo stato di modifica dopo che base.js ha fatto il toggle del .in-modifica sul box genitore
        isRimanenzaEditable = boxCaricoContabile.classList.contains('in-modifica');

        productKeys.forEach(key => {
            const el = document.getElementById(`rimanenza-${key}`);
            el.setAttribute('contenteditable', isRimanenzaEditable);
            el.classList.toggle('editable-field', isRimanenzaEditable); // Aggiungi/rimuovi classe per evidenziazione
            if (isRimanenzaEditable) { el.addEventListener('blur', formatNumberOnBlur); }
            else { el.removeEventListener('blur', formatNumberOnBlur); }
        });
        // Aggiorna il filtro dell'icona (base.js non tocca il filter, quindi lo gestiamo qui)
        editRimanenzaIcon.style.filter = isRimanenzaEditable ? 'brightness(0) invert(0.8) sepia(1) hue-rotate(80deg) saturate(5)' : 'brightness(0) invert(1)';
    });


    addRowIcon.addEventListener('click', aggiungiRiga);
    
    inizializzaPaginaCarico();
    window.ricaricaDatiPagina = ricaricaDatiCompletiCarico;
    window.esportaDatiPagina = function() {
        function leggiDatiRimanenza() { const dati = {}; const productKeys = ['benzina', 'gasolio', 'dieselPlus', 'hvolution']; productKeys.forEach(key => { dati[key] = document.getElementById(`rimanenza-${key}`).textContent; }); return dati; }
        function leggiDatiTabellaCompleta() { const righe = []; const tbody = document.querySelector('#caricoTable tbody'); const productKeys = ['benzina', 'gasolio', 'dieselPlus', 'hvolution']; tbody.querySelectorAll('tr').forEach((riga, index) => { const celle = riga.querySelectorAll('td'); const datiRiga = { id: index }; datiRiga.n = celle[0].textContent; datiRiga.data = celle[1].textContent; productKeys.forEach((key, i) => { const cellaProdotto = celle[i + 2]; datiRiga[key] = { scarico: cellaProdotto.querySelector('.scarico-value').textContent, differenza: cellaProdotto.querySelector('.differenza-input').value }; }); datiRiga.autista = celle[celle.length - 1].querySelector('.autista-value').textContent; righe.push(datiRiga); }); return righe; }
        return {
            pagina: 'carico',
            timestamp: new Date().toISOString(),
            rimanenzaAnnoPrecedente: leggiDatiRimanenza(),
            dettaglioCarichi: leggiDatiTabellaCompleta()
        };
    };
});