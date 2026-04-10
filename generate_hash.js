const bcrypt = require('bcryptjs'); // Using bcryptjs if bcrypt not available
const password = 'nada2025';
const saltRounds = 12;

bcrypt.hash(password, saltRounds).then(hash => {
  console.log('--- PASSWORD HASH START ---');
  console.log(hash);
  console.log('--- PASSWORD HASH END ---');
}).catch(err => {
  // If bcryptjs not found, try generating it manually if possible or just use a standard hash
  console.error(err);
});
