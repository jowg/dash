var React = require('react');
var ReactDOM = require('react-dom');
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import BorderTopPlusClose from './BorderTopPlusClose.js';

var moment = require('moment');

class ConfigureAddWidget extends React.Component {
  constructor(props) {
    super();
    var configs = [
      {type:             'pie',
       width:            'half',
       height:           'half',
       source:           '(undefined)',
       aggNumeric:       false,
       aggDatetime:      false,
       aggMethod:        '(undefined)',
       metrics:          ['(undefined)','(undefined)'],
       myStartDateISO:   moment().toISOString(),
       myEndDateISO:     moment().toISOString(),
       filters:          [],
       timeframe:        '(undefined)',
       configDisplay:    'none',
       title:            'Pie Chart',
       description:      'Basic pie chart which uses an agreggating metric to aggregate a numerical metric.'
      },
      {type:             'bar',
       width:            'half',
       height:           'half',
       source:           '(undefined)',
       aggNumeric:       false,
       aggDatetime:      false,
       aggMethod:        '(undefined)',
       metrics:          ['(undefined)','(undefined)'],
       myStartDateISO:   moment().toISOString(),
       myEndDateISO:     moment().toISOString(),
       filters:          [],
       timeframe:        '(undefined)',
       configDisplay:    'none',
       title:            'Horizontal Bar Chart',
       description:      'Basic horizontal bar chart which uses an agreggating metric to aggregate a numerical metric.'
      },
      {type:             'line',
       width:            'half',
       height:           'half',
       source:           '(undefined)',
       aggNumeric:       false,
       aggDatetime:      false,
       aggMethod:        '(undefined)',
       metrics:          ['(undefined)','(undefined)'],
       myStartDateISO:   moment().toISOString(),
       myEndDateISO:     moment().toISOString(),
       filters:          [],
       timeframe:        '(undefined)',
       configDisplay:    'none',
       title:            'Line Graph',
       description:      'Horizontal line graph for viewing progressive numerical data.'
      },
      {type:             'column',
       width:            'half',
       height:           'half',
       source:           '(undefined)',
       aggNumeric:       false,
       aggDatetime:      false,
       aggMethod:        '(undefined)',
       metrics:          ['(undefined)','(undefined)'],
       myStartDateISO:   moment().toISOString(),
       myEndDateISO:     moment().toISOString(),
       filters:          [],
       timeframe:        '(undefined)',
       configDisplay:    'none',
       title:            'Vertical Bar Chart',
       description:      'Basic vertical bar chart which uses an agreggating metric to aggregate a numerical metric.'
      },
      {type:             'stats',
       width:            'half',
       height:           'half',
       source:           '(undefined)',
       metrics:          ['(undefined)'],
       myStartDateISO:   moment().toISOString(),
       myEndDateISO:     moment().toISOString(),
       filters:          [],
       timeframe:        '(undefined)',
       configDisplay:    'none',
       title:            'Simple Statistics',
       description:      'Provides a basic statistical breakdown of a numerical metric.'
      },
      {type:             'scatter',
       width:            'half',
       height:           'half',
       source:           '(undefined)',
       metrics:          ['(undefined)','(undefined)'],
       myStartDateISO:   moment().toISOString(),
       myEndDateISO:     moment().toISOString(),
       filters:          [],
       timeframe:        '(undefined)',
       configDisplay:    'none',
       title:            'Scatter Plot',
       description:      'Plots two numerical metrics against one another.'
      },
      {type:             'histogram',
       width:            'half',
       height:           'half',
       source:           '(undefined)',
       metrics:          ['(undefined)'],
       buckets:          '(undefined)',
       myStartDateISO:   moment().toISOString(),
       myEndDateISO:     moment().toISOString(),
       filters:          [],
       timeframe:        '(undefined)',
       configDisplay:    'none',
       title:            'Histogram',
       description:      'Breaks down a numerical metric into a fixed number of buckets.'
      }
    ];
    this.state = {
      configs: configs,
      widgetType: ''
    };
    this.cancelButtonHandler = this.cancelButtonHandler.bind(this);
    this.updateButtonHandler = this.updateButtonHandler.bind(this);
  }
  cancelButtonHandler() {
    this.props.update_dash({configAddWidgetDisplay: 'none'});
  }
  updateButtonHandler(i) {
    this.props.add_widget(this.state.configs[i]);
  }
  render() {
    var thisthis = this;
    return (
        <div>
        <div className="deactivating-overlay"></div>
        <div className='addwidgetwindow'>
        <BorderTopPlusClose onClose={this.cancelButtonHandler} title='Pick Widget Type'/>
        <div className='addwidgetwindowinner'>
        {thisthis.state.configs.map(function(wc,wci) {
          return(<div key={wci} className='addwidgetdiv' onClick={thisthis.updateButtonHandler.bind(thisthis,wci)}>
                 <div className='addwidgetdiv-title'>{wc.title}</div>
                 <div className='addwidgetdiv-text'>{wc.description}</div>
                </div>);
        })}
        <br/>
        </div>
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
  configAddWidgetDisplay: state.configAddWidgetDisplay
})

// I think:
// This maps the dispatch tools, or some of them, to our props.

const mapDispatchToProps = (dispatch,ownProps) => ({
  update_dash:   (changes) => dispatch({type: 'UPDATE_DASH',changes:changes}),
  add_widget:    (data) => dispatch({type: 'ADD_WIDGET',data:data})
})

////////////////////////////////////////////////////////////////////////////////

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ConfigureAddWidget);
