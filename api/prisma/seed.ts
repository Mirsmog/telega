import { PrismaClient, RoleType, TariffType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Create regions with tariffs
  console.log('Creating regions...');
  const regions = await Promise.all([
    prisma.region.upsert({
      where: { code: 'MSK' },
      update: {},
      create: {
        name: 'Москва',
        code: 'MSK',
        oneTimeTariff: 350.00,
        optimalTariff: 2500.00,
      },
    }),
    prisma.region.upsert({
      where: { code: 'SPB' },
      update: {},
      create: {
        name: 'Санкт-Петербург',
        code: 'SPB',
        oneTimeTariff: 300.00,
        optimalTariff: 2200.00,
      },
    }),
    prisma.region.upsert({
      where: { code: 'EKB' },
      update: {},
      create: {
        name: 'Екатеринбург',
        code: 'EKB',
        oneTimeTariff: 250.00,
        optimalTariff: 1800.00,
      },
    }),
    prisma.region.upsert({
      where: { code: 'NSK' },
      update: {},
      create: {
        name: 'Новосибирск',
        code: 'NSK',
        oneTimeTariff: 230.00,
        optimalTariff: 1600.00,
      },
    }),
    prisma.region.upsert({
      where: { code: 'KZN' },
      update: {},
      create: {
        name: 'Казань',
        code: 'KZN',
        oneTimeTariff: 220.00,
        optimalTariff: 1500.00,
      },
    }),
    prisma.region.upsert({
      where: { code: 'RND' },
      update: {},
      create: {
        name: 'Ростов-на-Дону',
        code: 'RND',
        oneTimeTariff: 200.00,
        optimalTariff: 1400.00,
      },
    }),
  ]);

  console.log(`✅ Created ${regions.length} regions`);

  // Create vehicle categories, types, and subtypes
  console.log('Creating vehicle catalog...');

  // Легковые автомобили
  const carCategory = await prisma.vehicleCategory.upsert({
    where: { name: 'Легковые автомобили' },
    update: {},
    create: {
      name: 'Легковые автомобили',
      description: 'Легковые автомобили для перевозки людей',
    },
  });

  const carType = await prisma.vehicleType.upsert({
    where: { categoryId_name: { categoryId: carCategory.id, name: 'Стандарт' } },
    update: {},
    create: {
      categoryId: carCategory.id,
      name: 'Стандарт',
      description: 'Обычные легковые автомобили',
    },
  });

  await Promise.all([
    prisma.vehicleSubtype.upsert({
      where: { typeId_name: { typeId: carType.id, name: 'Седан' } },
      update: {},
      create: {
        typeId: carType.id,
        name: 'Седан',
        description: 'Седан (4 места)',
      },
    }),
    prisma.vehicleSubtype.upsert({
      where: { typeId_name: { typeId: carType.id, name: 'Универсал' } },
      update: {},
      create: {
        typeId: carType.id,
        name: 'Универсал',
        description: 'Универсал (5 мест)',
      },
    }),
    prisma.vehicleSubtype.upsert({
      where: { typeId_name: { typeId: carType.id, name: 'Минивэн' } },
      update: {},
      create: {
        typeId: carType.id,
        name: 'Минивэн',
        description: 'Минивэн (7-8 мест)',
      },
    }),
  ]);

  // Грузовые автомобили
  const truckCategory = await prisma.vehicleCategory.upsert({
    where: { name: 'Грузовые автомобили' },
    update: {},
    create: {
      name: 'Грузовые автомобили',
      description: 'Грузовые автомобили для перевозки грузов',
    },
  });

  const lightTruckType = await prisma.vehicleType.upsert({
    where: { categoryId_name: { categoryId: truckCategory.id, name: 'Легкие грузовики' } },
    update: {},
    create: {
      categoryId: truckCategory.id,
      name: 'Легкие грузовики',
      description: 'Грузовики до 3.5 тонн',
    },
  });

  const mediumTruckType = await prisma.vehicleType.upsert({
    where: { categoryId_name: { categoryId: truckCategory.id, name: 'Средние грузовики' } },
    update: {},
    create: {
      categoryId: truckCategory.id,
      name: 'Средние грузовики',
      description: 'Грузовики от 3.5 до 12 тонн',
    },
  });

  await Promise.all([
    // Легкие грузовики
    prisma.vehicleSubtype.upsert({
      where: { typeId_name: { typeId: lightTruckType.id, name: 'Газель' } },
      update: {},
      create: {
        typeId: lightTruckType.id,
        name: 'Газель',
        description: 'ГАЗель и аналоги (до 1.5 тонн)',
      },
    }),
    prisma.vehicleSubtype.upsert({
      where: { typeId_name: { typeId: lightTruckType.id, name: 'Бычок' } },
      update: {},
      create: {
        typeId: lightTruckType.id,
        name: 'Бычок',
        description: 'Малый грузовик (до 3 тонн)',
      },
    }),
    // Средние грузовики
    prisma.vehicleSubtype.upsert({
      where: { typeId_name: { typeId: mediumTruckType.id, name: 'Средний грузовик' } },
      update: {},
      create: {
        typeId: mediumTruckType.id,
        name: 'Средний грузовик',
        description: 'Грузовик 5-10 тонн',
      },
    }),
    prisma.vehicleSubtype.upsert({
      where: { typeId_name: { typeId: mediumTruckType.id, name: 'Рефрижератор' } },
      update: {},
      create: {
        typeId: mediumTruckType.id,
        name: 'Рефрижератор',
        description: 'Грузовик с холодильной установкой',
      },
    }),
  ]);

  // Специальная техника
  const specialCategory = await prisma.vehicleCategory.upsert({
    where: { name: 'Специальная техника' },
    update: {},
    create: {
      name: 'Специальная техника',
      description: 'Специализированная техника',
    },
  });

  const specialType = await prisma.vehicleType.upsert({
    where: { categoryId_name: { categoryId: specialCategory.id, name: 'Погрузочная техника' } },
    update: {},
    create: {
      categoryId: specialCategory.id,
      name: 'Погрузочная техника',
      description: 'Техника для погрузо-разгрузочных работ',
    },
  });

  await Promise.all([
    prisma.vehicleSubtype.upsert({
      where: { typeId_name: { typeId: specialType.id, name: 'Кран' } },
      update: {},
      create: {
        typeId: specialType.id,
        name: 'Кран',
        description: 'Автокран различной грузоподъемности',
      },
    }),
    prisma.vehicleSubtype.upsert({
      where: { typeId_name: { typeId: specialType.id, name: 'Эвакуатор' } },
      update: {},
      create: {
        typeId: specialType.id,
        name: 'Эвакуатор',
        description: 'Эвакуатор для перевозки автомобилей',
      },
    }),
  ]);

  console.log('✅ Created vehicle catalog');

  // Create admin user
  console.log('Creating admin user...');
  const adminUser = await prisma.user.upsert({
    where: { telegramId: BigInt(123456789) },
    update: {},
    create: {
      telegramId: BigInt(123456789),
      username: 'admin',
      firstName: 'System',
      lastName: 'Administrator',
      role: RoleType.ADMIN,
      referralCode: 'ADMIN001',
      balance: 0,
      frozenBalance: 0,
    },
  });

  console.log(`✅ Created admin user: ${adminUser.firstName} ${adminUser.lastName}`);

  // Create test customer
  console.log('Creating test customer...');
  const customerUser = await prisma.user.upsert({
    where: { telegramId: BigInt(987654321) },
    update: {},
    create: {
      telegramId: BigInt(987654321),
      username: 'testcustomer',
      firstName: 'Тест',
      lastName: 'Заказчик',
      role: RoleType.CUSTOMER,
      referralCode: 'CUST001',
      balance: 1000.00,
      frozenBalance: 0,
    },
  });

  console.log(`✅ Created test customer: ${customerUser.firstName} ${customerUser.lastName}`);

  // Create test executor
  console.log('Creating test executor...');
  const executorUser = await prisma.user.upsert({
    where: { telegramId: BigInt(456789123) },
    update: {},
    create: {
      telegramId: BigInt(456789123),
      username: 'testexecutor',
      firstName: 'Тест',
      lastName: 'Исполнитель',
      role: RoleType.EXECUTOR,
      referralCode: 'EXEC001',
      balance: 500.00,
      frozenBalance: 0,
    },
  });

  // Add test executor to Moscow region
  await prisma.userRegion.upsert({
    where: { userId_regionId: { userId: executorUser.id, regionId: regions[0].id } },
    update: {},
    create: {
      userId: executorUser.id,
      regionId: regions[0].id,
      tariffType: TariffType.OPTIMAL,
      paidUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    },
  });

  console.log(`✅ Created test executor: ${executorUser.firstName} ${executorUser.lastName}`);

  // Create some basic configuration
  console.log('Creating basic configuration...');
  await Promise.all([
    prisma.config.upsert({
      where: { key: 'ORDER_PLACEMENT_FEE' },
      update: {},
      create: {
        key: 'ORDER_PLACEMENT_FEE',
        value: '70.00',
        description: 'Стоимость размещения заказа для заказчиков',
      },
    }),
    prisma.config.upsert({
      where: { key: 'REFERRAL_BONUS' },
      update: {},
      create: {
        key: 'REFERRAL_BONUS',
        value: '50.00',
        description: 'Бонус за приведенного пользователя',
      },
    }),
    prisma.config.upsert({
      where: { key: 'MIN_WITHDRAWAL_AMOUNT' },
      update: {},
      create: {
        key: 'MIN_WITHDRAWAL_AMOUNT',
        value: '100.00',
        description: 'Минимальная сумма для вывода средств',
      },
    }),
    prisma.config.upsert({
      where: { key: 'SYSTEM_COMMISSION' },
      update: {},
      create: {
        key: 'SYSTEM_COMMISSION',
        value: '5.00',
        description: 'Комиссия системы в процентах',
      },
    }),
  ]);

  console.log('✅ Created basic configuration');

  console.log('🎉 Seed completed successfully!');
}

main()
  .catch(e => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 