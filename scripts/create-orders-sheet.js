require('dotenv').config();
const { google } = require('googleapis');

async function createOrdersSheet() {
    const auth = new google.auth.GoogleAuth({
        keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS,
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetId = process.env.GOOGLE_SHEET_ID_INVENTORY;

    console.log('Creating Orders sheet in spreadsheet:', spreadsheetId);

    try {
        // Create the Orders sheet
        await sheets.spreadsheets.batchUpdate({
            spreadsheetId,
            requestBody: {
                requests: [{
                    addSheet: {
                        properties: {
                            title: 'Orders',
                        }
                    }
                }]
            }
        });
        console.log('Orders sheet created successfully!');

        // Add headers to the Orders sheet
        const headers = [['Order ID', 'Timestamp', 'Status', 'Drink', 'Newcomer Name', 'Phone', 'Email', 'Connector', 'Description']];
        await sheets.spreadsheets.values.update({
            spreadsheetId,
            range: 'Orders!A1:I1',
            valueInputOption: 'USER_ENTERED',
            requestBody: { values: headers },
        });
        console.log('Headers added successfully!');

    } catch (error) {
        if (error.message.includes('already exists')) {
            console.log('Orders sheet already exists. Adding headers...');
            // Just add headers
            const headers = [['Order ID', 'Timestamp', 'Status', 'Drink', 'Newcomer Name', 'Phone', 'Email', 'Connector', 'Description']];
            await sheets.spreadsheets.values.update({
                spreadsheetId,
                range: 'Orders!A1:I1',
                valueInputOption: 'USER_ENTERED',
                requestBody: { values: headers },
            });
            console.log('Headers added/updated successfully!');
        } else {
            console.error('Error:', error.message);
        }
    }
}

createOrdersSheet();
