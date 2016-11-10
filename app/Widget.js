var React = require('react');
var ReactDOM = require('react-dom');
var Highcharts = require('highcharts');
var moment = require('moment');
var DateRangePicker = require('react-bootstrap-daterangepicker');
var L = require('leaflet')

//import {Map,TileLayer } from 'react-leaflet';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import {niceDate,getTimeframeRanges,dataRestPoint,completeParams,tableFromRawData} from './support.js';

import WidgetConfigPie        from './WidgetConfigPie.js';
import WidgetConfigBar        from './WidgetConfigBar.js';
import WidgetConfigLine       from './WidgetConfigLine.js';
import WidgetConfigColumn     from './WidgetConfigColumn.js';
import WidgetConfigHistogram  from './WidgetConfigHistogram.js';
import WidgetConfigStats      from './WidgetConfigStats.js';
import WidgetConfigScatter    from './WidgetConfigScatter.js';
import WidgetConfigGeospatial from './WidgetConfigGeospatial.js';

import WidgetGeospatial from './WidgetGeospatial.js';
import WidgetPie        from './WidgetPie.js';
import WidgetHistogram  from './WidgetHistogram.js';
import WidgetBar        from './WidgetBar.js';
import WidgetColumn     from './WidgetColumn.js';
import WidgetStats      from './WidgetStats.js';
import WidgetScatter    from './WidgetScatter.js';
import WidgetLine       from './WidgetLine.js';

require('./dash.css');
require('./daterangepicker.css');
require('./leaflet.css');

// How does the dash get access to the store?


class Widget extends React.Component {
  constructor(props) {
    super();
    this.openWidgetConfig = this.openWidgetConfig.bind(this);
    this.datepickerUpdate = this.datepickerUpdate.bind(this);
    this.flipToOtherSide  = this.flipToOtherSide.bind(this);
  }
  openWidgetConfig() {
    this.props.update_widget(this.props.widgetindex,{
      configDisplay: 'block'
    });
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
    var innersubcss = '';
    if ((widgetdata.width === 'half') && (widgetdata.height === 'half')) {
      outersizecss = 'widget-container-hh';
      innersubcss = 'widget-sub-container-hh';
    } else if ((widgetdata.width === 'full') && (widgetdata.height === 'half')) {
      outersizecss = 'widget-container-fh';
      innersubcss = 'widget-sub-container-fh';
    } else if ((widgetdata.width === 'half') && (widgetdata.height === 'full')) {
      outersizecss = 'widget-container-hf';
      innersubcss = 'widget-sub-container-hf';
    } else if ((widgetdata.width === 'full') && (widgetdata.height === 'full')) {
      outersizecss = 'widget-container-ff';
      innersubcss = 'widget-sub-container-ff';
    }
    return(
        <div className={outersizecss}>
        <img className='widget-cog-left' onClick={this.openWidgetConfig.bind(this)} src='cog_icon.png'/>
        {(() => {
          switch (widgetdata.timeframe) {
          case 'tab':  return(<img className='widget-cog-right' src='lock_time.png'/>);
          case 'custom': return(
              <div className='daterangepickerholder-small'>
              <DateRangePicker onApply={this.datepickerUpdate} startDate={moment(widgetdata.myStartDateISO)} endDate={moment(widgetdata.myEndDateISO)} ranges={ranges} alwaysShowCalendars={false}>
              <div>{moment(widgetdata.myStartDateISO).format('MM/DD/YYYY')}-{moment(widgetdata.myEndDateISO).format('MM/DD/YYYY')}</div>
              </DateRangePicker>
              </div>);
          default: return (<div className='widget-cog-right' style={{visible:'hidden'}}></div>);
          }
        })()}
        <div style={{clear:'both'}}></div>
        <div className={innersubcss}>

        {(() => {
          switch (widgetdata.type) {
          case 'pie':         return(<WidgetPie        widgetindex={this.props.widgetindex}/>);
          case 'bar':         return(<WidgetBar        widgetindex={this.props.widgetindex}/>);
          case 'histogram':   return(<WidgetHistogram  widgetindex={this.props.widgetindex}/>);
          case 'column':      return(<WidgetColumn     widgetindex={this.props.widgetindex}/>);
          case 'stats':       return(<WidgetStats      widgetindex={this.props.widgetindex}/>);
          case 'scatter':     return(<WidgetScatter    widgetindex={this.props.widgetindex}/>);
          case 'line':        return(<WidgetLine       widgetindex={this.props.widgetindex}/>);
          case 'geospatial':  return(<WidgetGeospatial widgetindex={this.props.widgetindex}/>);
          }
        })()}

        </div>
        <img className='widget-flippy-right' src='flippy.png' onClick={this.flipToOtherSide}></img>

        {(() => {
          switch (props.widgets[props.widgetindex].data.type) {
          case 'pie':         return(<WidgetConfigPie        widgetindex={props.widgetindex}/>);
          case 'bar':         return(<WidgetConfigBar        widgetindex={props.widgetindex}/>);
          case 'column':      return(<WidgetConfigColumn     widgetindex={props.widgetindex}/>);
          case 'line':        return(<WidgetConfigLine       widgetindex={props.widgetindex}/>);
          case 'histogram':   return(<WidgetConfigHistogram  widgetindex={props.widgetindex}/>);
          case 'stats':       return(<WidgetConfigStats      widgetindex={props.widgetindex}/>);
          case 'scatter':     return(<WidgetConfigScatter    widgetindex={props.widgetindex}/>);
          case 'geospatial':  return(<WidgetConfigGeospatial widgetindex={props.widgetindex}/>);
          }
        })()}
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
