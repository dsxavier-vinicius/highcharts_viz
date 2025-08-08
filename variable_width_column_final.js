looker.plugins.visualizations.add({
  id: "variable_width_column_final",
  label: "Variable Width Column High",
  options: {
    show_values: {
      type: "boolean",
      label: "Show Values on Bars",
      default: true
    },
    x_axis_label_rotation: {
      type: "number",
      label: "X-Axis Label Rotation",
      default: 0
    },
    width_measure_index: {
      type: "number",
      label: "Index of Measure for Bar Width (0-based)",
      default: 1
    }
  },
  create: function (element, config) {
    element.innerHTML = "<div id='container' style='width:100%; height:100%;'></div>";
  },
  updateAsync: function (data, element, config, queryResponse, details, done) {
    if (typeof Highcharts === "undefined") {
      element.innerHTML = "<div style='color:red;'>Error: Highcharts is not defined. Please ensure the Highcharts library is available.</div>";
      done();
      return;
    }

    const container = element.querySelector("#container");
    if (!data || data.length === 0 || !queryResponse || !queryResponse.fields || !queryResponse.fields.dimensions || !queryResponse.fields.measures) {
      container.innerHTML = "<div style='color:red;'>No data available</div>";
      done();
      return;
    }

    const dimension = queryResponse.fields.dimensions[0];
    const measures = queryResponse.fields.measures;
    const widthIndex = config.width_measure_index || 1;
    const heightIndex = widthIndex === 0 ? 1 : 0;

    const categories = data.map(row => row[dimension.name]?.rendered || row[dimension.name]?.value || "");
    const heightData = data.map(row => parseFloat(row[measures[heightIndex]?.name]?.value || 0));
    const widthData = data.map(row => parseFloat(row[measures[widthIndex]?.name]?.value || 0));

    const totalWidth = widthData.reduce((sum, val) => sum + val, 0);
    const normalizedWidth = widthData.map(w => w / totalWidth);

    Highcharts.chart(container, {
      chart: {
        type: "column",
        spacingBottom: 50
      },
      title: { text: null },
      xAxis: {
        categories: categories,
        labels: {
          rotation: config.x_axis_label_rotation || 0
        }
      },
      yAxis: {
        title: {
          text: measures[heightIndex].label
        }
      },
      legend: {
        enabled: false
      },
      tooltip: {
        formatter: function () {
          const pointIndex = this.point.index;
          return `<b>${categories[pointIndex]}</b><br/>${measures[heightIndex].label}: ${Highcharts.numberFormat(heightData[pointIndex], 0)}<br/>${measures[widthIndex].label}: ${Highcharts.numberFormat(widthData[pointIndex], 0)}`;
        }
      },
      plotOptions: {
        column: {
          pointPadding: 0,
          groupPadding: 0,
          borderWidth: 0,
          pointWidth: null,
          dataLabels: {
            enabled: config.show_values,
            formatter: function () {
              return Highcharts.numberFormat(this.y, 0);
            }
          }
        },
        series: {
          pointWidth: null,
          point: {
            events: {
              afterAnimate: function () {
                const points = this.series.points;
                const plotWidth = this.series.chart.plotSizeX;
                const adjustedWidths = normalizedWidth.map(n => n * plotWidth);
                points.forEach((p, i) => {
                  p.graphic && p.graphic.attr({ width: adjustedWidths[i] });
                });
              }
            }
          }
        }
      },
      series: [{
        name: measures[heightIndex].label,
        data: heightData,
        color: '#33A1FD'
      }]
    });

    done();
  }
});
