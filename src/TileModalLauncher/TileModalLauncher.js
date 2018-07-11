import React, { Component } from 'react';
import PropTypes from 'prop-types';
import injectSheet from 'react-jss';
import styles from './TileModalLauncherStyles';
import SimpleModal from '../SimpleModal/SimpleModal';
import LazyLoad from 'react-lazy-load';

class TileModalLauncher extends Component {
  constructor(props) {
    super(props);
    this.state = {
      showModal: false,
      launched: false,

    };
  }

  handleToggleModal() {
    this.setState({ 
      showModal: !this.state.showModal,
      launched: !this.state.launched,
    });
  }

  render() {
    const { imgSrc, children } = this.props;
    const { showModal } = this.state;
    var className = 'tile' + (this.state.launched ? ' modal-mode' : '');

    return (
      <LazyLoad height={'50vh'} offsetBottom={100} debounce={false} className={className}>
        <div>
          <span onClick={() => this.handleToggleModal()} >
            <img src={imgSrc} alt="grid-tile" />
          </span>

          {showModal &&
            <SimpleModal onCloseRequest={() => this.handleToggleModal()}>
              {children}
            </SimpleModal>}
          </div>
      </LazyLoad>
    );
  }
}

TileModalLauncher.propTypes = {
  imgSrc  : PropTypes.string.isRequired,
  children: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.node),
    PropTypes.node,
  ]),
  sheet: PropTypes.object,
  classes: PropTypes.object,
};

export default injectSheet(styles)(TileModalLauncher);
