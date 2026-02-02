import { Builder, WebDriver } from 'selenium-webdriver';
import { Options } from 'selenium-webdriver/chrome';

export async function buildDriver(): Promise<WebDriver> {
    const options = new Options();
    options.addArguments('--disable-save-password-bubble');
    options.addArguments('--disable-password-manager-reauthentication');
    options.setUserPreferences({
        'credentials_enable_service': false,
        'profile.password_manager_enabled': false,
        'profile.password_manager_leak_detection': false
    });
    return new Builder()
        .forBrowser('chrome')
        .setChromeOptions(options)
        .build();
}
