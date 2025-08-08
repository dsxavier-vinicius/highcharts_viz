looker.plugins.visualizations.add({
  id: "variable_width_column_final",
  label: "Variable Width Column High",
  options: {},

  create: function (element, config) {
    element.innerHTML = '<div id="chart" style="width:100%; height:100%;"></div>';

    // Função para carregar scripts na ordem
    function loadScript(src, id, callback) {
      if (document.getElementById(id)) {
        callback();
        return;
      }
      const script = document.createElement("script");
      script.src = src;
      script.id = id;
      script.onload = callback;
      document.head.appendChild(script);
    }

    // Carrega Highcharts e Variwide
    loadScript("https://code.highcharts.com/highcharts.js", "highcharts-core", () => {
      loadScript("https://code.highcharts.com/modules/variwide.js", "highcharts-variwide", () => {
        window.highchartsReady = true;
      });
    });
  },

  updateAsync: function (data, element, config, queryResponse, details, done) {
    const waitUntilReady = () => {
      if (!window.highchartsReady || typeof Highcharts === "undefined") {
        setTimeout(waitUntilReady, 100);
        return;
      }

      try {
        const dimension = queryResponse.fields.dimensions[0].name;
        const measureY = queryResponse.fields.measures[0].name;
        const measureZ = queryResponse.fields.measures[1]?.name;

        const chartData = data.map(row => ({
          name: row[dimension].value,
          y: row[measureY].value,
          z: row[measureZ]?.value || 1,
        }));

        Highcharts.chart("chart", {
          chart: { type: "variwide" },
          title: { text: "" },
          xAxis: {
            type: "category",
            title: { text: dimension },
          },
          yAxis: {
            title: { text: measureY },
          },
          tooltip: {
            pointFormat: `<b>{point.name}</b><br/>${measureY}: <b>{point.y}</b><br/>${measureZ}: <b>{point.z}</b>`,
          },
          series: [{
            name: measureY,
            data: chartData,
          }],
          credits: { enabled: false },
        });
      } catch (error) {
        element.innerHTML = `<span style="color:red">Visualization error: ${error.message}</span>`;
      }

      done();
    };

    waitUntilReady();
  }
});
