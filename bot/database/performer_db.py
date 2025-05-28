from packages.bot.mongo import performer_db, region_db, car_users_db
from bson import ObjectId
import datetime


# исполнитель
async def add_new_performer(user_data):
    await performer_db.insert_one(user_data)


async def find_performer(user_id):
    # Пробуем разные варианты запроса - возможно ID хранится в разных форматах
    try:
        result = await performer_db.find_one({"user_id": int(user_id)})
        if result:
            return result
    except (ValueError, OverflowError):
        # Если ID слишком большой для int, пробуем найти как строку
        pass

    # Ищем как строковое значение
    result = await performer_db.find_one({"user_id": str(user_id)})
    if result:
        return result

    # Попробуем поискать по _id, если user_id передан как ObjectId
    try:
        if len(str(user_id)) == 24:  # Длина ObjectId в MongoDB
            result = await performer_db.find_one({"_id": ObjectId(user_id)})
            if result:
                return result
    except:
        pass

    # В последнюю очередь просто ищем такой ID в любом формате
    # Использовать только в крайнем случае, так как может быть медленно
    pipeline = [
        {
            "$match": {
                "$or": [
                    {"user_id": {"$in": [user_id, str(user_id)]}},
                    {"telegram_id": {"$in": [user_id, str(user_id)]}},
                ]
            }
        }
    ]
    results = await performer_db.aggregate(pipeline).to_list(1)
    if results:
        return results[0]

    return None


async def find_all_performer():
    return await performer_db.find({}).to_list(None)


async def update_user_regions(user_id, all_regions_data):
    await performer_db.update_one({"_id": ObjectId(user_id)}, {"$set": {"all_regions": all_regions_data}})


async def update_info_user(user_id, user_info):
    await performer_db.update_one({"user_id": user_id}, {"$set": user_info})


async def update_report(user_id, report):
    await performer_db.update_one({"user_id": user_id}, {"$push": report})


async def update_send_report(user_id, send_report):
    await performer_db.update_one({"user_id": user_id}, {"$push": send_report})


async def find_cars(user_id):
    return await performer_db.find_one({"user_id": user_id})


async def check_existing_cars_in_db(user_id):
    return await performer_db.find_one({"user_id": user_id})


async def save_cars_to_db(user_id, car_key, car_info, log_user):
    await performer_db.update_one(
        {"user_id": user_id}, {"$set": {f"cars.{car_key}": car_info}, "$push": {"logs": log_user}}
    )


async def car_status_update(user_id, car, status, log):
    await car_users_db.update_one({"user_id_car": user_id, "number_car": car}, {"$set": {"status": status}})

    await performer_db.update_one(
        {"user_id": user_id, f"cars.{car}": {"$exists": True}},
        {"$set": {f"cars.{car}.status": status}, "$push": {f"cars.{car}.log": log, "logs": log}},
    )


async def set_all_false(user_id, region_number):
    """
    Деактивирует все подрегионы указанного региона
    """
    # Получаем документ пользователя через find_performer вместо напрямую
    user_data = await find_performer(user_id)
    if not user_data:
        print(f"Пользователь не найден: {user_id}")
        return None

    if "all_regions" not in user_data or region_number not in user_data["all_regions"]:
        print(f"Регион не найден: {region_number}")
        return None

    subregions = user_data["all_regions"][region_number]["subreg"]

    # Обновление всех подрегионов на False
    update_paths = {}
    for subregion in subregions.keys():
        update_paths[f"all_regions.{region_number}.subreg.{subregion}"] = False

    print(f"Деактивируем {len(update_paths)} подрегионов в регионе {region_number}")

    # Попытка 1: Обновляем по _id (самый надежный способ)
    if "_id" in user_data:
        result = await performer_db.update_one({"_id": user_data["_id"]}, {"$set": update_paths})
        print(f"Результат обновления по _id: matched={result.matched_count}, modified={result.modified_count}")
    else:
        # Попытка 2: Используем ID в том же формате, как хранится в БД
        user_id_from_db = user_data.get("user_id")
        result = await performer_db.update_one({"user_id": user_id_from_db}, {"$set": update_paths})
        print(f"Результат обновления по user_id: matched={result.matched_count}, modified={result.modified_count}")

        # Если не сработало, пробуем другие форматы
        if result.matched_count == 0:
            try:
                # Попытка 3: int
                result = await performer_db.update_one({"user_id": int(user_id)}, {"$set": update_paths})
                print(
                    f"Результат обновления по int(user_id): matched={result.matched_count}, modified={result.modified_count}"
                )
            except:
                pass

            # Попытка 4: str
            if result.matched_count == 0:
                result = await performer_db.update_one({"user_id": str(user_id)}, {"$set": update_paths})
                print(
                    f"Результат обновления по str(user_id): matched={result.matched_count}, modified={result.modified_count}"
                )

    # Проверяем результат обновления
    updated_doc = await find_performer(user_id)
    first_key = next(iter(subregions.keys()), None)
    if first_key:
        updated_value = updated_doc["all_regions"][region_number]["subreg"].get(first_key)
        print(f"Проверка после обновления (первый подрегион {first_key}): {updated_value}")

    return True


async def add_regions_to_user(user_id):
    user_data = await performer_db.find_one({"user_id": user_id}, {"all_regions": 1})
    user_regions = user_data.get("all_regions", {}) if user_data else {}

    # Получаем все регионы из основной базы данных регионов
    all_db_regions = await region_db.find().to_list(None)

    # Этот словарь будет использоваться для хранения текущих и обновленных данных о регионах пользователя
    updated_regions = {}
    for db_region in all_db_regions:
        # Форматируем номер региона, чтобы он был двузначным
        region_number = str(db_region["region_number"]).zfill(2)

        # Получаем текущие данные региона пользователя, если они существуют
        current_region = user_regions.get(region_number, {"subreg": {}})

        # Обновляем подрегионы, сохраняя их текущие значения
        updated_subregs = {
            subregion: current_region["subreg"].get(subregion, False) if current_region["subreg"] else False
            for subregion in db_region["region"]
        }

        updated_regions[region_number] = {"name": db_region["region_name"], "subreg": updated_subregs}

    # Применяем обновления в базе данных
    await performer_db.update_one({"user_id": user_id}, {"$set": {"all_regions": updated_regions}})


async def find_button(user_id, subtype_id, region_code):
    # Ищем документ по user_id
    doc = await performer_db.find_one({"user_id": user_id})
    if not doc:
        return None
    region_data = doc["all_regions"][region_code]
    # Проверяем, существует ли region_code в all_regions

    if region_data:
        region_data = region_data["subreg"]
    key_at = list(region_data.keys())[int(subtype_id)]
    if region_data[key_at]:
        new_button_state = False
    elif not region_data[key_at]:
        new_button_state = True
    # Получаем состояние кнопки для subtype_id
    update_path = f"all_regions.{region_code}.subreg.{key_at}"
    await performer_db.update_one({"user_id": user_id}, {"$set": {update_path: new_button_state}})
    return new_button_state


async def find_region(user_id):
    return await performer_db.find_one({"user_id": user_id})


async def find_button_reg(user_id, subtype_id, region_code):
    # предположим, что у вас есть документ для каждого пользователя с идентификатором `user_id`
    user_doc = await performer_db.find_one({"user_id": user_id})

    if user_doc:
        try:
            return user_doc["all_regions"][region_code]["subreg"][subtype_id]
        except KeyError:
            return None  # или любое другое значение по умолчанию
    return None


async def update_button(user_id, subregion_name, region_code, value):
    """
    Обновляет статус кнопки (подрегиона) для указанного пользователя и региона
    """
    # Проверяем наличие пользователя и региона
    user_doc = await find_performer(user_id)
    if not user_doc:
        print(f"Пользователь не найден: {user_id}")
        return None

    # Важно! Получаем _id документа из найденного пользователя
    user_id_from_db = user_doc.get("user_id")  # ID в том формате, как он хранится в БД

    print(f"ID пользователя в БД: {user_id_from_db}, тип: {type(user_id_from_db)}")
    print(f"ID переданный в функцию: {user_id}, тип: {type(user_id)}")

    # Проверяем наличие региона
    all_regions = user_doc.get("all_regions", {})
    if region_code not in all_regions:
        print(f"Регион не найден: {region_code}")
        return None

    region = all_regions[region_code]
    subregs = region.get("subreg", {})

    # Сначала пытаемся найти подрегион как есть
    if subregion_name in subregs:
        subregion_key = subregion_name
        print(f"Найден подрегион по точному соответствию: {subregion_name}")
    else:
        # Ищем с учетом пробелов в начале
        subregion_with_space = " " + subregion_name.strip()
        if subregion_with_space in subregs:
            subregion_key = subregion_with_space
            print(f"Найден подрегион с пробелом: {subregion_with_space}")
        else:
            # Ищем без учета пробелов (нормализация)
            normalized_name = subregion_name.strip()
            found = False
            for key in subregs.keys():
                if key.strip() == normalized_name:
                    subregion_key = key
                    found = True
                    print(f"Найден подрегион через нормализацию: ключ='{key}', искали='{normalized_name}'")
                    break

            if not found:
                print(f"Подрегион не найден: '{subregion_name}' в регионе {region_code}")
                print(f"Доступные подрегионы: {list(subregs.keys())}")
                return None

    # Текущее значение подрегиона
    current_value = subregs.get(subregion_key, False)
    print(f"Текущее значение подрегиона '{subregion_key}': {current_value}, новое значение: {value}")

    # Если значение такое же, ничего не делаем
    if current_value == value:
        print(f"Значение не изменилось, пропускаем обновление")
        return value

    # Обновляем значение в базе данных
    update_path = f"all_regions.{region_code}.subreg.{subregion_key}"
    print(f"Обновляем путь: {update_path} с значением {value}")

    # Используем _id для обновления или user_id в правильном формате
    try:
        # Попытка 1: Обновляем по _id (самый надежный способ)
        if "_id" in user_doc:
            result = await performer_db.update_one({"_id": user_doc["_id"]}, {"$set": {update_path: value}})
            print(f"Результат обновления по _id: matched={result.matched_count}, modified={result.modified_count}")
        else:
            # Попытка 2: Используем ID в том же формате, как он хранится в БД
            result = await performer_db.update_one({"user_id": user_id_from_db}, {"$set": {update_path: value}})
            print(f"Результат обновления по user_id: matched={result.matched_count}, modified={result.modified_count}")

        # Если ничего не получилось, попробуем разные форматы ID
        if result.matched_count == 0:
            # Попытка 3: Пробуем как int
            try:
                result = await performer_db.update_one({"user_id": int(user_id)}, {"$set": {update_path: value}})
                print(
                    f"Результат обновления по int(user_id): matched={result.matched_count}, modified={result.modified_count}"
                )
            except:
                pass

            # Попытка 4: Пробуем как строку
            if result.matched_count == 0:
                result = await performer_db.update_one({"user_id": str(user_id)}, {"$set": {update_path: value}})
                print(
                    f"Результат обновления по str(user_id): matched={result.matched_count}, modified={result.modified_count}"
                )
    except Exception as e:
        print(f"Ошибка при обновлении: {e}")

    # Проверяем, что обновление прошло успешно
    updated_doc = await find_performer(user_id)
    updated_value = updated_doc["all_regions"][region_code]["subreg"].get(subregion_key)
    print(f"Проверка после обновления: {updated_value}")

    return value  # Возвращаем новое значение


async def update_all_buttons_to_true(user_id, region_code):
    """
    Активирует все подрегионы указанного региона
    """
    # Получаем текущий документ пользователя используя find_performer вместо find_one
    user_doc = await find_performer(user_id)
    if not user_doc:
        print(f"Пользователь не найден: {user_id}")
        return None

    # Проверяем, есть ли данный регион в all_regions
    region = user_doc.get("all_regions", {}).get(region_code)
    if not region:
        print(f"Регион не найден: {region_code}")
        return f"No region with code {region_code}"

    # Соберем все пути, которые нужно обновить
    update_paths = {}
    for subreg_key in region.get("subreg", {}):
        # Создаем путь для обновления
        path = f"all_regions.{region_code}.subreg.{subreg_key}"
        update_paths[path] = True

    # Обновляем все кнопки на True для выбранного региона
    if update_paths:
        print(f"Обновляем {len(update_paths)} подрегионов в регионе {region_code}")

        # Попытка 1: Обновляем по _id (самый надежный способ)
        if "_id" in user_doc:
            result = await performer_db.update_one({"_id": user_doc["_id"]}, {"$set": update_paths})
            print(f"Результат обновления по _id: matched={result.matched_count}, modified={result.modified_count}")
        else:
            # Попытка 2: Используем ID в том же формате, как хранится в БД
            user_id_from_db = user_doc.get("user_id")
            result = await performer_db.update_one({"user_id": user_id_from_db}, {"$set": update_paths})
            print(f"Результат обновления по user_id: matched={result.matched_count}, modified={result.modified_count}")

            # Если не сработало, пробуем другие форматы
            if result.matched_count == 0:
                try:
                    # Попытка 3: int
                    result = await performer_db.update_one({"user_id": int(user_id)}, {"$set": update_paths})
                    print(
                        f"Результат обновления по int(user_id): matched={result.matched_count}, modified={result.modified_count}"
                    )
                except:
                    pass

                # Попытка 4: str
                if result.matched_count == 0:
                    result = await performer_db.update_one({"user_id": str(user_id)}, {"$set": update_paths})
                    print(
                        f"Результат обновления по str(user_id): matched={result.matched_count}, modified={result.modified_count}"
                    )

        # Проверяем результат обновления
        updated_doc = await find_performer(user_id)
        first_key = next(iter(region.get("subreg", {})), None)
        if first_key:
            updated_value = updated_doc["all_regions"][region_code]["subreg"].get(first_key)
            print(f"Проверка после обновления (первый подрегион {first_key}): {updated_value}")

        return True

    return False


async def taked_order_car(performer_id, car, obj, status, log, balance, order):
    print(performer_id, car, obj, status, log, balance, order)
    current_time = datetime.datetime.now().strftime("%d.%m.%y %H:%M")
    log_user = {"message": f"Заявка в работе #{order}", "date": current_time}
    update_query = {
        f"cars.{car}.status": status,
        f"cars.{car}.order_id": obj,
    }
    await performer_db.update_one(
        {"user_id": int(performer_id)},
        {"$set": update_query, "$push": {f"cars.{car}.log": log, "logs": log_user}, "$inc": {"balance": balance}},
    )


async def update_car_info(user_id, car_name, new_status, new_order_id, new_log):
    # Определение пути до поля, которое вы хотите обновить
    status_path = f"cars.{car_name}.status"
    order_id_path = f"cars.{car_name}.order_id"
    log_path = f"cars.{car_name}.log"

    # Обновление данных в базе
    await performer_db.update_one(
        {"user_id": int(user_id)},
        {"$set": {status_path: new_status, order_id_path: new_order_id}, "$push": {log_path: new_log}},
    )


async def update_order(user_id, order_id, status):
    query = {"user_id": user_id, "orders.order_id": order_id}

    update_data = {"$set": {"orders.$.status": status}}
    await performer_db.update_one(query, update_data)


async def update_balance_bid(user_id, balance):
    current_time = datetime.datetime.now().strftime("%d.%m.%y %H:%M")
    log_user = {"message": f"пополнение баланса на {balance} рублей", "date": current_time}
    await performer_db.update_one({"user_id": user_id}, {"$inc": {"balance": balance}, "$push": {"logs": log_user}})


async def add_order(user_id, number, order):
    await performer_db.update_one({"user_id": user_id}, {"$set": {"orders": {str(number): order}}})


async def update_status_performer_order(user_id, number, status):
    # TODO: возможно надо добавить логи
    await performer_db.update_one({"user_id": user_id}, {"$set": {"orders": {str(number): {"status": status}}}})
