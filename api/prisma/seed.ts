import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seeding...')

  // Seed Vehicle Categories
  console.log('📦 Seeding vehicle categories...')
  const vehicleCategories = [
    {
      code: 'CAR',
      name: 'Легковой автомобиль',
      description: 'Обычные легковые автомобили'
    },
    {
      code: 'VAN',
      name: 'Микроавтобус/Фургон',
      description: 'Микроавтобусы и фургоны'
    },
    {
      code: 'TRUCK_SMALL',
      name: 'Грузовик до 3.5т',
      description: 'Малые грузовые автомобили'
    },
    {
      code: 'TRUCK_MEDIUM',
      name: 'Грузовик 3.5-10т',
      description: 'Средние грузовые автомобили'
    },
    {
      code: 'TRUCK_LARGE',
      name: 'Грузовик 10т+',
      description: 'Большие грузовые автомобили'
    },
    {
      code: 'SPECIAL',
      name: 'Спецтехника',
      description: 'Специальная техника'
    }
  ]

  for (const category of vehicleCategories) {
    await prisma.vehicleCategory.upsert({
      where: { code: category.code },
      update: {},
      create: category
    })
  }

  // Seed Regions (основные регионы России)
  console.log('🗺️ Seeding regions...')
  const regions = [
    {
      code: '77',
      name: 'Москва',
      level: 1,
      customerTariff: 70,
      performerTariff: 300,
      optimalTariff: 200
    },
    {
      code: '78',
      name: 'Санкт-Петербург',
      level: 1,
      customerTariff: 70,
      performerTariff: 280,
      optimalTariff: 190
    },
    {
      code: '33',
      name: 'Владимирская область',
      level: 1,
      customerTariff: 70,
      performerTariff: 250,
      optimalTariff: 170
    },
    {
      code: '23',
      name: 'Краснодарский край',
      level: 1,
      customerTariff: 70,
      performerTariff: 350,
      optimalTariff: 220
    },
    {
      code: '50',
      name: 'Московская область',
      level: 1,
      customerTariff: 70,
      performerTariff: 270,
      optimalTariff: 180
    },
    {
      code: '47',
      name: 'Ленинградская область',
      level: 1,
      customerTariff: 70,
      performerTariff: 260,
      optimalTariff: 175
    },
    {
      code: '61',
      name: 'Ростовская область',
      level: 1,
      customerTariff: 70,
      performerTariff: 240,
      optimalTariff: 165
    },
    {
      code: '63',
      name: 'Самарская область',
      level: 1,
      customerTariff: 70,
      performerTariff: 230,
      optimalTariff: 160
    },
    {
      code: '66',
      name: 'Свердловская область',
      level: 1,
      customerTariff: 70,
      performerTariff: 220,
      optimalTariff: 155
    },
    {
      code: '74',
      name: 'Челябинская область',
      level: 1,
      customerTariff: 70,
      performerTariff: 210,
      optimalTariff: 150
    }
  ]

  for (const region of regions) {
    await prisma.region.upsert({
      where: { code: region.code },
      update: {},
      create: region
    })
  }

  // Seed some subregions for Moscow
  console.log('🏙️ Seeding Moscow subregions...')
  const moscowSubregions = [
    {
      code: '77_01',
      name: 'Центральный округ',
      parentCode: '77',
      level: 2,
      customerTariff: 70,
      performerTariff: 300,
      optimalTariff: 200
    },
    {
      code: '77_02',
      name: 'Северный округ',
      parentCode: '77',
      level: 2,
      customerTariff: 70,
      performerTariff: 300,
      optimalTariff: 200
    },
    {
      code: '77_03',
      name: 'Северо-Восточный округ',
      parentCode: '77',
      level: 2,
      customerTariff: 70,
      performerTariff: 300,
      optimalTariff: 200
    },
    {
      code: '77_04',
      name: 'Восточный округ',
      parentCode: '77',
      level: 2,
      customerTariff: 70,
      performerTariff: 300,
      optimalTariff: 200
    },
    {
      code: '77_05',
      name: 'Юго-Восточный округ',
      parentCode: '77',
      level: 2,
      customerTariff: 70,
      performerTariff: 300,
      optimalTariff: 200
    }
  ]

  for (const subregion of moscowSubregions) {
    await prisma.region.upsert({
      where: { code: subregion.code },
      update: {},
      create: subregion
    })
  }

  // Seed System Settings
  console.log('⚙️ Seeding system settings...')
  const systemSettings = [
    {
      key: 'APP_VERSION',
      value: '1.0.0',
      description: 'Current application version'
    },
    {
      key: 'MAINTENANCE_MODE',
      value: 'false',
      description: 'Maintenance mode flag'
    },
    {
      key: 'DEFAULT_CUSTOMER_TARIFF',
      value: '70',
      description: 'Default tariff for customers'
    },
    {
      key: 'DEFAULT_PERFORMER_TARIFF',
      value: '200',
      description: 'Default tariff for performers'
    },
    {
      key: 'MAX_ORDERS_PER_USER',
      value: '5',
      description: 'Maximum active orders per user'
    },
    {
      key: 'SESSION_TTL_HOURS',
      value: '24',
      description: 'Session TTL in hours'
    },
    {
      key: 'NOTIFICATION_QUEUE_SIZE',
      value: '1000',
      description: 'Maximum notification queue size'
    }
  ]

  for (const setting of systemSettings) {
    await prisma.systemSetting.upsert({
      where: { key: setting.key },
      update: { value: setting.value },
      create: setting
    })
  }

  console.log('✅ Database seeding completed successfully!')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('❌ Error during seeding:', e)
    await prisma.$disconnect()
    process.exit(1)
  }) 