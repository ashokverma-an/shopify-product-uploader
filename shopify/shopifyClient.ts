import Shopify from 'shopify-api-node';
import dotenv from 'dotenv';

dotenv.config();

const shopify = new Shopify({
  shopName: process.env.SHOP_NAME!,
  apiKey: process.env.API_KEY!,
  password: process.env.ACCESS_TOKEN!,
});

export default shopify;
