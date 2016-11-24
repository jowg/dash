var React = require('react');
var ReactDOM = require('react-dom');

require('./dash.css');

class SortableTable extends React.Component {
  constructor(props) {
    super();
    //var data = props.widgets[props.widgetindex].data;
    this.state = {
      title: props.title,
      metrics: props.metrics,
      data: props.data
    }
    this.sort = this.sort.bind(this);
  }
  sort(e) {


  }
  render() {
    console.log(this.state);
    var thisthis = this;
    return(
        <div>
        
        <div className='div-table'>
        <div className='div-table-row'>
        <div className='div-table-header'>{thisthis.state.title}</div>
        </div>
        </div>

        <div className='div-table'>
        <div className='div-table-row'>
        {thisthis.state.metrics.map(function(key,i) {
          return(<div className='div-table-header'>{key}</div>);
        })}
      </div>
        {thisthis.state.data.map(function(datum,i) {
          return(
              <div className='div-table-row'>
              {thisthis.state.metrics.map(function(key,j) {
                return(<div className='div-table-cell'>{datum[key]}</div>);
              })};
            </div>
          )
        })}
      </div>
        </div>
    );
  }
}

export default SortableTable;
