/// <reference types="mocha" />
import { WebDriver, By, until } from 'selenium-webdriver';
import { expect } from 'chai';
import { buildDriver } from '../utils/driver';

describe('Edit Profile Tests', function() {
    let driver: WebDriver;
    const baseUrl = 'https://sea-lion-app-v3ujv.ondigitalocean.app';

    this.timeout(30000);

    before(async function() {
        driver = await buildDriver();
    });

    after(async function() {
        await driver.quit();
    });

    it('should edit profile description when logged in', async function() {
        await driver.get(baseUrl + '/frontend/index.html#login');
        await driver.wait(until.elementLocated(By.name('email')), 5000);
        const emailField = await driver.findElement(By.name('email'));
        await emailField.sendKeys('neko@gmail.com');
        const passwordField = await driver.findElement(By.name('password'));
        await passwordField.sendKeys('neko1234');
        const loginButton = await driver.findElement(By.css('button[type="submit"]'));
        await loginButton.click();
        await driver.sleep(2000);

        await driver.get(baseUrl + '/frontend/index.html#profile');
        await driver.wait(until.elementLocated(By.id('edit-profile-btn')), 10000);

        const editBtn = await driver.findElement(By.id('edit-profile-btn'));
        await driver.executeScript('arguments[0].scrollIntoView(true);', editBtn);
        await driver.sleep(300);
        await editBtn.click();
        await driver.sleep(500);

        await driver.wait(until.elementLocated(By.id('edit-about')), 5000);
        const aboutField = await driver.findElement(By.id('edit-about'));
        const newDescription = `I am someone who loves fragrances, but I don't who I am.`;
        await aboutField.clear();
        await aboutField.sendKeys(newDescription);

        const saveButton = await driver.findElement(By.css('#edit-profile-form button[type="submit"]'));
        await saveButton.click();

        await driver.wait(async () => {
            try {
                const profileEl = await driver.findElement(By.id('profile'));
                const text = await profileEl.getText();
                return text.includes(newDescription);
            } catch {
                return false;
            }
        }, 10000);

        const profileContent = await driver.findElement(By.css('#profile .lead'));
        const displayedText = await profileContent.getText();
        expect(displayedText).to.contain(newDescription);
    });
});
