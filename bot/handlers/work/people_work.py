from packages.bot.create_bot import (
    StatesGroup,
    State,
    dp,
    Dispatcher,
    types,
    FSMContext,
    KeyboardButton,
    ReplyKeyboardMarkup,
)
from packages.bot.service.send_message_service import send_int_tg
import datetime
import re
from packages.bot.database import order_db, user_db, custumer_db, server_db, region_db
from packages.bot.keyboard import custumer_kb, service_kb
from packages.bot.scheamas import Create_order


class PeopleWork(StatesGroup):
    GetAdress = State()
    GetDropAdress = State()
    GetPeople = State()
    GetDistance = State()
    GetDate = State()
    GetTime = State()
    GetRecomends = State()
    GetPrice = State()
    Ready = State()

    EditAdress = State()
    EditDropAdress = State()
    EditPeople = State()
    EditDistance = State()
    EditDate = State()
    EditTime = State()
    EditRecomends = State()
    EditPrice = State()


def edit_p_markup():
    markup = ReplyKeyboardMarkup(resize_keyboard=True)
    markup.add("Все верно, продолжить")
    markup.add("Редактировать адрес подачи")
    markup.add("Редактировать конечный адрес")
    markup.add("Редактировать дату")
    markup.add("Редактировать пассажиров")
    markup.add("Редактировать расстояние")
    markup.add("Редактировать требования")
    markup.add("Редактировать стоимость")
    markup.add("Редактировать время")
    return markup


async def p_process_address(m: types.Message, state: FSMContext):
    if not m.text.strip():  # Проверяем, что введенная строка не пуста
        await send_int_tg.priority_queue.put(
            {"content_type": "text", "chat_id": m.chat.id, "text": "Введите корректный адрес."}
        )
        return

    await state.update_data(address=m.text)

    await PeopleWork.GetDropAdress.set()
    await send_int_tg.priority_queue.put(
        {"content_type": "text", "chat_id": m.chat.id, "text": "Укажите адрес высадки."}
    )


async def p_process_drop_address(m: types.Message, state: FSMContext):
    if not m.text.strip():  # Проверяем, что введенная строка не пуста
        await send_int_tg.priority_queue.put(
            {"content_type": "text", "chat_id": m.chat.id, "text": "Введите корректный адрес."}
        )
        return

    await state.update_data(drop_address=m.text)
    await PeopleWork.GetPeople.set()
    await send_int_tg.priority_queue.put(
        {"content_type": "text", "chat_id": m.chat.id, "text": "Укажите количество пассажиров."}
    )


async def p_process_people(m: types.Message, state: FSMContext):
    if not m.text.isdigit():
        await send_int_tg.priority_queue.put(
            {
                "content_type": "text",
                "chat_id": m.chat.id,
                "text": "Введите корректное количество пассажиров (только числа).",
            }
        )
        return
    else:
        await state.update_data(people=m.text)

    await PeopleWork.GetDistance.set()
    await send_int_tg.priority_queue.put(
        {
            "content_type": "text",
            "chat_id": m.chat.id,
            "text": "Сколько километров от места отправления до места назначения?",
        }
    )


async def p_process_distance(m: types.Message, state: FSMContext):
    if not m.text.isdigit():
        await send_int_tg.priority_queue.put(
            {"content_type": "text", "chat_id": m.chat.id, "text": "Введите корректное растояние (только числа)."}
        )
        return
    else:
        await state.update_data(distance=m.text)

    await PeopleWork.GetDate.set()
    skip_button = KeyboardButton("Пропустить")
    await send_int_tg.priority_queue.put(
        {
            "content_type": "text",
            "chat_id": m.chat.id,
            "text": "Укажите дату подачи транспорта в формате дд.мм.гггг (например 12.06.2023).",
            "reply_markup": ReplyKeyboardMarkup(resize_keyboard=True).add(skip_button),
        }
    )


async def p_process_data(m: types.Message, state: FSMContext):
    if m.text == "Пропустить" or m.text == "пропустить":
        await state.update_data(arrival_date=None, arrival_time=None)
        await PeopleWork.GetRecomends.set()
        skip_button = KeyboardButton("Пропустить")
        await send_int_tg.priority_queue.put(
            {
                "content_type": "text",
                "chat_id": m.chat.id,
                "text": "Требования к перевозке и примечания.",
                "reply_markup": ReplyKeyboardMarkup(resize_keyboard=True).add(skip_button),
            }
        )
        return

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

    if not (1 <= day <= 31) or not (1 <= month <= 12):
        await send_int_tg.priority_queue.put(
            {
                "content_type": "text",
                "chat_id": m.chat.id,
                "text": "Некорректная дата. Убедитесь, что вы указали допустимое значение для дня и месяца.",
            }
        )
        return

    # Если год введен в двузначном формате
    if year < 100:
        year += 2000

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

    await state.update_data(arrival_date=input_date)

    await PeopleWork.GetTime.set()
    skip_button = KeyboardButton("Пропустить")
    await send_int_tg.priority_queue.put(
        {
            "content_type": "text",
            "chat_id": m.chat.id,
            "text": "Укажите время подачи техники в формате чч:мм (например 9:00)” или нажмите / Пропустить.",
            "reply_markup": ReplyKeyboardMarkup(resize_keyboard=True).add(skip_button),
        }
    )


async def p_process_time(m: types.Message, state: FSMContext):
    if m.text == "Пропустить":
        await state.update_data(arrival_time="")
    else:
        time_patterns = [
            # шаблон для времени с разделителем (например, 12:12)
            re.compile(r"^(0[0-9]|[0-9]|1[0-9]|2[0-3]):([0-5][0-9]|[0-9])$"),
            # шаблон для времени без разделителя (например, 1212)
            re.compile(r"^(0[0-9]|[0-9]|1[0-9]|2[0-3])([0-5][0-9]|[0-9])$"),
            re.compile(r"^(0[0-9]|[0-9]|1[0-9]|2[0-3])\.([0-5][0-9]|[0-9])$"),
            # шаблон для времени с разделителем "," (например, 12,12)
            re.compile(r"^(0[0-9]|[0-9]|1[0-9]|2[0-3]),([0-5][0-9]|[0-9])$"),
            # шаблон для времени с разделителем "-" (например, 12-12)
            re.compile(r"^(0[0-9]|[0-9]|1[0-9]|2[0-3])-([0-5][0-9]|[0-9])$"),
        ]

        match = None
        for pattern in time_patterns:
            if match := pattern.match(m.text):
                break

        if not match:
            await send_int_tg.priority_queue.put(
                {
                    "content_type": "text",
                    "chat_id": m.chat.id,
                    "text": "Введите время в корректном формате. Например: 12:12 или 1212.",
                }
            )

            return

        hour, minute = map(int, match.groups())
        # преобразуем время к формату 12:12
        formatted_time = f"{hour:02d}:{minute:02d}"

        await state.update_data(arrival_time=formatted_time)
    await PeopleWork.GetRecomends.set()
    skip_button = KeyboardButton("Пропустить")
    await send_int_tg.priority_queue.put(
        {
            "content_type": "text",
            "chat_id": m.chat.id,
            "text": "Требования к перевозке и примечания.",
            "reply_markup": ReplyKeyboardMarkup(resize_keyboard=True).add(skip_button),
        }
    )


async def p_process_requiments(m: types.Message, state: FSMContext):
    if m.text == "Пропустить":
        await state.update_data(requirements="Нет уточнений")
    else:
        await state.update_data(requirements=m.text)

    await PeopleWork.GetPrice.set()
    skip_button = KeyboardButton("Не указывать, получать предложения")
    await send_int_tg.priority_queue.put(
        {
            "content_type": "text",
            "chat_id": m.chat.id,
            "text": "Укажите стоимость работ.",
            "reply_markup": ReplyKeyboardMarkup(resize_keyboard=True).add(skip_button),
        }
    )


async def p_process_price(m: types.Message, state: FSMContext):
    # Если сообщение является специфическим ответом, который не требует числового значения
    if m.text == "Не указывать, получать предложения":
        await state.update_data(price="Жду предложения")
    # Проверяем, что введенные данные являются числом
    elif not m.text.isdigit():
        await send_int_tg.priority_queue.put(
            {"content_type": "text", "chat_id": m.chat.id, "text": "Укажите стоимость в виде числа."}
        )
        return
    else:
        await state.update_data(price=m.text)

    await PeopleWork.Ready.set()

    data = await state.get_data()

    order = await order_db.get_orders()
    try:
        order_number = int(order["order_number"]) + 1

    except:
        order_number = 1

    preview_text = (
        f"Заявка на перевозку пассажиров  #{order_number}\n\n"
        f"{data['pod_type'] if data['pod_type'] is not None else data['category']}\n"
        f"Дата: {data['arrival_date']} {data['arrival_time'] if data['arrival_time'] else ''}\n"
        f"[{data['region_number']}] {data['region']}, {data['address']}\n"
        f"↓ {data['distance']} КМ | {data['people']} чел\n"
        f"{data['drop_address']}\n"
        f"Требования и примечания: {data['requirements']}\n"
        f"Стоимость: {data['price']}"
    )
    await send_int_tg.priority_queue.put(
        {"content_type": "text", "chat_id": m.chat.id, "text": preview_text, "reply_markup": edit_p_markup()}
    )


# TODO: это делаем вконце по аналогии с AB


async def process_ready(m: types.Message, state: FSMContext):
    data = await state.get_data()
    info_server = await server_db.get_tariff()

    url_performer = info_server["performer_link"]
    url_custumer = info_server["customer_link"]

    if data["requirements"] == "Пропустить":
        data["requirements"] = None
    if data["price"] == "Жду предложения":
        data["price"] = None

    order = await order_db.get_orders()

    try:

        order_number = int(order["order_number"]) + 1

    except:
        order_number = 1

    current_time = datetime.datetime.now().strftime("%d.%m.%y %H:%M")
    log_initial_message = [{"message": "заявка создана", "date": current_time, "user": m.from_user.id}]
    # TODO : надо придумать как формируется тариф
    region_info = await region_db.find_for_name(data["region"])

    new_order = await Create_order.create_order(
        type_order="people",
        type_car=f"{data['category']}",
        order_number=order_number,
        type_tip_car=f"{data['type_name']}",
        podtype_car=f"{data['pod_type']}",
        amount_car=data["amount_car"],
        regions=data["region"],
        region_number=region_info["region_number"],
        preregion=data["preregion"],
        date=data["arrival_date"],
        amount_people=data["people"],
        address=data["address"],
        drop_address=data["drop_address"],
        distance=data["distance"],
        time=data["arrival_time"],
        requirements=data["requirements"],
        price=data["price"],
        send_status=False,
        send_all=False,
        customer=m.from_user.id,
        tariff=region_info["tarif"],
        viptarif=region_info["viptarif"],
        create_date=datetime.datetime.now(),
        log=log_initial_message,
    )
    await state.finish()
    log_user = {"message": f"создана заявка #{order_number}", "date": current_time}
    await custumer_db.update_order(m.from_user.id, new_order.inserted_id, order_number, log_user)
    await send_int_tg.priority_queue.put(
        {
            "content_type": "text",
            "chat_id": m.chat.id,
            "text": f"Заявка #{order_number}, отправлена на модерацию",
            "reply_markup": custumer_kb.custumer_main(url_custumer),
        }
    )
    text = (
        f"Заявка на перевозку пассажиров  #{order_number}\n\n"
        f"{data['pod_type'] if data['pod_type'] is not None else data['category']}\n"
        f"Дата: {data['arrival_date']} {data['arrival_time'] if data['arrival_time'] else ''}\n"
        f"[{data['region_number']}] {data['region']}, {data['address']}\n"
        f"↓ {data['distance']} КМ | {data['people']} чел\n"
        f"{data['drop_address']}\n"
        f"Требования и примечания: {data['requirements']}\n"
        f"Стоимость: {data['price']}"
    )

    await send_int_tg.priority_queue.put(
        {
            "content_type": "text",
            "chat_id": -1001969553521,
            "text": text,
            "reply_markup": service_kb.yes_or_no(new_order.inserted_id),
        }
    )


async def start_edit_address_p(m: types.Message):
    await send_int_tg.send_with_limit(content_type="text", chat_id=m.chat.id, text="Введите новый адрес")

    await PeopleWork.EditAdress.set()


async def edit_address_p(m: types.Message, state: FSMContext):
    current_data = await state.get_data()
    current_data["address"] = m.text
    await state.set_data(current_data)
    data = await state.get_data()
    order = await order_db.get_orders()
    try:
        order_number = int(order["order_number"]) + 1

    except:
        order_number = 1

    preview_text = (
        f"Заявка на перевозку пассажиров  #{order_number}\n\n"
        f"{data['pod_type'] if data['pod_type'] is not None else data['category']}\n"
        f"Дата: {data['arrival_date']} {data['arrival_time'] if data['arrival_time'] else ''}\n"
        f"[{data['region_number']}] {data['region']}, {data['address']}\n"
        f"↓ {data['distance']} КМ | {data['people']} чел\n"
        f"{data['drop_address']}\n"
        f"Требования и примечания: {data['requirements']}\n"
        f"Стоимость: {data['price']}"
    )
    await send_int_tg.priority_queue.put(
        {"content_type": "text", "chat_id": m.chat.id, "text": preview_text, "reply_markup": edit_p_markup()}
    )
    await PeopleWork.Ready.set()


async def start_edit_drop_address_p(m: types.Message):
    await send_int_tg.send_with_limit(content_type="text", chat_id=m.chat.id, text="Введите новый конечный адрес.")

    await PeopleWork.EditDropAdress.set()


async def do_edit_drop_adress_p(m: types.Message, state: FSMContext):
    current_data = await state.get_data()
    current_data["drop_address"] = m.text
    await state.set_data(current_data)
    data = await state.get_data()
    order = await order_db.get_orders()
    try:
        order_number = int(order["order_number"]) + 1

    except:
        order_number = 1

    preview_text = (
        f"Заявка на перевозку пассажиров  #{order_number}\n\n"
        f"{data['pod_type'] if data['pod_type'] is not None else data['category']}\n"
        f"Дата: {data['arrival_date']} {data['arrival_time'] if data['arrival_time'] else ''}\n"
        f"[{data['region_number']}] {data['region']}, {data['address']}\n"
        f"↓ {data['distance']} КМ | {data['people']} чел\n"
        f"{data['drop_address']}\n"
        f"Требования и примечания: {data['requirements']}\n"
        f"Стоимость: {data['price']}"
    )
    await send_int_tg.priority_queue.put(
        {"content_type": "text", "chat_id": m.chat.id, "text": preview_text, "reply_markup": edit_p_markup()}
    )

    await PeopleWork.Ready.set()


async def start_edit_process_people_p(m: types.Message):
    await send_int_tg.priority_queue.put(
        {"content_type": "text", "chat_id": m.chat.id, "text": "Введите новое количество пассажиров."}
    )

    await PeopleWork.EditPeople.set()


async def do_edit_people_p(m: types.Message, state: FSMContext):
    if not m.text.isdigit():
        await send_int_tg.send_with_limit(
            content_type="text", chat_id=m.chat.id, text="Введите корректное число пассажиров (только числа)."
        )

        return
    current_data = await state.get_data()
    current_data["people"] = m.text
    await state.set_data(current_data)
    data = await state.get_data()
    order = await order_db.get_orders()
    try:
        order_number = int(order["order_number"]) + 1

    except:
        order_number = 1

    preview_text = (
        f"Заявка на перевозку пассажиров  #{order_number}\n\n"
        f"{data['pod_type'] if data['pod_type'] is not None else data['category']}\n"
        f"Дата: {data['arrival_date']} {data['arrival_time'] if data['arrival_time'] else ''}\n"
        f"[{data['region_number']}] {data['region']}, {data['address']}\n"
        f"↓ {data['distance']} КМ | {data['people']} чел\n"
        f"{data['drop_address']}\n"
        f"Требования и примечания: {data['requirements']}\n"
        f"Стоимость: {data['price']}"
    )
    await send_int_tg.priority_queue.put(
        {"content_type": "text", "chat_id": m.chat.id, "text": preview_text, "reply_markup": edit_p_markup()}
    )
    await PeopleWork.Ready.set()


async def start_edit_distance_p(m: types.Message):
    await send_int_tg.priority_queue.put(
        {"content_type": "text", "chat_id": m.chat.id, "text": "Введите новое расстояние."}
    )

    await PeopleWork.EditDistance.set()


async def do_edit_distance_p(m: types.Message, state: FSMContext):
    if not m.text.isdigit():
        await send_int_tg.priority_queue.put(
            {"content_type": "text", "chat_id": m.chat.id, "text": "Введите корректную дистанцию (только числа)."}
        )

        return

    current_data = await state.get_data()
    current_data["distance"] = m.text
    await state.set_data(current_data)
    data = await state.get_data()
    order = await order_db.get_orders()
    try:
        order_number = int(order["order_number"]) + 1
    except:
        order_number = 1
    preview_text = (
        f"Заявка на перевозку пассажиров  #{order_number}\n\n"
        f"{data['pod_type'] if data['pod_type'] is not None else data['category']}\n"
        f"Дата: {data['arrival_date']} {data['arrival_time'] if data['arrival_time'] else ''}\n"
        f"[{data['region_number']}] {data['region']}, {data['address']}\n"
        f"↓ {data['distance']} КМ | {data['people']} чел\n"
        f"{data['drop_address']}\n"
        f"Требования и примечания: {data['requirements']}\n"
        f"Стоимость: {data['price']}"
    )
    await send_int_tg.priority_queue.put(
        {"content_type": "text", "chat_id": m.chat.id, "text": preview_text, "reply_markup": edit_p_markup()}
    )
    await PeopleWork.Ready.set()


async def start_edit_requirements_p(m: types.Message):
    await send_int_tg.priority_queue.put(
        {"content_type": "text", "chat_id": m.chat.id, "text": "Введите новое требование."}
    )

    await PeopleWork.EditRecomends.set()


async def do_edit_requirements_p(m: types.Message, state: FSMContext):
    if m.text is None:
        return
    current_data = await state.get_data()
    current_data["requirements"] = m.text
    await state.set_data(current_data)

    data = await state.get_data()
    order = await order_db.get_orders()
    try:
        order_number = int(order["order_number"]) + 1
    except:
        order_number = 1
    preview_text = (
        f"Заявка на перевозку пассажиров  #{order_number}\n\n"
        f"{data['pod_type'] if data['pod_type'] is not None else data['category']}\n"
        f"Дата: {data['arrival_date']} {data['arrival_time'] if data['arrival_time'] else ''}\n"
        f"[{data['region_number']}] {data['region']}, {data['address']}\n"
        f"↓ {data['distance']} КМ | {data['people']} чел\n"
        f"{data['drop_address']}\n"
        f"Требования и примечания: {data['requirements']}\n"
        f"Стоимость: {data['price']}"
    )
    await send_int_tg.priority_queue.put(
        {"content_type": "text", "chat_id": m.chat.id, "text": preview_text, "reply_markup": edit_p_markup()}
    )
    await PeopleWork.Ready.set()


async def start_edit_date_p(m: types.Message):
    await send_int_tg.priority_queue.put({"content_type": "text", "chat_id": m.chat.id, "text": "Введите новую дату."})

    await PeopleWork.EditDate.set()


async def do_edit_date_p(m: types.Message, state: FSMContext):
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
        await send_int_tg.send_with_limit(
            content_type="text",
            chat_id=m.chat.id,
            text="Введите дату в корректном формате. Например: 01.01.2023, 01/01/23 или 010123.",
        )

        return

    day, month, year = map(int, match.groups())
    if not (1 <= day <= 31) or not (1 <= month <= 12):
        await send_int_tg.priority_queue.put(
            {
                "content_type": "text",
                "chat_id": m.chat.id,
                "text": "Некорректная дата. Убедитесь, что вы указали допустимое значение для дня и месяца.",
            }
        )
        return
    # Если год введен в двузначном формате
    if year < 100:
        year += 2000

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

    current_data = await state.get_data()
    current_data["arrival_date"] = input_date
    await state.set_data(current_data)
    data = await state.get_data()
    order = await order_db.get_orders()
    try:
        order_number = int(order["order_number"]) + 1
    except:
        order_number = 1
    preview_text = (
        f"Заявка на перевозку пассажиров  #{order_number}\n\n"
        f"{data['pod_type'] if data['pod_type'] is not None else data['category']}\n"
        f"Дата: {data['arrival_date']} {data['arrival_time'] if data['arrival_time'] else ''}\n"
        f"[{data['region_number']}] {data['region']}, {data['address']}\n"
        f"↓ {data['distance']} КМ | {data['people']} чел\n"
        f"{data['drop_address']}\n"
        f"Требования и примечания: {data['requirements']}\n"
        f"Стоимость: {data['price']}"
    )
    await send_int_tg.priority_queue.put(
        {"content_type": "text", "chat_id": m.chat.id, "text": preview_text, "reply_markup": edit_p_markup()}
    )
    await PeopleWork.Ready.set()


async def start_edit_time_p(m: types.Message):
    await send_int_tg.priority_queue.put({"content_type": "text", "chat_id": m.chat.id, "text": "Введите новое время."})

    await PeopleWork.EditTime.set()


async def do_edit_time_p(m: types.Message, state: FSMContext):
    time_patterns = [
        # шаблон для времени с разделителем (например, 12:12)
        re.compile(r"^(0[0-9]|[0-9]|1[0-9]|2[0-3]):([0-5][0-9]|[0-9])$"),
        # шаблон для времени без разделителя (например, 1212)
        re.compile(r"^(0[0-9]|[0-9]|1[0-9]|2[0-3])([0-5][0-9]|[0-9])$"),
        re.compile(r"^(0[0-9]|[0-9]|1[0-9]|2[0-3])\.([0-5][0-9]|[0-9])$"),
        # шаблон для времени с разделителем "," (например, 12,12)
        re.compile(r"^(0[0-9]|[0-9]|1[0-9]|2[0-3]),([0-5][0-9]|[0-9])$"),
        # шаблон для времени с разделителем "-" (например, 12-12)
        re.compile(r"^(0[0-9]|[0-9]|1[0-9]|2[0-3])-([0-5][0-9]|[0-9])$"),
    ]

    match = None
    for pattern in time_patterns:
        if match := pattern.match(m.text):
            break

    if not match:
        await send_int_tg.priority_queue.put(
            {
                "content_type": "text",
                "chat_id": m.chat.id,
                "text": "Введите время в корректном формате. Например: 12:12 или 1212.",
            }
        )
        return

    hour, minute = map(int, match.groups())
    # преобразуем время к формату 12:12
    formatted_time = f"{hour:02d}:{minute:02d}"

    current_data = await state.get_data()
    current_data["arrival_time"] = formatted_time
    await state.set_data(current_data)
    data = await state.get_data()
    order = await order_db.get_orders()
    try:
        order_number = int(order["order_number"]) + 1
    except:
        order_number = 1
    preview_text = (
        f"Заявка на перевозку пассажиров  #{order_number}\n\n"
        f"{data['pod_type'] if data['pod_type'] is not None else data['category']}\n"
        f"Дата: {data['arrival_date']} {data['arrival_time'] if data['arrival_time'] else ''}\n"
        f"[{data['region_number']}] {data['region']}, {data['address']}\n"
        f"↓ {data['distance']} КМ | {data['people']} чел\n"
        f"{data['drop_address']}\n"
        f"Требования и примечания: {data['requirements']}\n"
        f"Стоимость: {data['price']}"
    )
    await send_int_tg.priority_queue.put(
        {"content_type": "text", "chat_id": m.chat.id, "text": preview_text, "reply_markup": edit_p_markup()}
    )
    await PeopleWork.Ready.set()


async def start_edit_price_p(m: types.Message):
    await send_int_tg.priority_queue.put(
        {"content_type": "text", "chat_id": m.chat.id, "text": "Введите новую стоимость."}
    )

    await PeopleWork.EditPrice.set()


async def do_edit_price_p(m: types.Message, state: FSMContext):
    if not m.text.isdigit():
        await send_int_tg.priority_queue.put(
            {"content_type": "text", "chat_id": m.chat.id, "text": "Укажите стоимость в виде числа."}
        )
        return
    current_data = await state.get_data()
    current_data["price"] = m.text
    await state.set_data(current_data)
    data = await state.get_data()
    order = await order_db.get_orders()
    try:
        order_number = int(order["order_number"]) + 1
    except:
        order_number = 1
    preview_text = (
        f"Заявка на перевозку пассажиров  #{order_number}\n\n"
        f"{data['pod_type'] if data['pod_type'] is not None else data['category']}\n"
        f"Дата: {data['arrival_date']} {data['arrival_time'] if data['arrival_time'] else ''}\n"
        f"[{data['region_number']}] {data['region']}, {data['address']}\n"
        f"↓ {data['distance']} КМ | {data['people']} чел\n"
        f"{data['drop_address']}\n"
        f"Требования и примечания: {data['requirements']}\n"
        f"Стоимость: {data['price']}"
    )
    await send_int_tg.priority_queue.put(
        {"content_type": "text", "chat_id": m.chat.id, "text": preview_text, "reply_markup": edit_p_markup()}
    )
    await PeopleWork.Ready.set()


def register_handler_work_people(dp: Dispatcher):
    dp.register_message_handler(p_process_address, state=PeopleWork.GetAdress)
    dp.register_message_handler(p_process_drop_address, state=PeopleWork.GetDropAdress)
    dp.register_message_handler(p_process_people, state=PeopleWork.GetPeople)
    dp.register_message_handler(p_process_distance, state=PeopleWork.GetDistance)
    dp.register_message_handler(p_process_data, state=PeopleWork.GetDate)
    dp.register_message_handler(p_process_time, state=PeopleWork.GetTime)
    dp.register_message_handler(p_process_requiments, state=PeopleWork.GetRecomends)
    dp.register_message_handler(p_process_price, state=PeopleWork.GetPrice)

    dp.register_message_handler(
        process_ready, lambda message: message.text == "Все верно, продолжить", state=PeopleWork.Ready
    )
    # редактирование аб ворк
    dp.register_message_handler(
        start_edit_address_p, lambda m: m.text == "Редактировать адрес подачи", state=PeopleWork.Ready
    )
    dp.register_message_handler(edit_address_p, state=PeopleWork.EditAdress)
    dp.register_message_handler(
        start_edit_drop_address_p, lambda m: m.text == "Редактировать конечный адрес", state=PeopleWork.Ready
    )
    dp.register_message_handler(do_edit_drop_adress_p, state=PeopleWork.EditDropAdress)

    dp.register_message_handler(
        start_edit_process_people_p, lambda m: m.text == "Редактировать пассажиров", state=PeopleWork.Ready
    )
    dp.register_message_handler(do_edit_people_p, state=PeopleWork.EditPeople)

    dp.register_message_handler(
        start_edit_distance_p, lambda m: m.text == "Редактировать расстояние", state=PeopleWork.Ready
    )
    dp.register_message_handler(do_edit_distance_p, state=PeopleWork.EditDistance)

    dp.register_message_handler(
        start_edit_requirements_p, lambda m: m.text == "Редактировать требования", state=PeopleWork.Ready
    )
    dp.register_message_handler(do_edit_requirements_p, state=PeopleWork.EditRecomends)

    dp.register_message_handler(start_edit_date_p, lambda m: m.text == "Редактировать дату", state=PeopleWork.Ready)
    dp.register_message_handler(do_edit_date_p, state=PeopleWork.EditDate)

    dp.register_message_handler(start_edit_time_p, lambda m: m.text == "Редактировать время", state=PeopleWork.Ready)
    dp.register_message_handler(do_edit_time_p, state=PeopleWork.EditTime)

    dp.register_message_handler(
        start_edit_price_p, lambda m: m.text == "Редактировать стоимость", state=PeopleWork.Ready
    )
    dp.register_message_handler(do_edit_price_p, state=PeopleWork.EditPrice)
