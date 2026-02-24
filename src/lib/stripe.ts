

export type StripePlan = 'standard' | 'pro' | 'ultra';

const STRIPE_API_BASE = 'https://api.shopsready.com/api/v1';

export async function redirectToCheckout(plan: StripePlan, userEmail?: string): Promise<void> {
  let data: any;

  try {
    const res = await fetch(`${STRIPE_API_BASE}/stripe/checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        plan,
        email: userEmail ?? '',
      }),
    });

    try {
      data = await res.json();
    } catch {
      throw new Error(`Server returned non-JSON response (status ${res.status})`);
    }

    if (!res.ok) {
      throw new Error(data?.error || data?.message || `Server error: ${res.status}`);
    }
  } catch (err: any) {
    // Network-level error (offline, CORS, DNS failure, etc.)
    if (err.name === 'TypeError' && err.message.includes('fetch')) {
      throw new Error('Could not connect to the payment server. Please try again.');
    }
    throw err;
  }

  const url: string = data?.url;

  // Validate the returned URL has a proper https:// scheme
  if (!url || typeof url !== 'string') {
    throw new Error('Payment server did not return a checkout URL.');
  }
  if (!url.startsWith('https://')) {
    throw new Error(`Invalid checkout URL received: "${url}"`);
  }

  // Safe to redirect
  window.location.href = url;
}
