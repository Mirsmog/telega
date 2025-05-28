from packages.bot.create_bot import Dispatcher, types, FSMContext, StatesGroup, State, bot
from packages.bot.service.send_message_service import send_int_tg
from packages.bot.scheamas import user_schema
from packages.bot.database import custumer_db, performer_db, user_db, server_db, region_db, car_db
from packages.bot.keyboard import main_kb, performer_kb, custumer_kb, order_kb
from packages.bot.handlers.work import ab_work, place_work, people_work
from datetime import datetime


class CreateCar(StatesGroup):
    CarName = State()
    CarNumber = State()


async def process_create_car(c: types.CallbackQuery, state: FSMContext):
    _, call = c.data.split(":")
    print(_, call)
    category = await server_db.find_category(call)
    print(category)
    await state.update_data(category_car=category["category_name"], category_id=call)
    types_car = await server_db.get_type_car(category["category_name"])
    await send_int_tg.priority_queue.put(
        {
            "content_type": "text",
            "chat_id": c.from_user.id,
            "text": "Выберите тип техники",
            "reply_markup": performer_kb.add_types_car(types_car, call),
            "parse_mode": "markdown",
        }
    )


async def process_create_type_car(c: types.CallbackQuery, state: FSMContext):
    _, call = c.data.split(":")
    types_car = await server_db.find_type(call)
    await state.update_data(types_car=types_car["type_name"], types_id=call)
    pod_type_car = await server_db.get_podtype_car(types_car["type_name"])
    print(types_car["type_name"])
    if not pod_type_car:
        await send_int_tg.priority_queue.put(
            {
                "content_type": "text",
                "chat_id": c.from_user.id,
                "text": "Выберите количество машин",
                "reply_markup": performer_kb.amount_car(),
            }
        )
        await state.update_data(pod_type_car=None, pod_type_id=None)
    else:
        await send_int_tg.priority_queue.put(
            {
                "content_type": "text",
                "chat_id": c.from_user.id,
                "text": "Выберите подтип техники",
                "reply_markup": performer_kb.add_podtypes_car(pod_type_car, call),
                "parse_mode": "markdown",
            }
        )


async def process_create_pod_type_car(c: types.CallbackQuery, state: FSMContext):
    _, call = c.data.split(":")
    pod_type_car = await server_db.find_podtype(call)
    await state.update_data(pod_type_car=pod_type_car["pod_type_name"], pod_type_id=call)
    await send_int_tg.priority_queue.put(
        {
            "content_type": "text",
            "chat_id": c.from_user.id,
            "text": "Выберите количество машин",
            "reply_markup": performer_kb.amount_car(),
            "parse_mode": "markdown",
        }
    )


async def process_amount_car(c: types.CallbackQuery, state: FSMContext):
    _, call = c.data.split(":")
    user_info = await performer_db.find_cars(c.from_user.id)
    car_number = user_info["cars"]
    if car_number:
        last_car_numer = list(car_number.keys())[-1].split("_")[1]
    else:
        last_car_numer = 0

    await state.update_data(amount_car=call, last_car=last_car_numer)
    await send_int_tg.priority_queue.put(
        {"content_type": "text", "chat_id": c.from_user.id, "text": "Марка и модель единицы техники №1"}
    )

    await CreateCar.CarName.set()


async def log_car(user_id, message, status, car):
    current_time = datetime.now().strftime("%d.%m.%y %H:%M")
    log = {"user_id": user_id, "messgae": message, "date": current_time, "status": status}
    # await performer_db.update_user_car()


async def process_car(m: types.Message, state: FSMContext):
    data = await state.get_data()

    total_cars_required = int(data["amount_car"])
    cars_added_this_session = data.get("cars_added_this_session", 0)
    next_car_number = cars_added_this_session + 1
    if next_car_number <= total_cars_required:
        current_time = datetime.now().strftime("%d.%m.%y %H:%M")
        logs = {"message": "▶ Поиск заявок", "date": current_time}
        await state.update_data({"now_add": total_cars_required})
        await state.update_data({"cars_added_this_session": next_car_number})
        await state.update_data(
            {
                f'car_{next_car_number+int(data["last_car"])}': {
                    "data": [m.text, None, None, None, None],
                    "status": "search",
                    "order_id": None,
                    "log": [logs],
                }
            }
        )
        await send_int_tg.priority_queue.put(
            {
                "content_type": "text",
                "chat_id": m.from_user.id,
                "text": f"Гос. номер единицы техники №{next_car_number}",
            }
        )
        await CreateCar.CarNumber.set()

    else:
        await send_int_tg.priority_queue.putt(
            {
                "content_type": "text",
                "chat_id": m.from_user.id,
                "text": "Вы успешно добавили все машины",
                "reply_markup": performer_kb.performer_main(),
            }
        )
        await state.finish()


async def add_number(m: types.Message, state: FSMContext):

    data = await state.get_data()
    total_cars_required = int(data["amount_car"])
    cars_added_this_session = data.get("cars_added_this_session", 0)
    next_car_number = cars_added_this_session

    user_id = m.from_user.id

    info_server = await server_db.get_tariff()

    url_performer = info_server["performer_link"]

    if next_car_number <= total_cars_required:

        car_data = data.get(
            f'car_{next_car_number + int(data["last_car"])}',
            {"data": [None, None, None, None, None], "status": "search", "order_id": None, "log": []},
        )
        car_data["data"][1] = m.text
        car_data["data"][2] = data["category_car"]
        car_data["data"][3] = data["types_car"]
        car_data["data"][4] = data["pod_type_car"]
        current_time = datetime.now().strftime("%d.%m.%y %H:%M")
        await state.update_data({f'car_{next_car_number + int(data["last_car"])}': car_data})
        date_new = await state.get_data()
        new_car = {
            "car_number": m.text,
            "car_name": data[f'car_{next_car_number + int(data["last_car"])}']["data"][0],
            "car_category": data["category_car"],
            "car_type": data["types_car"],
            "car_pod_type": data["pod_type_car"],
            "user_id_car": user_id,
            "number_car": f'car_{next_car_number + int(data["last_car"])}',
            "status": "search",
            "date": current_time,
        }

        log_user = {"message": f'Добавил машину #{next_car_number + int(data["last_car"])}', "date": current_time}
        await performer_db.save_cars_to_db(
            user_id,
            f'car_{next_car_number + int(data["last_car"])}',
            date_new[f'car_{next_car_number + int(data["last_car"])}'],
            log_user,
        )

        # await performer_db.update_logs(log_user)
        await car_db.add_new_car(new_car)
        if next_car_number < total_cars_required:
            await m.reply(f"Машина №{next_car_number} успешно добавлена. Добавьте марку и модель следующего ТС.")
            await CreateCar.CarName.set()
        else:
            await send_int_tg.priority_queue.put(
                {
                    "content_type": "text",
                    "chat_id": m.from_user.id,
                    "text": "Выбрать регион из списка",
                    "reply_markup": performer_kb.performer_main(url_performer),
                }
            )
            await state.finish()
    else:
        await send_int_tg.priority_queue.putt(
            {
                "content_type": "text",
                "chat_id": m.from_user.id,
                "text": "Вы успешно добавили все машины, выберите регион/район",
                "reply_markup": performer_kb.performer_main(url_performer),
            }
        )
        await state.finish()


def register_handler_car(dp: Dispatcher):
    dp.register_callback_query_handler(process_create_car, lambda c: c.data.startswith("cardscate:"))
    dp.register_callback_query_handler(process_create_type_car, lambda c: c.data.startswith("cardstype:"))
    dp.register_callback_query_handler(process_create_pod_type_car, lambda c: c.data.startswith("cardspodtype:"))
    dp.register_callback_query_handler(process_amount_car, lambda c: c.data.startswith("amountcar:"))
    dp.register_message_handler(process_car, state=CreateCar.CarName)
    dp.register_message_handler(add_number, state=CreateCar.CarNumber)
