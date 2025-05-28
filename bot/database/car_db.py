from packages.bot.mongo import car_users_db


async def add_new_car(car_info):
    await car_users_db.insert_one(car_info)
