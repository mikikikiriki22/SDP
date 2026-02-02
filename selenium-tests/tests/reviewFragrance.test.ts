/// <reference types="mocha" />
import { WebDriver, By, until } from 'selenium-webdriver';
import { expect } from 'chai';
import { buildDriver } from '../utils/driver';

describe('Review Fragrance Tests', function() {
    let driver: WebDriver;
    const baseUrl = 'https://sea-lion-app-v3ujv.ondigitalocean.app';

    this.timeout(30000);

    before(async function() {
        driver = await buildDriver();
    });

    after(async function() {
        await driver.quit();
    });

    it('should load a fragrance item page', async function() {
        await driver.get(baseUrl + '/frontend/index.html#item?id=1');
        await driver.wait(until.elementLocated(By.id('reviews-list')), 10000);
        const currentUrl = await driver.getCurrentUrl();
        expect(currentUrl).to.contain('#item');
    });

    it('should submit a review when logged in', async function() {
        await driver.get(baseUrl + '/frontend/index.html#login');
        await driver.wait(until.elementLocated(By.name('email')), 5000);
        const emailField = await driver.findElement(By.name('email'));
        await emailField.sendKeys('neko@gmail.com');
        const passwordField = await driver.findElement(By.name('password'));
        await passwordField.sendKeys('neko1234');
        const loginButton = await driver.findElement(By.css('button[type="submit"]'));
        await loginButton.click();
        await driver.sleep(2000);

        await driver.get(baseUrl + '/frontend/index.html#item?id=1');
        await driver.wait(until.elementLocated(By.id('review-form')), 10000);

        const reviewForm = await driver.findElement(By.id('review-form-wrapper'));
        await driver.executeScript('arguments[0].scrollIntoView(true);', reviewForm);
        await driver.sleep(500);

        const ratingSelect = await driver.findElement(By.id('review-rating'));
        await ratingSelect.findElement(By.css('option[value="5"]')).click();

        const commentField = await driver.findElement(By.id('review-comment'));
        const timestamp = Date.now();
        const reviewComment = `Great fragrance! would recommend`;
        await commentField.sendKeys(reviewComment);

        const submitButton = await driver.findElement(By.css('#review-form button[type="submit"]'));
        await submitButton.click();
        await driver.sleep(3000);

        const reviewsList = await driver.findElement(By.id('reviews-list'));
        const listText = await reviewsList.getText();
        expect(listText).to.contain(reviewComment);
    });
});
