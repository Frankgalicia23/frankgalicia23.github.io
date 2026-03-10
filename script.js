document.addEventListener('DOMContentLoaded', () => {
    // Accordion Logic
    const accordionHeaders = document.querySelectorAll('.accordion-header');

    function toggleAccordion(header, state) {
        const content = header.nextElementSibling;
        const isOpen = state !== undefined ? state : content.style.display === 'block';

        // Close all other accordion items
        document.querySelectorAll('.accordion-content').forEach(item => {
            item.style.display = 'none';
        });

        // Set current item
        content.style.display = isOpen ? 'none' : 'block';

        if (!isOpen) {
            header.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }

    accordionHeaders.forEach(header => {
        header.addEventListener('click', () => {
            toggleAccordion(header);
        });
    });

    // Interactive SVG Logic
    const svgOrgans = document.querySelectorAll('.svg-organ');
    svgOrgans.forEach(organ => {
        organ.addEventListener('click', () => {
            const targetId = organ.getAttribute('data-target');
            const targetAccordionItem = document.getElementById(targetId);
            if (targetAccordionItem) {
                const header = targetAccordionItem.querySelector('.accordion-header');
                toggleAccordion(header, false); // false means "is not open", so it will open it
            }
        });
    });

    // Lock and Key Interaction
    const triggerBtn = document.getElementById('trigger-reaction');
    const substrate = document.getElementById('substrate-model');
    const enzyme = document.getElementById('enzyme-model');
    let isReacting = false;

    triggerBtn.addEventListener('click', () => {
        if (isReacting) return;
        isReacting = true;

        // Reset state if needed
        substrate.style.transition = 'all 1s ease';
        substrate.textContent = 'Substrate';
        substrate.style.backgroundColor = '#ffb74d';
        substrate.style.width = '60px';

        // Step 1: Substrate moves into enzyme
        substrate.style.top = '105px'; // Aligns with the notch in the enzyme

        setTimeout(() => {
            // Step 2: Enzyme-Substrate Complex
            substrate.textContent = 'Complex';
            substrate.style.backgroundColor = '#ffa726';

            setTimeout(() => {
                // Step 3: Reaction occurs - split into products
                substrate.textContent = 'Products';
                substrate.style.backgroundColor = '#81c784';
                substrate.style.width = '30px'; // Visually smaller/split

                // Step 4: Products leave
                setTimeout(() => {
                    substrate.style.top = '280px';

                    setTimeout(() => {
                        // Reset for next time
                        substrate.style.transition = 'none';
                        substrate.style.top = '20px';
                        substrate.style.width = '60px';
                        substrate.textContent = 'Substrate';
                        substrate.style.backgroundColor = '#ffb74d';
                        isReacting = false;
                    }, 1000);
                }, 1000);
            }, 1000);
        }, 1000);
    });

    // Enzyme Simulation Logic
    const ctx = document.getElementById('enzymeChart').getContext('2d');
    const tempSlider = document.getElementById('temp-slider');
    const phSlider = document.getElementById('ph-slider');
    const salinitySlider = document.getElementById('salinity-slider');
    const concSlider = document.getElementById('concentration-slider');
    const enzymeTypeSelect = document.getElementById('enzyme-type');
    const warning = document.getElementById('denature-warning');

    const tempVal = document.getElementById('temp-val');
    const phVal = document.getElementById('ph-val');
    const salinityVal = document.getElementById('salinity-val');
    const concVal = document.getElementById('concentration-val');

    let chart;

    const enzymeProfiles = {
        amylase: { optTemp: 37, optPh: 7.0, rangePh: 2.0 },
        pepsin: { optTemp: 37, optPh: 2.0, rangePh: 1.5 },
        trypsin: { optTemp: 37, optPh: 8.0, rangePh: 1.5 }
    };

    function calculateReactionRate() {
        const temp = parseFloat(tempSlider.value);
        const ph = parseFloat(phSlider.value);
        const salinity = parseFloat(salinitySlider.value);
        const concentration = parseFloat(concSlider.value);
        const enzyme = enzymeProfiles[enzymeTypeSelect.value];

        // 1. Temperature Effect (Bell curve with steep drop for denaturation)
        let tempFactor = Math.exp(-Math.pow(temp - enzyme.optTemp, 2) / 400);
        if (temp > enzyme.optTemp + 15) {
            tempFactor *= Math.max(0, 1 - (temp - (enzyme.optTemp + 15)) / 20);
        }

        // 2. pH Effect (Narrow bell curve)
        const phFactor = Math.exp(-Math.pow(ph - enzyme.optPh, 2) / (2 * Math.pow(enzyme.rangePh, 2)));

        // 3. Salinity Effect (Simple inhibition at high salinity)
        const salinityFactor = Math.max(0, 1 - Math.pow(salinity - 0.15, 2));

        // 4. Concentration Effect (Michaelis-Menten-like)
        const concFactor = concentration / (concentration + 20);

        const rate = 100 * tempFactor * phFactor * salinityFactor * concFactor;

        // Show/Hide Denaturation Warning
        if (tempFactor < 0.1 && temp > enzyme.optTemp) {
            warning.classList.remove('hidden');
        } else {
            warning.classList.add('hidden');
        }

        return Math.max(0, rate);
    }

    function updateChart() {
        tempVal.textContent = tempSlider.value;
        phVal.textContent = phSlider.value;
        salinityVal.textContent = salinitySlider.value;
        concVal.textContent = concSlider.value;

        const currentRate = calculateReactionRate();

        // Simple visualization: Current Rate vs. Time (simulated)
        // Or just a bar chart showing the current efficiency
        chart.data.datasets[0].data = [currentRate];
        chart.update();
    }

    function initChart() {
        chart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Reaction Rate (%)'],
                datasets: [{
                    label: 'Efficiency',
                    data: [0],
                    backgroundColor: '#2e7d32',
                    borderColor: '#1b5e20',
                    borderWidth: 1
                }]
            },
            options: {
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        title: { display: true, text: 'Reaction Rate (%)' }
                    }
                },
                plugins: {
                    legend: { display: false }
                },
                responsive: true,
                maintainAspectRatio: false
            }
        });
        updateChart();
    }

    [tempSlider, phSlider, salinitySlider, concSlider, enzymeTypeSelect].forEach(el => {
        el.addEventListener('input', updateChart);
    });

    initChart();

    // Medical Mysteries Logic
    const mysteries = [
        {
            title: "Case #1: The Bloated Baker",
            symptoms: "Patient reports severe abdominal bloating, gas, and diarrhea shortly after consuming dairy products. Symptoms began in early adulthood. Breath test shows high hydrogen levels.",
            options: [
                { text: "Stomach / Pepsin", correct: false },
                { text: "Small Intestine / Lactase", correct: true },
                { text: "Liver / Bile", correct: false },
                { text: "Large Intestine / Amylase", correct: false }
            ],
            explanation: "Correct! Lactase is the enzyme in the small intestine that breaks down lactose (milk sugar). Deficiency leads to undigested lactose being fermented by bacteria in the large intestine, causing gas and bloating."
        },
        {
            title: "Case #2: The Oily Office Worker",
            symptoms: "Patient presents with pale, oily stools that float (steatorrhea) and unintentional weight loss. Blood tests show deficiency in vitamins A, D, and K. Pain is felt in the upper right quadrant after fatty meals.",
            options: [
                { text: "Mouth / Amylase", correct: false },
                { text: "Stomach / HCl", correct: false },
                { text: "Pancreas / Lipase", correct: true },
                { text: "Large Intestine / Water absorption", correct: false }
            ],
            explanation: "Correct! Pancreatic lipase is essential for breaking down fats. If the pancreas is not producing enough lipase (or bile is blocked), fats aren't absorbed, leading to oily stools and fat-soluble vitamin deficiency."
        },
        {
            title: "Case #3: The Burning Night Owl",
            symptoms: "Patient complains of a 'sour taste' in their mouth and a burning sensation in the chest (heartburn) that worsens when lying down after a large meal. Endoscopy shows irritation of the lower esophagus.",
            options: [
                { text: "Lower Esophageal Sphincter / Acid Reflux", correct: true },
                { text: "Pyloric Sphincter / Chyme", correct: false },
                { text: "Small Intestine / Ulcer", correct: false },
                { text: "Salivary Glands / Dry Mouth", correct: false }
            ],
            explanation: "Correct! This is GERD (Gastroesophageal Reflux Disease). The lower esophageal sphincter fails to close properly, allowing acidic stomach contents to flow back into the esophagus, causing irritation."
        }
    ];

    let currentMysteryIndex = 0;
    const mysteryTitle = document.getElementById('mystery-title');
    const mysterySymptoms = document.getElementById('mystery-symptoms');
    const mysteryOptionsContainer = document.querySelector('.mystery-options');
    const mysteryFeedback = document.getElementById('mystery-feedback');
    const mysteryCount = document.getElementById('mystery-count');
    const prevBtn = document.getElementById('prev-mystery');
    const nextBtn = document.getElementById('next-mystery');

    function loadMystery(index) {
        const mystery = mysteries[index];
        mysteryTitle.textContent = mystery.title;
        mysterySymptoms.textContent = mystery.symptoms;
        mysteryCount.textContent = `Case ${index + 1} of ${mysteries.length}`;

        mysteryOptionsContainer.innerHTML = '';
        mystery.options.forEach(opt => {
            const btn = document.createElement('button');
            btn.className = 'mystery-opt';
            btn.textContent = opt.text;
            btn.addEventListener('click', () => handleOptionClick(btn, opt.correct, mystery.explanation));
            mysteryOptionsContainer.appendChild(btn);
        });

        mysteryFeedback.className = 'feedback hidden';
        prevBtn.disabled = index === 0;
        nextBtn.disabled = index === mysteries.length - 1;
    }

    function handleOptionClick(btn, isCorrect, explanation) {
        // Disable all buttons after choice
        const allBtns = mysteryOptionsContainer.querySelectorAll('.mystery-opt');
        allBtns.forEach(b => b.disabled = true);

        if (isCorrect) {
            btn.classList.add('correct');
            mysteryFeedback.textContent = explanation;
            mysteryFeedback.className = 'feedback correct';
        } else {
            btn.classList.add('incorrect');
            mysteryFeedback.textContent = "Not quite. Try thinking about which organ or enzyme matches the specific symptoms.";
            mysteryFeedback.className = 'feedback incorrect';

            // Highlight correct one after a delay or just allow retry
            setTimeout(() => {
                allBtns.forEach(b => b.disabled = false);
            }, 2000);
        }
    }

    prevBtn.addEventListener('click', () => {
        if (currentMysteryIndex > 0) {
            currentMysteryIndex--;
            loadMystery(currentMysteryIndex);
        }
    });

    nextBtn.addEventListener('click', () => {
        if (currentMysteryIndex < mysteries.length - 1) {
            currentMysteryIndex++;
            loadMystery(currentMysteryIndex);
        }
    });

    loadMystery(0);

    // Smooth Scrolling for navigation links
    document.querySelectorAll('nav a').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);

            if (targetElement) {
                window.scrollTo({
                    top: targetElement.offsetTop - 70, // Offset for sticky nav
                    behavior: 'smooth'
                });
            }
        });
    });
});
