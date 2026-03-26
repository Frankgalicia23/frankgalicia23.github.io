/* lizard-script.js */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Setup Chart.js
    const ctx = document.getElementById('selectionChart').getContext('2d');
    let chart;

    // Population Parameters
    const range = Array.from({ length: 101 }, (_, i) => i); // 0 to 100 tail length units
    const initialMean = 50;
    const initialStdDev = 10;

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
        valDisplays.temp.textContent = vals.temp === 0 ? "Neutral" : (vals.temp > 0 ? `+${vals.temp}°C Warmer` : `${vals.temp}°C Cooler`);
        valDisplays.drought.textContent = vals.drought === 0 ? "None" : (vals.drought > 7 ? "Severe" : "Moderate");
        valDisplays.rain.textContent = vals.rain === 0 ? "Normal" : (vals.rain > 7 ? "Heavy" : "Increased");
        valDisplays.altitude.textContent = vals.altitude === 0 ? "Uniform" : (vals.altitude > 7 ? "Extreme Variation" : "Mixed Terrain");
        valDisplays.sunlight.textContent = vals.sunlight === 0 ? "Moderate" : (vals.sunlight > 7 ? "Intense" : "Partial Shade");
        valDisplays.salinity.textContent = vals.salinity === 0 ? "Freshwater" : (vals.salinity > 7 ? "Hypersaline" : "Brackish");
        valDisplays.disaster.textContent = vals.disaster === 0 ? "None" : (vals.disaster > 7 ? "Catastrophic" : "Minor Event");

        // Calculate Simulation Results
        let newMean = initialMean;
        let newStdDev = initialStdDev;
        let isBimodal = false;
        let peak2Mean = 70;

        // Directional logic: Climate and Disaster shift the mean
        // +Temp -> Shorter tails (heat dissipation?), +Rain -> Longer tails (balance in wet terrain?)
        newMean += (vals.temp * 2);
        newMean -= (vals.drought * 1.5);
        newMean += (vals.rain * 1.2);
        newMean -= (vals.disaster * 2); // Disasters in this model favor smaller/shorter-tailed lizards

        // Diversifying logic: Geography and Temp mix splits the population
        if (vals.altitude > 3 || vals.salinity > 3 || vals.sunlight > 5 || (vals.altitude > 0 && Math.abs(vals.temp) > 3)) {
            isBimodal = true;
            // First peak moves left, second peak moves right based on "diversity" intensity
            // Increased multipliers to reach ~20 and ~80 extremes
            const baseSpread = (vals.altitude * 1.5) + (vals.salinity * 1.2) + (vals.sunlight * 1.0);
            const tempSpreadBoost = Math.abs(vals.temp) * 1.5;
            const spread = baseSpread + tempSpreadBoost;

            const baseMean = 50; // Central anchor for disruptive selection
            newMean = baseMean - spread;
            peak2Mean = baseMean + spread;
            newStdDev = initialStdDev - 3; // Even narrower peaks for "deep valley"
        }

        // Stabilizing logic: If everything is near neutral, narrow the distribution
        const totalActivity = Object.values(vals).reduce((acc, v) => acc + Math.abs(v), 0);
        if (totalActivity < 3) {
            newStdDev = initialStdDev - 4; // Very narrow around the mean
            selectionTypeDisplay.textContent = "Stabilizing";
            selectionDescDisplay.textContent = "In a stable environment, lizards with average tail lengths are most likely to survive and reproduce. Extreme variations are selected against.";
        } else if (isBimodal) {
            selectionTypeDisplay.textContent = "Diversifying (Disruptive)";
            selectionDescDisplay.textContent = `Varied environmental conditions favor both extremes. Average-length tails are at a disadvantage. Population Means: ${Math.round(newMean)} & ${Math.round(peak2Mean)}`;
        } else {
            selectionTypeDisplay.textContent = "Directional";
            selectionDescDisplay.textContent = "A change in the environment (climate or disaster) favors one extreme of the tail length spectrum, shifting the entire population mean.";
        }

        // Clamp Mean
        newMean = Math.max(10, Math.min(90, newMean));
        peak2Mean = Math.max(10, Math.min(90, peak2Mean));

        // Update Chart
        chart.data.datasets[1].data = generateCurveData(newMean, newStdDev, isBimodal, peak2Mean);
        chart.update();

        // Update Lizards
        updateLizardVisuals(newMean, isBimodal, peak2Mean);
    }

    function updateLizardVisuals(mean, bimodal, p2m) {
        // Simple logic to adjust SVG tail lengths
        // In a real app, we'd adjust the 'd' attribute of the tail path
        const tails = document.querySelectorAll('.lizard-svg .tail');
        // This is a simplification - real visual feedback is provided by the chart
        // but let's highlight which lizard is currently "optimal"
        document.querySelectorAll('.lizard-item').forEach(item => item.style.border = 'none');

        if (bimodal) {
            document.getElementById('short-tail-lizard').parentElement.style.border = '2px solid gold';
            document.getElementById('long-tail-lizard').parentElement.style.border = '2px solid gold';
        } else if (mean < 40) {
            document.getElementById('short-tail-lizard').parentElement.style.border = '2px solid gold';
        } else if (mean > 60) {
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
                    title: { display: true, text: 'Tail Length (Relative Units)' },
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
