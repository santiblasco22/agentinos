import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth';
import agentRoutes from './routes/agents';
import catalogRoutes from './routes/catalog';
import conversationRoutes from './routes/conversations';
import webhookRoutes from './routes/webhook';
import playgroundRoutes from './routes/playground';

const app = express();
const PORT = process.env.PORT ?? 3001;

app.use(cors({
  origin: [process.env.FRONTEND_URL ?? 'http://localhost:3000', 'http://localhost:3000'],
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use('/auth', authRoutes);
app.use('/agents', agentRoutes);
app.use('/agents', playgroundRoutes);
app.use('/', catalogRoutes);
app.use('/', conversationRoutes);
app.use('/', webhookRoutes);

app.get('/payment/success', (_req, res) => res.send('<h1>¡Pago exitoso! 🎉</h1><p>Podés cerrar esta ventana.</p>'));
app.get('/payment/failure', (_req, res) => res.send('<h1>El pago no se procesó.</h1>'));
app.get('/payment/pending', (_req, res) => res.send('<h1>Pago pendiente.</h1>'));
app.post('/payment/notification', (_req, res) => res.sendStatus(200));

app.get('/health', (_req, res) => res.json({ status: 'ok', ts: Date.now() }));

app.listen(PORT, () => {
  console.log(`🤖 AGENTINOS backend — puerto ${PORT}`);
});
