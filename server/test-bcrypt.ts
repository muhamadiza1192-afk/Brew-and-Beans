import bcrypt from 'bcrypt'

async function testBcrypt() {
  const password = 'kopi12345'

  const hashedPassword = await bcrypt.hash(password, 10)

  const isMatch = await bcrypt.compare(password, hashedPassword)

  console.log('Password berhasil di-hash:', Boolean(hashedPassword))
  console.log('Password cocok:', isMatch)
}

testBcrypt()