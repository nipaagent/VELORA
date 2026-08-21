const fs = require('fs');
let code = fs.readFileSync('src/components/AdminPage.tsx', 'utf8');

const s1 = `      await update(ref(db, \`user_list/\${editingUser.uid}\`), updates);`;
const s2 = `      showToast("ইউজার তথ্য আপডেট করা হয়েছে।");`;
let idx1 = code.indexOf(s1);
let idx2 = code.indexOf(s2, idx1);
if (idx1 !== -1 && idx2 !== -1) {
  code = code.substring(0, idx1 + s1.length) + 
`

      if (editingUser.username && editingUser.username !== cleanUsername) {
        await remove(ref(db, \`usernames/\${editingUser.username}\`));
      }
      if (cleanUsername) {
        await set(ref(db, \`usernames/\${cleanUsername}\`), editingUser.uid);
      }

` + code.substring(idx2);
}

const t1 = `      await update(ref(db, \`user_list/\${user.uid}\`), updates);`;
const t2 = "      showToast(`ইউজার ${isCurrentlyBanned ? 'আনব্যান' : 'ব্যান'} করা হয়েছে!`);";
let idxt1 = code.indexOf(t1);
let idxt2 = code.indexOf(t2, idxt1);
if (idxt1 !== -1 && idxt2 !== -1) {
  code = code.substring(0, idxt1 + t1.length) + "\n\n" + code.substring(idxt2);
}

const u1 = "        if (user.username) {\n          await remove(ref(db, `usernames/${user.username}`));\n        }";
const u2 = `        showToast("ফায়ারবেস থেকে ইউজার ১০০% সফলভাবে ডিলিট করা হয়েছে!");`;
let idxu1 = code.indexOf(u1);
let idxu2 = code.indexOf(u2, idxu1);
if (idxu1 !== -1 && idxu2 !== -1) {
  code = code.substring(0, idxu1 + u1.length) + "\n\n" + code.substring(idxu2);
}

const v1 = `      await set(ref(db, \`usernames/\${cleanUsername}\`), generatedUid);`;
const v2 = `      showToast("ফায়ারবেসে নতুন ইউজার ১০০% সফলভাবে তৈরি করা হয়েছে!");`;
let idxv1 = code.indexOf(v1);
let idxv2 = code.indexOf(v2, idxv1);
if (idxv1 !== -1 && idxv2 !== -1) {
  code = code.substring(0, idxv1 + v1.length) + "\n\n" + code.substring(idxv2);
}

fs.writeFileSync('src/components/AdminPage.tsx', code);
