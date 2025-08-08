looker.plugins.visualizations.add({
  id: "variable_width_column_final",
  label: "Variable Width Column High",
  options: {
    bar_color: {
      type: 'string',
      label: 'Bar Color',
      display: 'color',
      default: '#7ED6DF'
    },
    color_by_point: {
      type: 'boolean',
      label: 'Color by Point',
      default: true
    }
  },

  create: function (element, config) {
    element.innerHTML = '<div id="chart-container" style="width:100%; height:500px;"></div>';

    function loadScript(src, callback) {
      const script = document.createElement('script');
      script.src = src;
      script.onload = callback;
      document.head.appendChild(script);
    }

    if (!window.Highcharts) {
      loadScript("https://code.highcharts.com/highcharts.js", () => {
        this.highchartsLoaded = true;
      });
    } else {
      this.highchartsLoaded = true;
    }
  },

  updateAsync: function (data, element, config, queryResponse, details, done) {
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
      z: volumeField ? row[volumeField.name].value : 100
    }));

    const maxZ = Math.max(...rawData.map(d => d.z));
    const maxPointWidth = 100;

    const dataWithWidth = rawData.map(d => ({
      name: d.name,
      y: d.y,
      pointWidth: (d.z / maxZ) * maxPointWidth
    }));

    // Paleta do Looker (caso colorByPoint esteja ativo)
    const lookerColors = Object.keys(config.series_colors || {})
      .sort()
      .map(k => config.series_colors[k]);

    const useColorByPoint = config.color_by_point === true;

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
        headerFormat: '<b>{point.name}</b><br>',
        pointFormat:
          measure.label + ': ${point.y:,.0f}' +
          (volumeField ? `<br>${volumeField.label}: {point.pointWidth:.0f}` : '')
      },
      plotOptions: {
        column: {
          dataLabels: {
            enabled: true,
            format: '${y:,.0f}'
          }
        }
      },
      exporting: { enabled: false },
      credits: { enabled: false },
      colors: useColorByPoint ? lookerColors : [config.bar_color],
      series: [{
        name: measure.label,
        data: dataWithWidth,
        colorByPoint: useColorByPoint
      }]
    });

    done();
  }
});
