import express from 'express';
import dotenv from 'dotenv';
import multer from 'multer';

import fs from 'fs';
import path from 'path';

import {GoogleGenAI} from '@google/genai';

dotenv.config();
const app = express();

app.use(
  express.json()
);

const genAI = new GoogleGenAI ({
apiKey: process.env.API_KEY
})

const result = await genAI.models.generateContent({model: 'gemini-2.0-flash', contents: "Hi."});
console.log(result.text);

const upload = multer ({
  dest: 'uploads/'
});

app.post('/generate-text', async (req, res) => {
  const { prompt } = req.body;

  try {
    const result = await genAI.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt
    });

    console.log(result.text);

    res.json({
      output: result.text
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({
      error: e.message
    });
  }
});

app.post('/generate-from-image', upload.single('image'), async (req, res) => {
  const { prompt = "Describe this uploaded image." } = req.body;

  try {
    // 1. Baca file gambar
    const image = await genAI.files.upload({
      file: req.file.path,
      config: {
        mimeType: req.file.mimetype
      }
    });

    // 3. Sertakan dalam prompt
    const result = await genAI.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: [
        createUserContent([
          prompt,
          createPartFromUri(image.uri, image.mimeType)
        ]),
      ],
    });

   console.log(result.text);

    res.json({ output: result.text });
  } catch (error) {
    console.error("Error generating content:", error);
    res.status(500).json({ error: error.message });
  } finally {
    fs.unlinkSync(req.file.path);
  }
});

app.post('/generate-from-document', upload.single('document'), async (req, res) => {
  const { prompt = "Describe this uploaded document." } = req.body;

  try {
    const filePath = req.file.path;
    const buffer = fs.readFileSync(filePath);
    const base64Data = buffer.toString('base64');
    const mimeType = req.file.mimetype;

    const documentPart = {
      inlineData: { data: base64Data, mimeType }
    };

    console.log({documentPart});

    const result = await genAI.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: [
        createUserContent([
          prompt,
          documentPart
        ]),
      ],
    });

    console.log(result.text);

    res.json({ output: result.text });
  } catch (error) {
    console.error("Error generating content:", error);
    res.status(500).json({
      error: e.message
    });
  } finally {
    fs.unlinkSync(req.file.path);
  }
});

app.post('/generate-from-audio', upload.single('audio'), async (req, res) => {
  const { prompt = "Describe this uploaded audio." } = req.body;

  try {
    const audioBuffer = fs.readFileSync(req.file.path);
    const base64Audio = audioBuffer.toString('base64');
    const mimeType = req.file.mimetype;

    const audioPart = {
      inlineData: { data: base64Audio, mimeType }
    };

    console.log({audioPart});

    const result = await genAI.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: [
        createUserContent([
          prompt,
          audioPart
        ]),
      ],
    });

    console.log(result.text);

    res.json({ output: result.text });
  } catch (error) {
    console.error("Error generating content:", error);
    res.status(500).json({ error: error.message });
  } finally {
    fs.unlinkSync(req.file.path);
  }
});

const PORT = 3000;

app.listen(PORT, () => {
  console.log("I Love you " + PORT);
});