var React = require('react');
var ReactDOM = require('react-dom');
var Highcharts = require('highcharts');
var moment = require('moment');
var DateRangePicker = require('react-bootstrap-daterangepicker');

import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import {niceDate,getTimeframeRanges,dataRestPoint,completeParams,tableFromRawData} from './support.js';

import WidgetConfigPie       from './WidgetConfigPie.js';
import WidgetConfigBar       from './WidgetConfigBar.js';
import WidgetConfigLine      from './WidgetConfigLine.js';
import WidgetConfigColumn    from './WidgetConfigColumn.js';
import WidgetConfigHistogram from './WidgetConfigHistogram.js';
import WidgetConfigStats     from './WidgetConfigStats.js';
import WidgetConfigScatter   from './WidgetConfigScatter.js';

require('./dash.css');
require('./daterangepicker.css');

// How does the dash get access to the store?


class Widget extends React.Component {
  constructor(props) {
    super();
    this.updateInternals  = this.updateInternals.bind(this);
    this.openWidgetConfig = this.openWidgetConfig.bind(this);
    this.datepickerUpdate = this.datepickerUpdate.bind(this);
    this.flipToOtherSide  = this.flipToOtherSide.bind(this);
  }
  updateInternals() {
    var thisthis = this;
    var chart = this.refs.chart;
    var props = this.props;
    var data = props.widgets[props.widgetindex].data;
    var fs = data.filters.map(function(f) {
      return(f.metric+':'+f.comp+':'+f.value);
    }).join();
    // If we're using the tab timeframe, add that as a filter.
    if (props.widgets[props.widgetindex].data.timeframe == 'tab') {
      var tabStartDateUnix = moment(props.dashLayout[props.currentTab].tabStartDateISO).unix();
      var tabEndDateUnix   = moment(props.dashLayout[props.currentTab].tabEndDateISO).unix();
      if (fs.length > 0) {fs = fs + ',';}
      fs = fs + 'datetime:>=:'+tabStartDateUnix+',datetime:<=:'+tabEndDateUnix;
    }
    // If we're using the widget timeframe, add that as a filter.
    if (props.widgets[props.widgetindex].data.timeframe == 'custom') {
      var myStartDateUnix = moment(props.widgets[props.widgetindex].data.myStartDateISO).unix();
      var myEndDateUnix   = moment(props.widgets[props.widgetindex].data.myEndDateISO).unix();
      if (fs.length > 0) {fs = fs + ',';}
      fs = fs + 'datetime:>=:'+myStartDateUnix+',datetime:<=:'+myEndDateUnix;
    }
    // If it's a pie.
    if (data.type == 'pie') {
      if ((data.source === 'undefined') ||
          (data.metrics[0] === '(undefined)') ||
          (data.metrics[1] === '(undefined)') ||
          (data.aggMethod === '(undefined)') ||
          (data.label === '(undefined)') ||
          (data.timeframe === '(undefined)')) {
        $(ReactDOM.findDOMNode(chart)).html('<div class="nice-middle">Pie Widget Not Configured</div>');
      } else {
        $.post(
          dataRestPoint(),
          completeParams({
            source:       data.source,
            metrics:      data.metrics[0]+','+data.metrics[1],
            aggmetric:    data.metrics[0],
            nonaggmetric: data.metrics[1],
            aggmethod:    data.aggMethod,
            filters:      fs
          }),
          function(rawData) {
            if (rawData.data.length === 0) {
              $(ReactDOM.findDOMNode(chart)).html('<div class="nice-middle">Pie Widget Has No Data</div>');
              return false;
            }
            // Load the raw data into the raw data table.            
            $(ReactDOM.findDOMNode(thisthis.refs.chartdata)).html(tableFromRawData(rawData));
            // Then set up the plot.
            var plotdata = JSON.parse(JSON.stringify(rawData.data));
            if (data.aggDatetime == true) {
              var newplotdata = [];
              _.each(plotdata,function(a) {
                var h = {};
                h[data.metrics[0]] = a[data.metrics[0]]*1000; // Convert from Unix to JS.
                h[data.metrics[1]] = a[data.metrics[1]]*1000;
                newplotdata.push(h);
              });
              plotdata = JSON.parse(JSON.stringify(newplotdata));
            }
            // If it's to be sorted.
            if ((data.aggNumeric == true) || (data.aggDatetime == true)) {
              plotdata.sort(function(a,b) {return a[data.metrics[0]] - b[data.metrics[0]];});
            }
            var metricNumData0 = _.pluck(plotdata,data.metrics[0]);
            var metricNumData1 = _.pluck(plotdata,data.metrics[1]);
            var final = [];
            _.each(metricNumData0,function(datum,i) {
              var z = datum;
              if (data.aggDatetime == true) {
                z = niceDate(z);
              }
              if (data.aggDatetime == true) {
                final.push({x:datum,y:metricNumData1[i],z:z,name:datum});
              } else {
                final.push({y:metricNumData1[i],z:z,name:datum});
              }
            });
            if (final.length == 0) {
              $(ReactDOM.findDOMNode(chart)).html('<div class="nice-middle">Pie Widget Has No Data</div>');
            } else {
	            Highcharts.chart(ReactDOM.findDOMNode(chart),{
                chart: {
                  type: 'pie'
                },
                credits: {
                  enabled: false
                },
                title: {
                  text: data.aggMethod + " of " + data.metrics[1] + " by " + data.metrics[0]
                },
                plotOptions: {
                  pie: {
                    dataLabels: {
                      enabled: (data.label !== 'hide' ? true : false),
                      format:  '<b>{point.z}</b><br> {point.y:.2f} '//,
                    }
                  }
                },
                xAxis: {
                  type: (data.aggDatetime == true ? 'datetime' : 'category')
                },
                legend: {
                  enabled: false
                },
                series: [{
                  name:         '',
                  showInLegend: false,
                  data:         final,
                  size:         null,
                  innerSize:    '0%',
                  showInLegend: true,
                }]
              });
            }
          }
        );
      }
    }
    // If it's a bar.
    if (data.type == 'bar') {
      if ((data.source === 'undefined') || (data.metrics[0] === '(undefined)') || (data.metrics[1] === '(undefined)') || (data.aggMethod === '(undefined)') || (data.timeframe === '(undefined)')) {
        $(ReactDOM.findDOMNode(chart)).html('<div class="nice-middle">Bar Widget Not Configured</div>');
      } else {
        $.post(
          dataRestPoint(),
          completeParams({
            source:       data.source,
            metrics:      data.metrics[0]+','+data.metrics[1],
            aggmetric:    data.metrics[0],
            nonaggmetric: data.metrics[1],
            aggmethod:    data.aggMethod,
            filters:      fs
          }),
          function(rawData) {
            if (rawData.data.length === 0) {
              $(ReactDOM.findDOMNode(chart)).html('<div class="nice-middle">Bar Widget Has No Data</div>');
              return false;
            }
            // Load the raw data into the raw data table.            
            $(ReactDOM.findDOMNode(thisthis.refs.chartdata)).html(tableFromRawData(rawData));
            // Then set up the plot.
            var plotdata = JSON.parse(JSON.stringify(rawData.data));
            if (data.aggDatetime == true) {
              var newplotdata = [];
              _.each(plotdata,function(a) {
                var h = {};
                h[data.metrics[0]] = a[data.metrics[0]]*1000; // Convert from Unix to JS.
                h[data.metrics[1]] = a[data.metrics[1]]*1000;
                newplotdata.push(h);
              });
              plotdata = JSON.parse(JSON.stringify(newplotdata));
            }
            // If it's to be sorted.
            if ((data.aggNumeric == true) || (data.aggDatetime == true)) {
              plotdata.sort(function(a,b) {return a[data.metrics[0]] - b[data.metrics[0]];});
            }
            var metricNumData0 = _.pluck(plotdata,data.metrics[0]);
            var metricNumData1 = _.pluck(plotdata,data.metrics[1]);
            var final = [];
            _.each(metricNumData0,function(datum,i) {
              var z = datum;
              if (data.aggDatetime == true) {
                z = niceDate(z);
              }
              if (data.aggDatetime == true) {
                final.push({x:datum,y:metricNumData1[i],z:z,name:datum});
              } else {
                final.push({y:metricNumData1[i],z:z,name:datum});
              }
            });
            if (final.length == 0) {
              $(ReactDOM.findDOMNode(chart)).html('<div class="nice-middle">Bar Widget Has No Data</div>');
            } else {
	            Highcharts.chart(ReactDOM.findDOMNode(chart),{
                chart: {
                  type: 'bar'
                },
                credits: {
                  enabled: false
                },
                title: {
                  text: data.aggMethod + " of " + data.metrics[1] + " by " + data.metrics[0]
                },
                plotOptions: {
                  bar: {
                    dataLabels: {
                      enabled: false,
                      format:  '<b>{point.z}</b>: {point.y:.2f} '//,
                    }
                  }
                },
                xAxis: {
                  type: (data.aggDatetime == true ? 'datetime' : 'category')
                },
                legend: {
                  enabled: false
                },
                series: [{
                  name:         '',
                  showInLegend: false,
                  data:         final,
                  size:         null,
                  innerSize:    '0%',
                  showInLegend: true,
                }]
              });
            }
          }
        );
      }
    }
    // If it's a column.
    if (data.type == 'column') {
      if ((data.source === 'undefined') || (data.metrics[0] === '(undefined)') || (data.metrics[1] === '(undefined)') || (data.aggMethod === '(undefined)') || (data.timeframe === '(undefined)')) {
        $(ReactDOM.findDOMNode(chart)).html('<div class="nice-middle">Column Widget Not Configured</div>');
      } else {
        $.post(
          dataRestPoint(),
          completeParams({
            source:       data.source,
            metrics:      data.metrics[0]+','+data.metrics[1],
            aggmetric:    data.metrics[0],
            nonaggmetric: data.metrics[1],
            aggmethod:    data.aggMethod,
            filters:      fs
          }),
          function(rawData) {
            if (rawData.data.length === 0) {
              $(ReactDOM.findDOMNode(chart)).html('<div class="nice-middle">Column Widget Has No Data</div>');
              return false;
            }
            // Load the raw data into the raw data table.            
            $(ReactDOM.findDOMNode(thisthis.refs.chartdata)).html(tableFromRawData(rawData));
            // Then set up the plot.
            var plotdata = JSON.parse(JSON.stringify(rawData.data));
            if (data.aggDatetime == true) {
              var newplotdata = [];
              _.each(plotdata,function(a) {
                var h = {};
                h[data.metrics[0]] = a[data.metrics[0]]*1000; // Convert from Unix to JS.
                h[data.metrics[1]] = a[data.metrics[1]]*1000;
                newplotdata.push(h);
              });
              plotdata = JSON.parse(JSON.stringify(newplotdata));
            }
            // If it's to be sorted.
            if ((data.aggNumeric == true) || (data.aggDatetime == true)) {
              plotdata.sort(function(a,b) {return a[data.metrics[0]] - b[data.metrics[0]];});
            }
            var metricNumData0 = _.pluck(plotdata,data.metrics[0]);
            var metricNumData1 = _.pluck(plotdata,data.metrics[1]);
            var final = [];
            _.each(metricNumData0,function(datum,i) {
              var z = datum;
              if (data.aggDatetime == true) {
                z = niceDate(z);
              }
              if (data.aggDatetime == true) {
                final.push({x:datum,y:metricNumData1[i],z:z,name:datum});
              } else {
                final.push({y:metricNumData1[i],z:z,name:datum});
              }
            });
            if (final.length == 0) {
              $(ReactDOM.findDOMNode(chart)).html('<div class="nice-middle">Column Widget Has No Data</div>');
            } else {
	            Highcharts.chart(ReactDOM.findDOMNode(chart),{
                chart: {
                  type: 'column'
                },
                credits: {
                  enabled: false
                },
                title: {
                  text: data.aggMethod + " of " + data.metrics[1] + " by " + data.metrics[0]
                },
                plotOptions: {
                  column: {
                    dataLabels: {
                      enabled: false,
                      format:  '<b>{point.z}</b>: {point.y:.2f} '//,
                    }
                  }
                },
                xAxis: {
                  type: (data.aggDatetime == true ? 'datetime' : 'category')
                },
                legend: {
                  enabled: false
                },
                series: [{
                  name:         '',
                  showInLegend: false,
                  data:         final,
                  size:         null,
                  innerSize:    '0%',
                  showInLegend: true,
                }]
              });
            }
          }
        );
      }
    }
    // If it's a line.
    if (data.type == 'line') {
      if ((data.source === 'undefined') || (data.metrics[0] === '(undefined)') || (data.metrics[1] === '(undefined)') || (data.aggMethod === '(undefined)') || (data.timeframe === '(undefined)')) {
        $(ReactDOM.findDOMNode(chart)).html('<div class="nice-middle">Line Widget Not Configured</div>');
      } else {
        $.post(
          dataRestPoint(),
          completeParams({
            source:       data.source,
            metrics:      data.metrics[0]+','+data.metrics[1],
            aggmetric:    data.metrics[0],
            nonaggmetric: data.metrics[1],
            aggmethod:    data.aggMethod,
            filters:      fs
          }),
          function(rawData) {
            if (rawData.data.length === 0) {
              $(ReactDOM.findDOMNode(chart)).html('<div class="nice-middle">Line Widget Has No Data</div>');
              return false;
            }
            // Load the raw data into the raw data table.            
            $(ReactDOM.findDOMNode(thisthis.refs.chartdata)).html(tableFromRawData(rawData));
            // Then set up the plot.
            var plotdata = JSON.parse(JSON.stringify(rawData.data));
            if (data.aggDatetime == true) {
              var newplotdata = [];
              _.each(plotdata,function(a) {
                var h = {};
                h[data.metrics[0]] = a[data.metrics[0]]*1000; // Convert from Unix to JS.
                h[data.metrics[1]] = a[data.metrics[1]]*1000;
                newplotdata.push(h);
              });
              plotdata = JSON.parse(JSON.stringify(newplotdata));
            }
            // If it's to be sorted.
            if ((data.aggNumeric == true) || (data.aggDatetime == true)) {
              plotdata.sort(function(a,b) {return a[data.metrics[0]] - b[data.metrics[0]];});
            }
            var metricNumData0 = _.pluck(plotdata,data.metrics[0]);
            var metricNumData1 = _.pluck(plotdata,data.metrics[1]);
            var final = [];
            _.each(metricNumData0,function(datum,i) {
              var z = datum;
              if (data.aggDatetime == true) {
                z = niceDate(z);
              }
              if (data.aggDatetime == true) {
                final.push({x:datum,y:metricNumData1[i],z:z,name:datum});
              } else {
                final.push({y:metricNumData1[i],z:z,name:datum});
              }
            });
            if (final.length == 0) {
              $(ReactDOM.findDOMNode(chart)).html('<div class="nice-middle">Line Widget Has No Data</div>');
            } else {
	            Highcharts.chart(ReactDOM.findDOMNode(chart),{
                chart: {
                  type: 'line'
                },
                credits: {
                  enabled: false
                },
                title: {
                  text: data.aggMethod + " of " + data.metrics[1] + " by " + data.metrics[0]
                },
                plotOptions: {
                  line: {
                    dataLabels: {
                      enabled: false,
                      format:  '<b>{point.z}</b>: {point.y:.2f} '//,
                    },
                  }
                },
                xAxis: {
                  type: (data.aggDatetime == true ? 'datetime' : 'category')
                },
                legend: {
                  enabled: false
                },
                series: [{
                  name:         '',
                  showInLegend: false,
                  data:         final,
                  size:         null,
                  innerSize:    '0%',
                  showInLegend: true,
                }]
              });
            }
          }
        );
      }
    }
    // If it's a histogram.
    if (data.type == 'histogram') {
      if ((data.source === '(undefined)') || (data.metrics[0] === '(undefined)') || (data.buckets === '(undefined)') || (data.timeframe === '(undefined)')) {
        $(ReactDOM.findDOMNode(chart)).html('Histogram Widget Not Configured!');
      } else {
        $.post(
          dataRestPoint(),
          completeParams({
            source:  data.source,
            metrics: data.metrics[0],
            filters: fs
          }),
          function(rawData) {
            if (rawData.data.length === 0) {
              $(ReactDOM.findDOMNode(chart)).html('Histogram widget has no data!');
              return false;
            }
            // Load the raw data into the raw data table.            
            $(ReactDOM.findDOMNode(thisthis.refs.chartdata)).html(tableFromRawData(rawData));
            // Then set up the plot.
            var plotdata = rawData.data;
            var metricNumData = _.pluck(plotdata,data.metrics[0]);
            var cats = [];
            var vals = [];
            var min = Math.min(...metricNumData);
            var max = 1+Math.max(...metricNumData);
            for (var i=0;i<data.buckets;i++) {
              vals.push(0);
              cats.push((min+i*(max-min)/data.buckets)+"-"+(min+(i+1)*(max-min)/data.buckets));
            }
            _.each(metricNumData,function(datum) {
              var c = Math.floor((datum-min)/((max-min)/data.buckets));
              vals[c]++;
            });
            // Construct the chart.
            if (metricNumData.length == 0) {
              $(ReactDOM.findDOMNode(chart)).html('Histogram widget has no data!');
            } else {
	            Highcharts.chart(ReactDOM.findDOMNode(chart),{
                chart: {
                  type: 'column'
                },
                credits: {
                  enabled: false
                },
                title: {
                  text: data.metrics[0] + " in " + data.buckets + " Buckets"
                },
                xAxis: {
                  categories: cats
                },
                plotOptions: {
                  column: {
                    pointPadding: 0,
                    borderWidth:  1,
                    groupPadding: 0,
                    shadow:       false
                  }
                },
                legend: {
                  enabled: false
                },
                series: [{
                  color:        '#0000ff',
                  name:         '',
                  showInLegend: false,
                  data:         vals,
                  size:         '100%',
                  innerSize:    '85%',
                  showInLegend: true,
                  dataLabels: {
                    enabled: true
                  }
                }]
              });
            }
          }
        );
      }
    }


    // If it's a scatter plot.
    if (data.type == 'scatter') {
      if ((data.source === 'undefined') || (data.metrics[0] === '(undefined)') || (data.metrics[1] === '(undefined)') || (data.timeframe === '(undefined)')) {
        $(ReactDOM.findDOMNode(chart)).html('Scatter Widget Not Configured!');
      } else {
        $.post(
          dataRestPoint(),
          completeParams({
            source:  data.source,
            metrics: data.metrics[0]+','+data.metrics[1],
            filters: fs
          }),
          function(rawData) {
            if (rawData.data.length === 0) {
              $(ReactDOM.findDOMNode(chart)).html('Scatter widget has no data!');
              return false;
            }
            // Load the raw data into the raw data table.            
            $(ReactDOM.findDOMNode(thisthis.refs.chartdata)).html(tableFromRawData(rawData));
            // Then set up the plot.
            var plotdata = rawData.data;
            var metricNumData0 = _.pluck(plotdata,data.metrics[0]);
            var metricNumData1 = _.pluck(plotdata,data.metrics[1]);
            var final = [];
            _.each(metricNumData0,function(datum,i) {
              final.push([datum,metricNumData1[i]]);
            });
            // Construct the chart.
            if (final.length == 0) {
              $(ReactDOM.findDOMNode(chart)).html('Scatter widget has no data!');
            } else {
	            Highcharts.chart(ReactDOM.findDOMNode(chart),{
                chart: {
                  type: 'scatter'
                },
                credits: {
                  enabled: false
                },
                title: {
                  text: data.metrics[1]+' vs '+data.metrics[0]
                },
                xAxis: {
                  title: {
                    text: data.metrics[0]
                  }
                },
                yAxis: {
                  title: {
                    text: data.metrics[1]
                  }
                },
                legend: {
                  enabled: false
                },
                plotOptions: {
                  column: {
                    pointPadding: 0,
                    borderWidth:  1,
                    groupPadding: 0,
                    shadow:       false
                  }
                },
                series: [{
                  color:        '#0000ff',
                  name:         'f',
                  showInLegend: false,
                  data:         final,
                  showInLegend: true,
                  dataLabels: {
                    enabled: false
                  }
                }]
              });
            }
          }
        );
      }
    }



    // If it's a stats.
    if (data.type == 'stats') {
      if ((data.source === '(undefined)') || (data.metrics[0] === '(undefined)') || (data.timeframe === '(undefined)')) {
            $(ReactDOM.findDOMNode(chart)).html('Stats Widget Not Configured!');
      } else {
        $.post(
          dataRestPoint(),
          completeParams({
            source:  data.source,
            metrics: data.metrics[0],
            filters: fs
          }),
          function(rawData) {
            if (rawData.data.length === 0) {
              $(ReactDOM.findDOMNode(chart)).html('Stats widget has no data!');
              return false;
            }
            // Load the raw data into the raw data table.            
            $(ReactDOM.findDOMNode(thisthis.refs.chartdata)).html(tableFromRawData(rawData));
            // Then set up the plot.
            var plotdata = rawData.data;
            var metricNumData = _.pluck(plotdata,data.metrics[0]);
            if (metricNumData.length == 0) {
              $(ReactDOM.findDOMNode(chart)).html('Stats widget has no data!');
            } else {
              metricNumData.sort(function(a, b) {return a - b;});
              var length = metricNumData.length;
              var sum = _.reduce(metricNumData, function(memo, num){ return memo + num; }, 0);
              var mean = Math.floor(100*sum/length)/100;
              var median = (Math.floor(length/2)==length/2) ? (metricNumData[length/2]+metricNumData[length/2+1])/2 : metricNumData[(length-1)/2];
              var variance = 0;
              _.each(metricNumData,function(d) {variance += (mean-d)*(mean-d);});
              variance = variance/length;
              var stdev = Math.sqrt(variance);
              variance = Math.floor(100*variance)/100;
              stdev = Math.floor(100*stdev)/100;
              var max = metricNumData[length-1];
              var min = metricNumData[0];
              var r = '<div class="stats">';
              r += '<div class="stats-title">'+data.metrics[0]+'</div><br/>';
              r += '<div class="stats-left">Minimum</div><div class="stats-right">'+min+'</div>';
              r += '<div class="stats-left">Maximum</div><div class="stats-right">'+max+'</div>';
              r += '<div class="stats-left">Mean</div><div class="stats-right">'+mean+'</div>';
              r += '<div class="stats-left">Median</div><div class="stats-right">'+median+'</div>';
              r += '<div class="stats-left">Variance</div><div class="stats-right">'+variance+'</div>';
              r += '<div class="stats-left">Standard Deviation</div><div class="stats-right">'+stdev+'</div>';
              r += '</div>';
              $(ReactDOM.findDOMNode(chart)).html(r);
            }
          }
        )
      }
    }
  }
  openWidgetConfig() {
    this.props.update_widget(this.props.widgetindex,{
      configDisplay: 'block'
    });

  }
  componentDidUpdate(prevProps,prevState) {
    var newData = this.props.widgets[this.props.widgetindex].data;
    var oldData = prevProps.widgets[prevProps.widgetindex].data;
    var newTabData = this.props.dashLayout[this.props.currentTab];
    var oldTabData = prevProps.dashLayout[this.props.currentTab];
    if (newData.type === 'pie') {
      if ((newData.source                  !== oldData.source) ||
          (newData.metrics[0]              !== oldData.metrics[0]) ||
          (newData.metrics[1]              !== oldData.metrics[1]) ||
          (newData.aggNumeric              !== oldData.aggNumeric) ||
          (newData.aggDatetime             !== oldData.aggDatetime) ||
          (JSON.stringify(newData.filters) !== JSON.stringify(oldData.filters)) ||
          (newData.timeframe               !== oldData.timeframe) ||
          (newData.myStartDateISO          !== oldData.myStartDateISO) ||
          (newData.myEndDateISO            !== oldData.myEndDateISO) ||
          (newData.aggMethod               !== oldData.aggMethod) ||
          (newData.width                   !== oldData.width) ||
          (newData.height                  !== oldData.height) ||
          (newData.label                   !== oldData.label) ||
          ((newData.timeframe === 'tab') && ((newTabData.tabStartDateISO !== oldTabData.tabStartDateISO) ||
                                             (newTabData.tabEndDateISO !== oldTabData.tabEndDateISO)))) {
        this.updateInternals();
      }
    }
    if (newData.type === 'bar') {
      if ((newData.source                  !== oldData.source) ||
          (newData.metrics[0]              !== oldData.metrics[0]) ||
          (newData.metrics[1]              !== oldData.metrics[1]) ||
          (newData.aggNumeric              !== oldData.aggNumeric) ||
          (newData.aggDatetime             !== oldData.aggDatetime) ||
          (JSON.stringify(newData.filters) !== JSON.stringify(oldData.filters)) ||
          (newData.timeframe               !== oldData.timeframe) ||
          (newData.myStartDateISO          !== oldData.myStartDateISO) ||
          (newData.myEndDateISO            !== oldData.myEndDateISO) ||
          (newData.aggMethod               !== oldData.aggMethod) ||
          (newData.width                   !== oldData.width) ||
          (newData.height                  !== oldData.height) ||
          ((newData.timeframe === 'tab') && ((newTabData.tabStartDateISO !== oldTabData.tabStartDateISO) ||
                                             (newTabData.tabEndDateISO !== oldTabData.tabEndDateISO)))) {
        this.updateInternals();
      }
    }
    if (newData.type === 'column') {
      if ((newData.source                  !== oldData.source) ||
          (newData.metrics[0]              !== oldData.metrics[0]) ||
          (newData.metrics[1]              !== oldData.metrics[1]) ||
          (newData.aggNumeric              !== oldData.aggNumeric) ||
          (newData.aggDatetime             !== oldData.aggDatetime) ||
          (JSON.stringify(newData.filters) !== JSON.stringify(oldData.filters)) ||
          (newData.timeframe               !== oldData.timeframe) ||
          (newData.myStartDateISO          !== oldData.myStartDateISO) ||
          (newData.myEndDateISO            !== oldData.myEndDateISO) ||
          (newData.aggMethod               !== oldData.aggMethod) ||
          (newData.width                   !== oldData.width) ||
          (newData.height                  !== oldData.height) ||
          ((newData.timeframe === 'tab') && ((newTabData.tabStartDateISO !== oldTabData.tabStartDateISO) ||
                                             (newTabData.tabEndDateISO !== oldTabData.tabEndDateISO)))) {
        this.updateInternals();
      }
    }
    if (newData.type == 'line') {
      if ((newData.source                  !== oldData.source) ||
          (newData.metrics[0]              !== oldData.metrics[0]) ||
          (newData.metrics[1]              !== oldData.metrics[1]) ||
          (newData.aggNumeric              !== oldData.aggNumeric) ||
          (newData.aggDatetime             !== oldData.aggDatetime) ||
          (JSON.stringify(newData.filters) !== JSON.stringify(oldData.filters)) ||
          (newData.timeframe               !== oldData.timeframe) ||
          (newData.myStartDateISO          !== oldData.myStartDateISO) ||
          (newData.myEndDateISO            !== oldData.myEndDateISO) ||
          (newData.aggMethod               !== oldData.aggMethod) ||
          (newData.width                   !== oldData.width) ||
          (newData.height                  !== oldData.height) ||
          ((newData.timeframe === 'tab') && ((newTabData.tabStartDateISO !== oldTabData.tabStartDateISO) ||
                                             (newTabData.tabEndDateISO !== oldTabData.tabEndDateISO)))) {
        this.updateInternals();
      }
    }
    if (newData.type === 'histogram') {
      if ((newData.source                  !== oldData.source) ||
          (newData.metrics[0]              !== oldData.metrics[0]) ||
          (JSON.stringify(newData.filters) !== JSON.stringify(oldData.filters)) ||
          (newData.timeframe               !== oldData.timeframe) ||
          (newData.myStartDateISO          !== oldData.myStartDateISO) ||
          (newData.myEndDateISO            !== oldData.myEndDateISO) ||
          (newData.buckets                 !== oldData.buckets) ||
          (newData.width                   !== oldData.width) ||
          (newData.height                  !== oldData.height) ||
          ((newData.timeframe === 'tab') && ((newTabData.tabStartDateISO !== oldTabData.tabStartDateISO) ||
                                             (newTabData.tabEndDateISO !== oldTabData.tabEndDateISO)))) {
        this.updateInternals();
      }
    }
    if (newData.type === 'stats') {
      if ((newData.source                  !== oldData.source) ||
          (newData.metrics[0]              !== oldData.metrics[0]) ||
          (JSON.stringify(newData.filters) !== JSON.stringify(oldData.filters)) ||
          (newData.timeframe               !== oldData.timeframe) ||
          (newData.myStartDateISO          !== oldData.myStartDateISO) ||
          (newData.myEndDateISO            !== oldData.myEndDateISO) ||
          (newData.width                   !== oldData.width) ||
          (newData.height                  !== oldData.height) ||
          ((newData.timeframe === 'tab') && ((newTabData.tabStartDateISO !== oldTabData.tabStartDateISO) ||
                                             (newTabData.tabEndDateISO !== oldTabData.tabEndDateISO)))) {
        this.updateInternals();
      }
    }
    if (newData.type === 'scatter') {
      if ((newData.source                  !== oldData.source) ||
          (newData.metrics[0]              !== oldData.metrics[0]) ||
          (newData.metrics[1]              !== oldData.metrics[1]) ||
          (JSON.stringify(newData.filters) !== JSON.stringify(oldData.filters)) ||
          (newData.timeframe               !== oldData.timeframe) ||
          (newData.myStartDateISO          !== oldData.myStartDateISO) ||
          (newData.myEndDateISO            !== oldData.myEndDateISO) ||
          (newData.width                   !== oldData.width) ||
          (newData.height                  !== oldData.height) ||
          ((newData.timeframe === 'tab') && ((newTabData.tabStartDateISO !== oldTabData.tabStartDateISO) ||
                                             (newTabData.tabEndDateISO !== oldTabData.tabEndDateISO)))) {
        this.updateInternals();
      }
    }
  }
  // Called after the initial render.
  // I guess (?) the div is reliably available and highcharts can access it and draw to it.
  componentDidMount() {
    this.updateInternals();
  }
  datepickerUpdate(event,picker) {
    this.props.update_widget_plus_save(this.props.widgetindex,{
      configDisplay: 'none',
      myStartDateISO: picker.startDate.toISOString(),
      myEndDateISO:   picker.endDate.toISOString()
    });
  }
  flipToOtherSide() {
    this.props.update_widget(this.props.widgetindex,{
      fob: (this.props.widgets[this.props.widgetindex].data.fob === 'back' ? 'front' : 'back')
    });
  }
  render() {
    var props = this.props;
    var widgetdata = props.widgets[props.widgetindex].data;    
    var ranges = {
      'Today':        [moment(), moment()],
      'Yesterday':    [moment().subtract(1, 'days'), moment().subtract(1, 'days')],
      'Last 7 Days':  [moment().subtract(6, 'days'), moment()],
      'Last 30 Days': [moment().subtract(29, 'days'), moment()],
      'This Month':   [moment().startOf('month'), moment().endOf('month')],
      'Last Month':   [moment().subtract(1, 'month').startOf('month'), moment().subtract(1, 'month').endOf('month')],
      'This Year':    [moment().startOf('year'), moment().endOf('year')],
    };
    var outersizecss = '';
    var innerchartcss = '';
    var innerdatacss = '';
    if ((widgetdata.width === 'half') && (widgetdata.height === 'half')) {
      innerchartcss = 'widget-chart-container-hh';
      innerdatacss = 'widget-data-container-hh';
      outersizecss = 'widget-container-hh';
    } else if ((widgetdata.width === 'full') && (widgetdata.height === 'half')) {
      innerchartcss = 'widget-chart-container-fh';
      innerdatacss = 'widget-data-container-fh';
      outersizecss = 'widget-container-fh';
    } else if ((widgetdata.width === 'half') && (widgetdata.height === 'full')) {
      innerchartcss = 'widget-chart-container-hf';
      innerdatacss = 'widget-data-container-hf';
      outersizecss = 'widget-container-hf';
    } else if ((widgetdata.width === 'full') && (widgetdata.height === 'full')) {
      innerchartcss = 'widget-chart-container-ff';
      innerdatacss = 'widget-data-container-ff';
      outersizecss = 'widget-container-ff';
    }
    return(
        <div className={outersizecss}>
        <img className='widget-cog-left' onClick={this.openWidgetConfig.bind(this)} src='cog_icon.png'/>
        {(() => {
          switch (widgetdata.timeframe) {
          case 'tab':  return(<img className='widget-cog-right' src='lock_time.png'/>);
          case 'custom': return(<div className='daterangepickerholder-small'><DateRangePicker onApply={this.datepickerUpdate} startDate={moment(widgetdata.myStartDateISO)} endDate={moment(widgetdata.myEndDateISO)} ranges={ranges} alwaysShowCalendars={false}><div>{moment(widgetdata.myStartDateISO).format('MM/DD/YYYY')}-{moment(widgetdata.myEndDateISO).format('MM/DD/YYYY')}</div></DateRangePicker></div>);
          default: return (<div className='widget-cog-right'></div>);
          }
        })()}
        <div style={{clear:'both'}}></div>
        <div className={innerchartcss} style={{visibility:(widgetdata.fob === 'front'?'visible':'hidden')}} ref='chart'></div>
        <div className={innerdatacss} style={{visibility:(widgetdata.fob === 'back'?'visible':'hidden')}} ref='chartdata'></div>
        {(() => {
          switch (props.widgets[props.widgetindex].data.type) {
          case 'pie':         return(<WidgetConfigPie widgetindex={props.widgetindex}/>);
          case 'bar':         return(<WidgetConfigBar widgetindex={props.widgetindex}/>);
          case 'column':      return(<WidgetConfigColumn widgetindex={props.widgetindex}/>);
          case 'line':        return(<WidgetConfigLine widgetindex={props.widgetindex}/>);
          case 'histogram':   return(<WidgetConfigHistogram widgetindex={props.widgetindex}/>);
          case 'stats':       return(<WidgetConfigStats widgetindex={props.widgetindex}/>);
          case 'scatter':     return(<WidgetConfigScatter widgetindex={props.widgetindex}/>);
          }
        })()}
        <img className='widget-flippy-right' src='flippy.png' onClick={this.flipToOtherSide}></img>);
        </div>);
  }
}

////////////////////////////////////////////////////////////////////////////////
// I think:
// This maps the state, or part of it, to our props.

const mapStateToProps = (state) => ({
  widgets: state.widgets,
  dashLayout: state.dashLayout,
  currentTab: state.currentTab,
  fullstate: state
})

// I think:
// This maps the dispatch tools, or some of them, to our props.

const mapDispatchToProps = (dispatch) => ({
  add_widget:              ()                    => dispatch({type: 'ADD_WIDGET',    data:{type:'pie'}}),
  update_widget:           (widgetindex,changes) => dispatch({type: 'UPDATE_WIDGET', widgetindex:widgetindex,changes:changes}),
  update_widget_plus_save: (widgetindex,changes) => dispatch({type: 'UPDATE_WIDGET_PLUS_SAVE',widgetindex:widgetindex,changes:changes})
})

////////////////////////////////////////////////////////////////////////////////

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Widget);
