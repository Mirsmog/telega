from packages.bot.mongo import server_db, car_db, type_db, podtype_db
from bson import ObjectId


async def get_category_car():
    return await car_db.find({}).to_list(None)


async def get_type_car(category):
    return await type_db.find({"type_category": category}).to_list(None)


async def find_category(obj):
    return await car_db.find_one({"_id": ObjectId(obj)})


async def find_type(obj):
    return await type_db.find_one({"_id": ObjectId(obj)})


async def get_podtype_car(typename):
    return await podtype_db.find({"pod_type_category": typename}).to_list(None)


async def find_podtype(obj):
    return await podtype_db.find_one({"_id": ObjectId(obj)})


async def get_tariff():
    return await server_db.find_one({"_id": ObjectId("64f728c0a7bf79be63a1de29")})
