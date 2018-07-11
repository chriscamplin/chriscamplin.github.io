import React, { Component } from 'react';
import PropTypes from 'prop-types';
import injectSheet from 'react-jss';
import styles from './SimpleModalLauncherStyles';
import SimpleModal from '../SimpleModal/SimpleModal';

class SimpleModalLauncher extends Component {
  constructor(props) {
    super(props);
    this.state = {
      showModal: false,
    };
  }

  handleToggleModal(e) {
    if (e) {
      e.preventDefault();
    }
    this.setState({ showModal: !this.state.showModal });
  }

  render() {
    const { buttonLabel, children } = this.props;
    const { showModal } = this.state;

    return (
      <div>
        <a
          href="#0"
          onClick={(e) => this.handleToggleModal(e)}
        >
          {buttonLabel}
        </a>

        {showModal &&
          <SimpleModal onCloseRequest={(e) => this.handleToggleModal(e)}>
            {children}
          </SimpleModal>}
      </div>
    );
  }
}

SimpleModalLauncher.propTypes = {
  buttonLabel: PropTypes.string.isRequired,
  children: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.node),
    PropTypes.node,
  ]),
  sheet: PropTypes.object,
  classes: PropTypes.object,
};

export default injectSheet(styles)(SimpleModalLauncher);
