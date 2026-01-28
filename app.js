const btn = document.getElementById("btnBuscar");
const estado = document.getElementById("estado");
const ctx = document.getElementById("climaChart");
const inputCiudad = document.getElementById("ciudad");

let chart = null;

btn.addEventListener("click", buscarCiudad);

async function buscarCiudad() {
  try {
    const ciudad = inputCiudad.value.trim();

    if (!ciudad) {
      estado.textContent = "⚠️ Escribe una ciudad";
      return;
    }

    estado.textContent = "🔍 Buscando ciudad...";

    // 1️⃣ Geocoding (ciudad → lat/lon)
    const geoURL = `https://geocoding-api.open-meteo.com/v1/search?name=${ciudad}&count=1&language=es`;
    const geoResp = await fetch(geoURL);
    const geoData = await geoResp.json();

    if (!geoData.results || geoData.results.length === 0) {
      throw new Error("Ciudad no encontrada");
    }

    const { latitude, longitude, name, country } = geoData.results[0];

    obtenerClima(latitude, longitude, name, country);

  } catch (error) {
    estado.textContent = "❌ Ciudad no encontrada";
  }
}

async function obtenerClima(lat, lon, nombre, pais) {
  try {
    estado.textContent = "⏳ Cargando clima...";

    // Control de memoria
    if (chart) {
      chart.destroy();
    }

    const climaURL = `
      https://api.open-meteo.com/v1/forecast
      ?latitude=${lat}
      &longitude=${lon}
      &daily=temperature_2m_max
      &forecast_days=10
      &timezone=auto
    `;

    const resp = await fetch(climaURL);
    if (!resp.ok) throw new Error("Error clima");

    const data = await resp.json();

    // Transformación de datos
    const fechas = data.daily.time;
    const temperaturas = data.daily.temperature_2m_max;

    // Color dinámico
    const promedio =
      temperaturas.reduce((a, b) => a + b, 0) / temperaturas.length;

    let color = "#4caf50";
    if (promedio > 30) color = "red";
    if (promedio < 10) color = "blue";

    estado.textContent = `📍 ${nombre}, ${pais}`;

    chart = new Chart(ctx, {
      type: "line",
      data: {
        labels: fechas,
        datasets: [{
          label: "Temperatura Máx (°C)",
          data: temperaturas,
          borderColor: color,
          backgroundColor: color,
          tension: 0.4,
          pointRadius: 5
        }]
      },
      options: {
        responsive: true,
        plugins: {
          tooltip: {
            enabled: true
          }
        }
      }
    });

  } catch (error) {
    estado.textContent = "❌ Error al obtener clima";
  }
}
