looker.plugins.visualizations.add({
  id: "variable_width_column_final",
  label: "Variable Width Column High",
  options: {
    bar_color: {
      type: "string",
      label: "Bar Color",
      display: "color",
      default: "#FF9999"
    },
    color_by_point: {
      type: "boolean",
      label: "Color by Point",
      default: false
    },
    palette: {
      type: "string",
      label: "Color Palette",
      display: "select",
      default: "default",
      values: [
        { "Looker Default": "default" },
        { "Gray": "gray" },
        { "Blue": "blue" },
        { "Purple": "purple" },
        { "Orange": "orange" },
        { "Green": "green" },
        { "Pink": "pink" },
        { "Teal": "teal" }
      ]
    }
  },

  create: function (element, config) {
    element.innerHTML = "<div id='chart'></div>";
  },

  updateAsync: function (data, element, config, queryResponse, details, done) {
    try {
      if (queryResponse.fields.dimensions.length < 1 || queryResponse.fields.measures.length < 2) {
        element.innerHTML = "This chart requires 1 dimension and 2 measures.";
        return done();
      }

      const dimension = queryResponse.fields.dimensions[0].name;
      const measureValue = queryResponse.fields.measures[0].name;
      const measureWidth = queryResponse.fields.measures[1].name;

      const labels = [];
      const values = [];
      const widths = [];

      data.forEach(row => {
        labels.push(row[dimension].value);
        values.push(Number(row[measureValue].value));
        widths.push(Number(row[measureWidth].value));
      });

      const barColor = config.bar_color || "#FF9999";
      const useColorByPoint = config.color_by_point;

      let colors = [];
      if (useColorByPoint) {
        const palette = LookerCharts.Utils.getPalette(config.palette || "default");
        colors = palette.colors.slice(0, values.length);
      }

      const seriesData = labels.map((label, i) => ({
        name: label,
        y: values[i],
        pointWidth: widths[i],
        color: useColorByPoint ? colors[i] : barColor
      }));

      Highcharts.chart("chart", {
        chart: {
          type: "column"
        },
        title: {
          text: null
        },
        xAxis: {
          categories: labels,
          labels: {
            rotation: -45
          }
        },
        yAxis: {
          title: {
            text: queryResponse.fields.measures[0].label
          }
        },
        legend: {
          enabled: true
        },
        series: [{
          name: queryResponse.fields.measures[0].label,
          data: seriesData,
          showInLegend: true
        }],
        tooltip: {
          pointFormat: '{series.name}: <b>{point.y:,.0f}</b>'
        },
        plotOptions: {
          column: {
            dataLabels: {
              enabled: true,
              formatter: function () {
                return Highcharts.numberFormat(this.y, 0);
              },
              style: {
                fontWeight: "bold",
                color: "black"
              }
            }
          }
        }
      });

      done();
    } catch (error) {
      element.innerHTML = "Error: " + error.message;
      console.error(error);
      done();
    }
  }
});
