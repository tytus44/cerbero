/* ===== INIZIO JAVASCRIPT - VENDITE UNIFICATO ===== */

/* ===== INIZIO GESTIONE STORAGE UNIFICATO ===== */
const Storage = {
    KEYS: {
        NOTES: 'cerbero_notes',
        TODO_LIST: 'cerbero_todo',
        CURRENT_TURNO: 'cerbero_turno',
        DISPENSERS: 'cerbero_dispensers',
        CARICO_TOTALS: 'cerbero_carico_totals',
        CARICO_HISTORY: 'cerbero_carico_history',
        VENDITE_DATA: 'cerbero_vendite',
        MONETARIO_DATA: 'cerbero_monetario',
        CREDITO_DATA: 'cerbero_credito',
        REGISTRO_DATA: 'cerbero_registro'
    },

    save: function(key, data) {
        try {
            if (key === this.KEYS.NOTES) {
                localStorage.setItem(key, data);
                return true;
            }
            localStorage.setItem(key, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('Errore nel salvare i dati:', error);
            return false;
        }
    },

    load: function(key, defaultValue = null) {
        try {
            const data = localStorage.getItem(key);
            if (!data) return defaultValue;
            
            if (key === this.KEYS.NOTES) {
                return data;
            }
            return JSON.parse(data);
        } catch (error) {
            console.error('Errore nel caricare i dati per', key, ':', error);
            if (key === this.KEYS.NOTES) {
                const rawData = localStorage.getItem(key);
                return rawData || defaultValue;
            }
            return defaultValue;
        }
    },

    remove: function(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error('Errore nel rimuovere i dati:', error);
            return false;
        }
    }
};
/* ===== FINE GESTIONE STORAGE UNIFICATO ===== */

/* ===== INIZIO UTILITY ===== */
function showMessage(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast-message toast-${type}`;
    toast.textContent = message;
    
    const colors = {
        success: '#28a745',
        error: '#dc3545',
        info: '#17a2b8',
        warning: '#ffc107'
    };
    
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${colors[type] || colors.info};
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        z-index: 1001;
        font-family: 'Montserrat', sans-serif;
        font-weight: 600;
        font-size: 14px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }, 3000);
}

function parseEuro(value) {
    if (!value) return 0;
    const cleaned = value.replace(/[€\s]/g, '').replace(/\./g, '').replace(',', '.');
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
}

function parseLitri(value) {
    if (!value) return 0;
    const cleaned = value.toString().replace(/\./g, '');
    const parsed = parseInt(cleaned) || 0;
    return parsed;
}

function formatNumber(num) {
    return new Intl.NumberFormat('it-IT').format(num);
}

function formatEuro(value) {
    return new Intl.NumberFormat('it-IT', {
        style: 'currency',
        currency: 'EUR'
    }).format(value);
}
/* ===== FINE UTILITY ===== */

/* ===== INIZIO GESTIONE VENDITE UNIFICATA ===== */
const VenditeManager = {
    chartInstances: {},
    venditeData: {},
    currentPeriod: {
        startDate: null,
        endDate: null
    },

    // Carica dati vendite dal storage unificato
    loadVenditeData: function() {
        this.venditeData = Storage.load(Storage.KEYS.VENDITE_DATA, {
            periods: {},
            settings: {},
            analytics: {}
        });
        return this.venditeData;
    },

    // Salva dati vendite nel storage unificato
    saveVenditeData: function() {
        try {
            const success = Storage.save(Storage.KEYS.VENDITE_DATA, this.venditeData);
            if (success) {
                console.log('💾 Dati vendite salvati in localStorage');
            } else {
                console.error('❌ Errore nel salvare i dati vendite');
            }
            return success;
        } catch (error) {
            console.error('❌ Errore critico nel salvataggio vendite:', error);
            return false;
        }
    },

    // Inizializza periodo con data corrente
    initializePeriod: function() {
        const today = new Date();
        const todayStr = this.formatDateToString(today);
        
        this.currentPeriod.startDate = todayStr;
        this.currentPeriod.endDate = todayStr;
        
        console.log('Periodo inizializzato:', this.currentPeriod);
    },

    // Formatta data in stringa DD/MM/YYYY
    formatDateToString: function(date) {
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    },

    // Converte stringa DD/MM/YYYY in oggetto Date
    parseStringToDate: function(dateStr) {
        if (!dateStr) return null;
        const parts = dateStr.split('/');
        if (parts.length !== 3) return null;
        
        const day = parseInt(parts[0]);
        const month = parseInt(parts[1]) - 1; // I mesi in JavaScript sono 0-based
        const year = parseInt(parts[2]);
        
        return new Date(year, month, day);
    },

    // Aggiorna periodo da input utente
    updatePeriod: function() {
        const startDateInput = document.getElementById('startDate');
        const endDateInput = document.getElementById('endDate');
        
        let startDate = startDateInput?.value || '';
        let endDate = endDateInput?.value || '';
        
        // Se i campi sono vuoti, usa data corrente
        if (!startDate && !endDate) {
            this.initializePeriod();
            console.log('Campi data vuoti - utilizzando data corrente');
        } else {
            // Se solo uno dei due campi è compilato, usa quello per entrambi
            if (!startDate && endDate) startDate = endDate;
            if (!endDate && startDate) endDate = startDate;
            
            this.currentPeriod.startDate = startDate;
            this.currentPeriod.endDate = endDate;
            
            console.log('Periodo aggiornato dall\'utente:', this.currentPeriod);
        }
        
        // Valida le date
        const startDateObj = this.parseStringToDate(this.currentPeriod.startDate);
        const endDateObj = this.parseStringToDate(this.currentPeriod.endDate);
        
        if (!startDateObj || !endDateObj) {
            showMessage('Date non valide. Formato richiesto: DD/MM/YYYY', 'warning');
            this.initializePeriod();
            return false;
        }
        
        if (startDateObj > endDateObj) {
            showMessage('La data di inizio deve essere precedente alla data di fine', 'warning');
            return false;
        }
        
        return true;
    },

    // Pulisci campi data
    clearPeriod: function() {
        const startDateInput = document.getElementById('startDate');
        const endDateInput = document.getElementById('endDate');
        
        if (startDateInput) startDateInput.value = '';
        if (endDateInput) endDateInput.value = '';
        
        this.initializePeriod();
        showMessage('Periodo reimpostato a oggi', 'info');
        this.refreshData();
    },

    // Carica dati storici per il periodo (simulazione)
    loadPeriodData: function() {
        console.log(`Analizzando periodo dal ${this.currentPeriod.startDate} al ${this.currentPeriod.endDate}`);
        
        // Se il periodo è solo oggi, usa dati reali
        const today = this.formatDateToString(new Date());
        const isToday = (this.currentPeriod.startDate === today && this.currentPeriod.endDate === today);
        
        if (isToday) {
            console.log('Periodo = oggi: utilizzo dati reali');
            return {
                useRealData: true,
                multiplier: 1
            };
        } else {
            // Per periodi diversi, simula dati proporzionali
            const startDate = this.parseStringToDate(this.currentPeriod.startDate);
            const endDate = this.parseStringToDate(this.currentPeriod.endDate);
            const daysDiff = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
            
            console.log(`Periodo di ${daysDiff} giorni: simulazione dati`);
            return {
                useRealData: false,
                multiplier: daysDiff,
                days: daysDiff
            };
        }
    },

    loadPrezziData: function() {
        // Carica dati da MONETARIO_DATA invece di PREZZI_DATA
        const monetarioData = Storage.load(Storage.KEYS.MONETARIO_DATA, {});
        const prezziData = monetarioData.pricing || {};
        
        console.log('Dati prezzi caricati dal storage monetario:', prezziData);
        
        // Leggi solo i prezzi SERVITO e IPERSELF dal box "PREZZI APPLICATI ENILIVE"
        const prezzi = {
            benzina: {
                servito: this.extractPrice(prezziData.benzina?.servito) || 1.750, // Default fallback
                iperself: this.extractPrice(prezziData.benzina?.iperself) || 1.700
            },
            gasolio: {
                servito: this.extractPrice(prezziData.gasolio?.servito) || 1.650,
                iperself: this.extractPrice(prezziData.gasolio?.iperself) || 1.600
            },
            diesel: {
                servito: this.extractPrice(prezziData.diesel?.servito) || 1.680,
                iperself: this.extractPrice(prezziData.diesel?.iperself) || 1.630
            },
            hvolution: {
                servito: this.extractPrice(prezziData.hvolution?.servito) || 1.720,
                iperself: this.extractPrice(prezziData.hvolution?.iperself) || 1.670
            },
            adblue: {
                // AdBlue ha solo prezzo servito nella pagina monetario
                servito: this.extractPrice(prezziData.adblue?.servito) || 0.850,
                iperself: this.extractPrice(prezziData.adblue?.servito) || 0.850 // Stesso prezzo
            }
        };
        
        console.log('Prezzi SERVITO e IPERSELF estratti per fatturato:');
        console.log('- Benzina: Servito €' + prezzi.benzina.servito.toFixed(3) + ' | Iperself €' + prezzi.benzina.iperself.toFixed(3));
        console.log('- Gasolio: Servito €' + prezzi.gasolio.servito.toFixed(3) + ' | Iperself €' + prezzi.gasolio.iperself.toFixed(3));
        console.log('- Diesel+: Servito €' + prezzi.diesel.servito.toFixed(3) + ' | Iperself €' + prezzi.diesel.iperself.toFixed(3));
        console.log('- HVOlution: Servito €' + prezzi.hvolution.servito.toFixed(3) + ' | Iperself €' + prezzi.hvolution.iperself.toFixed(3));
        console.log('- AdBlue: Servito €' + prezzi.adblue.servito.toFixed(3) + ' | Iperself €' + prezzi.adblue.iperself.toFixed(3));
        
        return prezzi;
    },

    // Funzione helper per estrarre prezzo da vari formati
    extractPrice: function(priceValue) {
        if (!priceValue) return 0;
        
        // Se è già un numero
        if (typeof priceValue === 'number') {
            return priceValue;
        }
        
        // Se è una stringa
        if (typeof priceValue === 'string') {
            const cleaned = priceValue.replace(/[€\s]/g, '').replace(/\./g, '').replace(',', '.');
            const parsed = parseFloat(cleaned);
            return isNaN(parsed) ? 0 : parsed;
        }
        
        // Se è un oggetto, prova a trovare il valore
        if (typeof priceValue === 'object') {
            // Cerca proprietà comuni come 'value', 'prezzo', 'amount'
            const possibleKeys = ['value', 'prezzo', 'amount', 'price'];
            for (const key of possibleKeys) {
                if (priceValue[key] !== undefined) {
                    return this.extractPrice(priceValue[key]);
                }
            }
            
            // Se non trova chiavi specifiche, prova a convertire il primo valore numerico
            const values = Object.values(priceValue);
            for (const val of values) {
                const extracted = this.extractPrice(val);
                if (extracted > 0) return extracted;
            }
        }
        
        return 0;
    },

    loadErogatoriData: function() {
        const erogatoriData = Storage.load(Storage.KEYS.DISPENSERS, {});
        const totals = {
            benzina: 0,
            gasolio: 0,
            diesel: 0,
            hvolution: 0,
            adblue: 0
        };

        const servitoDispensers = ['1-2', '3', '5'];
        const iperselfDispensers = ['4', '6', '7'];

        const modalityTotals = {
            servito: 0,
            iperself: 0
        };

        const productModalityTotals = {
            benzina: { servito: 0, iperself: 0 },
            gasolio: { servito: 0, iperself: 0 },
            diesel: { servito: 0, iperself: 0 },
            hvolution: { servito: 0, iperself: 0 },
            adblue: { servito: 0, iperself: 0 }
        };

        const dispenserPerformance = {
            'Erogatore 1-2': 0,
            'Erogatore 3': 0,
            'Erogatore 4': 0,
            'Erogatore 5': 0,
            'Erogatore 6': 0,
            'Erogatore 7': 0
        };

        Object.keys(erogatoriData).forEach(dispenser => {
            Object.keys(erogatoriData[dispenser]).forEach(product => {
                const data = erogatoriData[dispenser][product];
                if (data && data.liters) {
                    const liters = parseFloat(data.liters) || 0;
                    
                    if (totals.hasOwnProperty(product)) {
                        totals[product] += liters;
                    }

                    if (servitoDispensers.includes(dispenser)) {
                        modalityTotals.servito += liters;
                        if (productModalityTotals[product]) {
                            productModalityTotals[product].servito += liters;
                        }
                    } else if (iperselfDispensers.includes(dispenser)) {
                        modalityTotals.iperself += liters;
                        if (productModalityTotals[product]) {
                            productModalityTotals[product].iperself += liters;
                        }
                    }

                    const dispenserName = `Erogatore ${dispenser}`;
                    if (dispenserPerformance.hasOwnProperty(dispenserName)) {
                        dispenserPerformance[dispenserName] += liters;
                    }
                }
            });
        });

        return {
            productTotals: totals,
            modalityTotals: modalityTotals,
            productModalityTotals: productModalityTotals,
            dispenserPerformance: dispenserPerformance
        };
    },

    loadRegistroData: function() {
        const registroData = Storage.load(Storage.KEYS.REGISTRO_DATA, {});
        
        console.log('Dati registro caricati:', registroData);
        
        const litriSelfInizio = parseLitri(registroData.fondiInizio?.litriSelf || '0');
        const litriSelfFine = parseLitri(registroData.fondiFine?.litriSelf || '0');
        const importoSelfInizio = parseEuro(registroData.fondiInizio?.importoSelf || '0');
        const importoSelfFine = parseEuro(registroData.fondiFine?.importoSelf || '0');

        console.log('Litri Self - Inizio:', litriSelfInizio, 'Fine:', litriSelfFine);
        console.log('Importo Self - Inizio:', importoSelfInizio, 'Fine:', importoSelfFine);

        const litriSelfErogati = litriSelfFine > litriSelfInizio ? 
            (litriSelfFine - litriSelfInizio) : 
            Math.abs(litriSelfFine - litriSelfInizio);
            
        const importoSelfTotale = importoSelfFine > importoSelfInizio ?
            (importoSelfFine - importoSelfInizio) :
            Math.abs(importoSelfFine - importoSelfInizio);

        console.log('Litri Self erogati calcolati:', litriSelfErogati);
        console.log('Importo Self totale calcolato:', importoSelfTotale);

        return {
            litriSelf: litriSelfErogati,
            importoSelf: importoSelfTotale
        };
    },

    calculateRealRevenue: function(erogatoriStats, registroStats, prezzi) {
        let fatturato = 0;
        
        console.log('=== CALCOLO FATTURATO REALE CON PREZZI SERVITO/IPERSELF ===');
        
        // Calcola fatturato per ogni prodotto usando SOLO prezzi Servito e Iperself
        Object.keys(erogatoriStats.productModalityTotals).forEach(product => {
            const litriServito = erogatoriStats.productModalityTotals[product].servito;
            const litriIperself = erogatoriStats.productModalityTotals[product].iperself;
            const prezzoServito = prezzi[product]?.servito || 0;
            const prezzoIperself = prezzi[product]?.iperself || 0;
            
            const fatturatoProdottoServito = litriServito * prezzoServito;
            const fatturatoProdottoIperself = litriIperself * prezzoIperself;
            const fatturatoProdottoTotale = fatturatoProdottoServito + fatturatoProdottoIperself;
            
            fatturato += fatturatoProdottoTotale;
            
            if (litriServito > 0 || litriIperself > 0) {
                console.log(`${product.toUpperCase()}:`);
                if (litriServito > 0) {
                    console.log(`  Servito: ${litriServito.toFixed(0)}L × €${prezzoServito.toFixed(3)} = €${fatturatoProdottoServito.toFixed(2)}`);
                }
                if (litriIperself > 0) {
                    console.log(`  Iperself: ${litriIperself.toFixed(0)}L × €${prezzoIperself.toFixed(3)} = €${fatturatoProdottoIperself.toFixed(2)}`);
                }
                console.log(`  Totale prodotto: €${fatturatoProdottoTotale.toFixed(2)}`);
            }
        });
        
        // Aggiungi fatturato da litri Self (tutti considerati Iperself)
        const prezziIperselfCarburanti = [
            prezzi.benzina?.iperself || 0,
            prezzi.gasolio?.iperself || 0,
            prezzi.diesel?.iperself || 0,
            prezzi.hvolution?.iperself || 0
        ].filter(p => p > 0);
        
        const prezzoMedioIperself = prezziIperselfCarburanti.length > 0 ? 
            prezziIperselfCarburanti.reduce((sum, p) => sum + p, 0) / prezziIperselfCarburanti.length : 1.65;
        
        const fatturatoDaLitriSelf = registroStats.litriSelf * prezzoMedioIperself;
        fatturato += fatturatoDaLitriSelf;
        
        if (registroStats.litriSelf > 0) {
            console.log(`LITRI SELF (modalità Iperself):`);
            console.log(`  ${registroStats.litriSelf.toFixed(0)}L × €${prezzoMedioIperself.toFixed(3)} (prezzo medio Iperself) = €${fatturatoDaLitriSelf.toFixed(2)}`);
        }
        
        // Aggiungi importo Self diretto dal registro (se presente)
        if (registroStats.importoSelf > 0) {
            fatturato += registroStats.importoSelf;
            console.log(`IMPORTO SELF DIRETTO: €${registroStats.importoSelf.toFixed(2)}`);
        }
        
        console.log(`FATTURATO TOTALE CALCOLATO: €${fatturato.toFixed(2)}`);
        console.log('=== FINE CALCOLO FATTURATO ===');
        
        return fatturato;
    },

    calculateStats: function() {
        const erogatoriStats = this.loadErogatoriData();
        const registroStats = this.loadRegistroData();
        const prezzi = this.loadPrezziData();

        erogatoriStats.modalityTotals.iperself += registroStats.litriSelf;

        const totalLiters = Object.values(erogatoriStats.productTotals).reduce((sum, val) => sum + val, 0) + registroStats.litriSelf;
        const totalServito = erogatoriStats.modalityTotals.servito;
        const totalIperself = erogatoriStats.modalityTotals.iperself;
        
        console.log('Totali calcolati:');
        console.log('- Totale litri:', totalLiters);
        console.log('- Servito:', totalServito);
        console.log('- Iperself (con Self):', totalIperself);
        console.log('- Litri Self aggiunti:', registroStats.litriSelf);
        console.log('- Importo Self:', registroStats.importoSelf);
        
        const servitoPerc = totalLiters > 0 ? Math.round((totalServito / totalLiters) * 100) : 0;
        const iperselfPerc = 100 - servitoPerc;

        const productEntries = Object.entries(erogatoriStats.productTotals);
        const topProduct = productEntries.reduce((max, current) => 
            current[1] > max[1] ? current : max, ['nessuno', 0]
        );

        const realRevenue = this.calculateRealRevenue(erogatoriStats, registroStats, prezzi);

        const statsData = {
            totalLiters: totalLiters,
            realRevenue: realRevenue,
            topProduct: topProduct[0],
            servitoPerc: servitoPerc,
            iperselfPerc: iperselfPerc,
            productTotals: erogatoriStats.productTotals,
            modalityTotals: {
                servito: totalServito,
                iperself: totalIperself
            },
            dispenserPerformance: erogatoriStats.dispenserPerformance,
            timestamp: new Date().toISOString(),
            period: this.currentPeriod
        };

        // Salva stats nel storage unificato
        this.venditeData.analytics = statsData;
        this.saveVenditeData();

        return statsData;
    },

    updateDisplayedStats: function() {
        try {
            const stats = this.calculateStats();

            const totalSalesEl = document.getElementById('totalSales');
            const totalLitersEl = document.getElementById('totalLiters');
            const avgPriceEl = document.getElementById('avgPrice');
            const servitoPercEl = document.getElementById('servitoPerc');

            if (totalSalesEl) totalSalesEl.textContent = formatEuro(stats.realRevenue);
            if (totalLitersEl) totalLitersEl.textContent = `${formatNumber(stats.totalLiters.toFixed(0))} L`;
            if (avgPriceEl) avgPriceEl.textContent = stats.topProduct.charAt(0).toUpperCase() + stats.topProduct.slice(1);
            if (servitoPercEl) servitoPercEl.textContent = `${stats.servitoPerc}%`;

            return stats;
        } catch (error) {
            console.error('Errore nell\'aggiornamento statistiche:', error);
            showMessage('Errore nel calcolo delle statistiche', 'error');
            return null;
        }
    },

    destroyChart: function(chartId) {
        if (this.chartInstances[chartId]) {
            this.chartInstances[chartId].destroy();
            delete this.chartInstances[chartId];
        }
    },

    initializeCharts: function() {
        const stats = this.updateDisplayedStats();
        if (!stats) return;

        this.destroyChart('productChart');
        this.destroyChart('islandChart');
        this.destroyChart('modalityChart');

        const productCtx = document.getElementById('productChart');
        if (productCtx) {
            const productData = [
                stats.productTotals.gasolio || 0,
                stats.productTotals.benzina || 0,
                stats.productTotals.diesel || 0,
                stats.productTotals.hvolution || 0,
                stats.productTotals.adblue || 0
            ];

            this.chartInstances.productChart = new Chart(productCtx, {
                type: 'doughnut',
                data: {
                    labels: ['Gasolio', 'Benzina', 'Diesel+', 'HVOlution', 'AdBlue'],
                    datasets: [{
                        data: productData,
                        backgroundColor: [
                            'rgba(255, 159, 64, 0.8)',
                            'rgba(117, 195, 117, 0.8)',
                            'rgba(254, 93, 38, 0.8)',
                            'rgba(0, 123, 255, 0.8)',
                            'rgba(107, 182, 255, 0.8)'
                        ],
                        borderColor: [
                            'rgba(255, 159, 64, 1)',
                            'rgba(117, 195, 117, 1)',
                            'rgba(254, 93, 38, 1)',
                            'rgba(0, 123, 255, 1)',
                            'rgba(107, 182, 255, 1)'
                        ],
                        borderWidth: 3,
                        hoverOffset: 10
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: {
                                padding: 20,
                                font: {
                                    family: 'Montserrat',
                                    size: 14,
                                    weight: 600
                                },
                                usePointStyle: true,
                                pointStyle: 'circle',
                                boxWidth: 12,
                                boxHeight: 12
                            }
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    return context.label + ': ' + formatNumber(context.parsed) + ' L';
                                }
                            }
                        }
                    },
                    animation: {
                        animateRotate: true,
                        duration: 2000
                    }
                }
            });
        }

        const islandCtx = document.getElementById('islandChart');
        if (islandCtx) {
            const dispenserData = Object.values(stats.dispenserPerformance);
            const dispenserLabels = Object.keys(stats.dispenserPerformance);

            this.chartInstances.islandChart = new Chart(islandCtx, {
                type: 'bar',
                data: {
                    labels: dispenserLabels,
                    datasets: [{
                        label: 'Litri erogati',
                        data: dispenserData,
                        backgroundColor: 'rgba(0, 86, 179, 0.8)',
                        borderColor: 'rgba(0, 86, 179, 1)',
                        borderWidth: 2,
                        borderRadius: 8,
                        borderSkipped: false,
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    return formatNumber(context.parsed.y) + ' L';
                                }
                            }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                font: {
                                    family: 'Montserrat'
                                },
                                callback: function(value) {
                                    return formatNumber(value) + ' L';
                                }
                            }
                        },
                        x: {
                            ticks: {
                                font: {
                                    family: 'Montserrat',
                                    weight: 600
                                }
                            }
                        }
                    },
                    animation: {
                        duration: 2000,
                        easing: 'easeOutQuart'
                    }
                }
            });
        }

        const modalityCtx = document.getElementById('modalityChart');
        if (modalityCtx) {
            this.chartInstances.modalityChart = new Chart(modalityCtx, {
                type: 'pie',
                data: {
                    labels: ['Servito', 'Iperself'],
                    datasets: [{
                        data: [stats.modalityTotals.servito, stats.modalityTotals.iperself],
                        backgroundColor: [
                            'rgba(0, 123, 255, 0.8)',
                            'rgba(254, 93, 38, 0.8)'
                        ],
                        borderColor: [
                            'rgba(0, 123, 255, 1)',
                            'rgba(254, 93, 38, 1)'
                        ],
                        borderWidth: 3,
                        hoverOffset: 8
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: {
                                padding: 20,
                                font: {
                                    family: 'Montserrat',
                                    size: 14,
                                    weight: 600
                                }
                            }
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    const percentage = ((context.parsed / (stats.modalityTotals.servito + stats.modalityTotals.iperself)) * 100).toFixed(1);
                                    return context.label + ': ' + formatNumber(context.parsed) + ' L (' + percentage + '%)';
                                }
                            }
                        }
                    },
                    animation: {
                        animateRotate: true,
                        duration: 2000
                    }
                }
            });
        }
    },

    refreshData: function() {
        if (this.updatePeriod()) {
            this.initializeCharts();
            showMessage(`Dati aggiornati per periodo ${this.currentPeriod.startDate} - ${this.currentPeriod.endDate}`, 'success');
        }
    },

    // Metodo per sincronizzare con il backup completo
    syncWithSystemData: function(systemData) {
        if (systemData && systemData.vendite) {
            this.venditeData = systemData.vendite;
            this.saveVenditeData();
            this.refreshData();
            return true;
        }
        return false;
    },

    // Cancella tutti i dati delle vendite
    clearAllData: function() {
        if (confirm('Cancellare tutti i dati delle vendite? Questa azione non può essere annullata.')) {
            this.venditeData = {
                periods: {},
                settings: {},
                analytics: {}
            };
            
            this.saveVenditeData();
            this.refreshData();
            
            showMessage('Tutti i dati delle vendite sono stati cancellati', 'info');
        }
    },

    // Ottieni statistiche delle vendite
    getStatistics: function() {
        const stats = this.venditeData.analytics || {};
        return {
            totalRevenue: stats.realRevenue || 0,
            totalLiters: stats.totalLiters || 0,
            topProduct: stats.topProduct || 'nessuno',
            servitoPercentage: stats.servitoPerc || 0,
            iperselfPercentage: stats.iperselfPerc || 0,
            lastUpdate: stats.timestamp || null
        };
    }
};
/* ===== FINE GESTIONE VENDITE UNIFICATA ===== */

/* ===== FUNZIONI IMPORT/EXPORT INTEGRATE ===== */
function importaDatiCompleti() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const importedData = JSON.parse(e.target.result);
                
                if (confirm('Importare TUTTI i dati? Questo sovrascriverà i dati attuali di tutte le sezioni.')) {
                    let importSuccess = false;
                    
                    // Importa dati Vendite
                    if (importedData.vendite) {
                        if (VenditeManager.syncWithSystemData(importedData)) {
                            importSuccess = true;
                        }
                    }
                    
                    // Importa altri dati del sistema
                    if (importedData.erogatori) {
                        Storage.save(Storage.KEYS.DISPENSERS, importedData.erogatori);
                        importSuccess = true;
                    }
                    
                    if (importedData.monetario) {
                        Storage.save(Storage.KEYS.MONETARIO_DATA, importedData.monetario);
                        importSuccess = true;
                    }
                    
                    if (importedData.registro) {
                        Storage.save(Storage.KEYS.REGISTRO_DATA, importedData.registro);
                        importSuccess = true;
                    }
                    
                    if (importedData.carico) {
                        if (importedData.carico.totals) {
                            Storage.save(Storage.KEYS.CARICO_TOTALS, importedData.carico.totals);
                            importSuccess = true;
                        }
                        if (importedData.carico.history) {
                            Storage.save(Storage.KEYS.CARICO_HISTORY, importedData.carico.history);
                            importSuccess = true;
                        }
                    }
                    
                    if (importedData.credito) {
                        Storage.save(Storage.KEYS.CREDITO_DATA, importedData.credito);
                        importSuccess = true;
                    }
                    
                    if (importSuccess) {
                        showMessage('Dati importati con successo!', 'success');
                        VenditeManager.refreshData();
                    } else {
                        showMessage('Nessun dato valido trovato nel file', 'warning');
                    }
                }
            } catch (error) {
                showMessage('Errore: file non valido', 'error');
                console.error('Errore import:', error);
            }
        };
        reader.readAsText(file);
    });
    
    input.click();
}

function esportaDatiCompleti() {
    try {
        const dataToExport = {
            timestamp: new Date().toISOString(),
            version: '1.0',
            
            // Dati Vendite
            vendite: Storage.load(Storage.KEYS.VENDITE_DATA, {}),
            
            // Dati Erogatori
            erogatori: Storage.load(Storage.KEYS.DISPENSERS, {}),
            
            // Dati Monetario
            monetario: Storage.load(Storage.KEYS.MONETARIO_DATA, {}),
            
            // Dati Registro
            registro: Storage.load(Storage.KEYS.REGISTRO_DATA, {}),
            
            // Dati Carico
            carico: {
                totals: Storage.load(Storage.KEYS.CARICO_TOTALS, {}),
                history: Storage.load(Storage.KEYS.CARICO_HISTORY, [])
            },
            
            // Altri dati delle pagine
            credito: Storage.load(Storage.KEYS.CREDITO_DATA, {})
        };

        const dataStr = JSON.stringify(dataToExport, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `cerbero_backup_completo_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        showMessage('Backup completo esportato con successo!', 'success');
    } catch (error) {
        showMessage('Errore durante l\'esportazione completa', 'error');
        console.error('Errore export:', error);
    }
}

function stampaDati() {
    showMessage('Funzione stampa in fase di sviluppo', 'info');
}

/* ===== INIZIO FUNZIONI GLOBALI ===== */
function showInfo() {
    const infoMessage = `
DASHBOARD VENDITE - CERBERO v1.0

Funzionalità:
• Analisi vendite da dati erogatori
• Integrazione litri self da registro  
• Grafici interattivi con dati reali
• Performance per prodotto e erogatore
• Confronto Servito vs Iperself
• Storage unificato con sistema CERBERO

Dati utilizzati:
• Erogatori 1-7: Letture contatori
• Registro: Litri Self → Iperself
• Monetario: Prezzi reali Servito/Iperself
• Calcoli automatici e percentuali

Grafici disponibili:
• Vendite per Prodotto (Doughnut)
• Performance Erogatori (Bar)
• Modalità di Servizio (Pie)

Storage unificato:
• Compatibile con tutte le pagine CERBERO
• Backup automatico e sincronizzazione
• Persistenza dati tra sessioni

I dati vengono aggiornati automaticamente dai moduli integrati.
    `;
    alert(infoMessage);
}

function formatDateInput(input) {
    let value = input.value.replace(/\D/g, '');
    if (value.length >= 2) {
        value = value.substring(0, 2) + '/' + value.substring(2);
    }
    if (value.length >= 5) {
        value = value.substring(0, 5) + '/' + value.substring(5, 9);
    }
    input.value = value;
}
/* ===== FINE FUNZIONI GLOBALI ===== */

/* ===== INIZIO EVENT LISTENERS ===== */
document.addEventListener('DOMContentLoaded', function() {
    try {
        // Carica dati vendite dal storage
        VenditeManager.loadVenditeData();
        
        // Inizializza periodo corrente
        VenditeManager.initializePeriod();
        
        // Inizializza dashboard
        VenditeManager.initializeCharts();

        // Pulsante aggiorna
        const refreshBtn = document.getElementById('refreshBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', function() {
                this.style.transform = 'scale(0.95)';
                this.innerHTML = 'CARICAMENTO...';
                
                setTimeout(() => {
                    VenditeManager.refreshData();
                    this.style.transform = '';
                    this.innerHTML = 'AGGIORNA';
                }, 1000);
            });
        }

        // Pulsante pulisci
        const clearBtn = document.getElementById('clearBtn');
        if (clearBtn) {
            clearBtn.addEventListener('click', function() {
                this.style.transform = 'scale(0.95)';
                
                setTimeout(() => {
                    VenditeManager.clearPeriod();
                    this.style.transform = '';
                }, 150);
            });
        }

        // Formattazione date
        const startDateInput = document.getElementById('startDate');
        const endDateInput = document.getElementById('endDate');
        
        if (startDateInput) {
            startDateInput.addEventListener('input', function() {
                formatDateInput(this);
            });
            
            startDateInput.addEventListener('blur', function() {
                VenditeManager.updatePeriod();
            });
        }
        
        if (endDateInput) {
            endDateInput.addEventListener('input', function() {
                formatDateInput(this);
            });
            
            endDateInput.addEventListener('blur', function() {
                VenditeManager.updatePeriod();
            });
        }

        // Navigazione
        const navLinks = document.querySelectorAll('.nav a');
        navLinks.forEach(link => {
            link.addEventListener('click', function(e) {
                if (!this.href.includes('index.html') && !this.href.includes('.html')) {
                    e.preventDefault();
                }
                
                navLinks.forEach(l => l.classList.remove('active'));
                this.classList.add('active');
                
                this.style.transform = 'scale(0.95)';
                setTimeout(() => {
                    this.style.transform = '';
                }, 150);
            });
        });

        console.log('✅ CERBERO Vendite inizializzato correttamente');
        showMessage('Dashboard Vendite caricata', 'success');
    } catch (error) {
        console.error('❌ Errore nell\'inizializzazione vendite:', error);
        showMessage('Errore nell\'inizializzazione del sistema', 'error');
    }
});
/* ===== FINE EVENT LISTENERS ===== */

/* ===== INIZIO GESTIONE ERRORI ===== */
window.addEventListener('error', function(e) {
    console.error('Errore JavaScript:', e.error);
    showMessage('Si è verificato un errore. Controlla la console.', 'error');
});
/* ===== FINE GESTIONE ERRORI ===== */

/* ===== SALVATAGGIO AUTOMATICO PRIMA DI USCIRE ===== */
window.addEventListener('beforeunload', function(e) {
    if (VenditeManager) {
        VenditeManager.saveVenditeData();
    }
});

/* ===== FUNZIONI ESPOSTE GLOBALMENTE ===== */
window.exportVenditeData = function() {
    try {
        const exportData = {
            timestamp: new Date().toISOString(),
            version: '1.0',
            vendite: VenditeManager.venditeData
        };

        const dataStr = JSON.stringify(exportData, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `cerbero_vendite_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        showMessage('Dati vendite esportati con successo!', 'success');
    } catch (error) {
        showMessage('Errore durante l\'esportazione', 'error');
    }
};

window.clearVenditeData = function() {
    if (VenditeManager) {
        VenditeManager.clearAllData();
    }
};

window.getVenditeSummary = function() {
    if (VenditeManager) {
        return VenditeManager.getStatistics();
    }
    return { totalRevenue: 0, totalLiters: 0, topProduct: 'nessuno', servitoPercentage: 0, iperselfPercentage: 0 };
};

/* ===== FINE JAVASCRIPT - VENDITE UNIFICATO ===== */