const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkPromo() {
  const { data: promoCodes, error: promoError } = await supabase
    .from('promo_code')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10);

  if (promoError) {
    console.error('Error fetching promo codes:', promoError);
    return;
  }

  console.log('\n=== Recent Promo Codes ===');
  promoCodes.forEach(promo => {
    console.log(`\nCode: ${promo.code}`);
    console.log(`Name: ${promo.name}`);
    console.log(`Duration (months): ${promo.duration_months || 'NOT SET'}`);
    console.log(`Expiry: ${promo.expiry_date}`);
    console.log(`Active: ${promo.active}`);
    console.log(`Stripe Price ID: ${promo.stripe_price_id || 'None'}`);
  });

  const { data: userSubs, error: subError } = await supabase
    .from('user_subscription')
    .select('*, promo_code:promo_code_id(*)')
    .order('created_at', { ascending: false })
    .limit(5);

  if (subError) {
    console.error('Error fetching user subscriptions:', subError);
    return;
  }

  console.log('\n\n=== Recent User Subscriptions ===');
  userSubs.forEach(sub => {
    console.log(`\nUser ID: ${sub.user_id}`);
    console.log(`Start: ${sub.start_date}`);
    console.log(`End: ${sub.end_date}`);

    const start = new Date(sub.start_date);
    const end = new Date(sub.end_date);
    const monthsDiff = (end.getFullYear() - start.getFullYear()) * 12 +
                       (end.getMonth() - start.getMonth());

    console.log(`Duration (calculated): ${monthsDiff} months`);
    console.log(`Active: ${sub.is_active}`);
    if (sub.promo_code) {
      console.log(`Promo Code: ${sub.promo_code.code}`);
      console.log(`Promo Duration (months): ${sub.promo_code.duration_months || 'NOT SET'}`);
    }
  });
}

checkPromo().then(() => {
  console.log('\n\nDone!');
  process.exit(0);
}).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
