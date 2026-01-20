import { Telegraf, Markup } from 'telegraf';
import * as dotenv from 'dotenv';
dotenv.config();

const bot = new Telegraf(process.env.BOT_TOKEN || '');
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

bot.start((ctx) => {
    const payload = ctx.payload; // "start payload" e.g. /start 123

    if (payload) {
        // If payload exists, it's likely a QR scan
        // We assume payload is the newcomerId
        ctx.reply(
            `Welcome to Coffee Connect Staff Mode.\n\nScanning ID: ${payload}\nClick below to create an order.`,
            Markup.inlineKeyboard([
                Markup.button.webApp('📝 Create Order', `${APP_URL}/staff/order?newcomerId=${payload}`)
            ])
        );
    } else {
        // Generic Start
        ctx.reply(
            'Welcome to Coffee Connect Bot! ☕\n\nStaff Commands:\nUse the Web App below to view the dashboard.',
            Markup.inlineKeyboard([
                [Markup.button.webApp('📊 View Dashboard', `${APP_URL}/staff/order_list`)],
                [Markup.button.url('🔗 Register Newcomer (Public)', `${APP_URL}`)]
            ])
        );
    }
});

bot.launch().then(() => {
    console.log('Bot started! 🤖');
});

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
