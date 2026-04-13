#!/usr/bin/env node
/**
 * Creates Stripe products and prices for the 4 plans.
 * Also creates annual variants with 17% discount.
 *
 * Run: STRIPE_SECRET_KEY=sk_test_xxx node scripts/stripe-setup-products.mjs
 *
 * After running, copy the price IDs into the plans table via SQL.
 */

import Stripe from 'stripe';

const key = process.env.STRIPE_SECRET_KEY;
if (!key) {
  console.error('Set STRIPE_SECRET_KEY environment variable');
  process.exit(1);
}

const stripe = new Stripe(key);

const plans = [
  // Pro: €19/mo, €15/mo annual (€180/yr)
  {
    name: 'Webmaster Monitor — Pro',
    planId: 'pro',
    monthlyEur: 1900,       // cents
    annualEur: 18000,        // €15/mo × 12 = €180
    features: ['30 siti', 'Check ogni 5 min', 'Multi-canale', 'Scanner DNS/SSL/CMS'],
    trialDays: 14,
  },
  // Business: €49/mo, €41/mo annual (€492/yr)
  {
    name: 'Webmaster Monitor — Business',
    planId: 'business',
    monthlyEur: 4900,
    annualEur: 49200,        // €41/mo × 12 = €492
    features: ['100 siti', 'Check ogni 3 min', 'CRM', 'API', 'Team 10'],
    trialDays: 14,
  },
  // Agency: €129/mo, €109/mo annual (€1308/yr)
  {
    name: 'Webmaster Monitor — Agency',
    planId: 'agency',
    monthlyEur: 12900,
    annualEur: 130800,       // €109/mo × 12 = €1308
    features: ['300 siti', 'Check ogni 1 min', 'Agent cPanel', 'API', 'Team 50'],
    trialDays: 14,
  },
];

console.log('Creating Stripe products and prices...\n');

const sqlUpdates = [];

for (const plan of plans) {
  // Create product
  const product = await stripe.products.create({
    name: plan.name,
    metadata: { plan_id: plan.planId },
    marketing_features: plan.features.map(f => ({ name: f })),
  });

  console.log(`✔ Product: ${product.name} (${product.id})`);

  // Monthly price
  const monthly = await stripe.prices.create({
    product: product.id,
    unit_amount: plan.monthlyEur,
    currency: 'eur',
    recurring: { interval: 'month', trial_period_days: plan.trialDays },
    metadata: { plan_id: plan.planId, billing_period: 'monthly' },
  });

  console.log(`  Monthly: €${plan.monthlyEur / 100}/mo → ${monthly.id}`);

  // Annual price
  const annual = await stripe.prices.create({
    product: product.id,
    unit_amount: plan.annualEur,
    currency: 'eur',
    recurring: { interval: 'year', trial_period_days: plan.trialDays },
    metadata: { plan_id: plan.planId, billing_period: 'annual' },
  });

  console.log(`  Annual:  €${plan.annualEur / 100}/yr → ${annual.id}`);

  sqlUpdates.push(
    `UPDATE plans SET stripe_price_id = '${monthly.id}' WHERE id = '${plan.planId}';`
  );

  console.log('');
}

console.log('── SQL to populate plans table (monthly price IDs) ──\n');
sqlUpdates.forEach(s => console.log(s));
console.log('\n── Copy these SQL statements into your Supabase SQL editor ──');
console.log('\nAlso save the annual price IDs — you will need them for the');
console.log('checkout endpoint when annual billing is selected.');
