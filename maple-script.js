/**
 * New England Maple Syrup Simulation (Yearly Version)
 * Focus: Matter Cycling (Photosynthesis), Tree Growth, and Multi-Trial Comparison
 */

class MapleTree {
    constructor(id, sugarGene, growthGene) {
        this.id = id;
        this.sugarGene = sugarGene;
        this.growthGene = growthGene;
        this.woodBiomass = 50 + Math.random() * 20; // Starting wood mass (kg)
        this.isAlive = true;
    }

    // Yearly Growth: Takes in environment and produces Matter (Sugar/Wood)
    calculateYearlyGrowth(co2, light, temp, randomness) {
        if (!this.isAlive) return { wood: 0, sugar: 0 };

        // Base production rate influenced by CO2 and Sunlight
        const baseRate = (co2 / 420) * (light / 100);

        // Temperature efficiency (Ideal is 20-25°C)
        const tempEfficiency = Math.max(0.1, 1 - Math.abs(22 - temp) / 20);

        // Biomass factor: Larger trees produce more but have a ceiling
        const biomassFactor = Math.log10(this.woodBiomass) * 2;

        const totalProduction = baseRate * tempEfficiency * biomassFactor * 5 * randomness;

        // Split production between Growth (Wood) and Storage (Sugar)
        const yearlyWood = totalProduction * 0.7 * this.growthGene;
        const yearlySugar = totalProduction * 0.3 * this.sugarGene;

        this.woodBiomass += yearlyWood;

        return {
            wood: yearlyWood,
            sugar: yearlySugar
        };
    }
}

const Simulation = {
    trees: [],
    trials: [], // Stores data for up to 3 trials
    maxTrials: 3,
    maxYears: 50,
    chart: null,

    init() {
        this.setupChart();
        this.attachEventListeners();
        this.createBasePopulation(30);
        this.resetTrees();
        this.updateUI();
    },

    createBasePopulation(size) {
        this.basePopulation = [];
        for (let i = 0; i < size; i++) {
            this.basePopulation.push({
                sugarGene: 0.8 + Math.random() * 0.4,
                growthGene: 0.8 + Math.random() * 0.4
            });
        }
    },

    resetTrees() {
        this.trees = this.basePopulation.map((genes, i) =>
            new MapleTree(i, genes.sugarGene, genes.growthGene)
        );
    },

    setupChart() {
        const ctx = document.getElementById('growthChart').getContext('2d');
        this.chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: Array.from({length: this.maxYears}, (_, i) => i + 1),
                datasets: []
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    mode: 'index',
                    intersect: false,
                },
                scales: {
                    x: {
                        display: true,
                        title: {
                            display: true,
                            text: 'Year'
                        }
                    },
                    ySugar: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        title: {
                            display: true,
                            text: 'Yearly Sugar Production (kg)',
                            color: '#FFB300'
                        },
                        beginAtZero: true
                    },
                    yWood: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        title: {
                            display: true,
                            text: 'Yearly Wood Growth (kg)',
                            color: '#5D4037'
                        },
                        grid: {
                            drawOnChartArea: false, // only want the grid lines for one axis
                        },
                        beginAtZero: true
                    }
                }
            }
        });
    },

    runTrial() {
        if (this.trials.length >= this.maxTrials) {
            alert("Maximum trials reached. Please clear to start fresh.");
            return;
        }

        const co2 = parseFloat(document.getElementById('co2-slider').value);
        const sunlight = parseFloat(document.getElementById('sunlight-slider').value);
        const temp = parseFloat(document.getElementById('temp-slider').value);

        // Reset trees to starting biomass but keep same genes for fair comparison
        this.resetTrees();

        const yearlyData = [];
        let trialTotalSugar = 0;
        let trialTotalWood = 0;

        for (let year = 1; year <= this.maxYears; year++) {
            let totalYearlySugar = 0;
            let totalYearlyWood = 0;
            let totalBiomass = 0;

            // Apply annual randomness (±10%)
            const annualRandomness = 0.9 + Math.random() * 0.2;

            this.trees.forEach(tree => {
                const growth = tree.calculateYearlyGrowth(co2, sunlight, temp, annualRandomness);
                totalYearlySugar += growth.sugar;
                totalYearlyWood += growth.wood;
                totalBiomass += tree.woodBiomass;
            });

            yearlyData.push({
                year,
                co2,
                sunlight,
                temp,
                sugar: totalYearlySugar,
                wood: totalYearlyWood,
                biomass: totalBiomass
            });

            trialTotalSugar += totalYearlySugar;
            trialTotalWood += totalYearlyWood;
        }

        this.trials.push({
            id: this.trials.length + 1,
            inputs: { co2, sunlight, temp },
            yearlyData,
            summary: { totalSugar: trialTotalSugar, totalWood: trialTotalWood }
        });

        this.updateChart();
        this.updateTable(yearlyData);
        this.updateSummary(trialTotalSugar, trialTotalWood);
        this.updateUI();
    },

    updateChart() {
        const colors = [
            { sugar: '#FFD54F', wood: '#8D6E63' }, // Trial 1
            { sugar: '#FFB300', wood: '#5D4037' }, // Trial 2
            { sugar: '#FFA000', wood: '#3E2723' }  // Trial 3
        ];

        this.chart.data.datasets = [];

        this.trials.forEach((trial, index) => {
            const colorSet = colors[index];

            // Sugar Dataset
            this.chart.data.datasets.push({
                label: `Trial ${trial.id}: Sugar (kg)`,
                data: trial.yearlyData.map(d => d.sugar),
                borderColor: colorSet.sugar,
                backgroundColor: colorSet.sugar + '33',
                yAxisID: 'ySugar',
                tension: 0.3,
                pointRadius: 2
            });

            // Wood Dataset
            this.chart.data.datasets.push({
                label: `Trial ${trial.id}: Wood (kg)`,
                data: trial.yearlyData.map(d => d.wood),
                borderColor: colorSet.wood,
                backgroundColor: colorSet.wood + '33',
                yAxisID: 'yWood',
                borderDash: [5, 5],
                tension: 0.3,
                pointRadius: 2
            });
        });

        this.chart.update();
    },

    updateTable(data) {
        const tbody = document.querySelector('#data-table tbody');
        tbody.innerHTML = '';

        data.forEach(row => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${row.year}</td>
                <td>${row.co2}</td>
                <td>${row.sunlight}%</td>
                <td>${row.temp}°C</td>
                <td>${row.sugar.toFixed(2)}</td>
                <td>${row.wood.toFixed(2)}</td>
                <td>${row.biomass.toFixed(1)}</td>
            `;
            tbody.appendChild(tr);
        });
    },

    updateSummary(sugar, wood) {
        const results = document.getElementById('trial-results');
        results.classList.remove('hidden');
        document.getElementById('total-syrup').innerText = sugar.toLocaleString(undefined, {maximumFractionDigits: 1});
        document.getElementById('total-wood').innerText = wood.toLocaleString(undefined, {maximumFractionDigits: 1});
    },

    updateUI() {
        document.getElementById('trial-count').innerText = `Trials: ${this.trials.length} / ${this.maxTrials}`;

        const runBtn = document.getElementById('run-trial-btn');
        if (this.trials.length >= this.maxTrials) {
            runBtn.disabled = true;
            runBtn.innerText = "Trials Full";
        } else {
            runBtn.disabled = false;
            runBtn.innerText = "Run 50-Year Trial";
        }

        // Update Grove Visualization based on biomass
        const container = document.getElementById('grove-container');
        container.innerHTML = '';
        this.trees.forEach(tree => {
            const treeEl = document.createElement('div');
            treeEl.className = 'tree-item';

            // Scale based on biomass (normalized)
            const scale = 0.3 + (tree.woodBiomass / 500);

            treeEl.innerHTML = `
                <svg viewBox="0 0 100 100" style="width:30px; height:30px; transform: scale(${Math.min(scale, 2)})">
                    <rect x="45" y="60" width="10" height="40" fill="#5D4037" />
                    <circle cx="50" cy="40" r="30" fill="#2E7D32" />
                </svg>
            `;
            container.appendChild(treeEl);
        });

        // Update slider values display
        document.getElementById('co2-val').innerText = document.getElementById('co2-slider').value + ' ppm';
        document.getElementById('sunlight-val').innerText = document.getElementById('sunlight-slider').value + '%';
        document.getElementById('temp-val').innerText = document.getElementById('temp-slider').value + '°C';
    },

    attachEventListeners() {
        document.getElementById('run-trial-btn').addEventListener('click', () => this.runTrial());

        document.getElementById('reset-btn').addEventListener('click', () => {
            this.trials = [];
            this.createBasePopulation(30);
            this.resetTrees();
            this.updateChart();
            document.querySelector('#data-table tbody').innerHTML = '';
            document.getElementById('trial-results').classList.add('hidden');
            this.updateUI();
        });

        ['co2-slider', 'sunlight-slider', 'temp-slider'].forEach(id => {
            document.getElementById(id).addEventListener('input', () => this.updateUI());
        });
    }
};

window.onload = () => Simulation.init();
