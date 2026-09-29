const { OAuth2Client } = require("google-auth-library");

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

async function verifyGoogleToken(idToken) {
    try {
        const ticket = await client.verifyIdToken({
            idToken: idToken,
            audience: process.env.GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();
        return payload;
    } catch (error) {
        throw new Error(`Google token verification failed: ${error.message}`);
    }
}

module.exports = {
    verifyGoogleToken,
};
