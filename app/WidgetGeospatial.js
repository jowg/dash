var React = require('react');
var ReactDOM = require('react-dom');
var moment = require('moment');

import {Map,TileLayer,GeoJson} from 'react-leaflet';
import {dataRestPoint,completeParams,jsonRestPoint,getColor,tableFromRawData} from './support.js';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

class WidgetGeospatial extends React.Component {
  constructor(props) {
    super();
    this.state = {
      data: undefined,
      longitude: props.widgets[props.widgetindex].data.longitude,
      latitude: props.widgets[props.widgetindex].data.latitude,
      zoom: props.widgets[props.widgetindex].data.zoom,
      key: 0
    };
    this.updateInternals = this.updateInternals.bind(this);
    this.style = this.style.bind(this);
    this.onEachFeature = this.onEachFeature.bind(this);
  }

  onEachFeature(feature,layer) {
    var widgetdata = this.props.widgets[this.props.widgetindex].data;
    const datum = '<h3>'+widgetdata.metrics[0]+': '+feature.properties[widgetdata.metrics[0]]+'</h3>';
    layer.bindPopup(datum);
    //layer.on('click', function (e) {
    //});
  }

  componentDidUpdate(prevProps,prevState) {
    var newData = this.props.widgets[this.props.widgetindex].data;
    var oldData = prevProps.widgets[prevProps.widgetindex].data;
    var newTabData = this.props.dashLayout[this.props.currentTab];
    var oldTabData = prevProps.dashLayout[this.props.currentTab];
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

  updateInternals() {
    var thisthis = this;
    var props = this.props;
    var data = props.widgets[props.widgetindex].data;
    if ((data.source     === '(undefined)') ||
        (data.metrics[0] === '(undefined)') ||
        (data.metrics[1] === '(undefined)') ||
        (data.label      === '(undefined)') ||
        (data.timeframe  === '(undefined)')) {
      var dummy = {
        type: 'FeatureCollection',
        crs: {
          type: 'name',
          properties: {
            name: 'dummy'
          }
        },
        features: []
      };

      thisthis.setState({data: dummy,key: 1-thisthis.state.key })
      //$(ReactDOM.findDOMNode(chart)).html('<div class="nice-middle">Geospatial Widget Not Configured</div>');
    } else {
      $.post(
        dataRestPoint(),
        completeParams({
          source: data.source,
          metrics: data.metrics[0]+','+data.metrics[1]+',geojsonfeature'
        }),
        function(rawData) {
          var chartData = {
            metrics:[rawData.metrics[1],rawData.metrics[0]],
            data:[]
          };
          _.each(rawData.data,function(datum) {
            var v = {};
            v[rawData.metrics[0]] = datum[rawData.metrics[0]];
            v[rawData.metrics[1]] = datum[rawData.metrics[1]];
            chartData.data.push(v);
          });
          $(ReactDOM.findDOMNode(thisthis.refs.chartdata)).html(tableFromRawData(chartData));
          var max = rawData.data[0][data.metrics[0]];
          var min = max;
          var g = [];
          _.each(rawData.data,function(datum) {
            datum.geojsonfeature = JSON.parse(datum.geojsonfeature);
            var v = datum[data.metrics[0]];
            if (v < min) {min = v;}
            if (v > max) {max = v;}
            datum.geojsonfeature.properties[data.metrics[0]] = datum[data.metrics[0]];
            g.push(datum.geojsonfeature);
          });
          // The data property is not dynamic, meaning that changing it
          // does not trigger an update of the component.  So we save
          // a key which alternates back and forth and makes sure to
          // trigger an update.
          var dummy = {
            type: 'FeatureCollection',
            crs: {
              type: 'name',
              properties: {
                name: 'dummy'
              }
            },
            features: g
          };
          thisthis.setState({min:min,max:max,data: dummy,key: 1-thisthis.state.key })
        });
    }
  }

  componentDidMount() {
    this.updateInternals();
  }

  style(features) {
    var v = (features.properties[this.props.widgets[this.props.widgetindex].data.metrics[0]]-this.state.min)/(this.state.max-this.state.min);
    return {
      fillColor: getColor(v),
      weight: 1,
      opacity: 1,
      color: 'white',
      dashArray: '3',
      fillOpacity: 0.7
    };
  }

  render() {
    var widgetdata = this.props.widgets[this.props.widgetindex].data;
    var outersizecss = 'widget-container-'+widgetdata.width+'-'+widgetdata.height;
    var innersubcss = 'widget-sub-container-'+widgetdata.width+'-'+widgetdata.height;
    var innerchartcss = 'widget-chart-container-'+widgetdata.width+'-'+widgetdata.height;
    var innerdatacss = 'widget-data-container-'+widgetdata.width+'-'+widgetdata.height;
    return (
        <div>
        <div className={innerchartcss} style={{display:(widgetdata.fob === 'front'?'inline-block':'none')}} ref='chart'>
        <Map center={[this.state.latitude,this.state.longitude]} zoom={this.state.zoom} scrollWheelZoom={false} attributionControl={false}>
        <TileLayer url='http://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}.png'/>
        {this.state.data !== undefined ? <GeoJson key={this.state.key} onEachFeature={this.onEachFeature} style={this.style} data={this.state.data}/> : <div/>}
      </Map>
        </div>
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
)(WidgetGeospatial);
