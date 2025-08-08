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

    // Carregar Highcharts dinamicamente se necessário
    if (typeof Highcharts === "undefined") {
      const script = document.createElement("script");
      script.src = "https://code.highcharts.com/highcharts.js";
      script.onload = () => this.updateAsync(data, element, config, queryResponse, details, doneRendering);
      document.head.appendChild(script);
      return;
    }

    if (
      queryResponse.fields.dimensions.length !== 1 ||
      queryResponse.fields.measures.length < 2
    ) {
      container.innerHTML = "Use 1 dimension and at least 2 measures (height, width).";
      doneRendering();
      return;
    }

    const dimension = queryResponse.fields.dimensions[0];
    const [heightMeasure, widthMeasure] = queryResponse.fields.measures;

    const categories = [];
    const dataPoints = [];

    let maxWidth = 0;
    let minWidth = Infinity;

    data.forEach((row) => {
      const category = LookerCharts.Utils.textForCell(row[dimension.name]);
      const height = row[heightMeasure.name]?.value;
      const width = row[widthMeasure.name]?.value;

      if (typeof height !== "number" || typeof width !== "number") return;

      categories.push(category);
      dataPoints.push({ y: height, widthValue: width });

      if (width > maxWidth) maxWidth = width;
      if (width < minWidth) minWidth = width;
    });

    // Normalizar width para um range usável pelo Highcharts
    const scale = 60; // ajustar para mudar a espessura geral
    const normalizedData = dataPoints.map((point) => ({
      y: point.y,
      pointWidth:
        minWidth === maxWidth
          ? scale
          : ((point.widthValue - minWidth) / (maxWidth - minWidth)) * scale + 10, // largura mínima = 10
    }));

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
          text: heightMeasure.label_short,
        },
      },
      legend: { enabled: false },
      tooltip: {
        formatter: function () {
          return `<b>${this.x}</b><br/>
            ${heightMeasure.label_short}: ${Highcharts.numberFormat(this.y, 2)}<br/>
            ${widthMeasure.label_short}: ${Highcharts.numberFormat(
            dataPoints[this.point.index].widthValue,
            0
          )}`;
        },
      },
      plotOptions: {
        series: {
          dataLabels: {
            enabled: config.showValues,
          },
        },
      },
      series: [
        {
          name: heightMeasure.label_short,
          data: normalizedData,
        },
      ],
    });

    doneRendering();
  },
});
