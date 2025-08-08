// Arquivo visualization.js

looker.plugins.visualizations.add({
  options: {},

  create: function(element, config) {
    // Cria o container do gráfico
    element.innerHTML = '<div id="chart-container" style="width:100%; height:400px;"></div>';

    // Adiciona o script do Highcharts apenas uma vez
    if (!window.Highcharts) {
      const script = document.createElement("script");
      script.src = "https://code.highcharts.com/highcharts.js";
      script.onload = () => {
        this.highchartsLoaded = true;
      };
      document.head.appendChild(script);
    } else {
      this.highchartsLoaded = true;
    }
  },

  updateAsync: function(data, element, config, queryResponse, details, done) {
    if (!this.highchartsLoaded) {
      setTimeout(() => this.updateAsync(data, element, config, queryResponse, details, done), 100);
      return;
    }

    // Extrai os nomes das colunas (assume 1 dimensão e 1 medida)
    const dimension = queryResponse.fields.dimensions[0].name;
    const measure = queryResponse.fields.measures[0].name;

    const categories = data.map(row => row[dimension].value);
    const values = data.map(row => row[measure].value);

    // Renderiza o gráfico
    Highcharts.chart('chart-container', {
      chart: {
        type: 'column'
      },
      title: {
        text: 'Gráfico de Colunas - Highcharts'
      },
      xAxis: {
        categories: categories,
        title: {
          text: null
        }
      },
      yAxis: {
        min: 0,
        title: {
          text: measure,
          align: 'high'
        },
        labels: {
          overflow: 'justify'
        }
      },
      tooltip: {
        valueSuffix: ''
      },
      plotOptions: {
        column: {
          dataLabels: {
            enabled: true
          }
        }
      },
      series: [{
        name: measure,
        data: values
      }]
    });

    done();
  }
});
