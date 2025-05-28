from packages.bot.create_bot import (
    StatesGroup,
    State,
    Dispatcher,
    types,
    FSMContext,
    KeyboardButton,
    ReplyKeyboardMarkup,
)
from packages.bot.service.send_message_service import send_int_tg
from packages.bot.database import order_db, user_db, region_db, server_db, custumer_db
import datetime
import re
from packages.bot.scheamas import Create_order
from packages.bot.scheamas import order_schema
from keyboard import custumer_kb, service_kb


def edit_ab_markup():
    markup = ReplyKeyboardMarkup(resize_keyboard=True)
    markup.add("Все верно, продолжить")
    markup.add("Редактировать адрес загрузки")
    markup.add("Редактировать адрес разгрузки")
    markup.add("Редактировать дату")
    markup.add("Редактировать вид груза")
    markup.add("Редактировать расстояние")
    markup.add("Редактировать требования")
    markup.add("Редактировать стоимость")
    return markup


class AbWork(StatesGroup):
    GetAdress = State()
    GetDropAdress = State()
    GetDistance = State()
    GetInfo = State()
    GetRecomends = State()
    GetDate = State()
    GetPrice = State()
    Ready = State()

    EditAdress = State()
    EditDropAdress = State()
    EditDistance = State()
    EditInfo = State()
    EditRecomends = State()
    EditDate = State()
    EditPrice = State()


async def process_get_adress_ab(m: types.Message, state: FSMContext):
    if not m.text.strip():  # Проверяем, что введенная строка не пуста
        await send_int_tg.priority_queue.put(
            {"content_type": "text", "chat_id": m.chat.id, "text": "Введите корректный адрес."}
        )
        return

    await state.update_data(address=m.text)

    await AbWork.GetDropAdress.set()
    await send_int_tg.priority_queue.put(
        {"content_type": "text", "chat_id": m.chat.id, "text": "Укажите полный адрес разгрузки."}
    )


async def process_get_dropadress_ab(m: types.Message, state: FSMContext):
    if not m.text.strip():  # Проверяем, что введенная строка не пуста
        await send_int_tg.priority_queue.put(
            {"content_type": "text", "chat_id": m.chat.id, "text": "Введите корректный адрес."}
        )
        return

    await state.update_data(drop_address=m.text)
    skip_button = KeyboardButton("Пропустить")
    await AbWork.GetDistance.set()
    await send_int_tg.priority_queue.put(
        {
            "content_type": "text",
            "chat_id": m.chat.id,
            "text": "Укажите расстояние от места загрузки до места разгрузки в км.",
            "reply_markup": ReplyKeyboardMarkup(resize_keyboard=True).add(skip_button),
        }
    )


async def process_get_distance_ab(m: types.Message, state: FSMContext):
    if m.text == "Пропустить":
        await state.update_data(distance="Не рассчитана")
    elif not m.text.isdigit():
        await send_int_tg.priority_queue.put(
            {"content_type": "text", "chat_id": m.chat.id, "text": "Введите корректное расстояние (только числа)."}
        )
        return
    else:
        await state.update_data(distance=m.text)

    await AbWork.GetInfo.set()
    await send_int_tg.priority_queue.put(
        {"content_type": "text", "chat_id": m.chat.id, "text": "Наименование груза (что везем)."}
    )


async def process_get_info_ab(m: types.Message, state: FSMContext):
    await state.update_data(info=m.text)
    await AbWork.GetRecomends.set()
    skip_button = KeyboardButton("Пропустить")
    await send_int_tg.priority_queue.put(
        {
            "content_type": "text",
            "chat_id": m.chat.id,
            "text": "Требования к перевозке, объем, примечания.",
            "reply_markup": ReplyKeyboardMarkup(resize_keyboard=True).add(skip_button),
        }
    )


async def process_get_recomends_ab(m: types.Message, state: FSMContext):
    if m.text == "Пропустить":
        await state.update_data(requirements="Нет уточнений")
    else:
        await state.update_data(requirements=m.text)

    await AbWork.GetDate.set()
    skip_button = KeyboardButton("Пропустить")
    await send_int_tg.priority_queue.put(
        {
            "content_type": "text",
            "chat_id": m.chat.id,
            "text": "Дата загрузки в формате дд.мм.гггг  (например 12.06.2023).",
            "reply_markup": ReplyKeyboardMarkup(resize_keyboard=True).add(skip_button),
        }
    )


async def process_get_date_ab(m: types.Message, state: FSMContext):
    if m.text == "Пропустить" or m.text == "пропустить":
        await state.update_data(arrival_date=None)
    else:
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

    await AbWork.GetPrice.set()
    skip_button = KeyboardButton("Не указывать, получать предложения")
    await send_int_tg.priority_queue.put(
        {
            "content_type": "text",
            "chat_id": m.chat.id,
            "text": "Укажите стоимость работ.",
            "reply_markup": ReplyKeyboardMarkup(resize_keyboard=True).add(skip_button),
        }
    )


async def process_get_price_ab(m: types.Message, state: FSMContext):
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

    await AbWork.Ready.set()

    data = await state.get_data()

    order = await order_db.get_orders()
    try:
        order_number = int(order["order_number"]) + 1

    except:
        order_number = 1

    preview_text = (
        f"Заявка на перевозку #{order_number}\n\n"
        f"{data['pod_type'] if data['pod_type'] is not None else data['category']} в количестве: {data['amount_car']}\n"
        f"Дата: {data['arrival_date']}\n[{data['region_number']}] {data['region']}, {data['address']}\n"
        f"↓ {data['distance']} КМ\n"
        f"{data['drop_address']}\n"
        f"Везем: {data['info']}\n"
        f"Требования и примечания: {data['requirements']}\n"
        f"Стоимость: {data['price']}"
    )
    await send_int_tg.priority_queue.put(
        {"content_type": "text", "chat_id": m.chat.id, "text": preview_text, "reply_markup": edit_ab_markup()}
    )


async def process_ready(m: types.Message, state: FSMContext):
    data = await state.get_data()
    urls = await server_db.get_tariff()
    url_custumer = urls["customer_link"]

    if data["requirements"] == "Пропустить":
        data["requirements"] = None
    if data["price"] == "Жду предложения":
        data["price"] = None

    order = await order_db.get_orders()
    try:
        order_number = int(order["order_number"]) + 1
    except:
        order_number = 1

    region_info = await region_db.find_for_name(data["region"])

    current_time = datetime.datetime.now().strftime("%d.%m.%y %H:%M")
    log_initial_message = [{"message": "заявка создана", "date": current_time, "user": m.from_user.id}]
    new_order = await Create_order.create_order(
        type_order="a_b",
        type_car=f"{data['category']}",
        order_number=order_number,
        type_tip_car=f"{data['type_name']}",
        podtype_car=f"{data['pod_type']}",
        amount_car=data["amount_car"],
        regions=data["region"],
        region_number=region_info["region_number"],
        preregion=data["preregion"],
        date=data["arrival_date"],
        info=data["info"],
        address=data["address"],
        drop_address=data["drop_address"],
        distance=data["distance"],
        time=None,
        send_all=False,
        requirements=data["requirements"],
        price=data["price"],
        customer=m.from_user.id,
        tariff=region_info["tarif"],
        viptarif=region_info["viptarif"],
        create_date=datetime.datetime.now(),
        log=log_initial_message,
        send_status=False,
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
        f"Заявка на перевозку #{order_number}\n\n"
        f"{data['pod_type'] if data['pod_type'] is not None else data['category']} в количестве: {data['amount_car']}\n"
        f"Дата: {data['arrival_date']}\n[{data['region_number']}] {data['region']}, {data['address']}\n"
        f"↓ {data['distance']} КМ\n"
        f"{data['drop_address']}\n"
        f"Везем: {data['info']}\n"
        f"Требования и примечания: {data['requirements']}\n"
        f"Стоимость: {data['price']}"
    )
    await send_int_tg.send_with_limit(
        content_type="text",
        chat_id=-1001969553521,
        text=f"{text}",
        reply_markup=service_kb.yes_or_no(new_order.inserted_id),
    )


# TODO: редактирование всех команд
async def start_edit_address_ab(message: types.Message):
    await send_int_tg.send_with_limit(content_type="text", chat_id=message.chat.id, text="Введите новый адрес.")

    await AbWork.EditAdress.set()


async def edit_address_ab(m: types.Message, state: FSMContext):
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
        f"Заявка на перевозку #{order_number}\n\n"
        f"{data['pod_type'] if data['pod_type'] is not None else data['category']} в количестве: {data['amount_car']}\n"
        f"Дата: {data['arrival_date']}\n[{data['region_number']}] {data['region']}, {data['address']}\n"
        f"↓ {data['distance']} КМ\n"
        f"{data['drop_address']}\n"
        f"Везем: {data['info']}\n"
        f"Требования и примечания: {data['requirements']}\n"
        f"Стоимость: {data['price']}"
    )
    await send_int_tg.priority_queue.put(
        {"content_type": "text", "chat_id": m.chat.id, "text": preview_text, "reply_markup": edit_ab_markup()}
    )
    await AbWork.Ready.set()


async def start_edit_drop_address_ab(m: types.Message):
    await send_int_tg.priority_queue.put(
        {"content_type": "text", "chat_id": m.chat.id, "text": "Введите новый конечный адрес."}
    )

    await AbWork.EditDropAdress.set()


async def ab_do_edit_drop_address(m: types.Message, state: FSMContext):
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
        f"Заявка на перевозку #{order_number}\n\n"
        f"{data['pod_type'] if data['pod_type'] is not None else data['category']} в количестве: {data['amount_car']}\n"
        f"Дата: {data['arrival_date']}\n[{data['region_number']}] {data['region']}, {data['address']}\n"
        f"↓ {data['distance']} КМ\n"
        f"{data['drop_address']}\n"
        f"Везем: {data['info']}\n"
        f"Требования и примечания: {data['requirements']}\n"
        f"Стоимость: {data['price']}"
    )
    await send_int_tg.priority_queue.put(
        {"content_type": "text", "chat_id": m.chat.id, "text": preview_text, "reply_markup": edit_ab_markup()}
    )
    await AbWork.Ready.set()


async def start_edit_distance_ab(m: types.Message):
    await send_int_tg.priority_queue.put(
        {"content_type": "text", "chat_id": m.chat.id, "text": "Введите новое расстояние."}
    )

    await AbWork.EditDistance.set()


async def do_edit_distance_ab(m: types.Message, state: FSMContext):
    if not m.text.isdigit():
        await send_int_tg.priority_queue.put(
            {"content_type": "text", "chat_id": m.chat.id, "text": "Введите корректное расстояние (только числа)."}
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
        f"Заявка на перевозку #{order_number}\n\n"
        f"{data['pod_type'] if data['pod_type'] is not None else data['category']} в количестве: {data['amount_car']}\n"
        f"Дата: {data['arrival_date']}\n[{data['region_number']}] {data['region']}, {data['address']}\n"
        f"↓ {data['distance']} КМ\n"
        f"{data['drop_address']}\n"
        f"Везем: {data['info']}\n"
        f"Требования и примечания: {data['requirements']}\n"
        f"Стоимость: {data['price']}"
    )
    await send_int_tg.priority_queue.put(
        {"content_type": "text", "chat_id": m.chat.id, "text": preview_text, "reply_markup": edit_ab_markup()}
    )
    await AbWork.Ready.set()


async def start_edit_info_ab(m: types.Message):
    await send_int_tg.priority_queue.put({"content_type": "text", "chat_id": m.chat.id, "text": "Введите вид груза."})

    await AbWork.EditInfo.set()


async def do_edit_info_ab(m: types.Message, state: FSMContext):
    current_data = await state.get_data()
    current_data["info"] = m.text
    await state.set_data(current_data)
    data = await state.get_data()
    order = await order_db.get_orders()
    try:
        order_number = int(order["order_number"]) + 1
    except:
        order_number = 1

    preview_text = (
        f"Заявка на перевозку #{order_number}\n\n"
        f"{data['pod_type'] if data['pod_type'] is not None else data['category']} в количестве: {data['amount_car']}\n"
        f"Дата: {data['arrival_date']}\n[{data['region_number']}] {data['region']}, {data['address']}\n"
        f"↓ {data['distance']} КМ\n"
        f"{data['drop_address']}\n"
        f"Везем: {data['info']}\n"
        f"Требования и примечания: {data['requirements']}\n"
        f"Стоимость: {data['price']}"
    )
    await send_int_tg.priority_queue.put(
        {"content_type": "text", "chat_id": m.chat.id, "text": preview_text, "reply_markup": edit_ab_markup()}
    )
    await AbWork.Ready.set()


async def start_edit_requirements_ab(m: types.Message):
    await send_int_tg.send_with_limit(
        {"content_type": "text", "chat_id": m.chat.id, "text": "Введите новое требование."}
    )

    await AbWork.EditRecomends.set()


async def do_edit_requirements_ab(m: types.Message, state: FSMContext):
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
        f"Заявка на перевозку #{order_number}\n\n"
        f"{data['pod_type'] if data['pod_type'] is not None else data['category']} в количестве: {data['amount_car']}\n"
        f"Дата: {data['arrival_date']}\n[{data['region_number']}] {data['region']}, {data['address']}\n"
        f"↓ {data['distance']} КМ\n"
        f"{data['drop_address']}\n"
        f"Везем: {data['info']}\n"
        f"Требования и примечания: {data['requirements']}\n"
        f"Стоимость: {data['price']}"
    )
    await send_int_tg.priority_queue.put(
        {"content_type": "text", "chat_id": m.chat.id, "text": preview_text, "reply_markup": edit_ab_markup()}
    )
    await AbWork.Ready.set()


async def start_edit_date_ab(m: types.Message):
    await send_int_tg.priority_queue.put({"content_type": "text", "chat_id": m.chat.id, "text": "Введите новую дату."})

    await AbWork.EditDate.set()


async def do_edit_date_ab(m: types.Message, state: FSMContext):
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
    current_data["arrival_date"] = m.text
    await state.set_data(current_data)
    data = await state.get_data()
    order = await order_db.get_orders()
    try:
        order_number = int(order["order_number"]) + 1
    except:
        order_number = 1
    preview_text = (
        f"Заявка на перевозку #{order_number}\n\n"
        f"{data['pod_type'] if data['pod_type'] is not None else data['category']} в количестве: {data['amount_car']}\n"
        f"Дата: {data['arrival_date']}\n[{data['region_number']}] {data['region']}, {data['address']}\n"
        f"↓ {data['distance']} КМ\n"
        f"{data['drop_address']}\n"
        f"Везем: {data['info']}\n"
        f"Требования и примечания: {data['requirements']}\n"
        f"Стоимость: {data['price']}"
    )
    await send_int_tg.priority_queue.put(
        {"content_type": "text", "chat_id": m.chat.id, "text": preview_text, "reply_markup": edit_ab_markup()}
    )
    await AbWork.Ready.set()


async def start_edit_price_ab(m: types.Message):
    await send_int_tg.priority_queue.put(
        {"content_type": "text", "chat_id": m.chat.id, "text": "Введите новую стоимость."}
    )

    await AbWork.EditPrice.set()


async def do_edit_price_ab(m: types.Message, state: FSMContext):
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
        f"Заявка на перевозку #{order_number}\n\n"
        f"{data['pod_type'] if data['pod_type'] is not None else data['category']} в количестве: {data['amount_car']}\n"
        f"Дата: {data['arrival_date']}\n[{data['region_number']}] {data['region']}, {data['address']}\n"
        f"↓ {data['distance']} КМ\n"
        f"{data['drop_address']}\n"
        f"Везем: {data['info']}\n"
        f"Требования и примечания: {data['requirements']}\n"
        f"Стоимость: {data['price']}"
    )
    await send_int_tg.priority_queue.put(
        {"content_type": "text", "chat_id": m.chat.id, "text": preview_text, "reply_markup": edit_ab_markup()}
    )
    await AbWork.Ready.set()


def register_process_ab(dp: Dispatcher):
    dp.register_message_handler(process_get_adress_ab, state=AbWork.GetAdress)
    dp.register_message_handler(process_get_dropadress_ab, state=AbWork.GetDropAdress)
    dp.register_message_handler(process_get_distance_ab, state=AbWork.GetDistance)
    dp.register_message_handler(process_get_info_ab, state=AbWork.GetInfo)
    dp.register_message_handler(process_get_recomends_ab, state=AbWork.GetRecomends)
    dp.register_message_handler(process_get_date_ab, state=AbWork.GetDate)
    dp.register_message_handler(process_get_price_ab, state=AbWork.GetPrice)
    dp.register_message_handler(
        process_ready, lambda message: message.text == "Все верно, продолжить", state=AbWork.Ready
    )
    # редактирование аб ворк
    dp.register_message_handler(
        start_edit_address_ab, lambda m: m.text == "Редактировать адрес загрузки", state=AbWork.Ready
    )
    dp.register_message_handler(edit_address_ab, state=AbWork.EditAdress)
    dp.register_message_handler(
        start_edit_drop_address_ab, lambda m: m.text == "Редактировать адрес разгрузки", state=AbWork.Ready
    )
    dp.register_message_handler(ab_do_edit_drop_address, state=AbWork.EditDropAdress)
    dp.register_message_handler(
        start_edit_distance_ab, lambda m: m.text == "Редактировать расстояние", state=AbWork.Ready
    )
    dp.register_message_handler(do_edit_distance_ab, state=AbWork.EditDistance)
    dp.register_message_handler(start_edit_info_ab, lambda m: m.text == "Редактировать вид груза", state=AbWork.Ready)
    dp.register_message_handler(do_edit_info_ab, state=AbWork.EditInfo)

    dp.register_message_handler(
        start_edit_requirements_ab, lambda m: m.text == "Редактировать требования", state=AbWork.Ready
    )
    dp.register_message_handler(do_edit_requirements_ab, state=AbWork.EditRecomends)

    dp.register_message_handler(start_edit_date_ab, lambda m: m.text == "Редактировать дату", state=AbWork.Ready)
    dp.register_message_handler(do_edit_date_ab, state=AbWork.EditDate)

    dp.register_message_handler(start_edit_price_ab, lambda m: m.text == "Редактировать стоимость", state=AbWork.Ready)
    dp.register_message_handler(do_edit_price_ab, state=AbWork.EditPrice)
