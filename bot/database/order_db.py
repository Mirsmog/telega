from packages.bot.mongo import order_db, subid_db
from bson import ObjectId


async def get_orders():
    return await order_db.find_one(sort=[("_id", -1)])


async def get_all_orders():
    return await order_db.find({"status": "search"}).to_list(None)


async def get_all_orders_sub():
    return await subid_db.find({"status": "search"}).to_list(None)


async def find_order(obj):
    return await order_db.find_one({"_id": ObjectId(obj)})


async def number_order(obj):
    return await order_db.find_one({"order_number": obj})


async def find_suborder(obj):
    return await subid_db.find_one({"_id": ObjectId(obj)})


async def add_new_order(order):
    return await order_db.insert_one(order)


async def add_order(order):
    """
    Добавляет новый заказ в базу данных.
    Возвращает ID созданного заказа.
    """
    result = await order_db.insert_one(order)
    return result.inserted_id


async def update_order_status(obj, status):
    await order_db.update_one({"_id": ObjectId(obj)}, {"$set": {"status": status}})


from bson import ObjectId, errors


async def find_user_orders(object_ids):
    valid_object_ids = []
    for oid in object_ids:
        try:
            valid_object_ids.append(ObjectId(oid))
        except errors.InvalidId:
            print(f"Invalid ObjectId: {oid}")

    if not valid_object_ids:
        print("No valid ObjectIds provided.")
        return []

    cursor = order_db.find({"_id": {"$in": valid_object_ids}, "status": {"$ne": "finish"}})

    uncompleted_orders = await cursor.to_list(length=100)
    return uncompleted_orders


async def update_log(order_id, log_initial_message, status=None):
    # Преобразуем ObjectId в строку, если order_id является ObjectId
    if isinstance(order_id, ObjectId):
        order_id = str(order_id)
    
    if status is None:
        await order_db.update_one({"_id": ObjectId(order_id)}, {"$push": {"log": log_initial_message}})
    else:
        await order_db.update_one(
            {"_id": ObjectId(order_id)}, {"$push": {"log": log_initial_message}, "$set": {"status": status}}
        )


async def update_send(obj, status):
    await order_db.update_one({"_id": ObjectId(obj)}, {"$set": {"send_all": status}})


async def update_new_info(obj, info):
    await order_db.update_one({"_id": ObjectId(obj)}, {"$set": info})


async def update_order(obj, info):
    """
    Обновляет информацию о заказе.
    
    Args:
        obj: ID заказа (строка или ObjectId)
        info: Словарь с полями для обновления
    """
    if isinstance(obj, str):
        obj_id = ObjectId(obj)
    elif isinstance(obj, ObjectId):
        obj_id = obj
    else:
        raise TypeError("obj должен быть строкой или ObjectId")
    
    await order_db.update_one({"_id": obj_id}, {"$set": info})


async def update_newsub_info(obj, info):
    await subid_db.update_one({"_id": ObjectId(obj)}, {"$set": info})


async def update_send_id(obj, status):
    await subid_db.update_one({"_id": ObjectId(obj)}, {"$set": {"send_all": status}})


async def update_suborder(obj, sub_id):
    await order_db.update_one({"_id": ObjectId(obj)}, {"$push": {"suborder": sub_id}})


async def update_info(obj, log_initial_message, performer, status):

    await order_db.update_one(
        {"_id": ObjectId(obj)},
        {"$push": {"log": log_initial_message}, "$set": {"status": status, "performer": performer}},
    )


async def update_info_sub(obj, performer, status):

    await subid_db.update_one({"_id": ObjectId(obj)}, {"$set": {"status": status, "performer": performer}})


async def update_performer_sub(obj, performer):
    await subid_db.update_one({"_id": ObjectId(obj)}, {"$set": performer})


async def find_order_performer(user_id):
    return await order_db.find({f"performer.{user_id}": {"$exists": True}}).to_list(None)


async def add_suborder(info):
    return await subid_db.insert_one(info)


async def car_new_info(obj_id, car, performer, log):
    await order_db.update_one(
        {"_id": ObjectId(obj_id)}, {"$push": {"log": log}, "$set": {"performer": {performer: car}}}
    )


async def get_next_order_number():
    """
    Получает следующий доступный номер заказа.
    Находит заказ с наибольшим номером и увеличивает его на 1.
    """
    # Находим заказ с самым большим номером
    last_order = await order_db.find_one(sort=[("number", -1)])
    
    # Если заказов нет, начинаем с 1
    if not last_order or "number" not in last_order:
        return 1
    
    # Иначе увеличиваем номер последнего заказа на 1
    return last_order["number"] + 1


async def find_available_orders(active_regions):
    """
    Находит доступные заказы для активных регионов исполнителя.
    
    Args:
        active_regions: Словарь с регионами и их подрегионами, доступными исполнителю
            Формат: {region_code: [subregion1, subregion2, ...], ...}
    
    Returns:
        Список заказов, доступных для выбранных регионов
    """
    query = {
        "status": "search",  # Ищем только заказы в статусе поиска
    }
    
    # Если активные регионы указаны, добавляем их в запрос
    if active_regions:
        # Создаем запрос для поиска заказов в указанных регионах/подрегионах
        region_conditions = []
        for region_code, subregions in active_regions.items():
            if subregions:  # Если есть активные подрегионы
                for subregion in subregions:
                    region_conditions.append({
                        "region": region_code,
                        "subregion": subregion.strip()  # Убираем лишние пробелы
                    })
        
        # Добавляем условие поиска по регионам, если они есть
        if region_conditions:
            query["$or"] = region_conditions
    
    # Выполняем запрос и возвращаем результаты
    orders = await order_db.find(query).to_list(None)
    
    # Преобразуем ObjectId в строки для JSON-сериализации
    serialized_orders = []
    for order in orders:
        serialized_order = {}
        for key, value in order.items():
            if key == "_id":
                serialized_order[key] = str(value)
            elif isinstance(value, ObjectId):
                serialized_order[key] = str(value)
            else:
                serialized_order[key] = value
        serialized_orders.append(serialized_order)
    
    return serialized_orders
