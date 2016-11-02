import React from 'react';

class SelectFilter extends React.Component {
  constructor(props) {
    super();
    // bind.
    this.selectFilterUpdate = this.selectFilterUpdate.bind(this);
    this.addNewFilter       = this.addNewFilter.bind(this);
    this.removeThisFilter   = this.removeThisFilter.bind(this);
  }
  selectFilterUpdate(index,category,e) {
    var filters = JSON.parse(JSON.stringify(this.props.filters));
    filters[index][category] = e.target.value;
    this.props.selectFilterUpdate(filters);
  }
  addNewFilter() {
    var filters = JSON.parse(JSON.stringify(this.props.filters));
    filters.push({
      metric: '(undefined)',
      comp:   '(undefined)',
      value:  ''
    });
    this.props.selectFilterUpdate(filters);
  }
  removeThisFilter(index) {
    var filters = JSON.parse(JSON.stringify(this.props.filters));
    filters.splice(index,1);
    this.props.selectFilterUpdate(filters);
  }
  render() {
    var thisthis = this;
    var metricOptions = this.props.options;
    var compOptions = ['(undefined)','==','!==','<','>','<=','>='];
    return (
        <div>
        {this.props.filters.map(function(filter,filterindex) {
          return (
              <div key={filterindex}>
              <select onChange={thisthis.selectFilterUpdate.bind(this,filterindex,'metric')} value={filter.metric} >
              {metricOptions.map(function(metric,i) {
                return (
                    <option key={i} value={metric}>{metric}</option>
                )
              })}
            </select>
              <select onChange={thisthis.selectFilterUpdate.bind(this,filterindex,'comp')} value={filter.comp} >
              {compOptions.map(function(comp,i) {
                return (
                    <option key={i} value={comp}>{comp}</option>
                )
              })}
            </select>
              <input type="text" onChange={thisthis.selectFilterUpdate.bind(this,filterindex,'value')} value={filter.value} />
              <button onClick={thisthis.removeThisFilter.bind(this,filterindex)}>-</button>
              </div>
          )
        })}
        <button onClick={this.addNewFilter}>+</button>
        </div>
    );
  }
}

export default SelectFilter;
