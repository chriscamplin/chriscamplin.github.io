import React from 'react';
import PropTypes from 'prop-types';
import injectSheet from 'react-jss';
import styles from './IndexStyles';
import myData from './data/site-data.json';

const Footer = ({ sheet: { classes } }) => (
    <div className='Footer'>
      <div id="footer-container">
        {myData.Footer[0].content}
      </div>
    </div>
);

Footer.propTypes = {
  sheet: PropTypes.object,
  classes: PropTypes.object
};


export default injectSheet(styles)(Footer);
