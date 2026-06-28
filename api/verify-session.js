import Stripe from "stripe";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  try {
    const { session_id } = req.body;
    const session = await stripe.checkout.sessions.retrieve(session_id);
    if (session.payment_status === "paid" || session.status === "complete") {
      return res.status(200).json({ success: true, customer: session.customer_email });
    }
    return res.status(200).json({ success: false });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
