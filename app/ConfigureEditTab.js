var React = require('react');
var ReactDOM = require('react-dom');
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
var moment = require('moment');
import BorderTopPlusClose from './BorderTopPlusClose.js';

class ConfigureEditTab extends React.Component {
  constructor(props) {
    super();
    this.state = {
      tabName: props.dashLayout[props.currentTab].tabName
    }
    this.cancelButtonHandler = this.cancelButtonHandler.bind(this);
    this.updateButtonHandler = this.updateButtonHandler.bind(this);
    this.onChange = this.onChange.bind(this);
  }
  cancelButtonHandler() {
    this.props.update_dash({configEditTabDisplay: 'none'});
  }
  componentWillReceiveProps(prevProps) {
    this.setState({
      tabName: this.props.dashLayout[this.props.currentTab].tabName
    });
  }
  updateButtonHandler() {
    if (this.state.tabName !== '') {
      var oldDash = JSON.parse(JSON.stringify(this.props.dashLayout));
      oldDash[this.props.currentTab].tabName = this.state.tabName.trim().replace(/\s+/g, ' ');
      this.props.update_dash_plus_save({dashLayout: oldDash,configEditTabDisplay: 'none'});
    } else {
      this.props.update_dash({configEditTabDisplay: 'none'});
    }
  }
  onChange(e) {
    this.setState({tabName:e.target.value});
  }
  render() {
    return (
        <div>
        <div className="deactivating-overlay"></div>
        <div className='addTabWindow'>
        <BorderTopPlusClose onClose={this.cancelButtonHandler} title='Edit Tab'/>
        <br/>
        Enter Tab Name<br/>
        (Alphanumeric Only)
        <br/><br/>
        <input className='addTabTextfield' type="text" value={this.state.tabName} onChange={this.onChange.bind(this)}/>
        <br/><br/>
        <button className='config-window-button' onClick={this.updateButtonHandler}>Save Tab</button>
        </div>
        </div>
    );
  }
}

////////////////////////////////////////////////////////////////////////////////
// I think:
// This maps the state, or part of it, to our props.

const mapStateToProps = (state) => ({
  dashLayout: state.dashLayout,
  currentTab: state.currentTab
})

// I think:
// This maps the dispatch tools, or some of them, to our props.

const mapDispatchToProps = (dispatch,ownProps) => ({
  update_dash:             (changes) => dispatch({type: 'UPDATE_DASH',changes:changes}),
  update_dash_plus_save:   (changes) => dispatch({type: 'UPDATE_DASH_PLUS_SAVE',changes:changes})
})

////////////////////////////////////////////////////////////////////////////////

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ConfigureEditTab);
