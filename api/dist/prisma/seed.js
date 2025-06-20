"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('🌱 Starting seed...');
    console.log('Creating regions...');
    const regions = await Promise.all([
        prisma.region.upsert({
            where: { code: 'MSK' },
            update: {},
            create: {
                name: 'Москва',
                code: 'MSK',
                regionCode: '01',
                oneTimePlanPrice: 350.00,
                monthlyPlanPrice: 2500.00,
            },
        }),
        prisma.region.upsert({
            where: { code: 'SPB' },
            update: {},
            create: {
                name: 'Санкт-Петербург',
                code: 'SPB',
                regionCode: '02',
                oneTimePlanPrice: 300.00,
                monthlyPlanPrice: 2200.00,
            },
        }),
        prisma.region.upsert({
            where: { code: 'EKB' },
            update: {},
            create: {
                name: 'Екатеринбург',
                code: 'EKB',
                regionCode: '03',
                oneTimePlanPrice: 250.00,
                monthlyPlanPrice: 1800.00,
            },
        }),
        prisma.region.upsert({
            where: { code: 'NSK' },
            update: {},
            create: {
                name: 'Новосибирск',
                code: 'NSK',
                regionCode: '04',
                oneTimePlanPrice: 230.00,
                monthlyPlanPrice: 1600.00,
            },
        }),
        prisma.region.upsert({
            where: { code: 'KZN' },
            update: {},
            create: {
                name: 'Казань',
                code: 'KZN',
                regionCode: '05',
                oneTimePlanPrice: 220.00,
                monthlyPlanPrice: 1500.00,
            },
        }),
        prisma.region.upsert({
            where: { code: 'RND' },
            update: {},
            create: {
                name: 'Ростов-на-Дону',
                code: 'RND',
                regionCode: '06',
                oneTimePlanPrice: 200.00,
                monthlyPlanPrice: 1400.00,
            },
        }),
    ]);
    console.log(`✅ Created ${regions.length} regions`);
    console.log('Creating vehicle catalog...');
    const carCategory = await prisma.vehicleCategory.upsert({
        where: { name: 'Легковые автомобили' },
        update: {},
        create: {
            name: 'Легковые автомобили',
            displayName: 'Легковые автомобили',
            description: 'Легковые автомобили для перевозки людей',
        },
    });
    const carType = await prisma.vehicleType.upsert({
        where: { categoryId_name: { categoryId: carCategory.id, name: 'Стандарт' } },
        update: {},
        create: {
            categoryId: carCategory.id,
            name: 'Стандарт',
            displayName: 'Стандарт',
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
                displayName: 'Седан',
                description: 'Седан (4 места)',
            },
        }),
        prisma.vehicleSubtype.upsert({
            where: { typeId_name: { typeId: carType.id, name: 'Универсал' } },
            update: {},
            create: {
                typeId: carType.id,
                name: 'Универсал',
                displayName: 'Универсал',
                description: 'Универсал (5 мест)',
            },
        }),
        prisma.vehicleSubtype.upsert({
            where: { typeId_name: { typeId: carType.id, name: 'Минивэн' } },
            update: {},
            create: {
                typeId: carType.id,
                name: 'Минивэн',
                displayName: 'Минивэн',
                description: 'Минивэн (7-8 мест)',
            },
        }),
    ]);
    const truckCategory = await prisma.vehicleCategory.upsert({
        where: { name: 'Грузовые автомобили' },
        update: {},
        create: {
            name: 'Грузовые автомобили',
            displayName: 'Грузовые автомобили',
            description: 'Грузовые автомобили для перевозки грузов',
        },
    });
    const lightTruckType = await prisma.vehicleType.upsert({
        where: { categoryId_name: { categoryId: truckCategory.id, name: 'Легкие грузовики' } },
        update: {},
        create: {
            categoryId: truckCategory.id,
            name: 'Легкие грузовики',
            displayName: 'Легкие грузовики',
            description: 'Грузовики до 3.5 тонн',
        },
    });
    const mediumTruckType = await prisma.vehicleType.upsert({
        where: { categoryId_name: { categoryId: truckCategory.id, name: 'Средние грузовики' } },
        update: {},
        create: {
            categoryId: truckCategory.id,
            name: 'Средние грузовики',
            displayName: 'Средние грузовики',
            description: 'Грузовики от 3.5 до 12 тонн',
        },
    });
    await Promise.all([
        prisma.vehicleSubtype.upsert({
            where: { typeId_name: { typeId: lightTruckType.id, name: 'Газель' } },
            update: {},
            create: {
                typeId: lightTruckType.id,
                name: 'Газель',
                displayName: 'Газель',
                description: 'ГАЗель и аналоги (до 1.5 тонн)',
            },
        }),
        prisma.vehicleSubtype.upsert({
            where: { typeId_name: { typeId: lightTruckType.id, name: 'Бычок' } },
            update: {},
            create: {
                typeId: lightTruckType.id,
                name: 'Бычок',
                displayName: 'Бычок',
                description: 'Малый грузовик (до 3 тонн)',
            },
        }),
        prisma.vehicleSubtype.upsert({
            where: { typeId_name: { typeId: mediumTruckType.id, name: 'Средний грузовик' } },
            update: {},
            create: {
                typeId: mediumTruckType.id,
                name: 'Средний грузовик',
                displayName: 'Средний грузовик',
                description: 'Грузовик 5-10 тонн',
            },
        }),
        prisma.vehicleSubtype.upsert({
            where: { typeId_name: { typeId: mediumTruckType.id, name: 'Рефрижератор' } },
            update: {},
            create: {
                typeId: mediumTruckType.id,
                name: 'Рефрижератор',
                displayName: 'Рефрижератор',
                description: 'Грузовик с холодильной установкой',
            },
        }),
    ]);
    const specialCategory = await prisma.vehicleCategory.upsert({
        where: { name: 'Специальная техника' },
        update: {},
        create: {
            name: 'Специальная техника',
            displayName: 'Специальная техника',
            description: 'Специализированная техника для особых задач',
        },
    });
    const specialType = await prisma.vehicleType.upsert({
        where: { categoryId_name: { categoryId: specialCategory.id, name: 'Спецтехника' } },
        update: {},
        create: {
            categoryId: specialCategory.id,
            name: 'Спецтехника',
            displayName: 'Спецтехника',
            description: 'Специализированная техника',
        },
    });
    await Promise.all([
        prisma.vehicleSubtype.upsert({
            where: { typeId_name: { typeId: specialType.id, name: 'Эвакуатор' } },
            update: {},
            create: {
                typeId: specialType.id,
                name: 'Эвакуатор',
                displayName: 'Эвакуатор',
                description: 'Эвакуатор для транспортировки автомобилей',
            },
        }),
        prisma.vehicleSubtype.upsert({
            where: { typeId_name: { typeId: specialType.id, name: 'Кран' } },
            update: {},
            create: {
                typeId: specialType.id,
                name: 'Кран',
                displayName: 'Кран',
                description: 'Автокран для подъемных работ',
            },
        }),
        prisma.vehicleSubtype.upsert({
            where: { typeId_name: { typeId: specialType.id, name: 'Манипулятор' } },
            update: {},
            create: {
                typeId: specialType.id,
                name: 'Манипулятор',
                displayName: 'Манипулятор',
                description: 'Манипулятор для погрузочных работ',
            },
        }),
        prisma.vehicleSubtype.upsert({
            where: { typeId_name: { typeId: specialType.id, name: 'Экскаватор' } },
            update: {},
            create: {
                typeId: specialType.id,
                name: 'Экскаватор',
                displayName: 'Экскаватор',
                description: 'Экскаватор для земляных работ',
            },
        }),
    ]);
    console.log('✅ Created vehicle catalog');
    console.log('Creating test users...');
    const testCustomer = await prisma.user.upsert({
        where: { telegramId: BigInt('123456789') },
        update: {},
        create: {
            telegramId: BigInt('123456789'),
            username: 'test_customer',
            firstName: 'Иван',
            lastName: 'Иванов',
            role: client_1.RoleType.CUSTOMER,
            phone: '+79001234567',
            lastSeenAt: new Date(),
        },
    });
    const testExecutor = await prisma.user.upsert({
        where: { telegramId: BigInt('987654321') },
        update: {},
        create: {
            telegramId: BigInt('987654321'),
            username: 'test_executor',
            firstName: 'Петр',
            lastName: 'Петров',
            role: client_1.RoleType.EXECUTOR,
            phone: '+79007654321',
            lastSeenAt: new Date(),
        },
    });
    const testAdmin = await prisma.user.upsert({
        where: { telegramId: BigInt('555666777') },
        update: {},
        create: {
            telegramId: BigInt('555666777'),
            username: 'test_admin',
            firstName: 'Админ',
            lastName: 'Админов',
            role: client_1.RoleType.ADMIN,
            phone: '+79005556677',
            lastSeenAt: new Date(),
        },
    });
    console.log('✅ Created test users');
    console.log('Creating user regions...');
    const moscowRegion = regions.find(r => r.code === 'MSK');
    if (moscowRegion && testExecutor) {
        await prisma.userRegion.upsert({
            where: { userId_regionId: { userId: testExecutor.id, regionId: moscowRegion.id } },
            update: {},
            create: {
                userId: testExecutor.id,
                regionId: moscowRegion.id,
                regionCode: moscowRegion.regionCode,
                planType: client_1.TariffType.OPTIMAL,
                paidUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                activeSubRegions: ['Центр', 'Север'],
            },
        });
    }
    console.log('✅ Created user regions');
    console.log('🎉 Seed completed successfully!');
}
main()
    .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map