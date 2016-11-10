var React = require('react');
var ReactDOM = require('react-dom');
var moment = require('moment');
var Highcharts = require('highcharts');

import { Map ,TileLayer,GeoJson } from 'react-leaflet';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import {niceDate,getTimeframeRanges,dataRestPoint,completeParams,tableFromRawData} from './support.js';


class WidgetHistogram extends React.Component {
  constructor(props) {
    super();
    this.state = {
      data: undefined,
      lat: 40.7831,      
      lng: -73.9712,
      zoom: 9
    };
    this.updateInternals = this.updateInternals.bind(this);
  }

  componentDidUpdate(prevProps,prevState) {
    var newData = this.props.widgets[this.props.widgetindex].data;
    var oldData = prevProps.widgets[prevProps.widgetindex].data;
    var newTabData = this.props.dashLayout[this.props.currentTab];
    var oldTabData = prevProps.dashLayout[this.props.currentTab];
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

  componentDidMount() {
    this.updateInternals();
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
    var innersubcss = '';
    var innerchartcss = '';
    var innerdatacss = '';
    if ((widgetdata.width === 'half') && (widgetdata.height === 'half')) {
      innerchartcss = 'widget-chart-container-hh';
      innerdatacss = 'widget-data-container-hh';
      outersizecss = 'widget-container-hh';
      innersubcss = 'widget-sub-container-hh';
    } else if ((widgetdata.width === 'full') && (widgetdata.height === 'half')) {
      innerchartcss = 'widget-chart-container-fh';
      innerdatacss = 'widget-data-container-fh';
      outersizecss = 'widget-container-fh';
      innersubcss = 'widget-sub-container-fh';
    } else if ((widgetdata.width === 'half') && (widgetdata.height === 'full')) {
      innerchartcss = 'widget-chart-container-hf';
      innerdatacss = 'widget-data-container-hf';
      outersizecss = 'widget-container-hf';
      innersubcss = 'widget-sub-container-hf';
    } else if ((widgetdata.width === 'full') && (widgetdata.height === 'full')) {
      innerchartcss = 'widget-chart-container-ff';
      innerdatacss = 'widget-data-container-ff';
      outersizecss = 'widget-container-ff';
      innersubcss = 'widget-sub-container-ff';
    }
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
)(WidgetHistogram);
