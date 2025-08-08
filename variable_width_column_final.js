looker.plugins.visualizations.add({
  id: "variable_width_column_final",
  label: "Variable Width Column High",

  dependencies: [
    "https://code.highcharts.com/highcharts.js",
    "https://code.highcharts.com/modules/variwide.js"
  ],

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
    }
  },

  create: function(element, config) {
    element.innerHTML = "<div id='chart' style='width: 100%; height: 100%;'></div>";
    this.container = element;
  },

  updateAsync: function(data, element, config, queryResponse, details, done) {
    try {
      if (
        queryResponse.fields.dimensions.length < 1 ||
        queryResponse.fields.measures.length < 2
      ) {
        this.container.innerHTML = "<div style='color: red;'>This chart requires at least 1 dimension and 2 measures.</div>";
        done();
        return;
      }

      const dimension = queryResponse.fields.dimensions[0];
      const measureY = queryResponse.fields.measures[0];
      const measureWidth = queryResponse.fields.measures[1];

      const categories = [];
      const chartData = [];

      data.forEach(row => {
        const category = LookerCharts.Utils.textForCell(row[dimension.name]);
        const y = row[measureY.name]?.value || 0;
        const z = row[measureWidth.name]?.value || 1;

        categories.push(category);
        chartData.push([category, y, z]); // [name, y, z]
      });

      Highcharts.chart('chart', {
        chart: {
          type: 'variwide',
          accessibility: {
            enabled: false
          }
        },
        title: { text: null },
        xAxis: {
          type: 'category',
          categories: categories,
          labels: {
            rotation: config.xAxisRotation || 0
          }
        },
        yAxis: {
          title: {
            text: measureY.label
          }
        },
        tooltip: {
          pointFormat: `
            <b>{point.name}</b><br>
            ${measureY.label}: <b>{point.y:,.0f}</b><br>
            ${measureWidth.label}: <b>{point.z:,.0f}</b>
          `
        },
        plotOptions: {
          variwide: {
            dataLabels: {
              enabled: config.showDataLabels,
              format: '{point.y:,.0f}'
            }
          }
        },
        series: [{
          name: measureY.label,
          data: chartData
        }],
        credits: { enabled: false }
      });

      done();
    } catch (err) {
      this.container.innerHTML = `<div style="color: red;">Error rendering visualization:<br>${err}</div>`;
      done();
    }
  }
});
