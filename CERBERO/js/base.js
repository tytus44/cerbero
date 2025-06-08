// base.js - Funzionalità JavaScript globali per il progetto

document.addEventListener('DOMContentLoaded', () => {
    // Funzione helper per convertire un colore HEX a RGBA con una data opacità
    function hexToRgba(hex, alpha) {
        let r = 0, g = 0, b = 0;
        if (hex.length === 4) {
            r = parseInt(hex[1] + hex[1], 16);
            g = parseInt(hex[2] + hex[2], 16);
            b = parseInt(hex[3] + hex[3], 16);
        } else if (hex.length === 7) {
            r = parseInt(hex.substring(1, 3), 16);
            g = parseInt(hex.substring(3, 5), 16);
            b = parseInt(hex.substring(5, 7), 16);
        }
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    // Funzione per gestire l'attivazione/disattivazione dei box e il loro focus
    function setupBoxEditMode(selectorIconeModifica = '.edit-icon', selectorBox = '.box', selectorInputValore = 'input[type="text"], input[type="number"], textarea, select') {
        const boxes = document.querySelectorAll(selectorBox);

        document.querySelectorAll(selectorIconeModifica).forEach(icon => {
            icon.addEventListener('click', function(event) {
                event.stopPropagation(); // Impedisce la propagazione dell'evento di click

                const currentBox = this.closest(selectorBox);
                // **Modifica qui per rendere la selezione di headerBox più sicura**
                const headerBox = currentBox ? currentBox.querySelector('.header-box') : null;
                const inputsToManage = currentBox ? currentBox.querySelectorAll(selectorInputValore) : []; 

                const isCurrentlyInEditMode = currentBox && currentBox.classList.contains('in-modifica'); // Aggiunto controllo per currentBox

                // Rimuovi stato di modifica e focus da TUTTI i box
                boxes.forEach(box => {
                    box.classList.remove('in-modifica');
                    box.style.boxShadow = '';
                    box.style.borderColor = 'transparent';
                    // Disabilita solo gli input "standard" negli altri box
                    box.querySelectorAll(selectorInputValore).forEach(input => {
                        input.disabled = true;
                    });
                });

                // Se il box cliccato NON era in modalità modifica, attivala
                if (currentBox && !isCurrentlyInEditMode) { // Aggiunto controllo per currentBox
                    currentBox.classList.add('in-modifica');

                    // LEGGI IL COLORE DI SFONDO DALL'INTESTAZIONE E APPLICALO AL FOCUS DEL BOX
                    if (headerBox) { // Aggiunto controllo per headerBox
                        const computedStyle = window.getComputedStyle(headerBox);
                        const headerBackgroundColor = computedStyle.backgroundColor; // Sarà in formato rgb(x, y, z) o rgba(x, y, z, a)

                        let focusColorRgba = '';
                        let solidBorderColor = headerBackgroundColor; // Il colore del bordo solido sarà il colore di sfondo dell'intestazione

                        // Prova a parse il colore RGB/RGBA
                        const rgbMatch = headerBackgroundColor.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
                        const rgbaMatch = headerBackgroundColor.match(/^rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)$/);

                        if (rgbaMatch) {
                            // Se è già RGBA, usiamo i primi 3 componenti e impostiamo noi l'opacità per l'ombra
                            focusColorRgba = `rgba(${rgbaMatch[1]}, ${rgbaMatch[2]}, ${rgbaMatch[3]}, 0.4)`;
                        } else if (rgbMatch) {
                            // Se è RGB, costruiamo una stringa RGBA con l'opacità
                            focusColorRgba = `rgba(${rgbMatch[1]}, ${rgbMatch[2]}, ${rgbMatch[3]}, 0.4)`;
                        } else {
                            // Fallback se il formato non è riconosciuto (es. colori nominati, o se hexToRgba fosse necessario)
                            // Puoi decidere un colore di fallback fisso se non riesci a leggere il colore
                            focusColorRgba = 'rgba(52, 93, 242, 0.4)'; // Blu predefinito
                            solidBorderColor = 'var(--colore-blu)';
                        }
                        
                        currentBox.style.boxShadow = `0 0 0 4px ${focusColorRgba}`;
                        currentBox.style.borderColor = solidBorderColor; 
                    }
                    
                    // Abilita gli input "standard" nel box corrente
                    inputsToManage.forEach(input => {
                        input.disabled = false;
                    });
                }
            });
        });
    }

    // Chiamata per la gestione dei box.
    setupBoxEditMode(); 
});