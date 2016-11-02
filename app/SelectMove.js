import React from 'react';
import {getMoveOptions} from './support.js';

var VERBOSE = true;

class SelectMove extends React.Component {
  constructor(props) {
    super();
    this.selectMoveUpdate = this.selectMoveUpdate.bind(this);
  }
  selectMoveUpdate(e) {
    this.props.selectMoveUpdate(e.target.value);
  }
  render() {
    var m = getMoveOptions(this.props.myIndex,this.props.tabCurrent,this.props.tabLayout,this.props.widgets);
    return(
        <select id="moveType" onChange={this.selectMoveUpdate} value={this.props.moveValue}>
        {m.movesText.map(function(option,i) {
          return (
              <option key={i} value={m.moves[i]}>{option}</option>
          )
        })}
      </select>
    );
  }
}

export default SelectMove;
