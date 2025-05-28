from packages.bot.database import order_db, performer_db, region_db, server_db, custumer_db
from packages.bot.service.send_message_service import send_int_tg
from packages.bot.service import manage_region
from datetime import datetime
from babel.dates import format_date
from packages.bot.keyboard import performer_kb, custumer_kb


def format_date_to_russian(dt):
    return format_date(dt, "EEE d MMMM y", locale="ru_RU")


def is_region_present(order, user):
    order_region_str = f"{order['region_number']:02d}"
    return order_region_str in user["all_regions"]


async def send_all_order():
    await manage_region.update_all_users_with_regions()
    orders = await order_db.get_all_orders()
    users = await performer_db.find_all_performer()

    all_matching_users = {}

    for order in orders:
        # Проверим, был ли заказ уже отправлен или его статус не "search"
        if order.get("send_all", False) and order["status"] == "search":
            continue

        matching_users = []
        for user in users:
            # Проверка существования региона и субрегиона в данных пользователя
            region_data = user["all_regions"].get(order["regions"])
            if region_data and region_data.get("subreg", {}).get(order["preregion"]):

                # Перебираем машины пользователя
                for car_key, car_value in user["cars"].items():

                    # Проверяем совпадение типа, подтипа и типа кузова автомобиля
                    if (
                        car_value["data"][2] == order["type_car"]
                        and car_value["data"][3] == order["type_tip_car"]
                        and car_value["data"][4] == order["podtype_car"]
                    ):

                        matching_users.append(user["username"])

        if matching_users:
            all_matching_users[order["_id"]] = matching_users
            # Меняем статус заказа, чтобы он не был отправлен повторно
            await order_db.update_order_status(order["_id"], {"send_all": True})

            # Отправка сообщения каждому пользователю из списка matching_users
            for user_username in matching_users:
                # Поиск информации о пользователе по его username
                user_info = next((user for user in users if user["username"] == user_username), None)

                if user_info and "user_id" in user_info:
                    await send_int_tg.priority_queue.put(
                        {"content_type": "text", "chat_id": user_info["user_id"], "message": "Новый заказ доступен!"}
                    )

    return all_matching_users


async def new_order():
    get_all_orders = await order_db.get_all_orders()
    for order in get_all_orders:
        if not order["send_all"]:
            # get_region = await region_db.find_region_name(order['regions'], order['preregion'])
            get_region = await region_db.find_region_number(order["region_number"], order["preregion"])

            get_users = await performer_db.find_all_performer()
            for user in get_users:
                for key in user["all_regions"]:
                    if user["all_regions"][str(key)]["name"] == order["regions"]:
                        if user["all_regions"][str(key)]["subreg"]:
                            if user["all_regions"][str(key)]["subreg"][get_region]:
                                for car in user["cars"]:
                                    set1 = set([order["type_car"], order["type_tip_car"], order["podtype_car"]])
                                    set2 = set(user["cars"][car]["data"])
                                    if set1.issubset(set2) and user["cars"][car]["status"] == "search":
                                        if order["type_order"] == "place":
                                            text = (
                                                f"Заявка на cпецтехнику #{order['order_number']}\n\n"
                                                f"Категория ТС - {order['type_car']}, \nТип ТС - {order['type_tip_car']}, \nKол-во машин: {order['amount_car']} ед.\n"
                                                f"Дата выезда: {format_date_to_russian(order['date'])}\n"
                                                f"Адрес подачи: {order['regions']}, {order['address']}\n"
                                                f"Требования и примечания: {order['requirements']}\n"
                                                f"Стоимость работ, руб: {order['price']}"
                                            )
                                        elif order["type_order"] == "people":
                                            text = (
                                                f"Заявка на перевозку пассажиров  #{order['order_number']}\n\n"
                                                f"Категория ТС - {order['type_car']}, \nТип ТС - {order['type_tip_car']}, \nKол-во машин: {order['amount_car']} ед.\n"
                                                f"Дата выезда: {format_date_to_russian(order['date'])}\n"
                                                f"Адрес подачи: {order['regions']}, {order['address']}\n"
                                                f"Расстояние ↓: {order['distance']} км | {order['amount_people']} чел\n"
                                                f"Адрес доставки:{order['drop_address']}\n"
                                                f"Требования и примечания: {order['requirements']}\n"
                                                f"Стоимость перевозки, руб: {order['price']}"
                                            )
                                        elif order["type_order"] == "a_b":
                                            text = (
                                                f"Заявка на перевозку из точки А в В #{order['order_number']}\n\n"
                                                f"Категория ТС - {order['type_car']}, \nТип ТС - {order['type_tip_car']}, \nKол-во машин: {order['amount_car']} ед.\n"
                                                f"Дата выезда: {format_date_to_russian(order['date'])}\nАдрес подачи: {order['regions']}, {order['address']}\n"
                                                f"Расстояние ↓: {order['distance']} км\n"
                                                f"Адрес доставки: {order['drop_address']}\n"
                                                f"Везем: {order['info']}\n"
                                                f"Требования и примечания: {order['requirements']}\n"
                                                f"Стоимость перевозки, руб: {order['price']}"
                                            )

                                        await send_int_tg.priority_queue.put(
                                            {
                                                "content_type": "text",
                                                "chat_id": user["user_id"],
                                                "text": text,
                                                "reply_markup": performer_kb.take_order(order["_id"]),
                                            }
                                        )
                                        await order_db.update_send(order["_id"], True)
                                        break

    get_all_orders_sub = await order_db.get_all_orders_sub()
    for order in get_all_orders_sub:
        if not order["send_all"]:
            get_region = await region_db.find_region_name(order["regions"], order["preregion"])
            get_users = await performer_db.find_all_performer()
            for user in get_users:
                for key in user["all_regions"]:
                    if user["all_regions"][str(key)]["name"] == order["regions"]:
                        if user["all_regions"][str(key)]["subreg"]:
                            if user["all_regions"][str(key)]["subreg"][get_region]:
                                for car in user["cars"]:
                                    set1 = set([order["type_car"], order["type_tip_car"], order["podtype_car"]])
                                    set2 = set(user["cars"][car]["data"])
                                    if set1.issubset(set2) and user["cars"][car]["status"] == "search":
                                        if order["type_order"] == "people":
                                            text = (
                                                f"Заявка на перевозку пассажиров #{order['order_number']}\n\n"
                                                f"Категория ТС - {order['type_car']}, \nТип ТС - {order['type_tip_car']}, \nKол-во машин: {order['amount_car']} ед.\n"
                                                f"Дата выезда: {format_date_to_russian(order['date'])}\n"
                                                f"Адрес подачи: {order['regions']}, {order['address']}\n"
                                                f"Расстояние ↓: {order['distance']} км | Посадочных мест: {order['amount_people']} чел.\n"
                                                f"Адрес доставки: {order['drop_address']}\n"
                                                f"Требования и примечания: {order['requirements']}\n"
                                                f"Стоимость перевозки, руб: {order['price']}"
                                            )
                                        elif order["type_order"] == "place":
                                            text = (
                                                f"Заявка на cпецтехнику #{order['order_number']}\n\n"
                                                f"Категория ТС - {order['type_car']}, \nТип ТС - {order['type_tip_car']}, \nKол-во машин: {order['amount_car']} ед.\n"
                                                f"Дата выезда: {format_date_to_russian(order['date'])}\n"
                                                f"Адрес подачи: {order['regions']}, {order['address']}\n"
                                                f"Требования и примечания: {order['requirements']}\n"
                                                f"Стоимость работ, руб: {order['price']}"
                                            )

                                        elif order["type_order"] == "a_b":
                                            text = (
                                                f"Заявка на перевозку из точки А в В #{order['order_number']}\n\n"
                                                f"Категория ТС - {order['type_car']}, \nТип ТС - {order['type_tip_car']}, \nKол-во машин: {order['amount_car']} ед.\n"
                                                f"Дата выезда: {format_date_to_russian(order['date'])}\n"
                                                f"Адрес подачи: {order['regions']}, {order['address']}\n"
                                                f"Расстояние ↓: {order['distance']}\n"
                                                f"Адрес доставки: {order['drop_address']}\n"
                                                f"Везем: {order['info']}\n"
                                                f"Требования и примечания: {order['requirements']}\n"
                                                f"Стоимость перевозки, руб: {order['price']}"
                                            )
                                        await send_int_tg.priority_queue.put(
                                            {
                                                "content_type": "text",
                                                "chat_id": user["user_id"],
                                                "text": text,
                                                "reply_markup": performer_kb.take_order(order["_id"]),
                                            }
                                        )
                                        await order_db.update_send_id(order["_id"], True)
                                        break


async def chechk_car(user_id, order):
    user_info = await performer_db.find_performer(user_id)

    get_region = await region_db.find_region_name(order["regions"], order["preregion"])
    cars = []
    for key in user_info["all_regions"]:
        if user_info["all_regions"][str(key)]["name"] == order["regions"]:
            if user_info["all_regions"][str(key)]["subreg"]:
                if user_info["all_regions"][str(key)]["subreg"][get_region]:
                    for car in user_info["cars"]:
                        set1 = set([order["type_car"], order["type_tip_car"], order["podtype_car"]])
                        set2 = set(user_info["cars"][car]["data"])
                        if set1.issubset(set2) and user_info["cars"][car]["status"] == "search":
                            cars.append(car)

    return cars


async def car_update_work(user_id, car, status, order_num, obj=None):
    if obj is not None:
        current_time = datetime.now().strftime("%d.%m.%y %H:%M")
        log = {"message": f"🟡 заявка #{order_num}", "date": current_time}
        await performer_db.update_car_info(user_id, car, status, obj, log)
    else:
        pass


async def get_onecar(car, user_id, obj):

    info_server = await server_db.get_tariff()
    url = info_server["performer_link"]
    await performer_db.update_order(user_id, obj, False)
    current_time = datetime.now().strftime("%d.%m.%y %H:%M")
    log_initial_message = {"message": "Выкуп заявки", "date": current_time, "user": user_id}

    await order_db.update_info(obj, log_initial_message, {str(user_id): car}, "in_work")
    order = await order_db.find_order(obj)
    if order is None:
        order = await order_db.find_suborder(obj)
    await car_update_work(user_id, car, "in_work", order["order_number"], obj)
    region = await region_db.find_for_name(order["regions"])
    performer = await performer_db.find_performer(user_id)
    cars = performer["cars"][car]
    formatted_date = order["date"].strftime("%d.%m.%Y")
    type_status = {
        "create": "Создана",
        "wait": "На модерации",
        "canceled": "Отменена",
        "search": "Поиск исполнителя",
        "in_work": "В работе",
    }
    if order["type_order"] == "people":

        text = (
            f'Заявка на перевозку пассажиров #{order["order_number"]} - {type_status.get(order["status"])}\n\n'
            f'{formatted_date} {order["time"] if order["time"] is not None else ""}\n'
            f'Адрес подачи: [{region["region_number"]}] {order["regions"]} - {region["region"][int(order["preregion"])]}, {order["address"]}\n'
            f'{"Расстояние ↓" + str(order["distance"]) + " км | Посадочных мест" + str(order["amount_people"]) + " чел"}\n'
            f'Адрес доставки: {order["drop_address"] if order["drop_address"] is not None else ""}\n'
            f'Требования и примечания: {order["requirements"] if order["requirements"] is not None else "нет"}\n'
            f'Стоимость перевозки, руб: {order["price"] if order["price"] is not None else "Ожидаю предложения"}\n\n'
            f'Исполнитель {performer["name"]}\n'
            f'Категория ТС:{order["type_car"]}\n'
            f'Тип ТС: {cars["data"][4]} {cars["data"][0]} {cars["data"][1]}\n'
            f'Телефон:{performer["phone"]}'
        )

    elif order["type_order"] == "a_b":
        text = (
            f'Заявка на перевозку из точки А в В #{order["order_number"]} - {type_status.get(order["status"])}\n\n'
            f'{formatted_date} {order["time"] if order["time"] is not None else ""}\n'
            f'Адрес подачи: [{region["region_number"]}] {order["regions"]} - {region["region"][int(order["preregion"])]}, {order["address"]}\n'
            f'{"Расстояние ↓" + str(order["distance"]) + " км"}\n'
            f'Адрес доставки: {order["drop_address"] if order["drop_address"] is not None else ""}\n'
            f'Везем: {order["info"]}\n'
            f'Требования и примечания: {order["requirements"] if order["requirements"] is not None else "нет"}\n'
            f'Стоимость перевозки, руб: {order["price"] if order["price"] is not None else "Ожидаю предложения"}\n\n'
            f'Исполнитель: {performer["name"]}\n'
            f'Категория ТС: {order["type_car"]}\n'
            f'Тип ТС: {cars["data"][4]} {cars["data"][0]} {cars["data"][1]}\n'
            f'Телефон: {performer["phone"]}'
        )

    elif order["type_order"] == "place":
        text = (
            f'Заявка на cпецтехнику #{order["order_number"]} - {type_status.get(order["status"])}\n\n'
            f'{formatted_date} {order["time"] if order["time"] is not None else ""}\n'
            f'Адрес доставки: [{region["region_number"]}] {order["regions"]} - {region["region"][int(order["preregion"])]}, {order["address"]}\n'
            f'Требования и примечания: {order["requirements"] if order["requirements"] is not None else "нет"}\n'
            f'Стоимость работ, руб: {order["price"] if order["price"] is not None else "Ожидаю предложения"}\n\n'
            f'Исполнитель {performer["name"]}\n'
            f'Категория ТС:{order["type_car"]}\n'
            f'Тип ТС: {cars["data"][4]} {cars["data"][0]} {cars["data"][1]}\n'
            f'Телефон: {performer["phone"]}'
        )

    await send_int_tg.priority_queue.put(
        {
            "content_type": "text",
            "chat_id": order["customer"],
            "text": text,
            "reply_markup": custumer_kb.order_menu_work(f"{order['customer']}:{obj}"),
        }
    )

    if performer["tariff"]:

        text_1 = f'Заявка #{order["order_number"]} выкуплена. \nС баланса списано {order["viptarif"]}р\n\n'
    else:
        text_1 = f'Заявка #{order["order_number"]} выкуплена. \nС баланса списано {order["tarif"]}р\n\n'

    await car_update_work(user_id, car, "in_work", obj)
    await send_int_tg.priority_queue.put(
        {
            "content_type": "text",
            "chat_id": user_id,
            "text": text_1,
            "reply_markup": performer_kb.performer_main(url=url),
        }
    )


async def chek_order_amount(user_id):
    check = await custumer_db.find_custumer(user_id)
    if check["setting_limit"] > 0:
        return "go_send"
    elif check["setting_limit"] == 0 and check["balance"] >= 99:
        return "buy"
    else:
        return (
            f'Бесплатно можно подать {check["main_limit"]} заявки в день. Размещение каждой '
            f"последующей заявки стоит 99р"
        )


async def update_invites():
    get_all = await custumer_db.all_user()
    update_users = []
    for user in get_all:
        update_users.append({"user_id": user["user_id"], "setting_limit": user["main_limit"]})

    await custumer_db.add_more_info_user(update_users)
