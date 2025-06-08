/**
 * registro.js
 * Logica per la pagina registro.html
 */

// Funzione che ricarica i dati specifici di questa pagina (da implementare)
function ricaricaDatiRegistro() {
    console.log("Ricarico i dati per la pagina Registro...");
    // In futuro, qui metteremo la logica per ricaricare i dati dal localStorage
    const dati = caricaDati('registro');
    // ...e per aggiornare la pagina con i dati.
}

// Funzione che inizializza la pagina la prima volta
function inizializzaPaginaRegistro() {
    // Carica i dati all'avvio
    ricaricaDatiRegistro();

    // Qui andranno altri event listener specifici per la pagina del registro,
    // come ad esempio quello per l'icona di modifica.
}


// --- Blocco di Avvio ---

document.addEventListener('DOMContentLoaded', function() {
    inizializzaPaginaRegistro();

    // Registra la funzione di ricarica per il gestore della cache
    // Sarà chiamata da gestioneStorage.js
    window.ricaricaDatiPagina = ricaricaDatiRegistro;
});


// Registra la funzione di esportazione per il tasto FAB
window.esportaDatiPagina = function() {
    console.log("Esportazione dati per la pagina REGISTRO...");

    // In futuro, qui recupereremo i dati dalla pagina
    const datiDaSalvare = {
        // esempio:
        // incassoContanti: document.getElementById('incasso-contanti').value
    };

    return {
        pagina: 'registro',
        timestamp: new Date().toISOString(),
        dati: datiDaSalvare
    };
}