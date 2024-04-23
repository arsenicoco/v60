document.getElementById('coffeeInput').addEventListener('input', updateWater);
document.getElementById('waterInput').addEventListener('input', updateCoffee);
document.getElementById('ratioSelect').addEventListener('change', recalculate);

function updateWater() {
    const coffeeGrams = parseFloat(document.getElementById('coffeeInput').value);
    const ratio = parseFloat(document.getElementById('ratioSelect').value);
    const water = coffeeGrams * ratio;
    if (!isNaN(water)) {
        document.getElementById('waterInput').value = water.toFixed(0);
    }
}

function updateCoffee() {
    const waterGrams = parseFloat(document.getElementById('waterInput').value);
    const ratio = parseFloat(document.getElementById('ratioSelect').value);
    const coffee = waterGrams / ratio;
    if (!isNaN(coffee)) {
        document.getElementById('coffeeInput').value = coffee.toFixed(0);
    }
}

function recalculate() {
    if (document.getElementById('coffeeInput').value) {
        updateWater();
    } else if (document.getElementById('waterInput').value) {
        updateCoffee();
    }
}

document.getElementById('startTimer').addEventListener('click', startTimer);
document.getElementById('resetTimer').addEventListener('click', resetTimer);

let timerInterval;
let timeRemaining = 240; // 4 minutes in seconds

function startTimer() {
    clearInterval(timerInterval); // Clear any existing intervals
    timerInterval = setInterval(() => {
        if (timeRemaining <= 0) {
            clearInterval(timerInterval);
            alert("Time's up!");
        } else {
            timeRemaining--;
            displayTime();
        }
    }, 1000);

    document.getElementById('startTimer').classList.add('hidden');
    document.getElementById('resetTimer').classList.remove('hidden');
}

function resetTimer() {
    timeRemaining = 240;
    displayTime();
    clearInterval(timerInterval);
    document.getElementById('startTimer').classList.remove('hidden');
    document.getElementById('resetTimer').classList.add('hidden');
}

function displayTime() {
    const minutes = Math.floor(timeRemaining / 60);
    const seconds = timeRemaining % 60;
    document.getElementById('timerDisplay').innerText = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

// Initialize display
displayTime();
