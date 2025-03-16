"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const csv_parser_1 = __importDefault(require("csv-parser"));
const fs_1 = __importDefault(require("fs"));
const dotenv_1 = __importDefault(require("dotenv"));
const shopify_api_node_1 = __importDefault(require("shopify-api-node"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const port = process.env.PORT || 5000;
const shopify = new shopify_api_node_1.default({
    shopName: process.env.SHOP_NAME,
    apiKey: process.env.API_KEY,
    password: process.env.API_PASSWORD,
});
const upload = (0, multer_1.default)({ dest: 'uploads/' });
app.post('/upload', upload.single('file'), (req, res) => {
    if (!req.file)
        return res.status(400).send('No file uploaded');
    const results = [];
    fs_1.default.createReadStream(req.file.path)
        .pipe((0, csv_parser_1.default)())
        .on('data', (data) => results.push(data))
        .on('end', async () => {
        try {
            for (const product of results) {
                await shopify.product.create({
                    title: product.Title,
                    body_html: product.Description,
                    variants: [{ price: product.Price, sku: product.SKU }],
                    images: [{ src: product.Image }],
                });
            }
            res.status(200).send('Products uploaded successfully!');
        }
        catch (error) {
            console.error('Error uploading product:', error.message);
            res.status(500).send('Failed to upload products');
        }
    });
});
app.listen(port, () => console.log(`Server running on port ${port}`));
