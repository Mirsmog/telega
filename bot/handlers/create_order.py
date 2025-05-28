import traceback
from packages.bot.create_bot import Dispatcher, types, FSMContext, StatesGroup, State, bot
from packages.bot.service.send_message_service import send_int_tg
from packages.bot.scheamas import user_schema
from packages.bot.database import custumer_db, performer_db, user_db, server_db, region_db
from packages.bot.keyboard import main_kb, performer_kb, custumer_kb, order_kb
from packages.bot.handlers.work import ab_work, place_work, people_work


async def process_create_order(c: types.CallbackQuery, state: FSMContext):
    _, call = c.data.split(":")
    result = await server_db.get_category_car()
    if call == "a_b":

        await send_int_tg.priority_queue.put(
            {
                "content_type": "text",
                "chat_id": c.from_user.id,
                "text": "Выбор заказываемой техники:",
                "reply_markup": order_kb.create_order_category(result, call),
            }
        )
        await state.update_data(work=call)
    elif call == "place":
        await send_int_tg.priority_queue.put(
            {
                "content_type": "text",
                "chat_id": c.from_user.id,
                "text": "Выбор заказываемой техники:",
                "reply_markup": order_kb.create_order_category(result, call),
            }
        )
        await state.update_data(work=call)
    elif call == "people":
        await send_int_tg.priority_queue.put(
            {
                "content_type": "text",
                "chat_id": c.from_user.id,
                "text": "Выбор заказываемой техники:",
                "reply_markup": order_kb.create_order_category(result, call),
            }
        )
        await state.update_data(work=call)


async def process_create_order_type(c: types.CallbackQuery, state: FSMContext):
    try:
        _, call = c.data.split(":")
        data = await state.get_data()
        category = await server_db.find_category(call)
        result = await server_db.get_type_car(category["category_name"])
        await state.update_data(category=category["category_name"], category_id=call)
        await send_int_tg.priority_queue.put(
            {
                "content_type": "text",
                "chat_id": c.from_user.id,
                "text": "Выберите тип техники:",
                "reply_markup": order_kb.create_order_type(result, data["work"]),
            }
        )
    except:
        traceback.print_exc()
        await send_int_tg.priority_queue.put(
            {
                "content_type": "text",
                "chat_id": c.from_user.id,
                "text": "Ошибка сервера(повторите запрос)",
                "reply_markup": order_kb.what_is_work(),
                "parse_mode": "markdown",
            }
        )


async def process_create_order_podtype(c: types.CallbackQuery, state: FSMContext):
    try:
        _, call = c.data.split(":")
        data = await state.get_data()
        types = await server_db.find_type(call)
        await state.update_data(type_name=types["type_name"], type_id=call)
        result = await server_db.get_podtype_car(types["type_name"])
        if result:
            await send_int_tg.priority_queue.put(
                {
                    "content_type": "text",
                    "chat_id": c.from_user.id,
                    "text": "Выберите подтип техники:",
                    "reply_markup": order_kb.create_order_podtype(result, data["category_id"]),
                }
            )
        else:
            await state.update_data(pod_type=types["type_name"], type_id=call, pod_type_id=call)

            await send_int_tg.priority_queue.put(
                {
                    "content_type": "text",
                    "chat_id": c.from_user.id,
                    "text": "Выберите количество техники:",
                    "reply_markup": order_kb.create_order_amount_tech(data["category_id"]),
                }
            )

    except:
        traceback.print_exc()
        await send_int_tg.priority_queue.put(
            {
                "content_type": "text",
                "chat_id": c.from_user.id,
                "text": "Ошибка сервера (повторите запрос)",
                "reply_markup": order_kb.what_is_work(),
                "parse_mode": "markdown",
            }
        )


async def process_create_order_amount_car(c: types.CallbackQuery, state: FSMContext):
    try:
        _, call = c.data.split(":")
        data = await state.get_data()
        pod_type = await server_db.find_podtype(call)
        await state.update_data(pod_type=pod_type["pod_type_name"], pod_type_id=call)
        await send_int_tg.priority_queue.put(
            {
                "content_type": "text",
                "chat_id": c.from_user.id,
                "text": "Выберите количество техники:",
                "reply_markup": order_kb.create_order_amount_tech(data["category_id"]),
                "parse_mode": "markdown",
            }
        )
    except:
        traceback.print_exc()
        await send_int_tg.priority_queue.put(
            {
                "content_type": "text",
                "chat_id": c.from_user.id,
                "text": "Ошибка сервера (повторите запрос)",
                "reply_markup": order_kb.what_is_work(),
                "parse_mode": "markdown",
            }
        )


async def process_create_order_region(c: types.CallbackQuery, state: FSMContext):
    try:
        action, call = c.data.split(":")
        page = 1
        if action == "cpodpage":
            page, call = map(int, call.split(":"))

        data = await state.get_data()
        await state.update_data(amount_car=call)
        result = await region_db.fetch_regions()

        await send_int_tg.priority_queue.put(
            {
                "content_type": "photo",
                "chat_id": c.from_user.id,
                "photo": "./image_info/zz.jpg",  # Путь к файлу фото
                "text": "Выберите ваш регион -> район:",
                "reply_markup": order_kb.create_order_region(result, data["type_id"], page),
                "parse_mode": "markdown",
            }
        )
    except:
        traceback.print_exc()
        await send_int_tg.priority_queue.put(
            {
                "content_type": "text",
                "chat_id": c.from_user.id,
                "text": "Ошибка сервера (повторите запрос)",
                "reply_markup": order_kb.what_is_work(),
                "parse_mode": "markdown",
            }
        )


async def process_create_order_podregion(c: types.CallbackQuery, state: FSMContext):
    try:
        _, call = c.data.split(":")
        data = await state.get_data()
        region = await region_db.find_region(call)

        await state.update_data(region=region["region_name"], region_id=call, region_number=region["region_number"])
        result = region["region"]

        await send_int_tg.priority_queue.put(
            {
                "content_type": "text",
                "chat_id": c.from_user.id,
                "text": "Выберите ваш район/город:",
                "reply_markup": order_kb.create_order_podregion(result, data["pod_type_id"]),
                "parse_mode": "markdown",
            }
        )
    except:
        traceback.print_exc()
        await send_int_tg.priority_queue.put(
            {
                "content_type": "text",
                "chat_id": c.from_user.id,
                "text": "Ошибка сервера (повторите запрос)",
                "reply_markup": order_kb.what_is_work(),
                "parse_mode": "markdown",
            }
        )


async def handle_podregion_pagination(c: types.CallbackQuery, state: FSMContext):
    try:
        _, page, call = c.data.split(":")
        page = int(page)

        data = await state.get_data()
        region = await region_db.find_region(data["region_id"])
        result = region["region"]

        await send_int_tg.priority_queue.put(
            {
                "content_type": "text",
                "chat_id": c.from_user.id,
                "text": "Выберите ваш район/город:",
                "reply_markup": order_kb.create_order_podregion(result, data["pod_type_id"], page),
                "parse_mode": "markdown",
            }
        )
    except:
        traceback.print_exc()
        await send_int_tg.priority_queue.put(
            {
                "content_type": "text",
                "chat_id": c.from_user.id,
                "text": "Ошибка сервера (повторите запрос)",
                "reply_markup": order_kb.what_is_work(),
                "parse_mode": "markdown",
            }
        )


async def process_create_order_goorder(c: types.CallbackQuery, state: FSMContext):

    _, call, prereg = c.data.split(":")
    data = await state.get_data()
    await state.update_data(preregion_id=call, preregion=prereg)
    if data["work"] == "a_b":
        await send_int_tg.priority_queue.put(
            {"content_type": "text", "chat_id": c.from_user.id, "text": "Укажите адрес загрузки:"}
        )
        await ab_work.AbWork.GetAdress.set()
    elif data["work"] == "people":
        await send_int_tg.priority_queue.put(
            {"content_type": "text", "chat_id": c.from_user.id, "text": "Укажите адрес посадки пассажиров:"}
        )
        await people_work.PeopleWork.GetAdress.set()
    elif data["work"] == "place":
        await send_int_tg.priority_queue.put(
            {"content_type": "text", "chat_id": c.from_user.id, "text": "Адрес подачи техники:"}
        )
        await place_work.PlaceWork.GetAdress.set()


async def handle_pagination(c: types.CallbackQuery, state: FSMContext):
    try:
        _, page, call = c.data.split(":")
        page = int(page)

        data = await state.get_data()
        result = await region_db.fetch_regions()
        await send_int_tg.priority_queue.put(
            {
                "content_type": "photo",
                "chat_id": c.from_user.id,
                "photo": "./image_info/zz.jpg",  # Путь к файлу фото
                "text": "Выберите регион/район:",
                "reply_markup": order_kb.create_order_region(result, data["type_id"], page),
                "parse_mode": "markdown",
            }
        )
    except:
        traceback.print_exc()
        await send_int_tg.priority_queue.put(
            {
                "content_type": "text",
                "chat_id": c.from_user.id,
                "text": "Ошибка сервера (повторите запрос)",
                "reply_markup": order_kb.what_is_work(),
                "parse_mode": "markdown",
            }
        )


def register_handler_order(dp: Dispatcher):
    dp.register_callback_query_handler(process_create_order, lambda c: c.data.startswith("work:"))
    dp.register_callback_query_handler(process_create_order_type, lambda c: c.data.startswith("ctype:"))
    dp.register_callback_query_handler(process_create_order_podtype, lambda c: c.data.startswith("cpodtype:"))
    dp.register_callback_query_handler(process_create_order_amount_car, lambda c: c.data.startswith("needcar:"))
    dp.register_callback_query_handler(process_create_order_region, lambda c: c.data.startswith("cregion:"))
    dp.register_callback_query_handler(handle_pagination, lambda c: c.data.startswith("cpodpage:"))
    dp.register_callback_query_handler(process_create_order_podregion, lambda c: c.data.startswith("cpodregion:"))
    dp.register_callback_query_handler(handle_podregion_pagination, lambda c: c.data.startswith("cpodprepage:"))
    dp.register_callback_query_handler(process_create_order_goorder, lambda c: c.data.startswith("goorder:"))
