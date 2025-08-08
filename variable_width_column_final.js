looker.plugins.visualizations.add({
  id: "variable_width_column_final",
  label: "Variable Width Column High",
  options: {
    showValues: {
      type: "boolean",
      label: "Show Values",
      default: true
    },
    rotateXLabels: {
      type: "boolean",
      label: "Rotate X Labels",
      default: false
    }
  },
  create: function (element, config) {
    element.innerHTML = "<div id='chart-container' style='width:100%; height:100%;'></div>";
  },
  updateAsync: function (data, element, config, queryResponse, details, doneRendering) {
    const container = document.getElementById("chart-container");
    container.innerHTML = "";

    // Carregar Highcharts se não estiver carregado
    if (typeof Highcharts === "undefined") {
      const script = document.createElement("script");
      script.src = "https://code.highcharts.com/highcharts.js";
      script.onload = () => this.updateAsync(data, element, config, queryResponse, details, doneRendering);
      document.head.appendChild(script);
      return;
    }

    // Validar a estrutura dos dados
    if (queryResponse.fields.dimensions.length !== 1 || queryResponse.fields.measures.length < 1) {
      container.innerHTML = "This visualization requires 1 dimension and at least 1 measure.";
      doneRendering();
      return;
    }

    const dimension = queryResponse.fields.dimensions[0];
    const measures = queryResponse.fields.measures;

    const categories = [];
    const series = measures.map((measure) => ({
      name: measure.label_short,
      data: [],
    }));

    // Para largura variável: usar a primeira measure como width
    const widthReference = measures[0].name;

    data.forEach((row) => {
      const category = LookerCharts.Utils.textForCell(row[dimension.name]);
      categories.push(category);

      measures.forEach((measure, index) => {
        const value = row[measure.name]?.value;
        series[index].data.push({
          y: value,
          width: row[widthReference]?.value || 1,
        });
      });
    });

    Highcharts.chart("chart-container", {
      chart: {
        type: "column",
      },
      title: {
        text: null,
      },
      xAxis: {
        categories: categories,
        labels: {
          rotation: config.rotateXLabels ? -45 : 0,
        },
      },
      yAxis: {
        title: {
          text: null,
        },
      },
      legend: {
        enabled: true,
      },
      tooltip: {
        shared: true,
        formatter: function () {
          let s = `<b>${this.x}</b>`;
          this.points.forEach((point) => {
            s += `<br/>${point.series.name}: ${Highcharts.numberFormat(point.y, 2)}`;
          });
          return s;
        },
      },
      plotOptions: {
        column: {
          pointPadding: 0,
          borderWidth: 0,
          groupPadding: 0.1,
          pointWidth: null,
        },
        series: {
          pointWidth: null,
          dataLabels: {
            enabled: config.showValues,
          },
        },
      },
      series: series,
    });

    doneRendering();
  },
});
