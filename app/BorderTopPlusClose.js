var React = require('react');
var ReactDOM = require('react-dom');

class BorderTopPlusClose extends React.Component {
  constructor(props) {
    super();
    this.onClose = this.onClose.bind(this);
  }
  onClose() {
    this.props.onClose();
  }
  render() {
    return (
        <div className='bandtitle-top-plus-close'>
        <div style={{float:'left',cursor:'pointer'}} onClick={this.onClose}>&#10006;</div>
        <div style={{float:'right'}}>{this.props.title}</div>
        <div style={{clear: 'both'}}></div>
        </div>
    );
  }
}

////////////////////////////////////////////////////////////////////////////////

export default BorderTopPlusClose;

