/// <reference types="mocha" />
import { WebDriver, By, until } from 'selenium-webdriver';
import { expect } from 'chai';
import { buildDriver } from '../utils/driver';

describe('Registration Test', function() {
    let driver: WebDriver;
    const baseUrl = 'https://sea-lion-app-v3ujv.ondigitalocean.app';

    this.timeout(30000);

    before(async function() {
        driver = await buildDriver();
    });

    after(async function() {
        await driver.quit();
    });

    it('should register a new user successfully', async function() {
        await driver.get(baseUrl + '/frontend/index.html#register');
        
        await driver.wait(until.elementLocated(By.name('username')), 5000);
        
        const timestamp = Date.now();
        const testEmail = `test${timestamp}@example.com`;
        const testUsername = `user${timestamp}`;

        const emailField = await driver.findElement(By.name('email'));
        await emailField.sendKeys("neko@gmail.com");

        const usernameField = await driver.findElement(By.name('username'));
        await usernameField.sendKeys("neko1234");

        const passwordField = await driver.findElement(By.name('password'));
        await passwordField.sendKeys('neko1234');

        const femaleRadio = await driver.findElement(By.id('female'));
        await femaleRadio.click();

        const registerButton = await driver.findElement(By.css('button[type="submit"]'));
        await registerButton.click();

        await driver.sleep(3000);
        
        const currentUrl = await driver.getCurrentUrl();
        console.log('URL after registration:', currentUrl);
        console.log('Registered with email:', testEmail);

        expect(currentUrl).to.not.contain('#register');
    });
});