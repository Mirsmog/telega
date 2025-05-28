from packages.bot.mongo import custumer_db
from bson import ObjectId
from datetime import datetime


# заказчик
async def add_new_custumer(user_data):
    await custumer_db.insert_one(user_data)


async def find_custumer(user_id):
    return await custumer_db.find_one({"user_id": user_id})


async def update_info_user(user_id, user_info):
    await custumer_db.update_one({"user_id": user_id}, {"$set": user_info})


async def update_order_done(user_id, increment_value, order_number):
    print(increment_value.keys())
    current_time = datetime.now().strftime("%d.%m.%y %H:%M")
    if "cancel" in list(increment_value.keys())[0]:
        log_user = {"message": f"Заказчик отменил заявку #{order_number}", "date": current_time}
    elif "done" in list(increment_value.keys())[0]:
        log_user = {"message": f"Заказчик завершил заявку #{order_number}", "date": current_time}

    await custumer_db.update_one({"user_id": user_id}, {"$inc": increment_value, "$push": {"logs": log_user}})


async def update_order(user_id, order_id, order_number, log):
    # Преобразуем order_id в строку, если это объект ObjectId
    if isinstance(order_id, ObjectId):
        order_id_str = str(order_id)
    else:
        order_id_str = order_id
        
    key = "orders." + str(order_number)
    await custumer_db.update_one(
        {"user_id": user_id}, {"$set": {key: order_id_str}, "$inc": {"setting_limit": -1}, "$push": {"logs": log}}
    )


async def update_report(user_id, report):
    await custumer_db.update_one({"user_id": user_id}, {"$push": report})


async def update_send_report(user_id, send_report):
    await custumer_db.update_one({"user_id": user_id}, {"$push": send_report})


async def check_phone_exists(phone):
    return await custumer_db.find_one({"phone": phone})


async def all_user():
    return await custumer_db.find({}).to_list(None)


async def add_more_info_user(users_info):
    for user in users_info:
        user_id = user["user_id"]
        setting_limit = user["setting_limit"]
        await custumer_db.update_one({"user_id": user_id}, {"$set": {"setting_limit": setting_limit}})


async def update_balance_bid(user_id, balance):
    current_time = datetime.now().strftime("%d.%m.%y %H:%M")
    log_user = {"message": f"пополнение баланса на {balance} рублей", "date": current_time}
    await custumer_db.update_one({"user_id": user_id}, {"$inc": {"balance": balance}, "$push": {"logs": log_user}})


async def buy_order(user_id):
    await custumer_db.update_one({"user_id": user_id}, {"$inc": {"balance": -99, "setting_limit": 1}})
