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
        //canBeFull = false;
      }
    });
    return(
      <div>
        <div style={{width:'50%',float:'left'}}>
        <label>
        <input type='checkbox' name='width' value='half' checked={this.props.width === 'half'} onChange={this.selectSizeUpdate.bind(this,'width')} />Half Width
      </label>
        <br/>
        <label className={canBeFull ? '':'disabled'}>
        <input type='checkbox' name='width' value='full' checked={this.props.width === 'full'} disabled={canBeFull ? false:'disabled'} onChange={this.selectSizeUpdate.bind(this,'width')}/>
        Full Width
      </label>
        </div>
        <div style={{width:'50%',float:'left'}}>
        <label>
        <input type='checkbox' name='height' value='half' checked={this.props.height === 'half'} onChange={this.selectSizeUpdate.bind(this,'height')} />Half Height
        </label>
        <br/>
        <label>
        <input type='checkbox' name='height' value='full' checked={this.props.height === 'full'} onChange={this.selectSizeUpdate.bind(this,'height')} />Full Height
      </label>
        </div>
        </div>
    );
  }
}

export default SelectSize;
