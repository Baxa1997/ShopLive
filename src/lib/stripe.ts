// lib/stripe.ts
// Frontend Stripe checkout helper
// Calls our backend /api/stripe/checkout to get a session URL, then redirects

export type StripePlan = 'pay_per_use' | 'pro_monthly';

/**
 * Redirects the user to Stripe Checkout.
 * The backend API route creates the session and returns the URL.
 * @param plan - which plan to purchase
 * @param userEmail - pre-fills the email in Stripe Checkout
 */
export async function redirectToCheckout(plan: StripePlan, userEmail?: string): Promise<void> {
  try {
    const res = await fetch('/api/stripe/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan, email: userEmail }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to create checkout session');
    }

    const { url } = await res.json();
    if (!url) throw new Error('No checkout URL returned');

    // Redirect user to Stripe's hosted checkout page
    window.location.href = url;
  } catch (err: any) {
    console.error('Stripe checkout error:', err.message);
    throw err;
  }
}
