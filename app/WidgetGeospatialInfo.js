import React from 'react';
import ReactDOM from 'react-dom';
import L from 'leaflet';
import {MapControl} from 'react-leaflet';

export default class CenterControl extends MapControl { 

  constructor(props) {
    super();
    this.state = {
      myLabel:props.myLabel,
      centerControl:L.control({position:'bottomright'})
    };
  }
  componentWillMount() {
    const jsx = (<div className='myinfobox'>{this.state.myLabel}</div>);
    this.state.centerControl.onAdd = function (map) {
      let div = L.DomUtil.create('div', '');
      ReactDOM.render(jsx, div);
      return div;
    };
    this.leafletElement = this.state.centerControl;    
  }

  componentWillReceiveProps(nextProps) {
    var jsx = "<div class='myinfobox'>"+nextProps.myLabel+"</div>";
    this.state.centerControl.getContainer().innerHTML = jsx;
    this.setState({myLabel:nextProps.myLabel});
  }


}
