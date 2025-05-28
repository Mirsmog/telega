from packages.bot.create_bot import Dispatcher, types, FSMContext, StatesGroup, State, bot, ReplyKeyboardMarkup
from packages.bot.service.send_message_service import send_int_tg
from packages.bot.scheamas import user_schema
from packages.bot.database import (
    custumer_db,
    performer_db,
    user_db,
    server_db,
    order_db,
    region_db,
    payments_db,
    paymentinfo_db,
)
from packages.bot.keyboard import main_kb, performer_kb, custumer_kb
from datetime import datetime
from service import get_names, order_setting, get_orders, get_text_from_user
from handlers import manage_order
from handlers.end_work import work_performer as WP


async def process_performer(c: types.CallbackQuery):
    statuss = ["im_cancel", "canceled", "finish", "pf_cancel"]
    _, call = c.data.split("_")
    info_server = await server_db.get_tariff()

    url_performer = info_server["performer_link"]
    print(call)
    if call == "order":
        user_info = await performer_db.find_performer(c.from_user.id)
        if user_info["orders"]:
            orders = await get_orders.get_orders_per(c.from_user.id)
        else:
            orders = []

        await send_int_tg.send_with_limit(
            content_type="text",
            chat_id=c.from_user.id,
            text=f'Всего заявок: {len(user_info["orders"])}\n'
            f'Выполнено: {user_info["order_all"]["done"]}\n'
            f'Отменены: {user_info["order_all"]["cancel"]}',
            reply_markup=performer_kb.all_bid(orders),
        )

    elif call == "tech":
        text = "Ваши машины"
        user_info = await performer_db.find_performer(c.from_user.id)
        await send_int_tg.priority_queue.put(
            {
                "content_type": "text",
                "chat_id": c.from_user.id,
                "text": text,
                "reply_markup": performer_kb.per_tech(user_info=user_info["cars"]),
            }
        )

    elif call == "region":
        user_info = await performer_db.find_performer(c.from_user.id)
        text = get_names.result_txt_dict(user_info["all_regions"])
        await send_int_tg.priority_queue.put(
            {
                "content_type": "text",
                "chat_id": c.from_user.id,
                "text": "Регионы получения заявок:\n" + text,
                "reply_markup": performer_kb.region_editor(),
            }
        )
    elif call == "profile":
        user_info = await performer_db.find_performer(c.from_user.id)
        await send_int_tg.priority_queue.put(
            {
                "content_type": "text",
                "chat_id": c.from_user.id,
                "text": f'{user_info["name"]}\n'
                f'{user_info["phone"]}\n'
                f'Дата регистрации: {user_info["date_registered"].strftime("%d.%m.%Y")}\n'
                f'Баланс: {user_info["balance"]}\n'
                f'Рейтинг: {user_info["rating"]}',
                "reply_markup": performer_kb.menu_perfomer_profile(),
            }
        )
    elif call == "balance":
        user_info = await performer_db.find_performer(c.from_user.id)
        await send_int_tg.send_with_limit(
            content_type="text",
            chat_id=c.from_user.id,
            text=f'{user_info["name"]}\n'
            f'{user_info["phone"]}\n'
            f'Дата регистрации: {user_info["date_registered"].strftime("%d.%m.%Y")}\n'
            f'Баланс: {user_info["balance"]}\n'
            f'Рейтинг: {user_info["rating"]}',
            reply_markup=performer_kb.menu_perfomer_balance(),
        )
    elif call == "tariff":
        text = (
            "Тариф “Оптимальный” действует при пополнении баланса от 2000р.\n\n"
            "[77] Москва\n“Разовый”: 300р./заявка\n“Оптимальный”: 200р./заявка\n\n"
            "[33] Владимирская область\nг. Владимир\n“Разовый”: 250р./заявка\n"
            "“Оптимальный”: 170р./заявка\n------------\nПетушинский район\n"
            "“Разовый”: 250р./заявка\n“Оптимальный”: 170р./заявка\n------------\n"
            "Остальные территории\n“Разовый”: 200р./заявка\n“Оптимальный”: 150р./заявка"
            "\n\n[23] Краснодарский край\nг. Краснодар\n“Разовый”: 350р./заявка\n"
            "“Оптимальный”: 220р./заявка\n------------\nг. Сочи\n“Разовый”: 350р./заявка\n"
            "“Оптимальный”: 220р./заявка\n------------\nОстальные территории\n"
            "“Разовый”: 200р./заявка\n“Оптимальный”: 150р./заявка"
        )
        await send_int_tg.priority_queue.put(
            {"content_type": "text", "chat_id": c.from_user.id, "text": text, "reply_markup": performer_kb.per_tarif()}
        )

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
        # поделиться ссылкой
        text = f"скопируйте ниже пригласительную ссылку" f"`https://t.me/Elogist_bot?start={c.from_user.id}`"
        await send_int_tg.priority_queue.put(
            {
                "content_type": "text",
                "chat_id": c.from_user.id,
                "text": text,
                "reply_markup": performer_kb.performer_main(url_performer),
                "parse_mode": "markdown",
            }
        )
    elif call == "editregions":
        user_info = await performer_db.find_performer(c.from_user.id)
        await send_int_tg.priority_queue.put(
            {
                "content_type": "text",
                "chat_id": c.from_user.id,
                "text": "Укажите регион поиска [техники] (номер региона)",
                "reply_markup": performer_kb.region_pre(user_info["all_regions"]),
            }
        )


async def process_new_car(c: types.CallbackQuery):
    text = "Выбор техники"
    category_car = await server_db.get_category_car()
    await send_int_tg.priority_queue.put(
        {
            "content_type": "text",
            "chat_id": c.from_user.id,
            "text": text,
            "reply_markup": performer_kb.add_car(category_car),
        }
    )


async def about_car(c: types.CallbackQuery):
    car = c.data.split(":")[1]
    status = c.data.split(":")[2]
    user_info = await performer_db.find_performer(c.from_user.id)
    car_name = user_info["cars"][car]["data"][3]
    pod_tipe = user_info["cars"][car]["data"][4]
    number_car = user_info["cars"][car]["data"][1]
    per_car_name = user_info["cars"][car]["data"][0]

    if status == "work" or status == "in_work":
        type_status = {
            "create": "Создана",
            "wait": "На модерации",
            "canceled": "Отменена",
            "search": "Поиск исполнителя",
            "in_work": "В работе",
        }
        print(user_info["cars"][car]["order_id"])
        order = await order_db.find_order(user_info["cars"][car]["order_id"])
        if order is None:
            order = await order_db.find_suborder(user_info["cars"][car]["order_id"])
        print(order)
        region = await region_db.find_for_name(order["regions"])
        formatted_date = order["date"].strftime("%d.%m.%Y")
        cars = user_info["cars"][car]
        if order["type_order"] == "people":
            text = (
                f'Заявка на перевозку пассажиров #{order["order_number"]} - {type_status.get(order["status"])}\n\n'
                f'{formatted_date} {order["time"] if order["time"] is not None else ""}\n'
                f'[{region["region_number"]}] {order["regions"]} - {region["region"][int(order["preregion"])]}, {order["address"]}\n'
                f'{"↓ " + str(order["distance"]) + " км | " + str(order["amount_people"]) + " чел"}\n'
                f'Требования и примечания: {order["requirements"] if order["requirements"] is not None else "нет"}\n'
                f'Стоимость: {order["price"] if order["price"] is not None else "Ожидаю предложения"}\n\n'
                f'{user_info["name"]}\n'
                f'{order["type_car"]} - {order["type_tip_car"]}\n'
                f'{cars["data"][4]} {cars["data"][0]} {cars["data"][1]}\n'
                f'{user_info["phone"]}'
            )
        elif order["type_order"] == "a_b":
            text = (
                f'Заявка на перевозку из точки А в В #{order["order_number"]} - {type_status.get(order["status"])}\n\n'
                f'{formatted_date} {order["time"] if order["time"] is not None else ""}\n'
                f'[{region["region_number"]}] {order["regions"]} - {region["region"][int(order["preregion"])]}, {order["address"]}\n'
                f'{"↓ " + str(order["distance"]) + " км"}\n'
                f'{order["drop_address"] if order["drop_address"] is not None else ""}\n'
                f'Везем: {order["info"]}\n'
                f'Требования и примечания: {order["requirements"] if order["requirements"] is not None else "нет"}\n'
                f'Стоимость: {order["price"] if order["price"] is not None else "Ожидаю предложения"}\n\n'
                f'{user_info["name"]}\n'
                f'{order["type_car"]} - {order["type_tip_car"]}\n'
                f'{cars["data"][4]} {cars["data"][0]} {cars["data"][1]}\n'
                f'{user_info["phone"]}'
            )

        elif order["type_order"] == "place":
            text = (
                f'Заявка на работу по месту #{order["order_number"]} - {type_status.get(order["status"])}\n\n'
                f'{formatted_date} {order["time"] if order["time"] is not None else ""}\n'
                f'[{region["region_number"]}] {order["regions"]} - {region["region"][int(order["preregion"])]}, {order["address"]}\n'
                f'Требования и примечания: {order["requirements"] if order["requirements"] is not None else "нет"}\n'
                f'Стоимость: {order["price"] if order["price"] is not None else "Ожидаю предложения"}\n\n'
                f'{user_info["name"]}\n'
                f'{order["type_car"]} - {order["type_tip_car"]}\n'
                f'{cars["data"][4]} {cars["data"][0]} {cars["data"][1]}\n'
                f'{user_info["phone"]}'
            )
        await send_int_tg.priority_queue.put(
            {
                "content_type": "text",
                "chat_id": c.from_user.id,
                "text": text,
                "reply_markup": performer_kb.info_for_car(),
            }
        )

    elif status == "search":

        text = f'{car_name} - {"" if pod_tipe is None else pod_tipe+": "}{per_car_name}, г/н:{number_car} - в поиске заявок'
        await send_int_tg.send_with_limit(
            content_type="text", chat_id=c.from_user.id, text=text, reply_markup=performer_kb.about_car(car, status)
        )
    elif status == "stop":
        text = f"{car_name} - {pod_tipe}: {per_car_name}, г/н:{number_car} - поиск приостановлен"
        await send_int_tg.send_with_limit(
            content_type="text", chat_id=c.from_user.id, text=text, reply_markup=performer_kb.about_car(car, status)
        )


async def process_car(callback_query: types.CallbackQuery):
    _, car, status = callback_query.data.split(":")
    user_info = await performer_db.find_performer(callback_query.from_user.id)
    car_info = user_info["cars"][car]["data"]
    car_name = user_info["cars"][car]["data"][3]
    pod_tipe = user_info["cars"][car]["data"][4]
    if status == "stop":
        text = (
            f"Поиск заявок для техники\n\n"
            f"{car_name}, {pod_tipe}, {car_info[0]}, г/н: {car_info[1]}\n\n"
            f"приостановлен"
        )
        current_time = datetime.now().strftime("%d.%m.%y %H:%M")
        log = {"message": "⏸ Поиск приостановлен", "date": current_time}
        stat = "stop"
        await performer_db.car_status_update(callback_query.from_user.id, car, stat, log)
        user_info = await performer_db.find_performer(callback_query.from_user.id)
        await send_int_tg.priority_queue.put(
            {
                "content_type": "text",
                "chat_id": callback_query.from_user.id,
                "text": text,
                "reply_markup": performer_kb.per_tech(user_info["cars"]),
            }
        )
    elif status == "delete":
        text = f"Техника\n\n" f"{car_name}, {pod_tipe}, {car_info[0]}, г/н: {car_info[1]}\n\n" f"будет удалена.."

        await send_int_tg.priority_queue.put(
            {
                "content_type": "text",
                "chat_id": callback_query.from_user.id,
                "text": text,
                "reply_markup": performer_kb.process_del(car),
            }
        )
    elif status == "search":
        text = (
            f"Поиск заявок для техники\n\n"
            f"{car_name}, {pod_tipe}, {car_info[0]}, г/н: {car_info[1]}\n\n"
            f"возобновлен."
        )
        current_time = datetime.now().strftime("%d.%m.%y %H:%M")
        log = {"message": "▶ Поиск заявок", "date": current_time}
        stat = "search"
        await performer_db.car_status_update(callback_query.from_user.id, car, stat, log)
        user_info = await performer_db.find_performer(callback_query.from_user.id)
        await send_int_tg.priority_queue.put(
            {
                "content_type": "text",
                "chat_id": callback_query.from_user.id,
                "text": text,
                "reply_markup": performer_kb.per_tech(user_info["cars"]),
            }
        )


async def delete_car(callback_query: types.CallbackQuery):
    car = callback_query.data.split(":")[1]
    user_info = await performer_db.find_performer(callback_query.from_user.id)
    car_info = user_info["cars"][car]["data"]

    text = f"Техника\n\n" f"{car_info[3]}, {car_info[4]}, {car_info[0]}, г/н: {car_info[1]}\n\n" f"удалена."

    current_time = datetime.now().strftime("%d.%m.%y %H:%M")
    log = {"message": "удалена", "date": current_time}
    stat = "delete"
    await performer_db.car_status_update(callback_query.from_user.id, car, stat, log)
    user_info = await performer_db.find_performer(callback_query.from_user.id)
    await send_int_tg.send_with_limit(
        content_type="text",
        chat_id=callback_query.from_user.id,
        text=text,
        reply_markup=performer_kb.per_tech(user_info["cars"]),
    )


async def processe_delete(c: types.CallbackQuery):
    _, regagions = c.data.split("_")

    await performer_db.set_all_false(c.from_user.id, regagions)
    user_info = await performer_db.find_performer(c.from_user.id)
    text = get_names.result_txt_dict(user_info["all_regions"])
    await send_int_tg.priority_queue.put(
        {
            "content_type": "text",
            "chat_id": c.from_user.id,
            "text": "Регионы получения заявок:\n" + text,
            "reply_markup": performer_kb.region_editor(),
        }
    )


async def delete_reg(c: types.CallbackQuery):
    user_info = await performer_db.find_performer(c.from_user.id)

    await send_int_tg.priority_queue.put(
        {
            "content_type": "text",
            "chat_id": c.from_user.id,
            "text": "Выберите какой регион удалить",
            "reply_markup": performer_kb.delete_region(user_info["all_regions"]),
        }
    )


async def page_handler_reg(query: types.CallbackQuery):
    page_number = int(query.data.split("_")[1])
    user_info = await performer_db.find_performer(query.from_user.id)
    markup = performer_kb.region_pre(regions=user_info["all_regions"], page=page_number)
    await bot.edit_message_text(
        chat_id=query.message.chat.id,
        message_id=query.message.message_id,
        text="Укажите регион поиска [техники] (номер региона)",
        reply_markup=markup,
    )


async def process_preregion(c: types.CallbackQuery):
    await send_int_tg.priority_queue.put(
        {
            "content_type": "text",
            "chat_id": c.from_user.id,
            "text": "Выбрать регион из списка",
            "reply_markup": await performer_kb.subtype_pre(c.from_user.id, c.data),
        }
    )


async def subregio_register(callback_query: types.CallbackQuery):
    subtype_id = callback_query.data.split(":")[0].split("_")[1]
    user_id = callback_query.from_user.id
    message_id = callback_query.message.message_id
    try:
        region_code = callback_query.data.split(":")[1].split("_")[1]
    except:
        region_code = callback_query.data.split(":")[1]
    if ":all" in callback_query.data:
        await performer_db.update_all_buttons_to_true(user_id, region_code)
        new_keyboard = await performer_kb.subtype_pre(user_id, region_code)
        await bot.edit_message_reply_markup(chat_id=user_id, message_id=message_id, reply_markup=new_keyboard)
    else:
        page = callback_query.data.split(":")[2]
        start_index = (int(page) - 1) * 12
        ind = str(start_index + int(subtype_id))
        await performer_kb.on_button_click(user_id, region_code, message_id, ind, page)


async def pay_now(callback_query: types.CallbackQuery):
    _, amount = callback_query.data.split("_")
    user_info = await user_db.find_user(callback_query.from_user.id)
    if amount == "70":
        await send_int_tg.send_with_limit(
            content_type="text",
            chat_id=callback_query.from_user.id,
            text="Бесплатно можно подать 2 заявки в день." "Размещение каждой последующей заявки стоит 70р.",
            reply_markup=performer_kb.pay(amount),
        )
    elif amount == "now":
        info_server = await server_db.get_tariff()
        tariff = info_server["minimal_tarif"]
        await send_int_tg.priority_queue.put(
            {
                "content_type": "text",
                "chat_id": callback_query.from_user.id,
                "text": f"Пополнить баланс можно на сумму от {tariff} р.. "
                "После пополнения будет действовать тариф “Оптимальный”.",
                "reply_markup": await performer_kb.pay_now(who=user_info["performer"]),
            }
        )
    else:
        print("я тут?")
        # TODO: - тут надо добавить 5 кнопок с пополнить на или ввести свое значение
        info_server = await server_db.get_tariff()
        tariff = info_server["minimal_tarif"]
        print("hello?")
        await send_int_tg.priority_queue.put(
            {
                "content_type": "text",
                "chat_id": callback_query.from_user.id,
                "text": f"Пополнить баланс можно на сумму от {tariff} р.. "
                "После пополнения будет действовать тариф “Оптимальный”.",
                "reply_markup": await performer_kb.pay_now(amount=amount, user_id=callback_query.from_user.id),
            }
        )
        print("hello2")


async def order_take(c: types.CallbackQuery, state: FSMContext):
    _, call, obj = c.data.split(":")
    order = await order_db.find_order(obj)

    user_info = await performer_db.find_performer(c.from_user.id)
    servis = await server_db.get_tariff()
    if order:

        url_performer = servis["performer_link"]
        if order["status"] == "search":
            if call == "buy":
                if int(order["tarif"]) > int(user_info["balance"]) and int(user_info["balance"]) >= 0:
                    text = (
                        f"Чтобы предложить свою стоимость"
                        f"на балансе должно хватиать средств на выкуп заявки.\n\n"
                        f"Выкуп заявки произойдет если заказчик согласится на "
                        f"предложенную стоимость.\n\n"
                        f'Баланс: {user_info["balance"]}\n\n'
                        f"Тариф\n"
                        f'{order["regions"]}\n'
                        f'{order["preregion"]}\n'
                        f'"Разовый": {order["tarif"]}р./заявка\n'
                        f'"Оптимальный": {order["viptarif"]}р./заявка'
                    )
                    await send_int_tg.priority_queue.put(
                        {
                            "content_type": "text",
                            "chat_id": c.from_user.id,
                            "text": text,
                            "reply_markup": performer_kb.fats_buy(order["tarif"]),
                        }
                    )
                    return
                elif int(user_info["balance"]) - int(order["tarif"]) < 0:
                    text = (
                        f"при оплате вам не хватит средств"
                        f"Чтобы предложить свою стоимость"
                        f"на балансе должно хватиать средств на выкуп заявки.\n\n"
                        f"Выкуп заявки произойдет если заказчик согласится на "
                        f"предложенную стоимость.\n\n"
                        f'Баланс: {user_info["balance"]}\n\n'
                        f"Тариф\n"
                        f'{order["regions"]}\n'
                        f'{order["preregion"]}\n'
                        f'"Разовый": {order["tarif"]}р./заявка\n'
                        f'"Оптимальный": {order["viptarif"]}р./заявка'
                    )
                    await send_int_tg.priority_queue.put(
                        {
                            "content_type": "text",
                            "chat_id": c.from_user.id,
                            "text": text,
                            "reply_markup": performer_kb.fats_buy(order["tarif"]),
                        }
                    )
                else:
                    user_id = c.from_user.id
                    operation = await paymentinfo_db.count_doc()
                    date = datetime.now()
                    if user_info["tariff"]:

                        text = (
                            f'Заявка #{order["order_number"]} выкуплена. \nС баланса списано {order["viptarif"]}р\n\n'
                            f"Выберите технику, которая будет \nвыполнять заявку"
                        )
                        coment = f'Выкуп заявки #{order["order_number"]} Оптимальный'

                        await paymentinfo_db.add_info(
                            user_id=user_id,
                            coment=coment,
                            operation=operation,
                            date=date,
                            amount=int(order["viptarif"]),
                            status="Списание",
                            who="performer",
                        )
                    else:
                        coment = f'Выкуп заявки #{order["order_number"]} разовый'
                        text = (
                            f'Заявка #{order["order_number"]} выкуплена. \nС баланса списано {order["tarif"]}р\n\n'
                            f"Выберите технику, которая будет \nвыполнять заявку"
                        )
                        await paymentinfo_db.add_info(
                            user_id=user_id,
                            coment=coment,
                            operation=operation,
                            date=date,
                            amount=int(order["tarif"]),
                            status="Списание",
                            who="performer",
                            order_id=None,
                        )
                    await performer_db.add_order(user_id, order["order_number"], obj)
                    cars = await order_setting.chechk_car(user_id, order)

                    if len(cars) == 1:

                        await order_setting.get_onecar(cars[0], c.from_user.id, str(obj))
                        text_2 = f'В рамках заявки искали {order["amount_car"]} ед. техники. Сколько единиц техники еще найти?'
                        await send_int_tg.priority_queue.put(
                            {
                                "content_type": "text",
                                "chat_id": order["customer"],
                                "text": text_2,
                                "reply_markup": custumer_kb.how_car(int(order["amount_car"]), obj),
                            }
                        )
                    else:

                        await performer_db.update_order(c.from_user.id, obj, False)
                        await send_int_tg.priority_queue.put(
                            {
                                "content_type": "text",
                                "chat_id": c.from_user.id,
                                "text": text,
                                "reply_markup": performer_kb.buy_order(cars, user_info, obj),
                            }
                        )
            elif call == "dat":
                text = "Укажите предпологаемую дату в формате дд.мм.гг(например 01.01.24)"
                await send_int_tg.priority_queue.put({"content_type": "text", "chat_id": c.from_user.id, "text": text})
                await state.update_data(obj=obj)
                await manage_order.DatePrice.AddDate.set()

            elif call == "pri":
                valid_cars = []
                user = await performer_db.find_performer(c.from_user.id)
                for car in user["cars"]:
                    set1 = set([order["type_car"], order["type_tip_car"], order["podtype_car"]])
                    set2 = set(user["cars"][car]["data"])
                    if set1.issubset(set2) and user["cars"][car]["status"] == "search":
                        valid_cars.append({car: user["cars"][car]})

                await state.update_data(obj=obj)
                text = "Выберите машину для выполнения заявки"
                await send_int_tg.priority_queue.put(
                    {
                        "content_type": "text",
                        "chat_id": c.from_user.id,
                        "text": text,
                        "reply_markup": performer_kb.get_car(valid_cars),
                    }
                )

        else:
            await bot.delete_message(c.message.chat.id, c.message.message_id)
            await send_int_tg.priority_queue.put(
                {
                    "content_type": "text",
                    "chat_id": c.from_user.id,
                    "text": "Заявка уже в работе!",
                    "reply_markup": performer_kb.performer_main(url_performer),
                }
            )
    else:

        order = await order_db.find_suborder(obj)
        url_performer = servis["performer_link"]
        if order["status"] == "search":
            if call == "buy":
                if int(order["tarif"]) > int(user_info["balance"]) and int(user_info["balance"]) > 0:
                    text = (
                        f"Чтобы предложить свою стоимость"
                        f"на балансе должны быть средства на выкуп заявки.\n\n"
                        f"Выкуп заявки произойдет, если заказчик согласится на "
                        f"предложенную стоимость.\n\n"
                        f'Баланс: {user_info["balance"]}\n\n'
                        f"Тариф\n"
                        f'{order["regions"]}\n'
                        f'{order["preregion"]}\n'
                        f'"Разовый": {order["tarif"]}р./заявка\n'
                        f'"Оптимальный": {order["viptarif"]}р./заявка'
                    )
                    await send_int_tg.priority_queue.put(
                        {
                            "content_type": "text",
                            "chat_id": c.from_user.id,
                            "text": text,
                            "reply_markup": performer_kb.fats_buy(order["tarif"]),
                        }
                    )
                else:
                    if user_info["tariff"]:

                        text = (
                            f'Заявка #{order["order_number"]} выкуплена. \nС баланса списано {order["viptarif"]}р\n\n'
                        )
                    else:
                        text = f'Заявка #{order["order_number"]} выкуплена. \nС баланса списано {order["tarif"]}р\n\n'

                    # TODO: тут надо сделать проверку на машины которые достуупны у юзера и передать их списком в кнопку
                    # если у юзера подходит 1 машина сразу отправляется заявка, если несколько высираем кнопки
                    # прости будущий я мне было лень это делать 16 сентября

                    cars = await order_setting.chechk_car(c.from_user.id, order)
                    if len(cars) == 1:

                        info_server = await server_db.get_tariff()
                        url = info_server["performer_link"]

                        # await performer_db.update_order(c.from_user.id, obj, False)

                        await order_setting.car_update_work(c.from_user.id, cars[0], "work", order["order_number"], obj)
                        await order_db.update_performer_sub(obj, {str(c.from_user.id): cars[0]})
                        await send_int_tg.priority_queue.put(
                            {
                                "content_type": "text",
                                "chat_id": c.from_user.id,
                                "text": "Вы выкупили заявку, ваши контакты, переданы заказчику",
                                "reply_markup": performer_kb.performer_main(url),
                            }
                        )
                        region = await region_db.find_for_name(order["regions"])
                        performer = await performer_db.find_performer(c.from_user.id)
                        cars = performer["cars"][cars[0]]
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
                                f'[{region["region_number"]}] {order["regions"]} - {region["region"][int(order["preregion"])]}, {order["address"]}\n'
                                f'{"↓ " + str(order["distance"]) + " км | " + str(order["amount_people"]) + " чел"}\n'
                                f'Требования и примечания: {order["requirements"] if order["requirements"] is not None else "нет"}\n'
                                f'Стоимость: {order["price"] if order["price"] is not None else "Ожидаю предложения"}\n\n'
                                f'{performer["name"]}\n'
                                f'{order["type_car"]} - {order["type_tip_car"]}\n'
                                f'{cars["data"][4]} {cars["data"][0]} {cars["data"][1]}\n'
                                f'{performer["phone"]}'
                            )

                        elif order["type_order"] == "a_b":
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

                        elif order["type_order"] == "place":
                            text = (
                                f'Заявка на работу по месту #{order["number_order"]} - {type_status.get(order["status"])}\n\n'
                                f'{formatted_date} {order["time"] if order["time"] is not None else ""}\n'
                                f'[{region["region_number"]}] {order["regions"]} - {region["region"][int(order["preregion"])]}, {order["address"]}\n'
                                f'Требования и примечания: {order["requirements"] if order["requirements"] is not None else "нет"}\n'
                                f'Стоимость: {order["cost"] if order["cost"] is not None else "Ожидаю предложения"}\n\n'
                                f'{performer["name"]}\n'
                                f'{order["type_car"]} - {order["type_tip_car"]}\n'
                                f'{cars["data"][4]} {cars["data"][0]} {cars["data"][1]}\n'
                                f'{performer["phone"]}'
                            )
                    else:

                        await send_int_tg.priority_queue.put(
                            {
                                "content_type": "text",
                                "chat_id": c.from_user.id,
                                "text": text + f"Выберите технику, которая будет \nвыполнять заявку",
                                "reply_markup": performer_kb.buy_order(cars, user_info, obj),
                            }
                        )
                    if int(order["amount_car"]) == 1:

                        await send_int_tg.priority_queue.put(
                            {
                                "content_type": "text",
                                "chat_id": order["customer"],
                                "text": text,
                                "reply_markup": custumer_kb.order_menu_work(f"{order['customer']}:{obj}"),
                            }
                        )
                    else:
                        await send_int_tg.priority_queue.put(
                            {"content_type": "text", "chat_id": order["customer"], "text": text}
                        )
                        text_2 = f'В рамках заявки искали {order["amount_car"]} ед. техники. Сколько единиц техники еще найти?'
                        await send_int_tg.priority_queue.put(
                            {
                                "content_type": "text",
                                "chat_id": order["customer"],
                                "text": text_2,
                                "reply_markup": custumer_kb.how_car(int(order["amount_car"]), obj),
                            }
                        )
            elif call == "dat":
                text = "Укажите предполагаемую дату в формате дд.мм.гг(например 01.01.24)"
                await send_int_tg.priority_queue.put({"content_type": "text", "chat_id": c.from_user.id, "text": text})
                await state.update_data(obj=obj)
                await manage_order.DatePrice.AddDate.set()

            elif call == "pri":
                pass
        else:
            await bot.delete_message(c.message.chat.id, c.message.message_id)
            await send_int_tg.priority_queue.put(
                {
                    "content_type": "text",
                    "chat_id": c.from_user.id,
                    "text": "Заявка уже в работе!",
                    "reply_markup": performer_kb.performer_main(url_performer),
                }
            )


async def buy_fast(c: types.CallbackQuery):
    _, call, obj = c.data.split(":")
    print(call)
    info_server = await server_db.get_tariff()
    url = info_server["performer_link"]

    await performer_db.update_order(c.from_user.id, obj, False)
    current_time = datetime.now().strftime("%d.%m.%y %H:%M")
    log_initial_message = {"message": "Выкуп заявки", "date": current_time, "user": c.from_user.id}

    await order_db.update_info(obj, log_initial_message, {str(c.from_user.id): call}, "in_work")
    await performer_db.update_order(c.from_user.id, obj, False)
    order = await order_db.find_order(obj)
    if order is None:
        order = await order_db.find_suborder(obj)
    await order_setting.car_update_work(c.from_user.id, call, "in_work", order["order_number"], obj)
    await send_int_tg.priority_queue.put(
        {
            "content_type": "text",
            "chat_id": c.from_user.id,
            "text": "Вы выкупили заявку, ваши контакты, переданы заказчику",
            "reply_markup": performer_kb.performer_main(url),
        }
    )
    region = await region_db.find_for_name(order["regions"])
    performer = await performer_db.find_performer(c.from_user.id)
    cars = performer["cars"][call]
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
            f'[{region["region_number"]}] {order["regions"]} - {region["region"][int(order["preregion"])]}, {order["address"]}\n'
            f'{"↓ " + str(order["distance"]) + " км | " + str(order["amount_people"]) + " чел"}\n'
            f'Требования и примечания: {order["requirements"] if order["requirements"] is not None else "нет"}\n'
            f'Стоимость: {order["price"] if order["price"] is not None else "Ожидаю предложения"}\n\n'
            f'{performer["name"]}\n'
            f'{order["type_car"]} - {order["type_tip_car"]}\n'
            f'{cars["data"][4]} {cars["data"][0]} {cars["data"][1]}\n'
            f'{performer["phone"]}'
        )

    elif order["type_order"] == "a_b":
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

    elif order["type_order"] == "place":
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

    if int(order["amount_car"]) == 1:

        await send_int_tg.priority_queue.put(
            {
                "content_type": "text",
                "chat_id": order["customer"],
                "text": text,
                "reply_markup": custumer_kb.order_menu_work(f"{order['customer']}:{obj}"),
            }
        )
    else:
        await send_int_tg.priority_queue.put({"content_type": "text", "chat_id": order["customer"], "text": text})
        text_2 = f'В рамках заявки искали {order["amount_car"]} ед. техники. Сколько единиц техники еще найти?'
        await send_int_tg.priority_queue.put(
            {
                "content_type": "text",
                "chat_id": order["customer"],
                "text": text_2,
                "reply_markup": custumer_kb.how_car(int(order["amount_car"]), obj),
            }
        )


async def process_pagination_per(callback_query: types.CallbackQuery):
    page_number = int(callback_query.data.split(":")[1])

    user_info = await performer_db.find_performer(callback_query.from_user.id)
    orders = await get_orders.get_orders_per(callback_query.from_user.id)

    await callback_query.message.edit_text(
        text=f'Всего заявок: {len(user_info["orders"])}\n'
        f'Выполнено: {user_info["order_all"]["done"]}\n'
        f'Отменены: {user_info["order_all"]["cancel"]}',
        reply_markup=performer_kb.all_bid(orders, page=page_number),
    )
    await callback_query.answer()  # Сообщаем Telegram, что callback был обработан


async def process_order_performer(c: types.CallbackQuery, state: FSMContext):
    _, call = c.data.split(":")
    swap = False
    order = await order_db.find_order(call)
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
                    chek_car = await order_setting.chechk_car(c.from_user.id, order)
                    if chek_car != []:
                        swap = True
                    region = await region_db.find_for_name(order["regions"])
                    performer = await performer_db.find_performer(perform)
                    custumer = await custumer_db.find_custumer(order["customer"])
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
                        f'{performer["phone"]}\n'
                        f'Имя заказчика {custumer["name"]}\n'
                        f'{custumer["phone"]}'
                    )
                    await send_int_tg.priority_queue.put(
                        {
                            "content_type": "text",
                            "chat_id": c.from_user.id,
                            "text": text,
                            "reply_markup": performer_kb.order_menu_work(c.data, swap=swap),
                        }
                    )
                else:
                    text = (
                        f'Заявка на перевозку из точки А в В  #{order["number_order"]} - {type_status.get(order["status"])}\n\n'
                        f'{order["type_car"]} {order["amount_car"] if order["amount_car"] is not None else ""}\n'
                        f'{formatted_date} {order["time"] if order["time"] is not None else ""}\n'
                        f'[{order["region_number"]}] {order["regions"]}, {order["address"]}\n'
                        f'{"↓ " + str(order["distance"]) + " км"}\n'
                        f'{order["address_drop"] if order["address_drop"] is not None else ""}\n'
                        f'Везем: {order["name"]}\n'
                        f'Требования и примечания: {order["requirements"] if order["requirements"] is not None else "нет"}\n'
                        f'Стоимость: {order["price"] if order["price"] is not None else "Ожидаю предложения"}'
                    )

                    await send_int_tg.priority_queue.put(
                        {
                            "content_type": "text",
                            "chat_id": c.from_user.id,
                            "text": text,
                            "reply_markup": performer_kb.order_menu(c.data),
                        }
                    )

            elif order["type_order"] == "place":
                region = await region_db.find_for_name(order["regions"])

                if order["status"] == "in_work":
                    chek_car = await order_setting.chechk_car(c.from_user.id, order)
                    if chek_car != []:
                        swap = True
                    performer = await performer_db.find_performer(perform)
                    custumer = await custumer_db.find_custumer(order["customer"])
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
                        f'{performer["phone"]}\n'
                        f'Имя заказчика {custumer["name"]}\n'
                        f'{custumer["phone"]}'
                    )
                    await send_int_tg.priority_queue.put(
                        {
                            "content_type": "text",
                            "chat_id": c.from_user.id,
                            "text": text,
                            "reply_markup": performer_kb.order_menu_work(c.data, swap=swap),
                        }
                    )
                else:
                    text = (
                        f'Заявка на работу по месту #{order["order_number"]} - {type_status.get(order["status"])}\n\n'
                        f'{order["type_car"]}  {order["amount_car"] if order["amount_car"] is not None else ""}\n'
                        f'{formatted_date} {order["time"] if order["time"] is not None else ""}\n'
                        f'[{region["region_number"]}] {order["regions"]} - {region["region"][int(order["preregion"])]}, {order["address"]}\n'
                        f'Требования и примечания: {order["requirements"] if order["requirements"] is not None else "нет"}\n'
                        f'Стоимость: {order["price"] if order["price"] is not None else "Ожидаю предложения"}'
                    )
                    await send_int_tg.priority_queue.put(
                        {
                            "content_type": "text",
                            "chat_id": c.from_user.id,
                            "text": text,
                            "reply_markup": performer_kb.order_menu(c.data),
                        }
                    )

            elif order["type_order"] == "people":
                if order["status"] == "in_work" or order["status"] == "work":
                    region = await region_db.find_for_name(order["regions"])
                    performer = await performer_db.find_performer(perform)
                    custumer = await custumer_db.find_custumer(order["customer"])
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
                        f'{performer["phone"]}\n'
                        f'Имя заказчика {custumer["name"]}\n'
                        f'{custumer["phone"]}'
                    )
                    await send_int_tg.priority_queue.put(
                        {
                            "content_type": "text",
                            "chat_id": c.from_user.id,
                            "text": text,
                            "reply_markup": performer_kb.order_menu_work(c.data),
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
                            "chat_id": c.from_user.id,
                            "text": text,
                            "reply_markup": performer_kb.order_menu(c.data),
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
            )
        elif order["type_order"] == "a_b":
            text = (
                f'Заявка на перевозку из точки А в В  #{order["order_number"]} - {type_status.get(order["status"])}\n\n'
                f'{order["type_car"]} {order["amount_car"] if order["amount_car"] is not None else ""}\n'
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
                f'{order["type_car"]}  {order["amount_car"] if order["amount_car"] is not None else ""}\n'
                f'{formatted_date} {order["time"] if order["time"] is not None else ""}\n'
                f'[{region["region_number"]}] {order["regions"]} - {region["region"][int(order["preregion"])]}, {order["address"]}\n'
                f'Требования и примечания: {order["requirements"] if order["requirements"] is not None else "нет"}\n'
                f'Стоимость: {order["price"] if order["price"] is not None else "Ожидаю предложения"}'
            )

        await send_int_tg.priority_queue.put(
            {
                "content_type": "text",
                "chat_id": c.from_user.id,
                "text": text,
                "reply_markup": performer_kb.order_menu(c.data),
            }
        )


async def manage_order_status(c: types.CallbackQuery, state):
    _, status, obj = c.data.split("_")

    if status == "cancel":
        markup = ReplyKeyboardMarkup(resize_keyboard=True)
        markup.add("Назад")

        await send_int_tg.priority_queue.put(
            {"content_type": "text", "chat_id": c.from_user.id, "text": "Причина отмены:", "reply_markup": markup}
        )
        await state.update_data(order=obj)
        await WP.CancelPF.CancUserPF.set()
    elif status == "report":
        markup = ReplyKeyboardMarkup(resize_keyboard=True)
        markup.add("Назад")

        await send_int_tg.priority_queue.put(
            {"content_type": "text", "chat_id": c.from_user.id, "text": "Жалоба на заказчика:", "reply_markup": markup}
        )
        await state.update_data(order=obj)
        await WP.ReportPF.RepUserPF.set()
    elif status == "swap":
        order = await order_db.find_order(obj)
        performer = await performer_db.find_performer(c.from_user.id)
        free_car = await order_setting.chechk_car(c.from_user.id, order=order)
        await state.update_data(user_car=order["performer"][str(c.from_user.id)], obj=obj)
        await send_int_tg.priority_queue.put(
            {
                "content_type": "text",
                "chat_id": c.from_user.id,
                "text": "Выберите машину для замены",
                "reply_markup": performer_kb.change_car(free_car, performer["cars"], obj),
            }
        )


async def car_dont(c: types.CallbackQuery):
    await bot.delete_message(c.from_user.id, c.message.message_id)


async def change_car(c: types.CallbackQuery, state: FSMContext):
    data = await state.get_data()
    _, car_ch, obj = c.data.split(":")
    old_car = data["user_car"]
    order = await order_db.find_order(obj)
    performer = await performer_db.find_performer(c.from_user.id)
    current_time = datetime.now().strftime("%d.%m.%y %H:%M")
    log = {"message": f"В поиске заявок, машина заменена", "date": current_time}
    await performer_db.update_car_info(c.from_user.id, old_car, "search", None, log)
    await order_setting.car_update_work(c.from_user.id, car_ch, "in_work", order["order_number"], obj=obj)
    log_order = {"message": "Замена машины", "date": current_time, "user": c.from_user.id}
    await order_db.car_new_info(obj, car_ch, str(c.from_user.id), log_order)
    text = await get_text_from_user.get_text(order, performer, car_ch)
    await send_int_tg.priority_queue.put({"content_type": "text", "chat_id": order["customer"], "text": text})
    await send_int_tg.priority_queue.put(
        {"content_type": "text", "chat_id": c.from_user.id, "text": "Ваше имя и номер телефона были переданы заказчику"}
    )
    await state.finish()


async def process_pafe_callback(callback_query: types.CallbackQuery):

    await bot.answer_callback_query(callback_query.id)
    page, region_code_data = callback_query.data.split(":")[1].split("@")
    page = int(page)
    keyboard = await performer_kb.subtype_pre(callback_query.from_user.id, region_code_data=region_code_data, page=page)
    await bot.edit_message_reply_markup(
        callback_query.from_user.id, callback_query.message.message_id, reply_markup=keyboard
    )


async def handle_podregion_pagination(c: types.CallbackQuery, state: FSMContext):
    try:
        info, rego = c.data.split("@")
        j, page = info.split(":")
        _, reg = rego.split("_")
        page = int(page) + 1
        # data = await state.get_data()
        # region = await region_db.find_region(reg)
        # result = region['region']

        await send_int_tg.priority_queue.put(
            {
                "content_type": "text",
                "chat_id": c.from_user.id,
                "text": "Выберите район",
                "reply_markup": await performer_kb.subtype_pre(
                    user_id=c.from_user.id, page=page, regi=reg, region_code_data=rego
                ),
                "parse_mode": "markdown",
            }
        )
    except:
        pass


async def process_car_price(c: types.CallbackQuery, state: FSMContext):
    _, call = c.data.split(":")
    await state.update_data(cars=call)
    text = "Напишите предлагаемую цену"
    await send_int_tg.priority_queue.put({"content_type": "text", "chat_id": c.from_user.id, "text": text})

    await manage_order.OnlyPrice.PriceOnl.set()


def register_handler_performer(dp: Dispatcher):
    dp.register_callback_query_handler(process_performer, lambda c: c.data.startswith("performer_"))
    dp.register_callback_query_handler(manage_order_status, lambda c: c.data.startswith("ordper_"))
    dp.register_callback_query_handler(process_new_car, lambda c: c.data == "registernewcar")
    dp.register_callback_query_handler(about_car, lambda c: c.data.startswith("percarteg:"))
    dp.register_callback_query_handler(process_car, lambda c: c.data.startswith("carproces"))
    dp.register_callback_query_handler(delete_car, lambda c: c.data.startswith("deletecar:"))
    dp.register_callback_query_handler(processe_delete, lambda c: c.data.startswith("delreg_"))
    dp.register_callback_query_handler(delete_reg, lambda c: c.data == "deletereg")
    dp.register_callback_query_handler(page_handler_reg, lambda c: c.data.startswith("page_"))
    dp.register_callback_query_handler(process_preregion, lambda c: c.data.startswith("prereg_"))
    dp.register_callback_query_handler(subregio_register, lambda c: c.data.startswith("subpreg_"))
    dp.register_callback_query_handler(pay_now, lambda c: c.data.startswith("payz_"))
    dp.register_callback_query_handler(order_take, lambda c: c.data.startswith("takeorder:"))
    dp.register_callback_query_handler(buy_fast, lambda c: c.data.startswith("ordbyu:"))
    dp.register_callback_query_handler(process_pagination_per, lambda c: c.data.startswith("perpage:"))
    dp.register_callback_query_handler(process_order_performer, lambda c: c.data.startswith("perforder:"))
    dp.register_callback_query_handler(car_dont, lambda c: c.data == "cardontok")
    dp.register_callback_query_handler(change_car, lambda c: c.data.startswith("chca:"))
    dp.register_callback_query_handler(process_pafe_callback, lambda c: c.data.startswith("pafe:"))
    dp.register_callback_query_handler(process_car_price, lambda c: c.data.startswith("khg:"))
