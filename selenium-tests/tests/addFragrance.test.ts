/// <reference types="mocha" />
import { WebDriver, By, until } from 'selenium-webdriver';
import { expect } from 'chai';
import { buildDriver } from '../utils/driver';

describe('Add Fragrance Admin Tests', function () {
    let driver: WebDriver;
    const baseUrl = 'https://sea-lion-app-v3ujv.ondigitalocean.app';

    this.timeout(30000);

    before(async function () {
        driver = await buildDriver();
    });

    after(async function () {
        await driver.quit();
    });

    it('should add a new fragrance when logged in as admin', async function () {
        await driver.get(baseUrl + '/frontend/index.html#login');
        await driver.wait(until.elementLocated(By.name('email')), 5000);
        const emailField = await driver.findElement(By.name('email'));
        await emailField.sendKeys('admin@gmail.com');
        const passwordField = await driver.findElement(By.name('password'));
        await passwordField.sendKeys('admin123');
        const loginButton = await driver.findElement(By.css('button[type="submit"]'));
        await loginButton.click();
        await driver.sleep(2000);

        await driver.get(baseUrl + '/frontend/index.html#adminpage');
        await driver.wait(until.elementLocated(By.css('[data-bs-target="#addFragranceModal"]')), 10000);

        const addButton = await driver.findElement(By.css('button[data-bs-target="#addFragranceModal"]'));
        await driver.executeScript('arguments[0].scrollIntoView(true);', addButton);
        await driver.sleep(300);
        await addButton.click();
        await driver.sleep(500);

        const fragranceName = `Y`;
        await driver.findElement(By.id('fragranceName')).sendKeys(fragranceName);
        await driver.findElement(By.id('brandName')).sendKeys('Test Brand');
        await driver.findElement(By.id('brandCountry')).sendKeys('France');
        await driver.findElement(By.id('description')).sendKeys('A beautiful test fragrance for automated testing.');
        await driver.findElement(By.id('notes')).sendKeys('Vanilla, Citrus, Floral');

        const seasonsSelect = await driver.findElement(By.id('seasons'));
        await driver.executeScript('arguments[0].scrollIntoView(true);', seasonsSelect);
        await driver.sleep(200);
        await seasonsSelect.findElement(By.css('option[value="Spring"]')).click();

        const submitButton = await driver.findElement(By.id('submitFragranceBtn'));
        await submitButton.click();

        await driver.wait(until.elementLocated(By.id('admin-frag-table')), 5000);
        await driver.sleep(2000);

        const table = await driver.findElement(By.id('admin-frag-table'));
        const tableText = await table.getText();
        expect(tableText).to.contain(fragranceName);
    });
});
