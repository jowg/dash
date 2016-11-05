// Not mine.

var React = require('react');
var ReactDOM = require('react-dom');
var moment = require('moment');
import {Provider} from 'react-redux';
import {createStore} from 'redux';
import {saveloadRestPoint,completeParams,saveDashboard} from './support.js';

// Mine.

import Dashboard from './Dashboard.js';


// Create a reducer and store.
// The job of a reducer is to take an action and make a change to the store.

var userReducer = function(state, action) {

  if (state === undefined) {
    state = {
      did: 0,  // This'll have to come from a log in thingy.
      widgets: [],
      dashLayout: [{tabName:         'Default',
                    layout:          [],
                    tabHideDate:     true,
                    tabStartDateISO: moment().toISOString(),
                    tabEndDateISO:   moment().toISOString()}
                  ],
      currentTab: 0,
      configAddWidgetDisplay: 'none',
      configAddTabDisplay: 'none',
      configEditTabDisplay: 'none',
      configLogin: 'block'
    };
    // For resetting for testing.
    if (1==0) {
      state = {
        widgets: [
          {key:  0,
           data: {type:             'pie',
                  width:            'half',
                  height:           'half',
                  source:           'source01',
                  aggNumeric:       true,
                  aggDatetime:      true,
                  aggMethod:        'mean',
                  metrics:          ['datetime','cost'],
                  filters:          [{metric:'age',comp:'<',value:'50'}],
                  timeframe:        'mine',
                  myStartDateISO:   moment('2016-06-01T00:00:00').toISOString(),
                  myEndDateISO:     moment('2016-06-15T00:00:00').toISOString(),
                  configDisplay:    'none'}},
          {key:  1,
           data: {type:             'line',
                  width:            'full',
                  height:           'half',
                  source:           'source01',
                  aggNumeric:       false,
                  aggDatetime:      true,
                  aggMethod:        'mean',
                  metrics:          ['datetime','cost'],
                  filters:          [],
                  timeframe:        'tab',
                  myStartDateISO:   moment().toISOString(),
                  myEndDateISO:     moment().toISOString(),
                  configDisplay:    'none'}},
          {key:  2,
           data: {type:             'histogram',
                  width:            'half',
                  height:           'half',
                  source:           'source01',
                  metrics:          ['age'],
                  buckets:          10,
                  filters:          [],
                  timeframe:        'tab',
                  myStartDateISO:   moment().toISOString(),
                  myEndDateISO:     moment().toISOString(),
                  configDisplay:    'none'}},
          {key:  3,
           data: {type:             'scatter',
                  width:            'half',
                  height:           'half',
                  source:           'source02',
                  metrics:          ['age','happiness'],
                  filters:          [],
                  timeframe:        'none',
                  myStartDateISO:   moment().toISOString(),
                  myEndDateISO:     moment().toISOString(),
                  configDisplay:    'none'}},
          {key:  4,
           data: {type:             'stats',
                  width:            'half',
                  height:           'half',
                  source:           'source02',
                  metrics:          ['happiness'],
                  filters:          [],
                  timeframe:        'none',
                  myStartDateISO:   moment().toISOString(),
                  myEndDateISO:     moment().toISOString(),
                  configDisplay:    'none'}}
        ],
        dashLayout: [{tabName:         'Justin',
                      layout:          [[0,2],[1]],
                      tabHideDate:     true,
                      tabStartDateISO: moment('2016-06-15T00:00:00').toISOString(),
                      tabEndDateISO:   moment('2016-06-30T00:00:00').toISOString()},
                     {tabName:         'Stuart',
                      layout:          [[3,4]],
                      tabHideDate:     false,
                      tabStartDateISO: moment('2016-06-15T00:00:00').toISOString(),
                      tabEndDateISO:   moment('2016-06-30T00:00:00').toISOString()},
                    ],
        currentTab: 0,
        configAddWidgetDisplay: 'none',
        configAddTabDisplay: 'none',
        configEditTabDisplay: 'none',
        configLogin: 'block'
      };
    }
  }

  var newState = JSON.parse(JSON.stringify(state));

  ////////////////////////////////////////////////////////////////////////////////////////
  // UPDATE_WIDGET
  // UPDATE_WIDGET_PLUS_SAVE

  if (action.type === 'UPDATE_WIDGET') {
    newState.widgets[action.widgetindex].data = _.extend(newState.widgets[action.widgetindex].data,action.changes);
  }
  if (action.type === 'UPDATE_WIDGET_PLUS_SAVE') {
    newState.widgets[action.widgetindex].data = _.extend(newState.widgets[action.widgetindex].data,action.changes);
    saveDashboard(newState);
  }

  ////////////////////////////////////////////////////////////////////////////////////////
  // UPDATE_DASH
  // UPDATE_DASH_PLUS_SAVE

  if (action.type === 'UPDATE_DASH') {
    newState = _.extend(newState,action.changes);
    if (newState.currentTab >= newState.dashLayout.length) {
      newState.currentTab--;
    }
  }
  if (action.type === 'UPDATE_DASH_PLUS_SAVE') {
    newState = _.extend(newState,action.changes);
    if (newState.currentTab >= newState.dashLayout.length) {
      newState.currentTab--;
    }
    saveDashboard(newState);
  }

  ////////////////////////////////////////////////////////////////////////////////////////
  // ADD_WIDGET
  // This always saves.

  if (action.type === 'ADD_WIDGET') {
    // Find a valid key.
    var validKey = 0;
    var usedKeys = _.pluck(newState.widgets,'key');
    while (_.contains(usedKeys,validKey)) {
      validKey++;
    }
    // Push the widget on.
    newState.widgets.push({key:validKey,data:action.data});
    // Get the index of the widget we just added.
    var windex = newState.widgets.length-1;
    // Put the widget in the tab layout.
    newState.dashLayout[newState.currentTab].layout.push([windex]);
    newState.configAddWidgetDisplay = 'none';
    saveDashboard(newState);
  }

  ////////////////////////////////////////////////////////////////////////////////////////
  // DELETE_WIDGET
  // This always saves.

  if (action.type === 'DELETE_WIDGET') {
    var indexToDelete = action.widgetindex;
    var currentLayout = newState.dashLayout[newState.currentTab].layout;
    var currentWidgets = newState.widgets;
    _.each(currentLayout,function(row,i) {
      currentLayout[i] = _.without(row,indexToDelete);
    });
    currentLayout = _.filter(currentLayout,function(row){return (row.length != 0);});
    newState.dashLayout[newState.currentTab].layout = currentLayout;
    _.each(newState.dashLayout,function(tab,ti) {
      _.each(tab.layout,function(row,i) {
        _.each(row,function(entry,j) {
          if (entry > indexToDelete) {
            newState.dashLayout[ti].layout[i][j] = entry-1;
          }
        });
      });
    });
    newState.widgets.splice(indexToDelete,1);
    saveDashboard(newState);
  }

  ////////////////////////////////////////////////////////////////////////////////////////
  // UPDATE_LAYOUT
  // This always saves.

  if (action.type === 'UPDATE_LAYOUT') {
    newState.dashLayout = action.newLayout;
    saveDashboard(newState);
  }

  ////////////////////////////////////////////////////////////////////////////////////////
  // CHANGE_CURRENT_TAB
  // This never saves.

  if (action.type === 'CHANGE_CURRENT_TAB') {
    newState.currentTab = action.newTab;
  }

  ////////////////////////////////////////////////////////////////////////////////////////
  // LOAD_DATA_INTO_DASHBOARD
  // This never saves.

  if (action.type === 'LOAD_DATA_INTO_DASHBOARD') {
    newState = action.statestring;
    newState.currentTab = 0;
  }
  return newState;
}

// The store holds the state.
// I guess it's passed the reducer to ... allow the reducer to access it or something?

var store = createStore(userReducer);

ReactDOM.render(
    <Provider store={store}>
    <Dashboard/>
    </Provider>,
  document.getElementById('app')
);
