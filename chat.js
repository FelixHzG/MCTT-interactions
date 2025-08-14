// Username of someone who is currently live
import { TikTokLiveConnection, WebcastEvent } from 'tiktok-live-connector';
import dotenv from 'dotenv';

dotenv.config();

const tiktokUsername = process.env.TIKTOK_USERNAME;
if (!tiktokUsername) {
    console.error('❌ TIKTOK_USERNAME environment variable is not set.');
    process.exit(1);
}

// Create a new wrapper object and pass the username
const connection = new TikTokLiveConnection(tiktokUsername);

// Connect to the chat (await can be used as well)
connection.connect().then(state => {
    console.info(`✅ Connected to @${tiktokUsername} 's roomId ${state.roomId}`);
}).catch(err => {
    console.error('❌ Failed to connect', err);
});

// Chat messages (comments)
connection.on(WebcastEvent.CHAT, data => {
    try {
        sendChatToMinecraft(data);
    } catch (error) {
        console.error('Error processing chat message:', error);
    }
});


// Tiktok gifts
connection.on(WebcastEvent.GIFT, data => {
    try {
        sendGiftToMinecraft(data);
    } catch (error) {
        console.error('Error processing gift:', error);
    }
});


function sendChatToMinecraft(data) {
    let nickname = data.user.nickname === '' ? data.user.uniqueId : data.user.nickname;

    const params = new URLSearchParams();
    const tellraw = [
        { text: `${nickname}: `, color: "blue", /*bold: true*/ },
        { text: data.comment, color: "white", bold: false }
    ];
    params.append('command', `tellraw @a ${JSON.stringify(tellraw)}`);
    params.append('time', '');

    fetch('http://localhost:4567/v1/server/exec', {
        method: 'POST',
        headers: {
            'accept': '*/*',
            'key': 'KeyboardCat',
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: params
    }).then(response => {
        if (!response.ok) {
            console.error('Failed to send chat to Minecraft:', response.statusText);
        }
    }).catch(error => {
        console.error('Error sending chat to Minecraft:', error);
    });
}

function sendGiftToMinecraft(data) {
    // console.log(JSON.stringify(data));
    const params = new URLSearchParams();
    let nickname = data.user.nickname === '' ? `@${data.user.uniqueId}` : data.user.nickname;
    let tellraw = {};
    // console.log(data);
    // console.log(`data.giftDetails.giftType: ${data.giftDetails.giftType}, data.user.repeatEnd: ${data.repeatEnd}s`);

    if (data.giftDetails.giftType === 1 && data.repeatEnd === 0) {
        return; // Skip non-streakable gifts, comment out this line to enable showing all gifts in chats
        if (data.repeatCount === 1) { 
            // Skip the first message of a streak
            // console.log('First gift in a streak, skipping message');
            return;
        }
        // console.log('Streak in progress');
        // Streak in progress => greyed
        tellraw = [
            { text: `${nickname} is sending gift ${data.giftDetails.giftName} x${data.repeatCount}`, color: "gray", italic: true, obfuscated: false },
        ];
    } else {
        // Streak ended or non-streakable gift => process the gift with final repeat_count
        // console.log('Gift ended');
        tellraw = [
            { text: `${nickname}`, color: "yellow", bold: true },
            { text: ` has sent gift ${data.giftDetails.giftName} x${data.repeatCount}`, color: "yellow", bold: true }
        ];
    }
    // console.log('tellraw:', tellraw);

    params.append('command', `tellraw @a ${JSON.stringify(tellraw)}`);
    params.append('time', '');

    fetch('http://localhost:4567/v1/server/exec', {
        method: 'POST',
        headers: {
            'accept': '*/*',
            'key': 'KeyboardCat',
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: params
    }).then(response => {
        if (!response.ok) {
            console.error('Failed to send gift to Minecraft:', response.statusText);
        }
    }).catch(error => {
        console.error('Error sending gift to Minecraft:', error);
    });
}
