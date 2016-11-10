var React = require('react');
var ReactDOM = require('react-dom');
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import {getMetricsForSource,getSources,getAggMethods,calculateNewLayout,getTimeframeOptions} from './support.js';
import SelectFilter from './SelectFilter.js';
import SelectMove from './SelectMove.js';
import SelectSize from './SelectSize.js';
import BorderTopPlusClose from './BorderTopPlusClose.js';

require('./dash.css');

// How does the dash get access to the store?

class WidgetConfigGeospatial extends React.Component {
  constructor(props) {
    super();
    var data = props.widgets[props.widgetindex].data;
    this.state = {
      source:      data.source,
      metrics:     data.metrics,
      filters:     data.filters,
      timeframe:   data.timeframe,
      width:       data.width,
      height:      data.height,
      moveValue:   -0.5
    }
    this.selectSourceUpdate      = this.selectSourceUpdate.bind(this);
    this.selectMetricUpdate      = this.selectMetricUpdate.bind(this);
    this.updateWidget            = this.updateWidget.bind(this);
    this.cancelConfig            = this.cancelConfig.bind(this);
    this.selectFilterUpdate      = this.selectFilterUpdate.bind(this);
    this.selectMoveValueUpdate   = this.selectMoveValueUpdate.bind(this);
    this.updateLayout            = this.updateLayout.bind(this);
    this.deleteWidget            = this.deleteWidget.bind(this);
    this.selectTimeframeUpdate   = this.selectTimeframeUpdate.bind(this);
    this.selectSizeUpdate        = this.selectSizeUpdate.bind(this);
  }
  selectSourceUpdate(e) {
    this.setState({
      source:  e.target.value,
      metrics: ['(undefined)'],
      filters: []
    });
  }
  selectMetricUpdate(i,e) {
    var metrics = JSON.parse(JSON.stringify(this.state.metrics));
    metrics[i] = e.target.value;
    this.setState({metrics:metrics});
  }
  selectFilterUpdate(value) {
    this.setState({filters:value});
  }
  selectMoveValueUpdate(value) {
    this.setState({moveValue:value});
  }
  selectTimeframeUpdate(e) {
    this.setState({timeframe:e.target.value});
  }
  updateLayout() {
    var newDashLayout = calculateNewLayout(this.props.currentTab,this.props.dashLayout,this.props.widgetindex,Number(this.state.moveValue));
    this.props.update_widget(this.props.widgetindex,{configDisplay: 'none'});
    this.props.update_layout(newDashLayout);
  }
  updateWidget() {
    // Update the widget according to props.
    this.props.update_widget_plus_save(this.props.widgetindex,{
      configDisplay: 'none',
      source:        this.state.source,
      metrics:       this.state.metrics,
      timeframe:     this.state.timeframe,
      filters:       this.state.filters,
      width:         this.state.width,
      height:        this.state.height
    });
  }
  cancelConfig() {
    // Reset the configuration state to the old props state.
    var oldState = this.props.widgets[this.props.widgetindex].data;
    this.setState({
      source:        oldState.source,
      metrics:       oldState.metrics,
      filters:       oldState.filters,
      width:         oldState.width,
      height:        oldState.height
    });
    this.props.update_widget(this.props.widgetindex,{configDisplay: 'none'});
  }
  deleteWidget() {
    this.props.delete_widget(this.props.widgetindex);
  }
  selectSizeUpdate(dim,value) {
    if (dim === 'width') {this.setState({width:value})}
    if (dim === 'height') {this.setState({height:value})}
  }
  render() {
    var props            = this.props;
    var dashLayout       = this.props.dashLayout;
    var data             = props.widgets[props.widgetindex].data;
    var sources          = getSources();
    var metrics          = getMetricsForSource(this.state.source);
    var timeframeOptions = getTimeframeOptions();
    metrics.unshift('(undefined)');
    return (
        <div style={{display: data.configDisplay}}>
        <div className='deactivating-overlay'></div>
        <div className='widget-config-window'>
        <BorderTopPlusClose onClose={this.cancelConfig} title='Geospatial Widget Configuration'/>
        <div className='bandsubtitle'>Choose Source & Metrics</div>
        <div className='simpleborder'>
        Source
        <select onChange={this.selectSourceUpdate} value={this.state.source}>
        {sources.map(function(option,i) {return (<option key={i} value={option}>{option}</option>)})}
      </select>
        </div>
        <div className='simpleborder'>
        Numerical Choropleth Metric
        <select onChange={this.selectMetricUpdate.bind(this,0)} value={this.state.metrics[0]}>
        {metrics.map(function(metric,i) {return (<option key={i} value={metric}>{metric}</option>)})}
      </select>
        </div>
        <div className='simpleborder'>
        Labeling Metric
        <select onChange={this.selectMetricUpdate.bind(this,1)} value={this.state.metrics[1]}>
        {metrics.map(function(metric,i) {return (<option key={i} value={metric}>{metric}</option>)})}
      </select>
        </div>
        <div className='simpleborder'>
        Filters
        <SelectFilter selectFilterUpdate={this.selectFilterUpdate} options={metrics} filters={this.state.filters} />
        </div>
        <div className='simpleborder'>
        Time Frame
        <select onChange={this.selectTimeframeUpdate} value={this.state.timeframe}>
        {timeframeOptions.map(function(option,i) {return (<option key={i} value={option}>{option}</option>)})}
      </select>
        </div>
        <div className='simpleborder'>
        <SelectSize selectSizeUpdate={this.selectSizeUpdate} width={this.state.width} height={this.state.height} layout={props.dashLayout[props.currentTab].layout} widgetindex={props.widgetindex}/>
        </div>
        <button className='config-window-button' onClick={this.updateWidget}>Update</button>
        <br/><br/>
        <div className='bandsubtitle'>Move Widget</div>
        <div className='simpleborder'>
        <SelectMove selectMoveUpdate={this.selectMoveValueUpdate} myIndex={props.widgetindex} tabCurrent={this.props.currentTab} tabLayout={dashLayout} widgets={props.widgets}/>
        </div>
        <button className='config-window-button' onClick={this.updateLayout}>Move</button>
        <br/><br/>
        <div className='bandsubtitle'>Delete Widget</div>
        <br/>
        <button className='config-window-button' onClick={this.deleteWidget}>Delete</button>
        <br/><br/>
        </div>
        </div>
    );
  }
}

////////////////////////////////////////////////////////////////////////////////
// I think:
// This maps the state, or part of it, to our props.

const mapStateToProps = (state) => ({
  widgets:    state.widgets,
  dashLayout: state.dashLayout,
  currentTab: state.currentTab
})

// I think:
// This maps the dispatch tools, or some of them, to our props.

const mapDispatchToProps = (dispatch,ownProps) => ({
  update_widget:           (widgetindex,changes) => dispatch({type: 'UPDATE_WIDGET',widgetindex:widgetindex,changes:changes}),
  update_widget_plus_save: (widgetindex,changes) => dispatch({type: 'UPDATE_WIDGET_PLUS_SAVE',widgetindex:widgetindex,changes:changes}),
  update_layout:           (newLayout)           => dispatch({type: 'UPDATE_LAYOUT',newLayout:newLayout}),
  delete_widget:           (widgetindex)         => dispatch({type: 'DELETE_WIDGET',widgetindex:widgetindex})
})

////////////////////////////////////////////////////////////////////////////////

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(WidgetConfigGeospatial);
