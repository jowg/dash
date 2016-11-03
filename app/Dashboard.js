var React = require('react');
var ReactDOM = require('react-dom');
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import Widget from './Widget.js';
import ConfigureAddWidget from './ConfigureAddWidget.js';
import ConfigureAddTab from './ConfigureAddTab.js';
import ConfigureEditTab from './ConfigureEditTab.js';
import ConfigureLogin from './ConfigureLogin.js';
var DateRangePicker = require('react-bootstrap-daterangepicker');
var moment = require('moment');
import {saveDashboard,saveloadRestPoint,checkPassword,attemptloginRestPoint} from './support.js';

require('./dash.css');

// How does the dash get access to the store?


class Dashboard extends React.Component {
  constructor(props) {
    super();
    this.changeCurrentTab    = this.changeCurrentTab.bind(this);
    this.openAddWidgetWindow = this.openAddWidgetWindow.bind(this);
    this.openAddTabWindow    = this.openAddTabWindow.bind(this);
    this.openEditTabWindow   = this.openEditTabWindow.bind(this);
    this.datepickerUpdate    = this.datepickerUpdate.bind(this);
    this.toggleTabHideDate   = this.toggleTabHideDate.bind(this);
    this.deleteCurrentTab    = this.deleteCurrentTab.bind(this);
    this.attemptLogin        = this.attemptLogin.bind(this);
    this.loadData            = this.loadData.bind(this);
    this.state = {
      loggedin: false,
      errorloggingin: false
    }
  }
  componentDidMount() {

    // Set a cookie on the client.
    // This cookies should be set with the username from the login window
    // and that username should also be adjusting the dashboard id.
    // Or something.

    //console.log('document.cookie = ' + document.cookie);
    //document.cookie = 'sessionid=xyz123';


  }
  attemptLogin(username,password) {
    var thisthis = this;
    $.get(
      attemptloginRestPoint(),
      {username: username,
       password: password
      },
      function(rawData) {
        if (rawData.good === 1) {
          thisthis.loadData(username);
          thisthis.setState({loggedin:true,errorloggingin:false});
        } else {
          //console.log('Error Logging In!');
          thisthis.setState({loggedin:false,errorloggingin:true});
        }
      }
    );

    //this.loadData(username);

  }
  loadData(sessionid) {
    var thisthis = this;
    $.get(
      saveloadRestPoint(),
      {saveload: 'load',
       dashboardid: sessionid//thisthis.props.fullstate.did
      },
      function(rawData) {
        thisthis.props.load_data_into_dashboard(rawData.data);
      }
    );
  }
  componentDidUpdate(prevProps,prevState) {
    // This code would save the state on every miniscule change.
    // Good for flushing any issues.
    //saveDashboard(this.props.fullstate);
  }
  changeCurrentTab(newTab) {
    this.props.change_current_tab(newTab);
  }
  openAddWidgetWindow() {
    this.props.update_dash({configAddWidgetDisplay: 'block'});
  }
  openAddTabWindow() {
    this.props.update_dash({configAddTabDisplay: 'block'});
  }
  openEditTabWindow() {
    this.props.update_dash({configEditTabDisplay: 'block'});
  }
  datepickerUpdate(event,picker) {
    var oldDash = JSON.parse(JSON.stringify(this.props.dashLayout));
    oldDash[this.props.currentTab].tabStartDateISO = picker.startDate.toISOString();
    oldDash[this.props.currentTab].tabEndDateISO   = picker.endDate.toISOString();
    this.props.update_dash_plus_save({dashLayout: oldDash});
  }
  toggleTabHideDate() {
    var oldDash = JSON.parse(JSON.stringify(this.props.dashLayout));
    oldDash[this.props.currentTab].tabHideDate = !oldDash[this.props.currentTab].tabHideDate;
    this.props.update_dash_plus_save({dashLayout: oldDash});
  }
  deleteCurrentTab() {
    var oldDash = JSON.parse(JSON.stringify(this.props.dashLayout));
    oldDash.splice(this.props.currentTab,1);
    this.props.update_dash_plus_save({dashLayout: oldDash});
  }
  render() {
    var thisthis = this;
    var props = this.props;
    var currentDash = this.props.dashLayout[this.props.currentTab];
    var ranges = {
      'Today':        [moment(), moment()],
      'Yesterday':    [moment().subtract(1, 'days'), moment().subtract(1, 'days')],
      'Last 7 Days':  [moment().subtract(6, 'days'), moment()],
      'Last 30 Days': [moment().subtract(29, 'days'), moment()],
      'This Month':   [moment().startOf('month'), moment().endOf('month')],
      'Last Month':   [moment().subtract(1, 'month').startOf('month'), moment().subtract(1, 'month').endOf('month')],
      'This Year':    [moment().startOf('year'), moment().endOf('year')],
    };
    // If we're not logged in, only display the login prompt.
    // This login check should be replaced by the cookie check.
    if (!this.state.loggedin) {
      return(<div style={{display:this.props.configLogin}}><ConfigureLogin errorloggingin={this.state.errorloggingin} attemptLogin={this.attemptLogin}/></div>);
    }
    // Otherwise do the full thing.
    return(
        <div>
        <div style={{display:this.props.configAddWidgetDisplay}}><ConfigureAddWidget/></div>
        <div style={{display:this.props.configAddTabDisplay}}><ConfigureAddTab/></div>
        <div style={{display:this.props.configEditTabDisplay}}><ConfigureEditTab/></div>
        <div className='topbar'>
        <div className='dashboardidholder'>Dashboard ID: {this.props.did}</div>
        {currentDash.tabHideDate ? <div/> : <div className='daterangepickerholder-dash'><DateRangePicker onApply={this.datepickerUpdate} startDate={moment(currentDash.tabStartDateISO)} endDate={moment(currentDash.tabEndDateISO)} ranges={ranges} alwaysShowCalendars={false}><div>{moment(currentDash.tabStartDateISO).format('MM/DD/YYYY')}-{moment(currentDash.tabEndDateISO).format('MM/DD/YYYY')}</div></DateRangePicker></div>}
        </div>
        <div className='tabholder-left'>
        {props.dashLayout.map(function(tab,tabindex) {
          return(
              <div className={props.currentTab==tabindex ? 'tab-selected' : 'tab-unselected'} key={tabindex} onClick={thisthis.changeCurrentTab.bind(this,tabindex)}>{tab.tabName}</div>
          )
        })}
        <div className="dropdown">
        <div className='dropbtn'>Tools</div>
        <div className="dropdown-content">
        <div className='addstuffbutton' onClick={thisthis.openAddWidgetWindow}>Add Widget</div>
        <div className='addstuffbutton' onClick={thisthis.openEditTabWindow}>Rename Tab</div>
        <div className='addstuffbutton' onClick={thisthis.openAddTabWindow}>Add Tab</div>
        {((currentDash.layout.length === 0) && (this.props.dashLayout.length > 1)) ? <div className='addstuffbutton' onClick={thisthis.deleteCurrentTab}>Delete Tab</div> : ''}
        <div className='addstuffbutton' onClick={thisthis.toggleTabHideDate}>{currentDash.tabHideDate ? 'Show Tab Date' : 'Hide Tab Date'}</div>
        </div>
        </div>
        </div>
        {props.dashLayout.map(function(tab,tabindex) {
          return(
              <div className={props.currentTab==tabindex ? 'tabsheet-visible' : 'tabsheet-invisible'} key={tabindex}>
              {_.flatten(tab.layout.map(function(row,rowindex) {
                return(
                  row.map(function(widgetindex,columnindex) {
                    return(
                        <div key={props.widgets[widgetindex].key}>
                        <Widget widgetindex={widgetindex}/>
                        {columnindex==row.length-1 ? <div style={{clear:'both'}}></div> : ''}
                      </div>
                    );
                  })
                )
              }))}
            </div>
          )
        })}
      </div>
    );
  }
}

////////////////////////////////////////////////////////////////////////////////
// I think:
// This maps the state, or part of it, to our props.

const mapStateToProps = (state) => ({
  widgets:                state.widgets,
  dashLayout:             state.dashLayout,
  currentTab:             state.currentTab,
  configAddWidgetDisplay: state.configAddWidgetDisplay,
  configAddTabDisplay:    state.configAddTabDisplay,
  configEditTabDisplay:   state.configEditTabDisplay,
  configLogin:            state.configLogin,
  did:                    state.did,
  fullstate:              state
})


// I think:
// This maps the dispatch tools, or some of them, to our props.

const mapDispatchToProps = (dispatch) => ({
  update_dash:                  (changes)     => dispatch({type: 'UPDATE_DASH',changes:changes}),
  update_dash_plus_save:        (changes)     => dispatch({type: 'UPDATE_DASH_PLUS_SAVE',changes:changes}),
  change_current_tab:           (newTab)      => dispatch({type: 'CHANGE_CURRENT_TAB',newTab:newTab}),
  load_data_into_dashboard:     (statestring) => dispatch({type: 'LOAD_DATA_INTO_DASHBOARD',statestring:statestring})
})

////////////////////////////////////////////////////////////////////////////////

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Dashboard);

//    console.log(this.store.getState());
