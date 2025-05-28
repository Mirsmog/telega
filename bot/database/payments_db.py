from packages.bot.mongo import payments_db
from datetime import datetime
from packages.bot.database import user_db


async def create_bid(user_id, amount, order_id):
    wgo = await user_db.find_user(user_id)
    if wgo["performer"]:
        user = "performer"
    if wgo["custumer"]:
        user = "custumer"
    document = {
        "user_id": user_id,
        "amount": amount,
        "order_id": order_id,
        "status": "create",
        "data": datetime.now(),
        "user_st": user,
        "new": True,
    }
    await payments_db.insert_one(document)


async def find_bid():
    "success"
    cursor = payments_db.find({"new": True, "status": "CONFIRMED"}).sort("_id", -1).limit(300)
    bids = []
    async for doc in cursor:
        bids.append(doc)

    return bids


async def update_bid(obj, status):
    await payments_db.update_one({"_id": obj}, {"$set": {"status": status, "new": False}})
