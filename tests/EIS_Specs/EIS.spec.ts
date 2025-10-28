import {test, expect} from '@playwright/test';
import { EIS_Login, EIS_Dashboards } from '../EIS_Fixtures/EIS';

test.describe('EIS Portal Login', () => {
    let loginPage: EIS_Login;
    let dashboardPage: EIS_Dashboards;

    test.beforeEach(async ({ page }) => {
        loginPage = new EIS_Login(page);
        dashboardPage = new EIS_Dashboards(page);
        await loginPage.goPortal();
        await loginPage.loginEIS();
    });
    test('TS-EIS-100', async ({ page }) => {
        await loginPage.validateLogin();
        console.log(`'\x1b[32m%s\x1b[0m'`, 'Login Successful');
    });
    test('TS-EIS-101', async ({ page }) => {
        await dashboardPage.select_dashboard();
        console.log(`'\x1b[32m%s\x1b[0m'`, 'Viewed Dashboard Successfully');

    });
    test('TS-EIS-105', async ({ page }) => {
        await dashboardPage.compare_dashboard();
        console.log(`'\x1b[32m%s\x1b[0m'`, 'Compared Dashboard Successfully');

    });
    test('TS-EIS-106', async ({ page }) => {
        await dashboardPage.fullscreen_dashboard(); 
        console.log(`'\x1b[32m%s\x1b[0m'`, 'Fullscreen Dashboard Successfully');

    });
    test('TS-EIS-108', async ({ page }) => {
        await dashboardPage.search_dashboard();
        console.log(`'\x1b[32m%s\x1b[0m'`, 'Searched Dashboard Successfully');

    });
    test('TS-EIS-112', async ({ page }) => {
        await dashboardPage.select_dashboard();
        await page.getByRole('main').getByText('Executive Information System').click();
        await expect(page.getByRole('heading', { name: 'All Dashboard' })).toBeVisible();
        await page.reload();
        await dashboardPage.viewed_dashboards();
        console.log(`'\x1b[32m%s\x1b[0m'`, 'Recently Viewed Dashboard Successfully');

    });
});
    