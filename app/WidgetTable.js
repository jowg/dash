var React = require('react');
var ReactDOM = require('react-dom');
var moment = require('moment');
var Highcharts = require('highcharts');

import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import {postFilter,niceDate,getTimeframeRanges,REST_multiplevalue,completeParams,tableFromRawData} from './support.js';

class WidgetStats extends React.Component {
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
        (JSON.stringify(newData.metrics) !== JSON.stringify(oldData.metrics)) ||
        (JSON.stringify(newData.filters) !== JSON.stringify(oldData.filters)) ||
        (newData.timeframe               !== oldData.timeframe) ||
        (newData.myStartDateISO          !== oldData.myStartDateISO) ||
        (newData.myEndDateISO            !== oldData.myEndDateISO) ||
        (newData.width                   !== oldData.width) ||
        (newData.height                  !== oldData.height) ||
        ((newData.timeframe === 'tab') && ((newTabData.tabStartDateISO !== oldTabData.tabStartDateISO) || (newTabData.tabEndDateISO !== oldTabData.tabEndDateISO)))) {
      this.reloadData();
    }
    if (JSON.stringify(newData.postfilters) !== JSON.stringify(oldData.postfilters)) {
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
    if ((data.source === '(undefined)') || (data.metrics[0] === '(undefined)') || (data.timeframe === '(undefined)')) {
      $(ReactDOM.findDOMNode(chart)).html('Table Widget Not Configured!');
    } else {
      $(ReactDOM.findDOMNode(chart)).html('<div class="nice-middle">Retrieving Data</div>');
      $(ReactDOM.findDOMNode(thisthis.refs.chartdata)).html('<div class="nice-middle">Retrieving Data</div>');
      $.post(
        REST_multiplevalue(),
        completeParams({
          source:  data.source,
          metrics: data.metrics.join(','),
          filters: fs
        }),
        function(rawData) {
          thisthis.setState({rawData:rawData});
          thisthis.plot(rawData);
        }
      )
    }
  }

  plot(rawData) {
    var thisthis = this;
    var chart = this.refs.chart;
    var props = this.props;
    var data = props.widgets[props.widgetindex].data;
    // First we post-filter the rawData.
    rawData = postFilter({metrics:data.metrics,data:rawData.data},data.postfilters);
    // Then proceed.
    if (rawData.data.length === 0) {
      $(ReactDOM.findDOMNode(chart)).html('Table Widget Has No Data!');
      return false;
    }    
    $(ReactDOM.findDOMNode(thisthis.refs.chartdata)).html(tableFromRawData(rawData,data.mytitle));

  }

  componentDidMount() {
    this.reloadData();
  }

  render() {
    var widgetdata = this.props.widgets[this.props.widgetindex].data;
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
)(WidgetStats);