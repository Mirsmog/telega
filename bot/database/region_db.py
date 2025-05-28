from packages.bot.mongo import region_db
from bson import ObjectId


# возвращает все регионы из Админки
async def fetch_regions():
    result = await region_db.find({}).to_list(None)
    return result


async def find_region(obj):
    return await region_db.find_one({"_id": ObjectId(obj)})


async def find_region_name(region, raion):
    doc = await region_db.find_one({"region_name": region, f"region.{raion}": {"$exists": True}})
    return doc["region"][int(raion)]


async def find_region_number(region, raion):
    doc = await region_db.find_one({"region_number": region, f"region.{raion}": {"$exists": True}})
    return doc["region"][int(raion)]


async def find_for_name(name):
    return await region_db.find_one({"region_name": name})
