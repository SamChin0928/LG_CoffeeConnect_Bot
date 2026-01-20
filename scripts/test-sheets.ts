import 'dotenv/config';
import { appendNewcomerToSheet, logOrderToInventory, markRedemptionInSheet } from '../src/lib/sheets';
import { google } from 'googleapis';

async function runTest() {
    console.log('Testing Sheets Integration...');

    // 1. Check Sheet Names
    console.log('--- Checking Available Sheet Tabs ---');
    try {
        const auth = new google.auth.GoogleAuth({
            keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS,
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });
        const sheets = google.sheets({ version: 'v4', auth });
        const meta = await sheets.spreadsheets.get({
            spreadsheetId: process.env.GOOGLE_SHEET_ID_NEWCOMERS
        });
        console.log('Tabs:', meta.data.sheets?.map(s => s.properties?.title));
    } catch (e) {
        console.error('Failed to read sheet metadata:', e);
        return;
    }
    console.log('-------------------------------------');

    const testId = 'TEST-' + Date.now();

    console.log('1. Testing Append Newcomer...');
    // This seems to work (no error in previous run), suggesting "New Visitors Form" might exist or it defaulted?
    // Let's run it again to be sure.
    await appendNewcomerToSheet({
        id: testId,
        name: 'Test User Agent',
        email: 'test@agent.com',
        phone: '123456789'
    });
    console.log('Append Newcomer request sent.');

    console.log('2. Testing Inventory Log...');
    // This FAILED with "Sheet1!A:D" invalid range. 
    // We will see the real sheet names above and then I can correct src/lib/sheets.ts
    try {
        await logOrderToInventory({
            drinkName: 'Test Latte',
            category: 'Coffee',
            newcomerName: 'Test User Agent'
        });
        console.log('Inventory Log request sent.');
    } catch (e) {
        console.error('Inventory Log failed as expected (checking names now).');
    }

    console.log('Waiting for Sheet propagation...');
    await new Promise(r => setTimeout(r, 5000));

    console.log('3. Testing Redemption Mark...');
    // We try to mark the user we just created
    await markRedemptionInSheet(testId, 'Test User Agent');
    console.log('Redemption Mark request sent.');

    console.log('Done!');
}

runTest();
