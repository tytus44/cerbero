/* ===== CERBERO VENDITE ===== */

/* ===== UTILITY E FUNZIONI HELPER (Le funzioni del tema sono rimosse) ===== */
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

function initializeMobileMenu() {
    try {
        const sidebar = document.querySelector('.sidebar');
        
        function handleResize() {
            if (window.innerWidth <= 992) {
                sidebar?.classList.remove('active');
            }
        }
        
        window.addEventListener('resize', handleResize);
        handleResize();
        
        const hamburgerBtn = document.getElementById('hamburger-menu-btn');
        const mobileOverlay = document.getElementById('mobile-menu-overlay');

        if (hamburgerBtn && sidebar && mobileOverlay) {
            hamburgerBtn.addEventListener('click', () => {
                sidebar.classList.toggle('active');
                mobileOverlay.classList.toggle('active');
                document.body.classList.toggle('no-scroll');
            });

            mobileOverlay.addEventListener('click', () => {
                sidebar.classList.remove('active');
                mobileOverlay.classList.remove('active');
                document.body.classList.remove('no-scroll');
            });

            sidebar.querySelectorAll('a').forEach(link => {
                link.addEventListener('click', () => {
                    sidebar.classList.remove('active');
                    mobileOverlay.classList.remove('active');
                    document.body.classList.remove('no-scroll');
                });
            });
        }
    } catch (error) {
        console.error('Errore inizializzazione mobile menu:', error);
    }
}

function showMessage(message, type = 'info') {
    try {
        const allowedTypes = ['error', 'warning', 'info'];
        if (!allowedTypes.includes(type)) {
            return;
        }
        
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        
        const colors = {
            error: '#FF3547',
            info: '#0ABAB5', 
            warning: '#FFD700'
        };
        
        toast.style.cssText = `
            position: fixed; top: 20px; right: 20px;
            background: ${colors[type] || colors.info};
            color: ${type === 'warning' ? '#333' : 'white'};
            padding: 15px 20px; z-index: 1001; 
            font-weight: 600; font-size: 14px; box-shadow: 0 4px 20px rgba(0,0,0,0.2);
            border-radius: 4px; max-width: 350px; word-wrap: break-word;
            animation: slideIn 0.3s ease-out;
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease forwards';
            setTimeout(() => { if (toast.parentNode) toast.parentNode.removeChild(toast); }, 300);
        }, 3000);
    } catch (error) {
        console.error('Errore visualizzazione messaggio:', error);
        alert(message);
    }
}

function showConfirmModal(title, text, onConfirm) {
    const modal = document.getElementById('confirm-modal');
    const modalTitle = document.getElementById('confirm-modal-title');
    const modalText = document.getElementById('confirm-modal-text');
    const btnOk = document.getElementById('confirm-modal-ok');
    const btnCancel = document.getElementById('confirm-modal-cancel');
    const btnClose = modal.querySelector('.modal-close-btn');

    modalTitle.textContent = title;
    modalText.textContent = text;
    const hideModal = () => modal.classList.remove('active');

    const newBtnOk = btnOk.cloneNode(true);
    btnOk.parentNode.replaceChild(newBtnOk, btnOk);
    newBtnOk.addEventListener('click', () => { onConfirm(); hideModal(); }, { once: true });
    
    const newBtnCancel = btnCancel.cloneNode(true);
    btnCancel.parentNode.replaceChild(newBtnCancel, btnCancel);
    newBtnCancel.addEventListener('click', hideModal, { once: true });
    
    if (btnClose) {
        const newBtnClose = btnClose.cloneNode(true);
        btnClose.parentNode.replaceChild(newBtnClose, btnClose);
        newBtnClose.addEventListener('click', hideModal, { once: true });
    }
    
    modal.classList.add('active');
}


const formatNumber = (num) => new Intl.NumberFormat('it-IT').format(num);
const formatEuro = (num) => new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(num);

function formatProductName(product) {
    const productNames = { 'gasolio': 'Gasolio', 'diesel': 'Diesel+', 'adblue': 'AdBlue', 'benzina': 'Benzina', 'hvolution': 'HVolution' };
    return productNames[product] || product.charAt(0).toUpperCase() + product.slice(1);
}

/* ===== GESTIONE VENDITE ===== */
const VenditeManager = {
    chartInstances: {},
    currentData: null,
    currentPeriodText: 'Dati Correnti',
    currentYear: new Date().getFullYear(),

    init: function() {
        this.updateFilterValueOptions();
        this.resetPeriodFilter();
        this.bindEvents();
    },

    bindEvents: function() {
        document.getElementById('refreshBtn')?.addEventListener('click', () => this.resetPeriodFilter());
        document.getElementById('btn-apply-filter')?.addEventListener('click', () => this.applyPeriodFilter());
        document.getElementById('btn-reset-filter')?.addEventListener('click', () => this.resetPeriodFilter());
        document.getElementById('filter-type')?.addEventListener('change', () => this.updateFilterValueOptions());
        document.getElementById('btn-importa')?.addEventListener('click', () => this.importData());
        document.getElementById('btn-esporta')?.addEventListener('click', () => this.exportData());
    },

    importData: function() {
        showConfirmModal(
            'Importa Storico Vendite?',
            'Questa azione sovrascriverà lo storico delle vendite esistente. Continuare?',
            () => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = '.json';
                input.onchange = (event) => {
                    const file = event.target.files[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        try {
                            const importedFile = JSON.parse(e.target.result);
                            const historyData = importedFile.venditeHistory || importedFile.history;
                            if (historyData && Array.isArray(historyData)) {
                                Storage.save(Storage.KEYS.VENDITE_HISTORY, historyData);
                                showMessage('Storico vendite importato! Applica un filtro per visualizzare i dati.', 'success');
                                this.resetPeriodFilter(); 
                            } else {
                                showMessage('File non valido o non contiene uno storico vendite.', 'error');
                            }
                        } catch (err) {
                            showMessage('Errore nella lettura del file.', 'error');
                            console.error("Import error:", err);
                        }
                    };
                    reader.readAsText(file);
                };
                input.click();
            }
        );
    },

    exportData: function() {
        if (!this.currentData) {
            showMessage('Nessun dato da esportare.', 'warning');
            return;
        }

        const dataToExport = {
            exportDate: new Date().toISOString(),
            exportType: 'vendite_snapshot',
            periodo: this.currentPeriodText,
            dati: this.currentData
        };

        const dataStr = JSON.stringify(dataToExport, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        
        const dateString = new Date().toISOString().split('T')[0].replace(/-/g, '');
        link.download = `backup-vendite-${dateString}.json`;
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        showMessage('Dati vendite esportati!', 'info');
    },

    updateFilterValueOptions() {
        const type = document.getElementById('filter-type').value;
        const valueSelect = document.getElementById('filter-value');
        valueSelect.innerHTML = '';
        let options = [];

        if (type === 'mese') {
            options = ["Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno", "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"]
                .map((mese, index) => `<option value="${index}">${mese.toUpperCase()}</option>`);
        } else if (type === 'trimestre') {
            options = [1, 2, 3, 4].map(q => `<option value="${q}">TRIMESTRE ${q}</option>`);
        } else if (type === 'semestre') {
            options = [1, 2].map(s => `<option value="${s}">SEMESTRE ${s}</option>`);
        }
        valueSelect.innerHTML = options.join('');
    },

    applyPeriodFilter: function() {
        const type = document.getElementById('filter-type').value;
        const value = parseInt(document.getElementById('filter-value').value);

        let startDate, endDate;
        const year = this.currentYear;

        if (type === 'mese') {
            startDate = new Date(year, value, 1);
            endDate = new Date(year, value + 1, 0, 23, 59, 59);
        } else if (type === 'trimestre') {
            const startMonth = (value - 1) * 3;
            startDate = new Date(year, startMonth, 1);
            endDate = new Date(year, startMonth + 3, 0, 23, 59, 59);
        } else if (type === 'semestre') {
            const startMonth = (value - 1) * 6;
            startDate = new Date(year, startMonth, 1);
            endDate = new Date(year, startMonth + 6, 0, 23, 59, 59);
        }
        
        const history = Storage.load(Storage.KEYS.VENDITE_HISTORY, []);
        const aggregatedData = this.processHistoryData(history, { startDate, endDate });
        
        this.currentData = aggregatedData;
        this.currentPeriodText = `Periodo: ${document.getElementById('filter-value').options[document.getElementById('filter-value').selectedIndex].text} ${this.currentYear}`;
        
        this.updateStats(this.currentData);
        this.renderCharts(this.currentData);
        showMessage('Dati storici visualizzati per ' + this.currentPeriodText, 'info');
    },

    resetPeriodFilter: function() {
        this.currentData = this.processLiveData();
        this.currentPeriodText = 'Dati Correnti';
        this.updateStats(this.currentData);
        this.renderCharts(this.currentData);
        showMessage('Visualizzazione dati correnti da Virtualstation', 'info');
    },

    distributeToErogatori: function(islandTotals, { servitoLiters, iperselfLiters, selfServiceLiters }) {
        const erogatoriServito = [1, 2, 3, 5];
        const erogatoriIperself = [4, 6];
        const erogatoriSelfService = [7];

        if (servitoLiters > 0) {
            const litriPerErogatore = servitoLiters / erogatoriServito.length;
            erogatoriServito.forEach(i => { islandTotals[`Erogatore ${i}`] += litriPerErogatore; });
        }
        if (iperselfLiters > 0) {
            const litriPerErogatore = iperselfLiters / erogatoriIperself.length;
            erogatoriIperself.forEach(i => { islandTotals[`Erogatore ${i}`] += litriPerErogatore; });
        }
        if (selfServiceLiters > 0) {
            const litriPerErogatore = selfServiceLiters / erogatoriSelfService.length;
            erogatoriSelfService.forEach(i => { islandTotals[`Erogatore ${i}`] += litriPerErogatore; });
        }
    },

    processLiveData: function() {
        const virtualstationData = Storage.load(Storage.KEYS.VIRTUALSTATION_DATA, {});
        
        let totalLiters = 0;
        let totalSales = 0;
        const productTotals = { benzina: 0, gasolio: 0, diesel: 0, hvolution: 0, adblue: 0 };
        const modalityTotals = { servito: 0, iperself: 0, selfservice: 0 }; 
        const revenueByProductAndModality = {};
        const islandTotals = {}; 

        for (let i = 1; i <= 7; i++) { islandTotals[`Erogatore ${i}`] = 0; }
        Object.keys(productTotals).forEach(p => { revenueByProductAndModality[p] = { servito: 0, iperself: 0, selfservice: 0 }; });

        for (const turnKey in virtualstationData) {
            if (turnKey.startsWith('turn-')) {
                const turnData = virtualstationData[turnKey];
                totalLiters += turnData.totalTurnLiters || 0;
                totalSales += turnData.totalTurnAmount || 0;
                for (const product of Object.keys(productTotals)) {
                    const pInfo = turnData[product] || {};
                    productTotals[product] += pInfo.totalLiters || 0;
                    modalityTotals.servito += pInfo.servito || 0;
                    modalityTotals.iperself += pInfo.iperself || 0;
                    modalityTotals.selfservice += pInfo['self-service'] || 0;
                    revenueByProductAndModality[product].servito += pInfo.servitoAmount || 0;
                    revenueByProductAndModality[product].iperself += pInfo.iperselfAmount || 0;
                    revenueByProductAndModality[product].selfservice += pInfo.selfServiceAmount || 0;
                    this.distributeToErogatori(islandTotals, { servitoLiters: pInfo.servito || 0, iperselfLiters: pInfo.iperself || 0, selfServiceLiters: pInfo['self-service'] || 0 });
                }
            }
        }
        
        const topProduct = Object.keys(productTotals).reduce((a, b) => productTotals[a] > productTotals[b] ? a : b, 'N/D');
        
        return { totalSales, totalLiters, productTotals, modalityTotals, islandTotals, revenueByProductAndModality, topProduct };
    },

    processHistoryData: function(history, dateRange) {
        if (!history || !dateRange) return this.processLiveData();

        const filteredHistory = history.filter(item => {
            const itemDate = new Date(item.date);
            return itemDate >= dateRange.startDate && itemDate <= dateRange.endDate;
        });

        const aggregatedData = {
            totalSales: 0,
            totalLiters: 0,
            productTotals: { benzina: 0, gasolio: 0, diesel: 0, hvolution: 0, adblue: 0 },
            modalityTotals: { servito: 0, iperself: 0, selfservice: 0 },
            revenueByProductAndModality: {}, 
            islandTotals: {}
        };
        
        Object.keys(aggregatedData.productTotals).forEach(p => { aggregatedData.revenueByProductAndModality[p] = { servito: 0, iperself: 0, selfservice: 0 }; });

        filteredHistory.forEach(record => {
            aggregatedData.totalSales += record.totalSales || 0;
            aggregatedData.totalLiters += record.totalLiters || 0;
            for (const product in record.productTotals) {
                if (aggregatedData.productTotals.hasOwnProperty(product)) aggregatedData.productTotals[product] += record.productTotals[product] || 0;
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
                if (!aggregatedData.islandTotals[dispenser]) aggregatedData.islandTotals[dispenser] = 0;
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
        const totalModalityLiters = data.modalityTotals.servito + data.modalityTotals.iperself + data.modalityTotals.selfservice;
        const servitoPerc = totalModalityLiters > 0 ? ((data.modalityTotals.servito / totalModalityLiters) * 100).toFixed(0) : 0;
        document.getElementById('servitoPerc').textContent = `${servitoPerc}%`;
    },

    renderCharts: function(data) {
        const isDarkMode = document.documentElement.classList.contains('dark-theme');
        const axisTextColor = isDarkMode ? '#94a3b8' : '#64748b';
        const gridColor = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
        const legendTextColor = isDarkMode ? '#e2e8f0' : '#334155';
        
        this.renderChart('productChart', 'bar', {
            labels: Object.keys(data.productTotals).map(p => formatProductName(p)),
            datasets: [{
                label: 'Litri per Prodotto',
                data: Object.values(data.productTotals),
                backgroundColor: this.getProductColors(Object.keys(data.productTotals)),
                borderRadius: 8, borderWidth: 0
            }]
        }, {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false }, tooltip: { callbacks: { label: c => `${c.label}: ${formatNumber(Math.round(c.parsed.y))} L` }}},
            scales: { 
                y: { beginAtZero: true, ticks: { callback: v => formatNumber(v) + ' L', color: axisTextColor }, grid: { color: gridColor } }, 
                x: { grid: { display: false }, ticks: { color: axisTextColor } } 
            }
        });
        
        this.renderRevenueCompositionChart(data);

        this.renderChart('modalityChart', 'pie', {
            labels: ['Servito', 'Iperself', 'Self-Service'], 
            datasets: [{
                data: [data.modalityTotals.servito, data.modalityTotals.iperself, data.modalityTotals.selfservice],
                backgroundColor: ['#00C851', '#ff1189', '#FFD700'], 
                borderWidth: 3, 
                borderColor: isDarkMode ? '#1e293b' : '#ffffff'
            }]
        }, {
            responsive: true,
            maintainAspectRatio: true,
            aspectRatio: 1,
            plugins: {
                legend: { 
                    display: true, 
                    position: 'bottom', 
                    labels: { 
                        usePointStyle: true, 
                        pointStyle: 'circle', 
                        padding: 15,
                        font: { size: 11, weight: 'bold' },
                        color: legendTextColor 
                    }
                },
                tooltip: { 
                    callbacks: { 
                        label: c => { 
                            const total = c.dataset.data.reduce((a, b) => a + b, 0); 
                            const perc = total > 0 ? ((c.parsed / total) * 100).toFixed(1) : 0; 
                            return `${c.label}: ${formatNumber(Math.round(c.parsed))} L (${perc}%)`; 
                        }
                    }
                },
                datalabels: { 
                    display: true, 
                    color: '#ffffff', 
                    font: { size: 12, weight: 'bold' },
                    formatter: (v, c) => { 
                        const total = c.dataset.data.reduce((a, b) => a + b, 0); 
                        const perc = total > 0 ? (v / total * 100).toFixed(1) : 0; 
                        return parseFloat(perc) > 5 ? `${perc}%` : ''; 
                    }, 
                    textAlign: 'center' 
                }
            },
            layout: { 
                padding: { top: 10, bottom: 10, left: 10, right: 10 }
            }
        });
    },
    
    renderRevenueCompositionChart: function(data) {
        const isDarkMode = document.documentElement.classList.contains('dark-theme');
        const axisTextColor = isDarkMode ? '#94a3b8' : '#64748b';
        const gridColor = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
        const legendTextColor = isDarkMode ? '#e2e8f0' : '#334155';

        const products = Object.keys(data.revenueByProductAndModality);
        this.renderChart('islandChart', 'bar', {
            labels: products.map(p => formatProductName(p)),
            datasets: [
                { label: 'Servito', data: products.map(p => data.revenueByProductAndModality[p].servito), backgroundColor: '#00C851', borderRadius: 4 },
                { label: 'Iperself', data: products.map(p => data.revenueByProductAndModality[p].iperself), backgroundColor: '#ff1189', borderRadius: 4 },
                { label: 'Self-Service', data: products.map(p => data.revenueByProductAndModality[p].selfservice), backgroundColor: '#FFD700', borderRadius: 4 }
            ]
        }, {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: true, position: 'bottom', labels: { usePointStyle: true, pointStyle: 'circle', padding: 15, font: { size: 12, weight: 'bold' }, color: legendTextColor }},
                tooltip: { callbacks: { label: c => `${c.dataset.label}: ${formatEuro(c.parsed.y)}` }}
            },
            scales: {
                x: { stacked: true, grid: { display: false }, ticks: { color: axisTextColor }},
                y: { stacked: true, beginAtZero: true, ticks: { callback: v => formatEuro(v), color: axisTextColor }, grid: { color: gridColor }}
            }
        });
    },
    
    getProductColors: (products) => {
        const colorMap = { 'benzina': '#00C851', 'gasolio': '#FFD700', 'diesel': '#FF4444', 'hvolution': '#2196F3', 'adblue': '#0ABAB5' };
        return products.map(p => colorMap[p] || '#CCCCCC');
    },
    
    renderChart: function(canvasId, type, data, options) {
        if (this.chartInstances[canvasId]) this.chartInstances[canvasId].destroy();
        const ctx = document.getElementById(canvasId);
        if (ctx) {
            this.chartInstances[canvasId] = new Chart(ctx, { type, data, options, plugins: canvasId === 'modalityChart' ? [ChartDataLabels] : [] });
        }
    }
};

/* ===== FUNZIONI STAMPA ===== */
function stampaDati() {
    const data = VenditeManager.currentData;
    const periodText = VenditeManager.currentPeriodText;

    if (!data) {
        showMessage('Nessun dato da stampare.', 'warning');
        return;
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
        <!DOCTYPE html><html><head><title>CERBERO - Report Vendite</title><style>
            body { font-family: Arial, sans-serif; font-size: 11px; line-height: 1.3; color: #333; }
            .print-header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #093fb4; padding-bottom: 10px; }
            .print-title { font-size: 20px; font-weight: bold; color: #093fb4; }
            .print-date, .period-info { font-size: 12px; color: #666; }
            .print-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 20px; text-align: center;}
            .print-stat-item { border: 1px solid #ccc; padding: 10px; border-radius: 8px; }
            .print-stat-value { font-size: 16px; font-weight: bold; color: #093fb4; }
            .print-stat-label { font-size: 10px; text-transform: uppercase; }
            .charts-section { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; page-break-inside: avoid; }
            .chart-container { text-align: center; border: 1px solid #eee; padding: 15px; border-radius: 8px; }
            .chart-title { font-size: 14px; font-weight: bold; margin-bottom: 10px; color: #093fb4; }
            .chart-image { max-width: 100%; height: auto; }
            .full-width-chart { grid-column: 1 / -1; }
            .print-footer { margin-top: 30px; text-align: center; font-size: 10px; color: #999; border-top: 1px solid #ccc; padding-top: 10px; }
        </style></head><body>
            <div class="print-header"><div class="print-title">Report Vendite - CERBERO</div><div class="print-date">Generato il: ${currentDate}</div></div>
            <div class="period-info" style="text-align:center; margin-bottom: 20px;">Riferimento: <strong>${periodText}</strong></div>
            <div class="print-stats">
                <div class="print-stat-item"><div class="print-stat-value">${formatEuro(data.totalSales)}</div><div class="print-stat-label">Fatturato Totale</div></div>
                <div class="print-stat-item"><div class="print-stat-value">${formatNumber(Math.round(data.totalLiters))} L</div><div class="print-stat-label">Litri Erogati</div></div>
                <div class="print-stat-item"><div class="print-stat-value">${servitoPerc}%</div><div class="print-stat-label">Servito vs Self</div></div>
            </div>
            <div class="charts-section">
                ${chartImages.productChart ? `<div class="chart-container"><div class="chart-title">Vendite per Prodotto</div><img src="${chartImages.productChart}" class="chart-image"></div>` : ''}
                ${chartImages.modalityChart ? `<div class="chart-container"><div class="chart-title">Modalità di Servizio</div><img src="${chartImages.modalityChart}" class="chart-image"></div>` : ''}
                ${chartImages.islandChart ? `<div class="chart-container full-width-chart"><div class="chart-title">Composizione Fatturato</div><img src="${chartImages.islandChart}" class="chart-image"></div>` : ''}
            </div>
            <div class="print-footer">Report generato dal sistema di gestione CERBERO.</div>
        </body></html>
    `;
}

/* ===== INIZIALIZZAZIONE ===== */
document.addEventListener('DOMContentLoaded', function() {
    try {
        if (typeof Storage === 'undefined' || !Storage.KEYS) {
            showMessage("Errore critico: storage.js non caricato.", "error");
            return;
        }
        
        ThemeManager.init();
        initializeInfoButton();
        initializeMobileMenu();
        window.VenditeManager = VenditeManager;
        VenditeManager.init();
        
        window.addEventListener('theme-changed', () => {
             if (window.VenditeManager && window.VenditeManager.currentData) {
                window.VenditeManager.renderCharts(window.VenditeManager.currentData);
            }
        });
        
    } catch (error) {
        console.error('Errore critico durante l\'inizializzazione di Vendite:', error);
        showMessage('Errore critico nell\'avvio del sistema Vendite', 'error');
    }
});