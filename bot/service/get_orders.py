from packages.bot.database import user_db, order_db, custumer_db, performer_db
from datetime import datetime
from bson import ObjectId


async def get_orders(user_id):

    user_data = await custumer_db.find_custumer(user_id)

    if user_data and "orders" in user_data:
        object_ids = list(user_data["orders"].values())

        orders = await order_db.find_user_orders(object_ids)

        # или другое ограничение по количеству

        return orders


async def get_orders_per(user_id):
    status_order = ["work", "in_work", "search", "create"]
    user_data = await performer_db.find_performer(user_id)
    order_returned = []
    if user_data and "orders" in user_data:
        for order in user_data["orders"]:
            order_info = await order_db.find_order(user_data["orders"][order])
            if order_info["status"] in status_order:
                order_returned.append(order_info)
        return order_returned

    return []


async def update_order_log(order_id, message, user_id, status):
    # Преобразуем order_id в строку, если это объект ObjectId
    if isinstance(order_id, ObjectId):
        order_id_str = str(order_id)
    else:
        order_id_str = order_id

    current_time = datetime.now().strftime("%d.%m.%y %H:%M")
    log_initial_message = {"message": message, "date": current_time, "user": user_id}

    await order_db.update_log(order_id_str, log_initial_message, status)
