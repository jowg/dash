var React = require('react');
var ReactDOM = require('react-dom');
var moment = require('moment');

import {Map,TileLayer,GeoJson} from 'react-leaflet';
import {REST_aggregate,completeParams,getColor,tableFromRawData} from './support.js';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import WidgetChoroplethInfo from './WidgetChoroplethInfo.js';

class WidgetChoropleth extends React.Component {
  constructor(props) {
    super();
    this.state = {
      data: undefined,
      longitude: props.widgets[props.widgetindex].data.longitude,
      latitude: props.widgets[props.widgetindex].data.latitude,
      zoom: props.widgets[props.widgetindex].data.zoom,
      key: 0,
      currentLabel: 'Hover for Data',
      //showBackground: props.widgets[props.widgetindex].data.showBackground,
      //obeyChoropleth: props.widgets[props.widgetindex].data.obeyChoropleth
    };
    this.reloadData = this.reloadData.bind(this);
    this.choroplethStyle = this.choroplethStyle.bind(this);
    this.onEachFeature = this.onEachFeature.bind(this);
    this.featureClicked = this.featureClicked.bind(this);
    this.featureEnter = this.featureEnter.bind(this);
    this.featureExit = this.featureExit.bind(this);
  }

  onEachFeature(feature,layer) {
    var thisthis = this;
    var widgetdata = this.props.widgets[this.props.widgetindex].data;
    const datum = widgetdata.metrics[1]+': '+feature.properties[widgetdata.metrics[1]]+'<br>'+widgetdata.aggMethod+'('+widgetdata.metrics[0]+'): '+feature.properties[widgetdata.metrics[0]];
    //layer.bindPopup(datum);
    layer.on('mouseover', function (e) {
      //thisthis.setState({currentLabel: datum});
    });
    layer.on('mouseout', function (e) {
      //thisthis.setState({currentLabel: 'Hover for Data'});
    });
    // New Stuff.
    // Figure out which precinct we're on and set the widget with index 0 to have that filter.
    layer.on({
      click: thisthis.featureClicked,
      mouseover: thisthis.featureEnter,
      mouseout: thisthis.featureExit
    });
  }

  featureEnter(e) {
    e.target.setStyle({weight: 3});
  }
  featureExit(e) {
    e.target.setStyle({weight: 1});
  }

  featureClicked(e) {
    // 0 controls 1,8.9
    if (this.props.widgetindex === 0) {
      var p = e.target.feature.properties.precinct;
      this.props.update_widget(1,{
        mytitle: 'Precinct: '+p,
        filters: [{"metric":"precinct","comp":"==","value":p}],
      });
      this.props.update_widget(8,{
        mytitle: 'Precinct: '+p,
        filters: [{"metric":"precinct","comp":"==","value":p}]
      });
      this.props.update_widget(9,{
        mytitle: 'Precinct: '+p,
        filters: [{"metric":"precinct","comp":"==","value":p}]
      });
    }
    // 2 controls 3,4
    if (this.props.widgetindex === 2) {
      var s = e.target.feature.properties.sector;
      var p = e.target.feature.properties.preds;
      this.props.update_widget(3,{
        mytitle: 'Preds for all Sectors',
        specialColumnValue: p
      });
      this.props.update_widget(4,{
        mytitle: 'Sector: ' + s,
        postfilters: [{"metric":"sector","comp":"==","value":s}]
      });
    }
    // 6 controls 5,7
    if (this.props.widgetindex === 6) {
      var s = e.target.feature.properties.sector;
      this.props.update_widget(5,{
        mytitle: 'Sector: ' + s,
        filters: [{"metric":"sector","comp":"==","value":s}]
      });
      this.props.update_widget(7,{
        mytitle: 'Sector: ' + s,
        filters: [{"metric":"sector","comp":"==","value":s}]
      });
    }
    // 11 controls 10 and 12.
    if (this.props.widgetindex === 11) {
      var s = e.target.feature.properties.sector;
      var b = e.target.getBounds();
      this.props.update_widget(10,{
        mytitle: '2016/01/01 - 311 Listing for Sector: ' + s,
        postfilters: [{"metric":"sector","comp":"==","value":s}]
      });
      this.props.update_widget(12,{
        mytitle: '2016/01/01 - 311 Listing for Sector: ' + s,
        postfilters: [{"metric":"sector","comp":"==","value":s}],
        bounds: [[b.getSouth(),b.getWest()],[b.getNorth(),b.getEast()]]        
      });
    }
  }

  componentDidUpdate(prevProps,prevState) {
    var newData = this.props.widgets[this.props.widgetindex].data;
    var oldData = prevProps.widgets[prevProps.widgetindex].data;
    var newTabData = this.props.dashLayout[this.props.currentTab];
    var oldTabData = prevProps.dashLayout[this.props.currentTab];
    if ((newData.source                  !== oldData.source) ||
        (newData.metrics[0]              !== oldData.metrics[0]) ||
        (newData.metrics[1]              !== oldData.metrics[1]) ||
        (newData.aggMethod               !== oldData.aggMethod) ||
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
    if ((newData.showBackground !== oldData.showBackground) ||
        (newData.obeyChoropleth !== oldData.obeyChoropleth)) {
      //this.reloadData();
      this.render();
    }
  }

  reloadData() {
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
      this.setState({data:undefined});
      $.post(
        REST_aggregate(),
        completeParams({
          source:    data.source,
          method:    data.aggMethod,
          aggmetric: data.metrics[1],
          metrics:   data.metrics[0],
          filters:   fs,
          addgeo:    data.metrics[1]
        }),
        function(rawData) {
          // Construct the chart data and fill in the chart.
          var chartData = {
            metrics:data.metrics,
            data:[]
          };
          _.each(rawData.data,function(datum) {
            var v = {};
            v[data.metrics[0]] = datum[data.metrics[0]];
            v[data.metrics[1]] = datum[data.metrics[1]];
            chartData.data.push(v);
          });
          $(ReactDOM.findDOMNode(thisthis.refs.chartdata)).html(tableFromRawData(chartData,(data.mytitle === undefined ? '' : data.mytitle)));
          // Construct the choropleth data.
          var max = rawData.data[0][data.metrics[0]];
          var min = max;
          var g = [];
          var id = 0;
          _.each(rawData.data,function(datum) {
            //console.log(datum[data.metrics[1]]);
            if (rawData.geo[datum[data.metrics[1]]] !== undefined) {
              datum.geojsonfeature = rawData.geo[datum[data.metrics[1]]];
              //datum.geojsonfeature = JSON.parse(datum.geojsonfeature);
              var v = datum[data.metrics[0]];
              if (v < min) {min = v;}
              if (v > max) {max = v;}
              datum.geojsonfeature.properties[data.metrics[0]] = datum[data.metrics[0]];
              datum.geojsonfeature.properties[data.metrics[1]] = datum[data.metrics[1]];
              if (datum.geojsonfeature.id === undefined) {
                datum.geojsonfeature.id = id;
                id++;
              }
              g.push(datum.geojsonfeature);
            }
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
    this.reloadData();
  }

  choroplethStyle(features) {
    if (this.props.widgets[this.props.widgetindex].data.obeyChoropleth) {
      var v = (features.properties[this.props.widgets[this.props.widgetindex].data.metrics[0]]-this.state.min)/(this.state.max-this.state.min);
      return {
        fillColor: getColor(v),
        weight: 1,
        opacity: 1,
        color: '#555555',
        fillOpacity: 0.7
      };
    } else {
      return {
        fillColor: '#ffffff',
        weight: 1,
        opacity: 1,
        color: '#555555',
        fillOpacity: 0.7
      };
    }
  }

  render() {
    var widgetdata = this.props.widgets[this.props.widgetindex].data;
    var innerchartcss = 'widget-chart-container-'+widgetdata.width+'-'+widgetdata.height;
    var innerdatacss = 'widget-data-container-'+widgetdata.width+'-'+widgetdata.height;
    return (
        <div>
        <div className={innerchartcss} style={{visibility:(widgetdata.fob === 'front'?'inherit':'hidden')}} ref='chart'>
        {this.state.data !== undefined ?
         <div>
         {/*<div className='widget-choropleth-title'>
         {widgetdata.obeyChoropleth ? widgetdata.aggMethod+'('+widgetdata.metrics[0]+') by '+widgetdata.metrics[1] : widgetdata.metrics[1]}
         </div>*/}
         <Map key={this.state.key} bounds={widgetdata.bounds} center={[this.state.latitude,this.state.longitude]} zoom={this.state.zoom} scrollWheelZoom={false} attributionControl={false}>
         {widgetdata.showBackground ? <TileLayer url='http://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}.png'/> : ''}
         <GeoJson key={this.state.key} onEachFeature={this.onEachFeature} style={this.choroplethStyle} data={this.state.data}>
         {/*<WidgetChoroplethInfo key={this.state.key} myLabel={this.state.currentLabel}/>*/}
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
)(WidgetChoropleth);