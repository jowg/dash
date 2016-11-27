var React = require('react');
var ReactDOM = require('react-dom');

require('./dash.css');

class SortableTable extends React.Component {
  constructor(props) {
    super();
    this.sort = this.sort.bind(this);
    this.state = {
      sortMetric: props.metrics[0],
      sortDirection: 'up'
    }
  }
  shouldComponentUpdate(nextProps,nextState) {
    if ((this.state.sortMetric !== nextState.sortMetric) ||
        (this.state.sortDirection !== nextState.sortMetric)) {
      return(true);
    } else {
      return(false);
    }
  }
  sort(k,d) {
    this.setState({sortDirection: d,sortMetric: k})
    console.log(k);
    console.log(d);
  }
  render() {
    var thisthis = this;
    var sortedData = (thisthis.state.sortDirection === 'up' ?
                      thisthis.props.data.sort(function(a,b) {return a[thisthis.state.sortMetric] < b[thisthis.state.sortMetric] ? -1 : 1;}) :
                      thisthis.props.data.sort(function(a,b) {return a[thisthis.state.sortMetric] > b[thisthis.state.sortMetric] ? -1 : 1;}));
    return(
        <div>        
        <div className='div-table'>
        <div className='div-table-row'>
        <div className='div-table-header'>{thisthis.props.title}</div>
        </div>
        </div>

        <div className='div-table'>
        <div className='div-table-row'>
        {thisthis.props.metrics.map(function(key,i) {
          return(
              <div className='div-table-header'>
              <div style={{display:'inline-block',float:'left',cursor:'pointer'}} onClick={thisthis.sort.bind(this,key,'up')}>
              {((thisthis.state.sortMetric === key) && (thisthis.state.sortDirection === 'up'))? <span>&uArr;</span> : <span>&uarr;</span>}
            </div>
              <div style={{display:'inline-block',float:'left',cursor:'pointer'}} onClick={thisthis.sort.bind(this,key,'dn')}>
              {((thisthis.state.sortMetric === key) && (thisthis.state.sortDirection === 'dn'))? <span>&dArr;</span> : <span>&darr;</span>} 
            </div>
              {key}
            </div>
          )
        })}
      </div>
        {sortedData.map(function(datum,i) {
          return(
              <div className='div-table-row'>
              {thisthis.props.metrics.map(function(key,j) {
                return(<div className='div-table-cell'>{datum[key]}</div>)
              })}
            </div>
          )
        })}
      </div>
        </div>
    );
  }
}

export default SortableTable;
