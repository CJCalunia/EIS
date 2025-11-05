import {type Locator, type Page, expect} from '@playwright/test';
import { config } from 'dotenv';
config();


export class EIS_Login {
    readonly portalUrl: string;
    readonly emailInput: string;
    readonly passwordInput: string;
    readonly Email: Locator;
    readonly Password: Locator;
    
    constructor(protected page: Page) {
        this.portalUrl = String(process.env.EIS_PORTAL);
        this.emailInput = String(process.env.EMAIL_CREDS);
        this.passwordInput = String(process.env.PASS_CREDS);
        this.Email = page.getByRole('textbox', { name: 'Email' });
        this.Password = page.getByRole('textbox', { name: 'Password' });
    }

    async goPortal () {
        await this.page.goto(this.portalUrl);
        await Promise.all([
            this.page.reload(),
            this.page.waitForResponse(response =>
                response.url().includes('meta/') && response.status() === 200
            )
        ]);
    }
    async loginEIS () {
        await this.Email.waitFor({ state: 'visible', timeout: 60000 });
        await this.Email.fill(this.emailInput);
        expect(await this.Email.inputValue()).toContain(this.emailInput);

        await this.Password.waitFor({ state: 'visible', timeout: 60000 });
        await this.Password.fill(this.passwordInput);

        await this.page.getByRole('checkbox', { name: 'Remember Me' }).click();
        await this.page.getByRole('button', { name: 'Login' }).click();
    };

    async validateLogin () {
        await expect(await this.page.getByRole('heading', { name: 'All Dashboard' })).toBeVisible();
    }
}

const dashboardStore = {
    name: '',
    entityId: '',
    displays: [],
    graphCount: 0,
    collectionId: 0
};

export class EIS_Dashboards extends EIS_Login { 
    constructor(page: Page) { 
        super(page);
    }

    async get_favorites () {
        const favorites = this.page.waitForResponse(
            res => res.url()
            .includes('/eis/v1.0/favorites/dashboards?') 
            && res.status() === 200);
        const data = await (await favorites).json();
        return data.response;
    }

    async get_dashboards () {
        const dashboards =  await this.page.waitForResponse(
            response => response.url()
            .includes('/eis/v1.0/dashboards?') 
            && response.status() === 200);
        const data = await (await dashboards).json();
        const rows = data.response.rows;
        const randomIndex = Math.floor(Math.random() * rows.length)
        dashboardStore.name = rows[randomIndex].name;
        dashboardStore.entityId = rows[randomIndex].entityId;
        dashboardStore.displays = rows[randomIndex].displayType;
        dashboardStore.collectionId = rows[randomIndex].collectionId;
        let count: string | number = 0;
        for (const display of dashboardStore.displays) { 
            count += 1;
        }
        if (count > 2) { 
            dashboardStore.graphCount = count - 2;
            count = `${count - 2} ${dashboardStore.name}`;
        }
        else {
            dashboardStore.graphCount = count - 2;
            count = `${dashboardStore.name}`;
        }
        return count;
    }   

    async search_dashboard  () { 
        const dashboards = await this.get_dashboards();
        await this.page.getByRole('button', { name: 'Search... ⌘ K' }).click();
        await this.page.getByRole('textbox', { name: 'Search dashboard...' }).pressSequentially(dashboardStore.name, { delay: 100 });
        return dashboards;
    }

    async select_dashboard  () {
        const dashboards = await this.search_dashboard();
        await this.page.getByRole('option', { name: dashboards}).click();
        await this.page.waitForResponse(
            response => response.url()
            .includes(dashboardStore.entityId) 
            && response.status() === 200);
    }

    async fullscreen_dashboard  () { 
        await this.select_dashboard();
        await this.page.getByRole('button', { name: 'Show Full Screen' }).click();
        // await expect(this.page.getByRole('complementary', { name: 'Sidebar Navigation' })).toBeHidden();
        // await expect(this.page.getByText('Executive Information SystemSearch...⌘K')).toBeHidden();
        // await expect(this.page.getByText('Show Full Screen Compare')).toBeHidden();
    }
    async compare_dashboard  () {
        await this.select_dashboard();
        await this.page.getByRole('button', { name: 'Compare' }).click();
        await this.page.waitForSelector('text=Select dashboard');
        await this.page.getByRole('button', { name: 'Select dashboard' }).click();
        if (dashboardStore.graphCount > 0) { 
            await this.page.getByText(`${dashboardStore.graphCount}${dashboardStore.name}`).click();
        }
        else {
            await this.page.getByText(`${dashboardStore.name}`).click();

        }
        await this.page.waitForResponse(
            response => response.url()
            .includes(dashboardStore.entityId) 
            && response.status() === 200);
    }

    async viewed_dashboards () {
        const viewedDashboards = this.page.waitForResponse(
            res => res.url()
            .includes('recents/dashboards?') 
            && res.status() === 200);
        const data = await (await viewedDashboards).json();
        expect(data.response.rows[0].name).toEqual(dashboardStore.name);
    }
    async goto_collection () {
        await this.get_dashboards();
        await this.page.goto(this.page.url() + `/${dashboardStore.collectionId}`);
    }

    async clickStar_icon () { 
        await this.page.getByRole('button').filter({ hasText: /^$/ }).nth(1).click();
        await this.page.getByRole('main').getByText('Executive Information System').click();
        await expect(this.page.getByRole('heading', { name: 'All Dashboard' })).toBeVisible();
    }
    async addTo_Favorites () {  
        await this.clickStar_icon();
        await this.page.reload();
        const dashboard = await this.get_favorites();
        const favorites = dashboard.rows.find((fav: { collectionId: number; }) => fav.collectionId === dashboardStore.collectionId);
        if (favorites) {
            if (dashboardStore.graphCount > 2) { 
                await expect(this.page.getByText(`${dashboardStore.graphCount}${dashboardStore.name}`).first()).toBeVisible();
            }
            else {
                await expect(this.page.getByText(`${dashboardStore.name}`).first()).toBeVisible();
            }
        }
    }

    async remove_Action(favorites: number) {
            await this.clickStar_icon();
            await this.page.reload();
            const dashboard = await this.get_favorites();
            const removedFav = dashboard.rows.find((fav: { collectionId: number; }) => fav.collectionId === favorites);
            expect(removedFav).toBeUndefined();
    }
    async removeFrom_Favorites () { 
       const dashboard = await this.get_favorites();
       if (dashboard.rows.length > 0) {
           const favorites = dashboard.rows[0].collectionId;
           await this.page.goto(this.page.url() + `/${favorites}`);
           await this.remove_Action(favorites);
       }
       else
        {
            await this.page.reload();
            await this.goto_collection();
            await this.addTo_Favorites();
            await this.page.reload();
            const dashboard = await this.get_favorites();
            const favorites = dashboard.rows[0].collectionId;
            await this.page.goto(this.page.url() + `/${favorites}`);
            await this.remove_Action(favorites);
        }

   }


}