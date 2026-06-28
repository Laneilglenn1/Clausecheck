import Stripe from "stripe";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "subscription",
      line_items: [{
        price_data: {
          currency: "usd",
          product_data: {
            name: "SignShield Pro",
            description: "Unlimited AI contract analysis, red flag detection, negotiation emails & more",
          },
          unit_amount: 2900,
          recurring: { interval: "month" },
        },
        quantity: 1,
      }],
      success_url: `${req.headers.origin}/?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.origin}/?canceled=true`,
    });
    return res.status(200).json({ url: session.url });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
