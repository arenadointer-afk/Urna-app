export default function handler(req: any, res: any) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');

  return res.status(200).json({
    status: 'connected',
    username: 'leonardosutello',
    viewers: 0,
    totalLikes: 0,
    lastError: '',
  });
}
