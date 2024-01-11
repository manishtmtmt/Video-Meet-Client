import React, { useState } from "react";
import styles from "./index.module.css";

const Toggle = ({ size, setIsDark }) => {
  const [isNight, setIsNight] = useState(false);

  const handleToggleChange = (e) => {
    setIsNight(e.target.checked);
    setIsDark();
  };

  const toggleDivStyle = {
    height: `${size}px`,
    width: `${size * 2}px`,
    cursor: "pointer",
  };

  const sunMoonStyle = {
    height: `${size / 2}px`,
    width: `${size / 2}px`,
  };

  const starsAndCloudsStyle = {
    height: `${size}px`,
    width: `${size}px`,
  };

  return (
    <label htmlFor="toggle" className={styles.toggleLabel}>
      <div
        id={styles.toggleDiv}
        className={`${styles.toggleDiv} ${isNight ? styles.night : ""}`}
        style={toggleDivStyle}
      >
        <input
          type="checkbox"
          id="toggle"
          onChange={handleToggleChange}
          hidden
        />{" "}
        <div className={styles.clouds} style={starsAndCloudsStyle}>
          <div className={`${styles.cloud} ${styles.cloud1}`}></div>
          <div className={`${styles.cloud} ${styles.cloud2}`}></div>
          <div className={`${styles.cloud} ${styles.cloud3}`}></div>
          <div className={`${styles.cloud} ${styles.cloud4}`}></div>
          <div className={`${styles.cloud} ${styles.cloud5}`}></div>
        </div>
        <div className={styles.backdrops}>
          <div className={styles.backdrop}></div>
        </div>
        <div className={styles.stars} style={starsAndCloudsStyle}>
          <div className={`${styles.star} ${styles.star1}`}></div>
          <div className={`${styles.star} ${styles.star2}`}></div>
          <div className={`${styles.star} ${styles.star3}`}></div>
        </div>
        <div className={styles.sunMoon} style={sunMoonStyle}>
          <div className={styles.creator}></div>
        </div>
      </div>
    </label>
  );
};

export default Toggle;
