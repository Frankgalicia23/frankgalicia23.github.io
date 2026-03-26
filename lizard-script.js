/* lizard-script.js */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Setup Chart.js
    const ctx = document.getElementById('selectionChart').getContext('2d');
    let chart;

    // Population Parameters
    // Tail Length Range: 5cm to 30cm
    const range = Array.from({ length: 26 }, (_, i) => i + 5);
    const initialMean = 15;
    const initialStdDev = 3;

    // Normal Distribution Helper
    function normalDist(x, mean, stdDev) {
        return (1 / (stdDev * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * Math.pow((x - mean) / stdDev, 2));
    }

    // Generate Data for a Single Curve
    function generateCurveData(mean, stdDev, isBimodal = false, peak2Mean = 70) {
        if (isBimodal) {
            // Mix of two normal distributions with narrower peaks for deep valley
            const peakStdDev = stdDev / 2;
            return range.map(x => (normalDist(x, mean, peakStdDev) + normalDist(x, peak2Mean, peakStdDev)) / 2);
        }
        return range.map(x => normalDist(x, mean, stdDev));
    }

    // 2. Control Logic
    const sliders = {
        temp: document.getElementById('temp-slider'),
        drought: document.getElementById('drought-slider'),
        rain: document.getElementById('rain-slider'),
        altitude: document.getElementById('altitude-slider'),
        sunlight: document.getElementById('sunlight-slider'),
        salinity: document.getElementById('salinity-slider'),
        disaster: document.getElementById('disaster-slider')
    };

    const valDisplays = {
        temp: document.getElementById('temp-val'),
        drought: document.getElementById('drought-val'),
        rain: document.getElementById('rain-val'),
        altitude: document.getElementById('altitude-val'),
        sunlight: document.getElementById('sunlight-val'),
        salinity: document.getElementById('salinity-val'),
        disaster: document.getElementById('disaster-val')
    };

    const selectionTypeDisplay = document.getElementById('selection-type');
    const selectionDescDisplay = document.getElementById('selection-desc');
    const resetBtn = document.getElementById('reset-btn');

    function updateSimulation() {
        // Collect current values
        const vals = {
            temp: parseInt(sliders.temp.value),
            drought: parseInt(sliders.drought.value),
            rain: parseInt(sliders.rain.value),
            altitude: parseInt(sliders.altitude.value),
            sunlight: parseInt(sliders.sunlight.value),
            salinity: parseInt(sliders.salinity.value),
            disaster: parseInt(sliders.disaster.value)
        };

        // Update Text Labels
        valDisplays.temp.textContent = `${vals.temp}°C`;
        valDisplays.drought.textContent = `${vals.drought} Years`;
        valDisplays.rain.textContent = `${vals.rain} mm`;
        valDisplays.altitude.textContent = `${vals.altitude} m`;
        valDisplays.sunlight.textContent = `${vals.sunlight} hrs/day`;
        valDisplays.salinity.textContent = `${vals.salinity} ppt`;
        valDisplays.disaster.textContent = `${vals.disaster}%`;

        // Calculate Simulation Results
        let newMean = initialMean;
        let newStdDev = initialStdDev;
        let isBimodal = false;
        let peak2Mean = 25;

        // Neutral Points
        const neutral = {
            temp: 25,
            rain: 1000,
            altitude: 500,
            sunlight: 8
        };

        // Directional logic:
        // +Temp -> Longer tails (heat dissipation)
        newMean += (vals.temp - neutral.temp) * 0.4;
        // +Rain -> Longer tails (climbing/balance)
        newMean += (vals.rain - neutral.rain) * 0.003;
        // +Drought -> Shorter tails
        newMean -= (vals.drought) * 0.8;
        // +Habitat Loss -> Shorter tails
        newMean -= (vals.disaster) * 0.1;

        // Diversifying logic: Geography and extremes split the population
        const altitudeDev = Math.abs(vals.altitude - neutral.altitude);
        if (vals.altitude > 2000 || vals.salinity > 15 || vals.sunlight > 11 || (altitudeDev > 1000 && Math.abs(vals.temp - neutral.temp) > 10)) {
            isBimodal = true;

            const baseSpread = (vals.altitude / 1000 * 1.5) + (vals.salinity / 10 * 1.2) + (Math.abs(vals.sunlight - neutral.sunlight) * 0.5);
            const tempSpreadBoost = Math.abs(vals.temp - neutral.temp) * 0.1;
            const spread = baseSpread + tempSpreadBoost;

            const baseMean = 15;
            newMean = baseMean - spread;
            peak2Mean = baseMean + spread;
            newStdDev = initialStdDev * 0.6;
        }

        // Stabilizing logic: If everything is near neutral, narrow the distribution
        const tempDev = Math.abs(vals.temp - neutral.temp);
        const rainDev = Math.abs(vals.rain - neutral.rain);
        const altDev = Math.abs(vals.altitude - neutral.altitude);
        const sunDev = Math.abs(vals.sunlight - neutral.sunlight);

        if (tempDev < 5 && rainDev < 500 && altDev < 500 && sunDev < 2 && vals.drought === 0 && vals.salinity === 0 && vals.disaster === 0) {
            newStdDev = initialStdDev * 0.7;
            selectionTypeDisplay.textContent = "Stabilizing";
            selectionDescDisplay.textContent = "In a stable environment, lizards with average tail lengths are most likely to survive and reproduce. Extreme variations are selected against.";
        } else if (isBimodal) {
            selectionTypeDisplay.textContent = "Diversifying (Disruptive)";
            selectionDescDisplay.textContent = `Varied environmental conditions favor both extremes. Average-length tails are at a disadvantage. Population Means: ${Math.round(newMean)} & ${Math.round(peak2Mean)}`;
        } else {
            selectionTypeDisplay.textContent = "Directional";
            selectionDescDisplay.textContent = "A change in the environment (climate or disaster) favors one extreme of the tail length spectrum, shifting the entire population mean.";
        }

        // Clamp Mean (Range 5-30)
        newMean = Math.max(7, Math.min(28, newMean));
        peak2Mean = Math.max(7, Math.min(28, peak2Mean));

        // Update Chart
        chart.data.datasets[1].data = generateCurveData(newMean, newStdDev, isBimodal, peak2Mean);
        chart.update();

        // Update Lizards
        updateLizardVisuals(newMean, isBimodal, peak2Mean);
    }

    function updateLizardVisuals(mean, bimodal, p2m) {
        document.querySelectorAll('.lizard-item').forEach(item => item.style.border = 'none');

        if (bimodal) {
            document.getElementById('short-tail-lizard').parentElement.style.border = '2px solid gold';
            document.getElementById('long-tail-lizard').parentElement.style.border = '2px solid gold';
        } else if (mean < 12) {
            document.getElementById('short-tail-lizard').parentElement.style.border = '2px solid gold';
        } else if (mean > 18) {
            document.getElementById('long-tail-lizard').parentElement.style.border = '2px solid gold';
        } else {
            document.getElementById('avg-tail-lizard').parentElement.style.border = '2px solid gold';
        }
    }

    // Initialize Chart
    chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: range,
            datasets: [
                {
                    label: 'Original Population',
                    data: generateCurveData(initialMean, initialStdDev),
                    borderColor: 'rgba(100, 100, 100, 0.5)',
                    backgroundColor: 'rgba(100, 100, 100, 0.1)',
                    fill: true,
                    pointRadius: 0,
                    borderDash: [5, 5]
                },
                {
                    label: 'Current Population',
                    data: generateCurveData(initialMean, initialStdDev),
                    borderColor: '#2E7D32',
                    backgroundColor: 'rgba(76, 175, 80, 0.3)',
                    fill: true,
                    pointRadius: 0,
                    tension: 0.4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    title: { display: true, text: 'Tail Length (cm)' },
                    grid: { display: false }
                },
                y: {
                    title: { display: true, text: 'Population Density' },
                    beginAtZero: true,
                    ticks: { display: false }
                }
            },
            plugins: {
                legend: { position: 'top' },
                tooltip: { enabled: false }
            }
        }
    });

    // Add Event Listeners
    Object.values(sliders).forEach(slider => {
        slider.addEventListener('input', updateSimulation);
    });

    resetBtn.addEventListener('click', () => {
        Object.values(sliders).forEach(s => s.value = s.defaultValue);
        updateSimulation();
    });

    // Run once on load
    updateSimulation();
});
