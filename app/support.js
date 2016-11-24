// Here we assume that request is more like a rest point.
// Hold on - I have a rest point on my machine.
//
// It's accessible at:
// http://lvh.me/cgi-bin/rest/rest_retrieveData.py
//
// Multiline version at:
// http://lvh.me/cgi-bin/rest/rest_multiline.py
//
// These are located where?
// /Library/WebServer/CGI-Executables/rest/

export function postFilter(rawData,postfilters) {
  var newRawData = {
    error:   rawData.error,
    geo:     rawData.geo,
    metrics: rawData.metrics,
  };
  var newData = [];
  _.each(rawData.data,function(datum) {
    var valid = true;
    _.each(postfilters,function(f) {
      if (_.contains(rawData.metrics,f.metric)) {
        if ((f.comp === '==') && (f.value !== datum[f.metric])) {
          valid = false;
        }
      }
    });
    if (valid) {
      newData.push(datum);
    }
  });
  newRawData.data = newData;
  return newRawData;
}

export function tableFromRawData(rawData,title) {
  if (title === undefined) {
    title = 'Table';
  }
  var k = rawData.metrics;
  var t = "<div class='div-table'>";
  t += "<div class='div-table-row'>";
  t += "<div class='div-table-header'>" + title + "</div>";
  t += "</div>";
  t += "</div>";

  t += "<div class='div-table'>";
  t += "<div class='div-table-row'>";
  _.each(k,function(key) {
    t += "<div class='div-table-header'>" + key + "</div>";
  });
  t += "</div>";
  _.each(rawData.data,function(datum) {
    t += "<div class='div-table-row'>";
    _.each(k,function(key) {
      t += "<div class='div-table-cell'>" + datum[key] + "</div>";
    });
    t += "</div>";
  });
  t += "</div>";
  return t;
}

export function getMetricsForSource(source) {
  if (source == 'source01') {
    return ['adsmok42','age','angidx','api_id','arthdx','asthdx','basecost','chddx','choldx','cost','datetime','date_nice','department','diabdx','difference','emphdx','enrolled_program_skiing','enrolled_program_wholefoods','firstname','fullname','gender','hibpdx','hr_baseline','hr_min_high','hr_min_low','hr_min_medium','is_enrolled','lastname','number_of_programs','person_id','program_skiing','program_wholefoods','running_steps','rx_basecost','rx_cost','rx_difference','rx_save','save','state','status','walking_steps'];
  }
  if (source == 'source02') {
    return ['name','country','age','happiness','income','strength'];
  }
  if (source == 'source03') {
    return ['precinct','numberofcrimes','policesatisfaction'];
  }
  if (source == 'REST_source01') {
    return ['precinct','number_of_crimes','police_satisfaction','outreach_metric','squad'];
  }
  if (source == 'REST_source02') {
    return ['index','sector','age.bin','race','gender','quotas'];
  }
  if (source == 'REST_source03') {
    return ['index','sector','precinct','preds'];
  }
  if (source == 'REST_source_complaints') {
    return ['u1','date','time','u2','complaint','u3','latitude','longitude','sector','precinct'];
  }
  if (source == 'REST_source_311') {
    return ['u1','date','time','category','latitude','longitude','sector','precinct'];
  }
}

export function getSources() {
  return ['(undefined)','source01','source02','source03','REST_source01','REST_source02','REST_source03','REST_source_complaints','REST_source_311'];
}

export function getAggMethods() {
  return ['(undefined)','mean','sum','count'];
}

export function getTimeframeOptions() {
  return ['(undefined)','none','tab','custom'];
}

// Get available moves for a certain index.
// Note that the row number text is 1 higher because
// rows are 1,2,... but array indices are 0,1,...

export function getMoveOptions(index,tabCurrent,tabLayout,widgets) {
  var moves = [];
  var movesText = [];
  var layout = tabLayout[tabCurrent].layout;
  for (var k=0;k<=layout.length;k++) {
    moves.push(k-0.5);
    if (k == 0) {
      movesText.push('Move Before Row 1');
    } else if (k == layout.length) {
      movesText.push('Move After Row '+(k+1));
    } else {
      movesText.push('Move Between Row '+k+' and Row '+(k+1));
    }
  }
  // Moving to the end of another row.
  _.each(layout,function(row,k) {
    if ((widgets[row[0]].data.width === 'half') && (widgets[index].data.width === 'half')) {
      //if (((row.length == 1) && (index != row[0])) || ((row.length == 2) && (index == row[0]))) {
        moves.push(k);
        movesText.push('Move to End of Row '+(k+1));
      //}
    }
  });
  _.each(tabLayout,function(tab,ti) {
    if (ti != tabCurrent) {
      moves.push(-(ti+1));
      movesText.push('Move to Tab: '+tabLayout[ti].tabName);
    }
  });
  return ({moves:moves,movesText:movesText});
}

export function calculateNewLayout(tabCurrent,tabLayout,index,newPosition) {
  var fullTabLayout = JSON.parse(JSON.stringify(tabLayout));
  var currentTabLayout = JSON.parse(JSON.stringify(tabLayout[tabCurrent].layout));
  var targetTabLayout = [];
  if (newPosition < -0.5) {
    targetTabLayout = JSON.parse(JSON.stringify(tabLayout[-1*newPosition-1].layout));
    targetTabLayout.push([index]);
    fullTabLayout[-1*newPosition-1].layout = targetTabLayout;
  } else {
    if (Number.isInteger(newPosition)) {
      currentTabLayout[newPosition].push([-1]);
    } else {
      if (newPosition == -0.5) {
        currentTabLayout.unshift([-1]);
      } else if (newPosition == currentTabLayout.length+0.5) {
        currentTabLayout.push([-1]);
      } else {
        currentTabLayout.splice(newPosition+0.5,0,[-1]);
      }
    }
  }
  // Then we delete the index and rename -1 to that index.
  var newCurrentTabLayout = [];
  _.each(currentTabLayout,function(row) {
    row = _.without(row,index);
    if (row[0] == -1) {
      row[0] = index;
    }
    if (row[1] == -1) {
      row[1] = index;
    }
    if (row.length != 0) {
      newCurrentTabLayout.push(row);
    }
  });
  fullTabLayout[tabCurrent].layout = newCurrentTabLayout;
  return(fullTabLayout);
}

export function niceDate(z) {
  var date = new Date(z);
  var year = date.getFullYear();
  var month = "0" + (1+date.getMonth());
  var day = "0" + date.getDate();

  return(year+"-"+month.substr(-2)+"-"+day.substr(-2));
}

// Save the dashboard with the given config.
// The rest point checks the the token as well,
// currently attached via completeParams, and if the token
// does not exist then nothing is saved and that's that.

export function saveDashboard(config) {
  console.log("Saving Dashboard")
  $.post(
    saveloadRestPoint(),
    completeParams({saveload:'save',dashboardid:config.did,configuration:JSON.stringify(config)}),
    function(rawData) {
      // Nuttin.
    }
  );
}

export function cookieExtract(name) {
  var value = "; " + document.cookie;
  var parts = value.split("; "+name+"=");
  if (parts.length == 2) return parts.pop().split(";").shift();
}

export function REST_aggregate() {
  return('http://ec2-54-213-91-179.us-west-2.compute.amazonaws.com/cgi-bin/dash_restpoints/REST_aggregate.py');
}
export function REST_multiplevalue() {
  return('http://ec2-54-213-91-179.us-west-2.compute.amazonaws.com/cgi-bin/dash_restpoints/REST_multiplevalue.py');
}
export function REST_singlevalue() {
  return('http://ec2-54-213-91-179.us-west-2.compute.amazonaws.com/cgi-bin/dash_restpoints/REST_singlevalue.py');
}

export function dataRestPoint() {
  //return("http://lvh.me/cgi-bin/rest/rest_retrieveData.py");
  return("http://ec2-54-213-91-179.us-west-2.compute.amazonaws.com/cgi-bin/dash_rest/REST_retrieveData.py");
}
export function saveloadRestPoint() {
  //return("http://lvh.me/cgi-bin/rest/rest_saveload.py");
  return("http://ec2-54-213-91-179.us-west-2.compute.amazonaws.com/cgi-bin/dash_rest/REST_saveload.py");
}
export function attemptloginRestPoint() {
  return("http://ec2-54-213-91-179.us-west-2.compute.amazonaws.com/cgi-bin/dash_rest/REST_attemptlogin.py");
}
export function getDashboardForTokenRestPoint() {
  return("http://ec2-54-213-91-179.us-west-2.compute.amazonaws.com/cgi-bin/dash_rest/REST_getDashboardForToken.py");
}
export function jsonRestPoint() {
  return("http://ec2-54-213-91-179.us-west-2.compute.amazonaws.com/cgi-bin/dash_rest/REST_getJSON.py");
}
export function completeParams(params) {
  params.token = cookieExtract('token');
  return(params);
}

export function getColor(v) {
  var carray = ['#ffffcc','#ffeda0','#fed976','#feb24c','#fd8d3c','#fc4e2a','#e31a1c','#bd0026','#800026'];
  return carray[Math.round(8*v)];
}

export function layout(tabs) {

}
