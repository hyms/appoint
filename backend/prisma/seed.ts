import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import { PrismaClient } from '../node_modules/.prisma/client/client'

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/appointments360?schema=public'
const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('🌱 Seeding database...')

  const adminEmail = 'admin@appointments360.com'
  const adminExists = await prisma.user.findUnique({ where: { email: adminEmail } })

  if (!adminExists) {
    const admin = await prisma.user.create({
      data: {
        email: adminEmail,
        phone: '+1234567890',
        role: 'ADMIN',
        profile: {
          create: {
            firstName: 'System',
            lastName: 'Administrator',
            dni: '00000000A',
          },
        },
      },
    })
    console.log('✅ Admin user created:', admin.email)
  }

  const professionalEmail = 'doctor@appointments360.com'
  const professionalExists = await prisma.user.findUnique({ where: { email: professionalEmail } })

  if (!professionalExists) {
    const professional = await prisma.user.create({
      data: {
        email: professionalEmail,
        phone: '+1234567891',
        role: 'PROFESSIONAL',
        profile: {
          create: {
            firstName: 'John',
            lastName: 'Doe',
            dni: '12345678B',
            medicalNotes: 'General practitioner',
          },
        },
      },
    })
    console.log('✅ Professional user created:', professional.email)
  }

  const location = await prisma.location.upsert({
    where: { id: 'main-clinic-001' },
    update: {},
    create: {
      id: 'main-clinic-001',
      name: 'Main Clinic',
      address: '123 Medical Street, Health City',
      phone: '+1234567892',
      isActive: true,
    },
  })
  console.log('✅ Location created:', location.name)

  const emergencyButton = await prisma.emergencyButton.upsert({
    where: { id: 'default-emergency' },
    update: {},
    create: {
      id: 'default-emergency',
      isActive: false,
      affectedDays: 2,
      message: 'Due to emergency circumstances, please contact us for rescheduling.',
    },
  })
  console.log('✅ Emergency button configured')

  console.log('🎉 Seeding completed!')
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
