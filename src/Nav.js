import React, { Component } from 'react';
import { push as Menu } from 'react-burger-menu';
import './css/BurgerMenu.css';
import SimpleModalLauncher from './SimpleModalLauncher/SimpleModalLauncher';
import injectSheet from 'react-jss';
import styles from './IndexStyles';
import myData from './data/site-data.json';

class Nav extends Component {

  render() {
    const { sheet: { classes } } = this.props;

    return (
        <Menu pageWrapId={ "page-wrap" } outerContainerId={ "outer-container" }>
          <a className="menu-item--small" href="https://github.com/beard86" target="_BLANK" rel="noopener noreferrer">Github</a>
          {/*  <a className="menu-item--small" href="">Data visualisations</a> plan to crat 3d data visualisation to demonstrate skills*/}
          {/* maps out modal launcher nav items */}
          {myData.Nav.map((item, index) =>

          <SimpleModalLauncher buttonLabel={item.label} key={index}>
            <div className={classes.textModal}>
              <h2>{item.title}</h2>
              {item.image !== null &&
                <img src={item.image} alt={item.title} />
              }

              {item.url !== null ? ( 
                <a href={item.url}>{item.content}</a>
                ) : (
                <p>{item.content}</p>
                )
              }

              {item.iframe !== null &&
                <iframe title={item.label} src={item.iframe}></iframe>
              }
            </div>
          </SimpleModalLauncher>
          )}

        </Menu>
    )
  }
}

export default injectSheet(styles)(Nav);
