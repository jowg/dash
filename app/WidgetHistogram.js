var React = require('react');
var ReactDOM = require('react-dom');
var moment = require('moment');
var Highcharts = require('highcharts');

import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import {postFilter,niceDate,getTimeframeRanges,completeParams,tableFromRawData,REST_multiplevalue} from './support.js';

class WidgetHistogram extends React.Component {
  constructor(props) {
    super();
    this.state = {rawData: undefined}
    this.reloadData = this.reloadData.bind(this);
    this.plot = this.plot.bind(this);
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
        (newData.width                   !== oldData.width) ||
        (newData.height                  !== oldData.height) ||
        ((newData.timeframe === 'tab') && ((newTabData.tabStartDateISO !== oldTabData.tabStartDateISO) || (newTabData.tabEndDateISO !== oldTabData.tabEndDateISO)))) {
      this.reloadData();
    }
    if ((newData.specialColumnValue !== oldData.specialColumnValue) ||
        (newData.buckets            !== oldData.buckets) ||
        (JSON.stringify(newData.postfilters) !== JSON.stringify(oldData.postfilters))) {
      this.plot(this.state.rawData);
    }
  }

  reloadData() {
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
      $(ReactDOM.findDOMNode(chart)).html('<div class="nice-middle"><div class="loading-spinner"></div><br><br>Retrieving Data</div>');
      $(ReactDOM.findDOMNode(thisthis.refs.chartdata)).html('<div class="nice-middle"><div class="loading-spinner"></div><br><br>Retrieving Data</div>');
      $.post(
        REST_multiplevalue(),
        completeParams({
          source:       data.source,
          metrics:      data.metrics[0],
          filters:      fs
        }),
        function(rawData) {
          thisthis.setState({rawData:rawData});
          thisthis.plot(rawData);
        }
      );
    }
  }

  plot(rawData) {
    var thisthis = this;
    var chart = this.refs.chart;
    var data = this.props.widgets[this.props.widgetindex].data;
    var cats = [];
    var vals = [];
    // First we post-filter the rawData.
    rawData = postFilter({metrics:data.metrics,data:rawData.data},data.postfilters);
    // Then proceed.
    if (rawData.data.length === 0) {
      $(ReactDOM.findDOMNode(chart)).html('Histogram Widget Has No Data!');
      return false;
    }
    // Load the raw data into the raw data table.
    $(ReactDOM.findDOMNode(thisthis.refs.chartdata)).html(tableFromRawData({metrics:data.metrics,data:rawData.data},(data.mytitle === undefined ? '' : data.mytitle)));
    // Then set up the plot.
    var plotdata = rawData.data;
    var metricNumData = _.pluck(plotdata,data.metrics[0]);
    if (metricNumData.some(isNaN)) {
      $(ReactDOM.findDOMNode(chart)).html('<div class="nice-middle">Histogram Widget Data Error</div>');
      return false;
    }
    var min = Math.min(...metricNumData);
    var max = Math.max(...metricNumData);
    max = max + 0.1*(max-min);
    min = min - 0.1*(max-min);
    for (var i=0;i<data.buckets;i++) {
      var left = Math.round( 100* (min+i*(max-min)/data.buckets) ) / 100;
      var right = Math.round( 100* (min+(i+1)*(max-min)/data.buckets) ) / 100;
      cats.push(left+"-"+right);
      //data.specialColumnValue = Math.round(100*data.specialColumnValue)/100;
      if ((data.specialColumnValue >= left) && (data.specialColumnValue < right)) {
        vals.push({y:0,color:'#ff0000'});
      } else {
        vals.push({y:0});
      }
    }
    _.each(metricNumData,function(datum) {
      var c = Math.floor((datum-min)/((max-min)/data.buckets));
      vals[c].y++;
    });
	  Highcharts.chart(ReactDOM.findDOMNode(chart),{
      chart: {
        type: 'column'
      },
      credits: {
        enabled: false
      },
      title: {
          text: data.mytitle === undefined ? 'Histogram' : data.mytitle
      },
      subtitle: {
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
        animation: false,
        dataLabels: {
          enabled: true
        }
      }]
    });
  }

  componentDidMount() {
    this.reloadData();
  }

  render() {
    var widgetdata = this.props.widgets[this.props.widgetindex].data;
    var outersizecss = 'widget-container-'+widgetdata.width+'-'+widgetdata.height;
    var innersubcss = 'widget-sub-container-'+widgetdata.width+'-'+widgetdata.height;
    var innerchartcss = 'widget-chart-container-'+widgetdata.width+'-'+widgetdata.height;
    var innerdatacss = 'widget-data-container-'+widgetdata.width+'-'+widgetdata.height;
    return (
        <div>
        <div className={innerchartcss} style={{visibility:(widgetdata.fob === 'front'?'visible':'hidden')}} ref='chart'/>
        <div className={innerdatacss} style={{visibility:(widgetdata.fob === 'back'?'visible':'hidden')}} ref='chartdata'></div>
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
