module.exports = {

    url: 'http://mammothworkwear.com',

    elements: {
        menuItem: 'nav[role="navigation"] ul li a',
        productItem: 'main .pitem a'
    },

    clickNavigationItem: function(containingText) {

        return helpers.clickHiddenElement(page.mammothWorkwear.elements.menuItem, containingText);
    },

    clickProductItem: function(containingText) {

        return helpers.clickHiddenElement(page.mammothWorkwear.elements.productItem, containingText);
    },

    titleContains: async function(expectedTitle) {

        let pageTitle = await driver.getTitle();
        expect(pageTitle).to.contain(expectedTitle);
    }
};
