<script>
const btn = document.getElementById("btnSearch");
const statusBox = document.getElementById("status");
const chartBox = document.getElementById("chartBox");
const daysSelect = document.getElementById("daysSelect");

let chart = null;

btn.addEventListener("click", obtenerClima);

async function obtenerClima() {
  statusBox.classList.remove("hidden");
  chartBox.classList.add("hidden");

  try {
    const days = daysSelect.value;

    // Coordenadas por defecto (CDMX)
    const lat = 19.43;
    const lon = -99.13;

    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max&forecast_days=${days}&timezone=auto`;

    const res = await fetch(url);
    if (!res.ok) throw new Error("Error en la API");

    const data = await res.json();

    const labels = data.daily.time;
    const temps = data.daily.temperature_2m_max;

    mostrarGrafica(labels, temps);

  } catch (error) {
    statusBox.innerHTML = "<p>Error al obtener datos 😕</p>";
  }
}

function mostrarGrafica(labels, temps) {
  statusBox.classList.add("hidden");
  chartBox.classList.remove("hidden");

  if (chart) chart.destroy(); // ✅ control de memoria

  const maxTemp = Math.max(...temps);
  let color = "green";

  if (maxTemp > 30) color = "red";
  if (maxTemp < 10) color = "blue";

  chart = new Chart(weatherChart, {
    type: "line",
    data: {
      labels,
      datasets: [{
        label: "Temperatura Máxima (°C)",
        data: temps,
        borderColor: color,
        backgroundColor: color,
        tension: 0.3,
        pointRadius: 5
      }]
    },
    options: {
      responsive: true,
      plugins: {
        tooltip: { enabled: true }
      }
    }
  });
}
</script>
