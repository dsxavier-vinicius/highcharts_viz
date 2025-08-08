// variable_width_column_final.js

looker.plugins.visualizations.add({
  id: "variable_width_column_final",
  label: "Variable Width Column High",
  options: {},

  create: function (element, config) {
    element.innerHTML = "<div id='container' style='width:100%; height:100%;'></div>";
  },

  updateAsync: function (data, element, config, queryResponse, details, doneRendering) {
    const container = element.querySelector("#container");
    container.innerHTML = "";

    const categories = [];
    const seriesData = [];

    const dimension = queryResponse.fields.dimension_like[0];
    const heightMeasure = queryResponse.fields.measure_like[0];
    const widthMeasure = queryResponse.fields.measure_like[1];

    const maxWidth = Math.max(...data.map(d => +d[widthMeasure.name].value));

    data.forEach(row => {
      const dim = LookerCharts.Utils.htmlForCell(row[dimension.name]);
      const heightValue = +row[heightMeasure.name].value;
      const widthValue = +row[widthMeasure.name].value;

      categories.push(dim);
      seriesData.push({
        y: heightValue,
        width: widthValue / maxWidth, // Normalize width (0-1)
        name: dim,
        custom: {
          heightLabel: row[heightMeasure.name].rendered,
          widthLabel: row[widthMeasure.name].rendered
        }
      });
    });

    Highcharts.chart(container, {
      chart: {
        type: "column",
        inverted: false
      },
      title: {
        text: null
      },
      xAxis: {
        categories: categories,
        title: {
          text: dimension.label
        },
        labels: {
          rotation: -45
        }
      },
      yAxis: {
        title: {
          text: heightMeasure.label
        }
      },
      tooltip: {
        formatter: function () {
          return `
            <b>${this.point.name}</b><br/>
            ${heightMeasure.label}: ${this.point.custom.heightLabel}<br/>
            ${widthMeasure.label}: ${this.point.custom.widthLabel}
          `;
        }
      },
      plotOptions: {
        column: {
          pointPadding: 0,
          borderWidth: 0,
          pointWidth: undefined // Let width come from zones
        },
        series: {
          animation: true
        }
      },
      series: [{
        name: heightMeasure.label,
        data: seriesData,
        colorByPoint: true
      }],
      exporting: {
        enabled: false
      },
      credits: {
        enabled: false
      }
    });

    doneRendering();
  }
});
