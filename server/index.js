import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { Pinecone } from '@pinecone-database/pinecone';
import dotenv from 'dotenv';
import axios from 'axios';
dotenv.config();
const app = express();
const PORT = 5001;

// Pinecone 접속 
const pc = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY,
});
const index = pc.index('chatbot0'); 


//질문 임베딩 함수 (반환값: 벡터배열)
const getEmbedding = async (question) => {
    const result = await axios.post(
        'https://api.openai.com/v1/embeddings',
        {
            input: question,
            model: 'text-embedding-3-small',
            dimensions: 512,
        },
        {
            headers: {
                Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
            },
        }
    );
    return result.data.data[0].embedding;
}

//임베딩된 질문과 유사한 문서를 pinecone에서 검색하는 함수(반환값: 유사한 문서 목록 matches 배열)
const queryPinecone = async (vector) => {
    const res = await axios.post(
      `https://chatbot0-p3qnqqr.svc.aped-4627-b74a.pinecone.io/query`,
      {
        vector: vector,
        topK: 5,
        includeMetadata: true,
      },
      {
        headers: {
          'Api-Key': process.env.PINECONE_API_KEY,
          'Content-Type': 'application/json',
        },
      }
    );
  
    return res.data.matches;
  };

  const generateAnswer = async (question, context) => {
    const completion = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo', // 또는 'gpt-4'
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant. Use the context to answer the user question.',
          },
          {
            role: 'user',
            content: `질문: ${question}\n\n참고자료:\n${context}`,
          },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );
  
    return completion.data.choices[0].message.content;
  };
  

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Routes
app.post('/api/submit', async (req, res) => {
    const { content } = req.body;
  
    if (!content) {
      return res.status(400).json({ message: '내용을 입력해주세요.' });
    }
  
    try {
      const embeddedQuestion = await getEmbedding(content); // ❗️await 추가
      const replyedData = await queryPinecone(embeddedQuestion); // ❗️await 추가
  
      // 예시로 검색 결과 중 첫 번째 문서 내용 반환
      const context = replyedData.map(m => m.metadata?.text || '').join('\n');
        

    const answer = await generateAnswer(content, context);
    console.log('GPT 답변:', answer);

      res.status(200).json({
        message: '질문이 성공적으로 제출되었습니다!',
        answer: answer,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: '서버 처리 중 오류가 발생했습니다.' });
    }
  });
  

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});