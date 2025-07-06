/* ===== CERBERO VENDITE ===== */

/* ===== GESTIONE TEMA ===== */
function applyTheme(theme) {
    const lightIcon = document.getElementById('theme-icon-light');
    const darkIcon = document.getElementById('theme-icon-dark');
    document.body.classList.toggle('dark-theme', theme === 'dark');
    if (lightIcon && darkIcon) {
        lightIcon.classList.toggle('theme-icon-hidden', theme === 'dark');
        darkIcon.classList.toggle('theme-icon-hidden', theme !== 'dark');
    }
    Storage.save(Storage.KEYS.THEME, theme);
}

function initializeThemeSwitcher() {
    const themeSwitcher = document.getElementById('theme-switcher');
    if (themeSwitcher) {
        themeSwitcher.addEventListener('click', (e) => {
            e.preventDefault();
            const newTheme = document.body.classList.contains('dark-theme') ? 'light' : 'dark';
            applyTheme(newTheme);
        });
    }
    const savedTheme = Storage.load(Storage.KEYS.THEME, 'light');
    applyTheme(savedTheme);
}

/* ===== NUOVA FUNZIONE PER MODALE INFO ===== */
function initializeInfoButton() {
    try {
        const infoBtn = document.getElementById('info-btn');
        const infoModal = document.getElementById('info-modal');
        const modalCloseBtn = infoModal ? infoModal.querySelector('.modal-close-btn') : null;
        
        if (infoBtn && infoModal) {
            infoBtn.addEventListener('click', (e) => {
                e.preventDefault();
                infoModal.classList.add('active');
            });
            
            if (modalCloseBtn) {
                modalCloseBtn.addEventListener('click', () => {
                    infoModal.classList.remove('active');
                });
            }
            
            infoModal.addEventListener('click', (e) => {
                if (e.target === infoModal) {
                    infoModal.classList.remove('active');
                }
            });
        }
    } catch (error) {
        console.error('Errore inizializzazione pulsante info:', error);
    }
}

/* ===== UTILITY ===== */
function showMessage(message, type = 'info') {
    try {
        // Filtro: mostra solo errori, warning e info - NASCONDE success
        const allowedTypes = ['error', 'warning', 'info'];
        if (!allowedTypes.includes(type)) {
            return;
        }
        
        const toast = document.createElement('div');
        toast.className = `toast-message toast-${type}`;
        toast.textContent = message;
        
        const colors = {
            error: '#FF3547',
            info: '#0ABAB5', 
            warning: '#FFD700'
        };
        
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${colors[type] || colors.info};
            color: ${type === 'warning' ? '#333' : 'white'};
            padding: 15px 20px;
            z-index: 1001;
            font-family: 'Montserrat', sans-serif;
            font-weight: 600;
            font-size: 14px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.2);
            border-radius: 20px;
            max-width: 350px;
            word-wrap: break-word;
            animation: slideIn 0.3s ease-out;
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease forwards';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, 3000);
    } catch (error) {
        console.error('Errore visualizzazione messaggio:', error);
        alert(message);
    }
}

const formatNumber = (num) => new Intl.NumberFormat('it-IT').format(num);
const formatEuro = (num) => new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(num);
const parseStringToDate = (dateStr) => {
    if (!dateStr || !/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) return null;
    const parts = dateStr.split('/');
    const date = new Date(parts[2], parts[1] - 1, parts[0]);
    return isNaN(date.getTime()) ? null : date;
};

/**
 * Formatta correttamente i nomi dei prodotti per la visualizzazione
 */
function formatProductName(product) {
    const productNames = {
        'gasolio': 'Gasolio',
        'diesel': 'Diesel+',
        'adblue': 'AdBlue',
        'benzina': 'Benzina',
        'hvolution': 'HVolution'
    };
    return productNames[product] || product.charAt(0).toUpperCase() + product.slice(1);
}

/* ===== GESTIONE VENDITE ===== */
const VenditeManager = {
    chartInstances: {},
    
    init: function() {
        this.loadAndRender();
        this.bindEvents();
    },

    bindEvents: function() {
        document.getElementById('refreshBtn').addEventListener('click', () => this.loadAndRender());
    },

    loadAndRender: function() {
        const startDateStr = document.getElementById('startDate').value;
        const endDateStr = document.getElementById('endDate').value;
        let data;

        if (startDateStr || endDateStr) {
            const history = Storage.load(Storage.KEYS.VENDITE_HISTORY, []);
            data = this.processHistoryData(history, startDateStr, endDateStr);
            showMessage('Visualizzazione dati storici', 'info');
        } else {
            data = this.processLiveData();
            if (!data || data.totalLiters === 0) {
                showMessage('Nessun dato disponibile da Virtualstation.', 'warning');
            }
        }
        
        this.updateStats(data);
        this.renderCharts(data);
    },

    distributeToErogatori: function(islandTotals, { servitoLiters, iperselfLiters, selfServiceLiters }) {
        const erogatoriServito = [1, 2, 3, 5];
        const erogatoriIperself = [4, 6];
        const erogatoriSelfService = [7];

        if (servitoLiters > 0) {
            const litriPerErogatore = servitoLiters / erogatoriServito.length;
            erogatoriServito.forEach(i => {
                islandTotals[`Erogatore ${i}`] += litriPerErogatore;
            });
        }
        
        if (iperselfLiters > 0) {
            const litriPerErogatore = iperselfLiters / erogatoriIperself.length;
            erogatoriIperself.forEach(i => {
                islandTotals[`Erogatore ${i}`] += litriPerErogatore;
            });
        }

        if (selfServiceLiters > 0) {
            const litriPerErogatore = selfServiceLiters / erogatoriSelfService.length;
            erogatoriSelfService.forEach(i => {
                islandTotals[`Erogatore ${i}`] += litriPerErogatore;
            });
        }
    },

    parseNumber: function(value) {
        if (!value) return 0;
        const str = value.toString().replace(/[.,]/g, match => match === ',' ? '.' : '');
        const num = parseFloat(str);
        return isNaN(num) ? 0 : num;
    },

    parseEuro: function(value) {
        if (!value) return 0;
        const str = value.toString()
            .replace(/€|\s/g, '')
            .replace(/\./g, '')
            .replace(',', '.');
        const num = parseFloat(str);
        return isNaN(num) ? 0 : num;
    },

    processLiveData: function() {
        const virtualstationData = Storage.load(Storage.KEYS.VIRTUALSTATION_DATA, {});
        
        let totalLiters = 0;
        let totalSales = 0;
        const productTotals = { benzina: 0, gasolio: 0, diesel: 0, hvolution: 0, adblue: 0 };
        const modalityTotals = { servito: 0, iperself: 0, selfservice: 0 }; 
        const revenueByProductAndModality = {};
        const islandTotals = {}; 

        for (let i = 1; i <= 7; i++) {
            islandTotals[`Erogatore ${i}`] = 0;
        }

        Object.keys(productTotals).forEach(product => {
            revenueByProductAndModality[product] = {
                servito: 0,
                iperself: 0,
                selfservice: 0 
            };
        });

        for (const turnKey in virtualstationData) {
            if (turnKey.startsWith('turn-')) {
                const turnData = virtualstationData[turnKey];

                totalLiters += turnData.totalTurnLiters || 0;
                totalSales += turnData.totalTurnAmount || 0;

                for (const product of Object.keys(productTotals)) {
                    const productInfo = turnData[product] || {};

                    productTotals[product] += productInfo.totalLiters || 0;

                    modalityTotals.servito += productInfo.servito || 0;
                    modalityTotals.iperself += productInfo.iperself || 0;
                    modalityTotals.selfservice += productInfo['self-service'] || 0;

                    revenueByProductAndModality[product].servito += productInfo.servitoAmount || 0;
                    revenueByProductAndModality[product].iperself += productInfo.iperselfAmount || 0;
                    revenueByProductAndModality[product].selfservice += productInfo.selfServiceAmount || 0;

                    this.distributeToErogatori(islandTotals, {
                        servitoLiters: productInfo.servito || 0,
                        iperselfLiters: productInfo.iperself || 0,
                        selfServiceLiters: productInfo['self-service'] || 0
                    });
                }
            }
        }
        
        const topProduct = Object.keys(productTotals).reduce((a, b) => productTotals[a] > productTotals[b] ? a : b, 'N/D');
        
        return { 
            totalSales, 
            totalLiters, 
            productTotals, 
            modalityTotals, 
            islandTotals, 
            revenueByProductAndModality, 
            topProduct 
        };
    },

    processHistoryData: function(history, startDateStr, endDateStr) {
        let startDate = parseStringToDate(startDateStr);
        let endDate = parseStringToDate(endDateStr);

        if (startDate && !endDate) endDate = startDate;
        if (!startDate && endDate) startDate = endDate;
        
        if (!startDate || !endDate) return this.processLiveData();

        endDate.setHours(23, 59, 59, 999);

        const filteredHistory = history.filter(item => {
            const itemDate = new Date(item.date);
            return itemDate >= startDate && itemDate <= endDate;
        });

        const aggregatedData = {
            totalSales: 0,
            totalLiters: 0,
            productTotals: { benzina: 0, gasolio: 0, diesel: 0, hvolution: 0, adblue: 0 },
            modalityTotals: { servito: 0, iperself: 0, selfservice: 0 },
            revenueByProductAndModality: {}, 
            islandTotals: {}
        };
        
        Object.keys(aggregatedData.productTotals).forEach(product => {
            aggregatedData.revenueByProductAndModality[product] = {
                servito: 0,
                iperself: 0,
                selfservice: 0
            };
        });

        filteredHistory.forEach(record => {
            aggregatedData.totalSales += record.totalSales || 0;
            aggregatedData.totalLiters += record.totalLiters || 0;
            for (const product in record.productTotals) {
                if (aggregatedData.productTotals.hasOwnProperty(product)) {
                    aggregatedData.productTotals[product] += record.productTotals[product] || 0;
                }
            }
            aggregatedData.modalityTotals.servito += record.modalityTotals.servito || 0;
            aggregatedData.modalityTotals.iperself += record.modalityTotals.iperself || 0;
            aggregatedData.modalityTotals.selfservice += record.modalityTotals.selfservice || 0;

            for (const product in record.revenueByProductAndModality) {
                if (aggregatedData.revenueByProductAndModality.hasOwnProperty(product)) {
                    for (const modality in record.revenueByProductAndModality[product]) {
                        if (aggregatedData.revenueByProductAndModality[product].hasOwnProperty(modality)) {
                            aggregatedData.revenueByProductAndModality[product][modality] += record.revenueByProductAndModality[product][modality] || 0;
                        }
                    }
                }
            }

            for (const dispenser in record.dispenserPerformance) {
                if (!aggregatedData.islandTotals[dispenser]) {
                    aggregatedData.islandTotals[dispenser] = 0;
                }
                aggregatedData.islandTotals[dispenser] += record.dispenserPerformance[dispenser] || 0;
            }
        });
        
        const topProduct = Object.keys(aggregatedData.productTotals).reduce((a, b) => aggregatedData.productTotals[a] > aggregatedData.productTotals[b] ? a : b, 'N/D');
        aggregatedData.topProduct = topProduct;
        
        return aggregatedData;
    },

    updateStats: function(data) {
        document.getElementById('totalSales').textContent = formatEuro(data.totalSales);
        document.getElementById('totalLiters').textContent = `${formatNumber(Math.round(data.totalLiters))} L`;
        document.getElementById('avgPrice').textContent = data.topProduct !== 'N/D' ? formatProductName(data.topProduct) : 'N/D';
        
        const totalModalityLiters = data.modalityTotals.servito + data.modalityTotals.iperself + data.modalityTotals.selfservice;
        const servitoPerc = totalModalityLiters > 0 ? ((data.modalityTotals.servito / totalModalityLiters) * 100).toFixed(0) : 0;
        document.getElementById('servitoPerc').textContent = `${servitoPerc}%`;
    },

    renderCharts: function(data) {
        console.log('Dati modalità:', data.modalityTotals);
        console.log('Composizione fatturato:', data.revenueByProductAndModality);
        console.log('Ordine prodotti:', Object.keys(data.productTotals));
        
        this.renderChart('productChart', 'bar', {
            labels: Object.keys(data.productTotals).map(product => 
                formatProductName(product)
            ),
            datasets: [{
                label: 'Litri per Prodotto',
                data: Object.values(data.productTotals),
                backgroundColor: this.getProductColors(Object.keys(data.productTotals)),
                borderRadius: 8,
                borderWidth: 0
            }]
        }, {
            plugins: {
                legend: { 
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const value = context.parsed.y || 0;
                            return `${context.label}: ${formatNumber(Math.round(value))} L`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return formatNumber(Math.round(value)) + ' L';
                        }
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)'
                    }
                },
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        maxRotation: 45,
                        minRotation: 0
                    }
                }
            }
        });
        
        this.renderRevenueCompositionChart(data);

        this.renderChart('modalityChart', 'pie', {
            labels: ['Servito', 'Iperself', 'Self-Service'], 
            datasets: [{
                data: [
                    data.modalityTotals.servito || 0, 
                    data.modalityTotals.iperself || 0, 
                    data.modalityTotals.selfservice || 0 
                ],
                backgroundColor: ['#2196F3', '#FF4444', '#00BCD4'],
                borderWidth: 3,
                borderColor: document.body.classList.contains('dark-theme') ? '#1e293b' : '#ffffff'
            }]
        }, {
            plugins: {
                legend: { 
                    display: true,
                    position: 'bottom',
                    labels: {
                        usePointStyle: true,
                        pointStyle: 'circle',
                        padding: 20,
                        font: {
                            size: 12,
                            weight: 'bold'
                        },
                        color: document.body.classList.contains('dark-theme') ? '#e2e8f0' : '#334155'
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.parsed || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0';
                            return `${label}: ${formatNumber(Math.round(value))} L (${percentage}%)`;
                        }
                    }
                },
                datalabels: {
                    display: true,
                    color: '#ffffff',
                    font: {
                        size: 14,
                        weight: 'bold'
                    },
                    formatter: function(value, context) {
                        const total = context.dataset.data.reduce((a, b) => a + b, 0);
                        const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0';
                        return parseFloat(percentage) > 5 ? `${percentage}%` : ''; // Mostra solo se > 5%
                    },
                    textAlign: 'center'
                }
            },
            layout: {
                padding: {
                    top: 20
                }
            }
        });
    },
    
    renderRevenueCompositionChart: function(data) {
        if (!data.revenueByProductAndModality) return;
        
        const products = Object.keys(data.revenueByProductAndModality);
        const servitoData = [];
        const iperselfData = [];
        const selfserviceData = [];
        
        products.forEach(product => {
            const revenue = data.revenueByProductAndModality[product];
            servitoData.push(revenue.servito || 0);
            iperselfData.push(revenue.iperself || 0);
            selfserviceData.push(revenue.selfservice || 0);
        });
        
        this.renderChart('islandChart', 'bar', {
            labels: products.map(product => 
                formatProductName(product)
            ),
            datasets: [
                {
                    label: 'Servito',
                    data: servitoData,
                    backgroundColor: '#2196F3',
                    borderRadius: 4
                },
                {
                    label: 'Iperself',
                    data: iperselfData,
                    backgroundColor: '#FF4444',
                    borderRadius: 4
                },
                {
                    label: 'Self-Service',
                    data: selfserviceData,
                    backgroundColor: '#00BCD4',
                    borderRadius: 4
                }
            ]
        }, {
            plugins: {
                legend: { 
                    display: true,
                    position: 'bottom',
                    labels: {
                        usePointStyle: true,
                        pointStyle: 'circle',
                        padding: 15, 
                        font: {
                            size: 12,
                            weight: 'bold'
                        },
                         color: document.body.classList.contains('dark-theme') ? '#e2e8f0' : '#334155'
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const value = context.parsed.y || 0;
                            return `${context.dataset.label}: ${formatEuro(value)}`;
                        }
                    }
                }
            },
            responsive: true,
            scales: {
                x: {
                    stacked: true,
                    grid: {
                        display: false
                    },
                     ticks: {
                        color: document.body.classList.contains('dark-theme') ? '#94a3b8' : '#64748b'
                    }
                },
                y: {
                    stacked: true,
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return formatEuro(value);
                        },
                        color: document.body.classList.contains('dark-theme') ? '#94a3b8' : '#64748b'
                    },
                    grid: {
                        color: document.body.classList.contains('dark-theme') ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
                    }
                }
            }
        });
    },
    
    getProductColors: function(products) {
        const productColorMap = {
            'benzina': '#00C851',
            'gasolio': '#FFD700',
            'diesel': '#FF4444',
            'hvolution': '#2196F3',
            'adblue': '#0ABAB5'
        };
        
        return products.map(product => productColorMap[product] || '#CCCCCC');
    },
    
    renderChart: function(canvasId, type, data, customOptions = {}) {
        if (this.chartInstances[canvasId]) {
            this.chartInstances[canvasId].destroy();
        }
        const ctx = document.getElementById(canvasId);
        if (ctx) {
            const defaultOptions = {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { 
                        display: false
                    }
                }
            };
            
            const options = this.mergeOptions(defaultOptions, customOptions);
            const plugins = canvasId === 'modalityChart' ? [ChartDataLabels] : [];
            
            this.chartInstances[canvasId] = new Chart(ctx, {
                type: type,
                data: data,
                options: options,
                plugins: plugins
            });
        }
    },
    
    mergeOptions: function(target, source) {
        const result = { ...target };
        for (const key in source) {
            if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                result[key] = this.mergeOptions(result[key] || {}, source[key]);
            } else {
                result[key] = source[key];
            }
        }
        return result;
    }
};

/* ===== FUNZIONI STAMPA ===== */
function stampaDati() {
    const startDateStr = document.getElementById('startDate').value;
    const endDateStr = document.getElementById('endDate').value;
    let data;

    if (startDateStr || endDateStr) {
        const history = Storage.load(Storage.KEYS.VENDITE_HISTORY, []);
        data = VenditeManager.processHistoryData(history, startDateStr, endDateStr);
    } else {
        data = VenditeManager.processLiveData();
    }

    let periodText = 'Turno Corrente';
    if (startDateStr && endDateStr) {
        periodText = startDateStr === endDateStr ? `Data: ${startDateStr}` : `Periodo: ${startDateStr} - ${endDateStr}`;
    } else if (startDateStr || endDateStr) {
        periodText = `Data: ${startDateStr || endDateStr}`;
    }

    const chartImages = {
        productChart: VenditeManager.chartInstances['productChart']?.toBase64Image('image/png', 1) || '',
        islandChart: VenditeManager.chartInstances['islandChart']?.toBase64Image('image/png', 1) || '',
        modalityChart: VenditeManager.chartInstances['modalityChart']?.toBase64Image('image/png', 1) || ''
    };

    const printContent = generatePrintContentWithCharts(data, periodText, chartImages);
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.onload = () => { setTimeout(() => { printWindow.print(); printWindow.close(); }, 500); };
    showMessage('Generazione report PDF in corso...', 'info');
}

function generatePrintContentWithCharts(data, periodText, chartImages) {
    const currentDate = new Date().toLocaleString('it-IT');
    const totalModalityLiters = data.modalityTotals.servito + data.modalityTotals.iperself + data.modalityTotals.selfservice;
    const servitoPerc = totalModalityLiters > 0 ? ((data.modalityTotals.servito / totalModalityLiters) * 100).toFixed(1) : '0';

    return `
        <!DOCTYPE html>
        <html>
        <head>
            <title>CERBERO - Report Vendite</title>
            <style>
                body { font-family: Arial, sans-serif; font-size: 11px; line-height: 1.3; color: #333; }
                .print-header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #093fb4; padding-bottom: 10px; }
                .print-title { font-size: 20px; font-weight: bold; color: #093fb4; }
                .print-date, .period-info { font-size: 12px; color: #666; }
                .print-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 20px; }
                .print-stat-item { border: 1px solid #ccc; padding: 10px; text-align: center; border-radius: 8px; }
                .print-stat-value { font-size: 16px; font-weight: bold; color: #093fb4; }
                .print-stat-label { font-size: 10px; text-transform: uppercase; }
                .charts-section { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; page-break-inside: avoid; }
                .chart-container { text-align: center; border: 1px solid #eee; padding: 15px; border-radius: 8px; }
                .chart-title { font-size: 14px; font-weight: bold; margin-bottom: 10px; color: #093fb4; }
                .chart-image { max-width: 100%; height: auto; }
                .full-width-chart { grid-column: 1 / -1; }
                .print-footer { margin-top: 30px; text-align: center; font-size: 10px; color: #999; border-top: 1px solid #ccc; padding-top: 10px; }
            </style>
        </head>
        <body>
            <div class="print-header">
                <div class="print-title">Report Vendite - CERBERO</div>
                <div class="print-date">Generato il: ${currentDate}</div>
            </div>
            <div class="period-info">Periodo di riferimento: <strong>${periodText}</strong></div>
            <div class="print-stats">
                <div class="print-stat-item">
                    <div class="print-stat-value">${formatEuro(data.totalSales)}</div>
                    <div class="print-stat-label">Fatturato Totale</div>
                </div>
                <div class="print-stat-item">
                    <div class="print-stat-value">${formatNumber(Math.round(data.totalLiters))} L</div>
                    <div class="print-stat-label">Litri Erogati</div>
                </div>
                <div class="print-stat-item">
                    <div class="print-stat-value">${data.topProduct !== 'N/D' ? formatProductName(data.topProduct) : 'N/D'}</div>
                    <div class="print-stat-label">Prodotto Top</div>
                </div>
                <div class="print-stat-item">
                    <div class="print-stat-value">${servitoPerc}%</div>
                    <div class="print-stat-label">Servito vs Self</div>
                </div>
            </div>
            <div class="charts-section">
                ${chartImages.productChart ? `<div class="chart-container"><div class="chart-title">Vendite per Prodotto</div><img src="${chartImages.productChart}" class="chart-image"></div>` : ''}
                ${chartImages.modalityChart ? `<div class="chart-container"><div class="chart-title">Modalità di Servizio</div><img src="${chartImages.modalityChart}" class="chart-image"></div>` : ''}
                ${chartImages.islandChart ? `<div class="chart-container full-width-chart"><div class="chart-title">Composizione Fatturato</div><img src="${chartImages.islandChart}" class="chart-image"></div>` : ''}
            </div>
            <div class="print-footer">Report generato dal sistema di gestione CERBERO.</div>
        </body>
        </html>
    `;
}


/* ===== INIZIALIZZAZIONE ===== */
document.addEventListener('DOMContentLoaded', function() {
    try {
        if (typeof Storage === 'undefined' || !Storage.KEYS) {
            showMessage("Errore critico: storage.js non caricato.", "error");
            return;
        }
        
        // MOBILE MENU LOGIC (START)
        const hamburgerBtn = document.getElementById('hamburger-menu-btn');
        const mainNav = document.getElementById('main-nav');
        const mobileOverlay = document.getElementById('mobile-menu-overlay');

        if (hamburgerBtn && mainNav && mobileOverlay) {
            hamburgerBtn.addEventListener('click', () => {
                mainNav.classList.toggle('active');
                mobileOverlay.classList.toggle('active');
                document.body.classList.toggle('no-scroll'); // Optional: prevent scrolling background
            });

            mobileOverlay.addEventListener('click', () => {
                mainNav.classList.remove('active');
                mobileOverlay.classList.remove('active');
                document.body.classList.remove('no-scroll'); // Optional
            });

            // Close menu if a nav link is clicked
            mainNav.querySelectorAll('a').forEach(link => {
                link.addEventListener('click', () => {
                    mainNav.classList.remove('active');
                    mobileOverlay.classList.remove('active');
                    document.body.classList.remove('no-scroll'); // Optional
                });
            });
        }
        // MOBILE MENU LOGIC (END)

        initializeThemeSwitcher();
        initializeInfoButton(); // AGGIUNTA CHIAMATA
        VenditeManager.init();
        
        console.log('Sistema Vendite inizializzato con successo.');
        
    } catch (error) {
        console.error('Errore critico durante l\'inizializzazione di Vendite:', error);
        showMessage('Errore critico nell\'avvio del sistema Vendite', 'error');
    }
});