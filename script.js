let myChart = null; // Variable para control de memoria

const searchBtn = document.getElementById('searchBtn');
const cityInput = document.getElementById('cityInput');
const loader = document.getElementById('loader');
const errorMsg = document.getElementById('errorMessage');

searchBtn.addEventListener('click', () => {
    const city = cityInput.value.trim();
    if (city) getWeatherData(city);
});

async function getWeatherData(city) {
    // 1. Gestión de estados: Cargando
    loader.style.display = 'block';
    errorMsg.textContent = '';
    if (myChart) myChart.destroy(); // Control de memoria: destruir gráfica anterior

    try {
        // Geocodificación: Ciudad -> Coordenadas
        const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${city}&count=1&language=es&format=json`);
        const geoData = await geoRes.json();

        if (!geoData.results) throw new Error("Ciudad no encontrada");

        const { latitude, longitude, name } = geoData.results[0];

        // Petición de Clima (Próximos 7 días)
        const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=temperature_2m_max&timezone=auto`);
        const weatherData = await weatherRes.json();

        // Transformación de datos
        const labels = weatherData.daily.time; // Eje X (Fechas)
        const temps = weatherData.daily.temperature_2m_max; // Eje Y (Temperaturas)

        renderChart(labels, temps, name);
    } catch (err) {
        errorMsg.textContent = `Error: ${err.message}`;
    } finally {
        loader.style.display = 'none';
    }
}

function renderChart(labels, data, cityName) {
    const ctx = document.getElementById('weatherChart').getContext('2d');

    // Lógica de indicadores visuales por punto
    const pointColors = data.map(temp => {
        if (temp > 30) return '#ff4d4d'; // Rojo si > 30
        if (temp < 10) return '#3b82f6'; // Azul si < 10
        return '#6366f1'; // Color base
    });

    myChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: `Temp. Máxima en ${cityName} (°C)`,
                data: data,
                borderColor: '#6366f1',
                pointBackgroundColor: pointColors,
                pointRadius: 6,
                tension: 0.3, // Curvatura de la línea
                fill: false
            }]
        },
        options: {
            responsive: true,
            plugins: {
                tooltip: { enabled: true } // Interactividad activa
            },
            scales: {
                y: { beginAtZero: false }
            }
        }
    });
}
