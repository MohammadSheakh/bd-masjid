import { PrismaClient, UserRole, MosqueOperationalStatus, MosqueVerificationStatus, AttendanceStatus } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';

dotenv.config();

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL is not defined in .env file');
}

const adapter = new PrismaPg({ connectionString: databaseUrl });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Starting BD Masjid database seed...');

  // 1. Seed Admin User
  const adminEmail = (process.env.ADMIN_EMAIL?.trim() || 'mohammad.sheakh01@gmail.com').toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD || 'AdminPass123!';
  const adminName = process.env.ADMIN_NAME?.trim() || 'Mohammad Sheakh (Admin)';
  const hashedAdminPassword = await bcrypt.hash(adminPassword, 12);

  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      name: adminName,
      password: hashedAdminPassword,
      role: UserRole.admin,
      isDeleted: false,
    },
    create: {
      name: adminName,
      email: adminEmail,
      password: hashedAdminPassword,
      role: UserRole.admin,
      isEmailVerified: true,
    },
  });
  console.log(`✅ Admin user seeded: ${adminUser.email}`);

  // 2. Seed Community User
  const userEmail = 'community@bdmasjid.com';
  const hashedUserPassword = await bcrypt.hash('UserPass123!', 12);
  const communityUser = await prisma.user.upsert({
    where: { email: userEmail },
    update: { role: UserRole.user },
    create: {
      name: 'Tanvir Ahmed',
      email: userEmail,
      password: hashedUserPassword,
      role: UserRole.user,
      isEmailVerified: true,
    },
  });
  console.log(`✅ Community test user seeded: ${communityUser.email}`);

  // 3. Seed Realistic Mosques across Bangladesh
  const mosquesData = [
    {
      name: 'Baitul Mukarram National Mosque',
      latitude: 23.7289,
      longitude: 90.4125,
      address: 'Topkhana Road, Paltan',
      landmark: 'Opposite to Stadium Gate',
      city: 'Dhaka',
      country: 'Bangladesh',
      operationalStatus: MosqueOperationalStatus.OPEN,
      verificationStatus: MosqueVerificationStatus.VERIFIED,
      schedule: {
        fajrStart: '04:45',
        fajrJamaat: '05:15',
        sunrise: '06:02',
        zuhrStart: '12:05',
        zuhrJamaat: '13:30',
        asrStart: '16:15',
        asrJamaat: '16:45',
        maghribStart: '18:10',
        maghribJamaat: '18:15',
        ishaStart: '19:25',
        ishaJamaat: '20:00',
        jumuahJamaat: '13:30',
      },
    },
    {
      name: 'Star Mosque (Tara Masjid)',
      latitude: 23.7153,
      longitude: 90.4017,
      address: 'Armanitola, Old Dhaka',
      landmark: 'Near Armanitola School',
      city: 'Dhaka',
      country: 'Bangladesh',
      operationalStatus: MosqueOperationalStatus.OPEN,
      verificationStatus: MosqueVerificationStatus.VERIFIED,
      schedule: {
        fajrStart: '04:45',
        fajrJamaat: '05:15',
        sunrise: '06:03',
        zuhrStart: '12:05',
        zuhrJamaat: '13:15',
        asrStart: '16:15',
        asrJamaat: '16:40',
        maghribStart: '18:10',
        maghribJamaat: '18:15',
        ishaStart: '19:25',
        ishaJamaat: '19:50',
        jumuahJamaat: '13:30',
      },
    },
    {
      name: 'Gulshan Society Jame Masjid',
      latitude: 23.7925,
      longitude: 90.4172,
      address: 'Road 63, Gulshan-2',
      landmark: 'Beside Gulshan Central Park',
      city: 'Dhaka',
      country: 'Bangladesh',
      operationalStatus: MosqueOperationalStatus.OPEN,
      verificationStatus: MosqueVerificationStatus.VERIFIED,
      schedule: {
        fajrStart: '04:45',
        fajrJamaat: '05:20',
        sunrise: '06:02',
        zuhrStart: '12:05',
        zuhrJamaat: '13:30',
        asrStart: '16:15',
        asrJamaat: '16:45',
        maghribStart: '18:10',
        maghribJamaat: '18:16',
        ishaStart: '19:25',
        ishaJamaat: '20:15',
        jumuahJamaat: '13:30',
      },
    },
    {
      name: 'Dhanmondi Shahi Eidgah & Jame Masjid',
      latitude: 23.7461,
      longitude: 90.3742,
      address: 'Road 7, Dhanmondi',
      landmark: 'Near Dhanmondi Lake & Rabindra Sarobar',
      city: 'Dhaka',
      country: 'Bangladesh',
      operationalStatus: MosqueOperationalStatus.OPEN,
      verificationStatus: MosqueVerificationStatus.VERIFIED,
      schedule: {
        fajrStart: '04:45',
        fajrJamaat: '05:15',
        sunrise: '06:03',
        zuhrStart: '12:05',
        zuhrJamaat: '13:20',
        asrStart: '16:15',
        asrJamaat: '16:45',
        maghribStart: '18:10',
        maghribJamaat: '18:15',
        ishaStart: '19:25',
        ishaJamaat: '20:00',
        jumuahJamaat: '13:30',
      },
    },
    {
      name: 'Lalbagh Fort Mosque',
      latitude: 23.7188,
      longitude: 90.3881,
      address: 'Lalbagh Road, Old Dhaka',
      landmark: 'Inside Lalbagh Fort Complex',
      city: 'Dhaka',
      country: 'Bangladesh',
      operationalStatus: MosqueOperationalStatus.OPEN,
      verificationStatus: MosqueVerificationStatus.VERIFIED,
      schedule: {
        fajrStart: '04:45',
        fajrJamaat: '05:15',
        sunrise: '06:03',
        zuhrStart: '12:05',
        zuhrJamaat: '13:15',
        asrStart: '16:15',
        asrJamaat: '16:35',
        maghribStart: '18:10',
        maghribJamaat: '18:15',
        ishaStart: '19:25',
        ishaJamaat: '19:50',
        jumuahJamaat: '13:30',
      },
    },
    {
      name: 'Hazrat Shah Jalal Dargah Jame Masjid',
      latitude: 24.8998,
      longitude: 91.8687,
      address: 'Dargah Gate, Chowhatta',
      landmark: 'Shah Jalal Mazar Sharif',
      city: 'Sylhet',
      country: 'Bangladesh',
      operationalStatus: MosqueOperationalStatus.OPEN,
      verificationStatus: MosqueVerificationStatus.VERIFIED,
      schedule: {
        fajrStart: '04:40',
        fajrJamaat: '05:10',
        sunrise: '05:58',
        zuhrStart: '12:00',
        zuhrJamaat: '13:30',
        asrStart: '16:10',
        asrJamaat: '16:40',
        maghribStart: '18:05',
        maghribJamaat: '18:10',
        ishaStart: '19:20',
        ishaJamaat: '20:00',
        jumuahJamaat: '13:30',
      },
    },
    {
      name: 'Andar Killa Shahi Jame Masjid',
      latitude: 22.3382,
      longitude: 91.8375,
      address: 'Andarkilla, Kotwali',
      landmark: 'Top of Andarkilla Hill',
      city: 'Chattogram',
      country: 'Bangladesh',
      operationalStatus: MosqueOperationalStatus.OPEN,
      verificationStatus: MosqueVerificationStatus.VERIFIED,
      schedule: {
        fajrStart: '04:42',
        fajrJamaat: '05:15',
        sunrise: '06:00',
        zuhrStart: '12:02',
        zuhrJamaat: '13:15',
        asrStart: '16:12',
        asrJamaat: '16:45',
        maghribStart: '18:08',
        maghribJamaat: '18:12',
        ishaStart: '19:22',
        ishaJamaat: '20:00',
        jumuahJamaat: '13:30',
      },
    },
    {
      name: 'Baitul Aman Central Mosque',
      latitude: 23.7554,
      longitude: 90.3621,
      address: 'Ring Road, Mohammadpur',
      landmark: 'Near Adabor Police Station',
      city: 'Dhaka',
      country: 'Bangladesh',
      operationalStatus: MosqueOperationalStatus.OPEN,
      verificationStatus: MosqueVerificationStatus.PENDING_VERIFICATION,
      schedule: {
        fajrStart: '04:45',
        fajrJamaat: '05:15',
        sunrise: '06:03',
        zuhrStart: '12:05',
        zuhrJamaat: '13:30',
        asrStart: '16:15',
        asrJamaat: '16:45',
        maghribStart: '18:10',
        maghribJamaat: '18:15',
        ishaStart: '19:25',
        ishaJamaat: '20:00',
        jumuahJamaat: '13:30',
      },
    },
  ];

  for (const m of mosquesData) {
    const { schedule, ...mosqueFields } = m;

    // Check if mosque already exists by name
    const existing = await prisma.mosque.findFirst({
      where: { name: mosqueFields.name },
    });

    let mosqueId = existing?.id;
    if (!existing) {
      const created = await prisma.mosque.create({
        data: {
          ...mosqueFields,
          createdById: adminUser.id,
        },
      });
      mosqueId = created.id;
      console.log(`  🕌 Created mosque: ${created.name}`);
    } else {
      console.log(`  🕌 Exists: ${existing.name}`);
    }

    if (mosqueId && schedule) {
      await prisma.prayerSchedule.upsert({
        where: { mosqueId },
        update: {
          ...schedule,
          updatedById: adminUser.id,
        },
        create: {
          mosqueId,
          ...schedule,
          timezone: 'Asia/Dhaka',
          updatedById: adminUser.id,
        },
      });
    }

    // Seed test attendance
    if (mosqueId) {
      await prisma.userMosqueAttendance.upsert({
        where: {
          userId_mosqueId: {
            userId: adminUser.id,
            mosqueId,
          },
        },
        update: { status: AttendanceStatus.REGULAR },
        create: {
          userId: adminUser.id,
          mosqueId,
          status: AttendanceStatus.REGULAR,
        },
      });
    }
  }

  console.log('✨ Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
