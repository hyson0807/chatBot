import { useState } from 'react';
import './App.css';
import axios from 'axios';

function App() {
  const [content, setContent] = useState('');
  const [handleAnswer, setHandleAnswer] = useState('');
  const [answer, setAnswer] = useState('');

  const submitQ = async () => {
    try {
      const response = await axios.post('http://localhost:5001/api/submit', {
        content,
      });
      alert(response.data.answer);
      setContent('');
    } catch (error) {
      console.error('Error:', error);
      alert("Failed to submit data: " + (error.response?.data?.message || error.message));
    }
  };

  return (
    <div className='flex flex-col items-center justify-center space-y-5 w-full mt-20'>
      <div className='text-center'>
        <h4 className='text-2xl font-bold'>질문해 주세요~</h4>
      </div>
      <div className='w-full'>
        <textarea
          className='w-full border border-gray-300 rounded-2xl text-left text-gray-600 p-1'
          rows='4'
          placeholder='질문내용'
          value={content}
          onChange={(e) => setContent(e.target.value)}
        ></textarea>
      </div>
      <button
        className='w-32 py-4 border border-gray-300 bg-gray-200 rounded-2xl hover:bg-gray-400'
        onClick={submitQ}
      >
        질문하기
      </button>
      <div className='w-full h-20 border border-gray-300 rounded-2xl'>

      </div>
    </div>
  );
}

export default App;
