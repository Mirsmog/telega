from packages.bot.create_bot import Dispatcher, types, FSMContext, StatesGroup, State, ReplyKeyboardMarkup, bot
from packages.bot.service.send_message_service import send_int_tg
from packages.bot.scheamas import user_schema
from packages.bot.database import custumer_db, performer_db, user_db, order_db, region_db, server_db, manege_db
from packages.bot.keyboard import main_kb, performer_kb, custumer_kb, order_kb
from packages.bot.service import get_orders, order_setting
from handlers import manage_order as MO
from handlers.end_work import work_custumer as WS
from datetime import datetime


async def process_customer(c: types.CallbackQuery):
    _, call = c.data.split("_")
    info_server = await server_db.get_tariff()

    url_custumer = info_server["customer_link"]
    if call == "order":
        status = await order_setting.chek_order_amount(c.from_user.id)
        print(status)
        if status == "go_send":
            await send_int_tg.priority_queue.put(
                {
                    "content_type": "text",
                    "chat_id": c.from_user.id,
                    "text": "Выберите тип работ",
                    "reply_markup": order_kb.what_is_work(),
                    "parse_mode": "markdown",
                }
            )
        elif status == "buy":
            await custumer_db.buy_order(c.from_user.id)
            await send_int_tg.priority_queue.put(
                {
                    "content_type": "text",
                    "chat_id": c.from_user.id,
                    "text": "С вашего баланса списано 70 рублей и добавлена 1 заявка\n\n" "Выберите тип работ",
                    "reply_markup": order_kb.what_is_work(),
                    "parse_mode": "markdown",
                }
            )
        else:
            await send_int_tg.priority_queue.put(
                {
                    "content_type": "text",
                    "chat_id": c.from_user.id,
                    "text": status,
                    "reply_markup": await custumer_kb.pay_70(c.from_user.id),
                    "parse_mode": "markdown",
                }
            )
    elif call == "bid":
        user_info = await custumer_db.find_custumer(c.from_user.id)
        orders = await get_orders.get_orders(c.from_user.id)
        await send_int_tg.send_with_limit(
            content_type="text",
            chat_id=c.from_user.id,
            text=f'Всего заявок: {len(user_info["orders"])}\n'
            f'Выполнено: {user_info["order_all"]["done"]}\n'
            f'Отменены: {user_info["order_all"]["cancel"]}',
            reply_markup=custumer_kb.all_bid(orders),
        )
    elif call == "profile":
        user_info = await custumer_db.find_custumer(c.from_user.id)
        await send_int_tg.priority_queue.put(
            {
                "content_type": "text",
                "chat_id": c.from_user.id,
                "text": f'{user_info["name"]}\n'
                f'{user_info["phone"]}\n'
                f'Дата регистрации: {user_info["date_registered"].strftime("%d.%m.%Y")}\n'
                f'Баланс: {user_info["balance"]}\n'
                f'Рейтинг: {user_info["rating"]}',
                "reply_markup": custumer_kb.menu(),
            }
        )
    elif call == "video":
        # видео инструкция
        pass
    elif call == "feedback":
        await send_int_tg.priority_queue.put(
            {
                "content_type": "text",
                "chat_id": c.from_user.id,
                "text": "Поддержка клиентов:\nhttps://t.me/TGL_support_bot",
                "parse_mode": "markdown",
            }
        )
    elif call == "link":
        text = f"скопируйте ниже пригласительную ссылку" f"`https://t.me/Elogist_bot?start={c.from_user.id}`"
        await send_int_tg.priority_queue.put(
            {
                "content_type": "text",
                "chat_id": c.from_user.id,
                "text": text,
                "reply_markup": custumer_kb.custumer_main(url_custumer),
                "parse_mode": "markdown",
            }
        )


async def process_pagination(callback_query: types.CallbackQuery):
    page_number = int(callback_query.data.split(":")[1])

    user_info = await custumer_db.find_custumer(callback_query.from_user.id)
    orders = await get_orders.get_orders(callback_query.from_user.id)

    await callback_query.message.edit_text(
        text=f'Всего заявок: {len(user_info["orders"])}\n'
        f'Выполнено: {user_info["order_all"]["done"]}\n'
        f'Отменены: {user_info["order_all"]["cancel"]}',
        reply_markup=custumer_kb.all_bid(orders, page=page_number),
    )
    await callback_query.answer()  # Сообщаем Telegram, что callback был обработан


async def process_order_see(callback_query: types.CallbackQuery):
    _, call = callback_query.data.split(":")
    order = await order_db.find_order(call)

    user_performer = []
    if order["performer"]:
        for perform in order["performer"]:
            formatted_date = order["date"].strftime("%d.%m.%Y")
            type_status = {
                "create": "Создана",
                "wait": "На модерации",
                "canceled": "Отменена",
                "search": "Поиск исполнителя",
                "in_work": "В работе",
            }

            if order["type_order"] == "a_b":
                if order["status"] == "in_work":
                    region = await region_db.find_for_name(order["regions"])
                    performer = await performer_db.find_performer(perform)
                    cars = performer["cars"][order["performer"][str(perform)]]
                    text = (
                        f'Заявка на перевозку из точки А в В #{order["order_number"]} - {type_status.get(order["status"])}\n\n'
                        f'{formatted_date} {order["time"] if order["time"] is not None else ""}\n'
                        f'[{region["region_number"]}] {order["regions"]} - {region["region"][int(order["preregion"])]}, {order["address"]}\n'
                        f'{"↓ " + str(order["distance"]) + " км"}\n'
                        f'{order["drop_address"] if order["drop_address"] is not None else ""}\n'
                        f'Везем: {order["info"]}\n'
                        f'Требования и примечания: {order["requirements"] if order["requirements"] is not None else "нет"}\n'
                        f'Стоимость: {order["price"] if order["price"] is not None else "Ожидаю предложения"}\n\n'
                        f'{performer["name"]}\n'
                        f'{order["type_car"]} - {order["type_tip_car"]}\n'
                        f'{cars["data"][4]} {cars["data"][0]} {cars["data"][1]}\n'
                        f'{performer["phone"]}'
                    )
                    await send_int_tg.priority_queue.put(
                        {
                            "content_type": "text",
                            "chat_id": callback_query.from_user.id,
                            "text": text,
                            "reply_markup": custumer_kb.order_menu_work(callback_query.data),
                        }
                    )
                else:
                    text = (
                        f'Заявка на перевозку из точки А в В  #{order["number_order"]} - {type_status.get(order["status"])}\n\n'
                        f'{order["podtype_car"]} {order["amount_car"] if order["amount_car"] is not None else ""}\n'
                        f'{formatted_date} {order["time"] if order["time"] is not None else ""}\n'
                        f'[{order["region_number"]}] {order["regions"]}, {order["address"]}\n'
                        f'{"↓ " + str(order["distance"]) + " км"}\n'
                        f'{order["address_drop"] if order["address_drop"] is not None else ""}\n'
                        f'Везем: {order["name"]}\n'
                        f'Требования и примечания: {order["requirements"] if order["requirements"] is not None else "нет"}\n'
                        f'Стоимость: {order["cost"] if order["cost"] is not None else "Ожидаю предложения"}'
                    )
                    await send_int_tg.priority_queue.put(
                        {
                            "content_type": "text",
                            "chat_id": callback_query.from_user.id,
                            "text": text,
                            "reply_markup": custumer_kb.order_menu_work(callback_query.data),
                        }
                    )

            elif order["type_order"] == "place":
                region = await region_db.find_for_name(order["regions"])

                if order["status"] == "in_work":
                    performer = await performer_db.find_performer(perform)
                    cars = performer["cars"][order["performer"][str(perform)]]
                    text = (
                        f'Заявка на работу по месту #{order["order_number"]} - {type_status.get(order["status"])}\n\n'
                        f'{formatted_date} {order["time"] if order["time"] is not None else ""}\n'
                        f'[{region["region_number"]}] {order["regions"]} - {region["region"][int(order["preregion"])]}, {order["address"]}\n'
                        f'Требования и примечания: {order["requirements"] if order["requirements"] is not None else "нет"}\n'
                        f'Стоимость: {order["price"] if order["price"] is not None else "Ожидаю предложения"}\n\n'
                        f'{performer["name"]}\n'
                        f'{order["type_car"]} - {order["type_tip_car"]}\n'
                        f'{cars["data"][4]} {cars["data"][0]} {cars["data"][1]}\n'
                        f'{performer["phone"]}'
                    )
                    await send_int_tg.priority_queue.put(
                        {
                            "content_type": "text",
                            "chat_id": callback_query.from_user.id,
                            "text": text,
                            "reply_markup": custumer_kb.order_menu_work(callback_query.data),
                        }
                    )
                else:
                    text = (
                        f'Заявка на работу по месту #{order["order_number"]} - {type_status.get(order["status"])}\n\n'
                        f'{order["podtype_car"]}  {order["amount_car"] if order["amount_car"] is not None else ""}\n'
                        f'{formatted_date} {order["time"] if order["time"] is not None else ""}\n'
                        f'[{region["region_number"]}] {order["regions"]} - {region["region"][int(order["preregion"])]}, {order["address"]}\n'
                        f'Требования и примечания: {order["requirements"] if order["requirements"] is not None else "нет"}\n'
                        f'Стоимость: {order["price"] if order["price"] is not None else "Ожидаю предложения"}'
                    )
                    await send_int_tg.priority_queue.put(
                        {
                            "content_type": "text",
                            "chat_id": callback_query.from_user.id,
                            "text": text,
                            "reply_markup": custumer_kb.order_menu(callback_query.data),
                        }
                    )

            elif order["type_order"] == "people":
                if order["status"] == "in_work":
                    region = await region_db.find_for_name(order["regions"])
                    performer = await performer_db.find_performer(perform)
                    cars = performer["cars"][order["performer"][str(perform)]]
                    text = (
                        f'Заявка на перевозку пассажиров #{order["order_number"]} - {type_status.get(order["status"])}\n\n'
                        f'{formatted_date} {order["time"] if order["time"] is not None else ""}\n'
                        f'[{region["region_number"]}] {order["regions"]} - {region["region"][int(order["preregion"])]}, {order["address"]}\n'
                        f'{"↓ " + str(order["distance"]) + " км | " + str(order["amount_people"]) + " чел"}\n'
                        f'Требования и примечания: {order["requirements"] if order["requirements"] is not None else "нет"}\n'
                        f'Стоимость: {order["price"] if order["price"] is not None else "Ожидаю предложения"}\n\n'
                        f'{performer["name"]}\n'
                        f'{order["type_car"]} - {order["type_tip_car"]}\n'
                        f'{cars["data"][4]} {cars["data"][0]} {cars["data"][1]}\n'
                        f'{performer["phone"]}'
                    )
                    await send_int_tg.priority_queue.put(
                        {
                            "content_type": "text",
                            "chat_id": callback_query.from_user.id,
                            "text": text,
                            "reply_markup": custumer_kb.order_menu_work(callback_query.data),
                        }
                    )

                else:
                    text = (
                        f'Заявка на перевозку пассажиров #{order["order_number"]} - {type_status.get(order["status"])}\n\n'
                        f'{formatted_date} {order["time"] if order["time"] is not None else ""}\n'
                        f'[{order["regions"]}] {order["preregion"]}, {order["address"]}\n'
                        f'{"↓ " + str(order["distance"]) + " км | " + str(order["amount_people"]) + " чел"}\n'
                        f'Требования и примечания: {order["requirements"] if order["requirements"] is not None else "нет"}\n'
                        f'Стоимость: {order["price"] if order["price"] is not None else "Ожидаю предложения"}'
                        f'{order["type_car"]} - {order["type_tip_car"]}\n'
                    )
                    await send_int_tg.priority_queue.put(
                        {
                            "content_type": "text",
                            "chat_id": callback_query.from_user.id,
                            "text": text,
                            "reply_markup": custumer_kb.order_menu(callback_query.data),
                        }
                    )
    else:
        formatted_date = order["date"].strftime("%d.%m.%Y")
        type_status = {
            "create": "Создана",
            "wait": "На модерации",
            "canceled": "Отменена",
            "search": "Поиск исполнителя",
            "in_work": "В работе",
        }
        region = await region_db.find_for_name(order["regions"])

        if order["type_order"] == "people":
            text = (
                f'Заявка на перевозку пассажиров #{order["order_number"]} - {type_status.get(order["status"])}\n\n'
                f'{formatted_date} {order["time"] if order["time"] is not None else ""}\n'
                f'[{region["region_number"]}] {order["regions"]}, {order["address"]}\n'
                f'{"↓ " + str(order["distance"]) + " км | " + str(order["amount_people"]) + " чел"}\n'
                f'Требования и примечания: {order["requirements"] if order["requirements"] is not None else "нет"}\n'
                f'Стоимость: {order["price"] if order["price"] is not None else "Ожидаю предложения"}'
                f'{order["type_car"]} - {order["type_tip_car"]}\n'
            )
        elif order["type_order"] == "a_b":
            text = (
                f'Заявка на перевозку из точки А в В  #{order["order_number"]} - {type_status.get(order["status"])}\n\n'
                f'{order["podtype_car"]} {order["amount_car"] if order["amount_car"] is not None else ""}\n'
                f'{formatted_date} {order["time"] if order["time"] is not None else ""}\n'
                f'[{region["region_number"]}] {order["regions"]}, {order["address"]}\n'
                f'{"↓ " + str(order["distance"]) + " км"}\n'
                f'{order["drop_address"] if order["drop_address"] is not None else ""}\n'
                f'Везем: {order["info"]}\n'
                f'Требования и примечания: {order["requirements"] if order["requirements"] is not None else "нет"}\n'
                f'Стоимость: {order["price"] if order["price"] is not None else "Ожидаю предложения"}'
            )

        elif order["type_order"] == "place":
            text = (
                f'Заявка на работу по месту #{order["order_number"]} - {type_status.get(order["status"])}\n\n'
                f'{order["podtype_car"]}  {order["amount_car"] if order["amount_car"] is not None else ""}\n'
                f'{formatted_date} {order["time"] if order["time"] is not None else ""}\n'
                f'[{region["region_number"]}] {order["regions"]} - {region["region"][int(order["preregion"])]}, {order["address"]}\n'
                f'Требования и примечания: {order["requirements"] if order["requirements"] is not None else "нет"}\n'
                f'Стоимость: {order["price"] if order["price"] is not None else "Ожидаю предложения"}'
            )

        await send_int_tg.priority_queue.put(
            {
                "content_type": "text",
                "chat_id": callback_query.from_user.id,
                "text": text,
                "reply_markup": custumer_kb.order_menu(callback_query.data),
            }
        )


async def process_setting_my_order(c: types.CallbackQuery, state: FSMContext):
    _, status, obj = c.data.split("_")

    if status == "cancel":
        order = await order_db.find_order(obj)
        valid_statuses = ["search", "create"]

        if order["status"] in valid_statuses:
            print(order)
            await custumer_db.update_order_done(c.from_user.id, {"order_all.cancel": 1}, order["order_number"])
            await get_orders.update_order_log(
                order_id=obj, message="Заявка отклонена заказчиком", user_id=c.from_user.id, status="im_cancel"
            )
            orders = await get_orders.get_orders(c.from_user.id)
            await send_int_tg.priority_queue.put(
                {
                    "content_type": "text",
                    "chat_id": c.from_user.id,
                    "text": "заявка была отменена и перенесена в архив",
                    "reply_markup": custumer_kb.all_bid(orders),
                }
            )
        else:
            await state.update_data(order_id=obj)

            await send_int_tg.priority_queue.put(
                {
                    "content_type": "text",
                    "chat_id": c.from_user.id,
                    "text": f'Напишите причину отмены заявки №{order["order_number"]}',
                }
            )
            await MO.CaanceledOrder.Cancel.set()

    elif status == "fin":
        order = await order_db.find_order(obj)
        print(order)
        current_time = datetime.now().strftime("%d.%m.%y %H:%M")
        log_initial_message = {"message": "Заявка закрыта", "date": current_time, "user": int(c.from_user.id)}

        new_log = {
            "message": "Поиск заявок",
            "date": current_time,
        }
        info_server = await server_db.get_tariff()
        url_custumer = info_server["customer_link"]
        url_performer = info_server["performer_link"]
        try:
            if order["suborder"]:
                for objsub in order["suborder"]:
                    print(objsub)
        except:
            pass
        try:
            if order["suborder"]:
                for objsub in order["suborder"]:
                    suborder = await order_db.find_suborder(objsub)
                    performersub = list(suborder["performer"].keys())[0]
                    performer_carsub = suborder["performer"][performersub]

                    await performer_db.update_car_info(int(performersub), performer_carsub, "search", None, new_log)
                    await send_int_tg.priority_queue.put(
                        {
                            "content_type": "text",
                            "chat_id": int(performersub),
                            "text": f'Заявка №{order["order_number"]} помечена как выполненная',
                            "reply_markup": performer_kb.performer_main(url_performer),
                        }
                    )

        except:
            pass

        performer = list(order["performer"].keys())[0]
        performer_car = order["performer"][performer]
        await performer_db.update_car_info(int(performer), performer_car, "search", None, new_log)
        await order_db.update_log(obj, log_initial_message, "finish")
        await custumer_db.update_order_done(c.from_user.id, {"order_all.done": 1}, order["order_number"])

        await send_int_tg.priority_queue.put(
            {
                "content_type": "text",
                "chat_id": c.from_user.id,
                "text": f'Заявка №{order["order_number"]} помечена как выполненная',
                "reply_markup": custumer_kb.custumer_main(url_custumer),
            }
        )
        await send_int_tg.priority_queue.put(
            {
                "content_type": "text",
                "chat_id": int(performer),
                "text": f'Заявка №{order["order_number"]} помечена как выполненная',
                "reply_markup": performer_kb.performer_main(url_performer),
            }
        )
    elif status == "report":
        markup = ReplyKeyboardMarkup(resize_keyboard=True)
        markup.add("Назад")

        await send_int_tg.priority_queue.put(
            {
                "content_type": "text",
                "chat_id": c.from_user.id,
                "text": "Жалоба на исполнителя:",
                "reply_markup": markup,
            }
        )
        await state.update_data(order=obj)
        await WS.Report.RepUser.set()


async def how_need_car(c: types.CallbackQuery):
    _, call, obj = c.data.split(":")
    print(obj, call)
    order = await order_db.find_order(obj)
    servis = await server_db.get_tariff()
    if str(call) == "stop":

        await send_int_tg.priority_queue.put(
            {
                "content_type": "text",
                "chat_id": c.from_user.id,
                "text": f"Заявка в работе",
                "reply_markup": custumer_kb.custumer_main(servis["customer_link"]),
            }
        )
        return
    else:
        if order is None:
            order = await order_db.find_suborder(obj)

            fs, se = order["order_number"].split("-")
            new_order = {
                "order_number": f"{fs}-{int(se) + 1}",
                "type_order": order["type_order"],
                "type_car": order["type_car"],
                "type_tip_car": order["type_tip_car"],
                "podtype_car": order["podtype_car"],
                "amount_car": call,
                "date": order["date"],
                "time": order["time"],
                "send_status": False,
                "address": order["address"],
                "drop_address": order["drop_address"],
                "create_date": order["create_date"],
                "regions": order["regions"],
                "preregion": order["preregion"],
                "requirements": order["requirements"],
                "distance": order["distance"],
                "amount_people": order["amount_people"],
                "info": order["info"],
                "price": order["price"],
                "status": "search",
                "customer": order["customer"],
                "performer": {},
                "tarif": order["tarif"],
                "viptarif": order["viptarif"],
                "send_all": False,
            }
            number = int(se) + 1
        elif order:
            new_order = {
                "order_number": f"{order['order_number']}-1",
                "type_order": order["type_order"],
                "type_car": order["type_car"],
                "type_tip_car": order["type_tip_car"],
                "podtype_car": order["podtype_car"],
                "amount_car": call,
                "date": order["date"],
                "time": order["time"],
                "send_status": False,
                "address": order["address"],
                "drop_address": order["drop_address"],
                "create_date": order["create_date"],
                "regions": order["regions"],
                "preregion": order["preregion"],
                "requirements": order["requirements"],
                "distance": order["distance"],
                "amount_people": order["amount_people"],
                "info": order["info"],
                "price": order["price"],
                "status": "search",
                "customer": order["customer"],
                "performer": {},
                "tarif": order["tarif"],
                "viptarif": order["viptarif"],
                "send_all": False,
            }
            number = 1

        sub_id = await order_db.add_suborder(new_order)
        new_id = sub_id.inserted_id

        current_time = datetime.now().strftime("%d.%m.%y %H:%M")
        log_initial_message = {
            "message": f"Добавлена подзаявка №{number}",
            "date": current_time,
            "user": c.from_user.id,
        }

        await order_db.update_log(order_id=obj, log_initial_message=log_initial_message)
        await order_db.update_suborder(obj, new_id)

        await send_int_tg.priority_queue.put(
            {
                "content_type": "text",
                "chat_id": c.from_user.id,
                "text": f'Возобновлен поиск исполнителей по заявке на перевозку №{order["order_number"]}',
            }
        )


async def cancel_car(c: types.CallbackQuery):
    _, call, obj = c.data.split(":")
    order = await order_db.find_order(obj)
    await send_int_tg.priority_queue.put(
        {
            "content_type": "text",
            "chat_id": call,
            "text": f"Заказчик отказался от вашего предложения по заявке №{order['order_number']}",
            "reply_markup": performer_kb.ok_car(),
        }
    )
    await bot.delete_message(c.from_user.id, c.message.message_id)


async def acept_price_order(c: types.CallbackQuery):
    _, obj, performer_id = c.data.split(":")
    if obj == "del":
        print("надо удалить сообщение")
    else:
        order = await order_db.find_order(obj)
        result = False
        res_2 = False
        if order["performer"] is None:
            new_info = await manege_db.find_order(obj)
            result = True
            order = await order_db.find_order(new_info["order_id"])
            print("1", order)
            if order is None:
                print("2", order)
                order = await order_db.find_suborder(new_info["order_id"])
                res_2 = True

        if order["status"] == "search":
            performer = await performer_db.find_performer(int(performer_id))
            custumer = await custumer_db.find_custumer(c.from_user.id)
            order_info = await manege_db.find_order_obj(obj)
            service_info = await server_db.get_tariff()
            print(order_info)
            car = new_info["performer"][str(performer_id)]["car"]
            user_car = performer["cars"][car]["data"]
            if performer["tariff"]:
                price = order["viptarif"]
            else:
                price = order["tarif"]

            current_time = datetime.now().strftime("%d.%m.%y %H:%M")
            log_initial_message = {
                "message": "Заказчик выбрал исполнителя",
                "date": current_time,
                "user": int(performer_id),
            }
            if result:
                info = {"price": new_info["performer"][str(performer_id)]["new_price"]}
                if res_2:
                    await order_db.update_newsub_info(obj, info)
                else:
                    await order_db.update_new_info(obj, info)
            await order_db.update_info(
                obj=obj, log_initial_message=log_initial_message, performer={performer_id: car}, status="in_work"
            )
            log = {"message": f"🟡 Заявка №{order['order_number']}", "date": current_time}
            await performer_db.taked_order_car(performer_id, car, obj, "work", log, -price, order["order_number"])
            await send_int_tg.priority_queue.put(
                {
                    "content_type": "text",
                    "chat_id": performer_id,
                    "text": f'Заказчик согласился на предложение. Заявка №{order["order_number"]}'
                    f"выкуплена. С баланса списано {price}р.",
                    "reply_markup": performer_kb.performer_main(service_info["performer_link"]),
                }
            )

            if order["type_order"] == "people":
                text = (
                    f"Заявка на перевозку пассажиров  #{order['order_number']}\n\n"
                    f"{order['podtype_car']}\n"
                    f"Дата: {order_setting.format_date_to_russian(order_info['performer'][int(performer_id)]['new_date'])}\n{order['regions']}, {order['address']}\n"
                    f"↓ {order['distance']} | {order['amount_people']} чел\n"
                    f"{order['drop_address']}\n"
                    f"Требования и примечания: {order['requirements']}\n\n"
                    f"Стоимость: {order_info['performer'][int(performer_id)]['new_price']}\n"
                    f"{user_car[2]} {user_car[0]} {user_car[4]}\n\n"
                    f"Телефон для связи с исполнителем: {performer['phone']}"
                )
            elif order["type_order"] == "a_b":
                text = (
                    f"Заявка на перевозку #{order['order_number']}\n\n"
                    f"{order['podtype_car']} в колличестве: {order['amount_car']}\n"
                    f"Дата: {order['date']}\n{order['regions']} , {order['address']}\n"
                    f"↓ {order['distance']}\n"
                    f"{order['drop_address']}\n"
                    f"Везем: {order['info']}\n"
                    f"Требования и примечания: {order['requirements']}\n"
                    f"Стоимость: {order_info['performer'][int(performer_id)]['new_price']}"
                )

            await send_int_tg.priority_queue.put(
                {
                    "content_type": "text",
                    "chat_id": c.from_user.id,
                    "text": text,
                    "reply_markup": custumer_kb.custumer_main(service_info["customer_link"]),
                }
            )
        else:
            await send_int_tg.priority_queue.put(
                {"content_type": "text", "chat_id": c.from_user.id, "text": "Вы уже выбрали исполнителя"}
            )


async def pay_70(c: types.CallbackQuery):
    _, amount = c.data.split(":")
    print(amount)


def register_handler_custumer(dp: Dispatcher):
    dp.register_callback_query_handler(process_customer, lambda c: c.data.startswith("customer_"))
    dp.register_callback_query_handler(process_pagination, lambda c: c.data.startswith("cuspage:"))
    dp.register_callback_query_handler(process_order_see, lambda c: c.data.startswith("cusmyorder:"))
    dp.register_callback_query_handler(process_setting_my_order, lambda c: c.data.startswith("ordmen_"))
    dp.register_callback_query_handler(how_need_car, lambda c: c.data.startswith("mocar:"))
    dp.register_callback_query_handler(cancel_car, lambda c: c.data.startswith("dont:"))
    dp.register_callback_query_handler(pay_70, lambda c: c.data.startswith("pcusp:"))
    dp.register_callback_query_handler(acept_price_order, lambda c: c.data.startswith("jk:"))
