import React from 'react';

var VERBOSE = true;

class SelectSize extends React.Component {
  constructor(props) {
    super();
    this.selectSizeUpdate = this.selectSizeUpdate.bind(this);
  }
  selectSizeUpdate(dim,e) {
    this.props.selectSizeUpdate(dim,e.target.value);
  }
  render() {
    // If the widget is in a row with another then it can't be full width.
    var props = this.props;
    var layout = props.layout;
    var canBeFull = true;
     _.each(layout,function(row,i) {
      if ((row.length === 2) && ((row[0] === props.widgetindex) || (row[1] === props.widgetindex))) {
        canBeFull = false;
      }
    });
    return(
      <div>
        <div style={{width:'50%',float:'left'}}>
        <input type='checkbox' name='width' value='half' checked={this.props.width === 'half'} onChange={this.selectSizeUpdate.bind(this,'width')} />Half Width
        <br/>
        <input type='checkbox' name='width' value='full' checked={this.props.width === 'full'} disabled={!canBeFull} onChange={this.selectSizeUpdate.bind(this,'width')} />
        {canBeFull ? 'Full width': <s>Full Width</s>}
      </div>
        <div style={{width:'50%',float:'left'}}>
        <input type='checkbox' name='height' value='half' checked={this.props.height === 'half'} onChange={this.selectSizeUpdate.bind(this,'height')} />Half Height
        <br/>
        <input type='checkbox' name='height' value='full' checked={this.props.height === 'full'} onChange={this.selectSizeUpdate.bind(this,'height')} />Full Height
      </div>
        </div>
    );
  }
}

export default SelectSize;
