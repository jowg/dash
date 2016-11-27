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

class WidgetConfigChoropleth extends React.Component {
  constructor(props) {
    super();
    var data = props.widgets[props.widgetindex].data;
    this.state = {
      source:         data.source,
      metrics:        data.metrics,
      aggMethod:      data.aggMethod,
      filters:        data.filters,
      timeframe:      data.timeframe,
      width:          data.width,
      height:         data.height,
      latitude:       data.latitude,
      longitude:      data.longitude,
      zoom:           data.zoom,
      moveValue:      -0.5,
      showBackground: data.showBackground,
      obeyChoropleth: data.obeyChoropleth
    }
    this.selectSourceUpdate         = this.selectSourceUpdate.bind(this);
    this.selectMetricUpdate         = this.selectMetricUpdate.bind(this);
    this.updateWidget               = this.updateWidget.bind(this);
    this.cancelConfig               = this.cancelConfig.bind(this);
    this.selectFilterUpdate         = this.selectFilterUpdate.bind(this);
    this.selectMoveValueUpdate      = this.selectMoveValueUpdate.bind(this);
    this.selectAggMethodUpdate      = this.selectAggMethodUpdate.bind(this);
    this.selectShowBackgroundUpdate = this.selectShowBackgroundUpdate.bind(this);
    this.selectObeyChoroplethUpdate = this.selectObeyChoroplethUpdate.bind(this);
    this.updateLayout               = this.updateLayout.bind(this);
    this.deleteWidget               = this.deleteWidget.bind(this);
    this.selectTimeframeUpdate      = this.selectTimeframeUpdate.bind(this);
    this.selectSizeUpdate           = this.selectSizeUpdate.bind(this);
    this.onChangeLatitude           = this.onChangeLatitude.bind(this);
    this.onChangeLongitude          = this.onChangeLongitude.bind(this);
    this.onChangeZoom               = this.onChangeZoom.bind(this);
  }
  selectSourceUpdate(e) {
    this.setState({
      source:         e.target.value,
      metrics:        ['(undefined)'],
      aggMethod:      ['(undefined)'],      
      filters:        [],
      showBackground: true,
      obeyChoropleth: true
    });
  }
  selectMetricUpdate(i,e) {
    var metrics = JSON.parse(JSON.stringify(this.state.metrics));
    metrics[i] = e.target.value;
    this.setState({metrics:metrics});
  }
  selectAggMethodUpdate(e) {
    this.setState({aggMethod:e.target.value});
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
  selectShowBackgroundUpdate(e) {
    this.setState({showBackground:e.target.checked});
  }
  selectObeyChoroplethUpdate(e) {
    this.setState({obeyChoropleth:e.target.checked});
  }
  updateLayout() {
    var newDashLayout = calculateNewLayout(this.props.currentTab,this.props.dashLayout,this.props.widgetindex,Number(this.state.moveValue));
    this.props.update_widget(this.props.widgetindex,{configDisplay: 'none'});
    this.props.update_layout(newDashLayout);
  }
  updateWidget() {
    // Update the widget according to props.
    this.props.update_widget_plus_save(this.props.widgetindex,{
      configDisplay:  'none',
      source:         this.state.source,
      metrics:        this.state.metrics,
      aggMethod:      this.state.aggMethod,
      timeframe:      this.state.timeframe,
      filters:        this.state.filters,
      width:          this.state.width,
      height:         this.state.height,
      latitude:       Number(this.state.latitude),
      longitude:      Number(this.state.longitude),
      zoom:           Number(this.state.zoom),
      showBackground: this.state.showBackground,
      obeyChoropleth: this.state.obeyChoropleth
    });
  }
  cancelConfig() {
    // Reset the configuration state to the old props state.
    var oldState = this.props.widgets[this.props.widgetindex].data;
    this.setState({
      source:         oldState.source,
      metrics:        oldState.metrics,
      aggMethod:      oldState.aggMethod,
      timeframe:      oldState.timeframe,
      filters:        oldState.filters,
      width:          oldState.width,
      height:         oldState.height,
      latitude:       oldState.latitude,
      longitude:      oldState.longitude,
      zoom:           oldState.zoom,
      showBackground: oldState.showBackground,
      obeyChoropleth: oldState.obeyChoropleth
    });
    this.props.update_widget(this.props.widgetindex,{configDisplay: 'none'});
  }
  onChangeLatitude(e) {
    this.setState({latitude: e.target.value});
  }
  onChangeLongitude(e) {
    this.setState({longitude: e.target.value});
  }
  onChangeZoom(e) {
    this.setState({zoom: e.target.value});
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
    var metrics          = this.state.source === '(undefined)' ? [] : getMetricsForSource(this.state.source);
    var timeframeOptions = getTimeframeOptions();
    var aggMethods       = getAggMethods();
    metrics.unshift('(undefined)');
    return (
        <div style={{display: data.configDisplay}}>
        <div className='deactivating-overlay'></div>
        <div className='widget-config-window'>
        <BorderTopPlusClose onClose={this.cancelConfig} title='Choropleth Widget Configuration'/>
        <div className='bandsubtitle'>Choose Source & Metrics</div>
        <div className='simpleborder'>
        Source
        <select onChange={this.selectSourceUpdate} value={this.state.source}>
        {sources.map(function(option,i) {return (<option key={i} value={option}>{option}</option>)})}
      </select>
        </div>
        <div className='simpleborder'>
        Choropleth Region Aggregation Metric
        <select onChange={this.selectMetricUpdate.bind(this,1)} value={this.state.metrics[1]}>
        {metrics.map(function(metric,i) {return (<option key={i} value={metric}>{metric}</option>)})}
      </select>
        <br/>
        Aggregate Method
        <select onChange={this.selectAggMethodUpdate} value={this.state.aggMethod}>
        {aggMethods.map(function(option,i) {return (<option key={i} value={option}>{option}</option>)})}
      </select>        
        </div>
        <div className='simpleborder'>
        Choropleth Metric
        <select onChange={this.selectMetricUpdate.bind(this,0)} value={this.state.metrics[0]}>
        {metrics.map(function(metric,i) {return (<option key={i} value={metric}>{metric}</option>)})}
      </select>
        </div>
        <div className='simpleborder'>        
        <label><input type='checkbox' checked={this.state.showBackground} onChange={this.selectShowBackgroundUpdate} /> Show Background</label>
        <br/>
        <label><input type='checkbox' checked={this.state.obeyChoropleth} onChange={this.selectObeyChoroplethUpdate} /> Obey Choropleth</label>
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
        Initial Latitude:
        <input type="text" value={this.state.latitude} onChange={this.onChangeLatitude.bind(this)}/>
        <br/>
        Initial Longitude:
        <input type="text" value={this.state.longitude} onChange={this.onChangeLongitude.bind(this)}/>
        <br/>
        Initial Zoom:
        <input type="text" value={this.state.zoom} onChange={this.onChangeZoom.bind(this)}/>
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
)(WidgetConfigChoropleth);
