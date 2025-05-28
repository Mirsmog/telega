import traceback
from packages.bot.create_bot import Dispatcher, types, FSMContext, StatesGroup, State
from packages.bot.service.send_message_service import send_int_tg
from packages.bot.scheamas import user_schema
from packages.bot.database import custumer_db, performer_db, user_db, server_db
from packages.bot.keyboard import main_kb, performer_kb, custumer_kb
from packages.bot.service.valid import phone
from datetime import datetime


class Regiser_user(StatesGroup):
    Name = State()
    Phone = State()


async def first_start(m: types.Message, state: FSMContext):
    try:
        await state.reset_state()
    except Exception:
        pass
    payload = m.get_args()
    user = await user_db.find_user(m.from_user.id)
    info_server = await server_db.get_tariff()

    url_performer = info_server["performer_link"]
    url_custumer = info_server["customer_link"]

    try:
        if payload:
            ref = payload
        else:
            ref = None
    except:
        ref = None
    text = (
        "Добро пожаловать в Telega-logistics, интеллектуальный поиск транспортных услуг, используя мощь Telegram.\n\n"
        "Наши сайты "
        '<a href="https://telega-logistics.ru/">Telega-logistics.ru</a> ;'
        '<a href="http://xn----7sbicgazasce0b3bdl.xn--p1ai/">Телега-логистик.рф</a>;\n\n '
        "Нажимая на одну из кнопок ниже, вы соглашаетесь с "
        '<a href="https://telega-logistics.ru/blog/?go=all/politika-konf/">политикой конфиденциальности</a> '
        'и <a href="https://telega-logistics.ru/blog/?go=all/pravila-2/">принимаете правила использования сервиса</a>.'
    )
    if not user:

        user_info = {
            "user_id": m.from_user.id,
            "register": False,
            "performer": False,
            "custumer": False,
            "register_date": datetime.now(),
            "referal": ref,
        }
        await user_db.new_user(user_info)
        await send_int_tg.priority_queue.put(
            {
                "content_type": "text",
                "chat_id": m.from_user.id,
                "text": text,
                "reply_markup": main_kb.first_menu(),
                "parse_mode": "HTML",
            }
        )

    elif user["performer"] == False and user["custumer"] == False:
        await send_int_tg.priority_queue.put(
            {
                "content_type": "text",
                "chat_id": m.from_user.id,
                "text": text,
                "reply_markup": main_kb.first_menu(),
                "parse_mode": "HTML",
            }
        )

    else:
        if user["performer"]:
            print("tut")
            await performer_db.add_regions_to_user(m.from_user.id)
            performer = await performer_db.find_performer(m.from_user.id)
            await send_int_tg.priority_queue.put(
                {
                    "content_type": "text",
                    "chat_id": m.from_user.id,
                    "text": f"Привет {performer['name']}\n" f"Меню исполнителя",
                    "reply_markup": performer_kb.performer_main(url_performer),
                }
            )
        elif user["custumer"]:
            custumer = await custumer_db.find_custumer(m.from_user.id)
            await send_int_tg.priority_queue.put(
                {
                    "content_type": "text",
                    "chat_id": m.from_user.id,
                    "text": f"Привет {custumer['name']}\n" f"Меню заказчика",
                    "reply_markup": custumer_kb.custumer_main(url_custumer),
                }
            )


# await user_schema.Customer.create_user(user_id=m.from_user.id


# тут должен сразу быть процесс регистрации пользователя в систему!
async def process_first_start(c: types.CallbackQuery, state: FSMContext):
    _, call = c.data.split("_")
    info_server = await server_db.get_tariff()

    url_performer = info_server["performer_link"]
    url_custumer = info_server["customer_link"]

    if call == "custumer":
        performer = await performer_db.find_performer(user_id=c.from_user.id)
        custumer = await custumer_db.find_custumer(user_id=c.from_user.id)
        try:
            if not performer:
                if custumer["register"] == True:
                    await send_int_tg.priority_queue.put(
                        {
                            "content_type": "text",
                            "chat_id": c.from_user.id,
                            "text": "Вы уже зарегистрировались!",
                            "reply_markup": custumer_kb.custumer_main(url_custumer),
                        }
                    )
            else:
                await send_int_tg.priority_queue.put(
                    {
                        "content_type": "text",
                        "chat_id": c.from_user.id,
                        "text": "Вы уже зарегистрировались!",
                        "reply_markup": performer_kb.performer_main(url_performer),
                    }
                )
        except:

            data_info = {"custumer": True}
            await user_schema.Customer.create_user(user_id=c.from_user.id, username=c.from_user.username)
            await user_db.update_info_user(c.from_user.id, data_info)
            await send_int_tg.priority_queue.put(
                {
                    "content_type": "text",
                    "chat_id": c.from_user.id,
                    "text": "Введите имя, чтобы исполнители, знали как обращаться к вам",
                }
            )
            await state.update_data(who="custumer")
            await Regiser_user.Name.set()
    elif call == "performer":
        performer = await performer_db.find_performer(user_id=c.from_user.id)
        custumer = await custumer_db.find_custumer(c.from_user.id)
        try:
            if not custumer:
                if performer["register"] == True:

                    await send_int_tg.priority_queue.put(
                        {
                            "content_type": "text",
                            "chat_id": c.from_user.id,
                            "text": "Вы уже зарегистрировались!",
                            "reply_markup": performer_kb.performer_main(url_performer),
                        }
                    )
            else:
                await send_int_tg.priority_queue.put(
                    {
                        "content_type": "text",
                        "chat_id": c.from_user.id,
                        "text": "Вы уже зарегистрировались!",
                        "reply_markup": custumer_kb.custumer_main(url_custumer),
                    }
                )
        except:
            data_info = {"performer": True}
            await user_schema.Performer.create_user(user_id=c.from_user.id, username=c.from_user.username)
            await user_db.update_info_user(c.from_user.id, data_info)
            await send_int_tg.priority_queue.put(
                {
                    "content_type": "text",
                    "chat_id": c.from_user.id,
                    "text": "Введите имя, чтобы заказчики знали как " "обращаться к вам",
                }
            )
            await state.update_data(who="performer")
            await Regiser_user.Name.set()


async def process_name(m: types.Message, state: FSMContext):
    await state.update_data(name=m.text)
    await send_int_tg.priority_queue.put(
        {"content_type": "text", "chat_id": m.from_user.id, "text": "Введите корректный номер телефона, для связи"}
    )
    await Regiser_user.Phone.set()


async def process_phone(m: types.Message, state: FSMContext):
    phone_number = m.text
    info_server = await server_db.get_tariff()

    url_performer = info_server["performer_link"]
    url_custumer = info_server["customer_link"]
    try:
        formatted_number = phone.validate_and_format_phone(phone_number)
        phone_exists = await custumer_db.check_phone_exists(formatted_number)
        if phone_exists:
            await send_int_tg.priority_queue.put(
                {
                    "content_type": "text",
                    "chat_id": m.from_user.id,
                    "text": "Этот номер телефона уже зарегистрирован в нашей базе данных. Пожалуйста, используйте другой номер.",
                }
            )
            return
        async with state.proxy() as data:
            data["phone"] = formatted_number
        current_time = datetime.now().strftime("%d.%m.%y %H:%M")
        log = {"message": "Пользователь зарегистрирован", "date": current_time}
        data_update = {"name": data["name"], "phone": data["phone"], "register": True, "logs": [log]}
        state_data = await state.get_state()
        if state_data is not None:
            await state.finish()
    except:
        traceback.print_exc()
        await send_int_tg.priority_queue.put(
            {"content_type": "text", "chat_id": m.from_user.id, "text": "Введите корректный номер телефона, для связи"}
        )
        return

    if data["who"] == "performer":

        await user_db.update_info_user(m.from_user.id, {"register": True})
        await performer_db.update_info_user(m.from_user.id, data_update)
        performer = performer_db.find_performer(m.from_user.id)
        await send_int_tg.priority_queue.put(
            {
                "content_type": "text",
                "chat_id": m.from_user.id,
                "text": f"Привет {performer['name']}\n" f"Меню исполнителя",
                "reply_markup": performer_kb.performer_main(url_performer),
            }
        )

    elif data["who"] == "custumer":

        await user_db.update_info_user(m.from_user.id, {"register": True})
        await custumer_db.update_info_user(m.from_user.id, data_update)
        custumer = await custumer_db.find_custumer(m.from_user.id)
        await send_int_tg.priority_queue.put(
            {
                "content_type": "text",
                "chat_id": m.from_user.id,
                "text": f"Привет {custumer['name']}\n" f"Меню заказчика",
                "reply_markup": custumer_kb.custumer_main(url_custumer),
            }
        )


async def process_start_command_callback(c: types.CallbackQuery):
    print("TUT")
    info_server = await server_db.get_tariff()
    url_performer = info_server["performer_link"]
    url_custumer = info_server["customer_link"]
    user = await user_db.find_user(c.from_user.id)

    if user["performer"]:
        performer = await performer_db.find_performer(c.from_user.id)
        await send_int_tg.priority_queue.put(
            {
                "content_type": "text",
                "chat_id": c.from_user.id,
                "text": f"Привет {performer['name']}\n" f"Меню исполнителя",
                "reply_markup": performer_kb.performer_main(url_performer),
            }
        )
    elif user["custumer"]:
        customer = await custumer_db.find_custumer(c.from_user.id)
        await send_int_tg.priority_queue.put(
            {
                "content_type": "text",
                "chat_id": c.from_user.id,
                "text": f"Привет {customer['name']}\n" f"Меню заказчика",
                "reply_markup": custumer_kb.custumer_main(url_custumer),
            }
        )


def register_handler_start(dp: Dispatcher):
    dp.register_message_handler(first_start, commands=["start"], state="*")
    dp.register_callback_query_handler(process_first_start, lambda c: c.data.startswith("firsstart_"))
    dp.register_message_handler(process_name, state=Regiser_user.Name)
    dp.register_message_handler(process_phone, state=Regiser_user.Phone)
    dp.register_callback_query_handler(process_start_command_callback, lambda c: c.data == "start_command")
