looker.plugins.visualizations.add({
  id: "variable_width_column_final",
  label: "Variable Width Column High",
  options: {},
  create: function (element, config) {
    element.innerHTML = `<div id="chart" style="width:100%; height:100%;"></div>`;

    // Prevenir duplicação de scripts
    if (!document.getElementById("highcharts-core")) {
      const highchartsScript = document.createElement("script");
      highchartsScript.src = "https://code.highcharts.com/highcharts.js";
      highchartsScript.id = "highcharts-core";
      highchartsScript.onload = () => {
        const variwideScript = document.createElement("script");
        variwideScript.src = "https://code.highcharts.com/modules/variwide.js";
        variwideScript.onload = () => {
          window._highchartsReady = true;
        };
        document.head.appendChild(variwideScript);
      };
      document.head.appendChild(highchartsScript);
    } else {
      window._highchartsReady = true;
    }
  },

  updateAsync: function (data, element, config, queryResponse, details, done) {
    const waitUntilReady = () => {
      if (!window._highchartsReady || typeof Highcharts === "undefined") {
        setTimeout(waitUntilReady, 100);
        return;
      }

      try {
        const dimension = queryResponse.fields.dimensions[0].name;
        const measureY = queryResponse.fields.measures[0].name;
        const measureZ = queryResponse.fields.measures[1]?.name;

        const chartData = data.map(d => ({
          name: d[dimension].value,
          y: d[measureY].value,
          z: d[measureZ]?.value || 1,
        }));

        Highcharts.chart("chart", {
          chart: {
            type: "variwide",
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
            pointFormat: `<b>{point.name}</b><br/>${measureY}: <b>{point.y}</b><br/>${measureZ}: <b>{point.z}</b>`,
          },
          series: [
            {
              name: measureY,
              data: chartData,
            },
          ],
          credits: { enabled: false },
        });
      } catch (error) {
        element.innerHTML = `<span style="color:red">Visualization error: ${error.message}</span>`;
      }

      done();
    };

    waitUntilReady();
  },
});
