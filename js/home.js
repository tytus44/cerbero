/**
 * home.js
 * Logica per la pagina Home.
 */

function ricaricaDatiHome() {
    console.log("Ricarico i dati per la pagina Home...");
}

function inizializzaPaginaHome() {
    ricaricaDatiHome();
}

document.addEventListener('DOMContentLoaded', function() {
    inizializzaPaginaHome();
    window.ricaricaDatiPagina = ricaricaDatiHome;
});

window.esportaDatiPagina = function() {
    return {
        pagina: 'home',
        timestamp: new Date().toISOString(),
        dati: { messaggio: "Esportazione dalla pagina principale." }
    };
}