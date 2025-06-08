// pulsante_fab.js - Logica GLOBALE per il Floating Action Button (FAB)

document.addEventListener('DOMContentLoaded', () => {
    // Evita di creare duplicati se per qualche motivo lo script viene caricato più volte
    if (document.querySelector('.fab-salva')) {
        return;
    }

    // --- 1. CREAZIONE DELL'ELEMENTO HTML DEL PULSANTE ---
    const fabElement = document.createElement('div');
    fabElement.classList.add('fab-salva');
    fabElement.title = 'Salva Dati'; // Utile per l'accessibilità

    // Imposta l'icona all'interno del pulsante
    // NB: Assumo che l'icona per il salvataggio si chiami 'icon_salva.svg'
    fabElement.innerHTML = `<img src="../icons/icon_salva.svg" alt="Salva">`;

    // Aggiungi il pulsante creato al corpo del documento
    document.body.appendChild(fabElement);

    // --- 2. GESTIONE DEL CLICK (Logica agnostica) ---
    fabElement.addEventListener('click', () => {
        // Controlla se la pagina corrente ha definito una funzione di salvataggio specifica
        if (typeof window.handleFabSave === 'function') {
            // Se esiste, la esegue
            window.handleFabSave();
        } else {
            // Altrimenti, avvisa l'utente che la funzione non è disponibile
            alert('Funzione di salvataggio non disponibile per questa pagina.');
        }
    });
});