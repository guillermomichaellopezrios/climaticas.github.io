const searchBtn = document.getElementById("searchBtn");
const cityInput = document.getElementById("cityInput");
const daysInput = document.getElementById("days");
const unitSelect = document.getElementById("unit");

const statusBox = document.getElementById("status");
const statusText = document.getElementById("statusText");
const chartContainer = document.querySelector(".chart-container");
const legendText = document.getElementById("legendText");

let weatherChart = null;

// EVENTO BOTÓN
searchBtn.addEventListener("click", () => {
  const city = cityInput.value.trim();
  if (!city) {
    showError("Escribe el nombre de una ciudad");
    return;
  }
  loadWeather(city);
});

// FUNCIÓN PRINCIPAL
async function loadWeather(city) {
  try {
    showLoading("Buscando ubicación...");

    // GEOLOCALIZACIÓN
    const geoRes = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${city}&count=1&language=es`
    );
    const geoData = await geoRes.json();

    if (!geoData.results || geoData.results.length === 0) {
      showError("Ciudad no encontrada");
      return;
    }

    const { latitude, longitude, name, country } = geoData.results[0];

    showLoading("Obteniendo clima...");

    const days = daysInput.value;
    const unit = unitSelect.value;

    const tempUnit =
      unit === "fahrenheit" ? "&temperature_unit=fahrenheit" : "";

    const url = `
      https://api.open-meteo.com/v1/forecast
      ?latitude=${latitude}
      &longitude=${longitude}
      &daily=temperature_2m_max,temperature_2m_min
      &forecast_days=${days}
      &timezone=auto
      ${tempUnit}
    `;

    const weatherRes = await fetch(url);
    const weatherData = await weatherRes.json();

    if (!weatherData.daily) {
      showError("No se pudieron obtener los datos");
      return;
    }

    renderChart(
      weatherData.daily.time,
      weatherData.daily.temperature_2m_max,
      weatherData.daily.temperature_2m_min,
      unit,
      name,
      country
    );

    showChart();

  } catch (error) {
    console.error(error);
    showError("Error al conectar con la API");
  }
}

// GRÁFICA
function renderChart(labels, maxTemps, minTemps, unit, city, country) {
  const ctx = document.getElementById("weatherChart");

  if (weatherChart) weatherChart.destroy();

  weatherChart = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: `Máx (${unit === "fahrenheit" ? "°F" : "°C"})`,
          data: maxTemps,
          borderWidth: 3,
          tension: 0.4
        },
        {
          label: `Mín (${unit === "fahrenheit" ? "°F" : "°C"})`,
          data: minTemps,
          borderWidth: 3,
          tension: 0.4
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: `Clima en ${city}, ${country}`
        },
        legend: {
          labels: {
            usePointStyle: true
          }
        }
      },
      interaction: {
        mode: "index",
        intersect: false
      },
      scales: {
        y: {
          title: {
            display: true,
            text: unit === "fahrenheit" ? "°F" : "°C"
          }
        }
      }
    }
  });

  legendText.innerHTML = `
    📍 <strong>${city}, ${country}</strong><br>
    🔴 Temperatura máxima<br>
    🔵 Temperatura mínima
  `;
}

// ESTADOS VISUALES
function showLoading(text) {
  statusBox.classList.remove("hidden");
  chartContainer.classList.add("hidden");
  statusText.textContent = text;
}

function showChart() {
  statusBox.classList.add("hidden");
  chartContainer.classList.remove("hidden");
}

function showError(msg) {
  statusBox.classList.remove("hidden");
  chartContainer.classList.add("hidden");
  statusText.textContent = msg;
}
