// Gran Caffè L'Aquila - Digital Wine List JavaScript

class WineListApp {
    constructor() {
        this.wines = [];
        this.filteredWines = [];
        this.currentView = 'grid';
        this.currentFilters = {
            type: null,
            region: null,
            search: ''
        };
        
        this.init();
    }

    async init() {
        try {
            await this.loadWineData();
            this.setupEventListeners();
            this.handleURLParameters();
            this.renderCurrentPage();
        } catch (error) {
            console.error('Error initializing wine list app:', error);
            this.showError('Failed to load wine data. Please refresh the page.');
        }
    }

    async loadWineData() {
        try {
            const response = await fetch('data/wines.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            this.wines = data.wines || [];
            this.filteredWines = [...this.wines];
            console.log(`Loaded ${this.wines.length} wines`);
        } catch (error) {
            console.error('Error loading wine data:', error);
            // Fallback to empty array if data loading fails
            this.wines = [];
            this.filteredWines = [];
        }
    }

    setupEventListeners() {
        // Search functionality
        const searchInputs = document.querySelectorAll('.luxury-search-input');
        searchInputs.forEach(input => {
            input.addEventListener('input', (e) => {
                this.currentFilters.search = e.target.value.toLowerCase();
                if (this.getCurrentPage() === 'regions') {
                    this.filterRegions();
                } else {
                    this.applyFilters();
                }
            });
        });

        // Filter buttons
        const filterButtons = document.querySelectorAll('.luxury-filter-btn, .filter-button');
        filterButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                this.showFilterOptions(button);
            });
        });

        // View toggle
        const gridViewBtn = document.getElementById('gridViewBtn');
        const tableViewBtn = document.getElementById('tableViewBtn');
        
        if (gridViewBtn && tableViewBtn) {
            gridViewBtn.addEventListener('click', () => this.toggleView('grid'));
            tableViewBtn.addEventListener('click', () => this.toggleView('table'));
        }

        // Explore wine buttons
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('explore-wine') || e.target.classList.contains('table-explore-btn')) {
                e.preventDefault();
                this.exploreWine(e.target);
            }
        });

        // Wine card hover effects
        this.setupHoverEffects();
    }

    handleURLParameters() {
        const urlParams = new URLSearchParams(window.location.search);
        const type = urlParams.get('type');
        const region = urlParams.get('region');
        const wineId = urlParams.get('id');

        if (type) {
            this.currentFilters.type = type;
        }
        if (region) {
            this.currentFilters.region = region;
        }
        if (wineId) {
            this.loadWineDetails(wineId);
        }
    }

    renderCurrentPage() {
        const currentPage = this.getCurrentPage();
        
        switch (currentPage) {
            case 'index':
                this.renderHomePage();
                break;
            case 'regions':
                this.renderRegionsPage();
                break;
            case 'wines':
                this.renderWinesPage();
                break;
            case 'wine-details':
                this.renderWineDetailsPage();
                break;
        }
    }

    getCurrentPage() {
        const path = window.location.pathname;
        if (path.includes('regions')) return 'regions';
        if (path.includes('wines')) return 'wines';
        if (path.includes('wine-details')) return 'wine-details';
        return 'index';
    }

    renderHomePage() {
        // Update wine type cards with actual wine counts
        const wineTypes = ['ROSSO', 'BIANCO', 'ROSATO', 'BOLLICINE'];
        const wineCards = document.querySelectorAll('.luxury-wine-card');
        
        wineCards.forEach((card, index) => {
            if (wineTypes[index]) {
                const count = this.wines.filter(wine => wine.wine_type === wineTypes[index]).length;
                const countElement = card.querySelector('.wine-count');
                if (countElement) {
                    countElement.textContent = `${count} wines`;
                }
            }
        });
    }

    renderRegionsPage() {
        const regionsContainer = document.querySelector('.regions-container');
        if (!regionsContainer) return;

        // Get all unique regions from all wines (not filtered by type)
        this.allRegions = [...new Set(
            this.wines
                .filter(wine => wine.region && wine.region.trim() !== '')
                .map(wine => wine.region)
        )].sort();

        // Update page title to be more generic
        const title = document.querySelector('.luxury-subtitle');
        if (title) {
            title.textContent = 'WINE REGIONS';
        }

        // Update breadcrumb
        const breadcrumb = document.querySelector('.breadcrumb');
        if (breadcrumb) {
            breadcrumb.innerHTML = `
                <a href="index.html">Home</a>
                <i class="fas fa-chevron-right"></i>
                <span>Wine Regions</span>
            `;
        }

        // Render region cards
        this.filterRegions();
    }

    filterRegions() {
        const regionsGrid = document.querySelector('.regions-grid');
        if (!regionsGrid || !this.allRegions) return;

        const filteredRegions = this.allRegions.filter(region => 
            !this.currentFilters.search || region.toLowerCase().includes(this.currentFilters.search)
        );

        regionsGrid.innerHTML = filteredRegions.map(region => {
            const count = this.wines.filter(wine => wine.region === region).length;
            const icon = this.getRegionIcon(region);
            
            return `
                <a href="wines.html?region=${encodeURIComponent(region)}" class="region-card">
                    <div class="region-icon">
                        <i class="${icon}"></i>
                    </div>
                    <h3 class="region-title">${region}</h3>
                    <p class="wine-count">${count} wines</p>
                </a>
            `;
        }).join('');
    }

    renderWinesPage() {
        if (!this.currentFilters.region) return;

        // Filter wines by region (and type if specified)
        this.filteredWines = this.wines.filter(wine => {
            const matchesRegion = wine.region === this.currentFilters.region;
            const matchesType = !this.currentFilters.type || wine.wine_type === this.currentFilters.type;
            return matchesRegion && matchesType;
        });

        // Update page title
        const title = document.querySelector('.luxury-subtitle');
        if (title) {
            if (this.currentFilters.type) {
                title.textContent = `${this.currentFilters.region} ${this.getWineTypeName(this.currentFilters.type)}`;
            } else {
                title.textContent = `${this.currentFilters.region} WINES`;
            }
        }

        // Update wine count
        const countElement = document.querySelector('.wines-count');
        if (countElement) {
            countElement.textContent = `${this.filteredWines.length} wines`;
        }

        // Update breadcrumb
        const breadcrumb = document.querySelector('.breadcrumb');
        if (breadcrumb) {
            breadcrumb.innerHTML = `
                <a href="index.html">Home</a>
                <i class="fas fa-chevron-right"></i>
                <a href="regions.html">Wine Regions</a>
                <i class="fas fa-chevron-right"></i>
                <span>${this.currentFilters.region}</span>
            `;
        }

        // Render wines
        this.renderWines();
    }

    renderWines() {
        const winesGrid = document.getElementById('winesGrid');
        const wineTable = document.getElementById('wineTable');
        
        if (winesGrid) {
            winesGrid.innerHTML = this.filteredWines.map(wine => this.createWineCard(wine)).join('');
        }
        
        if (wineTable) {
            const tbody = wineTable.querySelector('tbody');
            if (tbody) {
                tbody.innerHTML = this.filteredWines.map(wine => this.createWineTableRow(wine)).join('');
            }
        }
    }

    createWineCard(wine) {
        return `
            <div class="wine-card">
                <div class="wine-header">
                    <h3 class="wine-name">${wine.wine_name}</h3>
                    <div class="wine-price">$${wine.wine_price}</div>
                </div>
                <div class="wine-details">
                    <p class="wine-region">${wine.region}</p>
                    <p class="wine-grape">${wine.varietals || 'N/A'}</p>
                    <p class="wine-description">${wine.wine_description || 'A fine wine selection.'}</p>
                </div>
                <div class="wine-actions">
                    <span class="wine-year">${this.extractYear(wine.wine_vintage)}</span>
                    <a href="wine-details.html?id=${wine.wine_number}" class="explore-wine">Explore Wine</a>
                </div>
            </div>
        `;
    }

    createWineTableRow(wine) {
        return `
            <tr>
                <td class="table-wine-name">${wine.wine_name}</td>
                <td class="table-wine-region">${wine.region}</td>
                <td>${wine.varietals || 'N/A'}</td>
                <td>${this.extractYear(wine.wine_vintage)}</td>
                <td class="table-wine-price">$${wine.wine_price}</td>
                <td><a href="wine-details.html?id=${wine.wine_number}" class="table-explore-btn">Explore</a></td>
            </tr>
        `;
    }

    renderWineDetailsPage() {
        const urlParams = new URLSearchParams(window.location.search);
        const wineId = urlParams.get('id');
        
        if (wineId) {
            this.loadWineDetails(wineId);
        }
    }

    loadWineDetails(wineId) {
        const wine = this.wines.find(w => w.wine_number === wineId);
        if (!wine) {
            this.showError('Wine not found');
            return;
        }

        // Update wine details
        this.updateWineDetails(wine);
    }

    updateWineDetails(wine) {
        // Update wine name
        const wineName = document.querySelector('.wine-name');
        if (wineName) {
            wineName.textContent = wine.wine_name;
        }

        // Update wine region
        const wineRegion = document.querySelector('.wine-region');
        if (wineRegion) {
            wineRegion.textContent = wine.region;
        }

        // Update wine price
        const winePrice = document.querySelector('.wine-price');
        if (winePrice) {
            winePrice.textContent = `$${wine.wine_price}`;
        }

        // Update meta information
        this.updateMetaInfo(wine);

        // Update breadcrumb
        this.updateBreadcrumb(wine);
    }

    updateMetaInfo(wine) {
        const metaItems = [
            { label: 'Grape Variety', value: wine.varietals || 'N/A' },
            { label: 'Vintage', value: this.extractYear(wine.wine_vintage) },
            { label: 'Alcohol', value: wine.alcohol || 'N/A' },
            { label: 'Aging', value: wine.aging || 'N/A' }
        ];

        const metaContainer = document.querySelector('.wine-meta');
        if (metaContainer) {
            metaContainer.innerHTML = metaItems.map(item => `
                <div class="meta-item">
                    <span class="meta-label">${item.label}</span>
                    <span class="meta-value">${item.value}</span>
                </div>
            `).join('');
        }
    }

    updateBreadcrumb(wine) {
        const breadcrumb = document.querySelector('.breadcrumb');
        if (breadcrumb) {
            const typeName = this.getWineTypeName(wine.wine_type);
            breadcrumb.innerHTML = `
                <a href="index.html">Home</a>
                <i class="fas fa-chevron-right"></i>
                <a href="regions.html?type=${wine.wine_type}">${typeName}</a>
                <i class="fas fa-chevron-right"></i>
                <a href="wines.html?type=${wine.wine_type}&region=${encodeURIComponent(wine.region)}">${wine.region}</a>
                <i class="fas fa-chevron-right"></i>
                <span>${wine.wine_name}</span>
            `;
        }
    }

    applyFilters() {
        this.filteredWines = this.wines.filter(wine => {
            const matchesType = !this.currentFilters.type || wine.wine_type === this.currentFilters.type;
            const matchesRegion = !this.currentFilters.region || wine.region === this.currentFilters.region;
            const matchesSearch = !this.currentFilters.search || 
                wine.wine_name.toLowerCase().includes(this.currentFilters.search) ||
                wine.region.toLowerCase().includes(this.currentFilters.search) ||
                (wine.varietals && wine.varietals.toLowerCase().includes(this.currentFilters.search));
            
            return matchesType && matchesRegion && matchesSearch;
        });

        this.renderWines();
    }

    toggleView(view) {
        this.currentView = view;
        const winesGrid = document.getElementById('winesGrid');
        const wineTable = document.getElementById('wineTable');
        const gridBtn = document.getElementById('gridViewBtn');
        const tableBtn = document.getElementById('tableViewBtn');

        if (view === 'grid') {
            if (winesGrid) winesGrid.style.display = 'grid';
            if (wineTable) wineTable.style.display = 'none';
            if (gridBtn) gridBtn.classList.add('active');
            if (tableBtn) tableBtn.classList.remove('active');
        } else {
            if (winesGrid) winesGrid.style.display = 'none';
            if (wineTable) wineTable.style.display = 'block';
            if (gridBtn) gridBtn.classList.remove('active');
            if (tableBtn) tableBtn.classList.add('active');
        }
    }

    exploreWine(button) {
        const wineCard = button.closest('.wine-card');
        const tableRow = button.closest('tr');
        
        let wineName = '';
        if (wineCard) {
            wineName = wineCard.querySelector('.wine-name').textContent;
        } else if (tableRow) {
            wineName = tableRow.querySelector('.table-wine-name').textContent;
        }

        // Find the wine in our data
        const wine = this.wines.find(w => w.wine_name === wineName);
        if (wine) {
            window.location.href = `wine-details.html?id=${wine.wine_number}`;
        } else {
            this.showError('Wine details not available');
        }
    }

    showFilterOptions(button) {
        // This would open a filter modal or dropdown
        // For now, show a simple alert
        const filterType = button.textContent.includes('Region') ? 'Region' : 'Varietal';
        alert(`Filter by ${filterType} functionality would open a selection menu`);
    }

    setupHoverEffects() {
        // Add hover effects to wine cards
        document.addEventListener('mouseover', (e) => {
            const wineCard = e.target.closest('.wine-card, .region-card, .luxury-wine-card');
            if (wineCard) {
                wineCard.style.transform = 'translateY(-5px)';
            }
        });

        document.addEventListener('mouseout', (e) => {
            const wineCard = e.target.closest('.wine-card, .region-card, .luxury-wine-card');
            if (wineCard) {
                wineCard.style.transform = 'translateY(0)';
            }
        });
    }

    showError(message) {
        console.error(message);
        // You could show a toast notification or error modal here
        alert(message);
    }

    // Utility functions
    getWineTypeName(type) {
        const typeNames = {
            'ROSSO': 'Red Wines',
            'BIANCO': 'White Wines',
            'ROSATO': 'Rosé Wines',
            'BOLLICINE': 'Sparkling Wines'
        };
        return typeNames[type] || 'Wines';
    }

    getRegionIcon(region) {
        const iconMap = {
            'TOSCANA': 'fas fa-sun',
            'TOSCANA (BOLGHERI)': 'fas fa-sun',
            'PIEMONTE': 'fas fa-mountain',
            'VENETO': 'fas fa-water',
            'LUGANA DOC (VENETO)': 'fas fa-water',
            'CAMPANIA': 'fas fa-volcano',
            'SICILIA': 'fas fa-volcano',
            'ABRUZZO': 'fas fa-tree',
            'TRENTINO ALTO-ADIGE': 'fas fa-mountain',
            'EMILIA-ROMAGNA': 'fas fa-city',
            'LOMBARDIA': 'fas fa-lake',
            'LE MARCHE': 'fas fa-hills',
            'LAZIO': 'fas fa-city',
            'FRIULI-VENEZIA GIULIA': 'fas fa-mountain',
            'PUGLIA': 'fas fa-umbrella-beach',
            'TARANTO IGT (PUGLIA)': 'fas fa-umbrella-beach',
            'SARDEGNA': 'fas fa-island-tropical',
            'CALABRIA': 'fas fa-tree',
            'UMBRIA': 'fas fa-hills',
            'MOLISE': 'fas fa-hills',
            'LIGURIA': 'fas fa-water',
            'VALLE D\'AOSTA': 'fas fa-mountain',
            'BASILICATA': 'fas fa-hills',
            'MATERA DOC (BASILICATA)': 'fas fa-hills'
        };
        return iconMap[region] || 'fas fa-map-marker-alt';
    }

    extractYear(vintage) {
        if (!vintage) return 'N/A';
        const yearMatch = vintage.match(/\b(19|20)\d{2}\b/);
        return yearMatch ? yearMatch[0] : 'N/A';
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Add page load animation
    const luxuryContainer = document.querySelector('.luxury-container');
    if (luxuryContainer) {
        luxuryContainer.style.opacity = '0';
        luxuryContainer.style.transition = 'opacity 1s ease';
        
        setTimeout(() => {
            luxuryContainer.style.opacity = '1';
        }, 100);
    }

    // Initialize the wine list app
    window.wineApp = new WineListApp();
});

// Add some utility functions for GitHub Pages compatibility
function updateWineIcons() {
    const wineCards = document.querySelectorAll('.luxury-wine-card');
    const iconMap = {
        'ROSSO': 'image/glassRed.png',
        'BIANCO': 'image/glassWhite.png',
        'ROSATO': 'image/glRose.png',
        'BOLLICINE': 'image/glSparkling.png'
    };

    wineCards.forEach(card => {
        const link = card.getAttribute('href');
        if (link) {
            const type = new URLSearchParams(link.split('?')[1]).get('type');
            if (type && iconMap[type]) {
                const icon = card.querySelector('.wine-icon');
                if (icon) {
                    icon.innerHTML = `<img src="${iconMap[type]}" alt="${type} wine icon">`;
                }
            }
        }
    });
}

// Update icons after page load
document.addEventListener('DOMContentLoaded', updateWineIcons);
