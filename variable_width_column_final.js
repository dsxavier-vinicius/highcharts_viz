looker.plugins.visualizations.add({
  id: "variable_width_column_final",
  label: "Variable Width Column High",
  options: {},

  create: function (element, config) {
    const highchartsScript = document.createElement("script");
    highchartsScript.src = "https://code.highcharts.com/highcharts.js";
    highchartsScript.onload = () => {
      this._loaded = true;
    };
    document.head.appendChild(highchartsScript);

    const container = document.createElement("div");
    container.id = "chart";
    container.style.width = "100%";
    container.style.height = "100%";
    element.appendChild(container);
    this.container = container;
  },

  updateAsync: function (data, element, config, queryResponse, details, done) {
    if (!this._loaded || typeof Highcharts === "undefined") {
      done();
      return;
    }

    if (queryResponse.fields.dimensions.length < 1 || queryResponse.fields.measures.length < 2) {
      this.container.innerHTML = "<div style='color:red;'>Please select at least 1 dimension and 2 measures.</div>";
      done();
      return;
    }

    const dimension = queryResponse.fields.dimensions[0];
    const heightMeasure = queryResponse.fields.measures[0];
    const widthMeasure = queryResponse.fields.measures[1];

    const categories = [];
    const seriesData = [];

    data.forEach(row => {
      const category = row[dimension.name].value;
      const height = row[heightMeasure.name].value;
      const width = row[widthMeasure.name].value;

      categories.push(category);
      seriesData.push({
        y: Number(height),
        z: Number(width),
        name: category,
        custom: {
          heightLabel: row[heightMeasure.name].rendered || height,
          widthLabel: row[widthMeasure.name].rendered || width,
        }
      });
    });

    Highcharts.chart(this.container, {
      chart: {
        type: 'column'
      },
      title: { text: null },
      subtitle: { text: null },
      exporting: { enabled: false },
      credits: { enabled: false },
      xAxis: {
        categories: categories,
        title: { text: dimension.label }
      },
      yAxis: {
        title: { text: heightMeasure.label }
      },
      legend: { enabled: false },
      tooltip: {
        formatter: function () {
          return `<b>${this.key}</b><br>${heightMeasure.label}: ${this.point.custom.heightLabel}<br>${widthMeasure.label}: ${this.point.custom.widthLabel}`;
        }
      },
      plotOptions: {
        column: {
          pointPadding: 0,
          borderWidth: 0,
          pointWidth: null,
          groupPadding: 0,
          grouping: false,
          point: {
            events: {}
          }
        },
        series: {
          pointWidth: undefined,
          minPointLength: 1,
        }
      },
      series: [{
        name: heightMeasure.label,
        data: seriesData,
        colorByPoint: true,
        pointWidth: null,
      }]
    });

    done();
  }
});
