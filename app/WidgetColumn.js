var React = require('react');
var ReactDOM = require('react-dom');
var moment = require('moment');
var Highcharts = require('highcharts');

import { Map ,TileLayer,GeoJson } from 'react-leaflet';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import {niceDate,getTimeframeRanges,dataRestPoint,completeParams,tableFromRawData} from './support.js';


class WidgetColumn extends React.Component {
  constructor(props) {
    super();
    this.updateInternals = this.updateInternals.bind(this);
  }

  componentDidUpdate(prevProps,prevState) {
    var newData = this.props.widgets[this.props.widgetindex].data;
    var oldData = prevProps.widgets[prevProps.widgetindex].data;
    var newTabData = this.props.dashLayout[this.props.currentTab];
    var oldTabData = prevProps.dashLayout[this.props.currentTab];
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
    if ((data.source === '(undefined)') || (data.metrics[0] === '(undefined)') || (data.metrics[1] === '(undefined)') || (data.aggMethod === '(undefined)') || (data.timeframe === '(undefined)')) {
      $(ReactDOM.findDOMNode(chart)).html('<div class="nice-middle">Column Widget Not Configured</div>');
    } else {
      $(ReactDOM.findDOMNode(chart)).html('<div class="nice-middle">Retrieving Data</div>');
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
          if (rawData.error === 1) {
            $(ReactDOM.findDOMNode(chart)).html('<div class="nice-middle">Column Widget Data Error</div>');
            return false;
          }
          // Load the raw data into the raw data table and make it nice if necessary.
          var tableData = JSON.parse(JSON.stringify(rawData.data));
          if ((data.aggNumeric == true) || (data.aggDatetime == true)) {
            tableData.sort(function(a,b) {return a[data.metrics[0]] - b[data.metrics[0]];});
          }
          if (data.aggDatetime === true) {
            _.each(tableData,function(datum,i) {
              tableData[i][data.metrics[0]] = niceDate(1000*datum[data.metrics[0]]);
            });
          }
          $(ReactDOM.findDOMNode(thisthis.refs.chartdata)).html(tableFromRawData({metrics:data.metrics,data:tableData}));
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
              tooltip: {
                formatter: function () {
                  return '<b>'+this.point.z+'</b><br>'+this.point.y;
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

  componentDidMount() {
    this.updateInternals();
  }

  render() {
    var widgetdata = this.props.widgets[this.props.widgetindex].data;
    var outersizecss = 'widget-container-'+widgetdata.width+'-'+widgetdata.height;
    var innersubcss = 'widget-sub-container-'+widgetdata.width+'-'+widgetdata.height;
    var innerchartcss = 'widget-chart-container-'+widgetdata.width+'-'+widgetdata.height;
    var innerdatacss = 'widget-data-container-'+widgetdata.width+'-'+widgetdata.height;
    return (
        <div>
        <div className={innerchartcss} style={{display:(widgetdata.fob === 'front'?'inline-block':'none')}} ref='chart'/>
        <div className={innerdatacss} style={{display:(widgetdata.fob === 'back'?'inline-block':'none')}} ref='chartdata'></div>
        </div>
    );
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
})

////////////////////////////////////////////////////////////////////////////////

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(WidgetColumn);
