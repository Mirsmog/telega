from packages.bot.create_bot import Dispatcher, types, FSMContext, StatesGroup, State
from packages.bot.service.send_message_service import send_int_tg
from packages.bot.scheamas import user_schema
from packages.bot.database import custumer_db, performer_db, user_db, order_db, manege_db, server_db
from packages.bot.keyboard import main_kb, performer_kb, custumer_kb, order_kb
from packages.bot.service import get_orders
import datetime
import re
from service import order_setting


class DatePrice(StatesGroup):
    AddDate = State()
    AddPrice = State()


class OnlyPrice(StatesGroup):
    PriceOnl = State()


class CaanceledOrder(StatesGroup):
    Cancel = State()


async def process_date_date(m: types.Message, state: FSMContext):
    date_patterns = [
        re.compile(r"^(0[1-9]|[12][0-9]|3[01])[\/\-\.\,\s](0[1-9]|1[0-2])[\/\-\.\,\s](\d{2}|\d{4})$"),
        # шаблон для дат без разделителей
        re.compile(r"^(\d{2})(\d{2})(\d{2}|\d{4})$"),
    ]

    match = None
    for pattern in date_patterns:
        if match := pattern.match(m.text):
            break

    if not match:
        await send_int_tg.priority_queue.put(
            {
                "content_type": "text",
                "chat_id": m.chat.id,
                "text": "Введите дату в корректном формате. Например: 01.01.2023, 01/01/23 или 010123.",
            }
        )

        return

    day, month, year = map(int, match.groups())

    # Если год введен в двузначном формате
    if year < 100:
        year += 2000
    if not (1 <= day <= 31) or not (1 <= month <= 12):
        await send_int_tg.priority_queue.put(
            {
                "content_type": "text",
                "chat_id": m.chat.id,
                "text": "Некорректная дата. Убедитесь, что вы указали допустимое значение для дня и месяца.",
            }
        )
        return
    input_date = datetime.date(year, month, day)

    # Проверяем, является ли введенная дата прошедшей
    if input_date < datetime.date.today():
        await send_int_tg.priority_queue.put(
            {
                "content_type": "text",
                "chat_id": m.chat.id,
                "text": "Дата не может быть раньше сегодняшнего дня. Введите корректную дату.",
            }
        )
        return

    # Проверяем, является ли введенная дата более чем на 1 год позже текущей даты
    one_year_later = datetime.date.today() + datetime.timedelta(days=365)
    if input_date > one_year_later:
        await send_int_tg.priority_queue.put(
            {
                "content_type": "text",
                "chat_id": m.chat.id,
                "text": "Дата не может быть более чем на 1 год позже текущей даты. Введите корректную дату.",
            }
        )
        return

    await state.update_data(new_date=input_date)

    await send_int_tg.priority_queue.put(
        {"content_type": "text", "chat_id": m.chat.id, "text": "Укажите предлагаемую стоимость"}
    )
    await DatePrice.AddPrice.set()


async def process_date_price(m: types.Message, state: FSMContext):
    if not m.text.isdigit():
        await send_int_tg.priority_queue.put(
            {"content_type": "text", "chat_id": m.chat.id, "text": "Введите корректную цену (только числа)."}
        )
        return
    else:
        await state.update_data(new_price=m.text)
    # TODO: нужно добавить выбор машины
    data = await state.get_data()
    print(data)
    order = await order_db.find_order(data["obj"])
    cara = await order_setting.chechk_car(user_id=m.from_user.id, order=order)
    print(cara)
    user_info = await performer_db.find_performer(m.from_user.id)
    user_car = user_info["cars"][cara[0]]["data"]

    await send_int_tg.priority_queue.put(
        {
            "content_type": "text",
            "chat_id": m.chat.id,
            "text": f"Предложение по заявке на перевозку #{order['order_number']} "
            f"отправлено заказчику.\n\n"
            f"Дата: {order_setting.format_date_to_russian(data['new_date'])}\n"
            f"Стоимость: {data['new_price']}р.",
        }
    )
    if order["type_order"] == "people":

        text = (
            f"Заявка на перевозку пассажиров  #{order['order_number']}\n\n"
            f"{order['type_car']}\n"
            f"Дата: {order_setting.format_date_to_russian(data['new_date'])}\n{order['regions']}, {order['address']}\n"
            f"↓ {order['distance']} км| {order['amount_people']} чел\n"
            f"{order['drop_address']}\n"
            f"Требования и примечания: {order['requirements']}\n\n"
            f"Стоимость: {data['new_price']} рублей\n"
            f"{user_car[2]} {user_car[0]} {user_car[4]}"
        )

    elif order["type_order"] == "a_b":
        text = (
            f"Заявка на перевозку #{order['order_number']}\n\n"
            f"{order['type_car']} в колличестве: {order['amount_car']}\n"
            f"Дата: {data['new_date']}\n{order['regions']}, {order['address']}\n"
            f"↓ {order['distance']} км\n"
            f"{order['drop_address']}\n"
            f"Везем: {order['info']}\n"
            f"Требования и примечания: {order['requirements']}\n"
            f"Стоимость: {data['new_price']} рублей\n"
            f"{user_car[2]} {user_car[0]} {user_car[4]}"
        )
    elif order["type_order"] == "place":
        text = (
            f"Заявка на cпецтехнику  #{order['order_number']}\n\n"
            f"{order['type_car']}"
            f"Дата: {order['arrival_date']}\n[{order['region_number']}] {order['region']}, {order['address']}\n"
            f"Требования и примечания: {order['requirements']}\n"
            f"Стоимость: {order['new_price']} рублей\n"
            f"{user_car[2]} {user_car[0]} {user_car[4]}"
        )
    current_time = datetime.datetime.now().strftime("%d.%m.%y %H:%M")
    log_initial_message = {
        "message": f"Предложение цены и даты: {data['new_price']} рублей/ {data['new_date']}",
        "date": current_time,
        "user": m.from_user.id,
    }
    await order_db.update_log(order["_id"], log_initial_message)
    date_obj = datetime.datetime(data["new_date"].year, data["new_date"].month, data["new_date"].day)
    pos = await manege_db.upsert_order(data["obj"], m.from_user.id, False, date_obj, data["new_price"])
    await send_int_tg.priority_queue.put(
        {
            "content_type": "text",
            "chat_id": order["customer"],
            "text": text,
            "reply_markup": custumer_kb.order_new(user_info["user_id"], cara[0], data["obj"], pos),
        }
    )
    await state.finish()


async def process_price_order(m: types.Message, state: FSMContext):
    if not m.text.isdigit():
        await send_int_tg.priority_queue.put(
            {"content_type": "text", "chat_id": m.chat.id, "text": "Введите корректную цену (только числа)."}
        )
        return
    else:
        print("???")
        print(m.text)
        await state.update_data(new_price=int(m.text))
        data = await state.get_data()
        order = await order_db.find_order(data["obj"])
        service_info = await server_db.get_tariff()
        if order["type_order"] == "people":
            text = (
                f"Заявка на перевозку пассажиров  #{order['order_number']}\n\n"
                f"{order['type_car']}\n"
                f"Дата: {order_setting.format_date_to_russian(order['date'])}\n{order['regions']}, {order['address']}\n"
                f"↓ {order['distance']} км| {order['amount_people']} чел\n"
                f"{order['drop_address']}\n"
                f"Требования и примечания: {order['requirements']}\n\n"
                f"Новая Стоимость: {int(m.text)}\n"
                f"{order['type_tip_car']}"
            )
        elif order["type_order"] == "a_b":
            text = (
                f"Заявка на перевозку #{order['order_number']}\n\n"
                f"{order['type_car']} в количестве: {order['amount_car']}\n"
                f"Дата: {order['date']}\n{order['regions']} , {order['address']}\n"
                f"↓ {order['distance']} км\n"
                f"{order['drop_address']}\n"
                f"Везем: {order['info']}\n"
                f"Требования и примечания: {order['requirements']}\n"
                f"Новая Стоимость: {int(m.text)}\n"
                f"{order['type_tip_car']}"
            )
        elif order["type_order"] == "place":
            # TODO: поправить
            text = (
                f"Заявка на перевозку #{order['order_number']}\n\n"
                f"{order['type_car']} в количестве: {order['amount_car']}\n"
                f"Дата: {order['date']}\n{order['regions']} , {order['address']}\n"
                f"↓ {order['distance']} км\n"
                f"{order['drop_address']}\n"
                f"Везем: {order['info']}\n"
                f"Требования и примечания: {order['requirements']}\n"
                f"Новая Стоимость: {int(m.text)}\n"
                f"{order['type_tip_car']}"
            )

        await manege_db.upsert_order(data["obj"], m.from_user.id, False, new_price=data["new_price"], car=data["cars"])
        await send_int_tg.priority_queue.put(
            {
                "content_type": "text",
                "chat_id": int(order["customer"]),
                "text": text,
                "reply_markup": custumer_kb.acept_price(data["obj"], m.from_user.id),
            }
        )
        await send_int_tg.priority_queue.put(
            {
                "content_type": "text",
                "chat_id": m.from_user.id,
                "text": "Ваше предложение было отправлено",
                "reply_markup": performer_kb.performer_main(service_info["performer_link"]),
            }
        )
        await state.finish()


"""async def process_buy_order(c: types.CallbackQuery):
    _, call = c.data.split(":")
    print(_, call)"""


async def process_take_order(c: types.CallbackQuery):
    print(c.data)

    _, performer_id, car, obj = c.data.split(":")
    order = await order_db.find_order(obj)
    result = False
    res_2 = False
    if order is None:
        new_info = await manege_db.find_order_obj(obj)
        result = True
        order = await order_db.find_order(new_info["order_id"])
        if order is None:
            order = await order_db.find_suborder(new_info["order_id"])
            res_2 = True

    if order["status"] == "search":
        performer = await performer_db.find_performer(performer_id)
        custumer = await custumer_db.find_custumer(c.from_user.id)
        order_info = await manege_db.find_order_obj(obj)
        user_car = performer["cars"][car]["data"]
        if performer["tariff"]:
            price = order["viptarif"]
        else:
            price = order["tarif"]

        current_time = datetime.datetime.now().strftime("%d.%m.%y %H:%M")
        log_initial_message = {"message": "Выкуп заявки", "date": current_time, "user": int(performer_id)}
        if result:
            info = {
                "date": new_info["performer"][str(performer)]["new_date"],
                "price": new_info["performer"][str(performer)]["new_price"],
            }
            if res_2:
                await order_db.update_newsub_info(obj, info)
            else:
                await order_db.update_new_info(obj, info)
        await order_db.update_info(
            obj=obj, log_initial_message=log_initial_message, performer={performer_id: car}, status="in_work"
        )
        log = {"message": f"🟡 Заявка №{order['order_number']}", "date": current_time}
        await performer_db.taked_order_car(performer_id, car, obj, "work", log, -price, order_info["order_number"])
        await send_int_tg.priority_queue.put(
            {
                "content_type": "text",
                "chat_id": performer_id,
                "text": f'Заказчик согласился на предложение. Заявка №{order["order_number"]}'
                f"выкуплена. С баланса списано {price}р.",
            }
        )

        if order["type_order"] == "people":
            print(order)
            text = (
                f"Заявка на перевозку пассажиров  #{order['order_number']}\n\n"
                f"{order['type_car']}\n"
                f"Дата: {order_setting.format_date_to_russian(order_info['performer'][performer_id]['new_date'])} {order['arrival_time']}\n{order['regions']}, {order['address']}\n"
                f"↓ {order['distance']} км| {order['amount_people']} чел\n"
                f"{order['drop_address']}\n"
                f"Требования и примечания: {order['requirements']}\n\n"
                f"Стоимость: {order_info['performer'][performer_id]['new_price']} рублей\n"
                f"{user_car[2]} {user_car[0]} {user_car[4]}\n\n"
                f"Телефон для связи с исполнителем: {performer['phone']}"
            )
        elif order["type_order"] == "a_b":
            text = (
                f"Заявка на перевозку #{order['order_number']}\n\n"
                f"{order['type_car']} в количестве: {order['amount_car']}\n"
                f"Дата: {order['date']}\n{order['region']} , {order['address']}\n"
                f"↓ {order['distance']} км\n"
                f"{order['drop_address']}\n"
                f"Везем: {order['info']}\n"
                f"Требования и примечания: {order['requirements']}\n"
                f"Стоимость: {order['price']} рублей"
            )

        await send_int_tg.priority_queue.put({"content_type": "text", "chat_id": c.from_user.id, "text": text})
    else:
        await send_int_tg.priority_queue.put(
            {"content_type": "text", "chat_id": c.from_user.id, "text": "Вы уже выбрали исполнителя"}
        )


async def process_cancel_order(m: types.message, state: FSMContext):
    text = m.text
    data = await state.get_data()
    service = await server_db.get_tariff()
    order = await order_db.find_order(data["order_id"])
    custumer = await custumer_db.find_custumer(m.from_user.id)
    current_time = datetime.datetime.now().strftime("%d.%m.%y %H:%M")
    log = {"message": f"в поиске заявок", "date": current_time}
    performer = list(order["performer"].keys())[0]

    await state.finish()
    await get_orders.update_order_log(
        order_id=data["order_id"],
        message=f"Заявка отклонена заказчиком," f"По причине\n\n" f"{m.text}",
        user_id=m.from_user.id,
        status="im_cancel",
    )
    await performer_db.update_car_info(int(performer), order["performer"][performer], "search", None, log)
    try:
        if order["suborder"]:
            for suborder in order["suborder"]:
                ord = await order_db.find_suborder(suborder)
                perfosub = list(ord["performer"].keys())[0]
                carsub = ord["performer"][perfosub]
                await performer_db.update_car_info(int(perfosub), carsub, "search", None, log)
    except:
        pass
    await send_int_tg.priority_queue.put(
        {
            "content_type": "text",
            "chat_id": performer,
            "text": f'Заказчиaк {custumer["name"]} отменил заявку №{order["order_number"]}\n\n' f"Причина: {text}",
        }
    )
    await send_int_tg.priority_queue.put(
        {
            "content_type": "text",
            "chat_id": m.from_user.id,
            "text": f'заявка №{order["order_number"]} отменена',
            "reply_markup": custumer_kb.custumer_main(service["customer_link"]),
        }
    )
    await state.finish()


def register_manege_order(dp: Dispatcher):
    # dp.register_callback_query_handler(process_buy_order, lambda c: c.data.startswith("proorder:"))
    dp.register_message_handler(process_date_date, state=DatePrice.AddDate)
    dp.register_message_handler(process_date_price, state=DatePrice.AddPrice)
    dp.register_message_handler(process_price_order, state=OnlyPrice.PriceOnl)
    dp.register_callback_query_handler(process_take_order, lambda c: c.data.startswith("pt:"))
    dp.register_message_handler(process_cancel_order, state=CaanceledOrder.Cancel)
