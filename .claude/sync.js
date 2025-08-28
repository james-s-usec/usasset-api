#!/usr/bin/env node

const { execSync } = require('child_process');

try {
  // Get staged files
  const files = execSync('git diff --cached --name-only', { encoding: 'utf8' })
    .trim()
    .split('\n')
    .filter(f => f);

  if (files.length === 0) {
    console.log('ℹ️  No changes to commit');
    process.exit(0);
  }

  console.log(`📝 Processing ${files.length} changed files...`);

  // Analyze changes
  const changes = { added: [], modified: [], deleted: [] };
  
  files.forEach(file => {
    try {
      const status = execSync(`git status --porcelain "${file}"`, { encoding: 'utf8' }).trim();
      
      if (status.startsWith('A') || status.startsWith('??')) {
        changes.added.push(file);
      } else if (status.startsWith('M') || status.startsWith(' M')) {
        changes.modified.push(file);
      } else if (status.startsWith('D')) {
        changes.deleted.push(file);
      }
    } catch (e) {
      // File might be renamed/moved, treat as modified
      changes.modified.push(file);
    }
  });

  // Generate commit message
  let msg = '';
  
  // Determine commit type
  if (changes.added.length > 0 && changes.modified.length === 0 && changes.deleted.length === 0) {
    msg = 'feat: ';
  } else if (changes.deleted.length > 0) {
    msg = 'refactor: ';
  } else if (changes.modified.length > 0) {
    msg = 'update: ';
  } else {
    msg = 'chore: ';
  }

  // Build description
  const descriptions = [];
  
  if (changes.added.length > 0) {
    const fileNames = changes.added
      .map(f => f.split('/').pop().replace(/\.[^.]+$/, ''))
      .join(', ');
    descriptions.push(`add ${fileNames}`);
  }
  
  if (changes.modified.length > 0) {
    const fileNames = changes.modified
      .map(f => f.split('/').pop().replace(/\.[^.]+$/, ''))
      .join(', ');
    descriptions.push(`update ${fileNames}`);
  }
  
  if (changes.deleted.length > 0) {
    const fileNames = changes.deleted
      .map(f => f.split('/').pop().replace(/\.[^.]+$/, ''))
      .join(', ');
    descriptions.push(`remove ${fileNames}`);
  }

  msg += descriptions.join(' and ');

  // Create full commit message
  const fullMessage = `${msg}

🤖 Generated with Claude Code

Co-Authored-By: Claude <noreply@anthropic.com>`;

  console.log(`📋 Commit message: ${msg}`);
  
  // Commit
  execSync(`git commit -m "${fullMessage}"`, { stdio: 'inherit' });
  
  console.log('✅ Changes committed successfully!');

} catch (error) {
  console.error('❌ Sync failed:', error.message);
  process.exit(1);
}