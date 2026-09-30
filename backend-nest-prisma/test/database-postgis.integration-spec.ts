import { Test, TestingModule } from '@nestjs/testing';
import { PrismaModule, PrismaService } from '@app/database';
import { ConfigModule } from '@nestjs/config';

describe('PostgreSQL / PostGIS Database Integration Tests', () => {
  let prisma: PrismaService;
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: ['.env.test', '.env'],
        }),
        PrismaModule,
      ],
    }).compile();

    prisma = module.get<PrismaService>(PrismaService);
    await prisma.$connect();
  });

  afterAll(async () => {
    if (prisma) {
      await prisma.$disconnect();
    }
    if (module) {
      await module.close();
    }
  });

  it('1. PostGIS extension is installed and operational', async () => {
    const result = await prisma.$queryRaw<Array<{ postgis_version: string }>>`
      SELECT PostGIS_Version() as postgis_version;
    `;
    expect(result).toBeDefined();
    expect(result.length).toBeGreaterThan(0);
    expect(result[0].postgis_version).toBeDefined();
  });

  it('2. Spherical geography distance calculations return correct metric values', async () => {
    // Distance between Baitul Mukarram (23.7297, 90.4125) and Gulshan Mosque (23.7925, 90.4172) ~ 6.98 km
    const result = await prisma.$queryRaw<Array<{ distance_meters: number }>>`
      SELECT ROUND(
        ST_Distance(
          ST_SetSRID(ST_MakePoint(90.4125, 23.7297), 4326)::geography,
          ST_SetSRID(ST_MakePoint(90.4172, 23.7925), 4326)::geography
        )::numeric, 1
      )::double precision AS distance_meters;
    `;

    expect(result[0].distance_meters).toBeGreaterThan(6800);
    expect(result[0].distance_meters).toBeLessThan(7200);
  });

  it('3. ST_DWithin radial containment filter correctly isolates locations within radius', async () => {
    const within5km = await prisma.$queryRaw<Array<{ is_within: boolean }>>`
      SELECT ST_DWithin(
        ST_SetSRID(ST_MakePoint(90.4125, 23.7297), 4326)::geography,
        ST_SetSRID(ST_MakePoint(90.4172, 23.7925), 4326)::geography,
        5000
      ) AS is_within;
    `;
    expect(within5km[0].is_within).toBe(false);

    const within10km = await prisma.$queryRaw<Array<{ is_within: boolean }>>`
      SELECT ST_DWithin(
        ST_SetSRID(ST_MakePoint(90.4125, 23.7297), 4326)::geography,
        ST_SetSRID(ST_MakePoint(90.4172, 23.7925), 4326)::geography,
        10000
      ) AS is_within;
    `;
    expect(within10km[0].is_within).toBe(true);
  });

  it('4. Atomic transaction boundary rolls back completely upon error', async () => {
    const testMosqueName = `Rollback Test Mosque ${Date.now()}`;

    await expect(
      prisma.$transaction(async (tx) => {
        await tx.mosque.create({
          data: {
            name: testMosqueName,
            latitude: 23.7777,
            longitude: 90.3999,
            operationalStatus: 'OPEN',
            verificationStatus: 'UNVERIFIED',
          },
        });

        // Intentional failure inside transaction
        throw new Error('SIMULATED_TRANSACTION_FAILURE');
      }),
    ).rejects.toThrow('SIMULATED_TRANSACTION_FAILURE');

    // Verify record was rolled back and does not exist
    const persisted = await prisma.mosque.findFirst({
      where: { name: testMosqueName },
    });
    expect(persisted).toBeNull();
  });
});
