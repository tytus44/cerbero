/**
 * menu.js
 * Gestisce tutta l'interattività del menu di navigazione principale.
 */
document.addEventListener('DOMContentLoaded', function() {

    // --- LOGICA PER EVIDENZIARE LA PAGINA CORRENTE ---
    
    // Identifica la pagina corrente (es. "carico.html" o "index.html" per la root)
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    
    // Prende tutti i link del menu
    const navLinks = document.querySelectorAll('.header .nav a');

    navLinks.forEach(link => {
        // Estrae il nome del file dal link
        const linkHref = link.getAttribute('href').split('/').pop();
        
        // Applica le classi etichetta solo al link della pagina corrente
        if (currentPage === linkHref) {
            link.classList.add('etichetta-tipo', 'etichetta-blu');
        } else {
            // Assicura che gli altri link non abbiano le classi etichetta
            link.classList.remove('etichetta-tipo', 'etichetta-blu');
        }
    });

});