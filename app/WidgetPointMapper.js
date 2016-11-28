var React = require('react');
var ReactDOM = require('react-dom');
var moment = require('moment');
import L from 'leaflet';

import {CircleMarker,Map,TileLayer,GeoJson} from 'react-leaflet';
import {REST_multiplevalue,completeParams,getColor,tableFromRawData,postFilter} from './support.js';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

class WidgetPointMapper extends React.Component {
  constructor(props) {
    super();
    this.state = {
      rawData: undefined,
      longitude: props.widgets[props.widgetindex].data.longitude,
      latitude: props.widgets[props.widgetindex].data.latitude,
      zoom: props.widgets[props.widgetindex].data.zoom,
      key: 0
    };
    this.reloadData = this.reloadData.bind(this);
    this.onEachFeature = this.onEachFeature.bind(this);
    this.pointToLayer = this.pointToLayer.bind(this);
  }

  componentDidUpdate(prevProps,prevState) {
    var thisthis = this;
    var newData = this.props.widgets[this.props.widgetindex].data;
    var oldData = prevProps.widgets[prevProps.widgetindex].data;
    var newTabData = this.props.dashLayout[this.props.currentTab];
    var oldTabData = prevProps.dashLayout[this.props.currentTab];
    if ((newData.source                  !== oldData.source) ||
        (newData.metrics[0]              !== oldData.metrics[0]) ||
        (newData.metrics[1]              !== oldData.metrics[1]) ||
        (newData.metrics[2]              !== oldData.metrics[2]) ||
        (newData.metrics[3]              !== oldData.metrics[3]) ||
        (JSON.stringify(newData.filters) !== JSON.stringify(oldData.filters)) ||
        (newData.timeframe               !== oldData.timeframe) ||
        (newData.myStartDateISO          !== oldData.myStartDateISO) ||
        (newData.myEndDateISO            !== oldData.myEndDateISO) ||
        (newData.width                   !== oldData.width) ||
        (newData.height                  !== oldData.height) ||
        ((newData.timeframe === 'tab') && ((newTabData.tabStartDateISO !== oldTabData.tabStartDateISO) ||
                                           (newTabData.tabEndDateISO !== oldTabData.tabEndDateISO)))) {
      this.reloadData();
    }
    if (newData.showBackground !== oldData.showBackground) {
      this.render();
    }
    if (JSON.stringify(newData.postfilters) !== JSON.stringify(oldData.postfilters)) {
      var rawData = this.state.rawData;
      var filteredRawData = postFilter({metrics:newData.metrics,data:rawData},newData.postfilters);
      // Construct the chart data and fill in the chart.
      $(ReactDOM.findDOMNode(thisthis.refs.chartdata)).html(tableFromRawData({metrics:newData.metrics,data:filteredRawData.data},(newData.mytitle === undefined ? '' : newData.mytitle)));
      var g = [];
      _.each(filteredRawData.data,function(datum,i) {
        g.push({"type": "Feature",
                "geometry": {"type": "Point", "coordinates": [datum.longitude,datum.latitude]},
                "properties": {'title':datum.category}
               });
      });
      var dummy = {
        type: 'FeatureCollection',
        features: g
      };
      this.setState({data:dummy,key: 1-this.state.key});
    }    
  }

  reloadData() {
    var thisthis = this;
    var props = this.props;
    var data = props.widgets[props.widgetindex].data;
    if ((data.source     === '(undefined)') ||
        (data.metrics[0] === '(undefined)') ||
        (data.metrics[1] === '(undefined)') ||
        (data.metrics[2] === '(undefined)') ||
        (data.metrics[3] === '(undefined)') ||
        (data.label      === '(undefined)') ||
        (data.timeframe  === '(undefined)')) {
      thisthis.setState({rawData: undefined,filteredRawData: undefined,key: 1-thisthis.state.key })
      //$(ReactDOM.findDOMNode(chart)).html('<div class="nice-middle">Choropleth Widget Not Configured</div>');
    } else {
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
      //$(ReactDOM.findDOMNode(this.refs.chart)).html('<div class="nice-middle">Choropleth Widget Loading</div>');
      this.setState({rawData:undefined,filteredRawData:undefined});
      $.post(
        REST_multiplevalue(),
        completeParams({
          source:    data.source,
          metrics:   data.metrics.join(','),
          filters:   fs
        }),
        function(rawData) {
          // Postfilter the data.
          var filteredRawData = postFilter({metrics:data.metrics,data:rawData.data},data.postfilters);
          var g = [];
          _.each(filteredRawData.data,function(datum,i) {
            g.push({"type": "Feature",
                    "geometry": {"type": "Point", "coordinates": [datum[data.metrics[2]],datum[data.metrics[1]]]},
                    "properties": {'title':datum[data.metrics[3]]}
                   });
          });
          var dummy = {
            type: 'FeatureCollection',
            features: g
          };            
          // Construct the chart data and fill in the chart.
          $(ReactDOM.findDOMNode(thisthis.refs.chartdata)).html(tableFromRawData({metrics:data.metrics,data:filteredRawData.data},(data.mytitle === undefined ? '' : data.mytitle)));
          // The data property is not dynamic, meaning that changing it
          // does not trigger an update of the component.  So we save
          // a key which alternates back and forth and makes sure to
          // trigger an update.
          thisthis.setState({data:dummy,rawData: rawData.data,filteredRawData: filteredRawData.data,key: 1-thisthis.state.key })
        });
    }
  }

  componentDidMount() {
    this.reloadData();
  }
  pointToLayer(feature, latlng) {
    // renders our GeoJSON points as circle markers, rather than Leaflet's default image markers
    // parameters to style the GeoJSON markers
    var markerParams = {
      radius: 4,
      fillColor: 'red',
      color: '#fff',
      weight: 1,
      opacity: 0.5,
      fillOpacity: 0.8
    };
    return L.circleMarker(latlng, markerParams);
  }
  
  onEachFeature(feature,layer) {
    layer.bindPopup(feature.properties.title);
    layer.on('mouseover', function() { layer.openPopup(); });
    layer.on('mouseout', function() { layer.closePopup(); });
  }

  render() {
    var thisthis = this;
    var widgetdata = this.props.widgets[this.props.widgetindex].data;
    var innerchartcss = 'widget-chart-container-'+widgetdata.width+'-'+widgetdata.height;
    var innerdatacss = 'widget-data-container-'+widgetdata.width+'-'+widgetdata.height;
    return (
        <div>

        <div className={innerchartcss} style={{visibility:(widgetdata.fob === 'front'?'inherit':'hidden')}} ref='chart'>        
        {this.state.filteredRawData !== undefined ?
         <div>
         {/*<div className='widget-choropleth-title'>{widgetdata.mytitle}</div>*/}

         <Map key={this.state.key} bounds={widgetdata.bounds} center={[this.state.latitude,this.state.longitude]} zoom={this.state.zoom} scrollWheelZoom={false} attributionControl={false}>
         {widgetdata.showBackground ? <TileLayer url='http://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}.png'/> : ''}
         <GeoJson key={this.state.key} pointToLayer={this.pointToLayer} onEachFeature={this.onEachFeature} data={this.state.data}>
         </GeoJson>
         </Map>

         </div>
         : <div className='nice-middle'><div className='loading-spinner'></div><br/><br/>Retrieving Data</div>}
      </div>
        <div className={innerdatacss} style={{visibility:(widgetdata.fob === 'back' ? 'inherit':'hidden')}} ref='chartdata'>
        {this.state.data === undefined ?
         <div className='nice-middle'><div className='loading-spinner'></div><br/><br/>Retrieving Data</div>
         : <div/>}
      </div>
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
  fullstate: state,
})

// I think:
// This maps the dispatch tools, or some of them, to our props.

const mapDispatchToProps = (dispatch) => ({
  update_widget_plus_save: (widgetindex,changes) => dispatch({type: 'UPDATE_WIDGET_PLUS_SAVE',widgetindex:widgetindex,changes:changes}),
  update_widget:           (widgetindex,changes) => dispatch({type: 'UPDATE_WIDGET',widgetindex:widgetindex,changes:changes})
})

////////////////////////////////////////////////////////////////////////////////

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(WidgetPointMapper);
