from packages.bot.mongo import manage_db
from bson import ObjectId


async def find_order(order_id):
    return await manage_db.find_one({"order_id": order_id})


async def find_order_obj(obj):
    return await manage_db.find_one({"_id": ObjectId(obj)})


# надо каким то богом добавить порядок заявки? или че, что бы несколько исполнителей могли предложить свою херню
async def upsert_order(order_id, performer_id, status, new_date=None, new_price=None, car=None):
    # Формируем данные для обновления или создания
    current_order = await manage_db.find_one({"order_id": order_id})
    performer_count = len(current_order.get("performer", {})) if current_order else 0
    if performer_count == 0:
        coun_back = 0
    else:
        coun_back = performer_count + 1
    update_data = {
        f"performer.{performer_id}.new_date": new_date,
        f"performer.{performer_id}.new_price": new_price,
        f"performer.{performer_id}.car": car,
        "status": status,
    }

    # Используем upsert для создания или обновления записи на основе order_id
    await manage_db.update_one({"order_id": order_id}, {"$set": update_data}, upsert=True)
    return coun_back
