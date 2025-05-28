from packages.bot.mongo import user_db


async def new_user(user_info):
    await user_db.insert_one(user_info)


async def find_user(user_id):
    return await user_db.find_one({"user_id": user_id})


async def update_info_user(user_id, data_info):
    await user_db.update_one({"user_id": user_id}, {"$set": data_info})


async def update_balance_bid(user_id, balance):
    await user_db.update_one({"user_id": user_id}, {"$inc": {"balance": balance}})


async def update_order(user_id, order_id, order_number):
    await user_db.update_one({"user_id": user_id}, {"$set": {str(order_number): order_id}})
