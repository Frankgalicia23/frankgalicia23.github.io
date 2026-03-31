/**
 * New England Maple Syrup Simulation
 * Focus: Matter Cycling (Photosynthesis), Heredity, and Natural Selection
 */

class MapleTree {
    constructor(id, sugarGene, growthGene) {
        this.id = id;
        this.sugarGene = sugarGene; // 0.5 to 1.5 multiplier for sap concentration
        this.growthGene = growthGene; // 0.5 to 1.5 multiplier for wood growth
        this.health = 100;
        this.storedSugar = 0;
        this.woodBiomass = 10; // Starting wood mass (kg)
        this.isAlive = true;
    }

    // Photosynthesis: Takes in environment and produces Matter (Sugar/Wood)
    photosynthesize(co2, light, temp) {
        if (!this.isAlive) return;

        // Base production rate
        const baseRate = (co2 / 400) * (light / 100);

        // Temperature efficiency (Ideal is 20-25°C)
        const tempEfficiency = Math.max(0, 1 - Math.abs(22 - temp) / 15);

        const production = baseRate * tempEfficiency * 10; // Standardize to kg of carbon fixed

        // Split production between Growth (Wood) and Storage (Sugar) based on genetics
        const growthFactor = 0.6 * this.growthGene;
        const storageFactor = 0.4 * this.sugarGene;

        // Normalize factors so they sum to 1 roughly, but keep genetic variance
        const totalFactor = growthFactor + storageFactor;

        const addedWood = (growthFactor / totalFactor) * production;
        const addedSugar = (storageFactor / totalFactor) * production;

        this.woodBiomass += addedWood;
        this.storedSugar += addedSugar;

        return { addedWood, addedSugar };
    }

    checkSurvival(pestIntensity, temp) {
        if (!this.isAlive) return false;

        // Pests damage health. Fast growers are more susceptible (trade-off)
        const pestDamage = (pestIntensity / 10) * (this.growthGene > 1.2 ? 1.5 : 1.0);

        // High temp stress
        const tempStress = temp > 30 ? (temp - 30) * 2 : 0;

        this.health -= (pestDamage + tempStress);

        if (this.health <= 0) {
            this.isAlive = false;
            this.health = 0;
        }
        return this.isAlive;
    }
}

const Simulation = {
    trees: [],
    generation: 1,
    year: 1,
    seasons: ['Spring', 'Summer', 'Fall', 'Winter'],
    currentSeasonIndex: 1, // Start in Summer for first photosynthesis

    // Data tracking
    history: {
        totalSyrup: [],
        avgSugarGene: [],
        avgGrowthGene: [],
        survivalRate: []
    },

    init() {
        this.createInitialPopulation(50);
        this.setupCharts();
        this.updateChartData(); // Record Gen 1
        this.updateUI();
        this.attachEventListeners();
    },

    createInitialPopulation(size) {
        this.trees = [];
        for (let i = 0; i < size; i++) {
            // Natural variation in genes
            const sugarGene = 0.7 + Math.random() * 0.6;
            const growthGene = 0.7 + Math.random() * 0.6;
            this.trees.push(new MapleTree(i, sugarGene, growthGene));
        }
    },

    setupCharts() {
        const ctx = document.getElementById('growthChart').getContext('2d');
        this.chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [
                    {
                        label: 'Avg Sugar Gene',
                        borderColor: '#FFB300',
                        data: []
                    },
                    {
                        label: 'Avg Growth Gene',
                        borderColor: '#5D4037',
                        data: []
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: { beginAtZero: false }
                }
            }
        });
    },

    stepSeason() {
        this.currentSeasonIndex = (this.currentSeasonIndex + 1) % 4;
        const season = this.seasons[this.currentSeasonIndex];

        if (this.currentSeasonIndex === 0) {
            this.year++; // New year starts in Spring
        }

        const co2 = parseFloat(document.getElementById('co2-slider').value);
        const light = parseFloat(document.getElementById('sunlight-slider').value);
        const temp = parseFloat(document.getElementById('temp-slider').value);
        const pest = parseFloat(document.getElementById('selection-pressure').value);

        let seasonWood = 0;
        let seasonSugar = 0;

        this.trees.forEach(tree => {
            if (season === 'Summer') {
                const added = tree.photosynthesize(co2, light, temp);
                if (added) {
                    seasonWood += added.addedWood;
                    seasonSugar += added.addedSugar;
                }
            }

            // Check survival every year in Winter
            if (season === 'Winter') {
                tree.checkSurvival(pest, temp);
            }
        });

        if (season === 'Spring') {
            this.handleHarvest();
            if (document.getElementById('selection-mode').checked) {
                this.handleNaturalSelection();
            }
        }

        this.updateStats(seasonWood, seasonSugar);
        this.updateUI();
    },

    handleHarvest() {
        let totalSyrup = 0;
        this.trees.forEach(tree => {
            if (tree.isAlive) {
                // Yield depends on stored sugar and a bit of "Spring Magic" (temperature oscillation)
                const yieldAmt = tree.storedSugar * 0.8;
                totalSyrup += yieldAmt;
                tree.storedSugar -= yieldAmt; // Reset for next year
            }
        });

        const harvestDiv = document.getElementById('harvest-results');
        harvestDiv.classList.remove('hidden');
        document.getElementById('total-syrup').innerText = totalSyrup.toFixed(1);

        const aliveCount = this.trees.filter(t => t.isAlive).length;
        const avgHealth = this.trees.reduce((acc, t) => acc + t.health, 0) / this.trees.length;
        document.getElementById('avg-health').innerText = avgHealth.toFixed(0);
    },

    handleNaturalSelection() {
        // Create new generation from survivors
        const survivors = this.trees.filter(t => t.isAlive);

        if (survivors.length < 5) {
            alert("The grove has collapsed! Resetting population.");
            this.createInitialPopulation(50);
            return;
        }

        const nextGen = [];
        const targetSize = 50;

        while (nextGen.length < targetSize) {
            // Pick two parents from survivors
            const p1 = survivors[Math.floor(Math.random() * survivors.length)];
            const p2 = survivors[Math.floor(Math.random() * survivors.length)];

            // Genetic crossover with mutation
            const sugarGene = ((p1.sugarGene + p2.sugarGene) / 2) + (Math.random() - 0.5) * 0.1;
            const growthGene = ((p1.growthGene + p2.growthGene) / 2) + (Math.random() - 0.5) * 0.1;

            nextGen.push(new MapleTree(nextGen.length, sugarGene, growthGene));
        }

        this.trees = nextGen;
        this.generation++;
        this.updateChartData();
    },

    updateStats(addedWood, addedSugar) {
        if (this.currentSeasonIndex === 1) { // Summer
            document.getElementById('wood-storage').innerText = `+${addedWood.toFixed(1)} kg`;
            document.getElementById('sugar-storage').innerText = `+${addedSugar.toFixed(1)} kg`;
            document.getElementById('atmos-carbon').innerText = "Fixed into Tree";
        } else {
            document.getElementById('atmos-carbon').innerText = "Steady";
        }
    },

    updateChartData() {
        const avgSugar = this.trees.reduce((acc, t) => acc + t.sugarGene, 0) / this.trees.length;
        const avgGrowth = this.trees.reduce((acc, t) => acc + t.growthGene, 0) / this.trees.length;

        this.chart.data.labels.push(`Gen ${this.generation}`);
        this.chart.data.datasets[0].data.push(avgSugar);
        this.chart.data.datasets[1].data.push(avgGrowth);
        this.chart.update();
    },

    updateUI() {
        const season = this.seasons[this.currentSeasonIndex];
        document.getElementById('current-season').innerText = `Season: ${season} (Year ${this.year})`;

        const descriptions = {
            'Spring': 'The thaw begins! Sap (Sugar) flows from the roots. Time to harvest syrup.',
            'Summer': 'Full leaves! The tree takes in CO2 and Sunlight to create matter (Wood and Sugar).',
            'Fall': 'Storing energy. Photosynthesis slows as trees prepare for the cold.',
            'Winter': 'Dormancy. The tree survives on stored energy. Pests and cold test its health.'
        };
        document.getElementById('season-desc').innerText = descriptions[season];

        // Update Grove Visualization
        const container = document.getElementById('grove-container');
        container.innerHTML = '';
        this.trees.forEach(tree => {
            const treeEl = document.createElement('div');
            treeEl.className = 'tree-item';

            // SVG for a tree
            const color = tree.isAlive ? (season === 'Fall' ? '#E65100' : '#2E7D32') : '#5D4037';
            const opacity = tree.isAlive ? (tree.health / 100) : 0.3;
            const scale = 0.5 + (tree.woodBiomass / 100);

            treeEl.innerHTML = `
                <svg viewBox="0 0 100 100" style="width:30px; height:30px; opacity: ${opacity}; transform: scale(${scale})">
                    <rect x="45" y="60" width="10" height="40" fill="#5D4037" />
                    <circle cx="50" cy="40" r="30" fill="${color}" />
                </svg>
            `;
            container.appendChild(treeEl);
        });

        // Update body class for seasonal themes
        document.body.className = `season-${season.toLowerCase()}`;

        // Update slider values display
        document.getElementById('co2-val').innerText = document.getElementById('co2-slider').value + ' ppm';
        document.getElementById('sunlight-val').innerText = document.getElementById('sunlight-slider').value + '%';
        document.getElementById('temp-val').innerText = document.getElementById('temp-slider').value + '°C';
        document.getElementById('pest-val').innerText = document.getElementById('selection-pressure').value + '%';
    },

    attachEventListeners() {
        document.getElementById('step-season-btn').addEventListener('click', () => this.stepSeason());
        document.getElementById('reset-btn').addEventListener('click', () => {
            this.year = 1;
            this.generation = 1;
            this.currentSeasonIndex = 1;
            this.createInitialPopulation(50);
            this.chart.data.labels = [];
            this.chart.data.datasets.forEach(d => d.data = []);
            this.chart.update();
            this.updateUI();
        });

        // Sync slider labels
        ['co2', 'sunlight', 'temp', 'selection-pressure'].forEach(id => {
            const slider = document.getElementById(id === 'selection-pressure' ? 'selection-pressure' : id + '-slider');
            if (slider) {
                slider.addEventListener('input', () => this.updateUI());
            }
        });
    }
};

window.onload = () => Simulation.init();
