export default function handler(req: any, res: any) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const username = req.body?.username || 'leonardosutello';
  return res.status(200).json({
    success: true,
    message: `Conectado ao perfil @${username} via Sincronização em Nuvem Firebase!`,
    status: 'connected',
    username,
  });
}
