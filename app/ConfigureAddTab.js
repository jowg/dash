var React = require('react');
var ReactDOM = require('react-dom');
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
var moment = require('moment');
import BorderTopPlusClose from './BorderTopPlusClose.js';

class ConfigureAddTab extends React.Component {
  constructor(props) {
    super();
    this.state = {
      tabName:''
    }
    this.cancelButtonHandler = this.cancelButtonHandler.bind(this);
    this.updateButtonHandler = this.updateButtonHandler.bind(this);
    this.onChange = this.onChange.bind(this);
  }
  cancelButtonHandler() {
    this.props.update_dash({configAddTabDisplay: 'none'});
  }
  updateButtonHandler() {
    if (this.state.tabName !== '') {
      var oldDash = JSON.parse(JSON.stringify(this.props.dashLayout));
      oldDash.push({tabName:         this.state.tabName,
                    layout:          [],
                    tabStartDateISO: moment('2016-06-15T00:00:00').toISOString(),
                    tabEndDateISO:   moment('2016-06-30T00:00:00').toISOString()});
      this.props.update_dash_plus_save({dashLayout: oldDash,configAddTabDisplay: 'none'});
    } else {
      this.cancelButtonHandler();
    }
  }
  onChange(e) {
    var text = e.target.value;
    text=text.replace(/\W+/g, '');
    this.setState({tabName:text});
  }
  render() {
    return (
        <div>
        <div className="deactivating-overlay"></div>
        <div className='addTabWindow'>
        <BorderTopPlusClose onClose={this.cancelButtonHandler} title='Add Tab'/>
        <br/>
        Enter Tab Name<br/>
        (Alphanumeric Only)
        <br/>
        <br/>
        <input className='addTabTextfield' type="text" value={this.state.tabName} onChange={this.onChange.bind(this)}/>
        <br/><br/>
        <button className='config-window-button' onClick={this.updateButtonHandler}>Add Tab</button>
        </div>
        </div>
    );
  }
}

////////////////////////////////////////////////////////////////////////////////
// I think:
// This maps the state, or part of it, to our props.

const mapStateToProps = (state) => ({
  dashLayout: state.dashLayout
})

// I think:
// This maps the dispatch tools, or some of them, to our props.

const mapDispatchToProps = (dispatch,ownProps) => ({
  update_dash:             (changes) => dispatch({type: 'UPDATE_DASH',changes:changes}),
  update_dash_plus_save:   (changes) => dispatch({type: 'UPDATE_DASH_PLUS_SAVE',changes:changes}),
})

////////////////////////////////////////////////////////////////////////////////

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ConfigureAddTab);

