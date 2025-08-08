looker.plugins.visualizations.add({
  id: "variable_width_column_final",
  label: "Variable Width Column High",

  options: {
    bar_color: {
      type: "string",
      label: "Bar Color",
      default: "#3399ff",
      display: "color"
    },
    color_by_point: {
      type: "boolean",
      label: "Color by Point",
      default: true
    }
  },

  create: function(element, config) {
    element.innerHTML = '<div id="chart-container" style="width:100%; height:500px;"></div>';

    function loadScript(src, callback) {
      const script = document.createElement('script');
      script.src = src;
      script.onload = callback;
      document.head.appendChild(script);
    }

    if (!window.Highcharts || !window.Highcharts.chart) {
      loadScript("https://code.highcharts.com/highcharts.js", () => {
        this.highchartsLoaded = true;
      });
    } else {
      this.highchartsLoaded = true;
    }
  },

  updateAsync: function(data, element, config, queryResponse, details, done) {
    if (!this.highchartsLoaded) {
      setTimeout(() => this.updateAsync(data, element, config, queryResponse, details, done), 100);
      return;
    }

    const dimension = queryResponse.fields.dimensions[0];
    const measure = queryResponse.fields.measures[0];
    const volumeField = queryResponse.fields.measures[1];

    const rawData = data.map(row => ({
      name: row[dimension.name].value,
      y: row[measure.name].value,
      z: volumeField ? row[volumeField.name].value : 100,
      originalValues: {
        measure: row[measure.name].value,
        volume: volumeField ? row[volumeField.name].value : null
      }
    }));

    const maxZ = Math.max(...rawData.map(d => d.z));
    const minWidth = 12;      // largura mínima das barras
    const maxWidth = 90;      // largura máxima permitida

    const dataWithWidth = rawData.map(d => {
      const scaledWidth = (d.z / maxZ) * maxWidth;
      return {
        name: d.name,
        y: d.y,
        pointWidth: Math.max(scaledWidth, minWidth),
        originalValues: d.originalValues
      };
    });

    Highcharts.chart('chart-container', {
      chart: {
        type: 'column',
        animation: { duration: 1000 },
        spacingTop: 20
      },
      title: { text: null },
      subtitle: { text: null },
      xAxis: {
        type: 'category',
        title: { text: dimension.label },
        labels: { rotation: -45 }
      },
      yAxis: {
        min: 0,
        title: { text: measure.label }
      },
      tooltip: {
        formatter: function () {
          const val1 = Highcharts.numberFormat(this.point.originalValues.measure, 0);
          const val2 = volumeField ? Highcharts.numberFormat(this.point.originalValues.volume, 0) : null;
          return `<b>${this.point.name}</b><br>${measure.label}: $${val1}` +
            (volumeField ? `<br>${volumeField.label}: ${val2}` : '');
        }
      },
      plotOptions: {
        column: {
          groupPadding: 0,
          pointPadding: 0,
          borderWidth: 0,
          dataLabels: {
            enabled: true,
            format: '${y:,.0f}'
          }
        }
      },
      exporting: { enabled: false },
      credits: { enabled: false },
      series: [{
        name: measure.label,
        data: dataWithWidth,
        color: config.bar_color,
        colorByPoint: config.color_by_point
      }]
    });

    done();
  }
});
