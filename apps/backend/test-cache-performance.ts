/**
 * Cache Performance Test Script
 * Tests the performance improvement from in-memory caching
 * Run with: npx ts-node test-cache-performance.ts
 */

const API_BASE = 'http://localhost:3000/api/assets';

interface TestResult {
  endpoint: string;
  firstCall: number;
  secondCall: number;
  improvement: string;
}

async function measureApiCall(url: string, label: string): Promise<number> {
  const startTime = Date.now();
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`❌ Failed: ${label} - Status: ${response.status}`);
      return -1;
    }
    const data = await response.json();
    const elapsed = Date.now() - startTime;
    
    console.log(`✅ ${label}: ${elapsed}ms`);
    return elapsed;
  } catch (error) {
    console.error(`❌ Error: ${label} -`, error);
    return -1;
  }
}

async function testCachePerformance(): Promise<void> {
  console.log('🚀 Cache Performance Test Starting...\n');
  console.log('================================');
  
  const results: TestResult[] = [];
  
  // Test 1: Asset Summary Endpoint (Most Expensive)
  console.log('\n📊 Test 1: Asset Summary (4 parallel queries)');
  console.log('--------------------------------');
  
  const summaryFirst = await measureApiCall(
    `${API_BASE}/summary`,
    'First call (no cache)'
  );
  
  const summarySecond = await measureApiCall(
    `${API_BASE}/summary`,
    'Second call (cached)'
  );
  
  if (summaryFirst > 0 && summarySecond > 0) {
    const improvement = ((summaryFirst - summarySecond) / summaryFirst * 100).toFixed(1);
    results.push({
      endpoint: '/summary',
      firstCall: summaryFirst,
      secondCall: summarySecond,
      improvement: `${improvement}%`
    });
    
    console.log(`📈 Performance improvement: ${improvement}%`);
  }
  
  // Test 2: Multiple Cached Calls
  console.log('\n📊 Test 2: 10 Rapid Cached Calls');
  console.log('--------------------------------');
  
  const startBatch = Date.now();
  const promises = [];
  
  for (let i = 0; i < 10; i++) {
    promises.push(
      fetch(`${API_BASE}/summary`)
        .then(res => res.json())
    );
  }
  
  await Promise.all(promises);
  const batchTime = Date.now() - startBatch;
  
  console.log(`✅ 10 cached calls completed in: ${batchTime}ms`);
  console.log(`📊 Average per call: ${(batchTime / 10).toFixed(1)}ms`);
  
  // Test 3: Cache Stats
  console.log('\n📊 Test 3: Cache Statistics');
  console.log('--------------------------------');
  
  try {
    const statsResponse = await fetch(`${API_BASE}/cache-stats`);
    if (statsResponse.ok) {
      const stats = await statsResponse.json();
      console.log('Cache Stats:', stats);
      console.log(`✅ Hit Rate: ${(stats.hitRate * 100).toFixed(1)}%`);
      console.log(`✅ Cache Size: ${stats.size} entries`);
      console.log(`✅ Hits: ${stats.hits}, Misses: ${stats.misses}`);
    }
  } catch (error) {
    console.log('⚠️ Cache stats endpoint not available');
  }
  
  // Summary Report
  console.log('\n================================');
  console.log('📊 PERFORMANCE TEST SUMMARY');
  console.log('================================\n');
  
  if (results.length > 0) {
    console.table(results);
    
    const avgImprovement = results.reduce((sum, r) => 
      sum + parseFloat(r.improvement), 0) / results.length;
    
    console.log(`\n🎯 Average Performance Improvement: ${avgImprovement.toFixed(1)}%`);
    
    if (avgImprovement > 80) {
      console.log('✅ EXCELLENT: Cache is working very effectively!');
    } else if (avgImprovement > 50) {
      console.log('✅ GOOD: Cache is providing significant performance gains');
    } else if (avgImprovement > 20) {
      console.log('⚠️ MODERATE: Cache is helping but could be optimized');
    } else {
      console.log('❌ POOR: Cache is not providing expected benefits');
    }
  }
  
  // Test cache invalidation
  console.log('\n📊 Test 4: Cache Invalidation');
  console.log('--------------------------------');
  console.log('Creating a new asset to trigger cache clear...');
  
  const createResponse = await fetch(`${API_BASE}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      assetTag: `TEST-CACHE-${Date.now()}`,
      name: 'Cache Test Asset',
      status: 'ACTIVE',
      condition: 'GOOD'
    })
  });
  
  if (createResponse.ok) {
    console.log('✅ Asset created - cache should be cleared');
    
    // Check if cache was cleared
    const afterCreate = await measureApiCall(
      `${API_BASE}/summary`,
      'After cache clear (should be slow again)'
    );
    
    if (afterCreate > summarySecond * 2) {
      console.log('✅ Cache invalidation working correctly');
    } else {
      console.log('⚠️ Cache may not have been cleared properly');
    }
  }
  
  console.log('\n================================');
  console.log('✅ Performance test completed!');
  console.log('================================\n');
}

// Run the test
testCachePerformance().catch(console.error);