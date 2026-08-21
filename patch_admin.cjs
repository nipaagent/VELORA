const fs = require('fs');
let code = fs.readFileSync('src/components/AdminPage.tsx', 'utf8');

// 1. Patch handleSaveEdit
code = code.replace(
/      await update\(ref\(db, \`user_list\/\$\{editingUser\.uid\}\`\), updates\);\s*\/\/ 2\. Server API sync[\s\S]*?showToast\("ইউজার তথ্য আপডেট করা হয়েছে\。"\);/m,
`      await update(ref(db, \`user_list/\${editingUser.uid}\`), updates);

      if (editingUser.username && editingUser.username !== cleanUsername) {
        await remove(ref(db, \`usernames/\${editingUser.username}\`));
      }
      if (cleanUsername) {
        await set(ref(db, \`usernames/\${cleanUsername}\`), editingUser.uid);
      }

      showToast("ইউজার তথ্য আপডেট করা হয়েছে।");`
);

// 2. Patch handleToggleBan
code = code.replace(
/        await update\(ref\(db, \`user_list\/\$\{user\.uid\}\`\), updates\);\s*\/\/ Server API update[\s\S]*?showToast\(\`ইউজার \$\{isCurrentlyBanned \? 'আনব্যান' : 'ব্যান'\} করা হয়েছে\!\`\);/m,
`        await update(ref(db, \`user_list/\${user.uid}\`), updates);

        showToast(\`ইউজার \${isCurrentlyBanned ? 'আনব্যান' : 'ব্যান'} করা হয়েছে!\`);`
);

// 3. Patch handleDeleteUser
code = code.replace(
/        if \(user\.username\) \{\s*await remove\(ref\(db, \`usernames\/\$\{user\.username\}\`\)\);\s*\}\s*const currentUser = auth\.currentUser;[\s\S]*?showToast\("ফায়ারবেস থেকে ইউজার ১০০% সফলভাবে ডিলিট করা হয়েছে\!"\);/m,
`        if (user.username) {
          await remove(ref(db, \`usernames/\${user.username}\`));
        }

        showToast("ফায়ারবেস থেকে ইউজার ১০০% সফলভাবে ডিলিট করা হয়েছে!");`
);

// 4. Patch handleCreateUser
code = code.replace(
/      await set\(ref\(db, \`usernames\/\$\{cleanUsername\}\`\), generatedUid\);\s*\/\/ Server API sync[\s\S]*?showToast\("ফায়ারবেসে নতুন ইউজার ১০০% সফলভাবে তৈরি করা হয়েছে\!"\);/m,
`      await set(ref(db, \`usernames/\${cleanUsername}\`), generatedUid);

      showToast("ফায়ারবেসে নতুন ইউজার ১০০% সফলভাবে তৈরি করা হয়েছে!");`
);

fs.writeFileSync('src/components/AdminPage.tsx', code);
