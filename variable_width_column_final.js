looker.plugins.visualizations.add({
  id: "variable_width_column_final",
  label: "Variable Width Column High",
  options: {},

  // Carregar Highcharts + variwide
  create: function (element, config) {
    element.innerHTML = `<div id="chart" style="width:100%; height:100%;"></div>`;

    // Limpa erros antigos
    if (document.getElementById("highcharts-script")) return;

    const script = document.createElement("script");
    script.id = "highcharts-script";
    script.src = "https://code.highcharts.com/highcharts.js";
    script.onload = () => {
      const variwideScript = document.createElement("script");
      variwideScript.src = "https://code.highcharts.com/modules/variwide.js";
      document.head.appendChild(variwideScript);
    };
    document.head.appendChild(script);
  },

  updateAsync: function (data, element, config, queryResponse, details, done) {
    try {
      // Validar dados
      if (!data || data.length === 0) {
        element.innerHTML = "No data available.";
        done();
        return;
      }

      // Garantir que Highcharts foi carregado
      if (typeof Highcharts === "undefined" || !Highcharts.chart) {
        element.innerHTML = "Error: Highcharts is not defined. Please ensure the Highcharts library is available.";
        done();
        return;
      }

      // Pegar nomes das colunas
      const dimension = queryResponse.fields.dimensions[0].name;
      const measureY = queryResponse.fields.measures[0].name;
      const measureZ = queryResponse.fields.measures[1]?.name;

      // Montar os dados
      const chartData = data.map(d => ({
        name: d[dimension].value,
        y: d[measureY].value,
        z: d[measureZ]?.value || 1
      }));

      // Renderizar gráfico
      Highcharts.chart("chart", {
        chart: {
          type: "variwide"
        },
        title: { text: "" },
        xAxis: {
          type: "category",
          title: { text: dimension },
        },
        yAxis: {
          title: { text: measureY },
        },
        tooltip: {
          pointFormat: `<b>{point.name}</b><br/>${measureY}: <b>{point.y}</b><br/>${measureZ}: <b>{point.z}</b>`
        },
        series: [{
          name: measureY,
          data: chartData,
        }],
        credits: { enabled: false }
      });

    } catch (err) {
      element.innerHTML = `<span style="color:red">Visualization error: ${err.message}</span>`;
    }

    done();
  }
});
