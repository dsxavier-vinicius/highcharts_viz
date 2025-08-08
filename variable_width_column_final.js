looker.plugins.visualizations.add({
  id: "variable_width_column_final",
  label: "Variable Width Column High",
  options: {},
  create: function(element, config) {
    element.innerHTML = "<div id='container' style='width: 100%; height: 100%;'></div>";
  },
  updateAsync: function(data, element, config, queryResponse, details, done) {
    const container = element.querySelector("#container");
    container.innerHTML = "";

    const xDimension = queryResponse.fields.dimensions[0];
    const heightMeasure = queryResponse.fields.measures[0];
    const widthMeasure = queryResponse.fields.measures[1];

    if (!xDimension || !heightMeasure || !widthMeasure) {
      container.innerHTML = "<p>Insira pelo menos uma dimensão e duas medidas.</p>";
      done();
      return;
    }

    const categories = data.map(row => LookerCharts.Utils.textForCell(row[xDimension]));
    const chartData = data.map((row, i) => {
      const height = +row[heightMeasure].value;
      const width = +row[widthMeasure].value;
      const color = Highcharts.getOptions().colors[i % Highcharts.getOptions().colors.length];

      return {
        x: i,
        y: height,
        width: width,
        color: color,
        name: categories[i],
        custom: {
          xValue: LookerCharts.Utils.textForCell(row[xDimension]),
          heightLabel: `${heightMeasure.label}: ${LookerCharts.Utils.textForCell(row[heightMeasure])}`,
          widthLabel: `${widthMeasure.label}: ${LookerCharts.Utils.textForCell(row[widthMeasure])}`
        }
      };
    });

    const totalWidth = chartData.reduce((acc, d) => acc + d.width, 0);
    chartData.forEach(point => point.pointWidth = (point.width / totalWidth) * 800);

    Highcharts.chart(container, {
      chart: {
        type: 'column',
        spacing: [10, 10, 15, 10],
        animation: true,
      },
      title: { text: null },
      xAxis: {
        categories: categories,
        labels: { rotation: -30, style: { fontSize: '12px' } },
        title: { text: xDimension.label }
      },
      yAxis: {
        title: { text: heightMeasure.label }
      },
      tooltip: {
        useHTML: true,
        formatter: function() {
          return `<b>${this.point.custom.xValue}</b><br/>` +
                 `${this.point.custom.heightLabel}<br/>` +
                 `${this.point.custom.widthLabel}`;
        }
      },
      legend: { enabled: false },
      credits: { enabled: false },
      exporting: { enabled: false },
      plotOptions: {
        column: {
          grouping: false,
          shadow: false,
          borderWidth: 0,
          pointPadding: 0.2,
          groupPadding: 0.15,
          pointWidth: null,
          dataLabels: {
            enabled: true,
            formatter: function() {
              return Highcharts.numberFormat(this.y, 0, ",", ".");
            },
            style: { fontWeight: 'bold', fontSize: '10px' }
          }
        }
      },
      series: [{
        name: heightMeasure.label,
        data: chartData
      }]
    });

    done();
  }
});
