import {test} from '@playwright/test';
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
    });
    test('TS-EIS-101', async ({ page }) => {
        await dashboardPage.select_dashboard();
    });
    test('TS-EIS-105', async ({ page }) => {
        await dashboardPage.compare_dashboard();
    });
    test('TS-EIS-106', async ({ page }) => {
        await dashboardPage.fullscreen_dashboard();
    });
    test('TS-EIS-108', async ({ page }) => {
        await dashboardPage.search_dashboard();
    });
    test('TS-EIS-112', async ({ page }) => {
        await dashboardPage.search_dashboard();
        await page.getByRole('main').getByText('Executive Information System').click();
        await page.waitForTimeout(2_000);
        await page.reload();
        await dashboardPage.viewed_dashboards();
    });
});
    