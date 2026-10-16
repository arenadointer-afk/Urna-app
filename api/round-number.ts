export default function handler(req: any, res: any) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { roundNumber } = req.body || {};
  const num = parseInt(roundNumber, 10);
  return res.status(200).json({
    success: true,
    roundNumber: !isNaN(num) && num >= 1 ? num : 1,
  });
}
