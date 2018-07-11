import React, { Component } from 'react';
import myData from './data/site-data.json';
import injectSheet from 'react-jss';
import styles from './IndexStyles';
import TileModalLauncher from './TileModalLauncher/TileModalLauncher';
// MAP modalLaunchers 

class Grid extends Component {

  render() {
    const { sheet: { classes } } = this.props;

    return (
      <div>
        {myData.Portfolio.map((item, index) =>

          <div id={'grid-row-' + index} className="grid-row" key={index}>
              <div key={index}>
                  <div>
                      <p>{item.html}</p>
                      <br />
                      <p>{item.image_alt}</p>
                  </div>
              </div>
              <div key={index + 1 } className="right-panel">
                <TileModalLauncher imgSrc={item.image_path} key={index} action={this.handler}>
                    <div className={classes.imageModal}>
                      <a href={item.path} target="_BLANK" rel="noopener noreferrer">
                        <img 
                          src={item.image_path} 
                          alt={item.image_alt}
                          className={classes.imageInModal}
                          />
                      </a>
                    </div>
                </TileModalLauncher>
              </div>
          </div>)}
    </div>
    )
  }
}

export default injectSheet(styles)(Grid);
