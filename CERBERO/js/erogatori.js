// erogatori.js - Funzionalità JavaScript specifiche per la pagina erogatori.html

document.addEventListener('DOMContentLoaded', () => {
    // Esempio: gestire l'input dei contatori (formattazione, calcolo)
    document.querySelectorAll('.contatore-inizio, .contatore-fine').forEach(input => {
        input.addEventListener('input', function() {
            const row = this.closest('.riga-campo');
            const inizioInput = row.querySelector('.contatore-inizio');
            const fineInput = row.querySelector('.contatore-fine');
            const totaleSpan = row.querySelector('.contatore-totale');

            // Pulizia e conversione dei valori (rimuovi punti, converti in numero)
            const inizio = parseFloat(inizioInput.value.replace(/\./g, '').replace(/,/g, '.')) || 0;
            const fine = parseFloat(fineInput.value.replace(/\./g, '').replace(/,/g, '.')) || 0;

            let totale = 0;
            if (fine >= inizio) {
                totale = fine - inizio;
            } else {
                totale = 0; 
            }
            
            // Aggiorna il totale formattato
            totaleSpan.textContent = totale.toLocaleString('it-IT', { minimumFractionDigits: 3, maximumFractionDigits: 3 });

            // Funzione per formattare il numero con i punti per le migliaia
            const formatNumberWithDots = (numStr) => {
                let cleanStr = numStr.replace(/\D/g, ''); 
                if (cleanStr.length === 0) return '';
                return cleanStr.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
            };

            // Applica la formattazione mentre l'utente digita
            if (this === inizioInput) {
                inizioInput.value = formatNumberWithDots(inizioInput.value);
            } else if (this === fineInput) {
                fineInput.value = formatNumberWithDots(fineInput.value);
            }
        });
    });

    // Puoi aggiungere qui altre logiche specifiche di erogatori.html
    // ad esempio, l'interazione con il pulsante Salva, caricamento dati iniziali, ecc.
});