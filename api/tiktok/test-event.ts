export default function handler(req: any, res: any) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');

  return res.status(200).json({
    success: true,
    message: 'Evento de teste processado na nuvem com sucesso!',
  });
}
