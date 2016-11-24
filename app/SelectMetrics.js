import React from 'react';

class SelectMetrics extends React.Component {
  constructor(props) {
    super();
    // bind.
    this.selectMetricUpdate = this.selectMetricUpdate.bind(this);
    this.addNewMetric       = this.addNewMetric.bind(this);
    this.removeThisMetric   = this.removeThisMetric.bind(this);
  }
  selectMetricUpdate(index,e) {
    var metrics = JSON.parse(JSON.stringify(this.props.metrics));
    metrics[index] = e.target.value;
    this.props.selectMetricsUpdate(metrics);
  }
  addNewMetric() {
    var metrics = JSON.parse(JSON.stringify(this.props.metrics));
    metrics.push({
      metric: '(undefined)'
    });
    this.props.selectMetricsUpdate(metrics);
  }
  removeThisMetric(index) {
    var metrics = JSON.parse(JSON.stringify(this.props.metrics));
    metrics.splice(index,1);
    this.props.selectMetricsUpdate(metrics);
  }
  render() {
    var thisthis = this;
    var metricOptions = this.props.options;
    return (
        <div>
        {this.props.metrics.map(function(metric,metricindex) {
          return (
              <div key={metricindex}>
              Metric 
              <select onChange={thisthis.selectMetricUpdate.bind(this,metricindex)} value={metric} >
              {metricOptions.map(function(mopt,i) {
                return (
                    <option key={i} value={mopt}>{mopt}</option>
                )
              })}
            </select>
              <button className='config-window-button-plus' onClick={thisthis.removeThisMetric.bind(this,metricindex)}>-</button>              
              </div>
          )
        })}
        <button className='config-window-button-plus' onClick={this.addNewMetric}>+</button>
        </div>
    );
  }
}

export default SelectMetrics;
