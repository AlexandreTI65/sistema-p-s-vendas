// Backend simples para proxy de requisições OpenAI (ChatGPT)
const express = require('express');

let fetch = global.fetch;
if (!fetch) {
  // Node <18: importa node-fetch corretamente
  fetch = require('node-fetch');
}
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());


const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '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';
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

app.post('/api/chat', async (req, res) => {
  const { mensagem } = req.body;
  if (!mensagem) return res.status(400).json({ erro: 'Mensagem obrigatória' });
  try {
    const resposta = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': 'http://localhost',
        'X-Title': 'Doudge Pós-Vendas'
      },
      body: JSON.stringify({
  model: 'deepseek/deepseek-chat-v3.1:gratis', // modelo DeepSeek V3.1 gratuito (ID exato do OpenRouter)
        messages: [
          { role: 'system', content: 'Seu nome é DOUD. Você é o assistente virtual DOUD do sistema Doudge Pós-Vendas. Sempre se apresente como DOUD, nunca como Copilot.' },
          { role: 'user', content: mensagem }
        ],
        max_tokens: 200
      })
    });
    const data = await resposta.json();
    console.log('Resposta OpenRouter:', data);
    if (data.choices && data.choices[0] && data.choices[0].message) {
      res.json({ resposta: data.choices[0].message.content });
    } else {
      console.error('Erro na resposta do OpenRouter:', data);
      res.status(500).json({ erro: 'Erro na resposta do OpenRouter', detalhes: data });
    }
  } catch (e) {
    console.error('Erro ao consultar OpenRouter:', e);
    res.status(500).json({ erro: 'Erro ao consultar OpenRouter', detalhes: e.message });
  }
});

const PORT = process.env.PORT || 3030;
app.listen(PORT, () => {
  console.log('Backend IA rodando na porta', PORT);
});
