'use strict';

/**
 * world.js is loaded by the cucumber framework before loading the step definitions and feature files
 * it is responsible for setting up and exposing the driver/browser/expect/assert etc required within each step definition
 */

const fs = require('fs-plus');
const path = require('path');
const requireDir = require('require-dir');
const merge = require('merge');
const chalk = require('chalk');
const { By, Key, until } = require('selenium-webdriver');
const chai = require("chai");
const chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);

const reporter = require('cucumber-html-reporter');
const { setDefaultTimeout, BeforeAll, Before, After, AfterAll, Status, Given, When, Then  } = require('cucumber');

// Initialize the eyes SDK and set your private API key.
const Eyes = require('eyes.selenium').Eyes;

// drivers
const FireFoxDriver = require('./firefoxDriver.js');
const ElectronDriver = require('./electronDriver.js');
const ChromeDriver = require('./chromeDriver');

// List of variables to expose globally and therefore accessible within each step definition
const runtime = {
    driver: null,               // the browser object
    eyes: null,
    Given: Given,               // global operations for Cucumber
    When: When,                 // 
    Then: Then,                 //    
    By: By,                     // in keeping with Java expose selenium By
    by: By,                     // provide a javascript lowercase version
    until: until,               // provide easy access to Selenium until methods
    key: Key,                   // Selenium class for keyboard codes
    Key: Key,                   // in keeping with Java expose selenium Key
    selenium: { Key: Key },     // for backward compatibility with current selenium-cucumber-js scripts
    expect: chai.expect,        // expose chai expect to allow variable testing
    assert: chai.assert,        // expose chai assert to allow variable testing
    trace: consoleInfo,         // expose an info method to log output to the console in a readable/visible format
    page: global.page || {},    // empty page objects placeholder
    shared: global.shared || {} // empty shared objects placeholder
};

// expose properties to step definition methods via global variables
Object.keys(runtime).forEach(function (key) {

    // make property/method available as a global (no this. prefix required)
    global[key] = runtime[key];
});

/**
 * create the selenium browser based on global let set in index.js
 * @returns {ThenableWebDriver} selenium web driver
 */
function getDriverInstance() {

    let driver;

    switch (browserName || '') {

        case 'firefox': {
            driver = new FireFoxDriver();
        }
            break;

        case 'electron': {
            driver = new ElectronDriver();
        }
            break;

        case 'chrome': {
            driver = new ChromeDriver();
        }
            break;

        // try to load from file
        default: {
            let driverFileName = path.resolve(process.cwd(), browserName);

            if (!fs.isFileSync(driverFileName)) {
                throw new Error('Could not find driver file: ' + driverFileName);
            }

            driver = require(driverFileName)();
        }
    }

    return driver;
}


/**
 * Initialize the eyes SDK and set your private API key via the config file.
 */
function getEyesInstance() {

    if (global.eyesKey) {

        let eyes = new Eyes();

        // retrieve eyes api key from config file in the project root as defined by the user
        eyes.setApiKey(global.eyesKey);

        return eyes;
    }

    return null;
}

function consoleInfo() {
    let args = [].slice.call(arguments),
        output = chalk.bgBlue.yellowBright('\n >>>>> \n' + args + '\n <<<<< \n');

    console.log(output);
}


/**
 * Import shared objects, pages object and helpers into global scope
 * @returns {void}
 */
function importSupportObjects() {

    // import shared objects from multiple paths (after global vars have been created)
    if (global.sharedObjectPaths && Array.isArray(global.sharedObjectPaths) && global.sharedObjectPaths.length > 0) {

        let allDirs = {};

        // first require directories into objects by directory
        global.sharedObjectPaths.forEach(function (itemPath) {

            if (fs.existsSync(itemPath)) {

                let dir = requireDir(itemPath, { recurse: true });

                merge(allDirs, dir);
            }
        });

        // if we managed to import some directories, expose them
        if (Object.keys(allDirs).length > 0) {

            // expose globally
            global.shared = allDirs;
        }
    }

    // import page objects (after global vars have been created)
    if (global.pageObjectPath && fs.existsSync(global.pageObjectPath)) {

        // require all page objects using their names as object names
        global.page = requireDir(global.pageObjectPath, { recurse: true });
    }

    // add helpers
    global.helpers = require('../runtime/helpers.js');
}


async function closeBrowser() {
    // firefox quits on driver.close on the last window
    await driver.close();
    if (browserName !== 'firefox'){
        await driver.quit();
    }
}


function teardownBrowser() {
    switch (browserTeardownStrategy) {
        case 'none':
            return Promise.resolve();
        case 'clear':
            return helpers.clearCookiesAndStorages();
        default:
            return closeBrowser(driver);
    }
}


setDefaultTimeout(global.DEFAULT_TIMEOUT);


//import all required components
BeforeAll(function () {
    importSupportObjects();
});


// create the driver and applitools eyes before scenario if it's not instantiated
Before(async function () {
    if (!global.driver || browserTeardownStrategy === 'always') {
        global.driver = await getDriverInstance();
    }

    if (!global.eyes) {
        global.eyes = getEyesInstance();
    }
});


// executed after each scenario (always closes the browser to ensure fresh tests)
After(async function (scenario) {
    if (scenario.result.status === Status.FAILED && !global.noScreenshot) {
        // add a screenshot to the error report
        let screenShot = await driver.takeScreenshot();    
        this.attach(new Buffer(screenShot, 'base64'), 'image/png');
        await teardownBrowser();
        if (eyes) {
            // If the test was aborted before eyes.close was called ends the test as aborted.
            await eyes.abortIfNotClosed();
        }
    } else {
         await teardownBrowser();
    }
});


//import all required components
BeforeAll(function () {
    importSupportObjects();
});


//generate report after all features
AfterAll(async function () {

    if (browserTeardownStrategy !== 'always') {
        await closeBrowser();
    }
    
    var cucumberReportPath = path.resolve(global.reportsPath, 'cucumber-report.json');

    if (global.reportsPath && fs.existsSync(global.reportsPath)) {

        // generate the HTML report
        var reportOptions = {
            theme: 'bootstrap',
            jsonFile: cucumberReportPath,
            output: path.resolve(global.reportsPath, 'cucumber-report.html'),
            reportSuiteAsScenarios: true,
            launchReport: (global.enableLaunchReport),
            ignoreBadJsonFile: true
        };

        setTimeout(() => {
            reporter.generate(reportOptions);
        }, 1000);
    }
});
