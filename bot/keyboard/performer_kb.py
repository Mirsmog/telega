from packages.bot.create_bot import InlineKeyboardMarkup, InlineKeyboardButton, bot
from packages.bot.database import performer_db
from packages.bot.middlewares import tinkof_pay


def performer_main(url):
    kb_1 = InlineKeyboardButton("Мои заявки", callback_data="performer_order")
    kb_2 = InlineKeyboardButton("Моя техника", callback_data="performer_tech")
    kb_3 = InlineKeyboardButton("Регион(ы) получения заявок", callback_data="performer_region")
    kb_4 = InlineKeyboardButton("Мой профиль", callback_data="performer_profile")
    kb_5 = InlineKeyboardButton("Мой баланс", callback_data="performer_balance")
    kb_6 = InlineKeyboardButton("Тарифы", callback_data="performer_tariff")
    kb_7 = InlineKeyboardButton("Видео инструкция", url=url)
    kb_8 = InlineKeyboardButton("Обратная связь", callback_data="performer_feedback")
    kb_9 = InlineKeyboardButton("Поделиться ссылкой", callback_data="performer_link")
    re_kb = InlineKeyboardMarkup()
    re_kb.add(kb_1, kb_2)
    re_kb.add(kb_3)
    re_kb.add(kb_4, kb_5)
    re_kb.add(kb_6, kb_7)

    re_kb.add(kb_8)
    re_kb.add(kb_9)
    return re_kb


def per_tech(user_info):
    re_kb = InlineKeyboardMarkup(row_width=1)
    for i in user_info:
        car_type = user_info[i]["data"][2]
        car_name = user_info[i]["data"][0]
        car_number = user_info[i]["data"][1]
        if user_info[i]["status"] == "search":
            button = InlineKeyboardButton(
                f"🟢 {car_type}: {car_name} - {car_number}", callback_data=f'percarteg:{i}:{user_info[i]["status"]}'
            )
            re_kb.insert(button)
        elif user_info[i]["status"] == "stop":
            button = InlineKeyboardButton(
                f"🔴 {car_type}: {car_name} - {car_number}", callback_data=f'percarteg:{i}:{user_info[i]["status"]}'
            )
            re_kb.insert(button)
        elif user_info[i]["status"] == "work" or user_info[i]["status"] == "in_work":
            button = InlineKeyboardButton(
                f"🟡 {car_type}: {car_name} - {car_number}", callback_data=f'percarteg:{i}:{user_info[i]["status"]}'
            )
            re_kb.insert(button)

    kb_2 = InlineKeyboardButton("Добавить единицу техники", callback_data="registernewcar")
    kb_1 = InlineKeyboardButton("Назад", callback_data="start_command")
    re_kb.add(kb_2)
    re_kb.add(kb_1)
    return re_kb


def info_for_car():
    return InlineKeyboardMarkup().add(InlineKeyboardButton("Назад", callback_data="performer_tech"))


def process_del(car):
    kb_1 = InlineKeyboardButton("Подтверждаю удаление", callback_data=f"deletecar:{car}")
    kb_2 = InlineKeyboardButton("Назад", callback_data="performer_tech")
    re_kb = InlineKeyboardMarkup()
    re_kb.add(kb_1)
    re_kb.add(kb_2)
    return re_kb


def add_car(result):
    keyboard = InlineKeyboardMarkup(row_width=1)
    for i in result:
        button_text = i["category_name"]
        callback_data = i["_id"]
        keyboard.add(InlineKeyboardButton(text=button_text, callback_data=f"cardscate:{callback_data}"))
    keyboard.insert(InlineKeyboardButton(text="Назад", callback_data="performer_tech"))

    return keyboard


def add_types_car(result, call):
    keyboard = InlineKeyboardMarkup(row_width=1)
    for i in result:
        button_text = i["type_name"]
        callback_data = i["_id"]
        keyboard.add(InlineKeyboardButton(text=button_text, callback_data=f"cardstype:{callback_data}"))
    keyboard.insert(InlineKeyboardButton(text="Назад", callback_data=f"performer_tech"))

    return keyboard


def add_podtypes_car(result, call):
    keyboard = InlineKeyboardMarkup(row_width=1)
    for i in result:
        button_text = i["pod_type_name"]
        callback_data = i["_id"]
        keyboard.add(InlineKeyboardButton(text=button_text, callback_data=f"cardspodtype:{callback_data}"))
    keyboard.insert(InlineKeyboardButton(text="Назад", callback_data=f"performer_tech"))

    return keyboard


def amount_car():
    keyboard = InlineKeyboardMarkup(row_width=4)
    for i in range(1, 10):
        button_text = i
        keyboard.insert(InlineKeyboardButton(text=str(button_text), callback_data=f"amountcar:{i}"))
    keyboard.add(InlineKeyboardButton(text="Назад", callback_data=f"performer_tech"))

    return keyboard


def about_car(car, status):
    kb_1 = InlineKeyboardButton("Приостановить поиск заявок", callback_data=f"carproces:{car}:stop")
    kb_4 = InlineKeyboardButton("Продолжить поиск заявок", callback_data=f"carproces:{car}:search")
    kb_2 = InlineKeyboardButton("Удалить единицу техники", callback_data=f"carproces:{car}:delete")
    kb_3 = InlineKeyboardButton("Назад", callback_data="performer_tech")
    re_kb = InlineKeyboardMarkup()
    if status == "search":
        re_kb.add(kb_1)
    elif status == "stop":
        re_kb.add(kb_4)
    re_kb.add(kb_2)
    re_kb.add(kb_3)
    return re_kb


def region_editor():
    kb_1 = InlineKeyboardButton("Удалить регион", callback_data="deletereg")
    kb_2 = InlineKeyboardButton("Редактировать/добавить территории", callback_data="performer_editregions")
    kb_3 = InlineKeyboardButton("Назад", callback_data="start_command")
    re_kb = InlineKeyboardMarkup()
    re_kb.add(kb_1)
    re_kb.add(kb_2)
    re_kb.add(kb_3)
    return re_kb


def delete_region(user_info, page=1, max_buttons_in_row=8, regions_per_page=48):
    # Вычисляем индексы для пагинации
    start_index = (page - 1) * regions_per_page
    end_index = start_index + regions_per_page

    # Фильтруем регионы пользователя, чтобы оставить только те, где есть хотя бы один True
    user_regions = {k: v for k, v in user_info.items() if "subreg" in v and any(v["subreg"].values())}

    # Получаем ключи отфильтрованных регионов и применяем пагинацию
    region_keys = list(user_regions.keys())[start_index:end_index]

    # Создаем клавиатуру
    re_kb = InlineKeyboardMarkup(row_width=max_buttons_in_row)

    # Добавляем кнопки для каждого региона
    for region_code in region_keys:
        button = InlineKeyboardButton(region_code, callback_data=f"delreg_{region_code}")
        re_kb.insert(button)

    # Добавляем кнопки для переключения страниц
    nav_buttons = []
    if page > 1:
        nav_buttons.append(InlineKeyboardButton("⬅️ Предыдущая", callback_data=f"page_{page - 1}"))

    if end_index < len(user_regions):
        nav_buttons.append(InlineKeyboardButton("Следующая ➡️", callback_data=f"page_{page + 1}"))
    kb_1 = InlineKeyboardButton("Назад", callback_data="performer_region")
    re_kb.add(kb_1)
    re_kb.row(*nav_buttons)

    return re_kb


def region_pre(regions, page=1, max_buttons_in_row=8, regions_per_page=46):
    start_index = (int(page) - 1) * regions_per_page
    end_index = start_index + regions_per_page

    region_keys = list(regions.keys())[start_index:end_index]  # Обрезаем список до нужного диапазона

    re_kb = InlineKeyboardMarkup(row_width=max_buttons_in_row)

    for region_code in region_keys:  # Теперь итерация проходит только по нужной части списка
        button = InlineKeyboardButton(region_code, callback_data=f"prereg_{region_code}")
        re_kb.insert(button)

    # Добавляем кнопки для переключения страниц
    nav_buttons = []
    if page > 1:
        nav_buttons.append(InlineKeyboardButton("⬅️ Предыдущая", callback_data=f"page_{int(page) - 1}"))

    if end_index < len(regions.keys()):
        nav_buttons.append(InlineKeyboardButton("Следующая ➡️", callback_data=f"page_{int(page) + 1}"))

    re_kb.row(*nav_buttons)
    kb_back = InlineKeyboardButton("Назад", callback_data="performer_region")
    re_kb.add(kb_back)

    return re_kb


async def subtype_pre(user_id, region_code_data=None, regi=None, page=1, max_buttons_in_row=2, subtypes_per_page=12):
    start_index = (int(page) - 1) * subtypes_per_page
    end_index = start_index + subtypes_per_page

    try:
        if region_code_data is None:
            region_code = regi
        elif region_code_data.isdigit():
            region_code = region_code_data
        else:
            region_code = region_code_data.split("_")[1]
    except:
        region_code = regi

    # Здесь мы получаем данные о регионе из MongoDB
    region_data = await performer_db.find_region(user_id)
    if region_data is None:
        return None  # или обработайте это как ошибку

    subtypes = region_data["all_regions"][region_code]["subreg"]

    subtype_keys = list(subtypes.keys())[start_index:end_index]

    re_kb = InlineKeyboardMarkup(row_width=max_buttons_in_row)

    for index, subty_name in enumerate(subtype_keys):
        # Проверяем состояние кнопки в MongoDB
        button_state = region_data["all_regions"][region_code]["subreg"][subty_name]
        if button_state:
            subty_name = "✅" + subty_name

        button = InlineKeyboardButton(subty_name, callback_data=f"subpreg_{index}:{region_code_data}:{page}")
        re_kb.insert(button)
    # print(re_kb)

    nav_buttons = []
    if int(page) > 1:
        nav_buttons.append(
            InlineKeyboardButton("⬅️ Предыдущая", callback_data=f"pafe:{int(page) - 1}@{region_code_data}")
        )
    if end_index < len(subtypes):
        nav_buttons.append(
            InlineKeyboardButton("Следующая ➡️", callback_data=f"pafe:{int(page) + 1}@{region_code_data}")
        )
    kb_1 = InlineKeyboardButton("Все районы", callback_data=f"subpreg_1:{region_code_data}:{page}:all")
    kb_2 = InlineKeyboardButton("Завершить выбор", callback_data="performer_region")
    re_kb.row(*nav_buttons)
    re_kb.add(kb_1, kb_2)
    kb_back = InlineKeyboardButton("Назад", callback_data="performer_region")
    re_kb.add(kb_back)

    return re_kb


async def on_button_click(user_id: int, region_code: str, message_id: int, subtype_id: str, page):
    # Ищем текущее состояние кнопки в MongoDB
    await performer_db.find_button(user_id, subtype_id, region_code)

    # Обновляем состояние кнопки

    new_keyboard = await subtype_pre(
        user_id, region_code, regi=region_code, page=page
    )  # Предположим, что у вас есть функция subtype_pre, которая создает новую клавиатуру

    # Обновляем сообщение с новой клавиатурой
    await bot.edit_message_reply_markup(chat_id=user_id, message_id=message_id, reply_markup=new_keyboard)


def menu_perfomer_profile():
    kb = InlineKeyboardButton("Назад", callback_data="start_command")
    re_kb = InlineKeyboardMarkup()
    re_kb.add(kb)
    return re_kb


def menu_perfomer_balance():
    kb_1 = InlineKeyboardButton("Пополнить баланс", callback_data="payz_now")
    kb = InlineKeyboardButton("Назад", callback_data="start_command")
    re_kb = InlineKeyboardMarkup()
    re_kb.add(kb_1)
    re_kb.add(kb)
    return re_kb


def pay(amount):
    kb_1 = InlineKeyboardButton(f"Оплатить {amount}, и разместить заявку", url="https://google.com")
    return InlineKeyboardMarkup(kb_1)


def fats_buy(tarif):
    kb_1 = InlineKeyboardButton(f"Пополнить на {tarif} р.", callback_data=f"payz_{tarif}")
    kb_2 = InlineKeyboardButton("Пополнить баланс", callback_data="payz_now")
    kb_3 = InlineKeyboardButton("Главное меню", callback_data="start_command")
    re_kb = InlineKeyboardMarkup()
    re_kb.add(kb_1)
    re_kb.add(kb_2)
    re_kb.add(kb_3)
    return re_kb


async def pay_now(amount=None, who=None, user_id=None):

    kb_1 = InlineKeyboardButton("Пополнить на 500 рублей", callback_data="payz_500")
    kb_2 = InlineKeyboardButton("Пополнить на 1000 рублей", callback_data="payz_1000")
    kb_3 = InlineKeyboardButton("Пополнить на 2000 рублей", callback_data="payz_2000")
    kb_4 = InlineKeyboardButton("Пополнить на 5000 рублей", callback_data="payz_5000")
    kb_5 = InlineKeyboardButton("Пополнить на 10000 рублей", callback_data="payz_10000")
    kb_6 = InlineKeyboardButton("Тарифы", callback_data="tariff")
    kb_7 = InlineKeyboardButton("Назад", callback_data="customer_balance")
    kb_8 = InlineKeyboardButton("Назад", callback_data="performer_balance")
    re_kb = InlineKeyboardMarkup()
    if amount == None:
        re_kb.add(kb_1)
        re_kb.add(kb_2)
        re_kb.add(kb_3)
        re_kb.add(kb_4)
        re_kb.add(kb_5)
        re_kb.add(kb_6)
    else:
        # TODO: kогику вынести в отдельный файл лучше и при разных запросах высрать разную кнопку
        response = await tinkof_pay.get_url(amount, user_id)
        if response is not None:
            print(response)
            # тут должен идти конект к tinkoff api
            kb_11 = InlineKeyboardButton(f"Пополнить на {str(amount)}", url=response)
        else:
            kb_11 = InlineKeyboardButton(
                f"Пополнить на {amount}, еще раз(ссылка не была создана)", callback_data=f"payz_{str(amount)}"
            )
        re_kb.add(kb_11)

    if who == 1:
        re_kb.add(kb_8)
    else:
        re_kb.add(kb_7)
    print(re_kb)
    return re_kb


def take_order(obj):
    kb_1 = InlineKeyboardButton("Выкупить заявку", callback_data=f"takeorder:buy:{obj}")
    kb_2 = InlineKeyboardButton("Предложить стоимость", callback_data=f"takeorder:pri:{obj}")
    kb_3 = InlineKeyboardButton("Предложить другую дату и стоимость", callback_data=f"takeorder:dat:{obj}")
    re_kb = InlineKeyboardMarkup()
    re_kb.add(kb_1)
    re_kb.add(kb_2)
    re_kb.add(kb_3)
    return re_kb


def buy_order(cars, user_info, obj):
    re_kb = InlineKeyboardMarkup(row_width=1)
    for i in cars:

        car_type = user_info["cars"][i]["data"][2]
        car_name = user_info["cars"][i]["data"][0]
        car_number = user_info["cars"][i]["data"][1]
        if user_info["cars"][i]["status"] == "search":

            button = InlineKeyboardButton(
                f"🟢 {car_type}: {car_name} - {car_number}", callback_data=f"ordbyu:{i}:{obj}"
            )

            re_kb.insert(button)

    kb_1 = InlineKeyboardButton("Назад", callback_data="start_command")
    re_kb.add(kb_1)

    return re_kb


def order_menu(call):
    obj = call.split(":")[1]
    kb_1 = InlineKeyboardButton("Отменить заявку", callback_data=f"ordper_cancel_{obj}")
    # не было в ТЗ решил не делать(потому что много лишнего кода
    kb_3 = InlineKeyboardButton("Назад", callback_data="performer_order")
    keyboard = InlineKeyboardMarkup()
    keyboard.add(kb_1)
    keyboard.add(kb_3)
    return keyboard


def all_bid(orders, page=1, max_buttons_in_row=2, orders_per_page=12):
    excluded_statuses = ["finish", "im_cancel", "canceled"]
    filtered_orders = [order for order in orders if order["status"] not in excluded_statuses]

    # Ваши параметры для постраничного вывода
    start_index = (page - 1) * orders_per_page
    end_index = start_index + orders_per_page
    print(filtered_orders)
    # Фильтрация списка заказов для текущей страницы
    page_orders = filtered_orders[start_index:end_index]

    keyboard = InlineKeyboardMarkup(row_width=max_buttons_in_row)

    for order in page_orders:
        status_emoji = {
            "wait": "🟠",
            "canceled": "⛔️",
            "search": "🌀",
            "create": "⏳",
            "im_cancel": "❌",
            "in_work": "✅",
            "work": "✅",
        }

        button_text = f"Заявка #{order['order_number']} {status_emoji.get(order['status'], '')}"

        callback_data = f"perforder:{str(order['_id'])}"

        keyboard.insert(InlineKeyboardButton(text=button_text, callback_data=callback_data))

    # Добавление кнопок навигации
    nav_buttons = []
    if page > 1:
        nav_buttons.append(InlineKeyboardButton("⬅️ Предыдущая", callback_data=f"perpage:{page - 1}"))

    if end_index < len(filtered_orders):
        nav_buttons.append(InlineKeyboardButton("Следующая ➡️", callback_data=f"perpage:{page + 1}"))

    keyboard.row(*nav_buttons)
    keyboard.add(InlineKeyboardButton("Назад", callback_data="start_command"))

    return keyboard


def per_tarif():
    kb_1 = InlineKeyboardButton("Мой баланс", callback_data="performer_balance")
    kb_2 = InlineKeyboardButton("Пополнить баланс", callback_data="payz_now")
    kb_3 = InlineKeyboardButton("Назад", callback_data="start_command")
    re_kb = InlineKeyboardMarkup()
    re_kb.add(kb_1)
    re_kb.add(kb_2)
    re_kb.add(kb_3)
    return re_kb


def order_menu_work(call, swap):
    obj = call.split(":")[1]
    kb_1 = InlineKeyboardButton("Отменить заявку", callback_data=f"ordper_cancel_{obj}")
    kb_2 = InlineKeyboardButton("Подать жалобу", callback_data=f"ordper_report_{obj}")
    kb_5 = InlineKeyboardButton("Заменить машину", callback_data=f"ordper_swap_{obj}")
    kb_3 = InlineKeyboardButton("Назад", callback_data="performer_order")
    keyboard = InlineKeyboardMarkup()
    keyboard.add(kb_1)
    keyboard.add(kb_2)
    if swap:
        keyboard.add(kb_5)
    keyboard.add(kb_3)
    return keyboard


def ok_car():
    kb_1 = InlineKeyboardButton("Понятно", callback_data="cardontok")
    return InlineKeyboardMarkup().add(kb_1)


def change_car(free_car, cars_performer, obj):
    keyboar = InlineKeyboardMarkup(row_width=1)
    for car in free_car:
        data_car = cars_performer[car]["data"]
        text = f"🟢{data_car[2]}: {data_car[0]} - {data_car[1]}"
        call_data = f"chca:{car}:{obj}"
        keyboar.insert(InlineKeyboardButton(text=text, callback_data=call_data))
    kb_3 = InlineKeyboardButton("Отмена", callback_data=f"perforder:{obj}")
    keyboar.add(kb_3)
    return keyboar


def get_car(cars):
    print(cars)
    keyboard = InlineKeyboardMarkup(row_width=1)
    for car in cars:
        print(list(car.keys()))
        car_info = car[list(car.keys())[0]]["data"]
        text = f"{car_info[0]} - {car_info[1]}"
        call_data = f"khg:{list(car.keys())[0]}"
        keyboard.insert(InlineKeyboardButton(text=text, callback_data=call_data))
    return keyboard
