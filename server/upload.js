import fs from 'fs';
import path from 'path';
import { Pinecone } from '@pinecone-database/pinecone';
import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
const index = pc.index('chatbot0');

// 📄 텍스트 파일에서 문장 읽기
const loadSentencesFromTxt = () => {
  const filePath = path.join('./data/data1.txt');
  const content = fs.readFileSync(filePath, 'utf-8');

  const lines = content
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0); // 빈 줄 제거

  return lines.map((text, i) => ({
    id: `doc${i + 1}`,
    text,
  }));
};

const getEmbedding = async (text) => {
  const res = await axios.post(
    'https://api.openai.com/v1/embeddings',
    {
      input: text,
      model: 'text-embedding-3-small',
      dimensions: 512,
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
    }
  );
  return res.data.data[0].embedding;
};

const uploadToPinecone = async () => {
  const documents = loadSentencesFromTxt(); // ⬅️ 여기서 텍스트 파일로부터 문장 가져옴
  const vectors = [];

  for (const doc of documents) {
    const embedding = await getEmbedding(doc.text);
    vectors.push({
      id: doc.id,
      values: embedding,
      metadata: { text: doc.text },
    });
  }

  await index.upsert(vectors);
  console.log('✅ Pinecone에 텍스트 파일 데이터 업로드 완료!');
};

uploadToPinecone();
