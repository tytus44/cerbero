document.addEventListener('DOMContentLoaded', () => {
    window.ricaricaDatiPagina = () => console.log("Ricarico dati Cassa");
});
window.esportaDatiPagina = () => ({ pagina: 'cassa', timestamp: new Date().toISOString(), dati: {} });