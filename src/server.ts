import express, { Request, Response } from 'express';
import multer from 'multer';
import csv from 'csv-parser';
import fs from 'fs';
import dotenv from 'dotenv';
import Shopify from 'shopify-api-node';


dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// Shopify setup
const shopify = new Shopify({
  shopName: process.env.SHOP_NAME!,
  apiKey: process.env.API_KEY!,
  password: process.env.API_PASSWORD!,
});

// Set up Multer for file uploads
const upload = multer({ dest: 'uploads/' });

app.post('/upload', upload.single('file'), (req: Request, res: Response): void => {
  const file = req.file as Express.Multer.File;

  // Ensure file exists
  if (!file) {
    res.status(400).json({ error: 'No file uploaded' });
    return;
  }

  const results: any[] = [];

  // Parse CSV file
  fs.createReadStream(file.path)
    .pipe(csv())
    .on('data', (data) => results.push(data))
    .on('end', async () => {
      try {
        if (results.length === 0) {
          fs.unlinkSync(file.path);
          res.status(400).json({ error: 'Uploaded file is empty!' });
          return;
        }

        let successCount = 0;
        let errorCount = 0;
        const errors: string[] = [];

        // Loop through products and upload to Shopify
        for (const product of results) {
          try {
            if (!product.Title || !product.Price || !product.SKU) {
              errorCount++;
              errors.push(`Missing fields for product: ${product.Title || 'Unknown'}`);
              continue;
            }

            await shopify.product.create({
              title: product.Title,
              body_html: product.Description || '',
              variants: [{ price: product.Price, sku: product.SKU }],
              images: product.Image ? [{ src: product.Image }] : undefined,
            });

            successCount++;
          } catch (error: any) {
            console.error(`❌ Error uploading product ${product.Title}: ${error.message}`);
            errorCount++;
            errors.push(`Failed to upload ${product.Title}: ${error.message}`);
          }
        }

        // Cleanup uploaded file
        fs.unlinkSync(file.path);

        // Respond with results
        res.status(200).json({
          message: 'Upload completed!',
          successCount,
          errorCount,
          errors,
        });
      } catch (error: any) {
        console.error('❌ Unexpected error:', error.message);
        fs.unlinkSync(file.path);
        res.status(500).json({ error: 'Failed to upload products due to server error' });
      }
    })
    .on('error', (error) => {
      console.error('❌ File processing error:', error.message);
      fs.unlinkSync(file.path);
      res.status(500).json({ error: 'Failed to process file' });
    });
});

// Start the server
app.listen(port, () => console.log(`🚀 Server running on port ${port}`));
