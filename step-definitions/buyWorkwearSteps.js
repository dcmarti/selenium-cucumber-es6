Given('I am on the Mammoth Workwear home page', function () {

    // load google
    return helpers.loadPage(page.mammothWorkwear.url);
});

When('I click navigation item {string}', function (linkTitle) {

    // click an item in the search results via the google page object
    return page.mammothWorkwear.clickNavigationItem(linkTitle);
});

Then('I click product item {string}', function (productTitle) {

    // click an item in the search results via the google page object
    return page.mammothWorkwear.clickProductItem(productTitle);
});

Then('I should see product detail with title {string}', function (pageTitle) {

    return page.mammothWorkwear.titleContains(pageTitle);
});
