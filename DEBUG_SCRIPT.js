// Debug script for NSE Stock Analysis Platform
// Open browser console (F12) and paste this to diagnose issues

console.log('🔍 NSE Platform Debug Tool');
console.log('=========================\n');

// 1. Check if user is logged in
const token = localStorage.getItem('token');
const user = localStorage.getItem('user');
console.log('✓ Auth Status:');
console.log('  Token:', token ? '✅ Present' : '❌ Missing');
console.log('  User:', user ? '✅ Present' : '❌ Missing');
if (user) {
  try {
    const userData = JSON.parse(user);
    console.log('  Username:', userData.username);
    console.log('  Email:', userData.email);
  } catch (e) {
    console.log('  ⚠️ User data corrupted');
  }
}

// 2. Check API connectivity
console.log('\n✓ Testing Backend API:');
fetch('http://localhost:8000/api/symbols/popular')
  .then(res => res.json())
  .then(data => {
    console.log('  ✅ Backend responding');
    console.log('  Symbols available:', data.count);
  })
  .catch(err => {
    console.log('  ❌ Backend not responding:', err.message);
  });

// 3. Check if charts library loaded
console.log('\n✓ Chart Library:');
if (typeof window !== 'undefined' && window.LightweightCharts) {
  console.log('  ✅ lightweight-charts loaded');
  console.log('  Version:', window.LightweightCharts.version || 'Unknown');
} else {
  console.log('  ⚠️ lightweight-charts not yet loaded (may load later)');
}

// 4. Check localStorage
console.log('\n✓ LocalStorage:');
console.log('  Keys:', Object.keys(localStorage).join(', '));
console.log('  Size:', new Blob(Object.values(localStorage)).size, 'bytes');

// 5. Check for errors in console
console.log('\n✓ Console Status:');
console.log('  Clear console to see new errors only');
console.log('  Watch for: TypeError, NetworkError, 404, 401, 500');

// 6. Test chart data fetch
if (token) {
  console.log('\n✓ Testing Chart Data:');
  fetch('http://localhost:8000/api/prices/RELIANCE?period=1mo', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
    .then(res => {
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      return res.json();
    })
    .then(data => {
      console.log('  ✅ Chart data available');
      console.log('  Data points:', data.data.length);
      console.log('  Symbol:', data.symbol);
      console.log('  Period:', data.period);
    })
    .catch(err => {
      console.log('  ❌ Chart data fetch failed:', err.message);
    });
}

console.log('\n=========================');
console.log('💡 Tips:');
console.log('- If token is missing, try logging in again');
console.log('- If backend not responding, check terminal');
console.log('- If 401 error, token may be expired');
console.log('- Clear cache: Ctrl+Shift+Delete');
console.log('- Hard refresh: Ctrl+Shift+R');
console.log('\n📊 To test charts:');
console.log('1. Select a stock (e.g., RELIANCE)');
console.log('2. Navigate to Advanced Charts tab');
console.log('3. Click on chart types to enable');
console.log('4. Watch console for errors');
