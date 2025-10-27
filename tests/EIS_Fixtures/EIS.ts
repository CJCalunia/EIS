import {type Locator, type Page, expect} from '@playwright/test';
import { config } from 'dotenv';
config();


export class EIS_Login {
    readonly portalUrl: string;
    readonly emailInput: string;
    readonly passwordInput: string;
    
    constructor(protected page: Page) {
        this.portalUrl = String(process.env.EIS_PORTAL);
        this.emailInput = String(process.env.EMAIL_CREDS);
        this.passwordInput = String(process.env.PASS_CREDS);
    }

    async goPortal () {
        await this.page.goto(this.portalUrl);
    }
    async loginEIS () {
        console.log(`Waiting for the page to load...`);
        await this.page.getByRole('textbox', { name: 'Email' }).fill(this.emailInput);
        expect(await this.page.getByRole('textbox', { name: 'Email' }).inputValue()).toContain(this.emailInput);
        await this.page.getByRole('textbox', { name: 'Password' }).fill(this.passwordInput);
        await this.page.getByRole('checkbox', { name: 'Remember Me' }).click();
        await this.page.getByRole('button', { name: 'Login' }).click();
    };
    async validateLogin () {
        await this.page.waitForResponse(response => response.url().includes('/dashboard') && response.status() === 200);
    }
}


let dashboardSelected: any;
let dashboardEntityId: any;
export class EIS_Dashboards extends EIS_Login { 
    readonly dashboardApi: string;
    constructor(page: Page) { 
        super(page);
        this.dashboardApi = String(process.env.DASHBOARD_API);
    }
    async get_dashboards () {
        const dashboards =  this.page.waitForResponse(
            response => response.url()
            .includes('/eis/v1.0/dashboards?') 
            && response.status() === 200);
        const data = await (await dashboards).json();
        const rows = data.response.rows;
        const randomIndex = Math.floor(Math.random() * rows.length)
        dashboardSelected = rows[randomIndex].name;
        dashboardEntityId = rows[randomIndex].entityId;
    }

    async search_dashboard  () { 
        const dashboards = await this.get_dashboards();
        await this.page.getByRole('button', { name: 'Search... ⌘ K' }).click();
        await this.page.getByRole('textbox', { name: 'Search dashboard...' }).pressSequentially(dashboardSelected);
        await this.page.locator(`//span[contains(@class, "text-highlighted") and text()="${dashboardSelected}"]`).click();
        await this.page.waitForTimeout(2_000);
    }

    async select_dashboard  () {
        this.search_dashboard();
        await this.page.waitForResponse(
            response => response.url()
            .includes(dashboardEntityId) 
            && response.status() === 200);
    }

    async fullscreen_dashboard  () { 
        this.select_dashboard();
        await this.page.getByRole('button', { name: 'Show Full Screen' }).click();
        // await expect(this.page.getByRole('complementary', { name: 'Sidebar Navigation' })).toBeVisible();
        // await expect(this.page.getByText('Executive Information SystemSearch...⌘K')).toBeHidden();
        // await expect(this.page.getByText('Show Full Screen Compare')).toBeHidden();
    }
    async compare_dashboard  () {
        this.select_dashboard();
        await this.page.getByRole('button', { name: 'Compare' }).click();
        await this.page.getByRole('button', { name: 'Select dashboard' }).click();
        await this.page.getByText(`+1${dashboardSelected}`).click();
        await this.page.waitForResponse(
            response => response.url()
            .includes(dashboardEntityId) 
            && response.status() === 200);
    }

    async viewed_dashboards () {
        const viewedDashboards = this.page.waitForResponse(
            res => res.url()
            .includes('recents/dashboards?') 
            && res.status() === 200);
        const data = await (await viewedDashboards).json();
        expect(data.response.rows[0].name).toEqual(dashboardSelected);
    }
}
