import { google } from 'googleapis';

// Initialize Auth
const auth = new google.auth.GoogleAuth({
    keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const sheets = google.sheets({ version: 'v4', auth });

const SHEET_TAB_NAME = 'New Visitors Form';

export interface NewcomerSearchResult {
    id: string;
    name: string;
    phone: string;
    email: string;
    createdAt: string;
}

let newcomersCache: { data: NewcomerSearchResult[], timestamp: number } | null = null;
const CACHE_TTL = 10 * 1000; // 10 seconds

export async function searchNewcomersFromSheet(query: string): Promise<NewcomerSearchResult[]> {
    try {
        const now = Date.now();

        // If cache is missing or stale, fetch from sheets
        if (!newcomersCache || (now - newcomersCache.timestamp > CACHE_TTL)) {
            const spreadsheetId = process.env.GOOGLE_SHEET_ID_NEWCOMERS;
            if (!spreadsheetId) {
                console.error('GOOGLE_SHEET_ID_NEWCOMERS not set');
                return [];
            }

            // Fetch all data from the sheet
            const response = await sheets.spreadsheets.values.get({
                spreadsheetId,
                range: `${SHEET_TAB_NAME}!A1:Z1000`,
            });

            const rows = response.data.values;
            if (!rows || rows.length < 2) {
                // Keep old cache if fetch fails? No, return empty but don't cache error?
                // For now, simple logic
                newcomersCache = { data: [], timestamp: now };
            } else {
                const headers = rows[0];
                const dataRows = rows.slice(1);

                // Find column indices
                const nameColIndex = findColIndex(headers, 'Full Name', 'Visitor Name', 'Name');
                const phoneColIndex = findColIndex(headers, 'Contact Number', 'Phone', 'Mobile');
                const emailColIndex = findColIndex(headers, 'Email', 'Email Address');
                const redeemedColIndex = findColIndex(headers, 'Redeemed Coffee', 'Redeemed');
                const timestampColIndex = 0; // Usually first column is timestamp

                if (nameColIndex === -1) {
                    // Log error but set cache to empty to prevent infinite retrying every ms if broken
                    console.error('Could not find name column in sheet');
                    newcomersCache = { data: [], timestamp: now };
                } else {
                    const allResults: NewcomerSearchResult[] = [];

                    dataRows.forEach((row, index) => {
                        const name = row[nameColIndex]?.toString() || '';
                        const redeemed = redeemedColIndex !== -1 ? row[redeemedColIndex]?.toString()?.trim() : '';

                        // Parse logic moved here to cache the FULL list
                        // We only cache UNREDEEMED users? Or all?
                        // Let's cache UNREDEEMED users for now as that's what we search against mostly.
                        // Actually, if we want to search broadly, maybe cache everything?
                        // The original logic filtered by valid name and !redeemed.

                        if (name && !redeemed) {
                            allResults.push({
                                id: `row-${index + 2}`,
                                name: name,
                                phone: row[phoneColIndex]?.toString() || '',
                                email: emailColIndex !== -1 ? row[emailColIndex]?.toString() || '' : '',
                                createdAt: row[timestampColIndex]?.toString() || new Date().toISOString(),
                            });
                        }
                    });

                    // Sort by most recent first?
                    // allResults.reverse(); // If sheet is chronological, reverse makes it newest first
                    newcomersCache = { data: allResults, timestamp: now };
                }
            }
        }

        // --- SERVE FROM CACHE ---
        if (!newcomersCache) return [];

        const normalizedQuery = query.toLowerCase().trim();

        if (normalizedQuery === '') {
            return newcomersCache.data.slice(0, 10);
        }

        // Calculate scores and filter
        const scoredResults = newcomersCache.data.map(n => {
            const score = calculateScore(normalizedQuery, n.name);
            return { ...n, score };
        }).filter(item => item.score < 100);

        // Sort by score (lower is better)
        scoredResults.sort((a, b) => a.score - b.score);

        // Return top 10 results, removing score property
        return scoredResults.slice(0, 10).map(({ score, ...n }) => n);
    } catch (error) {
        console.error('Error searching newcomers from sheet:', error);
        return [];
    }
}

function calculateScore(query: string, name: string): number {
    const q = query.toLowerCase();
    const n = name.toLowerCase();

    if (n === q) return 0; // Exact match
    if (n.startsWith(q)) return 1; // Starts with
    if (n.includes(q)) return 2; // Contains

    // Fuzzy match
    const distance = levenshteinDistance(q, n);
    // Dynamic threshold: allow more errors for longer queries
    const threshold = Math.max(2, Math.floor(q.length / 3));

    if (distance <= threshold) {
        return 3 + distance; // Score 3+, penalized by distance
    }

    return 100; // No match
}

function levenshteinDistance(a: string, b: string): number {
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;

    const matrix = [];

    // increment along the first column of each row
    for (let i = 0; i <= b.length; i++) {
        matrix[i] = [i];
    }

    // increment each column in the first row
    for (let j = 0; j <= a.length; j++) {
        matrix[0][j] = j;
    }

    // Fill in the rest of the matrix
    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1, // substitution
                    Math.min(
                        matrix[i][j - 1] + 1, // insertion
                        matrix[i - 1][j] + 1 // deletion
                    )
                );
            }
        }
    }

    return matrix[b.length][a.length];
}

// Helper to find column index (case-insensitive, trimmed)
function findColIndex(headers: string[], ...keywords: string[]): number {
    return headers.findIndex(h => {
        const norm = h.toLowerCase().trim();
        return keywords.some(k => norm === k.toLowerCase().trim() || norm.includes(k.toLowerCase().trim()));
    });
}

export async function appendNewcomerToSheet(data: { name: string; email?: string; phone?: string; id: string }) {
    try {
        const spreadsheetId = process.env.GOOGLE_SHEET_ID_NEWCOMERS;
        if (!spreadsheetId) return;

        // 1. Fetch headers to map columns dynamically
        const headerRes = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: `${SHEET_TAB_NAME}!A1:Z1`,
        });
        const headers = headerRes.data.values?.[0] || [];

        // Defaults based on observation, but dynamic is safer
        const colTimestamp = 0;
        const colContact = findColIndex(headers, 'Contact Number', 'Phone');
        const colEmail = findColIndex(headers, 'Email');
        const colName = findColIndex(headers, 'Full Name', 'Name');
        const colId = findColIndex(headers, 'System ID', 'ID'); // Might not exist

        // Construct the row with enough empty spaces
        const maxCol = Math.max(colTimestamp, colContact, colEmail, colName, colId, headers.length);
        const row = new Array(maxCol + 1).fill('');

        row[colTimestamp] = new Date().toISOString();
        if (colName !== -1) row[colName] = data.name;
        if (colContact !== -1) row[colContact] = data.phone || '';
        if (colEmail !== -1) row[colEmail] = data.email || '';

        // If there is an ID column, use it. Otherwise, we might append it to end? 
        // For now, let's just NOT write ID if it doesn't exist, to avoid breaking the sheet.
        // Or we can assume the user wants it to link back.
        if (colId !== -1) row[colId] = data.id;

        await sheets.spreadsheets.values.append({
            spreadsheetId,
            range: `${SHEET_TAB_NAME}!A:Z`,
            valueInputOption: 'USER_ENTERED',
            requestBody: { values: [row] },
        });

    } catch (error) {
        console.error('Error appending to Newcomers sheet:', error);
    }
}

const ORDERS_TAB_NAME = 'Orders';

export interface OrderData {
    orderId: string;
    timestamp: string;
    status: 'PENDING' | 'PREPARING' | 'SERVED';
    drink: string;
    newcomerName: string;
    phone: string;
    email?: string;
    connector: string;
    description: string;
}

export async function createOrderInSheet(data: {
    orderId: string;
    drink: string;
    newcomerName: string;
    phone: string;
    email?: string;
    connector: string;
    description: string;
}): Promise<boolean> {
    try {
        const spreadsheetId = process.env.GOOGLE_SHEET_ID_INVENTORY;
        if (!spreadsheetId) {
            console.error('GOOGLE_SHEET_ID_INVENTORY not set');
            return false;
        }

        // Headers: Order ID | Timestamp | Status | Drink | Newcomer Name | Phone | Email | Connector | Description
        const values = [[
            data.orderId,
            new Date().toISOString(),
            'PENDING',
            data.drink,
            data.newcomerName,
            data.phone,
            data.email || '',
            data.connector,
            data.description,
        ]];

        await sheets.spreadsheets.values.append({
            spreadsheetId,
            range: `${ORDERS_TAB_NAME}!A:I`,
            valueInputOption: 'USER_ENTERED',
            requestBody: { values },
        });

        return true;
    } catch (error) {
        console.error('Error creating order in sheet:', error);
        return false;
    }
}

export async function getOrdersFromSheet(): Promise<OrderData[]> {
    try {
        const spreadsheetId = process.env.GOOGLE_SHEET_ID_INVENTORY;
        if (!spreadsheetId) {
            console.error('GOOGLE_SHEET_ID_INVENTORY not set');
            return [];
        }

        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: `${ORDERS_TAB_NAME}!A:I`,
        });

        const rows = response.data.values;
        if (!rows || rows.length < 2) {
            return [];
        }

        // Skip header row
        const dataRows = rows.slice(1);

        return dataRows.map(row => ({
            orderId: row[0] || '',
            timestamp: row[1] || '',
            status: (row[2] as 'PENDING' | 'PREPARING' | 'SERVED') || 'PENDING',
            drink: row[3] || '',
            newcomerName: row[4] || '',
            phone: row[5] || '',
            email: row[6] || '',
            connector: row[7] || '',
            description: row[8] || '',
        })).filter(order => order.orderId); // Filter out empty rows
    } catch (error) {
        console.error('Error getting orders from sheet:', error);
        return [];
    }
}

export async function updateOrderStatusInSheet(orderId: string, newStatus: 'PENDING' | 'PREPARING' | 'SERVED'): Promise<boolean> {
    try {
        const spreadsheetId = process.env.GOOGLE_SHEET_ID_INVENTORY;
        if (!spreadsheetId) {
            console.error('GOOGLE_SHEET_ID_INVENTORY not set');
            return false;
        }

        // First, find the row with this order ID
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: `${ORDERS_TAB_NAME}!A:A`,
        });

        const rows = response.data.values;
        if (!rows) return false;

        const rowIndex = rows.findIndex(row => row[0] === orderId);
        if (rowIndex === -1) {
            console.error('Order not found:', orderId);
            return false;
        }

        // Update the status column (column C, index 2)
        const updateRange = `${ORDERS_TAB_NAME}!C${rowIndex + 1}`;

        await sheets.spreadsheets.values.update({
            spreadsheetId,
            range: updateRange,
            valueInputOption: 'USER_ENTERED',
            requestBody: { values: [[newStatus]] },
        });

        return true;
    } catch (error) {
        console.error('Error updating order status:', error);
        return false;
    }
}

// Legacy function for backwards compatibility
export async function logOrderToInventory(data: { drinkName: string; category: string; newcomerName: string }) {
    // Now redirects to createOrderInSheet with basic data
    console.log('logOrderToInventory called - legacy function');
}

export async function markRedemptionInSheet(newcomerId: string, newcomerName?: string) {
    try {
        const spreadsheetId = process.env.GOOGLE_SHEET_ID_NEWCOMERS;
        if (!spreadsheetId) return;

        const readRes = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: `${SHEET_TAB_NAME}!A1:Z1000`,
        });

        const rows = readRes.data.values;
        if (!rows || rows.length === 0) return;

        const headers = rows[0];

        // Find Column Indexes STRICTLY
        const idColIndex = headers.findIndex(h => h.trim() === 'ID' || h.trim() === 'System ID');
        const nameColIndex = findColIndex(headers, 'Full Name', 'Visitor Name');
        const redeemedColIndex = findColIndex(headers, 'Redeemed Coffee');

        if (redeemedColIndex === -1) {
            console.error('Could not find "Redeemed Coffee" column');
            return;
        }

        let targetRowIndex = -1;

        // A: Find by ID (if column exists)
        if (idColIndex !== -1 && newcomerId) {
            targetRowIndex = rows.findIndex(row => row[idColIndex] === newcomerId);
        }

        // B: Find by Name
        if (targetRowIndex === -1 && nameColIndex !== -1 && newcomerName) {
            targetRowIndex = rows.findIndex(row => {
                const rowName = row[nameColIndex]?.toString().toLowerCase().trim() || '';
                return rowName === newcomerName.toLowerCase().trim();
            });
        }

        if (targetRowIndex === -1) {
            console.log(`Could not find row for Newcomer ${newcomerId} / ${newcomerName}`);
            return;
        }

        const sheetRowNumber = targetRowIndex + 1;
        const colLetter = String.fromCharCode(65 + redeemedColIndex);

        const updateRange = `${SHEET_TAB_NAME}!${colLetter}${sheetRowNumber}`;

        await sheets.spreadsheets.values.update({
            spreadsheetId,
            range: updateRange,
            valueInputOption: 'USER_ENTERED',
            requestBody: { values: [['Yes']] }
        });

        console.log(`Marked redemption for ${newcomerName} at ${updateRange}`);

    } catch (error) {
        console.error('Error updating redemption:', error);
    }
}
