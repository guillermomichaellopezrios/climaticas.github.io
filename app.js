const btn = document.getElementById("btnSearch");
const input = document.getElementById("cityInput");
const statusBox = document.getElementById("status");
const chartBox = document.getElementById("chartBox");
const legendBox = document.getElementById("legend");

let chart = null;

btn.addEventListener("click", () => {
  if (!input.value.trim()) {
    showError("Escribe una ciudad o coordenadas 🙂");
    return;
  }
  loadWeather(input.value.trim());
});

async function loadWeather(query) {
  try {
    showLoading();

    const startDate = document.getElementById("dateInput").value;
    const days = document.getElementById("daysSelect").value;

    if (!startDate) {
      showError("Selecciona una fecha");
      return;
    }

    // Límite API (16 días)
    const today = new Date();
    const maxDate = new Date();
    maxDate.setDate(today.getDate() + 16);

    if (new Date(startDate) > maxDate) {
      showError("El pronóstico solo permite hasta 16 días");
      return;
    }

    let lat, lon;

    // Coordenadas directas
    if (query.includes(",")) {
      [lat, lon] = query.split(",").map(v => v.trim());
    } 
    // Ciudad → Geocoding
    else {
      const geoRes = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${query}`
      );
      const geoData = await geoRes.json();

      if (!geoData.results || geoData.results.length === 0) {
        showError("No se encontró la ciudad");
        return;
      }

      lat = geoData.results[0].latitude;
      lon = geoData.results[0].longitude;
    }

    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + parseInt(days));
    const endStr = endDate.toISOString().split("T")[0];

    const url = `
      https://api.open-meteo.com/v1/forecast
      ?latitude=${lat}
      &longitude=${lon}
      &daily=temperature_2m_max
      &start_date=${startDate}
      &end_date=${endStr}
      &timezone=auto
    `;

    const res = await fetch(url);
    const data = await res.json();

    if (!data.daily) {
      showError("No se pudieron cargar los datos");
      return;
    }

    renderChart(data.daily.time, data.daily.temperature_2m_max);
    updateLegend(data.daily.temperature_2m_max);
    showChart();

  } catch (err) {
    console.error(err);
    showError("Ocurrió un error al consultar el clima");
  }
}

/* =====================
   CHART
===================== */

function renderChart(labels, temps) {
  if (chart) chart.destroy();

  const ctx = document.getElementById("weatherChart");

  chart = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [{
        label: "Temperatura máxima (°C)",
        data: temps,
        pointRadius: 6,
        pointBackgroundColor: temps.map(t =>
          t > 30 ? "#ff6b6b" : t < 10 ? "#5fa8ff" : "#6bcf9b"
        ),
        borderColor: "#6bcf9b",
        segment: {
          borderColor: c => {
            const t = c.p1.parsed.y;
            return t > 30 ? "#ff6b6b" : t < 10 ? "#5fa8ff" : "#6bcf9b";
          }
        },
        tension: 0.35
      }]
    },
    options: {
      responsive: true,
      interaction: {
        mode: "index",
        intersect: false
      }
    }
  });
}

/* =====================
   LEGEND
===================== */

function updateLegend(temps) {
  const hot = temps.filter(t => t > 30).length;
  const cold = temps.filter(t => t < 10).length;
  const normal = temps.length - hot - cold;

  legendBox.innerHTML = `
    🔴 ${hot} días calurosos<br>
    🔵 ${cold} días fríos<br>
    🟢 ${normal} días templados
  `;
}

/* =====================
   STATES
===================== */

function showLoading() {
  statusBox.classList.remove("hidden");
  chartBox.classList.add("hidden");
  statusBox.innerHTML = `
    <div class="spinner"></div>
    <p>Cargando pronóstico…</p>
  `;
}

function showChart() {
  statusBox.classList.add("hidden");
  chartBox.classList.remove("hidden");
}

function showError(msg) {
  statusBox.classList.remove("hidden");
  chartBox.classList.add("hidden");
  statusBox.innerHTML = `<p>${msg}</p>`;
}
