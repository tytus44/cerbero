document.addEventListener('DOMContentLoaded', () => {
    window.ricaricaDatiPagina = () => console.log("Ricarico dati Vendite");
});
window.esportaDatiPagina = () => ({ pagina: 'cassa', timestamp: new Date().toISOString(), dati: {} });