looker.plugins.visualizations.add({
  id: "variable_width_column_final",
  label: "Variable Width Column High",
  options: {},
  create: function (element) {
    element.innerHTML = "<div id='container'></div>";
  },
  updateAsync: function (data, element, config, queryResponse, details, done) {
    try {
      if (!data || !data.length || !queryResponse.fields.dimensions.length || queryResponse.fields.measures.length < 2) {
        element.innerHTML = "<div style='color: red; padding: 1em;'>This visualization requires 1 dimension and 2 or more measures.</div>";
        done();
        return;
      }

      const dimension = queryResponse.fields.dimensions[0];
      const [widthMeasure, heightMeasure] = queryResponse.fields.measures;

      const categories = data.map(row => row[dimension.name]?.value || '');
      const seriesData = data.map(row => ({
        x: row[dimension.name]?.value || '',
        y: row[heightMeasure.name]?.value || 0,
        z: row[widthMeasure.name]?.value || 0,
        tooltip: queryResponse.fields.measures.map(m => `${m.label}: ${row[m.name]?.rendered || row[m.name]?.value}`).join("<br>")
      }));

      Highcharts.chart('container', {
        chart: {
          type: 'column',
          height: 500,
          spacingBottom: 30
        },
        title: { text: null },
        xAxis: {
          categories: categories,
          title: { text: dimension.label },
          labels: {
            rotation: -45,
            style: { fontSize: '12px' }
          }
        },
        yAxis: {
          title: { text: heightMeasure.label }
        },
        tooltip: {
          useHTML: true,
          formatter: function () {
            return `<b>${this.point.x}</b><br>${this.point.tooltip}`;
          }
        },
        plotOptions: {
          column: {
            pointPadding: 0,
            borderWidth: 0,
            groupPadding: 0.1,
            pointWidth: null
          },
          series: {
            grouping: false,
            shadow: false
          }
        },
        series: [{
          name: heightMeasure.label,
          data: seriesData,
          colorByPoint: true
        }],
        credits: { enabled: false },
        exporting: { enabled: false }
      });
    } catch (err) {
      element.innerHTML = `<div style='color: red; padding: 1em;'>Error rendering visualization: ${err.message}</div>`;
    }
    done();
  }
});
