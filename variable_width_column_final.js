looker.plugins.visualizations.add({
  id: "variable_width_column_final",
  label: "Variable Width Column High",

  options: {
    xAxisRotation: {
      type: "number",
      label: "X-axis Label Rotation",
      default: 0
    },
    showDataLabels: {
      type: "boolean",
      label: "Show Data Labels",
      default: true
    },
    legendEnabled: {
      type: "boolean",
      label: "Show Legend",
      default: true
    },
    legendPosition: {
      type: "string",
      label: "Legend Position",
      default: "bottom",
      values: [
        { label: "Bottom", value: "bottom" },
        { label: "Top", value: "top" },
        { label: "Left", value: "left" },
        { label: "Right", value: "right" }
      ]
    }
  },

  // Função para carregar o Highcharts se necessário
  loadHighcharts: function(callback) {
    if (typeof Highcharts !== "undefined") {
      callback();
      return;
    }

    const script = document.createElement("script");
    script.src = "https://code.highcharts.com/highcharts.js";
    script.onload = () => callback();
    script.onerror = () => {
      this.container.innerHTML = `
        <div style="color: red; padding: 12px;">
          Error: Highcharts is not defined. Please ensure the Highcharts library is available.
        </div>
      `;
    };
    document.head.appendChild(script);
  },

  create: function(element, config) {
    element.innerHTML = "<div id='chart' style='width: 100%; height: 100%;'></div>";
    this.container = element;
  },

  updateAsync: function(data, element, config, queryResponse, details, done) {
    this.loadHighcharts(() => {
      try {
        // Verificação de estrutura
        if (
          queryResponse.fields.dimensions.length < 1 ||
          queryResponse.fields.measures.length < 2
        ) {
          this.container.innerHTML = "<div style='color: red;'>This chart requires at least 1 dimension and 2 measures.</div>";
          done();
          return;
        }

        const dimension = queryResponse.fields.dimensions[0];
        const measureY = queryResponse.fields.measures[0]; // Altura
        const measureWidth = queryResponse.fields.measures[1]; // Largura

        const categories = [];
        const dataSeries = [];

        data.forEach(row => {
          const category = LookerCharts.Utils.textForCell(row[dimension.name]);
          const yValue = row[measureY.name]?.value || 0;
          const widthValue = row[measureWidth.name]?.value || 1;

          categories.push(category);
          dataSeries.push({
            y: yValue,
            z: widthValue,
            name: category
          });
        });

        Highcharts.chart('chart', {
          chart: {
            type: 'column'
          },
          title: {
            text: ''
          },
          xAxis: {
            categories: categories,
            labels: {
              rotation: config.xAxisRotation || 0
            },
            title: {
              text: dimension.label
            }
          },
          yAxis: {
            min: 0,
            title: {
              text: measureY.label
            }
          },
          legend: {
            enabled: config.legendEnabled,
            align: config.legendPosition === "left" || config.legendPosition === "right" ? config.legendPosition : "center",
            verticalAlign: config.legendPosition === "top" || config.legendPosition === "bottom" ? config.legendPosition : "middle",
            layout: config.legendPosition === "left" || config.legendPosition === "right" ? "vertical" : "horizontal"
          },
          tooltip: {
            pointFormat: `<b>{point.name}</b><br>${measureY.label}: <b>{point.y:,.0f}</b><br>${measureWidth.label}: <b>{point.z:,.0f}</b>`
          },
          plotOptions: {
            column: {
              pointPadding: 0.2,
              borderWidth: 0,
              dataLabels: {
                enabled: config.showDataLabels,
                format: '{point.y:,.0f}'
              }
            },
            series: {
              pointWidth: null
            }
          },
          series: [{
            name: measureY.label,
            data: dataSeries.map(p => ({
              name: p.name,
              y: p.y,
              z: p.z
            }))
          }]
        });

        done();
      } catch (error) {
        this.container.innerHTML = `<div style="color: red;">Error rendering visualization:<br>${error}</div>`;
        done();
      }
    });
  }
});
