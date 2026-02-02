/// <reference types="mocha" />
import { WebDriver, By, until } from 'selenium-webdriver';
import { expect } from 'chai';
import { buildDriver } from '../utils/driver';

describe('Login Tests', function() {
    let driver: WebDriver;
    const baseUrl = 'https://sea-lion-app-v3ujv.ondigitalocean.app';

    this.timeout(30000);

    before(async function() {
        driver = await buildDriver();
    });

    after(async function() {
        await driver.quit();
    });

    it('should load the login page', async function() {
        await driver.get(baseUrl);
        const title = await driver.getTitle();
        console.log('Page title:', title);
        expect(title).to.not.be.empty;
    });

    it('should login with valid credentials', async function() {
        await driver.get(baseUrl + '/frontend/index.html#login');
        await driver.wait(until.elementLocated(By.name('email')), 5000);
        const emailField = await driver.findElement(By.name('email'));
        await emailField.sendKeys('mirza@gmail.com');
        const passwordField = await driver.findElement(By.name('password'));
        await passwordField.sendKeys('mirza123');
        const loginButton = await driver.findElement(By.css('button[type="submit"]'));
        await loginButton.click();
        await driver.sleep(3000);
        const currentUrl = await driver.getCurrentUrl();
        console.log('Current URL after login:', currentUrl);
    });
});