from packages.bot.create_bot import InlineKeyboardButton, InlineKeyboardMarkup
from packages.bot.database import server_db


def what_is_work():

    kb_1 = InlineKeyboardButton("Заказ Спецтехники", callback_data="work:place")
    kb_2 = InlineKeyboardButton("Перевозка груза", callback_data="work:a_b")
    kb_3 = InlineKeyboardButton("Перевозка пассажиров", callback_data="work:people")
    kb_4 = InlineKeyboardButton("Назад", callback_data="start_command")
    re_kb = InlineKeyboardMarkup()
    re_kb.add(kb_1)
    re_kb.add(kb_2)
    re_kb.add(kb_3)
    re_kb.add(kb_4)

    return re_kb


def create_order_category(result, call):

    keyboard = InlineKeyboardMarkup(row_width=1)
    for i in result:
        if i[f"work_{call}"]:
            button_text = i["category_name"]
            callback_data = i["_id"]
            keyboard.add(InlineKeyboardButton(text=button_text, callback_data=f"ctype:{callback_data}"))
    keyboard.insert(InlineKeyboardButton(text="Назад", callback_data="customer_order"))

    return keyboard


def create_order_type(result, data):
    keyboard = InlineKeyboardMarkup(row_width=1)
    for i in result:
        button_text = i["type_name"]
        callback_data = i["_id"]
        keyboard.add(InlineKeyboardButton(text=button_text, callback_data=f"cpodtype:{callback_data}"))
    keyboard.insert(InlineKeyboardButton(text="Назад", callback_data=f"work:{data}"))

    return keyboard


def create_order_podtype(result, category_id):
    keyboard = InlineKeyboardMarkup(row_width=1)
    for i in result:
        button_text = i["pod_type_name"]
        callback_data = i["_id"]
        keyboard.insert(InlineKeyboardButton(text=button_text, callback_data=f"needcar:{callback_data}"))
    keyboard.add(InlineKeyboardButton(text="Назад", callback_data=f"ctype:{category_id}"))

    return keyboard


def create_order_amount_tech(category_id):
    keyboard = InlineKeyboardMarkup(row_width=4)
    for i in range(1, 10):
        button_text = i
        keyboard.insert(InlineKeyboardButton(text=str(button_text), callback_data=f"cregion:{i}"))
    keyboard.add(InlineKeyboardButton(text="Назад", callback_data=f"ctype:{category_id}"))

    return keyboard


# тут надо добавить формаирование регионов по принцыпу первые 45 штук, потом следущие 45 штук


def create_order_region(result, call, page=1):
    ITEMS_PER_PAGE = 40
    keyboard = InlineKeyboardMarkup(row_width=8)
    start_index = (page - 1) * ITEMS_PER_PAGE
    end_index = start_index + ITEMS_PER_PAGE

    # Получение списка кнопок для текущей страницы
    for i in result[start_index:end_index]:
        button_text = i["region_number"]
        callback_data = i["_id"]
        keyboard.insert(InlineKeyboardButton(text=button_text, callback_data=f"cpodregion:{callback_data}"))

    # Добавление кнопок для навигации по страницам
    if page > 1:
        keyboard.add(InlineKeyboardButton(text="⬅️ Предыдущая", callback_data=f"cpodpage:{page-1}:{call}"))
    if end_index < len(result):
        keyboard.add(InlineKeyboardButton(text="Следующая ➡️", callback_data=f"cpodpage:{page+1}:{call}"))

    keyboard.add(InlineKeyboardButton(text="Назад", callback_data=f"cpodtype:{call}"))

    return keyboard


# тут надо сделать генерацию по принцыпу не более 16 штук за раз
def create_order_podregion(result, call, page=1):
    ITEMS_PER_PAGE = 12
    keyboard = InlineKeyboardMarkup(row_width=2)

    start_index = (page - 1) * ITEMS_PER_PAGE
    end_index = start_index + ITEMS_PER_PAGE

    # Получение списка кнопок для текущей страницы
    for k, i in enumerate(result[start_index:end_index]):
        button_text = i
        callback_data = f"{call}:{k + start_index}"  # учитывайте стартовый индекс!
        keyboard.insert(InlineKeyboardButton(text=button_text, callback_data=f"goorder:{callback_data}"))

    # Добавление кнопок для навигации по страницам
    if page > 1:
        keyboard.add(InlineKeyboardButton(text="⬅️ Предыдущая", callback_data=f"cpodprepage:{page - 1}:{call}"))
    if end_index < len(result):
        keyboard.add(InlineKeyboardButton(text="Следующая ➡️", callback_data=f"cpodprepage:{page + 1}:{call}"))

    keyboard.add(InlineKeyboardButton(text="Назад", callback_data=f"cregion:{call}"))

    return keyboard
