import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const directories = [
  'public/avatars',
  'public/badges'
];

async function compressImages() {
  for (const dir of directories) {
    const fullDir = path.join(process.cwd(), dir);
    if (!fs.existsSync(fullDir)) continue;

    const files = fs.readdirSync(fullDir).filter(file => file.endsWith('.png'));

    for (const file of files) {
      const filePath = path.join(fullDir, file);
      const tempPath = path.join(fullDir, `temp_${file}`);

      console.log(`Compressing ${file}...`);

      try {
        await sharp(filePath)
          .resize(256, 256, { fit: 'inside' })
          .png({ quality: 80, compressionLevel: 9 })
          .toFile(tempPath);

        // Replace original file with compressed one
        fs.unlinkSync(filePath);
        fs.renameSync(tempPath, filePath);
        console.log(`Successfully compressed ${file}`);
      } catch (err) {
        console.error(`Error compressing ${file}:`, err);
      }
    }
  }
}

compressImages();
