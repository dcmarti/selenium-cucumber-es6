'use strict';
var { Builder } = require('selenium-webdriver');

/**
 * Creates a Selenium WebDriver using Selenium grid with Chrome as the browser
 * @returns {ThenableWebDriver} Selenium web driver
 */
module.exports = function() {

    const gridUrl = `http://ttr-sdc-nodejs01d-v.tuatara.pl:4444/wd/hub`;

    let driver = new Builder()
    .forBrowser('chrome')
    .usingServer(gridUrl)
    .build();
    
    return driver;
}