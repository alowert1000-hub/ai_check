export function handleStatus(_req, res) {
  return res.status(200).json({ serverKey: Boolean(process.env.OPENAI_API_KEY) });
}

export default handleStatus;
