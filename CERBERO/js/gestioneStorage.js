/**
 * gestoreStorage.js
 * Contiene le funzioni generali per interagire con il localStorage dell'applicazione.
 * Può essere riutilizzato in tutte le pagine.
 */

// Definiamo una chiave principale per contenere tutti i dati della nostra app,
// in modo da non inquinare il localStorage con tante chiavi diverse.
const APP_STORAGE_KEY = 'cerberoData';

/**
 * Carica i dati per una specifica pagina dal localStorage.
 * @param {string} paginaKey - La chiave della pagina (es. 'carico', 'registro').
 * @returns {any} I dati salvati per quella pagina, o null se non esistono.
 */
function caricaDati(paginaKey) {
    const datiApplicazione = localStorage.getItem(APP_STORAGE_KEY);
    if (!datiApplicazione) {
        return null; // Nessun dato salvato per l'intera applicazione
    }
    const datiParse = JSON.parse(datiApplicazione);
    return datiParse[paginaKey] || null; // Restituisce i dati della pagina o null
}

/**
 * Salva i dati di una specifica pagina nel localStorage.
 * @param {string} paginaKey - La chiave della pagina (es. 'carico').
 * @param {any} datiDaSalvare - I dati (solitamente un array di oggetti) da salvare.
 */
function salvaDati(paginaKey, datiDaSalvare) {
    // Prima carica tutti i dati esistenti per non sovrascrivere quelli di altre pagine
    const datiApplicazione = JSON.parse(localStorage.getItem(APP_STORAGE_KEY) || '{}');
    
    // Aggiorna solo i dati della pagina corrente
    datiApplicazione[paginaKey] = datiDaSalvare;
    
    // Salva l'oggetto aggiornato nel localStorage
    localStorage.setItem(APP_STORAGE_KEY, JSON.stringify(datiApplicazione));
}


// --- BLOCCO GENERICO PER GESTIRE LA BFCACHE ---

/**
 * Questo gestore di eventi ascolta ogni volta che una pagina viene mostrata.
 * Se la pagina viene ripristinata dalla cache (event.persisted è true),
 * cerca e chiama una funzione globale 'ricaricaDatiPagina' se esiste.
 */
window.addEventListener('pageshow', function(event) {
    if (event.persisted) {
        if (typeof window.ricaricaDatiPagina === 'function') {
            console.log('Pagina ripristinata dalla cache. Eseguo ricaricaDatiPagina().');
            window.ricaricaDatiPagina();
        }
    }
});