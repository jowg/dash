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

class SelectBar extends React.Component {
  constructor(props) {
    super();
    //var data = props.widgets[props.widgetindex].data;
    this.state = {
      control:     props.control,
      current:     props.current === undefined ? props.choices[0] : props.current,
      choices:     props.choices
    }
    this.selectChoiceUpdate      = this.selectChoiceUpdate.bind(this);
  }
  selectChoiceUpdate(e) {
    console.log(e);
    this.setState({
      current: e
    });
    var v = {};
    v['configDisplay'] = 'none';
    v[this.props.control] = e
    this.props.update_widget_plus_save(this.props.widgetindex,v);
  }
  render() {
    var thisthis = this;
    return (
        <div style={{display:'inline-block'}}>
        {thisthis.state.choices.map(function(option,index) {
          if (index == 0) {
            return(<div className={option===thisthis.state.current ? 'widget-options-div-left-selected' : 'widget-options-div-left'} style={{width:thisthis.props.width}} onClick={thisthis.selectChoiceUpdate.bind(thisthis,option)}>{option}</div>)
          } else if (index === thisthis.state.choices.length-1) {
            return(<div className={option===thisthis.state.current ? 'widget-options-div-right-selected' : 'widget-options-div-right'} style={{width:thisthis.props.width}} onClick={thisthis.selectChoiceUpdate.bind(thisthis,option)}>{option}</div>)
          } else {
            return(<div className={option===thisthis.state.current ? 'widget-options-div-selected' : 'widget-options-div'} style={{width:thisthis.props.width}} onClick={thisthis.selectChoiceUpdate.bind(thisthis,option)}>{option}</div>)
          }
        })}
      </div>
    );
  }
}

////////////////////////////////////////////////////////////////////////////////
// I think:
// This maps the state, or part of it, to our props.

const mapStateToProps = (state) => ({
  widgets:    state.widgets,
})

// I think:
// This maps the dispatch tools, or some of them, to our props.

const mapDispatchToProps = (dispatch,ownProps) => ({
  update_widget_plus_save: (widgetindex,changes) => dispatch({type: 'UPDATE_WIDGET_PLUS_SAVE',widgetindex:widgetindex,changes:changes}),
})

////////////////////////////////////////////////////////////////////////////////

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(SelectBar);
