var React = require('react');
var ReactDOM = require('react-dom');

class ConfigureLogin extends React.Component {
  constructor(props) {
    super();
    this.state = {
      username: '',
      password: ''
    }
    this.updateButtonHandler = this.updateButtonHandler.bind(this);
    this.onChangeUsername = this.onChangeUsername.bind(this);
    this.onChangePassword = this.onChangePassword.bind(this);
  }
  updateButtonHandler() {
    this.props.attemptLogin(this.state.username,this.state.password);
  }
  onChangeUsername(e) {
    var text = e.target.value;
    this.setState({username:text});
  }
  onChangePassword(e) {
    var text = e.target.value;
    this.setState({password:text});
  }
  render() {
    return (
        <div>
        <div className="deactivating-overlay"></div>
        <div className='addTabWindow'>
        <br/><br/>
        {this.props.errorloggingin ? 'Bad Username & Password': 'Enter Username & Password'}
        <br/><br/>
        <input className='addTabTextfield' type="text" value={this.state.username} onChange={this.onChangeUsername.bind(this)}/>
        <br/><br/>
        <input className='addTabTextfield' type="password" value={this.state.password} onChange={this.onChangePassword.bind(this)}/>
        <br/><br/>
        <button className='config-window-button' onClick={this.updateButtonHandler}>Login</button>
        </div>
        </div>
    );
  }
}


////////////////////////////////////////////////////////////////////////////////

export default ConfigureLogin;


