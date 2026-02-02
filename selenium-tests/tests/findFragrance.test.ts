/// <reference types="mocha" />
import { WebDriver, By, until } from 'selenium-webdriver';
import { expect } from 'chai';
import { buildDriver } from '../utils/driver';

describe('Find Fragrance Tests', function() {
    let driver: WebDriver;
    const baseUrl = 'https://sea-lion-app-v3ujv.ondigitalocean.app';

    this.timeout(45000);

    before(async function() {
        driver = await buildDriver();
    });

    after(async function() {
        await driver.quit();
    });

    it('should load the find fragrance page', async function() {
        await driver.get(baseUrl + '/frontend/index.html#find');
        await driver.wait(until.elementLocated(By.id('find-fragrance-form')), 5000);
        const currentUrl = await driver.getCurrentUrl();
        expect(currentUrl).to.contain('#find');
    });

    it('should get recommendations when selecting a season and note', async function() {
        await driver.get(baseUrl + '/frontend/index.html#find');
        await driver.wait(until.elementLocated(By.id('find-fragrance-form')), 5000);
        await driver.wait(until.elementLocated(By.id('find-season-spring')), 5000);
        await driver.wait(until.elementLocated(By.css('input[name="find-notes"]')), 10000);

        const form = await driver.findElement(By.id('find-fragrance-form'));
        await driver.executeScript('arguments[0].scrollIntoView(true);', form);
        await driver.sleep(500);

        const springLabel = await driver.findElement(By.css('label[for="find-season-spring"]'));
        await springLabel.click();
        await driver.sleep(200);

        const notesContainer = await driver.findElement(By.id('find-notes'));
        await driver.executeScript('arguments[0].scrollIntoView(true);', notesContainer);
        await driver.sleep(300);

        const noteCheckboxes = await driver.findElements(By.css('input[name="find-notes"]'));
        if (noteCheckboxes.length > 0) {
            await driver.executeScript('arguments[0].scrollIntoView(true);', noteCheckboxes[0]);
            await driver.sleep(200);
            await noteCheckboxes[0].click();
        }
        await driver.sleep(200);

        const submitButton = await driver.findElement(By.xpath("//button[contains(., 'Get recommendations')]"));
        await driver.executeScript('arguments[0].scrollIntoView(true);', submitButton);
        await driver.sleep(300);
        await submitButton.click();

        const resultsWrapper = await driver.findElement(By.id('find-results-wrapper'));
        await driver.wait(until.elementIsVisible(resultsWrapper), 15000);
        await driver.sleep(2000);

        const resultsDiv = await driver.findElement(By.id('find-results'));
        await driver.executeScript('arguments[0].scrollIntoView(true);', resultsDiv);
        await driver.sleep(500);

        const resultsText = await resultsDiv.getText();
        expect(resultsText.length).to.be.greaterThan(0);
    });
});
