/**
 * New England Maple Syrup Simulation
 * Focus: Matter Cycling (Photosynthesis), Heredity, and Natural Selection
 */

class MapleTree {
    constructor(id, sugarGene, growthGene) {
        this.id = id;
        this.sugarGene = sugarGene; // 0.7 to 1.3ish multiplier for sap concentration
        this.growthGene = growthGene; // 0.7 to 1.3ish multiplier for wood growth
        this.health = 100;
        this.storedSugar = 0;
        this.woodBiomass = 10; // Starting wood mass (kg)
        this.isAlive = true;
    }

    // Annual Cycle: Takes in environment and produces Matter (Sugar/Wood)
    runYear(co2, light, temp, pestIntensity) {
        if (!this.isAlive) return;

        // Photosynthesis logic (Matter Transformation)
        const baseRate = (co2 / 400) * (light / 100);
        const tempEfficiency = Math.max(0.1, 1 - Math.abs(22 - temp) / 15);
        const production = baseRate * tempEfficiency * 15;

        const growthFactor = 0.6 * this.growthGene;
        const storageFactor = 0.4 * this.sugarGene;
        const totalFactor = growthFactor + storageFactor;

        const addedWood = (growthFactor / totalFactor) * production;
        const addedSugar = (storageFactor / totalFactor) * production;

        this.woodBiomass += addedWood;
        this.storedSugar += addedSugar;

        // Survival logic (Natural Selection Pressure)
        const pestDamage = (pestIntensity / 10) * (this.growthGene > 1.2 ? 1.5 : 1.0);
        const tempStress = temp > 30 ? (temp - 30) * 2 : 0;
        this.health -= (pestDamage + tempStress);

        if (this.health <= 0) {
            this.isAlive = false;
            this.health = 0;
        }

        return { addedWood, addedSugar, yield: this.isAlive ? this.storedSugar * 0.8 : 0 };
    }
}

const Simulation = {
    trees: [],
    year: 1,
    trialCount: 1,

    init() {
        this.createInitialPopulation(50);
        this.setupCharts();
        this.updateChartData();
        this.updateUI();
        this.attachEventListeners();
    },

    createInitialPopulation(size) {
        this.trees = [];
        for (let i = 0; i < size; i++) {
            const sugarGene = 0.8 + Math.random() * 0.4;
            const growthGene = 0.8 + Math.random() * 0.4;
            this.trees.push(new MapleTree(i, sugarGene, growthGene));
        }
        this.year = 1;
    },

    setupCharts() {
        const ctx = document.getElementById('growthChart').getContext('2d');
        this.chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: Array.from({length: 51}, (_, i) => i),
                datasets: []
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    ySugar: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        title: { display: true, text: 'Avg Sugar Gene' },
                        min: 0.5,
                        max: 1.5
                    },
                    yGrowth: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        title: { display: true, text: 'Avg Growth Gene' },
                        grid: { drawOnChartArea: false },
                        min: 0.5,
                        max: 1.5
                    },
                    x: {
                        title: { display: true, text: 'Years' }
                    }
                }
            }
        });
        this.addNewTrialDatasets();
    },

    addNewTrialDatasets() {
        const colors = ['#FFB300', '#5D4037', '#4CAF50', '#F44336', '#2196F3', '#9C27B0'];
        const baseColor = colors[(this.trialCount - 1) % colors.length];

        this.chart.data.datasets.push({
            label: `T${this.trialCount} Sugar`,
            borderColor: baseColor,
            borderWidth: 2,
            data: [],
            yAxisID: 'ySugar',
            fill: false
        });
        this.chart.data.datasets.push({
            label: `T${this.trialCount} Growth`,
            borderColor: baseColor,
            borderDash: [5, 5],
            borderWidth: 2,
            data: [],
            yAxisID: 'yGrowth',
            fill: false
        });
    },

    stepYear() {
        const co2 = parseFloat(document.getElementById('co2-slider').value);
        const light = parseFloat(document.getElementById('sunlight-slider').value);
        const temp = parseFloat(document.getElementById('temp-slider').value);
        const pest = parseFloat(document.getElementById('selection-pressure').value);

        let totalWood = 0;
        let totalSugar = 0;
        let totalSyrup = 0;

        this.trees.forEach(tree => {
            const results = tree.runYear(co2, light, temp, pest);
            if (results) {
                totalWood += results.addedWood;
                totalSugar += results.addedSugar;
                totalSyrup += results.yield;
                if (tree.isAlive) tree.storedSugar = 0; // Harvested
            }
        });

        // Reproduction every 5 years or when population low
        if (this.year % 5 === 0) {
            this.handleNaturalSelection();
        }

        this.year++;
        this.updateStats(totalWood, totalSugar, totalSyrup);
        this.updateChartData();
        this.updateUI();
    },

    run50Years() {
        for (let i = 0; i < 50; i++) {
            this.stepYear();
            if (this.year > 50) break;
        }
    },

    handleNaturalSelection() {
        const survivors = this.trees.filter(t => t.isAlive);
        if (survivors.length < 5) {
            return; // Grove dying out
        }

        const nextGen = [];
        const targetSize = 50;
        while (nextGen.length < targetSize) {
            const p1 = survivors[Math.floor(Math.random() * survivors.length)];
            const p2 = survivors[Math.floor(Math.random() * survivors.length)];
            const sugarGene = ((p1.sugarGene + p2.sugarGene) / 2) + (Math.random() - 0.5) * 0.05;
            const growthGene = ((p1.growthGene + p2.growthGene) / 2) + (Math.random() - 0.5) * 0.05;
            nextGen.push(new MapleTree(nextGen.length, sugarGene, growthGene));
        }
        this.trees = nextGen;
    },

    updateStats(wood, sugar, syrup) {
        document.getElementById('wood-storage').innerText = `+${wood.toFixed(1)} kg`;
        document.getElementById('sugar-storage').innerText = `+${sugar.toFixed(1)} kg`;
        document.getElementById('total-syrup').innerText = syrup.toFixed(1);
        const avgHealth = this.trees.reduce((acc, t) => acc + t.health, 0) / this.trees.length;
        document.getElementById('avg-health').innerText = Math.max(0, avgHealth).toFixed(0);
    },

    updateChartData() {
        const avgSugar = this.trees.reduce((acc, t) => acc + t.sugarGene, 0) / this.trees.length;
        const avgGrowth = this.trees.reduce((acc, t) => acc + t.growthGene, 0) / this.trees.length;

        const sugarDataset = this.chart.data.datasets[this.chart.data.datasets.length - 2];
        const growthDataset = this.chart.data.datasets[this.chart.data.datasets.length - 1];

        sugarDataset.data.push({x: this.year - 1, y: avgSugar});
        growthDataset.data.push({x: this.year - 1, y: avgGrowth});

        this.chart.update();
    },

    updateUI() {
        document.getElementById('current-year').innerText = `Year ${this.year}`;

        const container = document.getElementById('grove-container');
        container.innerHTML = '';
        this.trees.forEach(tree => {
            const treeEl = document.createElement('div');
            const color = tree.isAlive ? '#2E7D32' : '#5D4037';
            const opacity = tree.isAlive ? (tree.health / 100) : 0.3;
            const scale = 0.5 + (tree.woodBiomass / 100);

            treeEl.innerHTML = `
                <svg viewBox="0 0 100 100" style="width:25px; height:25px; opacity: ${opacity}; transform: scale(${scale})">
                    <rect x="45" y="60" width="10" height="40" fill="#5D4037" />
                    <circle cx="50" cy="40" r="30" fill="${color}" />
                </svg>
            `;
            container.appendChild(treeEl);
        });

        document.getElementById('co2-val').innerText = document.getElementById('co2-slider').value + ' ppm';
        document.getElementById('sunlight-val').innerText = document.getElementById('sunlight-slider').value + '%';
        document.getElementById('temp-val').innerText = document.getElementById('temp-slider').value + '°C';
        document.getElementById('pest-val').innerText = document.getElementById('selection-pressure').value + '%';

        if (this.year > 1) {
            document.getElementById('harvest-results').classList.remove('hidden');
        }
    },

    startNewTrial() {
        this.trialCount++;
        this.createInitialPopulation(50);
        this.addNewTrialDatasets();
        this.updateChartData();
        this.updateUI();
    },

    attachEventListeners() {
        document.getElementById('step-year-btn').addEventListener('click', () => this.stepYear());
        document.getElementById('step-50-btn').addEventListener('click', () => this.run50Years());
        document.getElementById('new-trial-btn').addEventListener('click', () => this.startNewTrial());
        document.getElementById('reset-btn').addEventListener('click', () => {
            this.trialCount = 1;
            this.chart.data.datasets = [];
            this.createInitialPopulation(50);
            this.addNewTrialDatasets();
            this.updateChartData();
            this.updateUI();
        });

        ['co2', 'sunlight', 'temp', 'selection-pressure'].forEach(id => {
            const slider = document.getElementById(id === 'selection-pressure' ? 'selection-pressure' : id + '-slider');
            if (slider) {
                slider.addEventListener('input', () => this.updateUI());
            }
        });
    }
};

window.onload = () => Simulation.init();
