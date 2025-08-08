
looker.plugins.visualizations.add({
  id: "variable_width_column_final",
  label: "Variable Width Column",
  options: {},

  create: function(element, config) {
    element.innerHTML = '<div id="chart-container" style="width:100%; height:500px;"></div>';

    function loadScript(src, callback) {
      const script = document.createElement('script');
      script.src = src;
      script.onload = callback;
      document.head.appendChild(script);
    }

    if (!window.Highcharts || !window.Highcharts.exporting) {
      loadScript("https://code.highcharts.com/highcharts.js", () => {
        loadScript("https://code.highcharts.com/modules/exporting.js", () => {
          loadScript("https://code.highcharts.com/modules/export-data.js", () => {
            this.highchartsLoaded = true;
          });
        });
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

    const dimension = queryResponse.fields.dimensions[0].name;
    const measure = queryResponse.fields.measures[0].name;
    const volumeField = queryResponse.fields.measures[1]?.name;

    const rawData = data.map(row => ({
      name: row[dimension].value,
      y: row[measure].value,
      z: volumeField ? row[volumeField].value : 100
    }));

    const maxZ = Math.max(...rawData.map(d => d.z));
    const maxPointWidth = 100;

    const dataWithWidth = rawData.map(d => ({
      name: d.name,
      y: d.y,
      pointWidth: (d.z / maxZ) * maxPointWidth
    }));

    Highcharts.chart('chart-container', {
      chart: {
        type: 'column',
        animation: { duration: 1000 }
      },
      title: {
        text: 'Clientes: Receita (Altura) x Volume (Largura)'
      },
      subtitle: {
        text: 'Altura = Receita (USD), Largura = Volume proporcional'
      },
      xAxis: {
        type: 'category',
        title: { text: 'Clientes' },
        labels: { rotation: -45 }
      },
      yAxis: {
        min: 0,
        title: { text: 'Receita (USD)' }
      },
      tooltip: {
        headerFormat: '<b>{point.name}</b><br>',
        pointFormat: 'Receita: ${point.y:,.0f}<br>Largura proporcional ao volume'
      },
      plotOptions: {
        column: {
          dataLabels: {
            enabled: true,
            format: '${y:,.0f}'
          }
        }
      },
      exporting: {
        enabled: true
      },
      series: [{
        name: 'Receita',
        data: dataWithWidth,
        colorByPoint: true
      }]
    });

    done();
  }
});
