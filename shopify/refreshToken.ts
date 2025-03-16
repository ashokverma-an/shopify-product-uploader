import dotenv from 'dotenv';

dotenv.config();

export const refreshAccessToken = async () => {
  try {
    const response = await fetch(
      `https://${process.env.SHOP_NAME}/admin/oauth/access_token`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: process.env.API_KEY,
          client_secret: process.env.API_SECRET,
          refresh_token: process.env.ACCESS_TOKEN,
        }),
      }
    );

    const data = await response.json();
    process.env.ACCESS_TOKEN = data.access_token;
    console.log('✅ Access token refreshed');
  } catch (error) {
    console.error('❌ Failed to refresh token:', error);
  }
};
