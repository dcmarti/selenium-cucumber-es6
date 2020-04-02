When('I search Google for {string}', async function (searchQuery) {
    // wait for calls on page gets executed
    await helpers.loadPage('http://www.google.com');
    await page.googleSearch.preformSearch(searchQuery);
});

Then('I should see {string} in the results', async function (keywords) {
    // resolawait an item on the page contains text
    await driver.wait(until.elementsLocated(by.partialLinkText(keywords)), DEFAULT_TIMEOUT);
});

Then('I should see some results', async function () {
    // wait for calls on page gets executed
    await driver.wait(until.elementsLocated(by.css('div.g')), DEFAULT_TIMEOUT);
    let elements = await driver.findElements(by.css('div.g'));
    expect(elements.length).to.not.equal(0);
});
