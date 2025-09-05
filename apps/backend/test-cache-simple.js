// Simple cache test - no TypeScript, pure JavaScript
const http = require('http');

function makeRequest(path) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: 'GET'
    };
    
    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        const elapsed = Date.now() - start;
        console.log(`✅ ${path} - ${elapsed}ms - Status: ${res.statusCode}`);
        resolve({ data: JSON.parse(data), elapsed, status: res.statusCode });
      });
    });
    
    req.on('error', (error) => {
      console.error(`❌ Error: ${error.message}`);
      reject(error);
    });
    
    req.end();
  });
}

async function testCache() {
  console.log('🚀 Testing In-Memory Cache Implementation\n');
  console.log('========================================\n');
  
  try {
    // First, check if server is running
    console.log('1️⃣ Checking server health...');
    await makeRequest('/health');
    
    // Test cache on asset summary endpoint
    console.log('\n2️⃣ Testing cache on /api/assets/summary endpoint:');
    console.log('-------------------------------------------');
    
    const first = await makeRequest('/api/assets/summary');
    console.log(`   First call (cold cache): ${first.elapsed}ms`);
    
    const second = await makeRequest('/api/assets/summary');
    console.log(`   Second call (cached): ${second.elapsed}ms`);
    
    const third = await makeRequest('/api/assets/summary');
    console.log(`   Third call (cached): ${third.elapsed}ms`);
    
    // Calculate improvement
    const improvement = ((first.elapsed - second.elapsed) / first.elapsed * 100).toFixed(1);
    console.log(`\n📈 Performance Improvement: ${improvement}%`);
    
    if (second.elapsed < first.elapsed / 2) {
      console.log('✅ SUCCESS: Cache is working effectively!');
    } else {
      console.log('⚠️  Cache may not be working as expected');
    }
    
    // Check cache stats
    console.log('\n3️⃣ Checking cache statistics...');
    const stats = await makeRequest('/api/assets/cache-stats');
    console.log('   Cache Stats:', stats.data);
    
  } catch (error) {
    console.error('Test failed:', error.message);
    console.log('\n⚠️  Make sure the server is running with: npm run start:dev');
  }
  
  console.log('\n========================================');
  console.log('✅ Cache test completed!\n');
}

// Run the test
testCache();